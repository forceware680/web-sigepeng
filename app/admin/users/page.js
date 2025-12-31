'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Key, Plus, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [changingPasswordId, setChangingPasswordId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form states
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '' });
    const [editForm, setEditForm] = useState({ username: '', name: '' });
    const [passwordForm, setPasswordForm] = useState({ password: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchUsers();
        }
    }, [status]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin-users');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) {
            showMessage('error', 'Username dan password wajib diisi');
            return;
        }

        try {
            const res = await fetch('/api/admin-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage('error', data.error || 'Gagal menambah user');
                return;
            }

            showMessage('success', 'User berhasil ditambahkan');
            setNewUser({ username: '', password: '', name: '' });
            setShowAddForm(false);
            fetchUsers();
        } catch (error) {
            showMessage('error', 'Gagal menambah user');
        }
    };

    const handleEditUser = async (id) => {
        try {
            const res = await fetch(`/api/admin-users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage('error', data.error || 'Gagal mengupdate user');
                return;
            }

            showMessage('success', 'User berhasil diupdate');
            setEditingId(null);
            fetchUsers();
        } catch (error) {
            showMessage('error', 'Gagal mengupdate user');
        }
    };

    const handleChangePassword = async (id) => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showMessage('error', 'Password baru tidak sama');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            showMessage('error', 'Password minimal 6 karakter');
            return;
        }

        try {
            const res = await fetch(`/api/admin-users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: passwordForm.password,
                    newPassword: passwordForm.newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage('error', data.error || 'Gagal mengganti password');
                return;
            }

            showMessage('success', 'Password berhasil diganti');
            setChangingPasswordId(null);
            setPasswordForm({ password: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showMessage('error', 'Gagal mengganti password');
        }
    };

    const handleDeleteUser = async (id, username) => {
        if (!confirm(`Yakin ingin menghapus user "${username}"?`)) return;

        try {
            const res = await fetch(`/api/admin-users/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                showMessage('error', data.error || 'Gagal menghapus user');
                return;
            }

            showMessage('success', 'User berhasil dihapus');
            fetchUsers();
        } catch (error) {
            showMessage('error', 'Gagal menghapus user');
        }
    };

    const startEdit = (user) => {
        setEditingId(user.id);
        setEditForm({ username: user.username, name: user.name || '' });
        setChangingPasswordId(null);
    };

    const startChangePassword = (userId) => {
        setChangingPasswordId(userId);
        setPasswordForm({ password: '', newPassword: '', confirmPassword: '' });
        setEditingId(null);
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
                    <h1><User size={24} /> Kelola Admin Users</h1>
                    <p>Tambah, edit, atau hapus akun admin</p>
                </div>
                <div className="admin-header-right">
                    <Link href="/admin" className="btn-secondary">← Kembali</Link>
                </div>
            </header>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="admin-actions">
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn-primary"
                >
                    <Plus size={16} /> Tambah User Baru
                </button>
            </div>

            {/* Add User Form */}
            {showAddForm && (
                <div className="form-card">
                    <h3>Tambah User Baru</h3>
                    <form onSubmit={handleAddUser}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                    placeholder="username"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nama</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="Nama Lengkap"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="Minimal 6 karakter"
                                minLength={6}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-primary">
                                <Save size={16} /> Simpan
                            </button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                                <X size={16} /> Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Username</th>
                            <th>Nama</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user.id}>
                                <td>{index + 1}</td>
                                <td>
                                    {editingId === user.id ? (
                                        <input
                                            type="text"
                                            value={editForm.username}
                                            onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                            className="inline-input"
                                        />
                                    ) : (
                                        <strong>{user.username}</strong>
                                    )}
                                </td>
                                <td>
                                    {editingId === user.id ? (
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="inline-input"
                                        />
                                    ) : (
                                        user.name || '-'
                                    )}
                                </td>
                                <td className="action-buttons">
                                    {editingId === user.id ? (
                                        <>
                                            <button onClick={() => handleEditUser(user.id)} className="btn-save">
                                                <Save size={14} /> Simpan
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="btn-cancel">
                                                <X size={14} /> Batal
                                            </button>
                                        </>
                                    ) : changingPasswordId === user.id ? (
                                        <span className="changing-password-label">Mengubah password...</span>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(user)} className="btn-edit">
                                                ✏️ Edit
                                            </button>
                                            <button onClick={() => startChangePassword(user.id)} className="btn-password">
                                                <Key size={14} /> Password
                                            </button>
                                            <button onClick={() => handleDeleteUser(user.id, user.username)} className="btn-delete">
                                                <Trash2 size={14} /> Hapus
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="empty-state">
                        <p>Belum ada user admin.</p>
                    </div>
                )}
            </div>

            {/* Change Password Modal */}
            {changingPasswordId && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3><Key size={20} /> Ganti Password</h3>
                        <p className="modal-subtitle">
                            User: <strong>{users.find(u => u.id === changingPasswordId)?.username}</strong>
                        </p>

                        <div className="form-group">
                            <label>Password Lama</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPasswords.current ? "text" : "password"}
                                    value={passwordForm.password}
                                    onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                    placeholder="Masukkan password lama"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                >
                                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password Baru</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder="Minimal 6 karakter"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                >
                                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Konfirmasi Password Baru</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="Ulangi password baru"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                >
                                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => handleChangePassword(changingPasswordId)}
                                className="btn-primary"
                            >
                                <Save size={16} /> Simpan Password
                            </button>
                            <button
                                onClick={() => {
                                    setChangingPasswordId(null);
                                    setPasswordForm({ password: '', newPassword: '', confirmPassword: '' });
                                }}
                                className="btn-secondary"
                            >
                                <X size={16} /> Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .form-card {
                    background: #1e1e2e;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    border: 1px solid #313244;
                }

                .form-card h3 {
                    margin: 0 0 1rem 0;
                    color: #cdd6f4;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #a6adc8;
                    font-size: 0.9rem;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    background: #181825;
                    border: 1px solid #313244;
                    border-radius: 8px;
                    color: #cdd6f4;
                    font-size: 1rem;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #89b4fa;
                }

                .form-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .inline-input {
                    padding: 0.4rem 0.6rem;
                    background: #181825;
                    border: 1px solid #89b4fa;
                    border-radius: 6px;
                    color: #cdd6f4;
                    font-size: 0.9rem;
                    width: 100%;
                }

                .btn-password {
                    background: #fab387;
                    color: #1e1e2e;
                    border: none;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.85rem;
                }

                .btn-password:hover {
                    background: #f9e2af;
                }

                .btn-save {
                    background: #a6e3a1;
                    color: #1e1e2e;
                    border: none;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.85rem;
                }

                .btn-cancel {
                    background: #6c7086;
                    color: #cdd6f4;
                    border: none;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    font-size: 0.85rem;
                }

                .changing-password-label {
                    color: #fab387;
                    font-style: italic;
                    font-size: 0.9rem;
                }

                .message {
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    font-weight: 500;
                }

                .message.success {
                    background: rgba(166, 227, 161, 0.2);
                    color: #a6e3a1;
                    border: 1px solid #a6e3a1;
                }

                .message.error {
                    background: rgba(243, 139, 168, 0.2);
                    color: #f38ba8;
                    border: 1px solid #f38ba8;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: #1e1e2e;
                    border-radius: 16px;
                    padding: 2rem;
                    width: 90%;
                    max-width: 400px;
                    border: 1px solid #313244;
                }

                .modal-content h3 {
                    margin: 0 0 0.5rem 0;
                    color: #cdd6f4;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .modal-subtitle {
                    color: #a6adc8;
                    margin-bottom: 1.5rem;
                }

                .modal-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1.5rem;
                }

                .password-input-wrapper {
                    position: relative;
                    display: flex;
                }

                .password-input-wrapper input {
                    padding-right: 40px;
                }

                .toggle-password {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #6c7086;
                    cursor: pointer;
                    padding: 0;
                }

                .toggle-password:hover {
                    color: #cdd6f4;
                }

                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
