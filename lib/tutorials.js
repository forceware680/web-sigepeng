import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const BLOB_FILENAME = 'tutorials.json';

// Check if running on Vercel (production) or localhost
const isVercel = process.env.VERCEL === '1';
const dataFilePath = path.join(process.cwd(), 'data', 'tutorials.json');

// Default tutorials data (fallback when blob is empty) - NEW FORMAT
const defaultTutorials = [
    {
        id: "tutorial-1",
        title: "Tutorial Pengeluaran Menggunakan Sigepeng",
        slug: "tutor-pengeluaran",
        categoryId: "category-default",
        content: "Tutorial Cara Mengeluarkan Barang Persediaan Menggunakan Metode [Sigepeng]",
        media: [
            {
                id: "media-1",
                type: "video",
                videoId: "6YaAVDhljL4",
                title: "Video Tutorial",
                caption: ""
            }
        ],
        order: 1,
        createdAt: "2024-12-29T00:00:00.000Z"
    }
];

// Migrate old tutorial format to new format
function migrateTutorial(tutorial) {
    // If already has media array, return as-is
    if (tutorial.media && Array.isArray(tutorial.media)) {
        // Just ensure categoryId exists
        if (!tutorial.categoryId) {
            tutorial.categoryId = "category-default";
        }
        return tutorial;
    }

    // Migrate old format to new format
    const migrated = {
        ...tutorial,
        categoryId: tutorial.categoryId || "category-default",
        media: []
    };

    // Convert old videoId to media array
    if (tutorial.videoId) {
        migrated.media.push({
            id: `media-${Date.now()}`,
            type: "video",
            videoId: tutorial.videoId,
            title: "Video Tutorial",
            caption: ""
        });
    }

    // Remove old videoId field
    delete migrated.videoId;

    return migrated;
}

// Migrate all tutorials
function migrateTutorials(tutorials) {
    return tutorials.map(migrateTutorial);
}

// Read tutorials from local file (for development)
export function readLocalTutorials() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        const tutorials = JSON.parse(data);
        return migrateTutorials(tutorials);
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
            console.log('Blob not found, initializing with default data...');
            await writeBlobTutorials(defaultTutorials);
            return defaultTutorials;
        }

        const response = await fetch(tutorialBlob.url, { cache: 'no-store' });
        const data = await response.json();
        return migrateTutorials(data);
    } catch (error) {
        console.error('Error reading from blob:', error);
        return defaultTutorials;
    }
}

// Write tutorials to Vercel Blob
export async function writeBlobTutorials(tutorials) {
    try {
        const { blobs } = await list();
        const existingBlob = blobs.find(b => b.pathname === BLOB_FILENAME);
        if (existingBlob) {
            await del(existingBlob.url);
        }

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
    const tutorial = tutorials.find(t => t.slug === slug || t.id === slug);
    return tutorial ? migrateTutorial(tutorial) : null;
}

// Get tutorials by category
export async function getTutorialsByCategory(categoryId) {
    const tutorials = await readTutorials();
    return tutorials.filter(t => t.categoryId === categoryId).sort((a, b) => a.order - b.order);
}

// Get tutorials grouped by category
export async function getTutorialsGroupedByCategory() {
    const tutorials = await readTutorials();
    const grouped = {};

    tutorials.forEach(tutorial => {
        const catId = tutorial.categoryId || "category-default";
        if (!grouped[catId]) {
            grouped[catId] = [];
        }
        grouped[catId].push(tutorial);
    });

    // Sort tutorials within each category
    Object.keys(grouped).forEach(catId => {
        grouped[catId].sort((a, b) => a.order - b.order);
    });

    return grouped;
}

// Get related tutorials (same category first, then random)
export async function getRelatedTutorials(currentId, categoryId, limit = 3) {
    const tutorials = await readTutorials();

    // Exclude current tutorial
    const otherTutorials = tutorials.filter(t => t.id !== currentId);

    if (otherTutorials.length === 0) return [];

    // Get tutorials from same category first
    const sameCategoryTutorials = otherTutorials.filter(t => t.categoryId === categoryId);
    const otherCategoryTutorials = otherTutorials.filter(t => t.categoryId !== categoryId);

    // Combine with priority to same category
    const combined = [...sameCategoryTutorials, ...otherCategoryTutorials];

    // Shuffle the otherCategory part for variety
    const shuffledOthers = otherCategoryTutorials.sort(() => Math.random() - 0.5);
    const result = [...sameCategoryTutorials, ...shuffledOthers].slice(0, limit);

    return result;
}
