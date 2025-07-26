# TrendHijacking Affiliate Program - Setup Guide

This guide will help you set up the complete TrendHijacking Affiliate Program application.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Vercel account (for deployment)

## Step 1: Supabase Setup

### 1. Create a new Supabase project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

### 2. Set up the database schema
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql` into the editor
4. Run the SQL script

### 3. Configure Authentication
1. Go to Authentication > Settings in your Supabase dashboard
2. Enable Email/Password authentication
3. Configure your site URL (you can update this later when you deploy)

### 4. Get your environment variables
1. Go to Settings > API in your Supabase dashboard
2. Copy your project URL and anon key

## Step 2: Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the development server
```bash
npm run dev
```

The application should now be running at `http://localhost:3000`

## Step 3: Create Admin User

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Create a new user with your admin email
4. Go to the SQL Editor and run:
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';
```

### Option 2: Using the application
1. Sign up with your admin email through the application
2. Use the SQL command above to make yourself an admin

## Step 4: Deploy to Vercel

### 1. Push to GitHub
1. Create a new GitHub repository
2. Push your code to the repository

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and create an account
2. Click "New Project"
3. Import your GitHub repository
4. Add your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

### 3. Update Supabase settings
1. Go back to your Supabase project
2. Update the site URL in Authentication > Settings to your Vercel domain
3. Add your Vercel domain to the allowed redirect URLs

## Application Features

### For Affiliates (Users)
- **Dashboard**: View lead statistics and recent leads
- **Submit Leads**: Submit new qualified leads
- **Track Status**: Monitor lead approval status and earnings
- **Request Calls**: Request follow-up calls for important leads
- **Payout Settings**: Configure payment method (PayPal, Wise, Bank Transfer)
- **Request Payouts**: Request payouts when earnings reach $100

### For Admins
- **Lead Management**: Review, approve, reject, and price leads
- **Call Management**: Respond to call requests with meeting links
- **Payout Management**: Review and approve payout requests
- **User Management**: View all affiliates and their performance

## Database Schema

### Tables
- **users**: User profiles and admin status
- **leads**: Submitted leads with status and pricing
- **payout_requests**: Payout requests and status

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Admins can access all data
- Automatic user creation on signup

## Customization

### Programs List
Edit the `PROGRAMS` array in `app/submit-lead/page.tsx` to match your services.

### Styling
The application uses Tailwind CSS and shadcn/ui components. You can customize:
- Colors in `tailwind.config.js`
- Component styles in `components/ui/`
- Global styles in `app/globals.css`

### Business Logic
Key business rules implemented:
- Minimum $100 for payout requests
- Only approved and unpaid leads count toward earnings
- Automatic lead status tracking
- Call request system

## Troubleshooting

### Common Issues

1. **Authentication errors**
   - Check your Supabase URL and anon key
   - Ensure RLS policies are correctly set up

2. **Database connection issues**
   - Verify your environment variables
   - Check Supabase project status

3. **Deployment issues**
   - Ensure all environment variables are set in Vercel
   - Check build logs for errors

### Support
For technical support or questions about the business logic, contact:
🔗 https://trendhijacking.com

## Next Steps

1. **Test the application** thoroughly with both user and admin accounts
2. **Customize the branding** to match your business
3. **Set up email notifications** (optional)
4. **Configure payment processing** for actual payouts
5. **Add analytics** to track performance

## Security Notes

- All user data is protected by Row Level Security
- Passwords are hashed by Supabase Auth
- API keys should be kept secure
- Regular security updates are recommended

---

**Built for TrendHijacking.com** - A complete affiliate lead management solution. 