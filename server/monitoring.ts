import { seoScheduler, type MonitoringMetrics } from './scheduler';

export interface AlertConfig {
  crawlFailureThreshold: number; // percentage
  responseTimeThreshold: number; // milliseconds
  emailNotifications: boolean;
  slackNotifications: boolean;
  emailRecipients: string[];
  slackWebhookUrl?: string;
}

export interface Alert {
  id: string;
  type: 'crawl_failure' | 'response_time' | 'cdn_error' | 'gsc_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  acknowledged: boolean;
}

class MonitoringSystem {
  private alerts: Alert[] = [];
  private alertConfig: AlertConfig;
  private maxAlertsHistory = 500;
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    this.alertConfig = {
      crawlFailureThreshold: 5, // 5% failure rate triggers alert
      responseTimeThreshold: 200, // 200ms response time threshold
      emailNotifications: process.env.ENABLE_EMAIL_ALERTS === 'true',
      slackNotifications: process.env.ENABLE_SLACK_ALERTS === 'true',
      emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    };

    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Check for alert conditions every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkAlertConditions();
    }, 5 * 60 * 1000);

    console.log('[MONITORING] Started with 5-minute check interval');
  }

  private async checkAlertConditions(): Promise<void> {
    try {
      const metrics = seoScheduler.getMonitoringMetrics();
      
      // Check crawl failure rate
      if (metrics.totalCrawls24h > 0) {
        const failureRate = (metrics.failedCrawls24h / metrics.totalCrawls24h) * 100;
        
        if (failureRate >= this.alertConfig.crawlFailureThreshold) {
          await this.createAlert({
            type: 'crawl_failure',
            severity: failureRate >= 20 ? 'critical' : failureRate >= 10 ? 'high' : 'medium',
            message: `High crawl failure rate: ${failureRate.toFixed(1)}% (${metrics.failedCrawls24h}/${metrics.totalCrawls24h})`,
            details: {
              failureRate,
              failed: metrics.failedCrawls24h,
              total: metrics.totalCrawls24h,
              recentErrors: metrics.lastErrors.slice(0, 5)
            }
          });
        }
      }

      // Check response time
      if (metrics.averageResponseTime > this.alertConfig.responseTimeThreshold) {
        await this.createAlert({
          type: 'response_time',
          severity: metrics.averageResponseTime > 1000 ? 'high' : 'medium',
          message: `Slow response times: ${Math.round(metrics.averageResponseTime)}ms average`,
          details: {
            averageResponseTime: metrics.averageResponseTime,
            threshold: this.alertConfig.responseTimeThreshold
          }
        });
      }

    } catch (error) {
      console.error('[MONITORING] Error checking alert conditions:', error);
    }
  }

  private async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      ...alertData
    };

    // Check for duplicate alerts (same type in last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentSimilarAlerts = this.alerts.filter(a => 
      a.type === alert.type && 
      a.timestamp.getTime() > oneHourAgo &&
      !a.acknowledged
    );

    if (recentSimilarAlerts.length > 0) {
      console.log(`[MONITORING] Suppressing duplicate alert of type ${alert.type}`);
      return alert;
    }

    this.alerts.unshift(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(0, this.maxAlertsHistory);
    }

    console.log(`[MONITORING] Created ${alert.severity} alert: ${alert.message}`);

    // Send notifications
    await this.sendNotifications(alert);

    return alert;
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    try {
      // Send email notifications
      if (this.alertConfig.emailNotifications && this.alertConfig.emailRecipients.length > 0) {
        await this.sendEmailNotification(alert);
      }

      // Send Slack notifications
      if (this.alertConfig.slackNotifications && this.alertConfig.slackWebhookUrl) {
        await this.sendSlackNotification(alert);
      }
    } catch (error) {
      console.error('[MONITORING] Failed to send notifications:', error);
    }
  }

  private async sendEmailNotification(alert: Alert): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[MONITORING] EMAIL ALERT: ${alert.message}`);
    console.log(`Recipients: ${this.alertConfig.emailRecipients.join(', ')}`);
    
    // Simulate email sending
    if (process.env.NODE_ENV === 'development') {
      console.log('Email notification simulated in development mode');
    }
  }

  private async sendSlackNotification(alert: Alert): Promise<void> {
    if (!this.alertConfig.slackWebhookUrl) return;

    const color = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff0000',
      critical: '#8b0000'
    }[alert.severity];

    const payload = {
      text: `SEO Monitoring Alert`,
      attachments: [{
        color,
        fields: [
          {
            title: 'Alert Type',
            value: alert.type.replace('_', ' ').toUpperCase(),
            short: true
          },
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Message',
            value: alert.message,
            short: false
          },
          {
            title: 'Timestamp',
            value: alert.timestamp.toISOString(),
            short: true
          }
        ]
      }]
    };

    try {
      const response = await fetch(this.alertConfig.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('[MONITORING] Slack notification sent successfully');
      } else {
        console.error('[MONITORING] Failed to send Slack notification:', response.statusText);
      }
    } catch (error) {
      console.error('[MONITORING] Slack notification error:', error);
    }
  }

  // Public API methods

  async recordCDNError(error: string, details: any): Promise<void> {
    await this.createAlert({
      type: 'cdn_error',
      severity: 'high',
      message: `CDN operation failed: ${error}`,
      details
    });
  }

  async recordGSCError(error: string, details: any): Promise<void> {
    await this.createAlert({
      type: 'gsc_error',
      severity: 'medium',
      message: `Google Search Console error: ${error}`,
      details
    });
  }

  getAlerts(limit = 50, type?: Alert['type'], severity?: Alert['severity']): Alert[] {
    let filtered = this.alerts;

    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }

    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }

    return filtered.slice(0, limit);
  }

  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`[MONITORING] Alert ${alertId} acknowledged`);
      return true;
    }
    return false;
  }

  acknowledgeAllAlerts(): number {
    const unacknowledged = this.alerts.filter(a => !a.acknowledged);
    unacknowledged.forEach(a => a.acknowledged = true);
    console.log(`[MONITORING] Acknowledged ${unacknowledged.length} alerts`);
    return unacknowledged.length;
  }

  getDashboardData(): {
    metrics: MonitoringMetrics;
    recentAlerts: Alert[];
    unacknowledgedCount: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const metrics = seoScheduler.getMonitoringMetrics();
    const recentAlerts = this.getAlerts(10);
    const unacknowledgedCount = this.getUnacknowledgedAlerts().length;
    
    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (metrics.successRate < 80) {
      systemHealth = 'critical';
    } else if (metrics.successRate < 95 || metrics.averageResponseTime > 1000) {
      systemHealth = 'warning';
    }

    const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical' && !a.acknowledged);
    if (criticalAlerts.length > 0) {
      systemHealth = 'critical';
    }

    return {
      metrics,
      recentAlerts,
      unacknowledgedCount,
      systemHealth
    };
  }

  updateConfig(updates: Partial<AlertConfig>): AlertConfig {
    this.alertConfig = { ...this.alertConfig, ...updates };
    console.log('[MONITORING] Configuration updated');
    return this.alertConfig;
  }

  getConfig(): AlertConfig {
    return { ...this.alertConfig };
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    console.log('[MONITORING] Stopped');
  }
}

export const monitoringSystem = new MonitoringSystem();

// Cleanup on process exit
process.on('exit', () => {
  monitoringSystem.stop();
});

process.on('SIGINT', () => {
  monitoringSystem.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  monitoringSystem.stop();
  process.exit(0);
});