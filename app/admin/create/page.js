'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CreateTutorial() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        videoId: '',
        content: '',
        order: 1
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/tutorials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
                <div className="form-group">
                    <label htmlFor="title">Judul Tutorial *</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Contoh: Tutorial 4: Advanced Topics"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="slug">Slug (URL) *</label>
                    <input
                        id="slug"
                        name="slug"
                        type="text"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="contoh: tutorial-4"
                        required
                    />
                    <small>URL: /tutorial/{formData.slug || 'slug-anda'}</small>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="videoId">YouTube Video ID</label>
                        <input
                            id="videoId"
                            name="videoId"
                            type="text"
                            value={formData.videoId}
                            onChange={handleChange}
                            placeholder="Contoh: dQw4w9WgXcQ"
                        />
                        <small>Ambil dari URL: youtube.com/watch?v=<strong>VIDEO_ID</strong></small>
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

                <div className="form-group">
                    <label htmlFor="content">Konten (Markdown)</label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Tulis konten tutorial dengan format Markdown..."
                        rows={12}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Menyimpan...' : '💾 Simpan Tutorial'}
                    </button>
                </div>
            </form>
        </div>
    );
}
