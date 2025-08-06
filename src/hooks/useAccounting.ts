import { useState, useMemo, useCallback } from 'react';
import {
  Account,
  JournalEntry,
  Transaction,
  AccountingSummary,
  AccountFilter,
  JournalEntryFilter,
  TransactionFilter,
  JournalEntryLine,
  JournalEntryStatus
} from '@/types/accounting';
import {
  mockAccounts,
  mockJournalEntries,
  mockTransactions,
  calculateAccountingSummary
} from '@/data/mockAccountingData';

export function useAccounting() {
  // State management
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(mockJournalEntries);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  
  // Filters
  const [accountFilter, setAccountFilter] = useState<AccountFilter>({});
  const [journalEntryFilter, setJournalEntryFilter] = useState<JournalEntryFilter>({});
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>({});

  // Calculate summary
  const summary: AccountingSummary = useMemo(() => 
    calculateAccountingSummary(), 
    [accounts, journalEntries, transactions]
  );

  // Filtered data
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesType = !accountFilter.type || account.type === accountFilter.type;
      const matchesCategory = !accountFilter.category || account.category === accountFilter.category;
      const matchesActive = accountFilter.isActive === undefined || account.isActive === accountFilter.isActive;
      const matchesSearch = !accountFilter.search || 
        account.name.toLowerCase().includes(accountFilter.search.toLowerCase()) ||
        account.code.toLowerCase().includes(accountFilter.search.toLowerCase());

      return matchesType && matchesCategory && matchesActive && matchesSearch;
    });
  }, [accounts, accountFilter]);

  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      const matchesStatus = !journalEntryFilter.status || entry.status === journalEntryFilter.status;
      const matchesDateFrom = !journalEntryFilter.dateFrom || entry.date >= journalEntryFilter.dateFrom;
      const matchesDateTo = !journalEntryFilter.dateTo || entry.date <= journalEntryFilter.dateTo;
      const matchesAccount = !journalEntryFilter.accountId || 
        entry.entries.some(line => line.accountId === journalEntryFilter.accountId);
      const matchesCreatedBy = !journalEntryFilter.createdBy || entry.createdBy === journalEntryFilter.createdBy;
      const matchesSearch = !journalEntryFilter.search ||
        entry.description.toLowerCase().includes(journalEntryFilter.search.toLowerCase()) ||
        entry.entryNumber.toLowerCase().includes(journalEntryFilter.search.toLowerCase());

      return matchesStatus && matchesDateFrom && matchesDateTo && matchesAccount && matchesCreatedBy && matchesSearch;
    });
  }, [journalEntries, journalEntryFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesType = !transactionFilter.type || transaction.type === transactionFilter.type;
      const matchesStatus = !transactionFilter.status || transaction.status === transactionFilter.status;
      const matchesDateFrom = !transactionFilter.dateFrom || transaction.date >= transactionFilter.dateFrom;
      const matchesDateTo = !transactionFilter.dateTo || transaction.date <= transactionFilter.dateTo;
      const matchesSourceModule = !transactionFilter.sourceModule || transaction.sourceModule === transactionFilter.sourceModule;
      const matchesSearch = !transactionFilter.search ||
        transaction.description.toLowerCase().includes(transactionFilter.search.toLowerCase()) ||
        (transaction.reference && transaction.reference.toLowerCase().includes(transactionFilter.search.toLowerCase()));

      return matchesType && matchesStatus && matchesDateFrom && matchesDateTo && matchesSourceModule && matchesSearch;
    });
  }, [transactions, transactionFilter]);

  // Account operations
  const createAccount = useCallback((accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  }, []);

  const updateAccount = useCallback((accountId: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, ...updates, updatedAt: new Date().toISOString() }
        : account
    ));
  }, []);

  const deactivateAccount = useCallback((accountId: string) => {
    updateAccount(accountId, { isActive: false });
  }, [updateAccount]);

  // Journal Entry operations
  const createJournalEntry = useCallback((entryData: Omit<JournalEntry, 'id' | 'entryNumber' | 'createdAt' | 'updatedAt'>) => {
    const entryNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(3, '0')}`;
    const newEntry: JournalEntry = {
      ...entryData,
      id: `je-${Date.now()}`,
      entryNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setJournalEntries(prev => [...prev, newEntry]);
    return newEntry;
  }, [journalEntries.length]);

  const updateJournalEntry = useCallback((entryId: string, updates: Partial<JournalEntry>) => {
    setJournalEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
        : entry
    ));
  }, []);

  const approveJournalEntry = useCallback((entryId: string, approvedBy: string) => {
    updateJournalEntry(entryId, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString()
    });
  }, [updateJournalEntry]);

  const rejectJournalEntry = useCallback((entryId: string) => {
    updateJournalEntry(entryId, { status: 'rejected' });
  }, [updateJournalEntry]);

  // Transaction operations
  const createTransaction = useCallback((transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `txn-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction;
  }, []);

  const updateTransactionStatus = useCallback((transactionId: string, status: 'pending' | 'processed' | 'cancelled') => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === transactionId 
        ? { ...transaction, status }
        : transaction
    ));
  }, []);

  const updateTransaction = useCallback((transactionId: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === transactionId 
        ? { ...transaction, ...updates }
        : transaction
    ));
  }, []);

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== transactionId));
  }, []);

  // Filter operations
  const clearAccountFilter = useCallback(() => {
    setAccountFilter({});
  }, []);

  const clearJournalEntryFilter = useCallback(() => {
    setJournalEntryFilter({});
  }, []);

  const clearTransactionFilter = useCallback(() => {
    setTransactionFilter({});
  }, []);

  // Utility functions
  const getAccountById = useCallback((accountId: string) => {
    return accounts.find(account => account.id === accountId);
  }, [accounts]);

  const getJournalEntryById = useCallback((entryId: string) => {
    return journalEntries.find(entry => entry.id === entryId);
  }, [journalEntries]);

  const getPendingJournalEntries = useCallback(() => {
    return journalEntries.filter(entry => entry.status === 'pending');
  }, [journalEntries]);

  const getRecentTransactions = useCallback((days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return transactions.filter(transaction => new Date(transaction.date) >= cutoffDate);
  }, [transactions]);

  const getAccountBalance = useCallback((accountId: string) => {
    const account = getAccountById(accountId);
    return account ? account.balance : 0;
  }, [getAccountById]);

  // Financial statement helpers
  const getTrialBalance = useCallback(() => {
    return accounts.map(account => ({
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      balance: account.balance,
      debitTotal: account.type === 'asset' || account.type === 'expense' ? account.balance : 0,
      creditTotal: account.type === 'liability' || account.type === 'equity' || account.type === 'revenue' ? account.balance : 0
    }));
  }, [accounts]);

  return {
    // Data
    accounts: filteredAccounts,
    journalEntries: filteredJournalEntries,
    transactions: filteredTransactions,
    summary,

    // Filters
    accountFilter,
    journalEntryFilter,
    transactionFilter,
    setAccountFilter,
    setJournalEntryFilter,
    setTransactionFilter,
    clearAccountFilter,
    clearJournalEntryFilter,
    clearTransactionFilter,

    // Account operations
    createAccount,
    updateAccount,
    deactivateAccount,

    // Journal Entry operations
    createJournalEntry,
    updateJournalEntry,
    approveJournalEntry,
    rejectJournalEntry,

    // Transaction operations
    createTransaction,
    updateTransaction,
    updateTransactionStatus,
    deleteTransaction,

    // Utility functions
    getAccountById,
    getJournalEntryById,
    getPendingJournalEntries,
    getRecentTransactions,
    getAccountBalance,
    getTrialBalance
  };
}