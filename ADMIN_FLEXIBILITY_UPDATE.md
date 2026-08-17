# Market Lens — Admin Flexibility Update

## Changes
- Admin can use up to 10 live desk slots instead of 3.
- New calls start as drafts and can be saved incomplete.
- Publishing/relisting performs strict validation.
- Draft database fields can remain empty until the call is ready.
- Admin checkout-copy editing has been removed.
- Public Live Calls now displays all live slots (up to 10).
- Contact email: marketlensbyhim@gmail.com

## Required Supabase migration
Run:
`supabase/migrations/20260817000000_admin_flexible_drafts_and_10_slots.sql`

This migration changes the call slot limit to 10 and allows incomplete draft fields to be NULL. Existing live/closed/archived calls are preserved.
