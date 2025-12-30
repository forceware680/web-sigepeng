---
description: Dokumentasi proyek SIMASET WIKI - Tutorial CMS dengan Next.js dan Vercel
---

# SIMASET WIKI - Project Context

## Overview
Website tutorial CMS untuk SIMASET (Sistem Informasi Manajemen Aset). Dibangun dengan Next.js 14 dan di-deploy ke Vercel.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js dengan credentials provider
- **Storage**: Local JSON files + Vercel Blob (production)
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
│   │   └── login/       # Admin login
│   ├── api/             # API routes
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
│   ├── categories.json  # Kategori data
│   └── tutorials.json   # Tutorial data
└── lib/
    ├── categories.js    # Category functions
    └── tutorials.js     # Tutorial functions
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

## Vercel Deployment
- Data persistence via Vercel Blob
- Environment variables needed:
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `BLOB_READ_WRITE_TOKEN` (for Vercel Blob)

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

## Recent Changes (Dec 2025)
- Sidebar title changed to "SIMASET WIKI" with link to homepage
- Added search functionality
- Added blog-style editor with embed support
- Added hierarchical category/menu system
- Fixed login session persistence bug
