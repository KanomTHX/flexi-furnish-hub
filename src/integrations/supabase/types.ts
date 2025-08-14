export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accounting_transactions: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string
          status: string | null
          total_amount: number
          transaction_date: string
          transaction_number: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type: string
          status?: string | null
          total_amount: number
          transaction_date: string
          transaction_number: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string
          status?: string | null
          total_amount?: number
          transaction_date?: string
          transaction_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          balance: number | null
          category: Database["public"]["Enums"]["account_category"]
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          category: Database["public"]["Enums"]["account_category"]
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          category?: Database["public"]["Enums"]["account_category"]
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          approved_by: string | null
          break_end: string | null
          break_start: string | null
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          location: string | null
          notes: string | null
          overtime_hours: number | null
          status: Database["public"]["Enums"]["attendance_status"] | null
          total_hours: number | null
        }
        Insert: {
          approved_by?: string | null
          break_end?: string | null
          break_start?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          location?: string | null
          notes?: string | null
          overtime_hours?: number | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          total_hours?: number | null
        }
        Update: {
          approved_by?: string | null
          break_end?: string | null
          break_start?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          overtime_hours?: number | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          total_hours?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          employee_id: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          employee_id: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          employee_id?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          admin_user_id: string | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          manager_name: string | null
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_user_id?: string | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          manager_name?: string | null
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_user_id?: string | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          manager_name?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_category: string | null
          account_code: string
          account_name: string
          account_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          parent_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_category?: string | null
          account_code: string
          account_name: string
          account_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_category?: string | null
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          branch_id: string | null
          claim_date: string
          claim_number: string
          claim_type: string
          compensation_amount: number | null
          created_at: string | null
          customer_id: string | null
          description: string
          handled_by: string | null
          id: string
          product_id: string | null
          resolution: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          claim_date: string
          claim_number: string
          claim_type: string
          compensation_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          description: string
          handled_by?: string | null
          id?: string
          product_id?: string | null
          resolution?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          claim_date?: string
          claim_number?: string
          claim_type?: string
          compensation_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          description?: string
          handled_by?: string | null
          id?: string
          product_id?: string | null
          resolution?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          contract_id: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          guarantor_id: string | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          guarantor_id?: string | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          guarantor_id?: string | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      contract_history: {
        Row: {
          action: string
          contract_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action: string
          contract_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          contract_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_history_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "installment_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          blacklisted: boolean | null
          branch_id: string | null
          created_at: string | null
          credit_limit: number | null
          credit_score: number | null
          current_balance: number | null
          customer_code: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          id: string
          id_card: string | null
          last_purchase_date: string | null
          monthly_income: number | null
          name: string
          notes: string | null
          occupation: string | null
          phone: string | null
          status: string | null
          tax_id: string | null
          total_purchases: number | null
          type: string | null
          updated_at: string | null
          work_address: string | null
          workplace: string | null
        }
        Insert: {
          address?: string | null
          blacklisted?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_score?: number | null
          current_balance?: number | null
          customer_code?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          id_card?: string | null
          last_purchase_date?: string | null
          monthly_income?: number | null
          name: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          status?: string | null
          tax_id?: string | null
          total_purchases?: number | null
          type?: string | null
          updated_at?: string | null
          work_address?: string | null
          workplace?: string | null
        }
        Update: {
          address?: string | null
          blacklisted?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_score?: number | null
          current_balance?: number | null
          customer_code?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          id_card?: string | null
          last_purchase_date?: string | null
          monthly_income?: number | null
          name?: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          status?: string | null
          tax_id?: string | null
          total_purchases?: number | null
          type?: string | null
          updated_at?: string | null
          work_address?: string | null
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          budget: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          employee_id: string
          expiry_date: string | null
          id: string
          is_required: boolean | null
          name: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_at: string | null
          url: string
        }
        Insert: {
          employee_id: string
          expiry_date?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_at?: string | null
          url: string
        }
        Update: {
          employee_id?: string
          expiry_date?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["document_type"]
          uploaded_at?: string | null
          url?: string
        }
        Relationships: []
      }
      employee_profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          employee_code: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          employee_code: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          employee_code?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          branch_id: string | null
          created_at: string | null
          department: string | null
          email: string | null
          employee_code: string
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          phone: string | null
          position: string | null
          salary: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_code: string
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_code?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      guarantors: {
        Row: {
          address: string
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          id: string
          id_card: string
          monthly_income: number
          name: string
          occupation: string
          phone: string
          updated_at: string | null
          updated_by: string | null
          work_address: string | null
          workplace: string | null
        }
        Insert: {
          address: string
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          id_card: string
          monthly_income: number
          name: string
          occupation: string
          phone: string
          updated_at?: string | null
          updated_by?: string | null
          work_address?: string | null
          workplace?: string | null
        }
        Update: {
          address?: string
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          id_card?: string
          monthly_income?: number
          name?: string
          occupation?: string
          phone?: string
          updated_at?: string | null
          updated_by?: string | null
          work_address?: string | null
          workplace?: string | null
        }
        Relationships: []
      }
      installment_contracts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          collateral: string | null
          contract_date: string | null
          contract_number: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          down_payment: number
          end_date: string
          financed_amount: number | null
          first_payment_date: string | null
          guarantor_id: string | null
          id: string
          interest_rate: number | null
          last_payment_date: string | null
          monthly_payment: number
          notes: string | null
          paid_installments: number | null
          plan_id: string | null
          processing_fee: number | null
          remaining_amount: number
          remaining_balance: number | null
          remaining_installments: number | null
          requires_guarantor: boolean | null
          start_date: string
          status: Database["public"]["Enums"]["payment_status"] | null
          terms: string | null
          total_interest: number | null
          total_months: number
          total_paid: number | null
          total_payable: number | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          collateral?: string | null
          contract_date?: string | null
          contract_number: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          down_payment: number
          end_date: string
          financed_amount?: number | null
          first_payment_date?: string | null
          guarantor_id?: string | null
          id?: string
          interest_rate?: number | null
          last_payment_date?: string | null
          monthly_payment: number
          notes?: string | null
          paid_installments?: number | null
          plan_id?: string | null
          processing_fee?: number | null
          remaining_amount: number
          remaining_balance?: number | null
          remaining_installments?: number | null
          requires_guarantor?: boolean | null
          start_date: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          terms?: string | null
          total_interest?: number | null
          total_months: number
          total_paid?: number | null
          total_payable?: number | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          collateral?: string | null
          contract_date?: string | null
          contract_number?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          down_payment?: number
          end_date?: string
          financed_amount?: number | null
          first_payment_date?: string | null
          guarantor_id?: string | null
          id?: string
          interest_rate?: number | null
          last_payment_date?: string | null
          monthly_payment?: number
          notes?: string | null
          paid_installments?: number | null
          plan_id?: string | null
          processing_fee?: number | null
          remaining_amount?: number
          remaining_balance?: number | null
          remaining_installments?: number | null
          requires_guarantor?: boolean | null
          start_date?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          terms?: string | null
          total_interest?: number | null
          total_months?: number
          total_paid?: number | null
          total_payable?: number | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contracts_guarantor"
            columns: ["guarantor_id"]
            isOneToOne: false
            referencedRelation: "guarantors"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_notifications: {
        Row: {
          amount: number | null
          contract_id: string | null
          created_at: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          message: string
          priority: string | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          amount?: number | null
          contract_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          title: string
          type: string
        }
        Update: {
          amount?: number | null
          contract_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      installment_payments: {
        Row: {
          amount_due: number
          amount_paid: number | null
          branch_id: string | null
          contract_id: string | null
          created_at: string | null
          discount: number | null
          due_date: string
          id: string
          installment_plan_id: string | null
          interest_amount: number | null
          late_fee: number | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_number: number
          principal_amount: number | null
          processed_by: string | null
          receipt_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          branch_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          discount?: number | null
          due_date: string
          id?: string
          installment_plan_id?: string | null
          interest_amount?: number | null
          late_fee?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_number: number
          principal_amount?: number | null
          processed_by?: string | null
          receipt_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          branch_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          discount?: number | null
          due_date?: string
          id?: string
          installment_plan_id?: string | null
          interest_amount?: number | null
          late_fee?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_number?: number
          principal_amount?: number | null
          processed_by?: string | null
          receipt_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_payments_installment_plan_id_fkey"
            columns: ["installment_plan_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          branch_id: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          down_payment: number | null
          down_payment_percent: number | null
          id: string
          installment_amount: number
          interest_rate: number | null
          is_active: boolean | null
          max_amount: number | null
          min_amount: number | null
          months: number | null
          name: string | null
          number_of_installments: number
          plan_number: string
          processing_fee: number | null
          requires_guarantor: boolean | null
          sales_transaction_id: string | null
          start_date: string
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          down_payment?: number | null
          down_payment_percent?: number | null
          id?: string
          installment_amount: number
          interest_rate?: number | null
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          months?: number | null
          name?: string | null
          number_of_installments: number
          plan_number: string
          processing_fee?: number | null
          requires_guarantor?: boolean | null
          sales_transaction_id?: string | null
          start_date: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          down_payment?: number | null
          down_payment_percent?: number | null
          id?: string
          installment_amount?: number
          interest_rate?: number | null
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          months?: number | null
          name?: string | null
          number_of_installments?: number
          plan_number?: string
          processing_fee?: number | null
          requires_guarantor?: boolean | null
          sales_transaction_id?: string | null
          start_date?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_sales_transaction_id_fkey"
            columns: ["sales_transaction_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          entry_date: string
          entry_number: string
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string | null
          total_credit: number
          total_debit: number
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          entry_date: string
          entry_number: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          total_credit?: number
          total_debit?: number
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          total_credit?: number
          total_debit?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string | null
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          days: number
          documents: string[] | null
          employee_id: string
          end_date: string
          id: string
          reason: string
          rejected_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          type: Database["public"]["Enums"]["leave_type"]
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          days: number
          documents?: string[] | null
          employee_id: string
          end_date: string
          id?: string
          reason: string
          rejected_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          type: Database["public"]["Enums"]["leave_type"]
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          days?: number
          documents?: string[] | null
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string
          rejected_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          type?: Database["public"]["Enums"]["leave_type"]
        }
        Relationships: []
      }
      payrolls: {
        Row: {
          allowances: Json | null
          base_salary: number
          bonus: number | null
          created_at: string | null
          deductions: Json | null
          employee_id: string
          end_date: string
          gross_pay: number
          id: string
          net_pay: number
          overtime: number | null
          paid_at: string | null
          period_month: number
          period_year: number
          social_security: number | null
          start_date: string
          status: Database["public"]["Enums"]["payroll_status"] | null
          tax: number | null
        }
        Insert: {
          allowances?: Json | null
          base_salary: number
          bonus?: number | null
          created_at?: string | null
          deductions?: Json | null
          employee_id: string
          end_date: string
          gross_pay: number
          id?: string
          net_pay: number
          overtime?: number | null
          paid_at?: string | null
          period_month: number
          period_year: number
          social_security?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["payroll_status"] | null
          tax?: number | null
        }
        Update: {
          allowances?: Json | null
          base_salary?: number
          bonus?: number | null
          created_at?: string | null
          deductions?: Json | null
          employee_id?: string
          end_date?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          overtime?: number | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
          social_security?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["payroll_status"] | null
          tax?: number | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          base_salary: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: number | null
          name: string
          permissions: string[] | null
          requirements: string[] | null
          updated_at: string | null
        }
        Insert: {
          base_salary: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name: string
          permissions?: string[] | null
          requirements?: string[] | null
          updated_at?: string | null
        }
        Update: {
          base_salary?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name?: string
          permissions?: string[] | null
          requirements?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inventory: {
        Row: {
          available_quantity: number | null
          branch_id: string | null
          id: string
          last_updated: string | null
          product_id: string | null
          quantity: number
          reserved_quantity: number | null
          status: string | null
        }
        Insert: {
          available_quantity?: number | null
          branch_id?: string | null
          id?: string
          last_updated?: string | null
          product_id?: string | null
          quantity?: number
          reserved_quantity?: number | null
          status?: string | null
        }
        Update: {
          available_quantity?: number | null
          branch_id?: string | null
          id?: string
          last_updated?: string | null
          product_id?: string | null
          quantity?: number
          reserved_quantity?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number
          created_at: string | null
          description: string | null
          id: string
          max_stock_level: number | null
          min_stock_level: number | null
          name: string
          product_code: string
          selling_price: number
          status: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          max_stock_level?: number | null
          min_stock_level?: number | null
          name: string
          product_code: string
          selling_price?: number
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          max_stock_level?: number | null
          min_stock_level?: number | null
          name?: string
          product_code?: string
          selling_price?: number
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          purchase_order_id: string | null
          quantity: number
          received_quantity: number | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchase_order_id?: string | null
          quantity: number
          received_quantity?: number | null
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          received_quantity?: number | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string | null
          supplier_contact: string | null
          supplier_name: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date: string
          order_number: string
          status?: string | null
          supplier_contact?: string | null
          supplier_name: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string | null
          supplier_contact?: string | null
          supplier_name?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          product_id: string
          quantity: number | null
          serial_number: string
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          product_id: string
          quantity?: number | null
          serial_number: string
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string
          quantity?: number | null
          serial_number?: string
          transaction_id?: string
          unit_price?: number
        }
        Relationships: []
      }
      sales_transaction_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          id: string
          product_id: string | null
          quantity: number
          total_amount: number
          transaction_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          product_id?: string | null
          quantity: number
          total_amount: number
          transaction_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          product_id?: string | null
          quantity?: number
          total_amount?: number
          transaction_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_transactions: {
        Row: {
          branch_id: string | null
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          employee_id: string | null
          id: string
          net_amount: number
          notes: string | null
          payment_method: string | null
          status: string | null
          tax_amount: number | null
          total_amount: number
          transaction_date: string | null
          transaction_number: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          employee_id?: string | null
          id?: string
          net_amount?: number
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          transaction_date?: string | null
          transaction_number: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          employee_id?: string | null
          id?: string
          net_amount?: number
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          transaction_date?: string | null
          transaction_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          warehouse_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          warehouse_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string | null
          product_id: string | null
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          product_id?: string | null
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          product_id?: string | null
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          payment_terms: number | null
          purchase_order_id: string | null
          remaining_amount: number
          status: Database["public"]["Enums"]["payment_status"] | null
          subtotal: number
          supplier_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          payment_terms?: number | null
          purchase_order_id?: string | null
          remaining_amount?: number
          status?: Database["public"]["Enums"]["payment_status"] | null
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          payment_terms?: number | null
          purchase_order_id?: string | null
          remaining_amount?: number
          status?: Database["public"]["Enums"]["payment_status"] | null
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string | null
          payment_number: string
          reference_number: string | null
          supplier_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_amount: number
          payment_date: string
          payment_method?: string | null
          payment_number: string
          reference_number?: string | null
          supplier_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          payment_number?: string
          reference_number?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          email: string | null
          id: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          status: string | null
          supplier_code: string
          supplier_name: string
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          status?: string | null
          supplier_code: string
          supplier_name: string
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          status?: string | null
          supplier_code?: string
          supplier_name?: string
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          settings: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      training_participants: {
        Row: {
          certificate: string | null
          completed_at: string | null
          employee_id: string
          enrolled_at: string | null
          feedback: string | null
          id: string
          score: number | null
          status: Database["public"]["Enums"]["participant_status"] | null
          training_id: string
        }
        Insert: {
          certificate?: string | null
          completed_at?: string | null
          employee_id: string
          enrolled_at?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["participant_status"] | null
          training_id: string
        }
        Update: {
          certificate?: string | null
          completed_at?: string | null
          employee_id?: string
          enrolled_at?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["participant_status"] | null
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_participants_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          duration: number
          end_date: string
          id: string
          instructor: string
          location: string
          materials: string[] | null
          max_participants: number | null
          requirements: string[] | null
          start_date: string
          status: Database["public"]["Enums"]["training_status"] | null
          title: string
          type: Database["public"]["Enums"]["training_type"]
          updated_at: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          duration: number
          end_date: string
          id?: string
          instructor: string
          location: string
          materials?: string[] | null
          max_participants?: number | null
          requirements?: string[] | null
          start_date: string
          status?: Database["public"]["Enums"]["training_status"] | null
          title: string
          type: Database["public"]["Enums"]["training_type"]
          updated_at?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number
          end_date?: string
          id?: string
          instructor?: string
          location?: string
          materials?: string[] | null
          max_participants?: number | null
          requirements?: string[] | null
          start_date?: string
          status?: Database["public"]["Enums"]["training_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          branch_id: string | null
          capacity: number | null
          code: string
          created_at: string | null
          id: string
          location: string | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          capacity?: number | null
          code: string
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          capacity?: number | null
          code?: string
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_journal_entry_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_payment_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_serial_number: {
        Args: { product_name: string }
        Returns: string
      }
      generate_supplier_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_supplier_monthly_trends: {
        Args: { supplier_id_param?: string }
        Returns: {
          month_year: string
          total_invoices: number
          total_amount: number
          paid_amount: number
          outstanding_amount: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_supplier_balance: {
        Args: { supplier_id: string; amount: number }
        Returns: undefined
      }
    }
    Enums: {
      account_category:
        | "current_asset"
        | "fixed_asset"
        | "intangible_asset"
        | "current_liability"
        | "long_term_liability"
        | "owner_equity"
        | "retained_earnings"
        | "sales_revenue"
        | "other_revenue"
        | "cost_of_goods_sold"
        | "operating_expense"
        | "other_expense"
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "half-day"
        | "overtime"
        | "holiday"
      claim_status: "pending" | "in_repair" | "resolved" | "rejected"
      document_type:
        | "id-card"
        | "passport"
        | "resume"
        | "certificate"
        | "contract"
        | "medical"
        | "background-check"
        | "other"
      employee_status:
        | "active"
        | "inactive"
        | "terminated"
        | "on-leave"
        | "probation"
      journal_entry_status: "draft" | "pending" | "approved" | "rejected"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type:
        | "annual"
        | "sick"
        | "maternity"
        | "paternity"
        | "emergency"
        | "unpaid"
        | "study"
        | "other"
      participant_status:
        | "enrolled"
        | "attending"
        | "completed"
        | "dropped"
        | "failed"
      payment_status: "pending" | "completed" | "overdue" | "cancelled"
      payroll_status: "draft" | "calculated" | "approved" | "paid" | "cancelled"
      product_status: "available" | "sold" | "reserved" | "damaged" | "returned"
      training_status: "planned" | "ongoing" | "completed" | "cancelled"
      training_type:
        | "orientation"
        | "skill-development"
        | "compliance"
        | "leadership"
        | "technical"
        | "soft-skills"
      transaction_type: "cash" | "installment"
      user_role:
        | "admin"
        | "manager"
        | "staff"
        | "hr"
        | "warehouse_manager"
        | "accountant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_category: [
        "current_asset",
        "fixed_asset",
        "intangible_asset",
        "current_liability",
        "long_term_liability",
        "owner_equity",
        "retained_earnings",
        "sales_revenue",
        "other_revenue",
        "cost_of_goods_sold",
        "operating_expense",
        "other_expense",
      ],
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      attendance_status: [
        "present",
        "absent",
        "late",
        "half-day",
        "overtime",
        "holiday",
      ],
      claim_status: ["pending", "in_repair", "resolved", "rejected"],
      document_type: [
        "id-card",
        "passport",
        "resume",
        "certificate",
        "contract",
        "medical",
        "background-check",
        "other",
      ],
      employee_status: [
        "active",
        "inactive",
        "terminated",
        "on-leave",
        "probation",
      ],
      journal_entry_status: ["draft", "pending", "approved", "rejected"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "annual",
        "sick",
        "maternity",
        "paternity",
        "emergency",
        "unpaid",
        "study",
        "other",
      ],
      participant_status: [
        "enrolled",
        "attending",
        "completed",
        "dropped",
        "failed",
      ],
      payment_status: ["pending", "completed", "overdue", "cancelled"],
      payroll_status: ["draft", "calculated", "approved", "paid", "cancelled"],
      product_status: ["available", "sold", "reserved", "damaged", "returned"],
      training_status: ["planned", "ongoing", "completed", "cancelled"],
      training_type: [
        "orientation",
        "skill-development",
        "compliance",
        "leadership",
        "technical",
        "soft-skills",
      ],
      transaction_type: ["cash", "installment"],
      user_role: [
        "admin",
        "manager",
        "staff",
        "hr",
        "warehouse_manager",
        "accountant",
      ],
    },
  },
} as const
