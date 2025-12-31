import { supabase, getServiceSupabase, isSupabaseConfigured } from './supabase';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'tutorials.json');

// Default tutorials data (fallback when database is empty)
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

// Convert database row to app format
function dbToApp(row) {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        categoryId: row.category_id,
        content: row.content || '',
        order: row.order || 1,
        author: row.author,
        views: row.views || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        media: row.media || []
    };
}

// Convert app format to database row
function appToDb(tutorial) {
    return {
        id: tutorial.id,
        title: tutorial.title,
        slug: tutorial.slug,
        category_id: tutorial.categoryId,
        content: tutorial.content,
        order: tutorial.order || 1,
        author: tutorial.author,
        views: tutorial.views || 0,
        created_at: tutorial.createdAt,
        updated_at: tutorial.updatedAt || new Date().toISOString()
    };
}

// Read tutorials from local file (for development without Supabase)
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

// Read tutorials from Supabase
export async function readSupabaseTutorials() {
    const client = supabase || getServiceSupabase();
    if (!client) throw new Error('Supabase not configured');

    // Get tutorials
    const { data: tutorials, error: tutorialsError } = await client
        .from('tutorials')
        .select('*')
        .order('order', { ascending: true });

    if (tutorialsError) throw tutorialsError;

    // Get all media
    const { data: allMedia, error: mediaError } = await client
        .from('tutorial_media')
        .select('*')
        .order('order', { ascending: true });

    if (mediaError) throw mediaError;

    // Combine tutorials with their media
    return tutorials.map(tutorial => {
        const media = allMedia
            .filter(m => m.tutorial_id === tutorial.id)
            .map(m => ({
                id: m.id,
                type: m.type,
                videoId: m.video_id,
                url: m.url,
                title: m.title,
                caption: m.caption
            }));

        return dbToApp({ ...tutorial, media });
    });
}

// Write/update a single tutorial to Supabase
export async function writeSupabaseTutorial(tutorial) {
    const client = getServiceSupabase();
    if (!client) throw new Error('Supabase service role not configured');

    const dbData = appToDb(tutorial);

    // Upsert tutorial
    const { error: tutorialError } = await client
        .from('tutorials')
        .upsert(dbData, { onConflict: 'id' });

    if (tutorialError) throw tutorialError;

    // Handle media: delete existing and insert new
    if (tutorial.media && tutorial.media.length > 0) {
        // Delete existing media
        await client
            .from('tutorial_media')
            .delete()
            .eq('tutorial_id', tutorial.id);

        // Insert new media
        const mediaData = tutorial.media.map((m, index) => ({
            id: m.id || `media-${Date.now()}-${index}`,
            tutorial_id: tutorial.id,
            type: m.type,
            video_id: m.videoId || null,
            url: m.url || null,
            title: m.title || '',
            caption: m.caption || '',
            order: index + 1
        }));

        const { error: mediaError } = await client
            .from('tutorial_media')
            .insert(mediaData);

        if (mediaError) throw mediaError;
    }
}

// Delete tutorial from Supabase
export async function deleteSupabaseTutorial(id) {
    const client = getServiceSupabase();
    if (!client) throw new Error('Supabase service role not configured');

    // Media will be deleted automatically due to CASCADE
    const { error } = await client
        .from('tutorials')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Increment views in Supabase
export async function incrementViews(id) {
    const client = getServiceSupabase() || supabase;
    if (!client) return;

    const { error } = await client.rpc('increment_views', { tutorial_id: id });

    // If RPC doesn't exist, do it manually
    if (error) {
        const { data } = await client
            .from('tutorials')
            .select('views')
            .eq('id', id)
            .single();

        if (data) {
            await client
                .from('tutorials')
                .update({ views: (data.views || 0) + 1 })
                .eq('id', id);
        }
    }
}

// Universal read function
export async function readTutorials() {
    if (isSupabaseConfigured()) {
        try {
            return await readSupabaseTutorials();
        } catch (error) {
            console.error('Error reading from Supabase:', error);
            // Fallback to local in development
            if (process.env.NODE_ENV === 'development') {
                return readLocalTutorials();
            }
            throw error;
        }
    }
    return readLocalTutorials();
}

// Universal write function (for bulk operations - mainly used for compatibility)
export async function writeTutorials(tutorials) {
    if (isSupabaseConfigured()) {
        const client = getServiceSupabase();
        if (!client) throw new Error('Supabase service role not configured');

        // For bulk write, we update each tutorial
        for (const tutorial of tutorials) {
            await writeSupabaseTutorial(tutorial);
        }
    } else {
        writeLocalTutorials(tutorials);
    }
}

// Get single tutorial by slug or id
export async function getTutorialBySlug(slug) {
    if (isSupabaseConfigured()) {
        const client = supabase || getServiceSupabase();
        if (!client) throw new Error('Supabase not configured');

        // Try to find by slug first, then by id
        let { data: tutorial, error } = await client
            .from('tutorials')
            .select('*')
            .or(`slug.eq.${slug},id.eq.${slug}`)
            .single();

        if (error || !tutorial) return null;

        // Get media for this tutorial
        const { data: media } = await client
            .from('tutorial_media')
            .select('*')
            .eq('tutorial_id', tutorial.id)
            .order('order', { ascending: true });

        const formattedMedia = (media || []).map(m => ({
            id: m.id,
            type: m.type,
            videoId: m.video_id,
            url: m.url,
            title: m.title,
            caption: m.caption
        }));

        return dbToApp({ ...tutorial, media: formattedMedia });
    }

    const tutorials = readLocalTutorials();
    return tutorials.find(t => t.slug === slug || t.id === slug) || null;
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

    // Shuffle the otherCategory part for variety
    const shuffledOthers = otherCategoryTutorials.sort(() => Math.random() - 0.5);
    const result = [...sameCategoryTutorials, ...shuffledOthers].slice(0, limit);

    return result;
}
