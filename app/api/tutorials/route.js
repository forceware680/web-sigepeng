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
            await writeBlobTutorials(localData);
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

// GET all tutorials
export async function GET() {
    try {
        const tutorials = await readTutorials();
        const sortedTutorials = tutorials.sort((a, b) => a.order - b.order);
        return NextResponse.json(sortedTutorials);
    } catch (error) {
        console.error('GET error:', error);
        return NextResponse.json({ error: 'Failed to read tutorials' }, { status: 500 });
    }
}

// POST new tutorial
export async function POST(request) {
    try {
        const body = await request.json();
        const tutorials = await readTutorials();

        const newTutorial = {
            id: `tutorial-${Date.now()}`,
            title: body.title,
            slug: body.slug || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            content: body.content,
            videoId: body.videoId || '',
            order: body.order || tutorials.length + 1,
            createdAt: new Date().toISOString()
        };

        tutorials.push(newTutorial);
        await writeTutorials(tutorials);

        return NextResponse.json(newTutorial, { status: 201 });
    } catch (error) {
        console.error('POST error:', error);
        return NextResponse.json({ error: 'Failed to create tutorial' }, { status: 500 });
    }
}
