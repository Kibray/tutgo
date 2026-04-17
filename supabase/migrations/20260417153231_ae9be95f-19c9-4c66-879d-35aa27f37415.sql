CREATE OR REPLACE FUNCTION public.seed_demo_appointments(
  p_location_id uuid,
  p_appointments jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_is_demo boolean;
  v_inserted int := 0;
  v_deleted int := 0;
BEGIN
  -- Безопасность: только владелец демо-локации может вызвать
  SELECT owner_id, COALESCE((metadata->>'is_demo')::boolean, false)
  INTO v_owner_id, v_is_demo
  FROM public.locations
  WHERE id = p_location_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Location not found';
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized: you do not own this location';
  END IF;

  IF NOT v_is_demo THEN
    RAISE EXCEPTION 'Not a demo location (metadata.is_demo must be true)';
  END IF;

  -- Отключаем все триггеры (double-booking check, telegram notify, etc.)
  PERFORM set_config('session_replication_role', 'replica', true);

  -- Удаляем старые записи демо-локации
  DELETE FROM public.appointments WHERE location_id = p_location_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Вставляем новые из JSONB-массива
  INSERT INTO public.appointments (
    location_id, service_id, staff_id,
    start_time, end_time, status,
    client_name, client_phone, client_user_id
  )
  SELECT
    (elem->>'location_id')::uuid,
    NULLIF(elem->>'service_id','')::uuid,
    NULLIF(elem->>'staff_id','')::uuid,
    (elem->>'start_time')::timestamptz,
    (elem->>'end_time')::timestamptz,
    elem->>'status',
    elem->>'client_name',
    elem->>'client_phone',
    NULLIF(elem->>'client_user_id','')::uuid
  FROM jsonb_array_elements(p_appointments) AS elem;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Включаем триггеры обратно
  PERFORM set_config('session_replication_role', 'origin', true);

  RETURN jsonb_build_object(
    'deleted', v_deleted,
    'inserted', v_inserted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_appointments(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_demo_appointments(uuid, jsonb) TO authenticated;