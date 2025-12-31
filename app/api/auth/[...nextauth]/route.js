import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { supabase, getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');

// Get admin users from local file (fallback)
function getLocalAdminUsers() {
    try {
        const data = fs.readFileSync(adminFilePath, 'utf8');
        return JSON.parse(data).users;
    } catch {
        return [];
    }
}

// Get admin users from Supabase
async function getSupabaseAdminUsers() {
    const client = supabase || getServiceSupabase();
    if (!client) return [];

    const { data, error } = await client
        .from('admin_users')
        .select('*');

    if (error) {
        console.error('Error fetching admin users:', error);
        return [];
    }

    return data || [];
}

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                let users = [];

                if (isSupabaseConfigured()) {
                    users = await getSupabaseAdminUsers();
                }

                // Fallback to local if Supabase fails or not configured
                if (users.length === 0) {
                    users = getLocalAdminUsers();
                }

                const user = users.find(u => u.username === credentials.username);

                if (user && bcrypt.compareSync(credentials.password, user.password)) {
                    return { id: user.id, name: user.name, username: user.username };
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: '/admin/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
});

export { handler as GET, handler as POST };
