import { NextResponse } from 'next/server';
import { readTutorials, writeTutorials, getTutorialBySlug, deleteTutorial } from '@/lib/tutorials';

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

        // Handle media update
        let media = tutorials[index].media || [];
        if (body.media !== undefined) {
            media = body.media;
        }

        tutorials[index] = {
            ...tutorials[index],
            title: body.title ?? tutorials[index].title,
            slug: body.slug ?? tutorials[index].slug,
            categoryId: body.categoryId ?? tutorials[index].categoryId ?? 'category-default',
            content: body.content ?? tutorials[index].content,
            media: media,
            order: body.order ?? tutorials[index].order,
            author: body.author ?? tutorials[index].author ?? 'Admin',
            updatedAt: new Date().toISOString()
        };

        // Remove old videoId if exists
        delete tutorials[index].videoId;

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
        await deleteTutorial(id);
        return NextResponse.json({ message: 'Tutorial deleted' });
    } catch (error) {
        console.error('DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete tutorial' }, { status: 500 });
    }
}
