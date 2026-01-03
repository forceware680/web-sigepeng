-- =============================================
-- SIMASET WIKI - Supabase Migration Script
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'Folder',
  "order" INTEGER DEFAULT 1,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 2. Tutorials Table
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  content TEXT,
  "order" INTEGER DEFAULT 1,
  author TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 3. Tutorial Media Table
CREATE TABLE IF NOT EXISTS tutorial_media (
  id TEXT PRIMARY KEY,
  tutorial_id TEXT NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'image')),
  video_id TEXT,
  url TEXT,
  title TEXT,
  caption TEXT,
  "order" INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT
);

-- =============================================
-- Enable Row Level Security (RLS)
-- =============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories, tutorials, and media
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read tutorials" ON tutorials FOR SELECT USING (true);
CREATE POLICY "Allow public read media" ON tutorial_media FOR SELECT USING (true);

-- Allow all operations for authenticated service role (server-side)
CREATE POLICY "Allow service role full access categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow service role full access tutorials" ON tutorials FOR ALL USING (true);
CREATE POLICY "Allow service role full access media" ON tutorial_media FOR ALL USING (true);
CREATE POLICY "Allow service role full access admin_users" ON admin_users FOR ALL USING (true);

-- =============================================
-- Insert Existing Data
-- =============================================

-- Categories
INSERT INTO categories (id, name, slug, icon, "order", parent_id, created_at, updated_at) VALUES
  ('category-default', 'Persediaan', 'Pengeluaran', 'BookOpen', 1, NULL, '2024-12-29T00:00:00.000Z', '2025-12-29T07:07:05.373Z'),
  ('category-1766993547643', 'Aset Tetap', 'AT', 'BookOpen', 1, NULL, '2025-12-29T07:32:27.643Z', NULL),
  ('category-1767064466054', 'Modul Utama', 'modul-utama', 'Folder', 1, NULL, '2025-12-30T03:14:26.054Z', NULL),
  ('category-1767064539559', 'Sub Modul 1', 'sub-modul-1', 'Folder', 1, 'category-1767064466054', '2025-12-30T03:15:39.559Z', NULL)
ON CONFLICT (id) DO NOTHING;

-- Tutorials
INSERT INTO tutorials (id, title, slug, category_id, content, "order", author, views, created_at, updated_at) VALUES
  ('tutorial-1', 'Tutorial Pengeluaran Menggunakan Sigepeng', 'tutor-pengeluaran', 'category-default', 'Tutorial Cara Mengeluarkan Barang Persediaan Menggunakan Metode Sigepeng', 1, NULL, 2, '2024-12-29T00:00:00.000Z', '2025-12-29T07:09:38.643Z'),
  ('tutorial-1767080280743', 'Tutorial Cek Penerimaan Menggunakan Sigepeng', 'l', 'category-1767064539559', 'Loremipsum', 1, 'Administrator', 1, '2025-12-30T07:38:00.743Z', '2025-12-30T07:45:36.268Z')
ON CONFLICT (id) DO NOTHING;

-- Tutorial Media
INSERT INTO tutorial_media (id, tutorial_id, type, video_id, url, title, caption, "order") VALUES
  ('media-1766992168077', 'tutorial-1', 'video', '6YaAVDhljL4', NULL, 'Video Tutorial', '', 1)
ON CONFLICT (id) DO NOTHING;

-- Admin User (password: admin123 - hashed with bcrypt)
INSERT INTO admin_users (id, username, password, name) VALUES
  ('1', 'admin', '$2b$10$UQ.bFYzZXBLdouxCghxypeQ1hgtXyOyG171lvVATjuWUd5fH75bau', 'Administrator')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Create Indexes for Better Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_tutorials_category ON tutorials(category_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_slug ON tutorials(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_media_tutorial ON tutorial_media(tutorial_id);

-- =============================================
-- 5. Updates for Draft & Schedule (New)
-- =============================================

-- Add status and published_at columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutorials' AND column_name = 'status') THEN
        ALTER TABLE tutorials ADD COLUMN status TEXT DEFAULT 'published';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutorials' AND column_name = 'published_at') THEN
        ALTER TABLE tutorials ADD COLUMN published_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Update existing records to have valid defaults
UPDATE tutorials SET status = 'published' WHERE status IS NULL;
UPDATE tutorials SET published_at = created_at WHERE published_at IS NULL;
