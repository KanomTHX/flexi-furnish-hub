-- Enable RLS and create security policies for all sensitive tables

-- First, enable RLS on tables that don't have it yet
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_log ENABLE ROW LEVEL SECURITY;

-- Create helper functions for role-based access
CREATE OR REPLACE FUNCTION public.get_current_user_branch_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_branch_id uuid;
BEGIN
  SELECT branch_id INTO user_branch_id 
  FROM public.employee_profiles 
  WHERE user_id = auth.uid();
  
  RETURN user_branch_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('admin', 'hr');
END;
$$;

-- Branches - Admin access only
CREATE POLICY "Admins can manage branches" ON public.branches
FOR ALL USING (public.is_admin());

-- Customers - Branch-based access for admins/sales
CREATE POLICY "Branch-based customer access" ON public.customers
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'sales', 'manager'))
);

-- Guarantors - Same as customers
CREATE POLICY "Branch-based guarantor access" ON public.guarantors
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'sales', 'manager'))
);

-- Installment contracts - Sensitive financial data
CREATE POLICY "Installment contract access" ON public.installment_contracts
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'manager', 'finance'))
);

-- Installment payments - Critical financial data
CREATE POLICY "Installment payment access" ON public.installment_payments
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'manager', 'finance'))
);

-- Installment plans - Admin and manager access
CREATE POLICY "Installment plan access" ON public.installment_plans
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'manager'))
);

-- Installment notifications
CREATE POLICY "Installment notification access" ON public.installment_notifications
FOR ALL USING (
  public.is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.installment_contracts ic 
    WHERE ic.id = contract_id AND ic.branch_id = public.get_current_user_branch_id()
  )
);

-- Claims - Customer service and management
CREATE POLICY "Claims access" ON public.claims
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'manager', 'customer_service'))
);

-- Products - All authenticated users can view, limited edit access
CREATE POLICY "Product view access" ON public.products
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Product manage access" ON public.products
FOR INSERT, UPDATE, DELETE USING (
  public.is_admin() OR public.get_current_user_role() IN ('manager', 'inventory')
);

-- Product categories - Same as products
CREATE POLICY "Category view access" ON public.product_categories
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Category manage access" ON public.product_categories
FOR INSERT, UPDATE, DELETE USING (
  public.is_admin() OR public.get_current_user_role() IN ('manager', 'inventory')
);

-- Product inventory - Branch-based access
CREATE POLICY "Inventory access" ON public.product_inventory
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'manager', 'inventory', 'sales'))
);

-- Purchase orders - Management and procurement access
CREATE POLICY "Purchase order access" ON public.purchase_orders
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'manager', 'procurement'))
);

CREATE POLICY "Purchase order items access" ON public.purchase_order_items
FOR ALL USING (
  public.is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.purchase_orders po 
    WHERE po.id = purchase_order_id AND po.branch_id = public.get_current_user_branch_id()
  )
);

-- Auto purchase orders - System automation
CREATE POLICY "Auto purchase order access" ON public.auto_purchase_orders
FOR ALL USING (public.is_admin() OR public.get_current_user_role() IN ('manager', 'procurement'));

CREATE POLICY "Auto purchase order items access" ON public.auto_purchase_order_items
FOR ALL USING (public.is_admin() OR public.get_current_user_role() IN ('manager', 'procurement'));

-- Accounting data - Finance team only
CREATE POLICY "Accounting transaction access" ON public.accounting_transactions
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'finance', 'manager'))
);

CREATE POLICY "Journal entry access" ON public.journal_entries
FOR ALL USING (
  public.is_admin() OR 
  (branch_id = public.get_current_user_branch_id() AND public.get_current_user_role() IN ('admin', 'finance', 'manager'))
);

CREATE POLICY "Journal entry lines access" ON public.journal_entry_lines
FOR ALL USING (
  public.is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.journal_entries je 
    WHERE je.id = journal_entry_id AND je.branch_id = public.get_current_user_branch_id()
  )
);

CREATE POLICY "Chart of accounts access" ON public.chart_of_accounts
FOR ALL USING (public.is_admin() OR public.get_current_user_role() IN ('finance', 'manager'));

-- Reconciliation data - Finance only
CREATE POLICY "Reconciliation reports access" ON public.reconciliation_reports
FOR ALL USING (public.is_admin() OR public.get_current_user_role() = 'finance');

CREATE POLICY "Reconciliation items access" ON public.reconciliation_items
FOR ALL USING (public.is_admin() OR public.get_current_user_role() = 'finance');

CREATE POLICY "Reconciliation adjustments access" ON public.reconciliation_adjustments
FOR ALL USING (public.is_admin() OR public.get_current_user_role() = 'finance');

-- Employee data - HR and admin only (except viewing own data)
CREATE POLICY "Employee data access" ON public.employees
FOR ALL USING (public.is_admin_or_hr());

-- Documents - Sensitive access
CREATE POLICY "Contract documents access" ON public.contract_documents
FOR ALL USING (
  public.is_admin() OR 
  public.get_current_user_role() IN ('manager', 'legal', 'finance')
);

CREATE POLICY "Contract history access" ON public.contract_history
FOR ALL USING (
  public.is_admin() OR 
  public.get_current_user_role() IN ('manager', 'legal', 'finance')
);

-- Notifications - Admin access
CREATE POLICY "Notification template access" ON public.notification_templates
FOR ALL USING (public.is_admin());

CREATE POLICY "Notification history access" ON public.notification_history
FOR ALL USING (public.is_admin());

-- Reports - Role-based access
CREATE POLICY "Report definition access" ON public.report_definitions
FOR ALL USING (
  public.is_admin() OR 
  public.get_current_user_role() IN ('manager', 'finance', 'hr')
);

CREATE POLICY "Report execution access" ON public.report_execution_history
FOR ALL USING (
  public.is_admin() OR 
  public.get_current_user_role() IN ('manager', 'finance', 'hr')
);

-- Integration logs - Admin only
CREATE POLICY "Integration log access" ON public.integration_sync_log
FOR ALL USING (public.is_admin());