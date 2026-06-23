# Ivan Syniuk — Personal Website

React + Vite personal blog for [ivansyniuk.com](https://ivansyniuk.com).

## Stack

- React + TypeScript + Vite
- React Router
- Markdown blog posts (`content/posts/*.md`)
- Light / dark / system theme
- Netlify hosting + forms

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Blog posts

Add a `.md` file to `content/posts/`:

```md
---
title: My Post Title
date: 2026-06-23
excerpt: Short summary for the blog index.
demoUrl: https://optional-link.com
---

Your markdown content here.
```

## Profile photo

Add your photo as one of:

- `src/assets/avatar.jpg`
- `src/assets/avatar.png`

Vite bundles it automatically. Replace the placeholder `avatar.png` with your own image anytime.

## Deploy to Netlify

1. Push this repo to GitHub
2. Import the repo in [Netlify](https://app.netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`

Or deploy manually:

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

## Custom domain

In Netlify → Domain management → add `ivansyniuk.com` and update DNS at your registrar.
