'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

// Available icons for category selection
const AVAILABLE_ICONS = [
    'BookOpen', 'Folder', 'FileText', 'Video', 'Image', 'Settings',
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
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: 'Folder',
        order: 1
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
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

        try {
            if (editingId) {
                await fetch(`/api/categories/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            resetForm();
            fetchCategories();
        } catch (error) {
            console.error('Failed to save category:', error);
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            slug: category.slug,
            icon: category.icon || 'Folder',
            order: category.order || 1
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus kategori ini?')) return;

        try {
            await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', slug: '', icon: 'Folder', order: 1 });
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
                    <h1>📁 Manajemen Kategori</h1>
                    <p>Kelola kategori untuk menu tutorial</p>
                </div>
                <div className="admin-header-right">
                    <Link href="/admin" className="btn-secondary">← Kembali</Link>
                </div>
            </header>

            <div className="admin-actions">
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="btn-primary"
                >
                    ➕ Tambah Kategori
                </button>
            </div>

            {showForm && (
                <div className="form-overlay">
                    <form onSubmit={handleSubmit} className="category-form">
                        <h2>{editingId ? '✏️ Edit Kategori' : '➕ Tambah Kategori Baru'}</h2>

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
                            <button type="submit" className="btn-primary">
                                {editingId ? '💾 Update' : '💾 Simpan'}
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
                        {categories.map((category) => (
                            <tr key={category.id}>
                                <td className="icon-cell">
                                    {getIcon(category.icon, { size: 20 })}
                                </td>
                                <td>{category.name}</td>
                                <td><code>{category.slug}</code></td>
                                <td>{category.order}</td>
                                <td className="action-buttons">
                                    <button onClick={() => handleEdit(category)} className="btn-edit">
                                        ✏️ Edit
                                    </button>
                                    <button onClick={() => handleDelete(category.id)} className="btn-delete">
                                        🗑️ Hapus
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
