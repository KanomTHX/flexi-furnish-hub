// Common TypeScript types and interfaces

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DatabaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface UserContext {
  userId: string;
  role: string;
  branchId?: string;
  permissions: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  progress?: number;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event types
export interface AppEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  userId?: string;
}

// Form types
export interface FormField<T = unknown> {
  name: string;
  value: T;
  error?: string;
  touched: boolean;
  required: boolean;
}

export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}