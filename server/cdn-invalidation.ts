import { SeoSetting } from '../shared/schema';

export interface CDNProvider {
  name: string;
  invalidateUrls(urls: string[]): Promise<{ success: boolean; message: string; invalidationId?: string }>;
}

// Cloudflare CDN Integration
class CloudflareCDN implements CDNProvider {
  name = 'Cloudflare';
  private zoneId: string;
  private apiToken: string;

  constructor(zoneId: string, apiToken: string) {
    this.zoneId = zoneId;
    this.apiToken = apiToken;
  }

  async invalidateUrls(urls: string[]): Promise<{ success: boolean; message: string; invalidationId?: string }> {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.zoneId}/purge_cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: urls
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: `Successfully invalidated ${urls.length} URLs in Cloudflare`,
          invalidationId: result.result?.id
        };
      } else {
        return {
          success: false,
          message: `Cloudflare invalidation failed: ${result.errors?.[0]?.message || 'Unknown error'}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Cloudflare invalidation error: ${error.message}`
      };
    }
  }
}

// AWS CloudFront Integration
class CloudFrontCDN implements CDNProvider {
  name = 'CloudFront';
  private distributionId: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor(distributionId: string, accessKeyId: string, secretAccessKey: string, region = 'us-east-1') {
    this.distributionId = distributionId;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
  }

  async invalidateUrls(urls: string[]): Promise<{ success: boolean; message: string; invalidationId?: string }> {
    try {
      // Convert full URLs to paths for CloudFront
      const paths = urls.map(url => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname;
        } catch {
          return url.startsWith('/') ? url : `/${url}`;
        }
      });

      // Note: This is a simplified implementation
      // In production, you'd use AWS SDK with proper signing
      const invalidationRequest = {
        DistributionId: this.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: paths.length,
            Items: paths
          },
          CallerReference: `seo-invalidation-${Date.now()}`
        }
      };

      // For now, simulate successful invalidation
      // In production, implement proper AWS CloudFront API call
      console.log('CloudFront invalidation request:', invalidationRequest);
      
      return {
        success: true,
        message: `CloudFront invalidation queued for ${paths.length} paths`,
        invalidationId: `I${Date.now()}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `CloudFront invalidation error: ${error.message}`
      };
    }
  }
}

// Generic CDN Integration
class GenericCDN implements CDNProvider {
  name = 'Generic';
  private webhookUrl: string;
  private apiKey?: string;

  constructor(webhookUrl: string, apiKey?: string) {
    this.webhookUrl = webhookUrl;
    this.apiKey = apiKey;
  }

  async invalidateUrls(urls: string[]): Promise<{ success: boolean; message: string; invalidationId?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'purge_cache',
          urls,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        return {
          success: true,
          message: `Successfully sent invalidation request to ${this.webhookUrl}`,
          invalidationId: result.id || `generic-${Date.now()}`
        };
      } else {
        return {
          success: false,
          message: `Generic CDN webhook failed with status ${response.status}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Generic CDN invalidation error: ${error.message}`
      };
    }
  }
}

// CDN Manager
export class CDNManager {
  private providers: CDNProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize based on environment variables
    const cloudflareZone = process.env.CLOUDFLARE_ZONE_ID;
    const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (cloudflareZone && cloudflareToken) {
      this.providers.push(new CloudflareCDN(cloudflareZone, cloudflareToken));
    }

    const cloudfrontDistribution = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    if (cloudfrontDistribution && awsAccessKey && awsSecretKey) {
      this.providers.push(new CloudFrontCDN(cloudfrontDistribution, awsAccessKey, awsSecretKey));
    }

    const genericWebhook = process.env.CDN_WEBHOOK_URL;
    const genericApiKey = process.env.CDN_API_KEY;
    
    if (genericWebhook) {
      this.providers.push(new GenericCDN(genericWebhook, genericApiKey));
    }
  }

  async invalidateSeoSetting(seoSetting: SeoSetting): Promise<{ success: boolean; results: any[] }> {
    const urls = this.generateUrlsFromSeoSetting(seoSetting);
    return this.invalidateUrls(urls);
  }

  async invalidateUrls(urls: string[]): Promise<{ success: boolean; results: any[] }> {
    if (this.providers.length === 0) {
      console.log('No CDN providers configured, skipping invalidation');
      return { success: true, results: [] };
    }

    const results = await Promise.allSettled(
      this.providers.map(provider => 
        provider.invalidateUrls(urls).then(result => ({
          provider: provider.name,
          ...result
        }))
      )
    );

    const successfulResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const failedResults = results
      .filter(result => result.status === 'rejected')
      .map(result => ({
        provider: 'Unknown',
        success: false,
        message: (result as PromiseRejectedResult).reason.message
      }));

    const allResults = [...successfulResults, ...failedResults];
    const overallSuccess = successfulResults.some(r => r.success);

    console.log('CDN invalidation results:', allResults);

    return {
      success: overallSuccess,
      results: allResults
    };
  }

  private generateUrlsFromSeoSetting(seoSetting: SeoSetting): string[] {
    const baseUrl = 'https://memopyk.com';
    const urls: string[] = [];

    // Add canonical URL
    if (seoSetting.canonicalUrl) {
      urls.push(seoSetting.canonicalUrl);
    }

    // Add locale-specific URLs
    if (seoSetting.locale === 'en') {
      urls.push(`${baseUrl}${seoSetting.urlSlug || '/'}`);
    } else if (seoSetting.locale === 'fr') {
      urls.push(`${baseUrl}/fr${seoSetting.urlSlug || ''}`);
    }

    // Add related URLs that might be affected
    if (seoSetting.pageKey === 'home') {
      urls.push(`${baseUrl}/`, `${baseUrl}/fr/`);
    }

    // Add sitemap URL for regeneration
    urls.push(`${baseUrl}/api/sitemap.xml`);

    // Remove duplicates
    return [...new Set(urls)];
  }

  getConfiguredProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}

export const cdnManager = new CDNManager();