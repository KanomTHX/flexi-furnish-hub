import { supabase } from '@/integrations/supabase/client';
import { Account, AccountFilter, AccountType, AccountCategory } from '@/types/accounting';
import { ChartOfAccountsError, AccountingValidationError } from '@/errors/accounting';

export interface CreateAccountData {
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  parentId?: string;
  balance?: number;
  isActive?: boolean;
  description?: string;
}

export interface UpdateAccountData {
  code?: string;
  name?: string;
  type?: AccountType;
  category?: AccountCategory;
  parentId?: string;
  balance?: number;
  isActive?: boolean;
  description?: string;
}

export interface AccountHierarchy extends Account {
  children: AccountHierarchy[];
  level: number;
  path: string[];
}

export class ChartOfAccountsService {
  /**
   * Get all accounts with optional filtering
   */
  async getAccounts(filter?: AccountFilter): Promise<Account[]> {
    try {
      let query = supabase
        .from('chart_of_accounts')
        .select('*')
        .order('account_code');

      // Apply filters
      if (filter?.type) {
        query = query.eq('account_type', filter.type);
      }
      if (filter?.category) {
        query = query.eq('account_category', filter.category);
      }
      if (filter?.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive);
      }
      if (filter?.search) {
        query = query.or(`account_name.ilike.%${filter.search}%,account_code.ilike.%${filter.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new ChartOfAccountsError(
          `Failed to fetch accounts: ${error.message}`,
          { originalError: error }
        );
      }

      return this.mapDatabaseToAccount(data || []);
    } catch (error) {
      if (error instanceof ChartOfAccountsError) {
        throw error;
      }
      throw new ChartOfAccountsError(
        'Unexpected error while fetching accounts',
        { originalError: error }
      );
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(id: string): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Account not found
        }
        throw new ChartOfAccountsError(
          `Failed to fetch account: ${error.message}`,
          { originalError: error }
        );
      }

      return this.mapDatabaseToAccount([data])[0];
    } catch (error) {
      if (error instanceof ChartOfAccountsError) {
        throw error;
      }
      throw new ChartOfAccountsError(
        'Unexpected error while fetching account',
        { originalError: error }
      );
    }
  }

  /**
   * Get account by code
   */
  async getAccountByCode(code: string): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('account_code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Account not found
        }
        throw new ChartOfAccountsError(
          `Failed to fetch account by code: ${error.message}`,
          { originalError: error }
        );
      }

      return this.mapDatabaseToAccount([data])[0];
    } catch (error) {
      if (error instanceof ChartOfAccountsError) {
        throw error;
      }
      throw new ChartOfAccountsError(
        'Unexpected error while fetching account by code',
        { originalError: error }
      );
    }
  }

  /**
   * Create a new account
   */
  async createAccount(accountData: CreateAccountData): Promise<Account> {
    try {
      // Validate account data
      await this.validateAccountData(accountData);

      // Check if account code already exists
      const existingAccount = await this.getAccountByCode(accountData.code);
      if (existingAccount) {
        throw new AccountingValidationError(
          `Account code ${accountData.code} already exists`,
          { code: ['Account code already exists'] }
        );
      }

      // Validate parent account if specified
      if (accountData.parentId) {
        const parentAccount = await this.getAccountById(accountData.parentId);
        if (!parentAccount) {
          throw new AccountingValidationError(
            'Parent account not found',
            { parentId: ['Parent account not found'] }
          );
        }
        
        // Validate parent-child relationship
        await this.validateParentChildRelationship(parentAccount, accountData);
      }

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          account_code: accountData.code,
          account_name: accountData.name,
          account_type: accountData.type,
          account_category: accountData.category,
          parent_account_id: accountData.parentId || null,
          balance: accountData.balance || 0,
          is_active: accountData.isActive !== false,
          description: accountData.description || null
        })
        .select()
        .single();

      if (error) {
        throw new ChartOfAccountsError(
          `Failed to create account: ${error.message}`,
          { originalError: error }
        );
      }

      return this.mapDatabaseToAccount([data])[0];
    } catch (error) {
      if (error instanceof ChartOfAccountsError || error instanceof AccountingValidationError) {
        throw error;
      }
      throw new ChartOfAccountsError(
        'Unexpected error while creating account',
        { originalError: error }
      );
    }
  }

  /**
   * Update an existing account
   */
  async updateAccount(id: string, updates: UpdateAccountData): Promise<Account> {
    try {
      // Get existing account
      const existingAccount = await this.getAccountById(id);
      if (!existingAccount) {
        throw new AccountingValidationError(
          'Account not found',
          { id: ['Account not found'] }
        );
      }

      // Validate updates
      if (updates.code && updates.code !== existingAccount.code) {
        const accountWithCode = await this.getAccountByCode(updates.code);
        if (accountWithCode && accountWithCode.id !== id) {
          throw new AccountingValidationError(
            `Account code ${updates.code} already exists`,
            { code: ['Account code already exists'] }
          );
        }
      }

      // Validate parent account if being updated
      if (updates.parentId !== undefined) {
        if (updates.parentId) {
          const parentAccount = await this.getAccountById(updates.parentId);
          if (!parentAccount) {
            throw new AccountingValidationError(
              'Parent account not found',
              { parentId: ['Parent account not found'] }
            );
          }

          // Prevent circular references
          if (await this.wouldCreateCircularReference(id, updates.parentId)) {
            throw new AccountingValidationError(
              'Cannot set parent account: would create circular reference',
              { parentId: ['Would create circular reference'] }
            );
          }

          // Validate parent-child relationship
          const updatedAccountData = { ...existingAccount, ...updates };
          await this.validateParentChildRelationship(parentAccount, updatedAccountData);
        }
      }

      const updateData: any = {};
      if (updates.code !== undefined) updateData.account_code = updates.code;
      if (updates.name !== undefined) updateData.account_name = updates.name;
      if (updates.type !== undefined) updateData.account_type = updates.type;
      if (updates.category !== undefined) updateData.account_category = updates.category;
      if (updates.parentId !== undefined) updateData.parent_account_id = updates.parentId;
      if (updates.balance !== undefined) updateData.balance = updates.balance;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.description !== undefined) updateData.description = updates.description;

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new ChartOfAccountsError(
          `Failed to update account: ${error.message}`,
          { originalError: error }
        );
      }

      return this.mapDatabaseToAccount([data])[0];
    } catch (error) {
      if (error instanceof ChartOfAccountsError || error instanceof AccountingValidationError) {
        throw error;
      }
      throw new ChartOfAccountsError(
        'Unexpected error while updating account',
        { originalError: error }
      );
    }
  }

  /**
   * Delete an account (soft delete by setting inactive)
   */
  async deleteAccount(id: string): Promise<void> {
    try {
      const account = await this.getAccountById(id);
      if (!account) {
        throw new AccountingValidationError(
          'Account not found',
          { id: ['Account not found'] }
        );
      }

      // Check if account has children
      const children = await this.getChildAccounts(id);
      if (children.length > 0) {
        throw new AccountingValidationError(
          'Cannot delete account with child accounts',
          { id: ['Account has child accounts'] }
        );
      }

      // Check if account has transactions
      const hasTransactions = await this.accountHasTransactions(id);
      if (hasTransactions) {
        throw new AccountingValidationError(
          'Cannot delete account with existing transactions',
          { id: ['Account has existing transactions'] }
        );
      }

      const { error } = await supabase
        .from('chart_of_accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw new ChartOfAccountsError(
          `Failed to delete account: ${error.message}`,
          { originalError: error }
        );
      }
    } catch (error) {
      if (error instanceof ChartOfAccountsError || error instanceof AccountingValidationError) {
        throw error;
      }
      throw new ChartOfAccountsError(
        'Unexpected error while deleting account',
        { originalError: error }
      );
    }
  }

  /**
   * Get account hierarchy
   */
  async getAccountHierarchy(): Promise<AccountHierarchy[]> {
    try {
      const accounts = await this.getAccounts({ isActive: true });
      return this.buildAccountHierarchy(accounts);
    } catch (error) {
      if (error instanceof ChartOfAccountsError) {
        throw error;
      }
      throw new ChartOfAccountsError(
        'Unexpected error while building account hierarchy',
        { originalError: error }
      );
    }
  }

  /**
   * Get child accounts for a parent account
   */
  async getChildAccounts(parentId: string): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('parent_account_id', parentId)
        .order('account_code');

      if (error) {
        throw new ChartOfAccountsError(
          `Failed to fetch child accounts: ${error.message}`,
          { originalError: error }
        );
      }

      return this.mapDatabaseToAccount(data || []);
    } catch (error) {
      if (error instanceof ChartOfAccountsError) {
        throw error;
      }
      throw new ChartOfAccountsError(
        'Unexpected error while fetching child accounts',
        { originalError: error }
      );
    }
  }

  /**
   * Validate account data
   */
  private async validateAccountData(accountData: CreateAccountData | UpdateAccountData): Promise<void> {
    if ('code' in accountData && accountData.code !== undefined) {
      if (!accountData.code || !/^[0-9]{3,6}$/.test(accountData.code)) {
        throw new AccountingValidationError(
          'Account code must be 3-6 digits',
          { code: ['Account code must be 3-6 digits'] }
        );
      }
    }

    if ('name' in accountData && accountData.name !== undefined) {
      if (!accountData.name || accountData.name.length < 2 || accountData.name.length > 255) {
        throw new AccountingValidationError(
          'Account name must be between 2 and 255 characters',
          { name: ['Account name must be between 2 and 255 characters'] }
        );
      }
    }

    if ('type' in accountData && accountData.type) {
      const validTypes: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];
      if (!validTypes.includes(accountData.type)) {
        throw new AccountingValidationError(
          'Invalid account type',
          { type: ['Invalid account type'] }
        );
      }
    }
  }

  /**
   * Validate parent-child relationship
   */
  private async validateParentChildRelationship(
    parentAccount: Account, 
    childAccountData: CreateAccountData | (Account & UpdateAccountData)
  ): Promise<void> {
    // Parent and child must have compatible types
    const compatibleTypes: Record<AccountType, AccountType[]> = {
      asset: ['asset'],
      liability: ['liability'],
      equity: ['equity'],
      revenue: ['revenue'],
      expense: ['expense']
    };

    const childType = 'type' in childAccountData ? childAccountData.type : childAccountData.type;
    if (!compatibleTypes[parentAccount.type].includes(childType)) {
      throw new AccountingValidationError(
        `Child account type ${childType} is not compatible with parent account type ${parentAccount.type}`,
        { type: ['Incompatible account types'] }
      );
    }
  }

  /**
   * Check if setting a parent would create a circular reference
   */
  private async wouldCreateCircularReference(accountId: string, parentId: string): Promise<boolean> {
    if (accountId === parentId) {
      return true;
    }

    const parentAccount = await this.getAccountById(parentId);
    if (!parentAccount || !parentAccount.parentId) {
      return false;
    }

    return this.wouldCreateCircularReference(accountId, parentAccount.parentId);
  }

  /**
   * Check if account has transactions
   */
  private async accountHasTransactions(accountId: string): Promise<boolean> {
    try {
      // This would need to check journal_entry_lines table
      const { data, error } = await supabase
        .from('journal_entry_lines')
        .select('id')
        .eq('account_id', accountId)
        .limit(1);

      if (error) {
        // If table doesn't exist or other error, assume no transactions
        return false;
      }

      return (data || []).length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Build account hierarchy from flat list
   */
  private buildAccountHierarchy(accounts: Account[]): AccountHierarchy[] {
    const accountMap = new Map<string, AccountHierarchy>();
    const rootAccounts: AccountHierarchy[] = [];

    // Create hierarchy objects
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        children: [],
        level: 0,
        path: []
      });
    });

    // Build hierarchy
    accounts.forEach(account => {
      const hierarchyAccount = accountMap.get(account.id)!;
      
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(hierarchyAccount);
          hierarchyAccount.level = parent.level + 1;
          hierarchyAccount.path = [...parent.path, parent.id];
        } else {
          // Parent not found, treat as root
          rootAccounts.push(hierarchyAccount);
        }
      } else {
        rootAccounts.push(hierarchyAccount);
      }
    });

    // Sort by account code
    const sortHierarchy = (accounts: AccountHierarchy[]) => {
      accounts.sort((a, b) => a.code.localeCompare(b.code));
      accounts.forEach(account => sortHierarchy(account.children));
    };

    sortHierarchy(rootAccounts);
    return rootAccounts;
  }

  /**
   * Map database records to Account objects
   */
  private mapDatabaseToAccount(data: any[]): Account[] {
    return data.map(record => ({
      id: record.id,
      code: record.account_code,
      name: record.account_name,
      type: record.account_type,
      category: record.account_category,
      parentId: record.parent_account_id,
      balance: record.balance || 0,
      isActive: record.is_active,
      description: record.description,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
  }
}

// Export singleton instance
export const chartOfAccountsService = new ChartOfAccountsService();