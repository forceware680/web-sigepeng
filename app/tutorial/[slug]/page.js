import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import MarkdownContent from '@/components/MarkdownContent';

const dataFilePath = path.join(process.cwd(), 'data', 'tutorials.json');

function getTutorials() {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
}

export async function generateStaticParams() {
    const tutorials = getTutorials();
    return tutorials.map((tutorial) => ({
        slug: tutorial.slug,
    }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const tutorials = getTutorials();
    const tutorial = tutorials.find(t => t.slug === slug);

    if (!tutorial) {
        return { title: 'Tutorial Not Found' };
    }

    return {
        title: `${tutorial.title} - Tutorial Website`,
        description: tutorial.content?.substring(0, 160) || '',
    };
}

export default async function TutorialPage({ params }) {
    const { slug } = await params;
    const tutorials = getTutorials();
    const tutorial = tutorials.find(t => t.slug === slug);

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
