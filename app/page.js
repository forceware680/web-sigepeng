'use client';

export default function Home() {
  return (
    <div className="welcome-container">
      <div className="welcome-icon">🎓</div>
      <h1>Selamat Datang di Tutorial SIMASET</h1>
      <p className="welcome-subtitle">
        Panduan lengkap penggunaan Sistem Informasi Manajemen Aset
      </p>
      <div className="welcome-card">
        <div className="welcome-card-icon">👈</div>
        <div className="welcome-card-content">
          <h3>Mulai Belajar</h3>
          <p>Klik menu di samping kiri untuk mengakses tutorial yang tersedia</p>
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
