CREATE OR REPLACE FUNCTION public.recalc_cafe_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  it jsonb;
  v_item_id text;
  v_qty numeric;
  v_base numeric;
  v_mods numeric;
  v_total numeric := 0;
  v_uuid uuid;
BEGIN
  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' THEN
    RAISE EXCEPTION 'Invalid order items';
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    v_item_id := it->>'item_id';
    v_qty := COALESCE((it->>'quantity')::numeric, 0);

    IF v_item_id IS NULL THEN
      RAISE EXCEPTION 'Order item is missing item_id';
    END IF;

    IF v_item_id LIKE 'combo-%' THEN
      BEGIN
        v_uuid := substring(v_item_id from 7)::uuid;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Invalid combo id: %', v_item_id;
      END;

      SELECT combo_price INTO v_base
      FROM public.menu_combos
      WHERE id = v_uuid
        AND location_id = NEW.location_id
        AND is_active = true;

      IF v_base IS NULL THEN
        RAISE EXCEPTION 'Combo not found or inactive: %', v_item_id;
      END IF;
    ELSE
      BEGIN
        v_uuid := v_item_id::uuid;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Invalid menu item id: %', v_item_id;
      END;

      SELECT price INTO v_base
      FROM public.menu_items
      WHERE id = v_uuid
        AND location_id = NEW.location_id;

      IF v_base IS NULL THEN
        RAISE EXCEPTION 'Menu item not found: %', v_item_id;
      END IF;
    END IF;

    SELECT COALESCE(SUM(COALESCE((m->>'priceAdd')::numeric, 0)), 0)
    INTO v_mods
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(it->'modifiers') = 'array' THEN it->'modifiers' ELSE '[]'::jsonb END
    ) AS m;

    v_total := v_total + (v_base + v_mods) * v_qty;
  END LOOP;

  NEW.total_amount := v_total::integer;
  NEW.final_amount := GREATEST(NEW.total_amount - COALESCE(NEW.discount, 0), 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cafe_orders_recalc_total ON public.cafe_orders;

CREATE TRIGGER cafe_orders_recalc_total
BEFORE INSERT ON public.cafe_orders
FOR EACH ROW
EXECUTE FUNCTION public.recalc_cafe_order_total();