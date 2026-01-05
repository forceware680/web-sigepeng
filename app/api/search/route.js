import { NextResponse } from 'next/server';
import { readTutorials } from '@/lib/tutorials';
import { readCategories, getCategoryPath } from '@/lib/categories';

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
        for (const category of categories) {
            if (category.name.toLowerCase().includes(query) ||
                category.slug.toLowerCase().includes(query)) {

                // Get full path for this category
                const path = await getCategoryPath(category.id);
                const pathString = path.map(p => p.name).join(' > ');

                results.push({
                    type: 'category',
                    id: category.id,
                    title: category.name,
                    slug: category.slug,
                    icon: category.icon,
                    url: null,
                    categoryPath: pathString,
                    matchedIn: 'nama kategori'
                });
            }
        }

        // Search in tutorials
        for (const tutorial of tutorials) {
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
                // Get full category path
                let categoryPath = 'Uncategorized';
                if (tutorial.categoryId) {
                    const path = await getCategoryPath(tutorial.categoryId);
                    if (path.length > 0) {
                        categoryPath = path.map(p => p.name).join(' > ');
                    }
                }

                results.push({
                    type: 'tutorial',
                    id: tutorial.id,
                    title: tutorial.title,
                    slug: tutorial.slug,
                    categoryPath: categoryPath,
                    url: `/tutorial/${tutorial.slug}`,
                    matchedIn: matches.join(', '),
                    excerpt: getExcerpt(tutorial.content, query)
                });
            }
        }

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

// Helper to strip HTML tags and markdown codes
function stripMarkdownAndHtml(text) {
    if (!text) return '';

    return text
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove [VIDEO:...] embeds
        .replace(/\[VIDEO:[^\]]*\]/g, '')
        // Remove [IMAGE:...] embeds
        .replace(/\[IMAGE:[^\]]*\]/g, '')
        // Remove markdown links [text](url)
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        // Remove markdown images ![alt](url)
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        // Remove markdown bold/italic **text** or *text*
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
        // Remove markdown headers #
        .replace(/^#{1,6}\s+/gm, '')
        // Remove blockquote >
        .replace(/^>\s*/gm, '')
        // Remove code blocks ```
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code `code`
        .replace(/`([^`]+)`/g, '$1')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

// Helper to get excerpt around the matched query
function getExcerpt(content, query) {
    if (!content) return '';

    // Clean the content first
    const cleanContent = stripMarkdownAndHtml(content);
    const lowerContent = cleanContent.toLowerCase();
    const index = lowerContent.indexOf(query);

    if (index === -1) return cleanContent.substring(0, 100) + '...';

    const start = Math.max(0, index - 40);
    const end = Math.min(cleanContent.length, index + query.length + 60);

    let excerpt = cleanContent.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < cleanContent.length) excerpt = excerpt + '...';

    return excerpt;
}
