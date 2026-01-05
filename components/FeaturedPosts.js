'use client';

import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { TrendingUp } from 'lucide-react';

export default function FeaturedPosts({ limit = 3 }) {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tutorialsRes, categoriesRes] = await Promise.all([
                fetch('/api/tutorials'),
                fetch('/api/categories')
            ]);

            const tutorialsData = await tutorialsRes.json();
            const categoriesData = await categoriesRes.json();

            // Get latest posts
            const sortedPosts = tutorialsData
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, limit);

            setPosts(sortedPosts);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to fetch featured posts:', error);
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
                    <h2>Tutorial Terbaru</h2>
                </div>
                <div className="featured-loading">
                    <div className="loading-spinner"></div>
                    <p>Memuat tutorial...</p>
                </div>
            </section>
        );
    }

    if (posts.length === 0) {
        return null;
    }

    return (
        <section className="featured-section">
            <div className="section-header">
                <TrendingUp size={24} />
                <h2>Tutorial Terbaru</h2>
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
