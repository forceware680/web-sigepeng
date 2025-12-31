import { supabase, getServiceSupabase, isSupabaseConfigured } from './supabase';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'categories.json');

// Default categories data
const defaultCategories = [
    {
        id: "category-default",
        name: "Tutorial Umum",
        slug: "tutorial-umum",
        icon: "BookOpen",
        order: 1,
        createdAt: "2024-12-29T00:00:00.000Z"
    }
];

// Convert database row to app format
function dbToApp(row) {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        icon: row.icon || 'Folder',
        order: row.order || 1,
        parentId: row.parent_id || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

// Convert app format to database row
function appToDb(category) {
    return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon || 'Folder',
        order: category.order || 1,
        parent_id: category.parentId || null,
        created_at: category.createdAt,
        updated_at: category.updatedAt || new Date().toISOString()
    };
}

// Read categories from local file (for development)
export function readLocalCategories() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return defaultCategories;
    }
}

// Write categories to local file (for development)
export function writeLocalCategories(categories) {
    fs.writeFileSync(dataFilePath, JSON.stringify(categories, null, 2));
}

// Read categories from Supabase
export async function readSupabaseCategories() {
    const client = supabase || getServiceSupabase();
    if (!client) throw new Error('Supabase not configured');

    const { data, error } = await client
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

    if (error) throw error;
    return data.map(dbToApp);
}

// Write/update a single category to Supabase
export async function writeSupabaseCategory(category) {
    const client = getServiceSupabase();
    if (!client) throw new Error('Supabase service role not configured');

    const dbData = appToDb(category);

    const { error } = await client
        .from('categories')
        .upsert(dbData, { onConflict: 'id' });

    if (error) throw error;
}

// Delete category from Supabase
export async function deleteSupabaseCategory(id) {
    const client = getServiceSupabase();
    if (!client) throw new Error('Supabase service role not configured');

    const { error } = await client
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Universal delete function
export async function deleteCategory(id) {
    if (isSupabaseConfigured()) {
        await deleteSupabaseCategory(id);
    } else {
        const categories = readLocalCategories();
        const filtered = categories.filter(c => c.id !== id);
        writeLocalCategories(filtered);
    }
}

// Universal read function
export async function readCategories() {
    if (isSupabaseConfigured()) {
        try {
            return await readSupabaseCategories();
        } catch (error) {
            console.error('Error reading categories from Supabase:', error);
            // Fallback to local in development
            if (process.env.NODE_ENV === 'development') {
                return readLocalCategories();
            }
            throw error;
        }
    }
    return readLocalCategories();
}

// Universal write function (for bulk operations)
export async function writeCategories(categories) {
    if (isSupabaseConfigured()) {
        const client = getServiceSupabase();
        if (!client) throw new Error('Supabase service role not configured');

        for (const category of categories) {
            await writeSupabaseCategory(category);
        }
    } else {
        writeLocalCategories(categories);
    }
}

// Get single category by slug or id
export async function getCategoryBySlug(slug) {
    if (isSupabaseConfigured()) {
        const client = supabase || getServiceSupabase();
        if (!client) throw new Error('Supabase not configured');

        const { data, error } = await client
            .from('categories')
            .select('*')
            .or(`slug.eq.${slug},id.eq.${slug}`)
            .single();

        if (error || !data) return null;
        return dbToApp(data);
    }

    const categories = readLocalCategories();
    return categories.find(c => c.slug === slug || c.id === slug) || null;
}

// Get category by id
export async function getCategoryById(id) {
    if (isSupabaseConfigured()) {
        const client = supabase || getServiceSupabase();
        if (!client) throw new Error('Supabase not configured');

        const { data, error } = await client
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return dbToApp(data);
    }

    const categories = readLocalCategories();
    return categories.find(c => c.id === id) || null;
}

// Get root categories (no parent)
export async function getRootCategories() {
    const categories = await readCategories();
    return categories.filter(c => !c.parentId).sort((a, b) => a.order - b.order);
}

// Get children of a category
export async function getChildCategories(parentId) {
    const categories = await readCategories();
    return categories.filter(c => c.parentId === parentId).sort((a, b) => a.order - b.order);
}

// Build nested tree structure (unlimited depth)
export async function getCategoryTree() {
    const categories = await readCategories();

    const buildTree = (parentId = null) => {
        return categories
            .filter(c => (c.parentId || null) === parentId)
            .sort((a, b) => a.order - b.order)
            .map(c => ({
                ...c,
                children: buildTree(c.id)
            }));
    };

    return buildTree();
}

// Get full path/breadcrumb of a category
export async function getCategoryPath(categoryId) {
    const categories = await readCategories();
    const pathArr = [];

    let current = categories.find(c => c.id === categoryId);
    while (current) {
        pathArr.unshift(current);
        current = current.parentId ? categories.find(c => c.id === current.parentId) : null;
    }

    return pathArr;
}

// Get all descendant IDs of a category (for deletion check)
export async function getDescendantIds(categoryId) {
    const categories = await readCategories();
    const descendants = [];

    const collectDescendants = (parentId) => {
        categories
            .filter(c => c.parentId === parentId)
            .forEach(c => {
                descendants.push(c.id);
                collectDescendants(c.id);
            });
    };

    collectDescendants(categoryId);
    return descendants;
}
