import { NextResponse } from 'next/server';
import { readCategories, writeCategories, getCategoryTree } from '@/lib/categories';

// GET all categories
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const tree = searchParams.get('tree') === 'true';

        if (tree) {
            const categoryTree = await getCategoryTree();
            return NextResponse.json(categoryTree);
        }

        const categories = await readCategories();
        const sortedCategories = categories.sort((a, b) => a.order - b.order);
        return NextResponse.json(sortedCategories);
    } catch (error) {
        console.error('GET categories error:', error);
        return NextResponse.json({ error: 'Failed to read categories' }, { status: 500 });
    }
}

// POST new category
export async function POST(request) {
    try {
        const body = await request.json();
        const categories = await readCategories();

        const newCategory = {
            id: `category-${Date.now()}`,
            name: body.name,
            slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            icon: body.icon || 'Folder',
            order: body.order || categories.length + 1,
            parentId: body.parentId || null,
            createdAt: new Date().toISOString()
        };

        categories.push(newCategory);
        await writeCategories(categories);

        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        console.error('POST category error:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
