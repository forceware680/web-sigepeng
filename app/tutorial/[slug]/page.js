import { notFound } from 'next/navigation';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import MarkdownContent from '@/components/MarkdownContent';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Function to get tutorials from API
async function getTutorial(slug) {
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXTAUTH_URL || 'http://localhost:3000';

    try {
        const res = await fetch(`${baseUrl}/api/tutorials/${slug}`, {
            cache: 'no-store',
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            return null;
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching tutorial:', error);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const tutorial = await getTutorial(slug);

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
    const tutorial = await getTutorial(slug);

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
