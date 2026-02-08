-- Add Update and Delete policies for Owners
-- Ensure events can only be updated by their owners
DO $$ BEGIN
    CREATE POLICY "Owners can update their events" ON public.events
    FOR UPDATE USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure event_tags can be deleted (for sync) by event owners
-- This is tricky because event_tags only has event_id. 
-- We join with events to check ownership.
DO $$ BEGIN
    CREATE POLICY "Owners can delete tags from their events" ON public.event_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE id = event_tags.event_id AND owner_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure event_tags can be updated/inserted by event owners
DO $$ BEGIN
    CREATE POLICY "Owners can update tags on their events" ON public.event_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE id = event_tags.event_id AND owner_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
