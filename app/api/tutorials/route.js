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

        // Process media - support both old videoId format and new media array
        let media = [];
        if (body.media && Array.isArray(body.media)) {
            media = body.media;
        } else if (body.videoId) {
            // Backward compatibility: convert single videoId to media array
            media.push({
                id: `media-${Date.now()}`,
                type: 'video',
                videoId: body.videoId,
                title: 'Video Tutorial',
                caption: ''
            });
        }

        const newTutorial = {
            id: `tutorial-${Date.now()}`,
            title: body.title,
            slug: body.slug || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            categoryId: body.categoryId || 'category-default',
            content: body.content || '',
            media: media,
            order: body.order || tutorials.length + 1,
            author: body.author || 'Admin',
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

