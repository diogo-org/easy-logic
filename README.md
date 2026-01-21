# Easy Logic

A modern React + TypeScript frontend application built with Vite and optimized for GitHub Pages deployment.

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173/easy-logic/`.

### Build

```bash
npm run build
```

This generates optimized production files in the `dist/` directory.

### Automatic Deployment

Push to `main` branch and GitHub Actions will automatically:
1. Run all tests
2. Check that coverage is 80% or higher
3. Build the project (only if tests pass)
4. Deploy to GitHub Pages (only if build succeeds)

The deployment will fail if:
- Any tests fail
- Code coverage falls below 80%

You can also manually trigger the workflow from the Actions tab in your GitHub repository.

## GitHub Pages Setup

In your repository settings:
1. Go to **Settings → Pages**
2. Set **Source** to "GitHub Actions"
3. Your site will be published at `https://<username>.github.io/easy-logic/`

## Project Structure

```
src/
  ├── main.tsx      # Application entry point
  ├── App.tsx       # Main application component
  ├── App.css       # Application styles
  └── index.css     # Global styles
index.html         # HTML template
vite.config.ts     # Vite configuration
tsconfig.json      # TypeScript configuration
package.json       # Project metadata and dependencies
```

## Technologies

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Modern frontend build tool
- **GitHub Pages** - Static hosting

## Notes

- The `base` in `vite.config.ts` is set to `/easy-logic/` for GitHub Pages. Update this if your repository name changes.
- Vite provides hot module replacement (HMR) during development for instant feedback.
- Production builds are optimized with tree-shaking and code splitting.