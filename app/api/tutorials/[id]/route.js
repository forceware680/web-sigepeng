import { NextResponse } from 'next/server';
import { readTutorials, writeTutorials, getTutorialBySlug } from '@/lib/tutorials';

// GET single tutorial by ID or slug
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const tutorial = await getTutorialBySlug(id);

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
