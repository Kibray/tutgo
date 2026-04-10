-- Добавляем политику, чтобы владелец мог видеть ВСЕ свои акции (активные и неактивные)
CREATE POLICY "Owners can view own deals"
ON public.deals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.locations 
    WHERE locations.id = deals.location_id 
    AND locations.owner_id = auth.uid()
  )
);