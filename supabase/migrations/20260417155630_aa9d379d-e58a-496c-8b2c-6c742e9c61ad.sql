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
  v_owner uuid;
  v_inserted int := 0;
  v_deleted int := 0;
BEGIN
  -- Проверяем, что вызывающий — владелец локации
  SELECT owner_id INTO v_owner FROM public.locations WHERE id = p_location_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized: location not found or not owned by caller';
  END IF;

  -- Отключаем триггеры на время массовой вставки
  ALTER TABLE public.appointments DISABLE TRIGGER "prevent_double_booking";
  ALTER TABLE public.appointments DISABLE TRIGGER "notify-appointment";
  ALTER TABLE public.appointments DISABLE TRIGGER "on_appointment_created_telegram";
  ALTER TABLE public.appointments DISABLE TRIGGER "on_appointment_cancelled_telegram";
  ALTER TABLE public.appointments DISABLE TRIGGER "trg_appointment_notification";
  ALTER TABLE public.appointments DISABLE TRIGGER "trg_telegram_new_appointment";
  ALTER TABLE public.appointments DISABLE TRIGGER "trg_telegram_client_cancelled";

  BEGIN
    -- Удаляем старые записи этой локации (только при первом чанке вызывающий сам решает)
    -- Но безопаснее: чистим только если явно передан флаг через первый элемент? 
    -- Проще: всегда чистим записи без id, чтобы накапливать чанками — здесь делаем так:
    -- Если передан p_appointments[0] с ключом __reset__=true, чистим
    IF jsonb_typeof(p_appointments) = 'array'
       AND jsonb_array_length(p_appointments) > 0
       AND COALESCE((p_appointments->0->>'__reset__')::boolean, false) = true THEN
      DELETE FROM public.appointments WHERE location_id = p_location_id;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
    END IF;

    -- Вставляем новые записи (пропускаем сигнальный элемент с __reset__)
    INSERT INTO public.appointments (
      location_id, service_id, staff_id, start_time, end_time,
      status, client_name, client_phone, client_user_id
    )
    SELECT
      p_location_id,
      NULLIF(elem->>'service_id','')::uuid,
      NULLIF(elem->>'staff_id','')::uuid,
      (elem->>'start_time')::timestamptz,
      (elem->>'end_time')::timestamptz,
      COALESCE(elem->>'status','confirmed'),
      elem->>'client_name',
      elem->>'client_phone',
      NULLIF(elem->>'client_user_id','')::uuid
    FROM jsonb_array_elements(p_appointments) elem
    WHERE COALESCE((elem->>'__reset__')::boolean, false) = false;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;

  EXCEPTION WHEN OTHERS THEN
    -- Включаем триггеры обратно даже при ошибке
    ALTER TABLE public.appointments ENABLE TRIGGER "prevent_double_booking";
    ALTER TABLE public.appointments ENABLE TRIGGER "notify-appointment";
    ALTER TABLE public.appointments ENABLE TRIGGER "on_appointment_created_telegram";
    ALTER TABLE public.appointments ENABLE TRIGGER "on_appointment_cancelled_telegram";
    ALTER TABLE public.appointments ENABLE TRIGGER "trg_appointment_notification";
    ALTER TABLE public.appointments ENABLE TRIGGER "trg_telegram_new_appointment";
    ALTER TABLE public.appointments ENABLE TRIGGER "trg_telegram_client_cancelled";
    RAISE;
  END;

  -- Включаем триггеры обратно
  ALTER TABLE public.appointments ENABLE TRIGGER "prevent_double_booking";
  ALTER TABLE public.appointments ENABLE TRIGGER "notify-appointment";
  ALTER TABLE public.appointments ENABLE TRIGGER "on_appointment_created_telegram";
  ALTER TABLE public.appointments ENABLE TRIGGER "on_appointment_cancelled_telegram";
  ALTER TABLE public.appointments ENABLE TRIGGER "trg_appointment_notification";
  ALTER TABLE public.appointments ENABLE TRIGGER "trg_telegram_new_appointment";
  ALTER TABLE public.appointments ENABLE TRIGGER "trg_telegram_client_cancelled";

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'deleted', v_deleted
  );
END;
$$;