ALTER TABLE public.staff_invites ALTER COLUMN expires_at SET DEFAULT now() + interval '30 days';
UPDATE public.staff_invites SET expires_at = created_at + interval '30 days' WHERE used_at IS NULL;