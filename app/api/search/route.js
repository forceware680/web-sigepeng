import { NextResponse } from 'next/server';
import { readTutorials } from '@/lib/tutorials';
import { readCategories } from '@/lib/categories';

// GET search results
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.toLowerCase() || '';

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [], message: 'Query too short' });
        }

        const [tutorials, categories] = await Promise.all([
            readTutorials(),
            readCategories()
        ]);

        const results = [];

        // Search in categories
        categories.forEach(category => {
            if (category.name.toLowerCase().includes(query) ||
                category.slug.toLowerCase().includes(query)) {
                results.push({
                    type: 'category',
                    id: category.id,
                    title: category.name,
                    slug: category.slug,
                    icon: category.icon,
                    url: null, // Categories don't have direct URL
                    matchedIn: 'nama kategori'
                });
            }
        });

        // Search in tutorials
        tutorials.forEach(tutorial => {
            const matches = [];

            // Search in title
            if (tutorial.title.toLowerCase().includes(query)) {
                matches.push('judul');
            }

            // Search in content
            if (tutorial.content && tutorial.content.toLowerCase().includes(query)) {
                matches.push('konten');
            }

            // Search in media titles/captions
            if (tutorial.media && tutorial.media.length > 0) {
                const mediaMatch = tutorial.media.some(m =>
                    (m.title && m.title.toLowerCase().includes(query)) ||
                    (m.caption && m.caption.toLowerCase().includes(query))
                );
                if (mediaMatch) {
                    matches.push('media');
                }
            }

            if (matches.length > 0) {
                // Get category name
                const category = categories.find(c => c.id === tutorial.categoryId);

                results.push({
                    type: 'tutorial',
                    id: tutorial.id,
                    title: tutorial.title,
                    slug: tutorial.slug,
                    categoryName: category?.name || 'Uncategorized',
                    url: `/tutorial/${tutorial.slug}`,
                    matchedIn: matches.join(', '),
                    excerpt: getExcerpt(tutorial.content, query)
                });
            }
        });

        return NextResponse.json({
            results,
            query,
            count: results.length
        });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}

// Helper to get excerpt around the matched query
function getExcerpt(content, query) {
    if (!content) return '';

    const lowerContent = content.toLowerCase();
    const index = lowerContent.indexOf(query);

    if (index === -1) return content.substring(0, 100) + '...';

    const start = Math.max(0, index - 40);
    const end = Math.min(content.length, index + query.length + 60);

    let excerpt = content.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
}
