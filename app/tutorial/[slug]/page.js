import { notFound } from 'next/navigation';
import MediaGallery from '@/components/MediaGallery';
import MarkdownContent from '@/components/MarkdownContent';
import { getTutorialBySlug } from '@/lib/tutorials';

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
        title: `${tutorial.title} - Tutorial SIMASET`,
        description: tutorial.content?.substring(0, 160) || '',
    };
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

    return (
        <article>
            <h1>{tutorial.title}</h1>

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
        </article>
    );
}

