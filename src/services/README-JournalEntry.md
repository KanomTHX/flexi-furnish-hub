# Journal Entry Service Documentation

The Journal Entry Service provides comprehensive functionality for creating, managing, and automating journal entries in the accounting system. This service is part of the advanced supplier billing features and integrates with the existing supplier invoice and payment workflows.

## Features

- ✅ **Manual Journal Entry Creation** - Create custom journal entries with multiple lines
- ✅ **Automatic Invoice Journal Entries** - Generate journal entries from supplier invoices
- ✅ **Automatic Payment Journal Entries** - Generate journal entries from supplier payments
- ✅ **Journal Entry Validation** - Comprehensive validation including balance checking
- ✅ **Journal Entry Posting** - Approve and post journal entries
- ✅ **Journal Entry Reversal** - Reverse posted journal entries with audit trail
- ✅ **Filtering and Search** - Advanced filtering and search capabilities
- ✅ **Error Handling** - Robust error handling with specific error types
- ✅ **Type Safety** - Full TypeScript support with comprehensive type definitions

## Installation and Setup

The service is already integrated into the project. To use it, simply import the service:

```typescript
import { JournalEntryService } from '@/services/journalEntryService';
```

## Basic Usage

### Creating a Manual Journal Entry

```typescript
import { JournalEntryService, CreateJournalEntryData } from '@/services/journalEntryService';

const entryData: CreateJournalEntryData = {
  date: '2024-01-15',
  description: 'Office supplies purchase',
  reference: 'REF-001',
  sourceType: 'manual',
  lines: [
    {
      accountId: 'expense-account-id',
      description: 'Office supplies',
      debitAmount: 500.00,
      creditAmount: 0
    },
    {
      accountId: 'cash-account-id',
      description: 'Cash payment',
      debitAmount: 0,
      creditAmount: 500.00
    }
  ]
};

const journalEntry = await JournalEntryService.createJournalEntry(entryData, 'user-id');
```

### Creating Journal Entry from Supplier Invoice

```typescript
const journalEntry = await JournalEntryService.createFromSupplierInvoice(invoice, 'user-id');
```

### Creating Journal Entry from Supplier Payment

```typescript
const journalEntry = await JournalEntryService.createFromSupplierPayment(payment, 'user-id');
```

## API Reference

### JournalEntryService Methods

#### `createJournalEntry(entryData, createdBy)`
Creates a new journal entry with validation.

**Parameters:**
- `entryData: CreateJournalEntryData` - The journal entry data
- `createdBy: string` - User ID of the creator

**Returns:** `Promise<JournalEntry>`

**Throws:** `AccountingValidationError`, `JournalEntryCreationError`

#### `createFromSupplierInvoice(invoice, createdBy)`
Creates a journal entry automatically from a supplier invoice.

**Parameters:**
- `invoice: SupplierInvoice` - The supplier invoice
- `createdBy: string` - User ID of the creator

**Returns:** `Promise<JournalEntry>`

**Throws:** `AccountMappingError`, `JournalEntryCreationError`

#### `createFromSupplierPayment(payment, createdBy)`
Creates a journal entry automatically from a supplier payment.

**Parameters:**
- `payment: SupplierPayment` - The supplier payment
- `createdBy: string` - User ID of the creator

**Returns:** `Promise<JournalEntry>`

**Throws:** `AccountMappingError`, `JournalEntryCreationError`

#### `postJournalEntry(entryId, approvedBy)`
Posts (approves) a draft journal entry.

**Parameters:**
- `entryId: string` - The journal entry ID
- `approvedBy: string` - User ID of the approver

**Returns:** `Promise<JournalEntry>`

**Throws:** `JournalEntryPostingError`, `AccountingValidationError`

#### `reverseJournalEntry(entryId, reason, reversedBy)`
Reverses an approved journal entry.

**Parameters:**
- `entryId: string` - The journal entry ID to reverse
- `reason: string` - Reason for reversal
- `reversedBy: string` - User ID of the person reversing

**Returns:** `Promise<JournalEntry>` - The reversal entry

**Throws:** `JournalEntryPostingError`

#### `getJournalEntryById(entryId)`
Retrieves a journal entry by ID.

**Parameters:**
- `entryId: string` - The journal entry ID

**Returns:** `Promise<JournalEntry | null>`

#### `getJournalEntries(filter)`
Retrieves journal entries with filtering and pagination.

**Parameters:**
- `filter: JournalEntryFilter` - Filter criteria

**Returns:** `Promise<{ data: JournalEntry[]; total: number }>`

#### `validateJournalEntry(entryData)`
Validates journal entry data without creating it.

**Parameters:**
- `entryData: CreateJournalEntryData` - The journal entry data to validate

**Returns:** `Promise<JournalEntryValidationResult>`

## Data Types

### CreateJournalEntryData
```typescript
interface CreateJournalEntryData {
  date: string;                    // ISO date string
  description: string;             // Entry description
  reference?: string;              // Optional reference number
  sourceType?: 'supplier_invoice' | 'supplier_payment' | 'manual' | 'adjustment';
  sourceId?: string;               // ID of source document
  lines: CreateJournalEntryLineData[];
}
```

### CreateJournalEntryLineData
```typescript
interface CreateJournalEntryLineData {
  accountId: string;               // Account ID
  description?: string;            // Line description
  debitAmount: number;             // Debit amount (0 if credit)
  creditAmount: number;            // Credit amount (0 if debit)
  reference?: string;              // Optional line reference
}
```

### JournalEntryFilter
```typescript
interface JournalEntryFilter {
  status?: JournalEntryStatus;     // Filter by status
  dateFrom?: string;               // Start date filter
  dateTo?: string;                 // End date filter
  accountId?: string;              // Filter by account
  createdBy?: string;              // Filter by creator
  sourceType?: string;             // Filter by source type
  search?: string;                 // Text search
  limit?: number;                  // Page size
  offset?: number;                 // Page offset
}
```

## Validation Rules

The service performs comprehensive validation:

### Entry Level Validation
- Description is required
- Date is required
- At least two journal entry lines are required
- Total debits must equal total credits (within 0.01 tolerance)

### Line Level Validation
- Account ID is required and must exist
- Cannot have both debit and credit amounts on the same line
- Must have either debit or credit amount (not both zero)
- Amounts cannot be negative
- Account must be active

## Error Handling

The service uses specific error types for different scenarios:

### AccountingValidationError
Thrown when validation fails. Contains detailed validation errors.

```typescript
try {
  await JournalEntryService.createJournalEntry(entryData, 'user-id');
} catch (error) {
  if (error instanceof AccountingValidationError) {
    console.log('Validation errors:', error.validationErrors);
  }
}
```

### JournalEntryCreationError
Thrown when journal entry creation fails due to database or system errors.

### JournalEntryPostingError
Thrown when posting or reversing journal entries fails.

### AccountMappingError
Thrown when required accounts are not found or properly configured.

## Account Mapping

The service requires proper account mapping for automatic journal entry creation:

### Required Accounts for Invoice Entries
- `EXPENSE` or `INVENTORY` - For the purchase amount
- `VAT_INPUT` - For input VAT (if applicable)
- `ACCOUNTS_PAYABLE` - For the payable amount

### Required Accounts for Payment Entries
- `ACCOUNTS_PAYABLE` - For reducing the payable
- Payment method accounts:
  - `CASH` - For cash payments
  - `BANK` - For bank transfers, checks
  - `CREDIT_CARD` - For credit card payments
  - `DIGITAL_WALLET` - For digital wallet payments

## React Components

### JournalEntryForm
A comprehensive form component for creating manual journal entries.

```typescript
import { JournalEntryForm } from '@/components/accounting/JournalEntryForm';

<JournalEntryForm
  accounts={accounts}
  onSuccess={(entry) => console.log('Created:', entry)}
  onCancel={() => console.log('Cancelled')}
/>
```

### JournalEntryList
A component for displaying and managing journal entries.

```typescript
import { JournalEntryList } from '@/components/accounting/JournalEntryList';

<JournalEntryList
  onEntrySelect={(entry) => console.log('Selected:', entry)}
  refreshTrigger={refreshCounter}
/>
```

## Database Schema

The service works with the following database tables:

### journal_entries
- `id` - Primary key
- `entry_number` - Unique entry number
- `date` - Entry date
- `description` - Entry description
- `reference` - Optional reference
- `total_debit` - Total debit amount
- `total_credit` - Total credit amount
- `status` - Entry status (draft, approved, rejected)
- `source_type` - Source type
- `source_id` - Source document ID
- `created_by` - Creator user ID
- `approved_by` - Approver user ID
- `approved_at` - Approval timestamp

### journal_entry_lines
- `id` - Primary key
- `journal_entry_id` - Foreign key to journal_entries
- `account_id` - Foreign key to chart_of_accounts
- `description` - Line description
- `debit_amount` - Debit amount
- `credit_amount` - Credit amount
- `reference` - Optional line reference

## Testing

The service includes comprehensive unit tests covering:

- Journal entry creation
- Validation logic
- Error handling
- Invoice and payment integration
- Posting and reversal functionality

Run tests with:
```bash
npm test -- src/tests/journalEntryService.unit.test.ts
```

## Best Practices

1. **Always validate before creating** - Use `validateJournalEntry()` to check data before creation
2. **Handle errors appropriately** - Use specific error types for better error handling
3. **Use transactions** - The service handles database transactions internally
4. **Audit trail** - All operations are logged with user information
5. **Balance checking** - Always ensure debits equal credits
6. **Account verification** - Verify accounts exist and are active before use

## Integration Examples

See `src/examples/journal-entry-usage.ts` for comprehensive usage examples including:

- Manual journal entries
- Automatic invoice/payment entries
- Validation examples
- Error handling patterns
- Batch operations
- Complete workflows

## Future Enhancements

Planned features for future releases:

- [ ] Recurring journal entries
- [ ] Journal entry templates
- [ ] Bulk import/export
- [ ] Advanced reporting
- [ ] Integration with external accounting systems
- [ ] Workflow approvals
- [ ] Journal entry attachments

## Support

For questions or issues with the Journal Entry Service:

1. Check the examples in `src/examples/journal-entry-usage.ts`
2. Review the unit tests for usage patterns
3. Check error messages for specific guidance
4. Ensure proper account mapping configuration

## Changelog

### Version 1.0.0
- Initial implementation
- Manual journal entry creation
- Automatic invoice/payment journal entries
- Validation and error handling
- Posting and reversal functionality
- React components
- Comprehensive testing