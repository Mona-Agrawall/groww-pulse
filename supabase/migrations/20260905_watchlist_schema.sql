-- 20260905_watchlist_schema.sql

-- 1. Create Stocks Table (Master Data)
CREATE TABLE IF NOT EXISTS public.stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    exchange TEXT NOT NULL,
    sector TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for stocks
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read stocks
CREATE POLICY "Stocks are readable by authenticated users" 
ON public.stocks FOR SELECT 
TO authenticated 
USING (true);

-- 2. Create Watchlists Table
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for watchlists
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Watchlists Policies
CREATE POLICY "Users can view their own watchlists"
ON public.watchlists FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlists"
ON public.watchlists FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists"
ON public.watchlists FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists"
ON public.watchlists FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Create Watchlist Items Table
CREATE TABLE IF NOT EXISTS public.watchlist_items (
    watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (watchlist_id, stock_id)
);

-- Enable RLS for watchlist_items
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- Watchlist Items Policies (Inherits access via the joined watchlist)
CREATE POLICY "Users can view their own watchlist items"
ON public.watchlist_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.watchlists w 
        WHERE w.id = watchlist_items.watchlist_id 
        AND w.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own watchlist items"
ON public.watchlist_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.watchlists w 
        WHERE w.id = watchlist_items.watchlist_id 
        AND w.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own watchlist items"
ON public.watchlist_items FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.watchlists w 
        WHERE w.id = watchlist_items.watchlist_id 
        AND w.user_id = auth.uid()
    )
);

-- 4. Reload schema cache for PostgREST to recognize the new tables and RPCs
NOTIFY pgrst, 'reload schema';
