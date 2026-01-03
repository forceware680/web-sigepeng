'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Video, Image, FolderOpen } from 'lucide-react';
import WysiwygEditor from '@/components/WysiwygEditor';
import ImageGalleryModal from '@/components/ImageGalleryModal';

export default function CreateTutorial() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        categoryId: '',
        content: '',
        order: 1,
        status: 'published',
        publishedAt: new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDThh:mm
    });
    const [media, setMedia] = useState([]);
    const [showMediaGallery, setShowMediaGallery] = useState(false);

    useEffect(() => {
        // Only redirect after loading is complete
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchCategories();
        }
    }, [status]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'title' && !formData.slug ? {
                slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            } : {})
        }));
    };

    const addMedia = (type) => {
        const newMedia = {
            id: `media-${Date.now()}`,
            type: type,
            videoId: '',
            url: '',
            title: '',
            caption: ''
        };
        setMedia([...media, newMedia]);
    };

    const updateMedia = (id, field, value) => {
        setMedia(media.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeMedia = (id) => {
        setMedia(media.filter(item => item.id !== id));
    };

    // Handle selecting image from Cloudinary gallery
    const handleMediaGallerySelect = (imageUrl) => {
        const newMedia = {
            id: Date.now().toString(),
            type: 'image',
            videoId: '',
            url: imageUrl,
            title: '',
            caption: ''
        };
        setMedia([...media, newMedia]);
        setShowMediaGallery(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Filter out empty media items
            const validMedia = media.filter(item =>
                (item.type === 'video' && item.videoId) ||
                (item.type === 'image' && item.url)
            );

            const res = await fetch('/api/tutorials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    media: validMedia,
                    author: session?.user?.name || 'Admin'
                })
            });

            if (res.ok) {
                router.push('/admin');
            }
        } catch (error) {
            console.error('Failed to create:', error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return <div className="admin-loading">Loading...</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>➕ Tambah Tutorial Baru</h1>
                <Link href="/admin" className="btn-secondary">← Kembali</Link>
            </header>

            <form onSubmit={handleSubmit} className="tutorial-form">
                {/* Publishing Options - Top Bar */}
                <div className="form-section-card" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>📅 Opsi Publikasi</h3>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                            >
                                <option value="published">Published (Terbit)</option>
                                <option value="draft">Draft (Konsep)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="publishedAt">Waktu Terbit</label>
                            <input
                                id="publishedAt"
                                name="publishedAt"
                                type="datetime-local"
                                value={formData.publishedAt}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                            />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                                Jika waktu di masa depan, status akan otomatis menjadi "Terjadwal"
                            </small>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="title">Judul Tutorial *</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Contoh: Tutorial Pengeluaran Barang"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="slug">Slug (URL) *</label>
                        <input
                            id="slug"
                            name="slug"
                            type="text"
                            value={formData.slug}
                            onChange={handleChange}
                            placeholder="contoh: tutorial-pengeluaran"
                            required
                        />
                        <small>URL: /tutorial/{formData.slug || 'slug-anda'}</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="categoryId">Kategori</label>
                        <select
                            id="categoryId"
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                        >
                            <option value="">-- Pilih Kategori --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="order">Urutan</label>
                        <input
                            id="order"
                            name="order"
                            type="number"
                            value={formData.order}
                            onChange={handleChange}
                            min="1"
                        />
                    </div>
                </div>

                {/* Media Builder Section */}
                <div className="form-group">
                    <label>Media (Video & Gambar)</label>
                    <div className="media-builder">
                        <div className="media-actions">
                            <button type="button" className="btn-add-media" onClick={() => addMedia('video')}>
                                <Video size={16} /> Tambah Video
                            </button>
                            <button type="button" className="btn-add-media" onClick={() => addMedia('image')}>
                                <Image size={16} /> Tambah Gambar
                            </button>
                            <button type="button" className="btn-add-media btn-gallery" onClick={() => setShowMediaGallery(true)}>
                                <FolderOpen size={16} /> Pilih dari Gallery
                            </button>
                        </div>

                        {media.length === 0 && (
                            <div className="media-empty">
                                <p>Belum ada media. Klik tombol di atas untuk menambah video atau gambar.</p>
                            </div>
                        )}

                        <div className="media-list">
                            {media.map((item, index) => (
                                <div key={item.id} className={`media-card ${item.type}`}>
                                    <div className="media-card-header">
                                        <span className="media-type-badge">
                                            {item.type === 'video' ? <Video size={14} /> : <Image size={14} />}
                                            {item.type === 'video' ? 'Video' : 'Gambar'} #{index + 1}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-remove-media"
                                            onClick={() => removeMedia(item.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="media-card-body">
                                        {item.type === 'video' ? (
                                            <div className="form-group">
                                                <label>YouTube Video ID *</label>
                                                <input
                                                    type="text"
                                                    value={item.videoId}
                                                    onChange={(e) => updateMedia(item.id, 'videoId', e.target.value)}
                                                    placeholder="Contoh: dQw4w9WgXcQ"
                                                />
                                                <small>Dari URL: youtube.com/watch?v=<strong>VIDEO_ID</strong></small>
                                            </div>
                                        ) : (
                                            <div className="form-group">
                                                <label>URL Gambar *</label>
                                                <input
                                                    type="url"
                                                    value={item.url}
                                                    onChange={(e) => updateMedia(item.id, 'url', e.target.value)}
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            </div>
                                        )}

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Judul</label>
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => updateMedia(item.id, 'title', e.target.value)}
                                                    placeholder="Judul media"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Caption</label>
                                                <input
                                                    type="text"
                                                    value={item.caption}
                                                    onChange={(e) => updateMedia(item.id, 'caption', e.target.value)}
                                                    placeholder="Keterangan tambahan"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>Konten Tutorial</label>
                    <WysiwygEditor
                        value={formData.content}
                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                        placeholder="Tulis konten tutorial..."
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Menyimpan...' : '💾 Simpan Tutorial'}
                    </button>
                </div>
            </form>

            {/* Image Gallery Modal for Media Section */}
            <ImageGalleryModal
                isOpen={showMediaGallery}
                onClose={() => setShowMediaGallery(false)}
                onSelect={handleMediaGallerySelect}
            />
        </div>
    );
}

