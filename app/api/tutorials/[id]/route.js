import { put, list, del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BLOB_FILENAME = 'tutorials.json';

// Check if running on Vercel (production) or localhost
const isVercel = process.env.VERCEL === '1';
const dataFilePath = path.join(process.cwd(), 'data', 'tutorials.json');

// Read tutorials from local file (for development)
function readLocalTutorials() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Write tutorials to local file (for development)
function writeLocalTutorials(tutorials) {
    fs.writeFileSync(dataFilePath, JSON.stringify(tutorials, null, 2));
}

// Read tutorials from Vercel Blob
async function readBlobTutorials() {
    try {
        const { blobs } = await list();
        const tutorialBlob = blobs.find(b => b.pathname === BLOB_FILENAME);

        if (!tutorialBlob) {
            // Initialize with local data if blob doesn't exist
            const localData = readLocalTutorials();
            if (localData.length > 0) {
                await writeBlobTutorials(localData);
            }
            return localData;
        }

        const response = await fetch(tutorialBlob.url);
        return await response.json();
    } catch (error) {
        console.error('Error reading from blob:', error);
        return [];
    }
}

// Write tutorials to Vercel Blob
async function writeBlobTutorials(tutorials) {
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
async function readTutorials() {
    if (isVercel) {
        return await readBlobTutorials();
    } else {
        return readLocalTutorials();
    }
}

// Universal write function
async function writeTutorials(tutorials) {
    if (isVercel) {
        await writeBlobTutorials(tutorials);
    } else {
        writeLocalTutorials(tutorials);
    }
}

// GET single tutorial by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const tutorials = await readTutorials();
        const tutorial = tutorials.find(t => t.id === id || t.slug === id);

        if (!tutorial) {
            return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
        }

        return NextResponse.json(tutorial);
    } catch (error) {
        console.error('GET error:', error);
        return NextResponse.json({ error: 'Failed to read tutorial' }, { status: 500 });
    }
}

// PUT update tutorial
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const tutorials = await readTutorials();
        const index = tutorials.findIndex(t => t.id === id);

        if (index === -1) {
            return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
        }

        tutorials[index] = {
            ...tutorials[index],
            title: body.title || tutorials[index].title,
            slug: body.slug || tutorials[index].slug,
            content: body.content || tutorials[index].content,
            videoId: body.videoId !== undefined ? body.videoId : tutorials[index].videoId,
            order: body.order || tutorials[index].order,
        };

        await writeTutorials(tutorials);
        return NextResponse.json(tutorials[index]);
    } catch (error) {
        console.error('PUT error:', error);
        return NextResponse.json({ error: 'Failed to update tutorial' }, { status: 500 });
    }
}

// DELETE tutorial
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const tutorials = await readTutorials();
        const filteredTutorials = tutorials.filter(t => t.id !== id);

        if (filteredTutorials.length === tutorials.length) {
            return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
        }

        await writeTutorials(filteredTutorials);
        return NextResponse.json({ message: 'Tutorial deleted' });
    } catch (error) {
        console.error('DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete tutorial' }, { status: 500 });
    }
}
