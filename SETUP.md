# 🚀 TrendHijacking Affiliate Program - Complete Setup Guide

A comprehensive affiliate management system built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Database Setup](#-database-setup)
- [Authentication Setup](#-authentication-setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Admin Setup](#-admin-setup)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 🔐 Authentication & User Management
- **User Registration & Login** with Supabase Auth
- **Email Confirmation** for new accounts
- **User Profiles** with avatar uploads
- **Admin/User Role Management**
- **User Suspension** functionality

### 📊 Affiliate Dashboard
- **Lead Submission** with detailed forms
- **Lead Tracking** with status updates
- **Earnings Calculator** with real-time stats
- **Payout Requests** with multiple payment methods
- **Performance Analytics** and reporting

### 👨‍💼 Admin Panel
- **User Management** with suspension controls
- **Lead Management** with approval/rejection
- **Payout Processing** with status tracking
- **Analytics Dashboard** with comprehensive stats
- **System Settings** and configuration

### 🛡️ Security Features
- **Row Level Security (RLS)** on all tables
- **Role-based Access Control**
- **Secure File Uploads** with validation
- **Input Validation** and sanitization
- **CSRF Protection** and secure headers

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd affiliate
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Create a new project** or use existing one
3. **Navigate to SQL Editor**
4. **Run the setup script**: Copy and paste the content from `scripts/setup-database.sql`
5. **Click "Run"** and wait for completion

### 4. Authentication Setup

1. **In Supabase Dashboard**, go to **Authentication** → **Settings**
2. **Configure Site URL**: `http://localhost:3000`
3. **Add Redirect URLs**:
   ```
   http://localhost:3000
   http://localhost:3000/login
   http://localhost:3000/signup
   http://localhost:3000/dashboard
   http://localhost:3000/submit-lead
   ```
4. **Enable Email Provider** and **Email Confirmations**

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 🗄️ Database Setup

### Prerequisites
- Supabase project created
- Access to SQL Editor

### Setup Steps

1. **Open SQL Editor** in your Supabase dashboard
2. **Copy the entire content** from `scripts/setup-database.sql`
3. **Paste and run** the script
4. **Verify setup** by checking the verification queries at the end

### What Gets Created

#### Tables
- **`users`** - User profiles and admin status
- **`leads`** - Submitted leads from affiliates
- **`payout_requests`** - Payout requests and processing

#### Security
- **Row Level Security** on all tables
- **User policies** for own data access
- **Admin policies** for full system access
- **Suspension checks** in all policies

#### Storage
- **`avatars`** bucket for profile images
- **`documents`** bucket for file uploads
- **Storage policies** for secure access

#### Functions
- **`is_admin_user()`** - Admin check (no recursion)
- **`is_user_suspended()`** - Suspension check
- **`get_user_stats()`** - User statistics
- **`update_updated_at_column()`** - Auto timestamps

## 🔐 Authentication Setup

### Supabase Configuration

1. **Site URL**: `http://localhost:3000`
2. **Redirect URLs**: Add all necessary redirects
3. **Email Provider**: Enable and configure
4. **Email Confirmations**: Enable for security

### Email Settings
- ✅ **Enable Email Confirmations**
- ✅ **Enable Email Change Confirmations**
- ✅ **Enable Secure Email Change**
- ✅ **Double Confirm Changes**

### Provider Settings
- ✅ **Enable Email Provider**
- ❌ **Disable Google/GitHub** (for now)

## 🌍 Environment Variables

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Getting Your Credentials

1. **Go to Supabase Dashboard**
2. **Navigate to Settings** → **API**
3. **Copy Project URL** and **anon public key**
4. **Paste into `.env.local`**

## 🚀 Running the Application

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 👑 Admin Setup

### Making Yourself Admin

After creating your account, run this SQL in Supabase:

```sql
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

### Admin Features

- **User Management**: View, suspend, and manage all users
- **Lead Management**: Approve, reject, and process leads
- **Payout Processing**: Handle payout requests
- **System Analytics**: View comprehensive statistics

## 🔧 Troubleshooting

### Common Issues

#### Application Stuck Loading
- **Check browser console** for errors
- **Verify environment variables** are correct
- **Clear browser cache** and localStorage
- **Check Supabase project** is active

#### Database Connection Errors
- **Verify Supabase URL** and key in `.env.local`
- **Check if SQL script** was run successfully
- **Ensure project** is not paused

#### Authentication Issues
- **Check redirect URLs** in Supabase settings
- **Verify email provider** is enabled
- **Clear browser data** and try again
- **Use incognito mode** for testing

#### Column Errors
- **Run the clean setup script** to recreate tables
- **Check for existing tables** with different structure
- **Drop and recreate** if necessary

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Check terminal** for server errors
3. **Verify Supabase dashboard** for database issues
4. **Test with incognito mode** to rule out cache issues
5. **Check network tab** for failed requests

### Getting Help

1. **Check the browser console** for specific error messages
2. **Verify all setup steps** were completed
3. **Ensure Supabase project** is active and configured
4. **Test with a fresh browser session**

## 📁 Project Structure

```
affiliate/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel pages
│   ├── dashboard/         # User dashboard pages
│   ├── login/             # Authentication
│   ├── signup/            # User registration
│   └── submit-lead/       # Lead submission
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utility functions
├── scripts/              # Database setup scripts
└── ...                   # Configuration files
```

## 🎯 Next Steps

1. **Customize branding** and styling
2. **Add additional features** as needed
3. **Configure email templates** in Supabase
4. **Set up monitoring** and analytics
5. **Deploy to production** (Vercel recommended)

## 📞 Support

For issues and questions:
1. **Check this setup guide** thoroughly
2. **Review troubleshooting section**
3. **Check browser console** for errors
4. **Verify Supabase configuration**

---

**Happy coding! 🚀** 