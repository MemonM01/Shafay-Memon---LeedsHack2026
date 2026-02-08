-- Refined Tag Sync Function with SECURITY DEFINER
-- This ensures that even if users don't have direct INSERT permission on the 'tags' table,
-- the trigger can still populate it automatically.

CREATE OR REPLACE FUNCTION public.sync_global_tag()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize: lowercase and trim
    NEW.tag_name := LOWER(TRIM(NEW.tag_name));
    
    -- Prevent empty tags
    IF NEW.tag_name = '' THEN 
        RETURN NULL; 
    END IF;
    
    -- Atomic insert into global tags table
    -- Runs as the function owner (SECURITY DEFINER)
    INSERT INTO public.tags (name)
    VALUES (NEW.tag_name)
    ON CONFLICT (name) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply triggers to ensure they use the updated function
DROP TRIGGER IF EXISTS tr_sync_profile_tag ON public.profile_tags;
CREATE TRIGGER tr_sync_profile_tag
BEFORE INSERT OR UPDATE ON public.profile_tags
FOR EACH ROW EXECUTE FUNCTION public.sync_global_tag();

DROP TRIGGER IF EXISTS tr_sync_event_tag ON public.event_tags;
CREATE TRIGGER tr_sync_event_tag
BEFORE INSERT OR UPDATE ON public.event_tags
FOR EACH ROW EXECUTE FUNCTION public.sync_global_tag();

-- Also ensure the RLS on tags allows the trigger to work (though SECURITY DEFINER handles this)
-- and make sure the foreign keys are set to satisfy the relation.
ALTER TABLE public.event_tags DROP CONSTRAINT IF EXISTS event_tags_tag_name_fkey;
ALTER TABLE public.event_tags ADD CONSTRAINT event_tags_tag_name_fkey 
    FOREIGN KEY (tag_name) REFERENCES public.tags(name) ON DELETE CASCADE;

ALTER TABLE public.profile_tags DROP CONSTRAINT IF EXISTS profile_tags_tag_name_fkey;
ALTER TABLE public.profile_tags ADD CONSTRAINT profile_tags_tag_name_fkey 
    FOREIGN KEY (tag_name) REFERENCES public.tags(name) ON DELETE CASCADE;
