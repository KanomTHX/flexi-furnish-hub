import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorNotificationService } from '@/services/error-notification.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';

describe('ErrorNotificationService', () => {
  let service: ErrorNotificationService;

  beforeEach(() => {
    service = new ErrorNotificationService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('notifyAdministrators', () => {
    it('should send notifications to all administrators', async () => {
      const error = new Error('Critical system error');
      const context = 'payment-service';
      const severity = 'critical';

      vi.spyOn(service as any, 'getAdministratorEmails').mockResolvedValue([
        'admin1@company.com',
        'admin2@company.com'
      ]);
      vi.spyOn(service as any, 'sendEmail').mockResolvedValue({ success: true });

      const result = await service.notifyAdministrators(error, context, severity);

      expect(result.success).toBe(true);
      expect(result.notificationsSent).toBe(2);
      expect(service['sendEmail']).toHaveBeenCalledTimes(2);
    });

    it('should handle email sending failures gracefully', async () => {
      const error = new Error('Test error');
      const context = 'test-service';
      const severity = 'high';

      vi.spyOn(service as any, 'getAdministratorEmails').mockResolvedValue([
        'admin@company.com'
      ]);
      vi.spyOn(service as any, 'sendEmail').mockRejectedValue(new Error('Email send failed'));

      const result = await service.notifyAdministrators(error, context, severity);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should not send notifications for low severity errors', async () => {
      const error = new Error('Minor warning');
      const context = 'test-service';
      const severity = 'low';

      vi.spyOn(service as any, 'shouldNotify').mockReturnValue(false);
      vi.spyOn(service as any, 'sendEmail').mockResolvedValue({ success: true });

      const result = await service.notifyAdministrators(error, context, severity);

      expect(result.success).toBe(true);
      expect(result.notificationsSent).toBe(0);
      expect(service['sendEmail']).not.toHaveBeenCalled();
    });
  });

  describe('notifyIntegrationFailure', () => {
    it('should send integration-specific notifications', async () => {
      const error = new Error('QuickBooks sync failed');
      const integration = 'quickbooks';
      const operation = 'journal_entry_sync';

      vi.spyOn(service as any, 'getIntegrationAdmins').mockResolvedValue([
        'integration-admin@company.com'
      ]);
      vi.spyOn(service as any, 'sendEmail').mockResolvedValue({ success: true });

      const result = await service.notifyIntegrationFailure(error, integration, operation);

      expect(result.success).toBe(true);
      expect(result.notificationsSent).toBe(1);
    });

    it('should include integration context in notification', async () => {
      const error = new Error('Sync failed');
      const integration = 'xero';
      const operation = 'account_sync';

      vi.spyOn(service as any, 'getIntegrationAdmins').mockResolvedValue([
        'admin@company.com'
      ]);
      vi.spyOn(service as any, 'sendEmail').mockResolvedValue({ success: true });

      await service.notifyIntegrationFailure(error, integration, operation);

      const emailCall = service['sendEmail'].mock.calls[0];
      const emailContent = emailCall[0].content;

      expect(emailContent).toContain(integration);
      expect(emailContent).toContain(operation);
    });
  });

  describe('scheduleErrorDigest', () => {
    it('should schedule daily error digest', async () => {
      const schedule = {
        frequency: 'daily',
        time: '09:00',
        recipients: ['manager@company.com'],
        severityThreshold: 'medium'
      };

      const result = await service.scheduleErrorDigest(schedule);

      expect(result.success).toBe(true);
      expect(result.scheduleId).toBeDefined();
    });

    it('should validate schedule parameters', async () => {
      const invalidSchedule = {
        frequency: 'invalid-frequency',
        time: 'invalid-time'
      };

      await expect(service.scheduleErrorDigest(invalidSchedule))
        .rejects.toThrow('Invalid schedule parameters');
    });
  });

  describe('sendErrorDigest', () => {
    it('should compile and send error digest', async () => {
      // Seed some error data
      mockDatabase.seedData('error_logs', [
        {
          id: '1',
          message: 'Error 1',
          severity: 'high',
          context: 'service-a',
          createdAt: new Date()
        },
        {
          id: '2',
          message: 'Error 2',
          severity: 'critical',
          context: 'service-b',
          createdAt: new Date()
        }
      ]);

      const recipients = ['manager@company.com'];
      const period = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        end: new Date()
      };

      vi.spyOn(service as any, 'sendEmail').mockResolvedValue({ success: true });

      const result = await service.sendErrorDigest(recipients, period);

      expect(result.success).toBe(true);
      expect(result.digestSent).toBe(true);
      expect(service['sendEmail']).toHaveBeenCalled();
    });

    it('should handle empty error digest', async () => {
      const recipients = ['manager@company.com'];
      const period = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const result = await service.sendErrorDigest(recipients, period);

      expect(result.success).toBe(true);
      expect(result.digestSent).toBe(false);
      expect(result.message).toContain('No errors to report');
    });
  });

  describe('getNotificationSettings', () => {
    it('should return current notification settings', async () => {
      const settings = await service.getNotificationSettings();

      expect(settings).toBeDefined();
      expect(settings).toHaveProperty('administrators');
      expect(settings).toHaveProperty('severityThresholds');
      expect(settings).toHaveProperty('integrationSettings');
      expect(settings).toHaveProperty('digestSchedules');
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings', async () => {
      const newSettings = {
        administrators: ['new-admin@company.com'],
        severityThresholds: {
          email: 'medium',
          sms: 'critical'
        },
        integrationSettings: {
          quickbooks: {
            enabled: true,
            recipients: ['qb-admin@company.com']
          }
        }
      };

      const result = await service.updateNotificationSettings(newSettings);

      expect(result.success).toBe(true);
      expect(result.settings).toMatchObject(newSettings);
    });

    it('should validate settings before updating', async () => {
      const invalidSettings = {
        administrators: 'not-an-array',
        severityThresholds: {
          email: 'invalid-severity'
        }
      };

      await expect(service.updateNotificationSettings(invalidSettings))
        .rejects.toThrow('Invalid notification settings');
    });
  });

  describe('testNotification', () => {
    it('should send test notification', async () => {
      const recipient = 'test@company.com';
      const notificationType = 'error_alert';

      vi.spyOn(service as any, 'sendEmail').mockResolvedValue({ success: true });

      const result = await service.testNotification(recipient, notificationType);

      expect(result.success).toBe(true);
      expect(service['sendEmail']).toHaveBeenCalledWith({
        to: recipient,
        subject: expect.stringContaining('Test'),
        content: expect.any(String)
      });
    });

    it('should handle test notification failures', async () => {
      const recipient = 'test@company.com';
      const notificationType = 'error_alert';

      vi.spyOn(service as any, 'sendEmail').mockRejectedValue(new Error('Send failed'));

      const result = await service.testNotification(recipient, notificationType);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getNotificationHistory', () => {
    it('should return notification history with pagination', async () => {
      const history = await service.getNotificationHistory({
        page: 1,
        limit: 10
      });

      expect(history).toBeDefined();
      expect(history).toHaveProperty('notifications');
      expect(history).toHaveProperty('total');
      expect(history).toHaveProperty('page');
      expect(history).toHaveProperty('limit');
      expect(Array.isArray(history.notifications)).toBe(true);
    });

    it('should filter history by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const history = await service.getNotificationHistory({
        startDate,
        endDate,
        page: 1,
        limit: 10
      });

      expect(history.notifications.every(notification => 
        notification.sentAt >= startDate && notification.sentAt <= endDate
      )).toBe(true);
    });

    it('should filter history by notification type', async () => {
      const notificationType = 'error_alert';

      const history = await service.getNotificationHistory({
        type: notificationType,
        page: 1,
        limit: 10
      });

      expect(history.notifications.every(notification => 
        notification.type === notificationType
      )).toBe(true);
    });
  });
});