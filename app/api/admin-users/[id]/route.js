import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase, getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');

// Read admin users from local file
function readLocalAdmins() {
    try {
        const data = fs.readFileSync(adminFilePath, 'utf8');
        return JSON.parse(data).users || [];
    } catch {
        return [];
    }
}

// Write admin users to local file
function writeLocalAdmins(users) {
    fs.writeFileSync(adminFilePath, JSON.stringify({ users }, null, 4));
}

// PUT update admin user (change password or name)
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { password, newPassword, name, username } = body;

        if (isSupabaseConfigured()) {
            const client = getServiceSupabase();
            if (!client) {
                return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
            }

            // Get current user
            const { data: currentUser, error: fetchError } = await client
                .from('admin_users')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError || !currentUser) {
                return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
            }

            // Prepare update data
            const updateData = {};

            // If changing password, verify old password first
            if (newPassword) {
                if (!password) {
                    return NextResponse.json({ error: 'Password lama wajib diisi' }, { status: 400 });
                }

                const isValid = await bcrypt.compare(password, currentUser.password);
                if (!isValid) {
                    return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
                }

                updateData.password = await bcrypt.hash(newPassword, 10);
            }

            if (name) updateData.name = name;
            if (username && username !== currentUser.username) {
                // Check if new username is taken
                const { data: existing } = await client
                    .from('admin_users')
                    .select('id')
                    .eq('username', username)
                    .neq('id', id)
                    .single();

                if (existing) {
                    return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
                }
                updateData.username = username;
            }

            if (Object.keys(updateData).length === 0) {
                return NextResponse.json({ error: 'Tidak ada data yang diubah' }, { status: 400 });
            }

            const { error } = await client
                .from('admin_users')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            return NextResponse.json({ message: 'User berhasil diupdate' });
        } else {
            // Local file handling
            const users = readLocalAdmins();
            const userIndex = users.findIndex(u => u.id === id);

            if (userIndex === -1) {
                return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
            }

            // If changing password, verify old password
            if (newPassword) {
                if (!password) {
                    return NextResponse.json({ error: 'Password lama wajib diisi' }, { status: 400 });
                }

                const isValid = await bcrypt.compare(password, users[userIndex].password);
                if (!isValid) {
                    return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
                }

                users[userIndex].password = await bcrypt.hash(newPassword, 10);
            }

            if (name) users[userIndex].name = name;
            if (username && username !== users[userIndex].username) {
                // Check if new username is taken
                if (users.some(u => u.username === username && u.id !== id)) {
                    return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
                }
                users[userIndex].username = username;
            }

            writeLocalAdmins(users);
            return NextResponse.json({ message: 'User berhasil diupdate' });
        }
    } catch (error) {
        console.error('PUT admin user error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE admin user
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (isSupabaseConfigured()) {
            const client = getServiceSupabase();
            if (!client) {
                return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
            }

            // Check if this is the last admin
            const { data: allUsers } = await client
                .from('admin_users')
                .select('id');

            if (allUsers && allUsers.length <= 1) {
                return NextResponse.json({ error: 'Tidak bisa menghapus admin terakhir' }, { status: 400 });
            }

            const { error } = await client
                .from('admin_users')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } else {
            const users = readLocalAdmins();

            if (users.length <= 1) {
                return NextResponse.json({ error: 'Tidak bisa menghapus admin terakhir' }, { status: 400 });
            }

            const filteredUsers = users.filter(u => u.id !== id);
            if (filteredUsers.length === users.length) {
                return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
            }

            writeLocalAdmins(filteredUsers);
        }

        return NextResponse.json({ message: 'User berhasil dihapus' });
    } catch (error) {
        console.error('DELETE admin user error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
