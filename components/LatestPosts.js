'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';

export default function LatestPosts({ currentSlug, limit = 5 }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLatestPosts();
    }, []);

    const fetchLatestPosts = async () => {
        try {
            const res = await fetch('/api/tutorials');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Sort by createdAt descending and exclude current
                const sorted = data
                    .filter(t => t.slug !== currentSlug)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, limit);
                setPosts(sorted);
            }
        } catch (error) {
            console.error('Failed to fetch latest posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const title = (
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Newspaper size={18} /> Postingan Terbaru
        </h3>
    );

    if (loading) {
        return (
            <div className="latest-posts-widget">
                {title}
                <div className="widget-loading">Memuat...</div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <aside className="latest-posts-widget">
                {title}
                <p className="empty-state-text">Belum ada postingan.</p>
            </aside>
        );
    }

    return (
        <aside className="latest-posts-widget">
            {title}
            <ul className="latest-posts-list">
                {posts.map(post => (
                    <li key={post.id}>
                        <Link href={`/tutorial/${post.slug}`} className="latest-post-item">
                            <span className="post-title">{post.title}</span>
                            <span className="post-date">
                                {new Date(post.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
