-- Add optional device_id column to link entries to anonymous devices.
-- Nullable for backwards compatibility with existing rows.
alter table rankings
  add column if not exists device_id uuid;

create index if not exists rankings_device_id_idx on rankings(device_id)
  where device_id is not null;
