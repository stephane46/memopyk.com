import { searchConsole } from './search-console';
import { storage } from './storage';

export interface GSCMetrics {
  url: string;
  period: '7d' | '28d';
  data: Array<{
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }>;
  summary: {
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    averagePosition: number;
    trend: {
      impressions: 'up' | 'down' | 'stable';
      clicks: 'up' | 'down' | 'stable';
      ctr: 'up' | 'down' | 'stable';
      position: 'up' | 'down' | 'stable';
    };
  };
}

export interface SparklineData {
  impressions: number[];
  clicks: number[];
  labels: string[];
}

class SearchConsoleMetrics {
  
  async getMetricsForUrl(url: string, period: '7d' | '28d' = '7d'): Promise<GSCMetrics | null> {
    if (!searchConsole.isConfigured()) {
      console.log('[GSC-METRICS] Search Console not configured');
      return null;
    }

    try {
      const days = period === '7d' ? 7 : 28;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const response = await searchConsole.makeGSCRequest('searchAnalytics/query', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['date'],
        filters: [{
          dimension: 'page',
          operator: 'equals',
          expression: url,
        }],
        rowLimit: days,
        dataState: 'final'
      });

      if (!response.rows || response.rows.length === 0) {
        return this.createEmptyMetrics(url, period);
      }

      // Process daily data
      const dailyData = response.rows.map((row: any) => ({
        date: row.keys[0],
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

      // Sort by date
      dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate summary metrics
      const summary = this.calculateSummary(dailyData);

      return {
        url,
        period,
        data: dailyData,
        summary
      };

    } catch (error) {
      console.error('[GSC-METRICS] Error fetching metrics:', error);
      return null;
    }
  }

  private createEmptyMetrics(url: string, period: '7d' | '28d'): GSCMetrics {
    const days = period === '7d' ? 7 : 28;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        impressions: 0,
        clicks: 0,
        ctr: 0,
        position: 0,
      });
    }

    return {
      url,
      period,
      data,
      summary: {
        totalImpressions: 0,
        totalClicks: 0,
        averageCTR: 0,
        averagePosition: 0,
        trend: {
          impressions: 'stable',
          clicks: 'stable',
          ctr: 'stable',
          position: 'stable',
        }
      }
    };
  }

  private calculateSummary(data: Array<{
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }>) {
    const total = data.reduce((acc, day) => ({
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      ctr: acc.ctr + day.ctr,
      position: acc.position + day.position,
    }), { impressions: 0, clicks: 0, ctr: 0, position: 0 });

    const nonZeroDays = data.filter(d => d.impressions > 0).length;
    const avgCTR = nonZeroDays > 0 ? total.ctr / nonZeroDays : 0;
    const avgPosition = nonZeroDays > 0 ? total.position / nonZeroDays : 0;

    // Calculate trends (compare first half vs second half)
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    const firstHalfAvg = this.calculateAverage(firstHalf);
    const secondHalfAvg = this.calculateAverage(secondHalf);

    return {
      totalImpressions: total.impressions,
      totalClicks: total.clicks,
      averageCTR: avgCTR,
      averagePosition: avgPosition,
      trend: {
        impressions: this.getTrend(firstHalfAvg.impressions, secondHalfAvg.impressions),
        clicks: this.getTrend(firstHalfAvg.clicks, secondHalfAvg.clicks),
        ctr: this.getTrend(firstHalfAvg.ctr, secondHalfAvg.ctr),
        position: this.getTrend(firstHalfAvg.position, secondHalfAvg.position, true), // Lower is better for position
      }
    };
  }

  private calculateAverage(data: Array<{ impressions: number; clicks: number; ctr: number; position: number }>) {
    if (data.length === 0) return { impressions: 0, clicks: 0, ctr: 0, position: 0 };
    
    const sum = data.reduce((acc, day) => ({
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      ctr: acc.ctr + day.ctr,
      position: acc.position + day.position,
    }), { impressions: 0, clicks: 0, ctr: 0, position: 0 });

    return {
      impressions: sum.impressions / data.length,
      clicks: sum.clicks / data.length,
      ctr: sum.ctr / data.length,
      position: sum.position / data.length,
    };
  }

  private getTrend(first: number, second: number, lowerIsBetter = false): 'up' | 'down' | 'stable' {
    const threshold = 0.1; // 10% change threshold
    const change = (second - first) / (first || 1);

    if (Math.abs(change) < threshold) {
      return 'stable';
    }

    if (lowerIsBetter) {
      return change < 0 ? 'up' : 'down';
    } else {
      return change > 0 ? 'up' : 'down';
    }
  }

  getSparklineData(metrics: GSCMetrics): SparklineData {
    return {
      impressions: metrics.data.map(d => d.impressions),
      clicks: metrics.data.map(d => d.clicks),
      labels: metrics.data.map(d => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      })
    };
  }

  generateCSVReport(metrics: GSCMetrics): string {
    const headers = ['Date', 'Impressions', 'Clicks', 'CTR (%)', 'Average Position'];
    const rows = metrics.data.map(day => [
      day.date,
      day.impressions.toString(),
      day.clicks.toString(),
      (day.ctr * 100).toFixed(2),
      day.position.toFixed(1),
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['SUMMARY', '', '', '', '']);
    rows.push(['Total Impressions', metrics.summary.totalImpressions.toString(), '', '', '']);
    rows.push(['Total Clicks', metrics.summary.totalClicks.toString(), '', '', '']);
    rows.push(['Average CTR (%)', (metrics.summary.averageCTR * 100).toFixed(2), '', '', '']);
    rows.push(['Average Position', metrics.summary.averagePosition.toFixed(1), '', '', '']);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  async getMetricsForAllPages(period: '7d' | '28d' = '7d'): Promise<Map<string, GSCMetrics>> {
    const results = new Map<string, GSCMetrics>();

    try {
      const settings = await storage.getSeoSettings();
      const baseUrl = 'https://memopyk.com';

      for (const setting of settings) {
        const fullUrl = `${baseUrl}${setting.urlSlug}`;
        const metrics = await this.getMetricsForUrl(fullUrl, period);
        
        if (metrics) {
          results.set(setting.id, metrics);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('[GSC-METRICS] Error fetching metrics for all pages:', error);
    }

    return results;
  }

  async getTopQueries(url: string, limit = 10): Promise<Array<{
    query: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }>> {
    if (!searchConsole.isConfigured()) {
      return [];
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 28); // Last 28 days

      const response = await searchConsole.makeGSCRequest('searchAnalytics/query', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        filters: [{
          dimension: 'page',
          operator: 'equals',
          expression: url,
        }],
        rowLimit: limit,
        dataState: 'final'
      });

      if (!response.rows) {
        return [];
      }

      return response.rows.map((row: any) => ({
        query: row.keys[0],
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

    } catch (error) {
      console.error('[GSC-METRICS] Error fetching top queries:', error);
      return [];
    }
  }

  async getPagePerformanceReport(): Promise<{
    pages: Array<{
      url: string;
      pageId: string;
      impressions: number;
      clicks: number;
      ctr: number;
      position: number;
      trend: string;
    }>;
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    averagePosition: number;
  }> {
    const metricsMap = await this.getMetricsForAllPages('7d');
    const pages = [];
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCTR = 0;
    let totalPosition = 0;

    for (const [pageId, metrics] of metricsMap) {
      const summary = metrics.summary;
      pages.push({
        url: metrics.url,
        pageId,
        impressions: summary.totalImpressions,
        clicks: summary.totalClicks,
        ctr: summary.averageCTR,
        position: summary.averagePosition,
        trend: this.formatTrend(summary.trend),
      });

      totalImpressions += summary.totalImpressions;
      totalClicks += summary.totalClicks;
      totalCTR += summary.averageCTR;
      totalPosition += summary.averagePosition;
    }

    const pageCount = pages.length || 1;

    return {
      pages: pages.sort((a, b) => b.impressions - a.impressions), // Sort by impressions desc
      totalImpressions,
      totalClicks,
      averageCTR: totalCTR / pageCount,
      averagePosition: totalPosition / pageCount,
    };
  }

  private formatTrend(trend: GSCMetrics['summary']['trend']): string {
    const trends = [];
    if (trend.impressions !== 'stable') trends.push(`👁️${trend.impressions === 'up' ? '↗️' : '↘️'}`);
    if (trend.clicks !== 'stable') trends.push(`👆${trend.clicks === 'up' ? '↗️' : '↘️'}`);
    if (trend.position !== 'stable') trends.push(`📍${trend.position === 'up' ? '↗️' : '↘️'}`);
    return trends.join(' ') || '➖';
  }
}

export const gscMetrics = new SearchConsoleMetrics();