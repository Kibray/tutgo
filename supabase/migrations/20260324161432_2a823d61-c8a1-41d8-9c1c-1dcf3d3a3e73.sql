
DO $$
DECLARE
  v_owner uuid := 'f5601d28-3685-4f1d-a6f4-ba0674ef571b';
  v_loc uuid;
  v_s1 uuid; v_s2 uuid; v_s3 uuid;
  v_sv1 uuid; v_sv2 uuid; v_sv3 uuid; v_sv4 uuid; v_sv5 uuid;
BEGIN
  v_loc := gen_random_uuid();
  v_s1 := gen_random_uuid(); v_s2 := gen_random_uuid(); v_s3 := gen_random_uuid();
  v_sv1 := gen_random_uuid(); v_sv2 := gen_random_uuid(); v_sv3 := gen_random_uuid();
  v_sv4 := gen_random_uuid(); v_sv5 := gen_random_uuid();

  INSERT INTO locations (id,owner_id,name,business_type,sub_category,address,phone,city,currency,description,metadata,lat,lng)
  VALUES (v_loc,v_owner,'Barbershop Kings 🎯 DEMO','beauty','barbershop','Ташкент, ул. Амира Темура 5','+998901234567','Ташкент','сум','Мужская парикмахерская премиум-класса.','{"is_demo":true}'::jsonb,41.3111,69.2797);

  INSERT INTO staff (id,location_id,full_name,specialties,phone,bio,working_days,working_hours) VALUES
  (v_s1,v_loc,'Бахром',ARRAY['Стрижка','Борода'],'+998901111111','Опыт 7 лет','{1,2,3,4,5,6}','{"start":"09:00","end":"19:00"}'::jsonb),
  (v_s2,v_loc,'Санжар',ARRAY['Стрижка','Детская стрижка'],'+998902222222','Опыт 4 года','{1,2,3,4,5}','{"start":"10:00","end":"20:00"}'::jsonb),
  (v_s3,v_loc,'Фаррух',ARRAY['Королевское бритьё','Борода'],'+998903333333','Опыт 10 лет','{1,2,3,4,5,6}','{"start":"09:00","end":"18:00"}'::jsonb);

  INSERT INTO services (id,location_id,name,price,duration_minutes,currency,description) VALUES
  (v_sv1,v_loc,'Стрижка',80000,30,'сум','Классическая мужская стрижка'),
  (v_sv2,v_loc,'Стрижка + борода',120000,45,'сум','Стрижка и оформление бороды'),
  (v_sv3,v_loc,'Королевское бритьё',90000,40,'сум','Бритьё опасной бритвой'),
  (v_sv4,v_loc,'Детская стрижка',60000,20,'сум','Стрижка для детей до 12 лет'),
  (v_sv5,v_loc,'Оформление бороды',50000,20,'сум','Моделирование и стрижка бороды');

  INSERT INTO deals (location_id,title,description,discount_percent,is_active) VALUES
  (v_loc,'Скидка 20% на стрижку по понедельникам','Каждый понедельник — стрижка со скидкой!',20,true),
  (v_loc,'Приведи друга — скидка 15%','Приведи друга и получи скидку 15% на любую услугу',15,true);

  -- Disable all user triggers on appointments
  ALTER TABLE appointments DISABLE TRIGGER "prevent_double_booking";
  ALTER TABLE appointments DISABLE TRIGGER "notify-appointment";
  ALTER TABLE appointments DISABLE TRIGGER "on_appointment_cancelled_telegram";
  ALTER TABLE appointments DISABLE TRIGGER "on_appointment_created_telegram";
  ALTER TABLE appointments DISABLE TRIGGER "trg_appointment_notification";
  ALTER TABLE appointments DISABLE TRIGGER "trg_telegram_client_cancelled";
  ALTER TABLE appointments DISABLE TRIGGER "trg_telegram_new_appointment";

  INSERT INTO appointments (location_id,service_id,staff_id,client_name,client_phone,start_time,end_time,status) VALUES
  (v_loc,v_sv1,v_s1,'Азиз Каримов','+998901000001',now()-interval '2d'+interval '10h',now()-interval '2d'+interval '10h30m','completed'),
  (v_loc,v_sv2,v_s1,'Азиз Каримов','+998901000001',now()-interval '15d'+interval '11h',now()-interval '15d'+interval '11h45m','completed'),
  (v_loc,v_sv1,v_s1,'Азиз Каримов','+998901000001',now()-interval '28d'+interval '9h',now()-interval '28d'+interval '9h30m','completed'),
  (v_loc,v_sv1,v_s2,'Бобур Рахимов','+998901000002',now()-interval '3d'+interval '12h',now()-interval '3d'+interval '12h30m','completed'),
  (v_loc,v_sv3,v_s3,'Бобур Рахимов','+998901000002',now()-interval '20d'+interval '14h',now()-interval '20d'+interval '14h40m','completed'),
  (v_loc,v_sv5,v_s3,'Бобур Рахимов','+998901000002',now()-interval '25d'+interval '15h',now()-interval '25d'+interval '15h20m','completed'),
  (v_loc,v_sv2,v_s1,'Давлат Усманов','+998901000003',now()-interval '5d'+interval '9h',now()-interval '5d'+interval '9h45m','completed'),
  (v_loc,v_sv5,v_s3,'Давлат Усманов','+998901000003',now()-interval '18d'+interval '16h',now()-interval '18d'+interval '16h20m','completed'),
  (v_loc,v_sv1,v_s2,'Элмурод Ташматов','+998901000004',now()-interval '1d'+interval '13h',now()-interval '1d'+interval '13h30m','confirmed'),
  (v_loc,v_sv4,v_s2,'Фаррух Алимов','+998901000005',now()-interval '7d'+interval '16h',now()-interval '7d'+interval '16h20m','completed'),
  (v_loc,v_sv1,v_s1,'Жасур Нуриллаев','+998901000006',now()-interval '4d'+interval '10h',now()-interval '4d'+interval '10h30m','completed'),
  (v_loc,v_sv3,v_s3,'Жасур Нуриллаев','+998901000006',now()-interval '22d'+interval '11h',now()-interval '22d'+interval '11h40m','completed'),
  (v_loc,v_sv3,v_s3,'Хуршид Бекмуратов','+998901000007',now()-interval '10d'+interval '11h',now()-interval '10d'+interval '11h40m','completed'),
  (v_loc,v_sv2,v_s1,'Ильхом Юсупов','+998901000008',now()-interval '8d'+interval '15h',now()-interval '8d'+interval '15h45m','completed'),
  (v_loc,v_sv1,v_s2,'Камолиддин Шарипов','+998901000009',now()-interval '6d'+interval '14h',now()-interval '6d'+interval '14h30m','completed'),
  (v_loc,v_sv1,v_s1,'Камолиддин Шарипов','+998901000009',now()-interval '26d'+interval '10h',now()-interval '26d'+interval '10h30m','completed'),
  (v_loc,v_sv5,v_s3,'Лазиз Хамидов','+998901000010',now()-interval '12d'+interval '10h',now()-interval '12d'+interval '10h20m','completed'),
  (v_loc,v_sv1,v_s1,'Мирзо Абдуллаев','+998901000011',now()-interval '35d'+interval '10h',now()-interval '35d'+interval '10h30m','completed'),
  (v_loc,v_sv2,v_s2,'Нодир Сафаров','+998901000012',now()-interval '40d'+interval '11h',now()-interval '40d'+interval '11h45m','completed'),
  (v_loc,v_sv3,v_s3,'Отабек Мирзаев','+998901000013',now()-interval '45d'+interval '12h',now()-interval '45d'+interval '12h40m','completed'),
  (v_loc,v_sv1,v_s1,'Пулат Ибрагимов','+998901000014',now()-interval '50d'+interval '14h',now()-interval '50d'+interval '14h30m','completed'),
  (v_loc,v_sv4,v_s2,'Рустам Ходжаев','+998901000015',now()-interval '38d'+interval '16h',now()-interval '38d'+interval '16h20m','completed'),
  (v_loc,v_sv2,v_s1,'Сардор Файзуллаев','+998901000016',now()-interval '42d'+interval '9h',now()-interval '42d'+interval '9h45m','completed'),
  (v_loc,v_sv5,v_s3,'Тимур Назаров','+998901000017',now()-interval '55d'+interval '10h',now()-interval '55d'+interval '10h20m','completed'),
  (v_loc,v_sv1,v_s2,'Улугбек Турсунов','+998901000018',now()-interval '48d'+interval '13h',now()-interval '48d'+interval '13h30m','completed'),
  (v_loc,v_sv3,v_s3,'Фирдавс Мухаммадиев','+998901000019',now()-interval '33d'+interval '15h',now()-interval '33d'+interval '15h40m','completed'),
  (v_loc,v_sv2,v_s1,'Хасан Джумаев','+998901000020',now()-interval '52d'+interval '11h',now()-interval '52d'+interval '11h45m','completed'),
  (v_loc,v_sv1,v_s1,'Шерзод Маматов','+998901000021',now()-interval '70d'+interval '10h',now()-interval '70d'+interval '10h30m','completed'),
  (v_loc,v_sv3,v_s3,'Яхё Рузибоев','+998901000022',now()-interval '80d'+interval '11h',now()-interval '80d'+interval '11h40m','completed'),
  (v_loc,v_sv2,v_s2,'Абдулла Халиков','+998901000023',now()-interval '90d'+interval '14h',now()-interval '90d'+interval '14h45m','completed'),
  (v_loc,v_sv4,v_s2,'Бахтиёр Юлдашев','+998901000024',now()-interval '75d'+interval '12h',now()-interval '75d'+interval '12h20m','completed'),
  (v_loc,v_sv1,v_s1,'Гайрат Ахмедов','+998901000025',now()-interval '100d'+interval '10h',now()-interval '100d'+interval '10h30m','completed'),
  (v_loc,v_sv5,v_s3,'Дилшод Расулов','+998901000026',now()-interval '65d'+interval '15h',now()-interval '65d'+interval '15h20m','completed'),
  (v_loc,v_sv2,v_s1,'Ислом Каримов','+998901000027',now()-interval '85d'+interval '11h',now()-interval '85d'+interval '11h45m','completed'),
  (v_loc,v_sv1,v_s2,'Комил Собиров','+998901000028',now()-interval '95d'+interval '13h',now()-interval '95d'+interval '13h30m','completed'),
  (v_loc,v_sv3,v_s3,'Музаффар Холматов','+998901000029',now()-interval '110d'+interval '9h',now()-interval '110d'+interval '9h40m','completed'),
  (v_loc,v_sv1,v_s1,'Нурислом Тожибоев','+998901000030',now()-interval '120d'+interval '14h',now()-interval '120d'+interval '14h30m','completed'),
  (v_loc,v_sv1,v_s1,'Новый Клиент','+998909000001',now()-interval '1d'+interval '10h',now()-interval '1d'+interval '10h30m','confirmed'),
  (v_loc,v_sv2,v_s2,'Ожидающий Клиент','+998909000002',now()-interval '1d'+interval '14h',now()-interval '1d'+interval '14h45m','pending'),
  (v_loc,v_sv3,v_s3,'Отменённый Клиент','+998909000003',now()-interval '2d'+interval '11h',now()-interval '2d'+interval '11h40m','cancelled'),
  (v_loc,v_sv1,v_s1,'Завтрашний Клиент','+998909000004',now()+interval '1d'+interval '10h',now()+interval '1d'+interval '10h30m','confirmed');

  -- Re-enable all triggers
  ALTER TABLE appointments ENABLE TRIGGER "prevent_double_booking";
  ALTER TABLE appointments ENABLE TRIGGER "notify-appointment";
  ALTER TABLE appointments ENABLE TRIGGER "on_appointment_cancelled_telegram";
  ALTER TABLE appointments ENABLE TRIGGER "on_appointment_created_telegram";
  ALTER TABLE appointments ENABLE TRIGGER "trg_appointment_notification";
  ALTER TABLE appointments ENABLE TRIGGER "trg_telegram_client_cancelled";
  ALTER TABLE appointments ENABLE TRIGGER "trg_telegram_new_appointment";

END$$;
