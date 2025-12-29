import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'tutorials.json');

function readTutorials() {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
}

function writeTutorials(tutorials) {
    fs.writeFileSync(dataFilePath, JSON.stringify(tutorials, null, 2));
}

// GET single tutorial by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const tutorials = readTutorials();
        const tutorial = tutorials.find(t => t.id === id || t.slug === id);

        if (!tutorial) {
            return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
        }

        return NextResponse.json(tutorial);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read tutorial' }, { status: 500 });
    }
}

// PUT update tutorial
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const tutorials = readTutorials();
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

        writeTutorials(tutorials);
        return NextResponse.json(tutorials[index]);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update tutorial' }, { status: 500 });
    }
}

// DELETE tutorial
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const tutorials = readTutorials();
        const filteredTutorials = tutorials.filter(t => t.id !== id);

        if (filteredTutorials.length === tutorials.length) {
            return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
        }

        writeTutorials(filteredTutorials);
        return NextResponse.json({ message: 'Tutorial deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete tutorial' }, { status: 500 });
    }
}
