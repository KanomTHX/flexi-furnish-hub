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

CREATE POLICY "Product insert access" ON public.products
FOR INSERT WITH CHECK (
  public.is_admin() OR public.get_current_user_role() IN ('manager', 'inventory')
);

CREATE POLICY "Product update access" ON public.products
FOR UPDATE USING (
  public.is_admin() OR public.get_current_user_role() IN ('manager', 'inventory')
);

CREATE POLICY "Product delete access" ON public.products
FOR DELETE USING (
  public.is_admin() OR public.get_current_user_role() IN ('manager', 'inventory')
);

-- Product categories - Same as products  
CREATE POLICY "Category view access" ON public.product_categories
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Category insert access" ON public.product_categories
FOR INSERT WITH CHECK (
  public.is_admin() OR public.get_current_user_role() IN ('manager', 'inventory')
);

CREATE POLICY "Category update access" ON public.product_categories
FOR UPDATE USING (
  public.is_admin() OR public.get_current_user_role() IN ('manager', 'inventory')
);

CREATE POLICY "Category delete access" ON public.product_categories
FOR DELETE USING (
  public.is_admin() OR public.get_current_user_role() IN ('manager', 'inventory')
);