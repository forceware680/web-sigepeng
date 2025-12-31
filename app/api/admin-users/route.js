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

// GET all admin users (without passwords)
export async function GET() {
    try {
        let users = [];

        if (isSupabaseConfigured()) {
            const client = supabase || getServiceSupabase();
            const { data, error } = await client
                .from('admin_users')
                .select('id, username, name');

            if (error) throw error;
            users = data || [];
        } else {
            users = readLocalAdmins().map(u => ({
                id: u.id,
                username: u.username,
                name: u.name
            }));
        }

        return NextResponse.json(users);
    } catch (error) {
        console.error('GET admin users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST create new admin user
export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password, name } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: `user-${Date.now()}`,
            username,
            password: hashedPassword,
            name: name || username
        };

        if (isSupabaseConfigured()) {
            const client = getServiceSupabase();
            if (!client) {
                return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
            }

            // Check if username exists
            const { data: existing } = await client
                .from('admin_users')
                .select('id')
                .eq('username', username)
                .single();

            if (existing) {
                return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
            }

            const { error } = await client
                .from('admin_users')
                .insert(newUser);

            if (error) throw error;
        } else {
            const users = readLocalAdmins();

            // Check if username exists
            if (users.some(u => u.username === username)) {
                return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
            }

            users.push(newUser);
            writeLocalAdmins(users);
        }

        return NextResponse.json({
            id: newUser.id,
            username: newUser.username,
            name: newUser.name
        }, { status: 201 });
    } catch (error) {
        console.error('POST admin user error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
