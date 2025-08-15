import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportTemplateService } from '@/services/report-template.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';

describe('ReportTemplateService', () => {
  let service: ReportTemplateService;

  beforeEach(() => {
    service = new ReportTemplateService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('createTemplate', () => {
    it('should create a new report template', async () => {
      const templateData = {
        name: 'Supplier Performance Template',
        type: 'supplier_performance',
        description: 'Template for supplier performance reports',
        sqlQuery: 'SELECT * FROM suppliers WHERE active = true',
        parameters: [
          { name: 'startDate', type: 'date', required: true },
          { name: 'endDate', type: 'date', required: true }
        ],
        layout: {
          title: 'Supplier Performance Report',
          sections: ['summary', 'details', 'charts']
        }
      };

      const result = await service.createTemplate(templateData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(templateData.name);
      expect(result.type).toBe(templateData.type);
    });

    it('should validate template data before creation', async () => {
      const invalidTemplate = {
        name: '', // Empty name should fail
        type: 'invalid_type',
        sqlQuery: 'INVALID SQL'
      };

      await expect(service.createTemplate(invalidTemplate))
        .rejects.toThrow('Invalid template data');
    });

    it('should validate SQL query syntax', async () => {
      const templateWithBadSQL = {
        name: 'Test Template',
        type: 'custom',
        sqlQuery: 'SELECT * FROM non_existent_table WHERE invalid syntax'
      };

      await expect(service.createTemplate(templateWithBadSQL))
        .rejects.toThrow('Invalid SQL query');
    });
  });

  describe('updateTemplate', () => {
    it('should update existing template', async () => {
      const template = await service.createTemplate({
        name: 'Original Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT * FROM suppliers'
      });

      const updates = {
        name: 'Updated Template',
        description: 'Updated description'
      };

      const result = await service.updateTemplate(template.id, updates);

      expect(result.name).toBe('Updated Template');
      expect(result.description).toBe('Updated description');
    });

    it('should handle updates to non-existent template', async () => {
      const nonExistentId = 'non-existent-id';
      const updates = { name: 'Updated Name' };

      await expect(service.updateTemplate(nonExistentId, updates))
        .rejects.toThrow('Template not found');
    });

    it('should validate updates before applying', async () => {
      const template = await service.createTemplate({
        name: 'Test Template',
        type: 'custom',
        sqlQuery: 'SELECT 1'
      });

      const invalidUpdates = {
        sqlQuery: 'INVALID SQL SYNTAX'
      };

      await expect(service.updateTemplate(template.id, invalidUpdates))
        .rejects.toThrow('Invalid SQL query');
    });
  });

  describe('getTemplate', () => {
    it('should retrieve template by ID', async () => {
      const template = await service.createTemplate({
        name: 'Test Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT * FROM suppliers'
      });

      const retrieved = await service.getTemplate(template.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(template.id);
      expect(retrieved.name).toBe(template.name);
    });

    it('should return null for non-existent template', async () => {
      const nonExistentId = 'non-existent-id';

      const result = await service.getTemplate(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe('getTemplates', () => {
    it('should retrieve all templates with pagination', async () => {
      // Create test templates
      await service.createTemplate({
        name: 'Template 1',
        type: 'supplier_performance',
        sqlQuery: 'SELECT 1'
      });
      await service.createTemplate({
        name: 'Template 2',
        type: 'spending_analysis',
        sqlQuery: 'SELECT 2'
      });

      const result = await service.getTemplates({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.templates).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter templates by type', async () => {
      await service.createTemplate({
        name: 'Supplier Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT 1'
      });
      await service.createTemplate({
        name: 'Spending Template',
        type: 'spending_analysis',
        sqlQuery: 'SELECT 2'
      });

      const result = await service.getTemplates({
        type: 'supplier_performance',
        page: 1,
        limit: 10
      });

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].type).toBe('supplier_performance');
    });

    it('should search templates by name', async () => {
      await service.createTemplate({
        name: 'Supplier Performance Report',
        type: 'supplier_performance',
        sqlQuery: 'SELECT 1'
      });
      await service.createTemplate({
        name: 'Monthly Spending Analysis',
        type: 'spending_analysis',
        sqlQuery: 'SELECT 2'
      });

      const result = await service.getTemplates({
        search: 'supplier',
        page: 1,
        limit: 10
      });

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toContain('Supplier');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete existing template', async () => {
      const template = await service.createTemplate({
        name: 'Template to Delete',
        type: 'custom',
        sqlQuery: 'SELECT 1'
      });

      const result = await service.deleteTemplate(template.id);

      expect(result.success).toBe(true);

      // Verify template is deleted
      const retrieved = await service.getTemplate(template.id);
      expect(retrieved).toBeNull();
    });

    it('should handle deletion of non-existent template', async () => {
      const nonExistentId = 'non-existent-id';

      const result = await service.deleteTemplate(nonExistentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should prevent deletion of templates in use', async () => {
      const template = await service.createTemplate({
        name: 'Template in Use',
        type: 'custom',
        sqlQuery: 'SELECT 1'
      });

      // Mock template being in use
      vi.spyOn(service as any, 'isTemplateInUse').mockResolvedValue(true);

      await expect(service.deleteTemplate(template.id))
        .rejects.toThrow('Template is currently in use');
    });
  });

  describe('validateTemplate', () => {
    it('should validate template structure', async () => {
      const validTemplate = {
        name: 'Valid Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT id, name FROM suppliers WHERE active = true',
        parameters: [
          { name: 'active', type: 'boolean', required: false, defaultValue: true }
        ]
      };

      const result = await service.validateTemplate(validTemplate);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid template structure', async () => {
      const invalidTemplate = {
        name: '',
        type: 'invalid_type',
        sqlQuery: 'SELECT * FROM',
        parameters: [
          { name: '', type: 'invalid_type' }
        ]
      };

      const result = await service.validateTemplate(invalidTemplate);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate SQL query security', async () => {
      const maliciousTemplate = {
        name: 'Malicious Template',
        type: 'custom',
        sqlQuery: 'SELECT * FROM suppliers; DROP TABLE suppliers;'
      };

      const result = await service.validateTemplate(maliciousTemplate);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('security'))).toBe(true);
    });
  });

  describe('previewTemplate', () => {
    it('should generate preview of template output', async () => {
      const template = await service.createTemplate({
        name: 'Preview Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT id, name, email FROM suppliers LIMIT 5'
      });

      const preview = await service.previewTemplate(template.id, {});

      expect(preview).toBeDefined();
      expect(preview.success).toBe(true);
      expect(Array.isArray(preview.data)).toBe(true);
      expect(preview.data.length).toBeLessThanOrEqual(5);
    });

    it('should handle preview with parameters', async () => {
      const template = await service.createTemplate({
        name: 'Parameterized Template',
        type: 'custom',
        sqlQuery: 'SELECT * FROM suppliers WHERE active = {{active}}',
        parameters: [
          { name: 'active', type: 'boolean', required: true }
        ]
      });

      const preview = await service.previewTemplate(template.id, {
        active: true
      });

      expect(preview.success).toBe(true);
      expect(Array.isArray(preview.data)).toBe(true);
    });

    it('should handle preview errors gracefully', async () => {
      const template = await service.createTemplate({
        name: 'Error Template',
        type: 'custom',
        sqlQuery: 'SELECT * FROM non_existent_table'
      });

      const preview = await service.previewTemplate(template.id, {});

      expect(preview.success).toBe(false);
      expect(preview.error).toBeDefined();
    });
  });

  describe('cloneTemplate', () => {
    it('should create copy of existing template', async () => {
      const originalTemplate = await service.createTemplate({
        name: 'Original Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT * FROM suppliers',
        description: 'Original description'
      });

      const cloned = await service.cloneTemplate(originalTemplate.id, {
        name: 'Cloned Template'
      });

      expect(cloned.id).not.toBe(originalTemplate.id);
      expect(cloned.name).toBe('Cloned Template');
      expect(cloned.type).toBe(originalTemplate.type);
      expect(cloned.sqlQuery).toBe(originalTemplate.sqlQuery);
    });

    it('should handle cloning non-existent template', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(service.cloneTemplate(nonExistentId, { name: 'Clone' }))
        .rejects.toThrow('Template not found');
    });
  });

  describe('getTemplateUsage', () => {
    it('should return template usage statistics', async () => {
      const template = await service.createTemplate({
        name: 'Usage Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT 1'
      });

      const usage = await service.getTemplateUsage(template.id);

      expect(usage).toBeDefined();
      expect(usage).toHaveProperty('templateId');
      expect(usage).toHaveProperty('usageCount');
      expect(usage).toHaveProperty('lastUsed');
      expect(usage).toHaveProperty('reportsGenerated');
    });
  });

  describe('exportTemplate', () => {
    it('should export template in specified format', async () => {
      const template = await service.createTemplate({
        name: 'Export Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT * FROM suppliers'
      });

      const exported = await service.exportTemplate(template.id, 'json');

      expect(exported).toBeDefined();
      expect(exported.format).toBe('json');
      expect(exported.data).toBeDefined();
    });

    it('should support multiple export formats', async () => {
      const template = await service.createTemplate({
        name: 'Multi-format Template',
        type: 'custom',
        sqlQuery: 'SELECT 1'
      });

      const formats = ['json', 'yaml', 'xml'];

      for (const format of formats) {
        const exported = await service.exportTemplate(template.id, format);
        expect(exported.format).toBe(format);
      }
    });
  });

  describe('importTemplate', () => {
    it('should import template from external format', async () => {
      const templateData = {
        name: 'Imported Template',
        type: 'supplier_performance',
        sqlQuery: 'SELECT * FROM suppliers',
        parameters: []
      };

      const imported = await service.importTemplate(templateData, 'json');

      expect(imported).toBeDefined();
      expect(imported.name).toBe(templateData.name);
      expect(imported.type).toBe(templateData.type);
    });

    it('should validate imported template data', async () => {
      const invalidTemplateData = {
        name: '',
        type: 'invalid_type'
      };

      await expect(service.importTemplate(invalidTemplateData, 'json'))
        .rejects.toThrow('Invalid template data');
    });
  });
});