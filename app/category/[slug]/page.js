'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Folder } from 'lucide-react';
import PostCard from '@/components/PostCard';

export default function CategoryPage() {
    const params = useParams();
    const slug = params.slug;

    const [category, setCategory] = useState(null);
    const [tutorials, setTutorials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchData();
        }
    }, [slug]);

    const fetchData = async () => {
        try {
            const [tutorialsRes, categoriesRes] = await Promise.all([
                fetch('/api/tutorials'),
                fetch('/api/categories')
            ]);

            const allTutorials = await tutorialsRes.json();
            const allCategories = await categoriesRes.json();

            // Find category by slug
            const foundCategory = allCategories.find(c => c.slug === slug);

            if (foundCategory) {
                setCategory(foundCategory);

                // Get all tutorials in this category
                const categoryTutorials = allTutorials
                    .filter(t => t.categoryId === foundCategory.id)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setTutorials(categoryTutorials);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="category-page">
                <div className="category-page-loading">
                    <div className="loading-spinner"></div>
                    <p>Memuat kategori...</p>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="category-page">
                <div className="category-not-found">
                    <h1>Kategori Tidak Ditemukan</h1>
                    <p>Kategori yang Anda cari tidak ada.</p>
                    <Link href="/" className="back-home-btn">
                        <ArrowLeft size={18} />
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="category-page">
            {/* Category Header */}
            <div className="category-page-header">
                <Link href="/" className="back-link">
                    <ArrowLeft size={18} />
                    Kembali
                </Link>
                <div className="category-page-title">
                    <Folder size={28} />
                    <h1>{category.name}</h1>
                </div>
                <p className="category-page-count">
                    {tutorials.length} tutorial dalam kategori ini
                </p>
            </div>

            {/* Tutorials Grid */}
            {tutorials.length > 0 ? (
                <div className="category-tutorials-grid">
                    {tutorials.map(tutorial => (
                        <PostCard
                            key={tutorial.id}
                            tutorial={tutorial}
                            category={category}
                        />
                    ))}
                </div>
            ) : (
                <div className="category-empty">
                    <p>Belum ada tutorial dalam kategori ini.</p>
                </div>
            )}
        </div>
    );
}
