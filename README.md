# Market Lens Pro

Build a new web app from scratch called:

MARKET LENS BY HIM

I want this to feel like a premium, modern trading app rather than a traditional stock-market website.

I have attached a few trading-app screenshots as UX inspiration. Study them for the way they present live trades, large numbers, cards, filters, navigation and mobile interaction. Do NOT copy them. Create an original visual language for Market Lens.

I want you to use your own design creativity and judgment.

CORE PRODUCT

Market Lens is a platform where users can discover stock market calls/research.

The main experience should be:

LIVE CALLS

→ users see currently active calls

→ some calls are paid

→ users can see key information before purchasing

→ detailed research is locked for paid calls

CLOSED CALLS

→ completed calls

→ show entry, exit and performance

→ detailed research becomes free after the call is closed

RESEARCH

→ archive of previous research/calls

The app should be extremely easy to understand when someone opens it from WhatsApp on a phone.

The live calls should be the hero of the product, not a marketing landing page.

DESIGN DIRECTION

Create something that feels:

- premium

- modern fintech

- sophisticated

- data-focused

- mobile-first

- visually distinctive

- trustworthy

- slightly futuristic

I'm open to gradients, subtle glows, interesting card treatments, charts, depth and motion. Use them intelligently rather than following a fixed design system.

You can take inspiration from modern trading apps, fintech products and premium financial dashboards, but the final interface must feel original to Market Lens.

Brand name:

MARKET LENS BY HIM

Use a dark premium base, with sophisticated accent colors and strong typography. You can explore the exact palette yourself.

The most important visual elements should be the actual market numbers:

potential, price, entry, target, stop loss and performance.

MOBILE FIRST

Design the experience primarily for phones, then make it excellent on desktop.

On mobile, think about:

- thumb-friendly interaction

- bottom navigation

- swipeable filters

- large readable numbers

- compact but informative cards

- fast scanning

On desktop, allow the interface to breathe and use a wider card/grid layout.

CORE SCREENS

Create:

1. Live Calls

2. Closed Calls

3. Individual Call / Research page

4. Research archive

5. Admin dashboard

6. Add/Edit Call

Use realistic mock stock data for now.

A call should contain information such as:

stock name

ticker

current price

entry

target

stop loss

potential

term

date

research

chart

price/access status

BUSINESS LOGIC

A newly published call is:

LIVE + PAID

When the administrator closes the call:

LIVE → CLOSED

PAID → FREE

Closed calls become part of the public track record and their detailed research becomes accessible.

Multiple calls can be published on the same day.

The admin should be able to easily:

- create a call

- edit it

- publish it

- close it

- archive it

Make this workflow extremely simple.

PAID EXPERIENCE

A paid call should reveal enough information to make the opportunity understandable, but the detailed thesis/research should remain locked.

For now, payment can be a visual placeholder.

Do NOT implement Razorpay yet.

TECHNICAL APPROACH

Use a modern React-based architecture with reusable components and mock data.

Use:

React

TypeScript

Vite

Tailwind

React Router

Lucide icons

Do NOT implement Supabase, authentication or Razorpay yet.

However, structure the data and components cleanly so Supabase can be connected later without rebuilding the UI.

Do not use hardcoded content inside individual components.

IMPORTANT:

I want you to make design decisions rather than simply following my instructions literally.

Explore the visual direction.

Give the interface its own personality.

The screenshots are references for UX thinking, not templates.

Make the first version feel like something that could actually launch as a premium financial product.

Build the complete working frontend with navigation and mock interactions rather than just creating static screens.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://market-lens-prime.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/14858fdc-5819-49cc-996e-604e4cb52e39).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
