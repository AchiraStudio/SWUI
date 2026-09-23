# SWUI Website & Live Demo

This branch (`demo`) contains the source code for the official website and interactive demo for **SWUI (SimpleWebUI)**, an Unreal Engine 5 web UI bridge plugin.

The site is built with **React 18 + Vite + Tailwind CSS + TypeScript** and is hosted on **Cloudflare Pages**.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```

---

## Cloudflare Pages Deployment Guide

This branch is pre-configured for zero-friction deployment to **Cloudflare Pages**:

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select your `SWUI` repository.
4. Set the build parameters:
   - **Production branch:** `demo`
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (default)
5. Click **Save and Deploy**.

### SPA Routing Note
The `public/_redirects` file is included to configure Cloudflare Pages to redirect all single-page app routes (`/* /index.html 200`) so that page refreshes never return 404.
