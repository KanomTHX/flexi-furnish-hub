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
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      claims: {
        Row: {
          claim_number: string
          claim_type: string
          created_at: string
          customer_name: string
          customer_phone: string | null
          description: string
          id: string
          notes: string | null
          repair_cost: number | null
          reported_date: string
          resolved_date: string | null
          serial_number: string
          status: Database["public"]["Enums"]["claim_status"] | null
          updated_at: string
        }
        Insert: {
          claim_number: string
          claim_type: string
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          description: string
          id?: string
          notes?: string | null
          repair_cost?: number | null
          reported_date?: string
          resolved_date?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["claim_status"] | null
          updated_at?: string
        }
        Update: {
          claim_number?: string
          claim_type?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          description?: string
          id?: string
          notes?: string | null
          repair_cost?: number | null
          reported_date?: string
          resolved_date?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["claim_status"] | null
          updated_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "employee_profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          avatar: string | null
          bank_account: Json | null
          created_at: string | null
          created_by: string
          date_of_birth: string | null
          department_id: string | null
          email: string | null
          emergency_contact: Json | null
          employee_id: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          phone: string | null
          position_id: string | null
          salary: number
          status: Database["public"]["Enums"]["employee_status"] | null
          updated_at: string | null
          updated_by: string
          work_schedule: Json | null
        }
        Insert: {
          address?: string | null
          avatar?: string | null
          bank_account?: Json | null
          created_at?: string | null
          created_by: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_id: string
          first_name: string
          hire_date: string
          id?: string
          last_name: string
          phone?: string | null
          position_id?: string | null
          salary: number
          status?: Database["public"]["Enums"]["employee_status"] | null
          updated_at?: string | null
          updated_by: string
          work_schedule?: Json | null
        }
        Update: {
          address?: string | null
          avatar?: string | null
          bank_account?: Json | null
          created_at?: string | null
          created_by?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_id?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          phone?: string | null
          position_id?: string | null
          salary?: number
          status?: Database["public"]["Enums"]["employee_status"] | null
          updated_at?: string | null
          updated_by?: string
          work_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_contracts: {
        Row: {
          contract_number: string
          created_at: string
          down_payment: number
          end_date: string
          id: string
          interest_rate: number | null
          monthly_payment: number
          remaining_amount: number
          start_date: string
          status: Database["public"]["Enums"]["payment_status"] | null
          total_months: number
          transaction_id: string
          updated_at: string
        }
        Insert: {
          contract_number: string
          created_at?: string
          down_payment: number
          end_date: string
          id?: string
          interest_rate?: number | null
          monthly_payment: number
          remaining_amount: number
          start_date: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_months: number
          transaction_id: string
          updated_at?: string
        }
        Update: {
          contract_number?: string
          created_at?: string
          down_payment?: number
          end_date?: string
          id?: string
          interest_rate?: number | null
          monthly_payment?: number
          remaining_amount?: number
          start_date?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_months?: number
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_contracts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_payments: {
        Row: {
          amount_due: number
          amount_paid: number | null
          contract_id: string
          created_at: string
          due_date: string
          id: string
          late_fee: number | null
          notes: string | null
          payment_date: string | null
          payment_number: number
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          late_fee?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_number: number
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          late_fee?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_number?: number
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "installment_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachments: string[] | null
          created_at: string | null
          created_by: string
          date: string
          description: string
          entry_number: string
          id: string
          reference: string | null
          status: Database["public"]["Enums"]["journal_entry_status"] | null
          total_credit: number
          total_debit: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          created_at?: string | null
          created_by: string
          date: string
          description: string
          entry_number: string
          id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["journal_entry_status"] | null
          total_credit?: number
          total_debit?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          created_at?: string | null
          created_by?: string
          date?: string
          description?: string
          entry_number?: string
          id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["journal_entry_status"] | null
          total_credit?: number
          total_debit?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
          reference: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
          reference?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "payrolls_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      product_inventory: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          notes: string | null
          product_id: string
          purchase_price: number | null
          received_date: string | null
          selling_price: number | null
          serial_number: string
          status: Database["public"]["Enums"]["product_status"] | null
          supplier_info: Json | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          purchase_price?: number | null
          received_date?: string | null
          selling_price?: number | null
          serial_number: string
          status?: Database["public"]["Enums"]["product_status"] | null
          supplier_info?: Json | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          purchase_price?: number | null
          received_date?: string | null
          selling_price?: number | null
          serial_number?: string
          status?: Database["public"]["Enums"]["product_status"] | null
          supplier_info?: Json | null
          updated_at?: string
          warranty_expiry?: string | null
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
          base_price: number
          brand: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          model: string | null
          name: string
          specifications: Json | null
          updated_at: string
        }
        Insert: {
          base_price: number
          brand?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          name: string
          specifications?: Json | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          brand?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          name?: string
          specifications?: Json | null
          updated_at?: string
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
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_transactions: {
        Row: {
          branch_id: string
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          discount_amount: number | null
          employee_id: string
          id: string
          notes: string | null
          paid_amount: number | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          tax_amount: number | null
          total_amount: number
          transaction_date: string
          transaction_number: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number | null
          employee_id: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          tax_amount?: number | null
          total_amount: number
          transaction_date?: string
          transaction_number: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number | null
          employee_id?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          tax_amount?: number | null
          total_amount?: number
          transaction_date?: string
          transaction_number?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
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
            foreignKeyName: "sales_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          employee_id: string
          from_branch_id: string | null
          id: string
          movement_date: string
          movement_type: string
          notes: string | null
          reference_id: string | null
          serial_number: string
          to_branch_id: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          from_branch_id?: string | null
          id?: string
          movement_date?: string
          movement_type: string
          notes?: string | null
          reference_id?: string | null
          serial_number: string
          to_branch_id?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          from_branch_id?: string | null
          id?: string
          movement_date?: string
          movement_type?: string
          notes?: string | null
          reference_id?: string | null
          serial_number?: string
          to_branch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "training_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_serial_number: {
        Args: { product_name: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
