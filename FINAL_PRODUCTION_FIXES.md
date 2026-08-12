# Market Lens — Production Fixes

This build is based on the mobile-responsive Market Lens project and includes the production fixes below.

## Admin / Supabase
- Admin create and edit operations now wait for Supabase confirmation before navigating away.
- Supabase save errors are shown in the Admin UI instead of being silently swallowed.
- Admin reads the full `calls` table, including draft calls, so a failed publish no longer makes a saved draft appear to vanish.
- Public polling is disabled while inside `/admin`, so the 30-second public refresh cannot overwrite the Admin state.
- Re-listing closed/archived/draft calls uses a dedicated validated server operation.
- Update operations verify that the target row actually exists.
- `checkout_headline` and `checkout_subtext` are included in the database migration and generated types.
- `calls_public` migration includes the checkout fields.
- Live public calls are locked based on `state === 'live'`, not on whether a base-table entry happens to be NULL.
- P&L percentage helpers guard against zero/invalid entry values, preventing `NaN` in Admin.

## Mobile / iPhone
- Viewport uses `viewport-fit=cover`.
- Header uses iOS safe-area insets.
- Global horizontal overflow is prevented without disabling intentional ticker movement.
- Mobile flex/grid children are allowed to shrink instead of forcing the viewport wider.
- Long mobile text wraps safely.
- Fixed payment bar respects the iPhone bottom safe area.

## Preview / thumbnail
- High-resolution 2400x1260 Open Graph PNG.
- JPEG fallback included.
- OG width/height/type metadata added.
- 512px favicon and SVG favicon are both referenced.
- 180px Apple touch icon retained.

## Database note
The current production database already has the missing checkout columns because they were added manually during setup. The included Supabase migration also contains the fix so a fresh database receives the same schema.

## 2026-08-12 — Legacy chart series compatibility fix

Fixed Admin edit/save failures caused by legacy `calls.series` JSON containing objects instead of the current `number[]` contract. Added a central normalizer that accepts numeric points and common legacy object shapes (`value`, `y`, `price`, `close`, `currentPrice`, `v`) and converts them to numbers before validation and rendering. Admin saves now write the normalized numeric series back to Supabase.
