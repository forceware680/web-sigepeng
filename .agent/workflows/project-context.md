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

## Recent Changes (Dec 31, 2025 - Session 2)

### Delete Bug Fixes
**Problem**: Delete (single/bulk) untuk tutorial dan kategori tidak berfungsi - item yang dihapus tetap muncul setelah refresh.

**Root Cause**: DELETE API routes menggunakan `writeXxx()` yang hanya melakukan **upsert** untuk item tersisa, bukan menghapus item target dari Supabase.

**Solution**: 
- Menambahkan fungsi universal `deleteTutorial(id)` di `lib/tutorials.js`
- Menambahkan fungsi universal `deleteCategory(id)` di `lib/categories.js`
- Mengupdate DELETE handlers di API routes untuk menggunakan fungsi delete yang benar

**Files Modified**:
- `lib/tutorials.js` - Added `deleteTutorial()` function
- `lib/categories.js` - Added `deleteCategory()` function
- `app/api/tutorials/[id]/route.js` - Updated DELETE handler
- `app/api/categories/[id]/route.js` - Updated DELETE handler

### Session Persistence Fix
**Problem**: Setelah login dan reload browser, user diminta login lagi.

**Root Cause**: Nested SessionProvider - ada `Providers.js` di root layout DAN `AuthProvider.js` di admin layout. Dua SessionProvider menyebabkan session state tidak konsisten.

**Solution**: Menghapus wrapper `AuthProvider` dari `app/admin/layout.js` karena root layout sudah handle session via `Providers` component.

**Files Modified**:
- `app/admin/layout.js` - Removed AuthProvider wrapper

### Admin Credentials
- Username: `admin`
- Password: `hermangantengsekali` (hashed dengan bcrypt)

## Recent Changes (Jan 2, 2026)

### Cloudinary Integration ☁️
- **Purpose**: Menggantikan ImgBB (limit 32MB) dengan Cloudinary untuk hosting gambar lebih handal.
- **Library**: `cloudinary` npm package
- **Config**: `lib/cloudinary.js`
- **Env Vars**:
  - `CLOUDINARY_CLOUD_NAME=dwyadbsxu`
  - `CLOUDINARY_API_KEY=...`
  - `CLOUDINARY_API_SECRET=...`

### Advanced WYSIWYG Editor 📝
- **Upgrade**: Mengganti textarea biasa dengan **TipTap Editor**.
- **Dual Mode**:
  - **Visual**: Like Word/Docs. Gambar tampil langsung (bukan kode).
  - **Source**: Edit markdown raw.
- **Inline Image**: Gambar dirender sebagai `<img>` di visual mode, bukan `[IMAGE:...]`. Disimpan tetap sebagai markdown `[IMAGE:...]`.

### Image Features 📸
1.  **Bulk Upload**:
    - Tombol Upload (📷+) di toolbar.
    - Support select **multiple images**.
    - Progress indicator (e.g. "2/5").
2.  **Gallery Integration**:
    - **Modal Gallery**: Browse semua gambar yang pernah diupload.
    - **Reusable**: `components/ImageGalleryModal.js`.
    - **Access**:
      - Toolbar Editor (📁 Icon).
      - Section "Media (Video & Gambar)" di halaman Create/Edit.
3.  **Preview**:
    - Lightbox/Fullscreen zoom di gallery.
    - Detail view di sidebar gallery.

### Visual Polish ✨
- **Shiny Title**: Efek gradient ungu animasi pada judul tutorial (`.shiny-title` di `globals.css`).
- **Modern UI**: Styling editor, gallery modal, dan media cards yang lebih rapi.

### Key Files Created/Modified
- `components/WysiwygEditor.js` (Major update)
- `components/ImageGalleryModal.js` (New)
- `app/api/upload/route.js` (Switched to Cloudinary)
- `app/api/gallery/route.js` (New)
- `app/admin/create/page.js` & `edit/[id]/page.js` (Added gallery picker)

## Recent Changes (Jan 2, 2026 - Session 2)

### Bug Fixes: Cloudinary Gallery 🐛
**Problem**: Deleted images reappearing as "ghost" broken thumbnails.
**Solution**:
- **Consolidated Deletion**: Switched from Upload API to **Admin API** (`delete_resources`) for reliable deletion.
- **Cache Busting**: Added `timestamp` to frontend fetch and `Cache-Control: no-store` to backend response.
- **Ghost Filtering**: Added `.filter(img => img.bytes > 0)` in API to strictly remove invalid assets.
- **Fetch All**: Removed `prefix: 'simaset-wiki/'` restriction to show ALL Cloudinary assets.

### UI Improvements 🎨
- **Image Resizing**: Added global CSS to ensure all tutorial images (markdown & HTML) fit screen width (`max-width: 100%`).
- **Clean Previews**: Updated "Related Tutorials" to strip HTML tags (`<img>`) AND custom embed codes (`[IMAGE:...]`) from excerpts.
- **TipTap Fix**: Resolved "Duplicate extension" warning by configuring StarterKit properly.

### New Feature: Image Zoom 🔍
**Goal**: Allow users to zoom in on tutorial images.
- **Component**: Created `components/ZoomableImage.js` (Lightbox modal).
- **Integration**:
  - Updated `components/ImageEmbed.js` to use `ZoomableImage`.
  - Updated `components/MarkdownContent.js` to detect **legacy HTML `<img>` tags** and upgrade them to Zoomable components automatically.
  - Tutorial content now supports zooming for **both** old (raw HTML) and new (Editor-embedded) images.

## Recent Changes (Jan 5, 2026) 📱

### Mobile Sidebar Improvements
**Problem**: Tampilan sidebar di mobile terlihat jelek - menu items tidak rata dan layout berantakan.

**Solution**:
1. **Mobile Header Bar** (`globals.css`)
   - Fixed header 60px dengan logo dan hamburger menu
   - Backdrop blur effect untuk tampilan modern

2. **Sidebar Overlay** 
   - Background semi-transparan dengan blur effect
   - Klik overlay untuk menutup sidebar

3. **Slide Animation**
   - Transform translateX untuk animasi smooth dari kiri
   - Cubic-bezier easing untuk gerakan natural

4. **Close Button** (`Sidebar.js`)
   - Tombol X di header sidebar
   - Hanya tampil di mobile (hidden di desktop via CSS)

5. **Horizontal Alignment Fix**
   - `flex-direction: row !important` untuk mencegah item stacking
   - `flex-wrap: nowrap !important` agar item count tetap inline
   - `text-align: left` untuk semua text

**Files Modified**:
- `app/globals.css` - Mobile header, overlay, sidebar animations, responsive breakpoints
- `components/Sidebar.js` - Added close button

---

### Category Page Feature 📁
**Goal**: Membuat kategori di homepage bisa diklik dan menampilkan semua tutorial dalam kategori tersebut.

**Implementation**:
1. **New Route**: `/category/[slug]`
   - Dynamic page untuk menampilkan semua tutorial per kategori
   - Header dengan nama kategori dan jumlah tutorial
   - Grid layout untuk tutorial cards
   - Back link untuk kembali ke homepage

2. **Clickable Category Titles**
   - Mengubah CategorySection.js agar title kategori jadi link
   - Hover effect dengan arrow animation
   - Link ke `/category/[slug]`

**Files Added**:
- `app/category/[slug]/page.js` - Category page component

**Files Modified**:
- `components/CategorySection.js` - Clickable category title links
- `app/globals.css` - Category page styling, category-title-link styling

---

### Search Excerpt Cleanup 🔍
**Problem**: Hasil pencarian menampilkan kode HTML/markdown mentah di excerpt.

**Solution**:
- Menambahkan fungsi `stripMarkdownAndHtml()` di `/api/search/route.js`
- Membersihkan: HTML tags, [VIDEO:...], [IMAGE:...], markdown links, bold/italic, headers, blockquotes, code blocks

**Files Modified**:
- `app/api/search/route.js` - Added stripMarkdownAndHtml function, updated getExcerpt

---

## Project Structure (Updated)
```
app/
├── category/[slug]/      # NEW: Category page
├── tutorial/[slug]/      # Tutorial page
├── admin/               # Admin CMS
└── api/
    ├── search/          # Search API (updated)
    └── ...

components/
├── Sidebar.js           # Updated: close button for mobile
├── CategorySection.js   # Updated: clickable category titles
└── ...
```

## Deployment Notes
- Semua perubahan sudah dibuat di lokal
- Jalankan `git push` untuk deploy otomatis ke Vercel
- Test di device mobile setelah deployment

