import { chromium, Browser, Page } from 'playwright';
import { storage } from './storage';
import { SeoSetting } from '../shared/schema';

export interface CrawlResult {
  url: string;
  crawlStatus: 'success' | 'error' | 'timeout';
  httpStatus?: number;
  responseTime: number;
  headHtml?: string;
  metaSnapshot?: any;
  screenshotUrl?: string;
  errorDetails?: string;
  performanceMetrics?: any;
  seoScore: number;
  recommendations: string[];
  diffSummary?: any;
}

export interface SEOAnalysis {
  title: { present: boolean; length: number; optimal: boolean };
  metaDescription: { present: boolean; length: number; optimal: boolean };
  headings: { h1Count: number; structure: boolean };
  images: { total: number; missingAlt: number };
  links: { internal: number; external: number; broken: number };
  performance: { loadTime: number; resourceCount: number };
  accessibility: { score: number; issues: string[] };
  mobileOptimized: boolean;
}

export class AdvancedCrawler {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async crawlUrl(url: string, seoSettingId?: string): Promise<CrawlResult> {
    const startTime = Date.now();
    
    try {
      await this.initialize();
      
      if (!this.browser) {
        throw new Error('Failed to initialize browser');
      }

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; MEMOPYK-SEO-Crawler/1.0)',
        viewport: { width: 1200, height: 800 }
      });

      const page = await context.newPage();
      
      // Track performance metrics
      const performanceMetrics = {
        loadTime: 0,
        resourceCount: 0,
        networkErrors: 0,
        jsErrors: [],
      };

      // Monitor network requests
      page.on('response', (response) => {
        performanceMetrics.resourceCount++;
        if (!response.ok()) {
          performanceMetrics.networkErrors++;
        }
      });

      // Monitor JavaScript errors
      page.on('pageerror', (error) => {
        performanceMetrics.jsErrors.push(error.message);
      });

      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const responseTime = Date.now() - startTime;
      performanceMetrics.loadTime = responseTime;

      if (!response) {
        throw new Error('No response received');
      }

      // Extract head HTML
      const headHtml = await page.locator('head').innerHTML();
      
      // Extract meta tags and SEO elements
      const metaSnapshot = await this.extractMetaTags(page);
      
      // Perform SEO analysis
      const seoAnalysis = await this.analyzeSEO(page);
      
      // Calculate SEO score
      const seoScore = this.calculateSEOScore(seoAnalysis);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(seoAnalysis);
      
      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
      });
      
      // Store screenshot (in production, upload to cloud storage)
      const screenshotUrl = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

      await context.close();

      const result: CrawlResult = {
        url,
        crawlStatus: 'success',
        httpStatus: response.status(),
        responseTime,
        headHtml,
        metaSnapshot,
        screenshotUrl,
        performanceMetrics,
        seoScore,
        recommendations,
      };

      // Store in database if seoSettingId provided
      if (seoSettingId) {
        await this.storeCrawlReport(seoSettingId, result);
      }

      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const result: CrawlResult = {
        url,
        crawlStatus: error.name === 'TimeoutError' ? 'timeout' : 'error',
        responseTime,
        errorDetails: error.message,
        seoScore: 0,
        recommendations: ['Fix crawl errors before analyzing SEO'],
      };

      if (seoSettingId) {
        await this.storeCrawlReport(seoSettingId, result);
      }

      return result;
    }
  }

  private async extractMetaTags(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const meta: any = {};
      
      // Title
      const title = document.querySelector('title');
      meta.title = title ? title.textContent : null;
      
      // Meta description
      const description = document.querySelector('meta[name="description"]');
      meta.description = description ? description.getAttribute('content') : null;
      
      // Open Graph tags
      meta.og = {};
      const ogTags = document.querySelectorAll('meta[property^="og:"]');
      ogTags.forEach(tag => {
        const property = tag.getAttribute('property');
        const content = tag.getAttribute('content');
        if (property && content) {
          meta.og[property.replace('og:', '')] = content;
        }
      });
      
      // Twitter Card tags
      meta.twitter = {};
      const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
      twitterTags.forEach(tag => {
        const name = tag.getAttribute('name');
        const content = tag.getAttribute('content');
        if (name && content) {
          meta.twitter[name.replace('twitter:', '')] = content;
        }
      });
      
      // Canonical URL
      const canonical = document.querySelector('link[rel="canonical"]');
      meta.canonical = canonical ? canonical.getAttribute('href') : null;
      
      // Robots meta
      const robots = document.querySelector('meta[name="robots"]');
      meta.robots = robots ? robots.getAttribute('content') : null;
      
      // Schema.org JSON-LD
      meta.jsonLd = [];
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '');
          meta.jsonLd.push(data);
        } catch (e) {
          // Invalid JSON-LD
        }
      });
      
      return meta;
    });
  }

  private async analyzeSEO(page: Page): Promise<SEOAnalysis> {
    return await page.evaluate(() => {
      const analysis: SEOAnalysis = {
        title: { present: false, length: 0, optimal: false },
        metaDescription: { present: false, length: 0, optimal: false },
        headings: { h1Count: 0, structure: false },
        images: { total: 0, missingAlt: 0 },
        links: { internal: 0, external: 0, broken: 0 },
        performance: { loadTime: 0, resourceCount: 0 },
        accessibility: { score: 0, issues: [] },
        mobileOptimized: false,
      };

      // Title analysis
      const title = document.querySelector('title');
      if (title && title.textContent) {
        analysis.title.present = true;
        analysis.title.length = title.textContent.length;
        analysis.title.optimal = analysis.title.length >= 30 && analysis.title.length <= 60;
      }

      // Meta description analysis
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        const content = metaDesc.getAttribute('content');
        if (content) {
          analysis.metaDescription.present = true;
          analysis.metaDescription.length = content.length;
          analysis.metaDescription.optimal = analysis.metaDescription.length >= 120 && analysis.metaDescription.length <= 160;
        }
      }

      // Heading structure analysis
      const h1Tags = document.querySelectorAll('h1');
      analysis.headings.h1Count = h1Tags.length;
      analysis.headings.structure = analysis.headings.h1Count === 1;

      // Image analysis
      const images = document.querySelectorAll('img');
      analysis.images.total = images.length;
      images.forEach(img => {
        if (!img.getAttribute('alt')) {
          analysis.images.missingAlt++;
        }
      });

      // Link analysis
      const links = document.querySelectorAll('a[href]');
      const currentDomain = window.location.hostname;
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          if (href.startsWith('http')) {
            if (href.includes(currentDomain)) {
              analysis.links.internal++;
            } else {
              analysis.links.external++;
            }
          } else if (href.startsWith('/') || href.startsWith('#')) {
            analysis.links.internal++;
          }
        }
      });

      // Mobile optimization check
      const viewport = document.querySelector('meta[name="viewport"]');
      analysis.mobileOptimized = !!viewport;

      // Basic accessibility check
      const missingAltImages = analysis.images.missingAlt;
      const missingH1 = analysis.headings.h1Count === 0;
      const accessibilityIssues: string[] = [];
      
      if (missingAltImages > 0) {
        accessibilityIssues.push(`${missingAltImages} images missing alt text`);
      }
      if (missingH1) {
        accessibilityIssues.push('Missing H1 heading');
      }
      if (!analysis.mobileOptimized) {
        accessibilityIssues.push('Missing viewport meta tag');
      }

      analysis.accessibility.issues = accessibilityIssues;
      analysis.accessibility.score = Math.max(0, 100 - (accessibilityIssues.length * 20));

      return analysis;
    });
  }

  private calculateSEOScore(analysis: SEOAnalysis): number {
    let score = 0;
    let maxScore = 0;

    // Title (20 points)
    maxScore += 20;
    if (analysis.title.present) {
      if (analysis.title.optimal) {
        score += 20;
      } else {
        score += 10;
      }
    }

    // Meta description (20 points)
    maxScore += 20;
    if (analysis.metaDescription.present) {
      if (analysis.metaDescription.optimal) {
        score += 20;
      } else {
        score += 10;
      }
    }

    // Heading structure (15 points)
    maxScore += 15;
    if (analysis.headings.structure) {
      score += 15;
    } else if (analysis.headings.h1Count > 0) {
      score += 8;
    }

    // Images (15 points)
    maxScore += 15;
    if (analysis.images.total > 0) {
      const altRatio = (analysis.images.total - analysis.images.missingAlt) / analysis.images.total;
      score += Math.round(15 * altRatio);
    }

    // Mobile optimization (15 points)
    maxScore += 15;
    if (analysis.mobileOptimized) {
      score += 15;
    }

    // Accessibility (15 points)
    maxScore += 15;
    score += Math.round((analysis.accessibility.score / 100) * 15);

    return Math.round((score / maxScore) * 100);
  }

  private generateRecommendations(analysis: SEOAnalysis): string[] {
    const recommendations: string[] = [];

    if (!analysis.title.present) {
      recommendations.push('Add a title tag to your page');
    } else if (!analysis.title.optimal) {
      if (analysis.title.length < 30) {
        recommendations.push('Title is too short - aim for 30-60 characters');
      } else {
        recommendations.push('Title is too long - aim for 30-60 characters');
      }
    }

    if (!analysis.metaDescription.present) {
      recommendations.push('Add a meta description to improve search snippets');
    } else if (!analysis.metaDescription.optimal) {
      if (analysis.metaDescription.length < 120) {
        recommendations.push('Meta description is too short - aim for 120-160 characters');
      } else {
        recommendations.push('Meta description is too long - aim for 120-160 characters');
      }
    }

    if (analysis.headings.h1Count === 0) {
      recommendations.push('Add an H1 heading to your page');
    } else if (analysis.headings.h1Count > 1) {
      recommendations.push('Use only one H1 heading per page');
    }

    if (analysis.images.missingAlt > 0) {
      recommendations.push(`Add alt text to ${analysis.images.missingAlt} images for accessibility`);
    }

    if (!analysis.mobileOptimized) {
      recommendations.push('Add viewport meta tag for mobile optimization');
    }

    if (analysis.accessibility.issues.length > 0) {
      recommendations.push(...analysis.accessibility.issues.map(issue => `Accessibility: ${issue}`));
    }

    if (recommendations.length === 0) {
      recommendations.push('Great! Your page follows SEO best practices');
    }

    return recommendations;
  }

  private async storeCrawlReport(seoSettingId: string, result: CrawlResult): Promise<void> {
    try {
      await storage.createAdvancedCrawlReport({
        seoSettingId,
        url: result.url,
        crawlStatus: result.crawlStatus,
        httpStatus: result.httpStatus,
        responseTime: result.responseTime,
        headHtml: result.headHtml,
        metaSnapshot: result.metaSnapshot,
        screenshotUrl: result.screenshotUrl,
        errorDetails: result.errorDetails,
        performanceMetrics: result.performanceMetrics,
        seoScore: result.seoScore,
        recommendations: result.recommendations,
        previousReportId: null,
        diffSummary: result.diffSummary,
      });

      console.log(`Stored advanced crawl report for ${result.url}`);
    } catch (error) {
      console.error('Failed to store crawl report:', error);
    }
  }

  async generateDiff(currentResult: CrawlResult, previousReportId: string): Promise<any> {
    try {
      const reports = await storage.getAdvancedCrawlReports();
      const previousReport = reports.find(r => r.id === previousReportId);
      
      if (!previousReport || !previousReport.metaSnapshot) {
        return { message: 'No previous report to compare' };
      }

      const diff: any = {
        title: this.compareMeta(previousReport.metaSnapshot.title, currentResult.metaSnapshot?.title),
        description: this.compareMeta(previousReport.metaSnapshot.description, currentResult.metaSnapshot?.description),
        seoScoreChange: (currentResult.seoScore || 0) - (previousReport.seoScore || 0),
        changes: [],
      };

      // Detect significant changes
      if (Math.abs(diff.seoScoreChange) >= 5) {
        diff.changes.push(`SEO score ${diff.seoScoreChange > 0 ? 'improved' : 'decreased'} by ${Math.abs(diff.seoScoreChange)} points`);
      }

      if (diff.title.changed) {
        diff.changes.push('Page title changed');
      }

      if (diff.description.changed) {
        diff.changes.push('Meta description changed');
      }

      return diff;
    } catch (error) {
      console.error('Failed to generate diff:', error);
      return { error: 'Failed to generate comparison' };
    }
  }

  private compareMeta(oldValue: string | null, newValue: string | null): any {
    return {
      changed: oldValue !== newValue,
      old: oldValue,
      new: newValue,
    };
  }
}

export const advancedCrawler = new AdvancedCrawler();

// Cleanup on process exit
process.on('exit', () => {
  advancedCrawler.shutdown();
});

process.on('SIGINT', async () => {
  await advancedCrawler.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await advancedCrawler.shutdown();
  process.exit(0);
});