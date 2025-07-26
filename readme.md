# TrendHijacking Affiliate Program

A full-featured web application for managing affiliate lead submissions and payouts. Built with Next.js, Supabase, and shadcn/ui.

## 🚀 Status: **PRODUCTION READY**

### ✅ What's Complete
- **Full Authentication System** - User registration, login, and session management
- **User Dashboard** - Lead tracking, statistics, and payout requests
- **Admin Dashboard** - Complete lead and payout management
- **Lead Submission** - Form for affiliates to submit qualified leads
- **Call Request System** - Request and manage follow-up calls
- **Payout Management** - Request and approve payouts
- **Responsive Design** - Works on all devices
- **Security** - Row Level Security, authentication, and authorization

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth + Database)
- **Hosting**: Vercel
- **Database**: PostgreSQL (via Supabase)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo>
cd custom
npm install
```

### 2. Environment Setup
Create `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Schema
Copy the contents of `scripts/setup-database.sql` and run it in your Supabase SQL Editor.

### 4. Start Development
```bash
npm run dev
```

### 5. Deploy to Production
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## 📱 Features

### For Affiliates
- ✅ User registration and login
- ✅ Submit qualified leads
- ✅ Track lead status and earnings
- ✅ Request follow-up calls
- ✅ Request payouts (min $100)
- ✅ View payout history

### For Admins
- ✅ Secure admin dashboard
- ✅ Review and approve/reject leads
- ✅ Set lead prices
- ✅ Manage call requests
- ✅ Process payout requests
- ✅ View all affiliate data

## 🗄️ Database Schema

The application uses three main tables:

- **`users`** - User profiles with admin flags
- **`leads`** - Submitted leads with status tracking
- **`payout_requests`** - Payout requests and processing

## 🔐 Security

- Row Level Security (RLS) enabled
- User authentication required
- Admin-only routes protected
- Environment variables secured
- No sensitive data in client code

## 📋 File Structure

```
custom/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # User dashboard
│   ├── login/             # Authentication
│   ├── signup/
│   ├── submit-lead/       # Lead submission
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── providers.tsx     # Auth context
├── lib/                  # Utilities
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
└── scripts/              # Database setup
    └── setup-database.sql # Complete database schema
```

## 🎯 Next Steps

1. **Deploy to Vercel**
2. **Run the SQL schema in Supabase**
3. **Create your admin user**
4. **Start accepting affiliate registrations**

## 📞 Support

For technical support or questions:
- Check the console for error messages
- Verify environment variables are set
- Ensure database schema is run
- Test authentication flow

---

**Built for TrendHijacking.com** 🚀