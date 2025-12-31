---
description: Dokumentasi proyek SIMASET WIKI - Tutorial CMS dengan Next.js dan Vercel
---

# SIMASET WIKI - Project Context

## Overview
Website tutorial CMS untuk SIMASET (Sistem Informasi Manajemen Aset). Dibangun dengan Next.js 14 dan di-deploy ke Vercel.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js dengan credentials provider
- **Database**: Supabase PostgreSQL (production) / Local JSON (development)
- **Styling**: Vanilla CSS dengan dark theme
- **Icons**: Lucide React

## Project Structure
```
c:\web-sigepeng\
├── app/
│   ├── admin/           # Admin CMS pages
│   │   ├── categories/  # Category management
│   │   ├── create/      # Create tutorial
│   │   ├── edit/[id]/   # Edit tutorial
│   │   ├── login/       # Admin login
│   │   └── users/       # Admin user management (NEW)
│   ├── api/             # API routes
│   │   ├── admin-users/ # Admin users CRUD (NEW)
│   │   ├── auth/        # NextAuth
│   │   ├── categories/  # CRUD kategori
│   │   ├── search/      # Search API
│   │   └── tutorials/   # CRUD tutorial
│   ├── tutorial/[slug]/ # Tutorial page
│   └── globals.css      # Main styles
├── components/
│   ├── BlogEditor.js    # Rich text editor
│   ├── ImageEmbed.js    # Image embed component
│   ├── MarkdownContent.js # Markdown + embed parser
│   ├── MediaGallery.js  # Multiple media display
│   ├── SearchBar.js     # Search component
│   ├── Sidebar.js       # Navigation sidebar
│   └── YouTubeEmbed.js  # YouTube embed
├── data/
│   ├── admin.json       # Admin users (local dev)
│   ├── categories.json  # Kategori data
│   └── tutorials.json   # Tutorial data
└── lib/
    ├── categories.js    # Category functions (Supabase)
    ├── supabase.js      # Supabase client (NEW)
    └── tutorials.js     # Tutorial functions (Supabase)
```

## Key Features

### 1. Hierarchical Menu System
- Kategori sebagai menu utama, tutorial sebagai submenu
- Auto-expand kategori yang berisi tutorial aktif
- Icon menggunakan Lucide library
- Manage di `/admin/categories`

### 2. Multiple Media Support
- Tutorial bisa punya banyak video YouTube dan gambar
- Data model: `media: [{ type: 'video'|'image', ... }]`
- Backward compatible dengan format `videoId` lama

### 3. Search
- API: `/api/search?q=keyword`
- Mencari di: kategori, judul tutorial, konten, media
- SearchBar di sidebar

### 4. Blog-Style Editor
- Toolbar: Bold, Italic, Headings, Lists, Code, Link
- Embed video: `[VIDEO:youtube_id]`
- Embed gambar: `[IMAGE:url|caption]`
- Preview mode

### 5. Admin User Management (NEW)
- Manage admin users di `/admin/users`
- Tambah user baru
- Ganti password (verifikasi password lama)
- Hapus user (tidak bisa hapus admin terakhir)

## Data Models

### Category
```json
{
  "id": "category-xxx",
  "name": "Nama Kategori",
  "slug": "slug-url",
  "icon": "LucideIconName",
  "order": 1,
  "parentId": null | "parent-category-id",
  "createdAt": "ISO date"
}
```

> **Nested Categories**: Set `parentId` ke ID kategori parent untuk membuat subcategory.
> API mendukung `GET /api/categories?tree=true` untuk struktur hierarki.

### Tutorial
```json
{
  "id": "tutorial-xxx",
  "title": "Judul",
  "slug": "slug-url",
  "categoryId": "category-xxx",
  "content": "Markdown content with [VIDEO:id] [IMAGE:url]",
  "media": [
    { "id": "media-1", "type": "video", "videoId": "xxx", "title": "", "caption": "" },
    { "id": "media-2", "type": "image", "url": "https://...", "title": "", "caption": "" }
  ],
  "order": 1,
  "createdAt": "ISO date"
}
```

## Authentication
- Provider: Credentials
- Default: username `admin`, password `admin123`
- Session checked on `/admin/*` routes
- Login page auto-redirects if already authenticated

## Supabase Database

### Tables
- `categories` - Kategori tutorial
- `tutorials` - Tutorial content
- `tutorial_media` - Media items per tutorial
- `admin_users` - Admin accounts

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (required for write operations)
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Migration
Run `supabase-migration.sql` in Supabase SQL Editor to create tables and insert initial data.

## Common Tasks

### Adding new tutorial
POST `/api/tutorials` with:
```json
{
  "title": "...",
  "slug": "...",
  "categoryId": "...",
  "content": "...",
  "media": [...]
}
```

### Adding new category
POST `/api/categories` with:
```json
{
  "name": "...",
  "slug": "...",
  "icon": "LucideIconName",
  "order": 1
}
```

### Adding new admin user
POST `/api/admin-users` with:
```json
{
  "username": "...",
  "password": "...",
  "name": "..."
}
```

## Recent Changes (Dec 31, 2025)

### Supabase Migration
- Migrated from Vercel Blob to Supabase PostgreSQL
- Created `lib/supabase.js` for client initialization
- Updated `lib/tutorials.js` and `lib/categories.js` for Supabase
- SQL migration script: `supabase-migration.sql`

### Admin User Management
- New page: `/admin/users` for managing admin accounts
- API routes: `/api/admin-users` for CRUD operations
- Features: Add user, Edit user, Change password, Delete user
- Password change requires old password verification
- Cannot delete last admin user

### Files Added
- `lib/supabase.js` - Supabase client
- `app/admin/users/page.js` - User management UI
- `app/api/admin-users/route.js` - List/Create users
- `app/api/admin-users/[id]/route.js` - Update/Delete user
- `supabase-migration.sql` - Database schema

## Recent Changes (Dec 30, 2025)

### UI Enhancements
- **Browser Tab**: Title "SIMASET WIKI", favicon with graduation cap emoji
- **Responsive Welcome Page**: Different text for mobile (hamburger) vs desktop (sidebar)
- **Tutorial Two-Column Layout**: Main content + sidebar widget

### Blog Editor
- **Quote Button**: Insert blockquote with `> ` syntax
- Blockquote styling with purple left border

### Tutorial Page Features
- **Author & Date Display**: Shows who wrote the tutorial and when
- **View Counter**: Tracks views per session, stored in Blob
- **WhatsApp Share Button**: Green button to share via WhatsApp
- **Admin Edit Button**: Only visible when logged in as admin
- **Related Tutorials Section**: Shows 3 related tutorials at bottom

### Sidebar Widgets
- **Latest Posts Widget**: 5 most recent tutorials
- **Popular Posts Widget**: 5 most viewed tutorials with ranking

### Admin Dashboard
- **Multi-Select & Bulk Delete**: Checkbox to select multiple tutorials and delete at once
- **Session Fix**: Proper handling of loading state to prevent unnecessary login redirects

### Data Model Updates
- Tutorial now includes: `author`, `views`, `updatedAt`
- View increment API: `POST /api/tutorials/[id]/views`

### Bug Fixes
- Fixed data loss bug in Blob storage (was returning defaults on error)
- Fixed session persistence - no more double login prompts
- Fixed quote styling not showing in published content


