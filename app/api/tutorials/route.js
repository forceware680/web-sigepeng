import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataFilePath = path.join(process.cwd(), 'data', 'tutorials.json');

function readTutorials() {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
}

function writeTutorials(tutorials) {
    fs.writeFileSync(dataFilePath, JSON.stringify(tutorials, null, 2));
}

// GET all tutorials
export async function GET() {
    try {
        const tutorials = readTutorials();
        const sortedTutorials = tutorials.sort((a, b) => a.order - b.order);
        return NextResponse.json(sortedTutorials);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read tutorials' }, { status: 500 });
    }
}

// POST new tutorial
export async function POST(request) {
    try {
        const body = await request.json();
        const tutorials = readTutorials();

        const newTutorial = {
            id: uuidv4(),
            title: body.title,
            slug: body.slug || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            content: body.content,
            videoId: body.videoId || '',
            order: body.order || tutorials.length + 1,
            createdAt: new Date().toISOString()
        };

        tutorials.push(newTutorial);
        writeTutorials(tutorials);

        return NextResponse.json(newTutorial, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create tutorial' }, { status: 500 });
    }
}
