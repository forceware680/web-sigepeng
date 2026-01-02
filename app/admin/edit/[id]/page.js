'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Video, Image } from 'lucide-react';
import WysiwygEditor from '@/components/WysiwygEditor';

export default function EditTutorial() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        categoryId: '',
        content: '',
        order: 1
    });
    const [media, setMedia] = useState([]);

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

    useEffect(() => {
        if (status === 'authenticated' && params.id) {
            fetchTutorial();
        }
    }, [status, params.id]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchTutorial = async () => {
        try {
            const res = await fetch(`/api/tutorials/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    title: data.title,
                    slug: data.slug,
                    categoryId: data.categoryId || '',
                    content: data.content || '',
                    order: data.order || 1
                });
                // Load existing media or convert from legacy videoId
                if (data.media && data.media.length > 0) {
                    setMedia(data.media);
                } else if (data.videoId) {
                    // Legacy format: convert single videoId to media array
                    setMedia([{
                        id: `media-${Date.now()}`,
                        type: 'video',
                        videoId: data.videoId,
                        title: 'Video Tutorial',
                        caption: ''
                    }]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Filter out empty media items
            const validMedia = media.filter(item =>
                (item.type === 'video' && item.videoId) ||
                (item.type === 'image' && item.url)
            );

            const res = await fetch(`/api/tutorials/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    media: validMedia
                    // author is preserved in API - original author is kept on edit
                })
            });

            if (res.ok) {
                router.push('/admin');
            }
        } catch (error) {
            console.error('Failed to update:', error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || fetching) {
        return <div className="admin-loading">Loading...</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>✏️ Edit Tutorial</h1>
                <Link href="/admin" className="btn-secondary">← Kembali</Link>
            </header>

            <form onSubmit={handleSubmit} className="tutorial-form">
                <div className="form-group">
                    <label htmlFor="title">Judul Tutorial *</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
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
                            required
                        />
                        <small>URL: /tutorial/{formData.slug}</small>
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
                        {loading ? 'Menyimpan...' : '💾 Update Tutorial'}
                    </button>
                </div>
            </form>
        </div>
    );
}

