# MarketLens deployment

This project uses TanStack Start + Nitro so the same source can be deployed to multiple runtimes.

## Local
npm install
npm run dev

## Vercel
Use the repository as-is. Vercel build command is already set in `vercel.json`:
`npm run build:vercel`
Leave Output Directory empty.

Required env vars for Razorpay testing:
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

## Netlify
Use the repository as-is. `netlify.toml` sets:
- Build: `npm run build:netlify`
- Publish: `dist/client`

## Generic Node server
Build with:
`npm run build:node`
Then:
`npm run start`

## Other Nitro-compatible hosts
Set `NITRO_PRESET` to the host's Nitro preset and run:
`npm run build`

Do not commit `.env` or secrets.
