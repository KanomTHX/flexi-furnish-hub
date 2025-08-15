-- Create comprehensive RLS policies for all sensitive tables

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