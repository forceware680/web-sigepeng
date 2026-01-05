'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Search, X, Eye } from 'lucide-react';
import MarkdownContent from '@/components/MarkdownContent';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import ImageEmbed from '@/components/ImageEmbed';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tutorials, setTutorials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewTutorial, setPreviewTutorial] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        // Only redirect after loading is complete and confirmed unauthenticated
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        // Only fetch data when we have a valid session
        if (status === 'authenticated') {
            fetchData();
        }
    }, [status]);

    const fetchData = async () => {
        try {
            const [tutRes, catRes] = await Promise.all([
                fetch('/api/tutorials?mode=admin'),
                fetch('/api/categories')
            ]);
            const tutData = await tutRes.json();
            const catData = await catRes.json();
            setTutorials(Array.isArray(tutData) ? tutData : []);
            setCategories(Array.isArray(catData) ? catData : []);
            setSelectedIds([]); // Reset selection after refresh
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : '-';
    };

    const getMediaCount = (tutorial) => {
        if (tutorial.media && tutorial.media.length > 0) {
            const videos = tutorial.media.filter(m => m.type === 'video').length;
            const images = tutorial.media.filter(m => m.type === 'image').length;
            const parts = [];
            if (videos > 0) parts.push(`${videos} video`);
            if (images > 0) parts.push(`${images} gambar`);
            return parts.join(', ') || '-';
        }
        // Legacy format
        if (tutorial.videoId) return '1 video';
        return '-';
    };

    const getStatusBadge = (tutorial) => {
        const isPublished = tutorial.status === 'published';
        const isFuture = new Date(tutorial.publishedAt || tutorial.createdAt) > new Date();

        if (tutorial.status === 'draft') return <span className="badge badge-draft">Draft</span>;
        if (isPublished && isFuture) return <span className="badge badge-scheduled">Terjadwal</span>;
        return <span className="badge badge-published">Published</span>;
    };

    // Handle select all checkbox
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(tutorials.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    // Handle individual checkbox
    const handleSelectOne = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Check if all are selected
    const isAllSelected = tutorials.length > 0 && selectedIds.length === tutorials.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < tutorials.length;

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus tutorial ini?')) return;

        try {
            await fetch(`/api/tutorials/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const count = selectedIds.length;
        if (!confirm(`Yakin ingin menghapus ${count} tutorial yang dipilih?`)) return;

        setDeleting(true);
        try {
            // Delete all selected tutorials
            await Promise.all(
                selectedIds.map(id =>
                    fetch(`/api/tutorials/${id}`, { method: 'DELETE' })
                )
            );
            fetchData();
        } catch (error) {
            console.error('Failed to bulk delete:', error);
        } finally {
            setDeleting(false);
        }
    };

    // Filter tutorials based on search query
    const filteredTutorials = tutorials.filter(tutorial => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const title = tutorial.title?.toLowerCase() || '';
        const content = tutorial.content?.toLowerCase() || '';
        const categoryName = getCategoryName(tutorial.categoryId).toLowerCase();
        
        return title.includes(query) || 
               content.includes(query) || 
               categoryName.includes(query);
    });

    // Handle preview
    const handlePreview = (tutorial) => {
        setPreviewTutorial(tutorial);
        setShowPreview(true);
    };

    const closePreview = () => {
        setShowPreview(false);
        setPreviewTutorial(null);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
    };

    if (status === 'loading' || loading) {
        return <div className="admin-loading">Loading...</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-header-left">
                    <h1>📚 Admin Dashboard</h1>
                    <p>Selamat datang, {session.user.name}</p>
                </div>
                <div className="admin-header-right">
                    <Link href="/" className="btn-secondary">Lihat Website</Link>
                    <button onClick={() => signOut()} className="btn-logout">Logout</button>
                </div>
            </header>

            <div className="admin-actions">
                <Link href="/admin/create" className="btn-primary">
                    ➕ Tambah Tutorial
                </Link>
                <Link href="/admin/categories" className="btn-secondary">
                    📁 Kelola Kategori
                </Link>
                <Link href="/admin/users" className="btn-secondary">
                    👤 Kelola Users
                </Link>

                {/* Bulk Delete Button */}
                {selectedIds.length > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        className="btn-bulk-delete"
                        disabled={deleting}
                    >
                        <Trash2 size={16} />
                        {deleting
                            ? 'Menghapus...'
                            : `Hapus ${selectedIds.length} Tutorial`
                        }
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="search-container">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Cari tutorial berdasarkan judul, kategori, atau konten..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            className="search-clear"
                            onClick={clearSearch}
                            title="Clear search"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <div className="search-results-info">
                        Ditemukan {filteredTutorials.length} dari {tutorials.length} tutorial
                    </div>
                )}
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th className="checkbox-col">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    ref={el => {
                                        if (el) el.indeterminate = isSomeSelected;
                                    }}
                                    onChange={handleSelectAll}
                                    title="Pilih Semua"
                                />
                            </th>
                            <th>No</th>
                            <th>Judul</th>
                            <th>Status</th>
                            <th>Kategori</th>
                            <th>Media</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTutorials.map((tutorial, index) => (
                            <tr
                                key={tutorial.id}
                                className={selectedIds.includes(tutorial.id) ? 'selected' : ''}
                            >
                                <td className="checkbox-col">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(tutorial.id)}
                                        onChange={() => handleSelectOne(tutorial.id)}
                                    />
                                </td>
                                <td>{index + 1}</td>
                                <td>{tutorial.title}</td>
                                <td>{getStatusBadge(tutorial)}</td>
                                <td>{getCategoryName(tutorial.categoryId)}</td>
                                <td><code>{getMediaCount(tutorial)}</code></td>
                                <td className="action-buttons">
                                    <button 
                                        onClick={() => handlePreview(tutorial)} 
                                        className="btn-preview"
                                        title="Preview"
                                    >
                                        <Eye size={16} /> Preview
                                    </button>
                                    <Link href={`/admin/edit/${tutorial.id}`} className="btn-edit">
                                        ✏️ Edit
                                    </Link>
                                    <button onClick={() => handleDelete(tutorial.id)} className="btn-delete">
                                        🗑️ Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredTutorials.length === 0 && tutorials.length > 0 && (
                    <div className="empty-state">
                        <p>Tidak ada tutorial yang cocok dengan pencarian "{searchQuery}"</p>
                    </div>
                )}

                {tutorials.length === 0 && (
                    <div className="empty-state">
                        <p>Belum ada tutorial. Klik tombol di atas untuk menambah.</p>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && previewTutorial && (
                <div className="preview-modal-overlay" onClick={closePreview}>
                    <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="preview-header">
                            <div className="preview-header-left">
                                <h2>{previewTutorial.title}</h2>
                                <div className="preview-meta">
                                    {getStatusBadge(previewTutorial)}
                                    <span className="preview-category">
                                        📁 {getCategoryName(previewTutorial.categoryId)}
                                    </span>
                                    {previewTutorial.author && (
                                        <span className="preview-author">
                                            ✍️ {previewTutorial.author}
                                        </span>
                                    )}
                                    {previewTutorial.views > 0 && (
                                        <span className="preview-views">
                                            👁️ {previewTutorial.views} views
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button 
                                className="preview-close"
                                onClick={closePreview}
                                title="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="preview-content">
                            {/* Media Section */}
                            {previewTutorial.media && previewTutorial.media.length > 0 && (
                                <div className="preview-media-section">
                                    {previewTutorial.media.map((media, idx) => (
                                        <div key={media.id || idx} className="preview-media-item">
                                            {media.type === 'video' && media.videoId && (
                                                <div className="preview-video">
                                                    <YouTubeEmbed 
                                                        videoId={media.videoId} 
                                                        title={media.title || 'Tutorial Video'} 
                                                    />
                                                    {media.title && (
                                                        <p className="media-title">{media.title}</p>
                                                    )}
                                                    {media.caption && (
                                                        <p className="media-caption">{media.caption}</p>
                                                    )}
                                                </div>
                                            )}
                                            {media.type === 'image' && media.url && (
                                                <div className="preview-image">
                                                    <ImageEmbed
                                                        url={media.url}
                                                        title={media.title}
                                                        caption={media.caption}
                                                        alt={media.title || 'Tutorial Image'}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Content Section */}
                            {previewTutorial.content && (
                                <div className="preview-text-content">
                                    <MarkdownContent content={previewTutorial.content} />
                                </div>
                            )}

                            {!previewTutorial.content && (!previewTutorial.media || previewTutorial.media.length === 0) && (
                                <div className="preview-empty">
                                    <p>Tutorial ini belum memiliki konten.</p>
                                </div>
                            )}
                        </div>

                        <div className="preview-footer">
                            <button className="btn-secondary" onClick={closePreview}>
                                Tutup
                            </button>
                            <Link 
                                href={`/admin/edit/${previewTutorial.id}`} 
                                className="btn-primary"
                            >
                                ✏️ Edit Tutorial
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

