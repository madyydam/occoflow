# Occo Flow — Deployment & DevOps Operations Guide

| **Document Version** | 1.0.0 |
| **Runtime Target** | Node.js 18+ / Cloudflare Workers / Docker / Vercel |
| **Build Tooling** | Vite 8 + Nitro (`nitro/vite`) |

---

## 1. Local Development Setup

### 1.1 Prerequisites
- **Node.js**: Version 18.x, 20.x, or 22.x+ (Recommended: Node.js LTS).
- **Package Manager**: `npm` (v9+) or `pnpm` or `yarn`.
- **Git**: Installed and configured.

### 1.2 Installation Steps
```bash
# Clone the repository
git clone https://github.com/madyydam/occoflow.git occo-flow
cd occo-flow

# Install dependencies cleanly
npm install

# Launch local development server
npm run dev
```

The application will start with instant Hot Module Replacement (HMR) at:
👉 `http://localhost:8080`

---

## 2. Production Build Pipeline

```bash
# Run production build
npm run build
```

The build command compiles three layers:
1. **Client Assets Bundle**: Generated to `.output/public/assets/` (code-split JS, CSS, and SVG favicons).
2. **Server-Side Render Engine**: Generated to `.output/server/` using Nitro.
3. **Manifest Files**: Route tree definitions and SSR preloading manifests.

To test the production build locally:
```bash
npm run preview
```

---

## 3. Deployment Targets & Strategies

### 3.1 Target A: Cloudflare Pages / Workers (Default Nitro Preset)
The default configuration in [`vite.config.ts`](../vite.config.ts) specifies:
```typescript
nitro({
  defaultPreset: "cloudflare-module",
})
```
Nitro automatically creates:
- `.output/server/wrangler.json`
- `.output/public/_headers`

**Deploying to Cloudflare:**
```bash
# Deploy with Wrangler CLI
npx wrangler pages deploy .output/public
```

### 3.2 Target B: Vercel Deployment
To deploy on Vercel:
1. Connect your GitHub repository to Vercel.
2. Build Settings:
   - **Framework Preset**: Other / Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `.output/public`
3. If using Server Functions / SSR on Vercel, pass the Nitro preset via environment variable:
   - `NITRO_PRESET=vercel`

### 3.3 Target C: Docker Containerization
Create a `Dockerfile` in the root:

```dockerfile
# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=builder /app/.output ./.output
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
```

Build and run the container:
```bash
docker build -t occo-flow:1.0.0 .
docker run -p 8080:8080 occo-flow:1.0.0
```

---

## 4. Continuous Integration & CD Pipeline (GitHub Actions)

Add `.github/workflows/ci.yml`:

```yaml
name: Occo Flow CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Typecheck
        run: npx tsc --noEmit

      - name: Build Application
        run: npm run build
```

---

## 5. Environment Variables & Security Hygiene

| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `PORT` | Listening server port | `8080` | Optional |
| `NODE_ENV` | Application environment | `production` / `development` | Yes |
| `VITE_APP_TITLE` | App Title override | `Occo Flow` | Optional |
| `DATABASE_URL` | Future PostgreSQL connection string | `postgres://user:pass@host:5432/crm` | Phase 2 |
| `SESSION_SECRET` | Secret key for auth token signing | `cryptographic-random-string` | Phase 2 |

> **Security Guardrail**: Never commit `.env` or `.env.local` files to version control. Keep `.gitignore` updated.
