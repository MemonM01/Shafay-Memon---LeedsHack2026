-- 1. Normalization Function
CREATE OR REPLACE FUNCTION public.sync_global_tag()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tag_name := LOWER(TRIM(NEW.tag_name));
    IF NEW.tag_name = '' THEN RETURN NULL; END IF;
    
    INSERT INTO public.tags (name)
    VALUES (NEW.tag_name)
    ON CONFLICT (name) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Clean and De-duplicate existing data
-- Profile Tags
UPDATE public.profile_tags SET tag_name = LOWER(TRIM(tag_name));
DELETE FROM public.profile_tags a USING public.profile_tags b
WHERE a.profile_id = b.profile_id AND a.tag_name = b.tag_name AND a.ctid > b.ctid;

-- Event Tags
UPDATE public.event_tags SET tag_name = LOWER(TRIM(tag_name));
DELETE FROM public.event_tags a USING public.event_tags b
WHERE a.event_id = b.event_id AND a.tag_name = b.tag_name AND a.ctid > b.ctid;

-- Global Tags
INSERT INTO public.tags (name)
SELECT DISTINCT tag_name FROM public.profile_tags
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.tags (name)
SELECT DISTINCT tag_name FROM public.event_tags
ON CONFLICT (name) DO NOTHING;

-- Delete any tags that aren't normalized (rare now but good for safety)
DELETE FROM public.tags WHERE name != LOWER(TRIM(name));

-- 3. Add Constraints (Ensure referential integrity)
ALTER TABLE public.profile_tags 
DROP CONSTRAINT IF EXISTS profile_tags_tag_name_fkey,
ADD CONSTRAINT profile_tags_tag_name_fkey 
FOREIGN KEY (tag_name) REFERENCES public.tags(name) ON DELETE CASCADE;

-- 4. Set up Triggers for automatic sync
DROP TRIGGER IF EXISTS tr_sync_profile_tag ON public.profile_tags;
CREATE TRIGGER tr_sync_profile_tag
BEFORE INSERT OR UPDATE ON public.profile_tags
FOR EACH ROW EXECUTE FUNCTION public.sync_global_tag();

DROP TRIGGER IF EXISTS tr_sync_event_tag ON public.event_tags;
CREATE TRIGGER tr_sync_event_tag
BEFORE INSERT OR UPDATE ON public.event_tags
FOR EACH ROW EXECUTE FUNCTION public.sync_global_tag();
