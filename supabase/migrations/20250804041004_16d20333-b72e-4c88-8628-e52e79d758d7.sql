-- Create customers table for installment management
CREATE TABLE public.customers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    id_card text,
    occupation text,
    monthly_income numeric DEFAULT 0,
    workplace text,
    work_address text,
    emergency_contact jsonb,
    credit_score integer DEFAULT 500,
    blacklisted boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Customers access for employees" 
ON public.customers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_id_card ON public.customers(id_card);
CREATE INDEX idx_customers_name ON public.customers USING gin(to_tsvector('english', name));