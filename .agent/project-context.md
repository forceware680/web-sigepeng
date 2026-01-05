# SIMASET WIKI - Project Context

## 📋 Project Overview

**Project Name:** SIMASET WIKI (web-sigepeng)  
**Type:** Tutorial & Documentation Platform  
**Framework:** Next.js 16.1.1 (App Router)  
**Purpose:** Comprehensive tutorial platform for SIMASET (Sistem Informasi Manajemen Aset) - Asset Management Information System

## 🎯 Main Purpose

This is a wiki/tutorial platform designed to provide complete guides and documentation for using the SIMASET (Asset Management Information System). It serves as a knowledge base with video tutorials, step-by-step guides, and comprehensive documentation for users learning how to use the asset management system.

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 16.1.1 (React 19.2.3)
- App Router architecture
- Client-side rendering for interactive components
- MDX support for rich content

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL) for production database
- Local JSON files for development fallback
- NextAuth.js for authentication

**Content Management:**
- Rich text editor (TipTap/WYSIWYG)
- MDX support for markdown content
- Media management (videos & images)
- Cloudinary integration for image hosting

**UI/Styling:**
- Custom CSS (globals.css, admin.css)
- Lucide React icons
- Responsive design (mobile-first)
- Google Fonts (Inter)

## 📁 Project Structure

```
web-sigepeng/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout with Sidebar
│   ├── page.js                   # Home/Welcome page
│   ├── globals.css               # Global styles
│   ├── admin/                    # Admin panel
│   │   ├── page.js              # Dashboard (tutorial list)
│   │   ├── login/               # Admin authentication
│   │   ├── create/              # Create new tutorial
│   │   ├── edit/[id]/           # Edit existing tutorial
│   │   ├── categories/          # Category management
│   │   └── users/               # User management
│   ├── api/                      # API Routes
│   │   ├── tutorials/           # Tutorial CRUD operations
│   │   ├── categories/          # Category CRUD operations
│   │   ├── admin-users/         # User management
│   │   ├── gallery/             # Media gallery
│   │   ├── upload/              # File upload handler
│   │   ├── search/              # Search functionality
│   │   └── auth/                # NextAuth configuration
│   └── tutorial/[slug]/         # Public tutorial pages
├── components/                   # React components
│   ├── Sidebar.js               # Navigation sidebar
│   ├── BlogEditor.js            # Tutorial editor
│   ├── WysiwygEditor.js         # Rich text editor (TipTap)
│   ├── MarkdownContent.js       # Markdown renderer
│   ├── MediaGallery.js          # Media management
│   ├── ImageGalleryModal.js     # Image picker
│   ├── SearchBar.js             # Search component
│   ├── ViewCounter.js           # View tracking
│   ├── LatestPosts.js           # Recent tutorials
│   ├── PopularPosts.js          # Most viewed tutorials
│   └── [other components]
├── lib/                          # Utility libraries
│   ├── supabase.js              # Supabase client setup
│   ├── tutorials.js             # Tutorial data management
│   ├── categories.js            # Category data management
│   └── cloudinary.js            # Image upload utilities
├── data/                         # Local JSON storage (fallback)
│   ├── tutorials.json           # Tutorial data
│   ├── categories.json          # Category data
│   └── admin.json               # Admin user data
├── content/                      # MDX content files
│   └── tutorial-*.mdx           # Tutorial content in MDX format
├── public/                       # Static assets
└── supabase-migration.sql       # Database schema
```

## 🗄️ Database Schema (Supabase/PostgreSQL)

### Tables

**1. categories**
- `id` (TEXT, PK) - Unique identifier
- `name` (TEXT) - Category name
- `slug` (TEXT, UNIQUE) - URL-friendly identifier
- `icon` (TEXT) - Icon name (default: 'Folder')
- `order` (INTEGER) - Display order
- `parent_id` (TEXT, FK) - Parent category for hierarchical structure
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**2. tutorials**
- `id` (TEXT, PK) - Unique identifier
- `title` (TEXT) - Tutorial title
- `slug` (TEXT, UNIQUE) - URL-friendly identifier
- `category_id` (TEXT, FK) - Reference to categories
- `content` (TEXT) - Tutorial content (markdown/HTML)
- `order` (INTEGER) - Display order within category
- `author` (TEXT) - Author name
- `views` (INTEGER) - View count
- `status` (TEXT) - 'published', 'draft', or 'scheduled'
- `published_at` (TIMESTAMPTZ) - Publication date/time
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**3. tutorial_media**
- `id` (TEXT, PK) - Unique identifier
- `tutorial_id` (TEXT, FK) - Reference to tutorials (CASCADE delete)
- `type` (TEXT) - 'video' or 'image'
- `video_id` (TEXT) - YouTube video ID (for videos)
- `url` (TEXT) - Image URL (for images)
- `title` (TEXT) - Media title
- `caption` (TEXT) - Media caption
- `order` (INTEGER) - Display order
- `created_at` (TIMESTAMPTZ)

**4. admin_users**
- `id` (TEXT, PK) - Unique identifier
- `username` (TEXT, UNIQUE) - Login username
- `password` (TEXT) - Bcrypt hashed password
- `name` (TEXT) - Display name

### Row Level Security (RLS)
- Public read access for categories, tutorials, and media
- Service role full access for all operations
- Admin users table protected

## 🔑 Key Features

### Public Features
1. **Tutorial Browsing**
   - Hierarchical category navigation
   - Search functionality
   - View counter for each tutorial
   - Related tutorials suggestions
   - Latest and popular posts

2. **Content Display**
   - Rich text content with markdown support
   - Embedded YouTube videos
   - Zoomable images
   - Responsive design for mobile/desktop

3. **Navigation**
   - Collapsible sidebar with category tree
   - Breadcrumb navigation
   - Search bar
   - Mobile-friendly hamburger menu

### Admin Features
1. **Authentication**
   - NextAuth.js integration
   - Bcrypt password hashing
   - Session management

2. **Tutorial Management**
   - Create/Edit/Delete tutorials
   - Rich WYSIWYG editor (TipTap)
   - Multiple media support (videos & images)
   - Draft and scheduled publishing
   - Bulk delete functionality
   - Order management

3. **Category Management**
   - Hierarchical categories (parent-child)
   - Custom icons
   - Order management
   - Slug generation

4. **User Management**
   - Admin user CRUD operations
   - Password management

5. **Media Management**
   - Image upload to Cloudinary
   - YouTube video embedding
   - Gallery modal for image selection
   - Multiple media per tutorial

## 🔄 Data Flow

### Hybrid Storage System
The application uses a hybrid approach:

**Production (Supabase):**
- Primary data source when configured
- Real-time updates
- Scalable storage

**Development (Local JSON):**
- Fallback when Supabase not configured
- Files in `/data` directory
- Easier local development

### Data Management Functions (lib/tutorials.js)
- `readTutorials(options)` - Get all tutorials (with filtering)
- `getTutorialBySlug(slug)` - Get single tutorial
- `writeSupabaseTutorial(tutorial)` - Create/update tutorial
- `deleteTutorial(id)` - Delete tutorial
- `incrementViews(id)` - Track views
- `getTutorialsByCategory(categoryId)` - Filter by category
- `getRelatedTutorials(id, categoryId, limit)` - Get related content

## 🎨 UI/UX Design

### Color Scheme
- Primary: Blue tones for links and actions
- Success: Green for published status
- Warning: Yellow for scheduled content
- Danger: Red for delete actions
- Neutral: Gray for drafts and secondary elements

### Responsive Breakpoints
- Mobile: ≤768px (hamburger menu, stacked layout)
- Desktop: >768px (sidebar navigation, multi-column)

### Key Components
- **Sidebar**: Collapsible navigation with category tree
- **BlogEditor**: Main tutorial creation/editing interface
- **WysiwygEditor**: TipTap-based rich text editor
- **MediaGallery**: Multi-media management interface
- **SearchBar**: Real-time search with results

## 🔐 Authentication & Authorization

### NextAuth Configuration
- Provider: Credentials
- Session strategy: JWT
- Password hashing: bcryptjs
- Protected routes: `/admin/*`

### Default Admin Credentials
- Username: `admin`
- Password: `admin123` (hashed in database)

## 📝 Content Management

### Tutorial Status System
1. **Draft** - Not visible to public
2. **Published** - Visible immediately
3. **Scheduled** - Published at future date/time

### Media Types
1. **Videos** - YouTube embeds (video ID)
2. **Images** - Cloudinary hosted (URL)

### Content Format
- Primary: Rich HTML (from TipTap editor)
- Alternative: MDX files in `/content` directory
- Markdown support in content field

## 🚀 Deployment & Environment

### Environment Variables Required
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Cloudinary (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Development
```bash
npm run dev    # Start development server (port 3000)
```

### Production
```bash
npm run build  # Build for production
npm start      # Start production server
```

## 📊 Current Data

### Categories
1. **Persediaan** (Pengeluaran) - Inventory/Stock management
2. **Aset Tetap** (AT) - Fixed Assets
3. **Modul Utama** - Main Modules
   - **Sub Modul 1** - Sub-module example

### Sample Tutorials
1. Tutorial Pengeluaran Menggunakan Sigepeng
2. Tutorial Cek Penerimaan Menggunakan Sigepeng

## 🔧 Technical Considerations

### Performance
- Server-side rendering for SEO
- Client-side navigation for speed
- Image optimization via Cloudinary
- View counting without blocking render

### Scalability
- Supabase for unlimited growth
- Cloudinary for media CDN
- Indexed database queries
- Efficient data fetching

### Maintainability
- Modular component structure
- Separation of concerns (lib/ for logic)
- Consistent naming conventions
- Comprehensive error handling

## 🐛 Known Patterns

### ID Generation
- Format: `{type}-{timestamp}`
- Example: `tutorial-1767080280743`

### Slug Generation
- Lowercase, hyphenated
- Special characters removed
- Used for SEO-friendly URLs

### Media Management
- Legacy: Single `videoId` field
- Current: `media` array with multiple items
- Backward compatible

## 📚 Dependencies Overview

**Core:**
- next@16.1.1
- react@19.2.3
- react-dom@19.2.3

**Database & Auth:**
- @supabase/supabase-js@^2.89.0
- next-auth@^4.24.13
- bcryptjs@^3.0.3

**Content & Editor:**
- @tiptap/react@^3.14.0
- @tiptap/starter-kit@^3.14.0
- @mdx-js/loader@^3.1.1
- @next/mdx@^16.1.1

**Media & Storage:**
- cloudinary@^2.8.0
- @vercel/blob@^2.0.0

**UI:**
- lucide-react@^0.562.0

## 🎯 Future Considerations

### Potential Enhancements
1. Full-text search with Supabase
2. User comments/feedback system
3. Tutorial versioning
4. Analytics dashboard
5. Multi-language support
6. PDF export functionality
7. Video upload (not just YouTube)
8. Tutorial templates
9. Collaborative editing
10. API documentation

### Optimization Opportunities
1. Image lazy loading
2. Code splitting
3. Service worker for offline access
4. Progressive Web App (PWA)
5. Advanced caching strategies

## 📖 Usage Guidelines

### For Developers
1. Always check Supabase configuration before database operations
2. Use service role client for admin operations
3. Implement proper error handling for both storage modes
4. Test with both Supabase and local JSON modes
5. Follow existing naming conventions

### For Content Creators
1. Use descriptive titles and slugs
2. Organize content with appropriate categories
3. Add relevant media to enhance tutorials
4. Use draft mode for work-in-progress
5. Schedule content for planned releases

---

**Last Updated:** December 2024  
**Version:** 0.1.0  
**Maintainer:** SIMASET Team
