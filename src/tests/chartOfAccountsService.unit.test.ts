import { describe, it, expect, beforeEach } from 'vitest';
import { ChartOfAccountsService } from '@/services/chartOfAccountsService';
import { AccountingValidationError } from '@/errors/accounting';
import { AccountType, AccountCategory } from '@/types/accounting';

describe('ChartOfAccountsService - Unit Tests', () => {
  let service: ChartOfAccountsService;

  beforeEach(() => {
    service = new ChartOfAccountsService();
  });

  describe('Data Mapping', () => {
    it('should correctly map database records to Account objects', () => {
      const dbRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        account_code: '1000',
        account_name: 'Cash',
        account_type: 'asset',
        account_category: 'current_asset',
        parent_account_id: null,
        balance: 1000.00,
        is_active: true,
        description: 'Cash account',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mapped = service['mapDatabaseToAccount']([dbRecord]);

      expect(mapped).toHaveLength(1);
      expect(mapped[0]).toEqual({
        id: dbRecord.id,
        code: dbRecord.account_code,
        name: dbRecord.account_name,
        type: dbRecord.account_type,
        category: dbRecord.account_category,
        parentId: dbRecord.parent_account_id,
        balance: dbRecord.balance,
        isActive: dbRecord.is_active,
        description: dbRecord.description,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at
      });
    });

    it('should handle null values correctly', () => {
      const dbRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        account_code: '1000',
        account_name: 'Cash',
        account_type: 'asset',
        account_category: 'current_asset',
        parent_account_id: null,
        balance: null,
        is_active: true,
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mapped = service['mapDatabaseToAccount']([dbRecord]);

      expect(mapped[0].balance).toBe(0);
      expect(mapped[0].parentId).toBeNull();
      expect(mapped[0].description).toBeNull();
    });
  });

  describe('Hierarchy Building', () => {
    it('should build correct hierarchy from flat account list', () => {
      const accounts = [
        {
          id: 'parent-1',
          code: '1000',
          name: 'Assets',
          type: 'asset' as AccountType,
          category: 'current_asset' as AccountCategory,
          parentId: null,
          balance: 0,
          isActive: true,
          description: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'child-1',
          code: '1001',
          name: 'Cash',
          type: 'asset' as AccountType,
          category: 'current_asset' as AccountCategory,
          parentId: 'parent-1',
          balance: 1000,
          isActive: true,
          description: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const hierarchy = service['buildAccountHierarchy'](accounts);

      expect(hierarchy).toHaveLength(1); // Only root accounts
      expect(hierarchy[0].id).toBe('parent-1');
      expect(hierarchy[0].level).toBe(0);
      expect(hierarchy[0].children).toHaveLength(1);
      expect(hierarchy[0].children[0].id).toBe('child-1');
      expect(hierarchy[0].children[0].level).toBe(1);
      expect(hierarchy[0].children[0].path).toEqual(['parent-1']);
    });

    it('should handle orphaned accounts as root accounts', () => {
      const accounts = [
        {
          id: 'orphan-1',
          code: '1000',
          name: 'Orphaned Account',
          type: 'asset' as AccountType,
          category: 'current_asset' as AccountCategory,
          parentId: 'nonexistent-parent',
          balance: 0,
          isActive: true,
          description: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const hierarchy = service['buildAccountHierarchy'](accounts);

      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0].id).toBe('orphan-1');
      expect(hierarchy[0].level).toBe(0);
      expect(hierarchy[0].children).toHaveLength(0);
    });

    it('should sort accounts by code', () => {
      const accounts = [
        {
          id: 'account-2',
          code: '2000',
          name: 'Liabilities',
          type: 'liability' as AccountType,
          category: 'current_liability' as AccountCategory,
          parentId: null,
          balance: 0,
          isActive: true,
          description: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'account-1',
          code: '1000',
          name: 'Assets',
          type: 'asset' as AccountType,
          category: 'current_asset' as AccountCategory,
          parentId: null,
          balance: 0,
          isActive: true,
          description: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const hierarchy = service['buildAccountHierarchy'](accounts);

      expect(hierarchy).toHaveLength(2);
      expect(hierarchy[0].code).toBe('1000'); // Should be sorted first
      expect(hierarchy[1].code).toBe('2000');
    });
  });

  describe('Validation Logic', () => {
    it('should validate account code format', async () => {
      const validCodes = ['100', '1000', '123456'];
      const invalidCodes = ['12', '1234567', 'ABC', '12A', ''];

      // Test valid codes - should not throw
      for (const code of validCodes) {
        await expect(service['validateAccountData']({ code } as any)).resolves.not.toThrow();
      }

      // Test invalid codes - should throw
      for (const code of invalidCodes) {
        await expect(service['validateAccountData']({ code } as any))
          .rejects.toThrow(AccountingValidationError);
      }
    });

    it('should validate account name length', async () => {
      const validNames = ['AB', 'Valid Account Name', 'A'.repeat(255)];
      const invalidNames = ['A', '', 'A'.repeat(256)];

      // Test valid names - should not throw
      for (const name of validNames) {
        await expect(service['validateAccountData']({ name } as any)).resolves.not.toThrow();
      }

      // Test invalid names - should throw
      for (const name of invalidNames) {
        await expect(service['validateAccountData']({ name } as any))
          .rejects.toThrow(AccountingValidationError);
      }
    });

    it('should validate account type', async () => {
      const validTypes: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];
      const invalidTypes = ['invalid', 'ASSET', 'Asset'];

      // Test valid types - should not throw
      for (const type of validTypes) {
        await expect(service['validateAccountData']({ type } as any)).resolves.not.toThrow();
      }

      // Test invalid types - should throw
      for (const type of invalidTypes) {
        await expect(service['validateAccountData']({ type } as any))
          .rejects.toThrow(AccountingValidationError);
      }
    });
  });

  describe('Parent-Child Relationship Validation', () => {
    it('should allow compatible account types', async () => {
      const parentAccount = {
        id: 'parent-1',
        code: '1000',
        name: 'Assets',
        type: 'asset' as AccountType,
        category: 'current_asset' as AccountCategory,
        parentId: null,
        balance: 0,
        isActive: true,
        description: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const childAccountData = {
        code: '1001',
        name: 'Cash',
        type: 'asset' as AccountType,
        category: 'current_asset' as AccountCategory
      };

      await expect(service['validateParentChildRelationship'](parentAccount, childAccountData))
        .resolves.not.toThrow();
    });

    it('should reject incompatible account types', async () => {
      const parentAccount = {
        id: 'parent-1',
        code: '1000',
        name: 'Assets',
        type: 'asset' as AccountType,
        category: 'current_asset' as AccountCategory,
        parentId: null,
        balance: 0,
        isActive: true,
        description: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const childAccountData = {
        code: '2001',
        name: 'Accounts Payable',
        type: 'liability' as AccountType,
        category: 'current_liability' as AccountCategory
      };

      await expect(service['validateParentChildRelationship'](parentAccount, childAccountData))
        .rejects.toThrow(AccountingValidationError);
    });
  });

  describe('Circular Reference Detection', () => {
    it('should detect direct circular reference', async () => {
      const result = await service['wouldCreateCircularReference']('account-1', 'account-1');
      expect(result).toBe(true);
    });

    it('should allow valid parent-child relationship', async () => {
      // Mock getAccountById to return null (no parent)
      const originalGetAccountById = service.getAccountById;
      service.getAccountById = async () => null;

      const result = await service['wouldCreateCircularReference']('child-1', 'parent-1');
      expect(result).toBe(false);

      // Restore original method
      service.getAccountById = originalGetAccountById;
    });
  });
});