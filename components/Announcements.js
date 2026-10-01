'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Megaphone, ArrowRight } from 'lucide-react';
import { ANNOUNCEMENT_CATEGORY_ID } from '@/lib/constants';

const FRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

export default function Announcements({ limit = 5 }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/tutorials');
            const data = await res.json();
            setPosts(
                data
                    .filter(t => t.categoryId === ANNOUNCEMENT_CATEGORY_ID)
                    .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
                    .slice(0, limit)
            );
        } catch (err) {
            console.error('Failed to fetch announcements:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <section className="announcements-section">
                <div className="section-header">
                    <Megaphone size={24} />
                    <h2>Pengumuman</h2>
                </div>
                <div className="featured-loading">
                    <div className="loading-spinner"></div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="announcements-section">
                <div className="section-header">
                    <Megaphone size={24} />
                    <h2>Pengumuman</h2>
                </div>
                <div className="section-empty">
                    <p>Gagal memuat pengumuman. Periksa koneksi lalu coba lagi.</p>
                    <button className="retry-button" onClick={fetchData}>Muat Ulang</button>
                </div>
            </section>
        );
    }

    return (
        <section className="announcements-section">
            <div className="section-header">
                <Megaphone size={24} />
                <h2>Pengumuman</h2>
            </div>

            {posts.length === 0 ? (
                <p className="empty-state-text">Belum ada pengumuman.</p>
            ) : (
                <>
                    <div className="announcements-list">
                        {posts.map(post => {
                            const fresh = post.publishedAt &&
                                Date.now() - new Date(post.publishedAt).getTime() < FRESH_WINDOW_MS;
                            return (
                                <Link key={post.id} href={`/tutorial/${post.slug}`} className="announcement-item">
                                    <span className="announcement-date">
                                        {formatDate(post.publishedAt || post.createdAt)}
                                    </span>
                                    <span className="announcement-title">{post.title}</span>
                                    {fresh && <span className="announcement-badge">Baru</span>}
                                </Link>
                            );
                        })}
                    </div>
                    <Link href="/category/pengumuman" className="announcements-more">
                        Lihat semua <ArrowRight size={14} />
                    </Link>
                </>
            )}
        </section>
    );
}
