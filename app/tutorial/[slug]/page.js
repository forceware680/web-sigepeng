import { notFound } from 'next/navigation';
import YouTubeEmbed from '@/components/YouTubeEmbed';
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

    return (
        <article>
            <h1>{tutorial.title}</h1>

            {tutorial.videoId && (
                <>
                    <h2>Video Tutorial</h2>
                    <YouTubeEmbed videoId={tutorial.videoId} title={tutorial.title} />
                </>
            )}

            <MarkdownContent content={tutorial.content} />
        </article>
    );
}
