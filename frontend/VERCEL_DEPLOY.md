# Vercel Deployment Guide

## Configuration Files

### vercel.json
This file is already configured with:
- **React Router Support**: All routes are rewritten to `/index.html` to support client-side routing
- **Build Settings**: Configured for Vite build output
- **Security Headers**: Added security headers for better protection
- **Asset Caching**: Static assets are cached for better performance

## Deployment Steps

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# For production deployment
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Set the **Root Directory** to `frontend`
4. Vercel will automatically detect Vite and use the configuration

### Option 3: Deploy from Root Directory
If deploying from the root directory:
1. Set **Root Directory** to `frontend` in Vercel dashboard
2. Or create a `vercel.json` in root with:
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install"
}
```

## Environment Variables (if needed)
If you have environment variables, add them in Vercel Dashboard:
- Settings → Environment Variables

## Important Notes
- ✅ All routes will work correctly (React Router is configured)
- ✅ Build output goes to `dist` directory
- ✅ Static assets are cached for 1 year
- ✅ Security headers are configured
- ✅ No additional configuration needed for routing

## Troubleshooting

### Routing Issues
If routes don't work after deployment:
- Check that `vercel.json` has the rewrite rule: `"source": "/(.*)", "destination": "/index.html"`
- Ensure the file is in the `frontend` directory

### Build Issues
- Make sure Node.js version is compatible (Vercel uses Node 18+ by default)
- Check that all dependencies are in `package.json`

### 404 Errors
- The rewrite rule in `vercel.json` should handle all routes
- If still getting 404s, check Vercel deployment logs

