'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Folder, Plus, Pencil, Save, Trash2, AlertTriangle, ArrowLeft, ChevronRight } from 'lucide-react';

// Available icons for category selection
const AVAILABLE_ICONS = [
    'BookOpen', 'Folder', 'FolderOpen', 'FileText', 'Video', 'Image', 'Settings',
    'Download', 'Upload', 'Database', 'Users', 'ShoppingCart', 'Package',
    'Clipboard', 'Archive', 'Calendar', 'Clock', 'Star', 'Heart',
    'CheckCircle', 'AlertCircle', 'Info', 'HelpCircle', 'Search', 'Filter'
];

function getIcon(iconName, props = {}) {
    const Icon = LucideIcons[iconName] || LucideIcons.Folder;
    return <Icon {...props} />;
}

export default function CategoriesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [categoryTree, setCategoryTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: 'Folder',
        order: 1,
        parentId: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        // Only redirect after loading is complete
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchCategories();
        }
    }, [status]);

    const fetchCategories = async () => {
        try {
            const [flatRes, treeRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/categories?tree=true')
            ]);
            const flatData = await flatRes.json();
            const treeData = await treeRes.json();
            setCategories(Array.isArray(flatData) ? flatData : []);
            setCategoryTree(Array.isArray(treeData) ? treeData : []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'name' && !editingId && !formData.slug ? {
                slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            } : {})
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const payload = {
                ...formData,
                parentId: formData.parentId || null,
                order: parseInt(formData.order) || 1
            };

            let response;
            if (editingId) {
                response = await fetch(`/api/categories/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Gagal menyimpan kategori');
                return;
            }

            resetForm();
            fetchCategories();
        } catch (error) {
            console.error('Failed to save category:', error);
            setError('Terjadi kesalahan saat menyimpan');
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            slug: category.slug,
            icon: category.icon || 'Folder',
            order: category.order || 1,
            parentId: category.parentId || ''
        });
        setShowForm(true);
        setError('');
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus kategori ini?')) return;

        try {
            const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const data = await response.json();
                alert(data.error || 'Gagal menghapus kategori');
                return;
            }
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', slug: '', icon: 'Folder', order: 1, parentId: '' });
        setError('');
    };

    // Build options for parent selector with indentation
    const buildParentOptions = (nodes, depth = 0, excludeId = null) => {
        const options = [];
        nodes.forEach(node => {
            // Don't show the current editing category or its descendants as parent options
            if (node.id === excludeId) return;

            const prefix = '-'.repeat(depth);
            options.push({
                id: node.id,
                label: depth > 0 ? `${prefix} ${node.name}` : node.name
            });

            if (node.children && node.children.length > 0) {
                options.push(...buildParentOptions(node.children, depth + 1, excludeId));
            }
        });
        return options;
    };

    // Build flat list with hierarchy info for table display
    const buildFlatListWithDepth = (nodes, depth = 0) => {
        const list = [];
        nodes.forEach(node => {
            list.push({ ...node, depth });
            if (node.children && node.children.length > 0) {
                list.push(...buildFlatListWithDepth(node.children, depth + 1));
            }
        });
        return list;
    };

    const parentOptions = buildParentOptions(categoryTree, 0, editingId);
    const flatCategoriesWithDepth = buildFlatListWithDepth(categoryTree);

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
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Folder size={24} /> Manajemen Kategori
                    </h1>
                    <p>Kelola kategori dan subkategori untuk menu tutorial</p>
                </div>
                <div className="admin-header-right">
                    <Link href="/admin" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ArrowLeft size={16} /> Kembali
                    </Link>
                </div>
            </header>

            <div className="admin-actions">
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    <Plus size={18} /> Tambah Kategori
                </button>
            </div>

            {showForm && (
                <div className="form-overlay">
                    <form onSubmit={handleSubmit} className="category-form">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {editingId ? <><Pencil size={20} /> Edit Kategori</> : <><Plus size={20} /> Tambah Kategori Baru</>}
                        </h2>

                        {error && (
                            <div className="form-error" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                color: '#ef4444',
                                background: 'rgba(239,68,68,0.1)',
                                padding: '10px',
                                borderRadius: '6px',
                                marginBottom: '15px'
                            }}>
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="parentId">Parent Kategori</label>
                            <select
                                id="parentId"
                                name="parentId"
                                value={formData.parentId}
                                onChange={handleChange}
                            >
                                <option value="">Tidak Ada (Root)</option>
                                {parentOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                            <small style={{ color: '#888', fontSize: '12px' }}>
                                Kosongkan untuk kategori utama (level 1)
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="name">Nama Kategori *</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Contoh: Pengeluaran"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="slug">Slug *</label>
                            <input
                                id="slug"
                                name="slug"
                                type="text"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="contoh: pengeluaran"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="icon">Icon</label>
                                <select
                                    id="icon"
                                    name="icon"
                                    value={formData.icon}
                                    onChange={handleChange}
                                >
                                    {AVAILABLE_ICONS.map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                </select>
                                <div className="icon-preview">
                                    {getIcon(formData.icon, { size: 24 })}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="order">Urutan</label>
                                <input
                                    id="order"
                                    name="order"
                                    type="number"
                                    value={formData.order}
                                    onChange={handleChange}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={resetForm} className="btn-secondary">
                                Batal
                            </button>
                            <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Save size={18} /> {editingId ? 'Update' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Icon</th>
                            <th>Nama</th>
                            <th>Slug</th>
                            <th>Urutan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flatCategoriesWithDepth.map((category) => (
                            <tr key={category.id}>
                                <td className="icon-cell">
                                    {getIcon(category.icon, { size: 20 })}
                                </td>
                                <td>
                                    <span style={{
                                        marginLeft: `${category.depth * 20}px`,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {category.depth > 0 && (
                                            <ChevronRight size={12} style={{ color: '#666' }} />
                                        )}
                                        {category.name}
                                    </span>
                                </td>
                                <td><code>{category.slug}</code></td>
                                <td>{category.order}</td>
                                <td className="action-buttons">
                                    <button onClick={() => handleEdit(category)} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Pencil size={14} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(category.id)} className="btn-delete" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Trash2 size={14} /> Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {categories.length === 0 && (
                    <div className="empty-state">
                        <p>Belum ada kategori. Klik tombol di atas untuk menambah.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
