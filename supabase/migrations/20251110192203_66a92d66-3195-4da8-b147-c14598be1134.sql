-- Add birthday column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS birthday DATE;