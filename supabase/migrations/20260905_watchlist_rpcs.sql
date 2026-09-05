-- 20260905_watchlist_rpcs.sql
-- These functions use SECURITY INVOKER to ensure RLS policies are strictly enforced during execution.

-- 1. Create a watchlist and its items atomically
CREATE OR REPLACE FUNCTION public.create_watchlist_with_items(
  p_name TEXT,
  p_symbols TEXT[],
  p_is_default BOOLEAN DEFAULT false
) RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_watchlist_id UUID;
  v_stock_id UUID;
  v_symbol TEXT;
  v_result json;
BEGIN
  -- Insert the watchlist
  INSERT INTO public.watchlists (user_id, name, is_default)
  VALUES (auth.uid(), p_name, p_is_default)
  RETURNING id INTO v_watchlist_id;

  -- Insert items if symbols are provided
  IF array_length(p_symbols, 1) > 0 THEN
    FOREACH v_symbol IN ARRAY p_symbols
    LOOP
      -- Resolve stock_id
      SELECT id INTO v_stock_id FROM public.stocks WHERE symbol = v_symbol;
      
      IF v_stock_id IS NOT NULL THEN
        -- Insert item, ignoring duplicates just in case
        INSERT INTO public.watchlist_items (watchlist_id, stock_id)
        VALUES (v_watchlist_id, v_stock_id)
        ON CONFLICT (watchlist_id, stock_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- Return the created watchlist with its structure
  SELECT json_build_object(
    'id', w.id,
    'name', w.name,
    'isDefault', w.is_default,
    'createdAt', extract(epoch from w.created_at) * 1000,
    'updatedAt', extract(epoch from w.updated_at) * 1000,
    'symbols', COALESCE(
      (
        SELECT json_agg(s.symbol)
        FROM public.watchlist_items wi
        JOIN public.stocks s ON s.id = wi.stock_id
        WHERE wi.watchlist_id = w.id
      ),
      '[]'::json
    )
  ) INTO v_result
  FROM public.watchlists w
  WHERE w.id = v_watchlist_id;

  RETURN v_result;
END;
$$;


-- 2. Idempotent initialization of the default watchlist
CREATE OR REPLACE FUNCTION public.ensure_default_watchlist()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_count INT;
  v_watchlist_id UUID;
  v_result json;
BEGIN
  -- Check if user already has watchlists
  SELECT count(*) INTO v_count FROM public.watchlists WHERE user_id = auth.uid();
  
  IF v_count = 0 THEN
    -- Create default watchlist using our atomic function
    SELECT public.create_watchlist_with_items(
      'Primary Watchlist',
      ARRAY['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'TATAMOTORS'],
      true
    ) INTO v_result;

    -- Extract the new watchlist ID from the JSON result
    v_watchlist_id := (v_result->>'id')::UUID;

    -- Update active watchlist in profile
    UPDATE public.profiles 
    SET active_watchlist_id = v_watchlist_id 
    WHERE id = auth.uid();

    RETURN v_result;
  END IF;

  RETURN NULL;
END;
$$;


-- 3. Replace watchlist items atomically (for PUT /update)
CREATE OR REPLACE FUNCTION public.replace_watchlist_items(
  p_watchlist_id UUID,
  p_name TEXT,
  p_symbols TEXT[]
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_stock_id UUID;
  v_symbol TEXT;
BEGIN
  -- Security Invoker + RLS ensures the user can only update their own watchlist
  UPDATE public.watchlists
  SET name = p_name, updated_at = NOW()
  WHERE id = p_watchlist_id;

  -- Delete existing items
  DELETE FROM public.watchlist_items WHERE watchlist_id = p_watchlist_id;

  -- Insert new items
  IF array_length(p_symbols, 1) > 0 THEN
    FOREACH v_symbol IN ARRAY p_symbols
    LOOP
      SELECT id INTO v_stock_id FROM public.stocks WHERE symbol = v_symbol;
      IF v_stock_id IS NOT NULL THEN
        INSERT INTO public.watchlist_items (watchlist_id, stock_id)
        VALUES (p_watchlist_id, v_stock_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$;
