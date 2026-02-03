-- Create table for user inbox widget configurations
CREATE TABLE IF NOT EXISTS public.user_inbox_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    widget_type TEXT NOT NULL, -- 'preset' or 'custom'
    widget_key TEXT NOT NULL, -- e.g., 'alerts_deadlines', 'total_values', 'active_status', 'custom_1'
    config JSONB DEFAULT '{}'::jsonb, -- Widget-specific configuration (filters, display options, etc.)
    position INTEGER DEFAULT 0, -- Display order
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, widget_key)
);

-- RLS Policies
ALTER TABLE public.user_inbox_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own widgets"
    ON public.user_inbox_widgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own widgets"
    ON public.user_inbox_widgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets"
    ON public.user_inbox_widgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets"
    ON public.user_inbox_widgets FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_inbox_widgets_user_position 
ON public.user_inbox_widgets(user_id, position);

-- Grant access
GRANT ALL ON public.user_inbox_widgets TO authenticated;

-- Add date/time widget preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS datetime_widget_style TEXT DEFAULT 'compact';

-- Possible values: 'compact', 'digital', 'analog', 'verbose'
