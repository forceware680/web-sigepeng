import { NextResponse } from 'next/server';
import { readTutorials, writeTutorials } from '@/lib/tutorials';

// POST - Increment view count for a tutorial
export async function POST(request, { params }) {
    try {
        const { id } = await params;

        // Read current data
        let tutorials;
        try {
            tutorials = await readTutorials();
        } catch (readError) {
            console.error('Failed to read tutorials for view increment:', readError);
            // Return error but don't corrupt data
            return NextResponse.json({ error: 'Read failed', views: 0 }, { status: 500 });
        }

        const index = tutorials.findIndex(t => t.id === id || t.slug === id);

        if (index === -1) {
            return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
        }

        // Increment view count
        tutorials[index].views = (tutorials[index].views || 0) + 1;

        try {
            await writeTutorials(tutorials);
        } catch (writeError) {
            console.error('Failed to write tutorials after view increment:', writeError);
            // Return the incremented count but note the write failed
            return NextResponse.json({
                views: tutorials[index].views,
                warning: 'View counted but save may have failed'
            });
        }

        return NextResponse.json({
            views: tutorials[index].views
        });
    } catch (error) {
        console.error('View increment error:', error);
        return NextResponse.json({ error: 'Failed to increment view' }, { status: 500 });
    }
}

// GET - Get view count for a tutorial
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const tutorials = await readTutorials();
        const tutorial = tutorials.find(t => t.id === id || t.slug === id);

        if (!tutorial) {
            return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
        }

        return NextResponse.json({
            views: tutorial.views || 0
        });
    } catch (error) {
        console.error('View fetch error:', error);
        return NextResponse.json({ error: 'Failed to get views' }, { status: 500 });
    }
}
