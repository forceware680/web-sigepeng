'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Video, BookOpen, RefreshCw, ArrowLeft, Menu } from 'lucide-react';
import FeaturedPosts from '@/components/FeaturedPosts';
import CategorySection from '@/components/CategorySection';
import Announcements from '@/components/Announcements';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="homepage">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon"><GraduationCap size={64} strokeWidth={1.5} /></div>
          <h1 className="hero-title">Selamat Datang di Tutorial SIMASET</h1>
          <p className="hero-subtitle">
            Panduan lengkap penggunaan Sistem Informasi Manajemen Aset
          </p>
          <div className="hero-features">
            <div className="hero-feature-item">
              <span className="hero-feature-icon"><Video size={18} /></span>
              <span>Video Tutorial</span>
            </div>
            <div className="hero-feature-item">
              <span className="hero-feature-icon"><BookOpen size={18} /></span>
              <span>Panduan Lengkap</span>
            </div>
            <div className="hero-feature-item">
              <span className="hero-feature-icon"><RefreshCw size={18} /></span>
              <span>Update Berkala</span>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      <Announcements />

      {/* Featured Posts Section */}
      <FeaturedPosts limit={3} />

      {/* Category Sections */}
      <CategorySection postsPerCategory={2} />

      {/* Info Card */}
      <div className="info-card">
        <div className="info-card-icon">{isMobile ? <Menu size={40} /> : <ArrowLeft size={40} />}</div>
        <div className="info-card-content">
          <h3>Jelajahi Tutorial</h3>
          <p>
            {isMobile
              ? 'Klik menu hamburger (☰) di atas untuk mengakses semua tutorial'
              : 'Gunakan menu di samping kiri untuk menjelajahi tutorial berdasarkan kategori'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
