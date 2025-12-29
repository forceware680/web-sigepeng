import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const BLOB_FILENAME = 'tutorials.json';

// Check if running on Vercel (production) or localhost
const isVercel = process.env.VERCEL === '1';
const dataFilePath = path.join(process.cwd(), 'data', 'tutorials.json');

// Default tutorials data (fallback when blob is empty)
const defaultTutorials = [
    {
        id: "tutorial-1",
        title: "Tutorial Pengeluaran Menggunakan Sigepeng",
        slug: "tutor-pengeluaran",
        content: "Tutorial Cara Mengeluarkan Barang Persediaan Menggunakan Metode [Sigepeng]",
        videoId: "6YaAVDhljL4",
        order: 1,
        createdAt: "2024-12-29T00:00:00.000Z"
    }
];

// Read tutorials from local file (for development)
export function readLocalTutorials() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return defaultTutorials;
    }
}

// Write tutorials to local file (for development)
export function writeLocalTutorials(tutorials) {
    fs.writeFileSync(dataFilePath, JSON.stringify(tutorials, null, 2));
}

// Read tutorials from Vercel Blob
export async function readBlobTutorials() {
    try {
        const { blobs } = await list();
        const tutorialBlob = blobs.find(b => b.pathname === BLOB_FILENAME);

        if (!tutorialBlob) {
            // Initialize blob with default data if it doesn't exist
            console.log('Blob not found, initializing with default data...');
            await writeBlobTutorials(defaultTutorials);
            return defaultTutorials;
        }

        const response = await fetch(tutorialBlob.url, { cache: 'no-store' });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error reading from blob:', error);
        // Return default data if blob fails
        return defaultTutorials;
    }
}

// Write tutorials to Vercel Blob
export async function writeBlobTutorials(tutorials) {
    try {
        // Delete old blob if exists
        const { blobs } = await list();
        const existingBlob = blobs.find(b => b.pathname === BLOB_FILENAME);
        if (existingBlob) {
            await del(existingBlob.url);
        }

        // Create new blob
        await put(BLOB_FILENAME, JSON.stringify(tutorials, null, 2), {
            access: 'public',
            contentType: 'application/json'
        });
    } catch (error) {
        console.error('Error writing to blob:', error);
        throw error;
    }
}

// Universal read function
export async function readTutorials() {
    if (isVercel) {
        return await readBlobTutorials();
    } else {
        return readLocalTutorials();
    }
}

// Universal write function
export async function writeTutorials(tutorials) {
    if (isVercel) {
        await writeBlobTutorials(tutorials);
    } else {
        writeLocalTutorials(tutorials);
    }
}

// Get single tutorial by slug or id
export async function getTutorialBySlug(slug) {
    const tutorials = await readTutorials();
    return tutorials.find(t => t.slug === slug || t.id === slug) || null;
}
