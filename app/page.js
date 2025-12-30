'use client';

import { useState, useEffect } from 'react';

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
    <div className="welcome-container">
      <div className="welcome-icon">🎓</div>
      <h1>Selamat Datang di Tutorial SIMASET</h1>
      <p className="welcome-subtitle">
        Panduan lengkap penggunaan Sistem Informasi Manajemen Aset
      </p>
      <div className="welcome-card">
        <div className="welcome-card-icon">{isMobile ? '☰' : '👈'}</div>
        <div className="welcome-card-content">
          <h3>Mulai Belajar</h3>
          <p>
            {isMobile
              ? 'Klik menu hamburger (☰) di atas untuk mengakses tutorial'
              : 'Klik menu di samping kiri untuk mengakses tutorial yang tersedia'
            }
          </p>
        </div>
      </div>
      <div className="welcome-features">
        <div className="feature-item">
          <span className="feature-icon">📹</span>
          <span>Video Tutorial</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📖</span>
          <span>Panduan Lengkap</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🔄</span>
          <span>Update Berkala</span>
        </div>
      </div>
    </div>
  );
}
