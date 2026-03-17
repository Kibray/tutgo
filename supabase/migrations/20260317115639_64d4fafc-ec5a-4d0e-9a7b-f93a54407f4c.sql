-- Re-attach trigger functions to their respective tables

-- Appointment created → notify business via Telegram
CREATE OR REPLACE TRIGGER on_appointment_created_telegram
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_appointment();

-- Appointment cancelled by client → notify business
CREATE OR REPLACE TRIGGER on_appointment_cancelled_telegram
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_client_cancelled();

-- Review created → notify business
CREATE OR REPLACE TRIGGER on_review_created_telegram
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_review();

-- Deal created → notify subscribers
CREATE OR REPLACE TRIGGER on_deal_created_telegram
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_deal();

-- Table reservation created → notify business
CREATE OR REPLACE TRIGGER on_reservation_created_telegram
  AFTER INSERT ON public.table_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_reservation();

-- Cafe order created → notify business
CREATE OR REPLACE TRIGGER on_cafe_order_created_telegram
  AFTER INSERT ON public.cafe_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_cafe_order();

-- Partner application → notify admin
CREATE OR REPLACE TRIGGER on_partner_application_telegram
  AFTER INSERT ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_partner();