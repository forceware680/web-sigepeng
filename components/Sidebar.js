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
    const [categoryTree, setCategoryTree] = useState([]);
    const [tutorials, setTutorials] = useState([]);
    const [expandedNodes, setExpandedNodes] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Close sidebar when navigating on mobile
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Auto-expand path to active tutorial
    useEffect(() => {
        if (pathname.startsWith('/tutorial/') && categoryTree.length > 0) {
            const currentSlug = pathname.split('/tutorial/')[1];
            const currentTutorial = tutorials.find(t => t.slug === currentSlug);
            if (currentTutorial && currentTutorial.categoryId) {
                const expandPath = (nodes, targetId, path = []) => {
                    for (const node of nodes) {
                        if (node.id === targetId) {
                            return [...path, node.id];
                        }
                        if (node.children && node.children.length > 0) {
                            const found = expandPath(node.children, targetId, [...path, node.id]);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const pathToExpand = expandPath(categoryTree, currentTutorial.categoryId);
                if (pathToExpand) {
                    setExpandedNodes(prev => {
                        const newExpanded = { ...prev };
                        pathToExpand.forEach(id => newExpanded[id] = true);
                        return newExpanded;
                    });
                }
            }
        }
    }, [pathname, tutorials, categoryTree]);

    const fetchData = async () => {
        try {
            const [catRes, tutRes] = await Promise.all([
                fetch('/api/categories?tree=true'),
                fetch('/api/tutorials')
            ]);
            const catData = await catRes.json();
            const tutData = await tutRes.json();
            setCategoryTree(Array.isArray(catData) ? catData : []);
            setTutorials(Array.isArray(tutData) ? tutData : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }));
    };

    const getTutorialsByCategory = (categoryId) => {
        return tutorials
            .filter(t => t.categoryId === categoryId)
            .sort((a, b) => a.order - b.order);
    };

    // Recursive component for rendering category tree
    const CategoryNode = ({ category, depth = 0 }) => {
        const categoryTutorials = getTutorialsByCategory(category.id);
        const hasChildren = category.children && category.children.length > 0;
        const hasTutorials = categoryTutorials.length > 0;
        const isExpanded = expandedNodes[category.id];
        const hasActiveTutorial = categoryTutorials.some(
            t => pathname === `/tutorial/${t.slug}`
        );

        const hasActiveDescendant = (node) => {
            const nodeTutorials = getTutorialsByCategory(node.id);
            if (nodeTutorials.some(t => pathname === `/tutorial/${t.slug}`)) return true;
            if (node.children) {
                return node.children.some(child => hasActiveDescendant(child));
            }
            return false;
        };

        return (
            <div className="menu-category" style={{ marginLeft: depth > 0 ? '12px' : '0' }}>
                <button
                    className={`category-header ${hasActiveTutorial || hasActiveDescendant(category) ? 'has-active' : ''} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleNode(category.id)}
                    aria-expanded={isExpanded}
                    style={{ paddingLeft: depth > 0 ? '8px' : '12px' }}
                >
                    <div className="category-left">
                        {(hasChildren || hasTutorials) && (
                            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                                {getIcon('ChevronRight', { size: 16 })}
                            </span>
                        )}
                        <span className="category-icon">
                            {getIcon(category.icon, { size: 18 - Math.min(depth * 2, 4) })}
                        </span>
                        <span className="category-name">{category.name}</span>
                    </div>
                    {(hasChildren || hasTutorials) && (
                        <span className="item-count">
                            {hasTutorials && categoryTutorials.length}
                            {hasChildren && !hasTutorials && category.children.length}
                        </span>
                    )}
                </button>

                <div className={`submenu-wrapper ${isExpanded ? 'expanded' : ''}`}>
                    {hasChildren && isExpanded && (
                        <div className="subcategories">
                            {category.children.map(child => (
                                <CategoryNode
                                    key={child.id}
                                    category={child}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    )}

                    {hasTutorials && isExpanded && (
                        <ul className="submenu expanded">
                            {categoryTutorials.map(tutorial => (
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
                    )}

                    {!hasChildren && !hasTutorials && isExpanded && (
                        <div className="empty-category" style={{ marginLeft: '24px', fontSize: '12px', opacity: 0.6 }}>
                            Belum ada konten
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const getAllCategoryIds = (nodes) => {
        const ids = [];
        nodes.forEach(node => {
            ids.push(node.id);
            if (node.children) {
                ids.push(...getAllCategoryIds(node.children));
            }
        });
        return ids;
    };

    const allCategoryIds = getAllCategoryIds(categoryTree);
    const uncategorizedTutorials = tutorials.filter(t =>
        !t.categoryId || !allCategoryIds.includes(t.categoryId)
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="mobile-header">
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <h1 style={{
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        📚 SIMASET WIKI
                    </h1>
                </Link>
                <button
                    className="hamburger-btn"
                    onClick={() => setIsMobileOpen(true)}
                    aria-label="Open menu"
                >
                    {getIcon('Menu', { size: 24 })}
                </button>
            </div>

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${isMobileOpen ? 'show' : ''}`}
                onClick={() => setIsMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
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
                            {categoryTree.map(category => (
                                <CategoryNode key={category.id} category={category} />
                            ))}

                            {uncategorizedTutorials.length > 0 && (
                                <div className="menu-category">
                                    <div className="category-header uncategorized">
                                        <span className="category-icon">
                                            {getIcon('FileText', { size: 18 })}
                                        </span>
                                        <span className="category-name">Lainnya</span>
                                    </div>
                                    <ul className="submenu expanded">
                                        {uncategorizedTutorials.map(tutorial => (
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

                            {categoryTree.length === 0 && uncategorizedTutorials.length === 0 && (
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
        </>
    );
}
