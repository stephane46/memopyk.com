import { storage } from './storage';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapGenerationOptions {
  baseUrl?: string;
  includeImages?: boolean;
  includeVideos?: boolean;
  generateHreflang?: boolean;
}

const DEFAULT_OPTIONS: SitemapGenerationOptions = {
  baseUrl: 'https://memopyk.com',
  includeImages: true,
  includeVideos: true,
  generateHreflang: true
};

export class SitemapGenerator {
  private options: SitemapGenerationOptions;

  constructor(options: SitemapGenerationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async generateSitemap(): Promise<string> {
    const urls: SitemapUrl[] = [];
    
    // Get all SEO settings to determine available pages
    const seoSettings = await storage.getSeoSettings();
    const processedPages = new Set<string>();

    // Process SEO settings to extract unique pages
    for (const setting of seoSettings) {
      const basePage = setting.page.replace('-fr', '');
      if (!processedPages.has(basePage)) {
        processedPages.add(basePage);
        
        // Add English version
        urls.push({
          loc: `${this.options.baseUrl}${this.getPageUrl(basePage, 'en')}`,
          lastmod: new Date(setting.updatedAt).toISOString().split('T')[0],
          changefreq: this.getChangeFreq(basePage),
          priority: this.getPriority(basePage)
        });

        // Add French version if hreflang is enabled
        if (this.options.generateHreflang) {
          urls.push({
            loc: `${this.options.baseUrl}/fr${this.getPageUrl(basePage, 'fr')}`,
            lastmod: new Date(setting.updatedAt).toISOString().split('T')[0],
            changefreq: this.getChangeFreq(basePage),
            priority: this.getPriority(basePage)
          });
        }
      }
    }

    // Add default pages if not already included
    const defaultPages = ['home', 'about', 'contact', 'gallery', 'faq'];
    for (const page of defaultPages) {
      if (!processedPages.has(page)) {
        urls.push({
          loc: `${this.options.baseUrl}${this.getPageUrl(page, 'en')}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: this.getChangeFreq(page),
          priority: this.getPriority(page)
        });

        if (this.options.generateHreflang) {
          urls.push({
            loc: `${this.options.baseUrl}/fr${this.getPageUrl(page, 'fr')}`,
            lastmod: new Date().toISOString().split('T')[0],
            changefreq: this.getChangeFreq(page),
            priority: this.getPriority(page)
          });
        }
      }
    }

    // Add legal pages
    const legalPages = ['legal-notice', 'privacy-policy', 'cookie-policy', 'terms-sale', 'terms-use'];
    for (const page of legalPages) {
      urls.push({
        loc: `${this.options.baseUrl}/${page}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.3
      });

      if (this.options.generateHreflang) {
        urls.push({
          loc: `${this.options.baseUrl}/fr/${page}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: 0.3
        });
      }
    }

    return this.generateXml(urls);
  }

  async generateRobotsTxt(): Promise<string> {
    const baseUrl = this.options.baseUrl || 'https://memopyk.com';
    
    const robots = [
      'User-agent: *',
      'Allow: /',
      '',
      '# Disallow admin areas',
      'Disallow: /admin',
      'Disallow: /api/',
      '',
      '# Allow specific API endpoints for search engines',
      'Allow: /api/sitemap.xml',
      '',
      '# Sitemap location',
      `Sitemap: ${baseUrl}/api/sitemap.xml`,
      '',
      '# Crawl delay for good behavior',
      'Crawl-delay: 1',
      ''
    ].join('\n');

    return robots;
  }

  private getPageUrl(page: string, locale: 'en' | 'fr'): string {
    if (page === 'home') {
      return locale === 'fr' ? '' : '';
    }
    return `/${page}`;
  }

  private getChangeFreq(page: string): SitemapUrl['changefreq'] {
    const frequencies: Record<string, SitemapUrl['changefreq']> = {
      'home': 'daily',
      'gallery': 'weekly',
      'faq': 'weekly',
      'about': 'monthly',
      'contact': 'monthly',
      'services': 'monthly'
    };
    return frequencies[page] || 'monthly';
  }

  private getPriority(page: string): number {
    const priorities: Record<string, number> = {
      'home': 1.0,
      'services': 0.9,
      'gallery': 0.8,
      'about': 0.7,
      'faq': 0.6,
      'contact': 0.8
    };
    return priorities[page] || 0.5;
  }

  private generateXml(urls: SitemapUrl[]): string {
    const urlElements = urls.map(url => {
      let urlXml = `  <url>\n    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      
      if (url.lastmod) {
        urlXml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      
      if (url.changefreq) {
        urlXml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      
      if (url.priority !== undefined) {
        urlXml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }
      
      urlXml += '  </url>';
      return urlXml;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Cache for sitemap generation
let cachedSitemap: { content: string; timestamp: number } | null = null;
let cachedRobots: { content: string; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedSitemap(forceRegenerate = false): Promise<string> {
  const now = Date.now();
  
  if (!forceRegenerate && cachedSitemap && (now - cachedSitemap.timestamp) < CACHE_DURATION) {
    return cachedSitemap.content;
  }

  const generator = new SitemapGenerator();
  const content = await generator.generateSitemap();
  
  cachedSitemap = { content, timestamp: now };
  console.log('[Sitemap] Generated new sitemap with', content.split('<url>').length - 1, 'URLs');
  
  return content;
}

export async function getCachedRobotsTxt(forceRegenerate = false): Promise<string> {
  const now = Date.now();
  
  if (!forceRegenerate && cachedRobots && (now - cachedRobots.timestamp) < CACHE_DURATION) {
    return cachedRobots.content;
  }

  const generator = new SitemapGenerator();
  const content = await generator.generateRobotsTxt();
  
  cachedRobots = { content, timestamp: now };
  console.log('[Robots] Generated new robots.txt');
  
  return content;
}

export function invalidateSitemapCache(): void {
  cachedSitemap = null;
  cachedRobots = null;
  console.log('[Sitemap] Cache invalidated');
}