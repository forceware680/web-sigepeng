'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EditTutorial() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
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

    useEffect(() => {
        if (params.id) {
            fetchTutorial();
        }
    }, [params.id]);

    const fetchTutorial = async () => {
        try {
            const res = await fetch(`/api/tutorials/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    title: data.title,
                    slug: data.slug,
                    videoId: data.videoId || '',
                    content: data.content || '',
                    order: data.order || 1
                });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/tutorials/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
                        rows={12}
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
