import { NextResponse } from 'next/server';
import { readCategories, writeCategories } from '@/lib/categories';

// GET single category
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const categories = await readCategories();
        const category = categories.find(c => c.id === id || c.slug === id);

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error('GET category error:', error);
        return NextResponse.json({ error: 'Failed to read category' }, { status: 500 });
    }
}

// PUT update category
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const categories = await readCategories();

        const index = categories.findIndex(c => c.id === id);
        if (index === -1) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        categories[index] = {
            ...categories[index],
            name: body.name ?? categories[index].name,
            slug: body.slug ?? categories[index].slug,
            icon: body.icon ?? categories[index].icon,
            order: body.order ?? categories[index].order,
            updatedAt: new Date().toISOString()
        };

        await writeCategories(categories);

        return NextResponse.json(categories[index]);
    } catch (error) {
        console.error('PUT category error:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

// DELETE category
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const categories = await readCategories();

        const index = categories.findIndex(c => c.id === id);
        if (index === -1) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        categories.splice(index, 1);
        await writeCategories(categories);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE category error:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
