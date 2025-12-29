import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const BLOB_FILENAME = 'categories.json';

// Check if running on Vercel (production) or localhost
const isVercel = process.env.VERCEL === '1';
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

// Read categories from Vercel Blob
export async function readBlobCategories() {
    try {
        const { blobs } = await list();
        const categoryBlob = blobs.find(b => b.pathname === BLOB_FILENAME);

        if (!categoryBlob) {
            console.log('Categories blob not found, initializing with default data...');
            await writeBlobCategories(defaultCategories);
            return defaultCategories;
        }

        const response = await fetch(categoryBlob.url, { cache: 'no-store' });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error reading categories from blob:', error);
        return defaultCategories;
    }
}

// Write categories to Vercel Blob
export async function writeBlobCategories(categories) {
    try {
        const { blobs } = await list();
        const existingBlob = blobs.find(b => b.pathname === BLOB_FILENAME);
        if (existingBlob) {
            await del(existingBlob.url);
        }

        await put(BLOB_FILENAME, JSON.stringify(categories, null, 2), {
            access: 'public',
            contentType: 'application/json'
        });
    } catch (error) {
        console.error('Error writing categories to blob:', error);
        throw error;
    }
}

// Universal read function
export async function readCategories() {
    if (isVercel) {
        return await readBlobCategories();
    } else {
        return readLocalCategories();
    }
}

// Universal write function
export async function writeCategories(categories) {
    if (isVercel) {
        await writeBlobCategories(categories);
    } else {
        writeLocalCategories(categories);
    }
}

// Get single category by slug or id
export async function getCategoryBySlug(slug) {
    const categories = await readCategories();
    return categories.find(c => c.slug === slug || c.id === slug) || null;
}

// Get category by id
export async function getCategoryById(id) {
    const categories = await readCategories();
    return categories.find(c => c.id === id) || null;
}
