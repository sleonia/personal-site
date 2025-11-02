# Personal Site - Plain HTML/CSS/JS

A pixel art-inspired personal portfolio site built with vanilla HTML, CSS, and JavaScript.

## Project Structure

Following static site best practices:

```
personal-site-v2/
??? index.html          # Entry point - main HTML file
??? css/                # Stylesheets
?   ??? styles.css      # All CSS styles
??? js/                 # JavaScript files
?   ??? script.js       # Theme management and interactivity
??? images/             # Image assets
?   ??? *.jpg, *.png, *.svg
??? package.json        # Dev dependencies (optional)
??? README.md           # This file
??? node_modules/       # Dependencies (if installed)
```
## Resources

1. Generating avatar - https://www.easemate.ai/webapp/chat?from=ai-photo-generator
2. App design - https://v0.app
3. Compress image and convert it - https://squoosh.app
4. Remove backgound - https://removal.ai/upload

## Getting Started

### Installation

```bash
# Install dependencies (optional - only needed for local dev server)
npm install
```

### Development

Start a local development server:

```bash
npm run dev
# or
pnpm dev
```

This will start a local server at `http://localhost:3000` and open it in your browser.

#### Deploy to Yandex Cloud Storage

This project includes an automated upload script for Yandex Cloud Storage (S3-compatible):

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure credentials:**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your credentials:
   # YC_BUCKET=your-bucket-name
   # YC_ACCESS_KEY_ID=your-access-key-id
   # YC_SECRET_ACCESS_KEY=your-secret-access-key
   ```

3. **Run the upload script:**
   ```bash
   npm run upload
   # or
   node upload.mjs
   ```

The script will:
- Upload all static files (`index.html`, `css/`, `js/`, `images/`)
- Set appropriate MIME types and cache headers
- Provide progress feedback
- Show the final URL when complete

**Environment Variables:**
- `YC_BUCKET` - Your bucket name (required)
- `YC_ACCESS_KEY_ID` - Access key ID (required)
- `YC_SECRET_ACCESS_KEY` - Secret access key (required)
- `YC_ENDPOINT` - Custom endpoint (optional, defaults to Yandex Cloud)
- `YC_REGION` - Region (optional, defaults to `ru-central1`)

You can also use AWS variable names: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`

