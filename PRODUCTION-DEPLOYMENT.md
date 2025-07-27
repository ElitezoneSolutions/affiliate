# Production Deployment Guide

## 🚀 **Deployment Checklist**

### ✅ **Pre-Deployment Setup**

#### 1. Environment Variables
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Update Supabase URL and API key
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain
- [ ] Generate and set `NEXTAUTH_SECRET`

#### 2. Database Setup
- [ ] Run `scripts/setup-database.sql` in Supabase SQL Editor
- [ ] Run `scripts/migrate-payment-methods.sql` if needed
- [ ] Verify all tables and policies are created
- [ ] Test database connectivity

#### 3. Supabase Configuration
- [ ] Configure Authentication settings in Supabase Dashboard
- [ ] Set Site URL to your production domain
- [ ] Add production domain to allowed redirect URLs
- [ ] Configure email templates if using email auth

#### 4. Domain & SSL
- [ ] Purchase domain (if not already owned)
- [ ] Configure DNS settings
- [ ] Set up SSL certificate (automatic with most hosting providers)

## 🌐 **Deployment Options**

### Option 1: Vercel (Recommended)

#### Setup Steps:
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.production`

3. **Domain Configuration**
   - Add custom domain in Vercel Dashboard
   - Update DNS settings with your domain provider

#### Vercel Configuration:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Option 2: Netlify

#### Setup Steps:
1. **Connect Repository**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `.next`

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all production environment variables

### Option 3: AWS Amplify

#### Setup Steps:
1. **Connect Repository**
   - Connect your repository to AWS Amplify
   - Configure build settings

2. **Environment Variables**
   - Add environment variables in Amplify Console

## 🔒 **Security Checklist**

### ✅ **Application Security**
- [ ] All environment variables are set
- [ ] Supabase RLS policies are configured
- [ ] Authentication is properly set up
- [ ] HTTPS is enabled
- [ ] Security headers are configured

### ✅ **Database Security**
- [ ] Database is not publicly accessible
- [ ] RLS policies are active
- [ ] API keys are secure
- [ ] Regular backups are configured

### ✅ **Monitoring & Logging**
- [ ] Error monitoring is set up (Sentry, etc.)
- [ ] Performance monitoring is configured
- [ ] Logs are being collected
- [ ] Alerts are configured

## 📊 **Performance Optimization**

### ✅ **Build Optimization**
- [ ] Code splitting is working
- [ ] Images are optimized
- [ ] Bundle size is reasonable
- [ ] Static generation is used where possible

### ✅ **Runtime Optimization**
- [ ] Database queries are optimized
- [ ] Caching is implemented
- [ ] CDN is configured
- [ ] Compression is enabled

## 🧪 **Testing Checklist**

### ✅ **Functionality Testing**
- [ ] User registration and login
- [ ] Lead submission
- [ ] Payment method management
- [ ] Admin functionality
- [ ] Payout requests

### ✅ **Cross-Browser Testing**
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

### ✅ **Performance Testing**
- [ ] Page load times
- [ ] Database query performance
- [ ] Image loading
- [ ] Form submissions

## 📈 **Analytics & Monitoring**

### ✅ **Google Analytics**
```javascript
// Add to _app.js or layout.js
import { GoogleAnalytics } from 'nextjs-google-analytics'

export default function Layout({ children }) {
  return (
    <>
      <GoogleAnalytics trackPageViews />
      {children}
    </>
  )
}
```

### ✅ **Error Monitoring (Sentry)**
```javascript
// Add to _app.js or layout.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: 'production',
})
```

## 🔄 **CI/CD Pipeline**

### GitHub Actions Example:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 **Post-Deployment**

### ✅ **Immediate Checks**
- [ ] Site is accessible
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Database connections work
- [ ] Forms submit successfully

### ✅ **Monitoring Setup**
- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Set up performance monitoring
- [ ] Configure backup alerts

### ✅ **SEO Setup**
- [ ] Submit sitemap to search engines
- [ ] Configure Google Search Console
- [ ] Set up Google Analytics
- [ ] Test meta tags and structured data

## 📞 **Support & Maintenance**

### ✅ **Documentation**
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [ ] Document backup procedures

### ✅ **Backup Strategy**
- [ ] Database backups are automated
- [ ] Code repository is backed up
- [ ] Environment variables are documented
- [ ] Recovery procedures are tested

---

## 🎉 **Deployment Complete!**

Your affiliate application is now production-ready with:
- ✅ **Optimized performance**
- ✅ **Security best practices**
- ✅ **Monitoring and analytics**
- ✅ **Scalable architecture**
- ✅ **Professional deployment**

The application is ready to handle real users and scale as your affiliate program grows! 