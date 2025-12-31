import { NextResponse } from 'next/server';
import { readCategories, writeCategories, getDescendantIds, deleteCategory } from '@/lib/categories';

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

        // Prevent circular reference
        if (body.parentId) {
            const descendantIds = await getDescendantIds(id);
            if (body.parentId === id || descendantIds.includes(body.parentId)) {
                return NextResponse.json({ error: 'Cannot set parent to self or descendant' }, { status: 400 });
            }
        }

        categories[index] = {
            ...categories[index],
            name: body.name ?? categories[index].name,
            slug: body.slug ?? categories[index].slug,
            icon: body.icon ?? categories[index].icon,
            order: body.order ?? categories[index].order,
            parentId: body.parentId !== undefined ? (body.parentId || null) : categories[index].parentId,
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

        // Check if category exists
        const category = categories.find(c => c.id === id);
        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Check if category has children
        const hasChildren = categories.some(c => c.parentId === id);
        if (hasChildren) {
            return NextResponse.json({
                error: 'Cannot delete category with subcategories. Delete children first.'
            }, { status: 400 });
        }

        await deleteCategory(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE category error:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
