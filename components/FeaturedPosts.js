'use client';

import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { TrendingUp } from 'lucide-react';
import { ANNOUNCEMENT_CATEGORY_ID } from '@/lib/constants';

export default function FeaturedPosts({ limit = 3 }) {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [tutorialsRes, categoriesRes] = await Promise.all([
                fetch('/api/tutorials'),
                fetch('/api/categories')
            ]);

            const tutorialsData = await tutorialsRes.json();
            const categoriesData = await categoriesRes.json();

            // Get latest posts (pengumuman punya section sendiri di homepage)
            const sortedPosts = tutorialsData
                .filter(t => t.categoryId !== ANNOUNCEMENT_CATEGORY_ID)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, limit);

            setPosts(sortedPosts);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to fetch featured posts:', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryById = (categoryId) => {
        return categories.find(c => c.id === categoryId);
    };

    if (loading) {
        return (
            <section className="featured-section">
                <div className="section-header">
                    <TrendingUp size={24} />
                    <h2>Postingan Terbaru</h2>
                </div>
                <div className="featured-loading">
                    <div className="loading-spinner"></div>
                    <p>Memuat postingan...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="featured-section">
                <div className="section-header">
                    <TrendingUp size={24} />
                    <h2>Postingan Terbaru</h2>
                </div>
                <div className="section-empty">
                    <p>Gagal memuat postingan. Periksa koneksi lalu coba lagi.</p>
                    <button className="retry-button" onClick={fetchData}>Muat Ulang</button>
                </div>
            </section>
        );
    }

    if (posts.length === 0) {
        return (
            <section className="featured-section">
                <div className="section-header">
                    <TrendingUp size={24} />
                    <h2>Postingan Terbaru</h2>
                </div>
                <p className="empty-state-text">Belum ada postingan yang dipublikasikan.</p>
            </section>
        );
    }

    return (
        <section className="featured-section">
            <div className="section-header">
                <TrendingUp size={24} />
                <h2>Postingan Terbaru</h2>
            </div>
            <div className="featured-grid">
                {posts.map(post => (
                    <PostCard
                        key={post.id}
                        tutorial={post}
                        category={getCategoryById(post.categoryId)}
                    />
                ))}
            </div>
        </section>
    );
}
