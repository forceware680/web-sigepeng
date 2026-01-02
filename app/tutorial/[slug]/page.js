import { notFound } from 'next/navigation';
import Link from 'next/link';
import MediaGallery from '@/components/MediaGallery';
import MarkdownContent from '@/components/MarkdownContent';
import LatestPosts from '@/components/LatestPosts';
import PopularPosts from '@/components/PopularPosts';
import PostActions from '@/components/PostActions';
import ViewCounter from '@/components/ViewCounter';
import { getTutorialBySlug, getRelatedTutorials } from '@/lib/tutorials';
import { readCategories } from '@/lib/categories';

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

    return (
        <div className="tutorial-layout">
            {/* Main Article */}
            <article className="tutorial-main">
                <h1 className="shiny-title">{tutorial.title}</h1>

                {/* Author, Date, and Actions */}
                <div className="tutorial-header-row">
                    <div className="tutorial-meta">
                        <span className="tutorial-author">
                            👤 Ditulis oleh <strong>{tutorial.author || 'Admin'}</strong>
                        </span>
                        {createdDate && (
                            <span className="tutorial-date">
                                📅 {createdDate}
                            </span>
                        )}
                        {updatedDate && updatedDate !== createdDate && (
                            <span className="tutorial-updated">
                                ✏️ Diperbarui: {updatedDate}
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
                        <h2>📚 Tutorial Lainnya</h2>
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
                                        <span className="related-arrow">→</span>
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
