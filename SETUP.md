# 🚀 Setup Guide - SIMASET WIKI

Panduan lengkap untuk setup environment variables dan deployment.

---

## 📋 Prerequisites

- Node.js 18+ installed
- npm atau yarn
- Supabase account (optional)
- Cloudinary account (optional)
- ImgBB account (optional)

---

## 🔧 Local Development Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd web-sigepeng
npm install
```

### 2. Setup Environment Variables

#### A. Copy Template
```bash
cp .env.example .env.local
```

#### B. Generate NEXTAUTH_SECRET

**Option 1: Using Node.js Script**
```bash
node scripts/generate-secret.js
```

**Option 2: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option 3: Using Online Generator**
Visit: https://generate-secret.vercel.app/32

#### C. Update .env.local

```env
# REQUIRED - NextAuth Configuration
NEXTAUTH_SECRET=<paste-generated-secret-here>
NEXTAUTH_URL=http://localhost:3000

# OPTIONAL - Supabase (for database)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OPTIONAL - Cloudinary (for image gallery)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OPTIONAL - ImgBB (for image upload)
IMGBB_API_KEY=your-imgbb-api-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🌐 Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings

### 3. Add Environment Variables

Go to **Project Settings → Environment Variables** and add:

#### Required Variables:

```
NEXTAUTH_SECRET=<your-generated-secret>
NEXTAUTH_URL=https://your-app.vercel.app
```

#### Optional Variables (if using):

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
IMGBB_API_KEY=<your-imgbb-key>
```

### 4. Deploy

Click "Deploy" and wait for deployment to complete.

### 5. Update NEXTAUTH_URL

After first deployment:
1. Copy your Vercel domain (e.g., `https://your-app.vercel.app`)
2. Update `NEXTAUTH_URL` environment variable
3. Redeploy

---

## 🔐 Security Notes

### NEXTAUTH_SECRET

- ✅ **MUST** be unique and random
- ✅ **MUST** be at least 32 characters
- ✅ **NEVER** commit to Git
- ✅ **DIFFERENT** for development and production
- ✅ Generate new secret for each environment

### Example:
```bash
# Development (.env.local)
NEXTAUTH_SECRET=dev-secret-abc123xyz789...

# Production (Vercel)
NEXTAUTH_SECRET=prod-secret-xyz789abc123...
```

---

## 📊 Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Wait for database to be ready

### 2. Run Migration

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Copy content from `supabase-migration.sql`
4. Paste and run

### 3. Get Credentials

1. Go to Project Settings → API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🖼️ Image Upload Setup

### Option 1: ImgBB (Recommended)

1. Go to https://imgbb.com
2. Create account
3. Get API key from https://api.imgbb.com
4. Add to `IMGBB_API_KEY`

### Option 2: Cloudinary

1. Go to https://cloudinary.com
2. Create account
3. Get credentials from Dashboard
4. Add to environment variables

---

## 🧪 Testing

### Test Local Setup

```bash
# 1. Start dev server
npm run dev

# 2. Test admin login
# Go to: http://localhost:3000/admin/login
# Username: admin
# Password: admin123

# 3. Test session timeout
# Login → Wait 24 hours → Should auto-logout
```

### Test Production

```bash
# 1. Deploy to Vercel
# 2. Visit: https://your-app.vercel.app/admin/login
# 3. Test login and session
```

---

## 🔄 Session Configuration

### Current Settings:

- **Session Duration:** 24 hours (1 day)
- **Session Refresh:** Every 1 hour (if active)
- **Session Check:** Every 5 minutes
- **Auto-Logout:** After 24 hours of inactivity

### Adjust Settings:

Edit `app/api/auth/[...nextauth]/route.js`:

```javascript
session: {
    maxAge: 24 * 60 * 60, // Change this (in seconds)
    updateAge: 60 * 60,   // Change this (in seconds)
}
```

---

## 📝 Default Admin Credentials

**⚠️ IMPORTANT: Change these in production!**

```
Username: admin
Password: admin123
```

### Change Password:

1. Hash new password:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-new-password', 10))"
```

2. Update in:
   - `data/admin.json` (local)
   - Supabase `admin_users` table (production)

---

## 🐛 Troubleshooting

### Session Not Working

1. Check `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Clear browser cookies
4. Restart dev server

### Database Not Working

1. Check Supabase credentials
2. Run migration script
3. Check RLS policies
4. Check service role key

### Images Not Uploading

1. Check ImgBB API key
2. Check file size (< 32MB)
3. Check file type (images only)
4. Check network connection

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🆘 Support

If you encounter issues:

1. Check this guide
2. Check error messages in console
3. Check Vercel deployment logs
4. Check Supabase logs

---

## ✅ Checklist

Before deploying to production:

- [ ] Generate unique `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Setup Supabase database
- [ ] Run migration script
- [ ] Change default admin password
- [ ] Test login and session timeout
- [ ] Test image upload
- [ ] Test all admin features
- [ ] Add custom domain (optional)
- [ ] Setup SSL certificate (automatic on Vercel)

---

**Happy Coding! 🚀**
