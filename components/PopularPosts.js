'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TrendingUp, Eye } from 'lucide-react';

export default function PopularPosts({ limit = 5 }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPopularPosts();
    }, []);

    const fetchPopularPosts = async () => {
        try {
            const res = await fetch('/api/tutorials');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Sort by views descending
                const sorted = data
                    .filter(t => (t.views || 0) > 0)
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, limit);
                setPosts(sorted);
            }
        } catch (error) {
            console.error('Failed to fetch popular posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatViews = (num) => {
        if (!num) return '0';
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    if (loading) {
        return (
            <div className="popular-posts-widget">
                <h3><TrendingUp size={16} /> Populer</h3>
                <div className="widget-loading">Memuat...</div>
            </div>
        );
    }

    if (posts.length === 0) {
        return null;
    }

    return (
        <aside className="popular-posts-widget">
            <h3><TrendingUp size={16} /> Populer</h3>
            <ul className="popular-posts-list">
                {posts.map((post, index) => (
                    <li key={post.id}>
                        <Link href={`/tutorial/${post.slug}`} className="popular-post-item">
                            <span className="popular-rank">{index + 1}</span>
                            <div className="popular-content">
                                <span className="post-title">{post.title}</span>
                                <span className="post-views">
                                    <Eye size={12} />
                                    {formatViews(post.views)}
                                </span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
