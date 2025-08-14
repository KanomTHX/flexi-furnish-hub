import { BaseError, ErrorCategory } from './base';

/**
 * Base class for all POS integration errors
 */
export abstract class POSError extends BaseError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message, code, statusCode, true, {
      ...context,
      category: ErrorCategory.INTEGRATION,
      module: 'pos'
    });
  }
}

/**
 * Error thrown when inventory synchronization fails
 */
export class InventorySyncError extends POSError {
  public readonly syncType: string;
  public readonly retryable: boolean;

  constructor(message: string, syncType: string, retryable: boolean = true, context?: Record<string, any>) {
    super(message, 'INVENTORY_SYNC_FAILED', 502, {
      ...context,
      syncType,
      retryable
    });
    this.syncType = syncType;
    this.retryable = retryable;
  }
}

/**
 * Error thrown when stock alert processing fails
 */
export class StockAlertProcessingError extends POSError {
  public readonly alertId: string;

  constructor(message: string, alertId: string, context?: Record<string, any>) {
    super(message, 'STOCK_ALERT_PROCESSING_FAILED', 422, {
      ...context,
      alertId
    });
    this.alertId = alertId;
  }
}

/**
 * Error thrown when automatic purchase order creation fails
 */
export class AutoPurchaseOrderError extends POSError {
  public readonly productId: string;
  public readonly supplierId?: string;

  constructor(message: string, productId: string, supplierId?: string, context?: Record<string, any>) {
    super(message, 'AUTO_PURCHASE_ORDER_FAILED', 422, {
      ...context,
      productId,
      supplierId
    });
    this.productId = productId;
    this.supplierId = supplierId;
  }
}

/**
 * Error thrown when supplier-product relationship is invalid
 */
export class SupplierProductMappingError extends POSError {
  public readonly productId: string;
  public readonly supplierId: string;

  constructor(message: string, productId: string, supplierId: string, context?: Record<string, any>) {
    super(message, 'SUPPLIER_PRODUCT_MAPPING_ERROR', 400, {
      ...context,
      productId,
      supplierId
    });
    this.productId = productId;
    this.supplierId = supplierId;
  }
}

/**
 * Error thrown when POS system is unreachable
 */
export class POSSystemUnavailableError extends POSError {
  public readonly posSystemId: string;

  constructor(message: string, posSystemId: string, context?: Record<string, any>) {
    super(message, 'POS_SYSTEM_UNAVAILABLE', 503, {
      ...context,
      posSystemId
    });
    this.posSystemId = posSystemId;
  }
}

/**
 * Error thrown when inventory data is inconsistent
 */
export class InventoryDataInconsistencyError extends POSError {
  public readonly productId: string;
  public readonly posStock: number;
  public readonly systemStock: number;

  constructor(
    message: string,
    productId: string,
    posStock: number,
    systemStock: number,
    context?: Record<string, any>
  ) {
    super(message, 'INVENTORY_DATA_INCONSISTENCY', 409, {
      ...context,
      productId,
      posStock,
      systemStock
    });
    this.productId = productId;
    this.posStock = posStock;
    this.systemStock = systemStock;
  }
}

/**
 * Error thrown when reorder point calculation fails
 */
export class ReorderPointCalculationError extends POSError {
  public readonly productId: string;

  constructor(message: string, productId: string, context?: Record<string, any>) {
    super(message, 'REORDER_POINT_CALCULATION_FAILED', 422, {
      ...context,
      productId
    });
    this.productId = productId;
  }
}