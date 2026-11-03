# Repository Guidelines

## Project Structure & Module Organization

- `index.html` is the single-page source of content and markup.
- `css/styles.css` holds all styling.
- `js/main.mjs` contains client-side behavior.
- `images/` and `fonts/` store static assets used by the page.
- `build/` is generated output from `npm run build` and is deployed.
- Root static files like `robots.txt`, `sitemap.xml`, and `site.webmanifest` are copied into `build/` during the build.

## Build, Test, and Development Commands

- `npm run dev`: serve the site locally at `http://localhost:3000` with auto-open.
- `npm run build`: regenerate the subset font, then generate a minified production build in `build/`.
- `npm run build:font`: subset the display font to a WOFF2 (run automatically by `npm run build`).
- `npm run production`: serve the `build/` folder locally.
- Hosting is Cloudflare Pages (project `personal-site`). Every push to `main` builds and deploys automatically via the Cloudflare GitHub integration: build command `npm install --no-audit --no-fund && npm run build`, output `build`, `NODE_VERSION=22`. Other branches get preview deploys.
- `npm run upload`: legacy upload of `build/` to Yandex Cloud Storage (requires `.env`). No longer used for production.
- `npm run format`: format project files with Prettier.

## Coding Style & Naming Conventions

- Indentation: 2 spaces in HTML/CSS/JS.
- File naming: lowercase with dashes where applicable (e.g., `site.webmanifest`).
- JavaScript uses ES modules (`type: module`) and `.mjs` for entry (`js/main.mjs`).
- Formatting: Prettier is the single source of formatting; run `npm run format` before commits.

## Testing Guidelines

- No automated test suite is currently configured.
- Manual checks: run `npm run build`, then `npm run production` and spot-check key sections and links.

## Commit & Pull Request Guidelines

- Commit messages are short, imperative, and scoped to the change (e.g., `Add robots and build-time sitemap`).
- Keep commits focused; avoid mixing unrelated changes.
- If opening a PR, include a short summary and screenshots for any visual changes.

## Security & Configuration Tips

- Never commit secrets (`.env` is only for the legacy Yandex upload script).
- If changing build output, keep it in `build/`; that's what Cloudflare Pages serves.
