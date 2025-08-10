-- Create notifications table for transfer system
-- Migration for notification system

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'transfer_created',
  'transfer_received', 
  'transfer_confirmed',
  'transfer_cancelled'
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Create function to clean old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION clean_old_notifications() RETURNS void AS $
BEGIN
    DELETE FROM public.notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$ LANGUAGE plpgsql;

-- Create function to get unread count for user
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id_param UUID) 
RETURNS INTEGER AS $
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM public.notifications
    WHERE user_id = user_id_param AND is_read = false;
    
    RETURN COALESCE(unread_count, 0);
END;
$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION clean_old_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- Add comment
COMMENT ON TABLE public.notifications IS 'Stores user notifications for transfer system and other features';