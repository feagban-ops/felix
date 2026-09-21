-- Storage policies for outing-photos bucket
-- These policies ensure users can only access their own folder
-- Note: These need to be configured in Supabase dashboard storage policies section

-- The following policies should be created in Supabase dashboard:
-- Storage > outing-photos > Policies

-- Policy for INSERT:
-- Allow authenticated users to upload files only to their own folder (user_id/)
-- Condition: Starts with auth.uid()::text + '/'

-- Policy for SELECT:
-- Allow users to read only their own files
-- Condition: Starts with auth.uid()::text + '/'

-- Policy for DELETE:
-- Allow users to delete only their own files
-- Condition: Starts with auth.uid()::text + '/'

-- For public access (optional):
-- Allow public read on all files in outing-photos bucket
