'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import SearchBar from './SearchBar';

// Helper to get icon component by name
function getIcon(iconName, props = {}) {
    const Icon = LucideIcons[iconName] || LucideIcons.Folder;
    return <Icon {...props} />;
}

export default function Sidebar() {
    const pathname = usePathname();
    const [categories, setCategories] = useState([]);
    const [tutorials, setTutorials] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-expand category that contains active tutorial
    useEffect(() => {
        if (pathname.startsWith('/tutorial/')) {
            const currentSlug = pathname.split('/tutorial/')[1];
            const currentTutorial = tutorials.find(t => t.slug === currentSlug);
            if (currentTutorial && currentTutorial.categoryId) {
                setExpandedCategories(prev => ({
                    ...prev,
                    [currentTutorial.categoryId]: true
                }));
            }
        }
    }, [pathname, tutorials]);

    const fetchData = async () => {
        try {
            const [catRes, tutRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/tutorials')
            ]);
            const catData = await catRes.json();
            const tutData = await tutRes.json();
            setCategories(Array.isArray(catData) ? catData : []);
            setTutorials(Array.isArray(tutData) ? tutData : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const getTutorialsByCategory = (categoryId) => {
        return tutorials
            .filter(t => t.categoryId === categoryId)
            .sort((a, b) => a.order - b.order);
    };

    // Get tutorials without a category
    const uncategorizedTutorials = tutorials.filter(t =>
        !t.categoryId || !categories.find(c => c.id === t.categoryId)
    );

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link href="/"><h1>📚 SIMASET WIKI</h1></Link>
            </div>
            <div className="sidebar-search">
                <SearchBar />
            </div>
            <nav className="sidebar-nav">
                {loading ? (
                    <div className="sidebar-loading">Memuat...</div>
                ) : (
                    <>
                        {categories.map((category) => {
                            const categoryTutorials = getTutorialsByCategory(category.id);
                            const isExpanded = expandedCategories[category.id];
                            const hasActiveTutorial = categoryTutorials.some(
                                t => pathname === `/tutorial/${t.slug}`
                            );

                            return (
                                <div key={category.id} className="menu-category">
                                    <button
                                        className={`category-header ${hasActiveTutorial ? 'has-active' : ''}`}
                                        onClick={() => toggleCategory(category.id)}
                                        aria-expanded={isExpanded}
                                    >
                                        <span className="category-icon">
                                            {getIcon(category.icon, { size: 18 })}
                                        </span>
                                        <span className="category-name">{category.name}</span>
                                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                                            {getIcon('ChevronRight', { size: 16 })}
                                        </span>
                                    </button>

                                    <ul className={`submenu ${isExpanded ? 'expanded' : ''}`}>
                                        {categoryTutorials.map((tutorial) => (
                                            <li key={tutorial.id}>
                                                <Link
                                                    href={`/tutorial/${tutorial.slug}`}
                                                    className={pathname === `/tutorial/${tutorial.slug}` ? 'active' : ''}
                                                >
                                                    {tutorial.title}
                                                </Link>
                                            </li>
                                        ))}
                                        {categoryTutorials.length === 0 && (
                                            <li className="empty-category">Belum ada tutorial</li>
                                        )}
                                    </ul>
                                </div>
                            );
                        })}

                        {/* Uncategorized tutorials */}
                        {uncategorizedTutorials.length > 0 && (
                            <div className="menu-category">
                                <div className="category-header uncategorized">
                                    <span className="category-icon">
                                        {getIcon('FileText', { size: 18 })}
                                    </span>
                                    <span className="category-name">Lainnya</span>
                                </div>
                                <ul className="submenu expanded">
                                    {uncategorizedTutorials.map((tutorial) => (
                                        <li key={tutorial.id}>
                                            <Link
                                                href={`/tutorial/${tutorial.slug}`}
                                                className={pathname === `/tutorial/${tutorial.slug}` ? 'active' : ''}
                                            >
                                                {tutorial.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {categories.length === 0 && uncategorizedTutorials.length === 0 && (
                            <div className="empty-state">
                                <p>Belum ada tutorial</p>
                            </div>
                        )}
                    </>
                )}
            </nav>
            <div className="sidebar-footer">
                <Link href="/admin" className="admin-link">🔐 Admin</Link>
                <p>© 2025 Tutorial SIMASET</p>
            </div>
        </aside>
    );
}

