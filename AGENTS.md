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
- `npm run build`: generate a minified production build in `build/`.
- `npm run production`: serve the `build/` folder locally.
- `npm run upload`: deploy `build/` to Yandex Cloud Storage (requires `.env`).
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
- Deployment uses `.env` for Yandex Cloud credentials; never commit secrets.
- If changing deploy behavior, verify upload paths and content types in `scripts/upload.mjs`.
