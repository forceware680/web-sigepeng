'use client';

import { useState, useEffect } from 'react';
import FeaturedPosts from '@/components/FeaturedPosts';
import CategorySection from '@/components/CategorySection';

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
          <div className="hero-icon">🎓</div>
          <h1 className="hero-title">Selamat Datang di Tutorial SIMASET</h1>
          <p className="hero-subtitle">
            Panduan lengkap penggunaan Sistem Informasi Manajemen Aset
          </p>
          <div className="hero-features">
            <div className="hero-feature-item">
              <span className="hero-feature-icon">📹</span>
              <span>Video Tutorial</span>
            </div>
            <div className="hero-feature-item">
              <span className="hero-feature-icon">📖</span>
              <span>Panduan Lengkap</span>
            </div>
            <div className="hero-feature-item">
              <span className="hero-feature-icon">🔄</span>
              <span>Update Berkala</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Posts Section */}
      <FeaturedPosts limit={3} />

      {/* Category Sections */}
      <CategorySection postsPerCategory={2} />

      {/* Info Card */}
      <div className="info-card">
        <div className="info-card-icon">{isMobile ? '☰' : '👈'}</div>
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
