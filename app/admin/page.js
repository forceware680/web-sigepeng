'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tutorials, setTutorials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tutRes, catRes] = await Promise.all([
                fetch('/api/tutorials'),
                fetch('/api/categories')
            ]);
            const tutData = await tutRes.json();
            const catData = await catRes.json();
            setTutorials(Array.isArray(tutData) ? tutData : []);
            setCategories(Array.isArray(catData) ? catData : []);
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

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus tutorial ini?')) return;

        try {
            await fetch(`/api/tutorials/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
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
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Judul</th>
                            <th>Kategori</th>
                            <th>Media</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tutorials.map((tutorial, index) => (
                            <tr key={tutorial.id}>
                                <td>{index + 1}</td>
                                <td>{tutorial.title}</td>
                                <td>{getCategoryName(tutorial.categoryId)}</td>
                                <td><code>{getMediaCount(tutorial)}</code></td>
                                <td className="action-buttons">
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

                {tutorials.length === 0 && (
                    <div className="empty-state">
                        <p>Belum ada tutorial. Klik tombol di atas untuk menambah.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

