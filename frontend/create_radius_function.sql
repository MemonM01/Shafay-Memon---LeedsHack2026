-- Create a function to find events within a radius
-- This assumes you have 'latitude' and 'longitude' columns in your 'events' table
-- And they are of type float or decimal

create or replace function public.get_events_in_radius(
  lat float,
  lng float,
  radius_meters float
)
returns setof public.events
language sql
as $$
  select *
  from public.events
  where (
    6371000 * acos(
      least(1.0, greatest(-1.0, 
        cos(radians(lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(lng)) +
        sin(radians(lat)) * sin(radians(latitude))
      ))
    )
  ) <= radius_meters;
$$;
