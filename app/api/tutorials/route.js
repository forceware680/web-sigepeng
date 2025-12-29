import { NextResponse } from 'next/server';
import { readTutorials, writeTutorials } from '@/lib/tutorials';

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
