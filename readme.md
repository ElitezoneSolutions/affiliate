# 🚀 TrendHijacking Affiliate Program

A modern affiliate management system built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## ✨ Features

- 🔐 **User Authentication** with Supabase Auth
- 📊 **Affiliate Dashboard** with lead tracking and earnings
- 👨‍💼 **Admin Panel** for user and lead management
- 💰 **Payout System** with multiple payment methods
- 🛡️ **Row Level Security** and role-based access
- 📱 **Responsive Design** with modern UI components

## 🚀 Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd affiliate
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Set up the database**
   - Go to your Supabase dashboard
   - Run the SQL script from `scripts/setup-database.sql`

4. **Configure authentication**
   - Set Site URL to `http://localhost:3000`
   - Add redirect URLs for login/signup

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see your application!

## 📚 Documentation

For detailed setup instructions, troubleshooting, and feature documentation, see:

**[📖 Complete Setup Guide](SETUP.md)**

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI**: shadcn/ui components
- **Icons**: Lucide React

## 📁 Project Structure

```
affiliate/
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
├── lib/                  # Utility functions
├── scripts/              # Database setup scripts
└── SETUP.md             # Complete setup guide
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Need help?** Check the [Setup Guide](SETUP.md) for detailed instructions and troubleshooting.