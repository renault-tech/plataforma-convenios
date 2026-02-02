-- Create table to track last time a user viewed a service
CREATE TABLE IF NOT EXISTS public.user_service_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, service_id)
);

-- RLS
ALTER TABLE public.user_service_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visit logs"
    ON public.user_service_views FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own visit logs"
    ON public.user_service_views FOR ALL
    USING (auth.uid() = user_id);

-- Add updated_at trigger for convenience (though updates are manual usually)
-- Grant access
GRANT ALL ON public.user_service_views TO authenticated;
