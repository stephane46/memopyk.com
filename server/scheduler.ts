import { storage } from './storage';
import { advancedCrawler } from './advanced-crawler';
import { searchConsole } from './search-console';
import { cdnManager } from './cdn-invalidation';

export interface ScheduleConfig {
  id: string;
  pageId: string;
  crawlEnabled: boolean;
  searchConsoleEnabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  nextRun: Date;
  lastRun?: Date;
  lastStatus?: 'success' | 'error' | 'running';
  errorMessage?: string;
}

export interface CrawlResult {
  pageId: string;
  success: boolean;
  duration: number;
  seoScore?: number;
  errors: string[];
  timestamp: Date;
}

export interface MonitoringMetrics {
  totalCrawls24h: number;
  successfulCrawls24h: number;
  failedCrawls24h: number;
  successRate: number;
  averageResponseTime: number;
  lastErrors: Array<{
    pageId: string;
    error: string;
    timestamp: Date;
  }>;
}

class SEOScheduler {
  private schedules: Map<string, ScheduleConfig> = new Map();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private crawlResults: CrawlResult[] = [];
  private maxResultsHistory = 1000;

  constructor() {
    this.loadSchedules();
    this.startScheduler();
  }

  private async loadSchedules(): Promise<void> {
    try {
      // Load existing schedules from storage or create defaults
      const settings = await storage.getSeoSettings();
      
      settings.forEach(setting => {
        const schedule: ScheduleConfig = {
          id: `${setting.id}-schedule`,
          pageId: setting.id,
          crawlEnabled: true,
          searchConsoleEnabled: true,
          frequency: 'daily',
          nextRun: this.calculateNextRun('daily'),
          lastStatus: undefined
        };
        
        this.schedules.set(setting.id, schedule);
      });

      console.log(`[SCHEDULER] Loaded ${this.schedules.size} schedules`);
    } catch (error) {
      console.error('[SCHEDULER] Failed to load schedules:', error);
    }
  }

  private calculateNextRun(frequency: ScheduleConfig['frequency'], from: Date = new Date()): Date {
    const next = new Date(from);
    
    switch (frequency) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(2, 0, 0, 0); // 2 AM
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        next.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(2, 0, 0, 0);
        break;
    }
    
    return next;
  }

  private startScheduler(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Check for due tasks every minute
    this.intervalId = setInterval(() => {
      this.checkAndRunDueTasks();
    }, 60 * 1000);

    console.log('[SCHEDULER] Started with 1-minute check interval');
  }

  private async checkAndRunDueTasks(): Promise<void> {
    const now = new Date();
    
    for (const [pageId, schedule] of this.schedules) {
      if (schedule.nextRun <= now && schedule.lastStatus !== 'running') {
        this.runScheduledTask(pageId, schedule);
      }
    }
  }

  private async runScheduledTask(pageId: string, schedule: ScheduleConfig): Promise<void> {
    const startTime = Date.now();
    
    console.log(`[SCHEDULER] Running scheduled task for page ${pageId}`);
    
    // Mark as running
    schedule.lastStatus = 'running';
    schedule.lastRun = new Date();
    
    const errors: string[] = [];
    let seoScore: number | undefined;

    try {
      const settings = await storage.getSeoSettings();
      const setting = settings.find(s => s.id === pageId);
      
      if (!setting) {
        throw new Error(`SEO setting not found for page ${pageId}`);
      }

      const baseUrl = 'https://memopyk.com';
      const fullUrl = `${baseUrl}${setting.urlSlug}`;

      // Run advanced crawl if enabled
      if (schedule.crawlEnabled) {
        try {
          const crawlResult = await advancedCrawler.crawlUrl(fullUrl, setting.id);
          seoScore = crawlResult.seoScore;
          
          if (crawlResult.crawlStatus !== 'success') {
            errors.push(`Crawl failed: ${crawlResult.errorDetails || 'Unknown error'}`);
          }
        } catch (error) {
          errors.push(`Crawl error: ${(error as Error).message}`);
        }
      }

      // Run Search Console sync if enabled
      if (schedule.searchConsoleEnabled && searchConsole.isConfigured()) {
        try {
          await searchConsole.generateReportForUrl(fullUrl, setting.page, 'en');
        } catch (error) {
          errors.push(`Search Console error: ${(error as Error).message}`);
        }
      }

      // Update schedule status
      schedule.lastStatus = errors.length > 0 ? 'error' : 'success';
      schedule.errorMessage = errors.length > 0 ? errors.join('; ') : undefined;
      schedule.nextRun = this.calculateNextRun(schedule.frequency);

      // Record result
      const result: CrawlResult = {
        pageId,
        success: errors.length === 0,
        duration: Date.now() - startTime,
        seoScore,
        errors,
        timestamp: new Date()
      };

      this.addCrawlResult(result);

      console.log(`[SCHEDULER] Task completed for ${pageId}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.duration}ms)`);

    } catch (error) {
      console.error(`[SCHEDULER] Task failed for ${pageId}:`, error);
      
      schedule.lastStatus = 'error';
      schedule.errorMessage = (error as Error).message;
      schedule.nextRun = this.calculateNextRun(schedule.frequency);

      this.addCrawlResult({
        pageId,
        success: false,
        duration: Date.now() - startTime,
        errors: [(error as Error).message],
        timestamp: new Date()
      });
    }
  }

  private addCrawlResult(result: CrawlResult): void {
    this.crawlResults.unshift(result);
    
    // Keep only recent results
    if (this.crawlResults.length > this.maxResultsHistory) {
      this.crawlResults = this.crawlResults.slice(0, this.maxResultsHistory);
    }
  }

  // Public API methods
  
  async updateSchedule(pageId: string, updates: Partial<ScheduleConfig>): Promise<ScheduleConfig> {
    const schedule = this.schedules.get(pageId);
    
    if (!schedule) {
      throw new Error(`Schedule not found for page ${pageId}`);
    }

    Object.assign(schedule, updates);
    
    // Recalculate next run if frequency changed
    if (updates.frequency) {
      schedule.nextRun = this.calculateNextRun(updates.frequency);
    }

    console.log(`[SCHEDULER] Updated schedule for ${pageId}`);
    return schedule;
  }

  async triggerImmediateRun(pageId: string): Promise<void> {
    const schedule = this.schedules.get(pageId);
    
    if (!schedule) {
      throw new Error(`Schedule not found for page ${pageId}`);
    }

    if (schedule.lastStatus === 'running') {
      throw new Error(`Task already running for page ${pageId}`);
    }

    // Run immediately
    this.runScheduledTask(pageId, schedule);
  }

  getSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  getSchedule(pageId: string): ScheduleConfig | undefined {
    return this.schedules.get(pageId);
  }

  getCrawlResults(pageId?: string, limit = 50): CrawlResult[] {
    let results = this.crawlResults;
    
    if (pageId) {
      results = results.filter(r => r.pageId === pageId);
    }
    
    return results.slice(0, limit);
  }

  getMonitoringMetrics(): MonitoringMetrics {
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recent = this.crawlResults.filter(r => r.timestamp.getTime() > last24h);
    
    const successful = recent.filter(r => r.success);
    const failed = recent.filter(r => !r.success);
    
    return {
      totalCrawls24h: recent.length,
      successfulCrawls24h: successful.length,
      failedCrawls24h: failed.length,
      successRate: recent.length > 0 ? (successful.length / recent.length) * 100 : 100,
      averageResponseTime: recent.length > 0 ? recent.reduce((sum, r) => sum + r.duration, 0) / recent.length : 0,
      lastErrors: failed.slice(0, 10).map(r => ({
        pageId: r.pageId,
        error: r.errors.join('; '),
        timestamp: r.timestamp
      }))
    };
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('[SCHEDULER] Stopped');
  }
}

export const seoScheduler = new SEOScheduler();

// Cleanup on process exit
process.on('exit', () => {
  seoScheduler.stop();
});

process.on('SIGINT', () => {
  seoScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  seoScheduler.stop();
  process.exit(0);
});