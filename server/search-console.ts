import { storage } from './storage';

export interface SearchConsoleReport {
  url: string;
  pageKey: string;
  locale: string;
  indexingStatus: 'indexed' | 'not_indexed' | 'blocked' | 'error';
  lastCrawlTime?: Date;
  crawlErrors?: any[];
  mobileUsabilityIssues?: any[];
  coreWebVitals?: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay  
    cls: number; // Cumulative Layout Shift
  };
  impressions?: number;
  clicks?: number;
  averagePosition?: number;
  clickThroughRate?: number;
  coverage: 'valid' | 'error' | 'excluded' | 'warning';
}

export class GoogleSearchConsole {
  private siteUrl: string;
  private accessToken?: string;
  private refreshToken?: string;
  private clientId?: string;
  private clientSecret?: string;

  constructor() {
    this.siteUrl = process.env.GSC_SITE_URL || 'https://memopyk.com';
    this.accessToken = process.env.GSC_ACCESS_TOKEN;
    this.refreshToken = process.env.GSC_REFRESH_TOKEN;
    this.clientId = process.env.GSC_CLIENT_ID;
    this.clientSecret = process.env.GSC_CLIENT_SECRET;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      console.log('Missing GSC credentials for token refresh');
      return null;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        return this.accessToken;
      } else {
        console.error('Failed to refresh GSC access token:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error refreshing GSC access token:', error);
      return null;
    }
  }

  async makeGSCRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.accessToken) {
      const newToken = await this.refreshAccessToken();
      if (!newToken) {
        throw new Error('No valid access token available');
      }
    }

    const url = new URL(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.siteUrl)}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          const retryResponse = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        throw new Error('Authentication failed');
      }

      if (response.ok) {
        return await response.json();
      } else {
        const errorText = await response.text();
        throw new Error(`GSC API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('GSC API request failed:', error);
      throw error;
    }
  }

  async getIndexingStatus(url: string): Promise<any> {
    try {
      const response = await this.makeGSCRequest('urlInspection/index:inspect', {
        inspectionUrl: url,
        siteUrl: this.siteUrl,
      });

      return {
        indexingStatus: response.indexStatusResult?.verdict || 'unknown',
        lastCrawlTime: response.indexStatusResult?.lastCrawlTime ? new Date(response.indexStatusResult.lastCrawlTime) : null,
        crawlErrors: response.indexStatusResult?.pageFetchState === 'SUCCESSFUL' ? [] : [response.indexStatusResult],
        coverage: response.indexStatusResult?.coverageState || 'unknown',
      };
    } catch (error) {
      console.error(`Failed to get indexing status for ${url}:`, error);
      return {
        indexingStatus: 'error',
        crawlErrors: [{ error: (error as Error).message }],
        coverage: 'error',
      };
    }
  }

  async getSearchAnalytics(url: string, days: number = 7): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    try {
      const response = await this.makeGSCRequest('searchAnalytics/query', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        filters: [{
          dimension: 'page',
          operator: 'equals',
          expression: url,
        }],
        rowLimit: 1,
      });

      const row = response.rows?.[0];
      return {
        impressions: row?.impressions || 0,
        clicks: row?.clicks || 0,
        averagePosition: row?.position || 0,
        clickThroughRate: row?.ctr || 0,
      };
    } catch (error) {
      console.error(`Failed to get search analytics for ${url}:`, error);
      return {
        impressions: 0,
        clicks: 0,
        averagePosition: 0,
        clickThroughRate: 0,
      };
    }
  }

  async getMobileUsabilityIssues(url: string): Promise<any[]> {
    try {
      const response = await this.makeGSCRequest('urlInspection/index:inspect', {
        inspectionUrl: url,
        siteUrl: this.siteUrl,
      });

      const mobileUsability = response.mobileUsabilityResult;
      if (mobileUsability?.verdict === 'PASS') {
        return [];
      }

      return mobileUsability?.issues || [];
    } catch (error) {
      console.error(`Failed to get mobile usability for ${url}:`, error);
      return [];
    }
  }

  async generateReportForUrl(url: string, pageKey: string, locale: string = 'en'): Promise<SearchConsoleReport> {
    try {
      console.log(`Generating Search Console report for ${url}`);

      const [indexingData, analyticsData, mobileIssues] = await Promise.allSettled([
        this.getIndexingStatus(url),
        this.getSearchAnalytics(url),
        this.getMobileUsabilityIssues(url),
      ]);

      const indexing = indexingData.status === 'fulfilled' ? indexingData.value : {
        indexingStatus: 'error',
        crawlErrors: ['Failed to fetch indexing status'],
        coverage: 'error',
      };

      const analytics = analyticsData.status === 'fulfilled' ? analyticsData.value : {
        impressions: 0,
        clicks: 0,
        averagePosition: 0,
        clickThroughRate: 0,
      };

      const mobile = mobileIssues.status === 'fulfilled' ? mobileIssues.value : [];

      const report: SearchConsoleReport = {
        url,
        pageKey,
        locale,
        indexingStatus: indexing.indexingStatus,
        lastCrawlTime: indexing.lastCrawlTime,
        crawlErrors: indexing.crawlErrors,
        mobileUsabilityIssues: mobile,
        impressions: analytics.impressions,
        clicks: analytics.clicks,
        averagePosition: analytics.averagePosition,
        clickThroughRate: analytics.clickThroughRate,
        coverage: indexing.coverage,
      };

      // Store report in database
      await this.storeReport(report);

      return report;
    } catch (error) {
      console.error(`Failed to generate report for ${url}:`, error);
      
      const errorReport: SearchConsoleReport = {
        url,
        pageKey,
        locale,
        indexingStatus: 'error',
        crawlErrors: [{ error: (error as Error).message }],
        coverage: 'error',
        impressions: 0,
        clicks: 0,
        averagePosition: 0,
        clickThroughRate: 0,
      };

      await this.storeReport(errorReport);
      return errorReport;
    }
  }

  async storeReport(report: SearchConsoleReport): Promise<void> {
    try {
      await storage.createSeoConsoleReport({
        url: report.url,
        pageKey: report.pageKey,
        locale: report.locale,
        indexingStatus: report.indexingStatus,
        lastCrawlTime: report.lastCrawlTime,
        crawlErrors: report.crawlErrors,
        mobileUsabilityIssues: report.mobileUsabilityIssues,
        coreWebVitals: report.coreWebVitals,
        impressions: report.impressions,
        clicks: report.clicks,
        averagePosition: report.averagePosition,
        clickThroughRate: report.clickThroughRate,
        coverage: report.coverage,
      });

      console.log(`Stored Search Console report for ${report.url}`);
    } catch (error) {
      console.error('Failed to store Search Console report:', error);
    }
  }

  async getLatestReportForUrl(url: string): Promise<SearchConsoleReport | null> {
    try {
      const reports = await storage.getSeoConsoleReports();
      const urlReports = reports.filter(r => r.url === url);
      
      if (urlReports.length === 0) {
        return null;
      }

      // Return most recent report
      const latest = urlReports.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return {
        url: latest.url,
        pageKey: latest.pageKey,
        locale: latest.locale,
        indexingStatus: latest.indexingStatus as any,
        lastCrawlTime: latest.lastCrawlTime,
        crawlErrors: latest.crawlErrors as any[],
        mobileUsabilityIssues: latest.mobileUsabilityIssues as any[],
        coreWebVitals: latest.coreWebVitals as any,
        impressions: latest.impressions,
        clicks: latest.clicks,
        averagePosition: latest.averagePosition,
        clickThroughRate: latest.clickThroughRate,
        coverage: latest.coverage as any,
      };
    } catch (error) {
      console.error('Failed to get latest report:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return !!(this.accessToken || this.refreshToken) && !!this.clientId && !!this.clientSecret;
  }

  getConfigurationStatus(): { configured: boolean; missingCredentials: string[] } {
    const missing: string[] = [];
    
    if (!this.clientId) missing.push('GSC_CLIENT_ID');
    if (!this.clientSecret) missing.push('GSC_CLIENT_SECRET');
    if (!this.refreshToken && !this.accessToken) missing.push('GSC_REFRESH_TOKEN or GSC_ACCESS_TOKEN');
    
    return {
      configured: missing.length === 0,
      missingCredentials: missing,
    };
  }
}

export const searchConsole = new GoogleSearchConsole();