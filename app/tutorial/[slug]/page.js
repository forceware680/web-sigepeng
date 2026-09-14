import { notFound } from 'next/navigation';
import Link from 'next/link';
import MediaGallery from '@/components/MediaGallery';
import MarkdownContent from '@/components/MarkdownContent';
import LatestPosts from '@/components/LatestPosts';
import PopularPosts from '@/components/PopularPosts';
import PostActions from '@/components/PostActions';
import ViewCounter from '@/components/ViewCounter';
import { getTutorialBySlug, getRelatedTutorials, readTutorials } from '@/lib/tutorials';
import { readCategories } from '@/lib/categories';
import { User, Calendar, Pencil, BookOpen, ChevronRight } from 'lucide-react';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const tutorial = await getTutorialBySlug(slug);

    if (!tutorial) {
        return { title: 'Tutorial Not Found' };
    }

    return {
        title: tutorial.title,
        description: tutorial.content?.substring(0, 160) || '',
    };
}

// Format date to Indonesian locale
function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

export default async function TutorialPage({ params }) {
    const { slug } = await params;
    const tutorial = await getTutorialBySlug(slug);

    if (!tutorial) {
        notFound();
    }

    // Check if tutorial has media (new format) or videoId (old format for backward compatibility)
    const hasMedia = tutorial.media && tutorial.media.length > 0;
    const hasLegacyVideo = !hasMedia && tutorial.videoId;

    const createdDate = formatDate(tutorial.createdAt);
    const updatedDate = formatDate(tutorial.updatedAt);

    // Get related tutorials
    const relatedTutorials = await getRelatedTutorials(tutorial.id, tutorial.categoryId, 3);
    const categories = await readCategories();

    // Build category breadcrumb path (root -> ... -> current category)
    const categoryPath = [];
    if (tutorial.categoryId) {
        let current = categories.find(c => c.id === tutorial.categoryId);
        while (current) {
            categoryPath.unshift(current);
            current = current.parentId ? categories.find(c => c.id === current.parentId) : null;
        }
    }

    // Category pages only list posts assigned directly to them (not subcategories),
    // so only link to categories that actually have posts.
    const allTutorials = await readTutorials();
    const postCountByCategory = {};
    allTutorials.forEach(t => {
        const id = t.categoryId || 'uncategorized';
        postCountByCategory[id] = (postCountByCategory[id] || 0) + 1;
    });

    return (
        <div className="tutorial-layout">
            {/* Main Article */}
            <article className="tutorial-main">
                {/* Breadcrumb */}
                {categoryPath.length > 0 && (
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link href="/">Beranda</Link>
                        {categoryPath.map((cat, i) => {
                            const isLast = i === categoryPath.length - 1;
                            const hasPosts = (postCountByCategory[cat.id] || 0) > 0;
                            return (
                                <span key={cat.id} className="breadcrumb-item">
                                    <ChevronRight size={14} className="breadcrumb-sep" />
                                    {isLast || hasPosts ? (
                                        <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                                    ) : (
                                        <span className="breadcrumb-disabled">{cat.name}</span>
                                    )}
                                </span>
                            );
                        })}
                    </nav>
                )}

                <h1>{tutorial.title}</h1>

                {/* Author, Date, and Actions */}
                <div className="tutorial-header-row">
                    <div className="tutorial-meta">
                        <span className="tutorial-author">
                            <User size={14} /> Ditulis oleh <strong>{tutorial.author || 'Admin'}</strong>
                        </span>
                        {createdDate && (
                            <span className="tutorial-date">
                                <Calendar size={14} /> {createdDate}
                            </span>
                        )}
                        {updatedDate && updatedDate !== createdDate && (
                            <span className="tutorial-updated">
                                <Pencil size={14} /> Diperbarui: {updatedDate}
                            </span>
                        )}
                        <ViewCounter slug={slug} initialViews={tutorial.views || 0} />
                    </div>

                    {/* WhatsApp Share & Admin Edit Buttons */}
                    <PostActions
                        tutorialId={tutorial.id}
                        tutorialTitle={tutorial.title}
                        tutorialSlug={tutorial.slug}
                    />
                </div>

                {/* New format: multiple media items */}
                {hasMedia && (
                    <MediaGallery media={tutorial.media} tutorialTitle={tutorial.title} />
                )}

                {/* Legacy format: single video (backward compatibility) */}
                {hasLegacyVideo && (
                    <MediaGallery
                        media={[{
                            id: 'legacy-video',
                            type: 'video',
                            videoId: tutorial.videoId,
                            title: 'Video Tutorial'
                        }]}
                        tutorialTitle={tutorial.title}
                    />
                )}

                <MarkdownContent content={tutorial.content} />

                {/* Related Tutorials Section */}
                {relatedTutorials.length > 0 && (
                    <section className="related-tutorials">
                        <h2><BookOpen size={20} /> Tutorial Lainnya</h2>
                        <div className="related-grid">
                            {relatedTutorials.map(related => {
                                const category = categories.find(c => c.id === related.categoryId);
                                return (
                                    <Link
                                        key={related.id}
                                        href={`/tutorial/${related.slug}`}
                                        className="related-card"
                                    >
                                        <div className="related-card-content">
                                            <h3>{related.title}</h3>
                                            {category && (
                                                <span className="related-category">{category.name}</span>
                                            )}
                                            <p className="related-excerpt">
                                                {related.content
                                                    ?.replace(/\[(VIDEO|IMAGE):[^\]]+\]/g, '') // Remove custom embeds
                                                    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
                                                    .replace(/[#*`>\[\]]/g, '') // Remove remaining markdown chars
                                                    .substring(0, 100)
                                                    .trim()}...
                                            </p>
                                        </div>
                                        <ChevronRight className="related-arrow" size={24} />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </article>

            {/* Sidebar - Widgets */}
            <aside className="tutorial-sidebar">
                <LatestPosts currentSlug={slug} limit={5} />
                <PopularPosts limit={5} />
            </aside>
        </div>
    );
}
