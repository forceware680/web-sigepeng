'use client';

import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { ChevronRight, Folder } from 'lucide-react';
import Link from 'next/link';
import { ANNOUNCEMENT_CATEGORY_ID } from '@/lib/constants';

export default function CategorySection({ postsPerCategory = 2 }) {
    const [categoriesWithPosts, setCategoriesWithPosts] = useState([]);
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

            const tutorials = await tutorialsRes.json();
            const categories = await categoriesRes.json();

            // Group tutorials by category (pengumuman punya section sendiri di homepage)
            const grouped = categories
                .filter(category => category.id !== ANNOUNCEMENT_CATEGORY_ID)
                .map(category => {
                    const categoryPosts = tutorials
                        .filter(t => t.categoryId === category.id)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, postsPerCategory);

                    return {
                        ...category,
                        posts: categoryPosts,
                        totalPosts: tutorials.filter(t => t.categoryId === category.id).length
                    };
                })
                .filter(cat => cat.posts.length > 0) // Only show categories with posts
                .sort((a, b) => a.order - b.order);

            setCategoriesWithPosts(grouped);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="category-section">
                <div className="category-loading">
                    <div className="loading-spinner"></div>
                    <p>Memuat kategori...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="category-section">
                <div className="section-empty">
                    <p>Gagal memuat kategori. Periksa koneksi lalu coba lagi.</p>
                    <button className="retry-button" onClick={fetchData}>Muat Ulang</button>
                </div>
            </section>
        );
    }

    if (categoriesWithPosts.length === 0) {
        return (
            <section className="category-section">
                <p className="empty-state-text">Belum ada kategori yang berisi tutorial.</p>
            </section>
        );
    }

    return (
        <section className="category-section">
            {categoriesWithPosts.map(category => (
                <div key={category.id} className="category-group">
                    <div className="category-group-header">
                        <Link href={`/category/${category.slug}`} className="category-title-link">
                            <Folder size={20} />
                            <h2>{category.name}</h2>
                            <span className="category-count">
                                {category.totalPosts} tutorial
                            </span>
                            <ChevronRight size={18} className="category-arrow" />
                        </Link>
                    </div>
                    <div className="category-posts-grid">
                        {category.posts.map(post => (
                            <PostCard
                                key={post.id}
                                tutorial={post}
                                category={category}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}
