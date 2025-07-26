-- Quick cleanup and setup script (Simplified)
-- Run this in Supabase SQL Editor

-- Cleanup
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS payout_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_unpaid_earnings(UUID) CASCADE;

-- Create users table with new fields
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    payout_method TEXT CHECK (payout_method IN ('paypal', 'wise', 'bank_transfer')),
    payout_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    program TEXT NOT NULL,
    lead_note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    price DECIMAL(10,2),
    paid BOOLEAN DEFAULT FALSE,
    call_requested BOOLEAN DEFAULT FALSE,
    call_meeting_link TEXT,
    admin_note TEXT,
    payout_request_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payout_requests table
CREATE TABLE payout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL,
    details JSONB NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE leads ADD CONSTRAINT fk_payout_request 
    FOREIGN KEY (payout_request_id) REFERENCES payout_requests(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies for users (no admin policies to avoid recursion)
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Simple RLS Policies for leads
CREATE POLICY "Users can view their own leads" ON leads FOR SELECT USING (affiliate_id = auth.uid());
CREATE POLICY "Users can insert their own leads" ON leads FOR INSERT WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "Users can update their own leads" ON leads FOR UPDATE USING (affiliate_id = auth.uid()) WITH CHECK (affiliate_id = auth.uid());

-- Simple RLS Policies for payout_requests
CREATE POLICY "Users can view their own payout requests" ON payout_requests FOR SELECT USING (affiliate_id = auth.uid());
CREATE POLICY "Users can insert their own payout requests" ON payout_requests FOR INSERT WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "Users can update their own payout requests" ON payout_requests FOR UPDATE USING (affiliate_id = auth.uid()) WITH CHECK (affiliate_id = auth.uid());

-- Create indexes
CREATE INDEX idx_leads_affiliate_id ON leads(affiliate_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_payout_requests_affiliate_id ON payout_requests(affiliate_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, is_admin)
    VALUES (NEW.id, NEW.email, '', '', false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unpaid_earnings(user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_earnings DECIMAL := 0;
BEGIN
    SELECT COALESCE(SUM(price), 0)
    INTO total_earnings
    FROM leads
    WHERE affiliate_id = user_id 
    AND status = 'approved' 
    AND paid = false;
    
    RETURN total_earnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Note: Admin policies will be added manually after initial setup
-- You can temporarily disable RLS for admin operations or add admin policies later
-- using the Supabase dashboard with a service role key 