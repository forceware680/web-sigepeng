'use client';

import Link from 'next/link';
import { Clock, Eye } from 'lucide-react';

export default function PostCard({ tutorial, category }) {
    // Generate thumbnail
    const getThumbnail = () => {
        // Debug: Log media data
        console.log('Tutorial:', tutorial.title);
        console.log('Media:', tutorial.media);
        console.log('Content:', tutorial.content?.substring(0, 200));

        // Priority 1: Custom thumbnail
        if (tutorial.thumbnail) {
            console.log('Using custom thumbnail:', tutorial.thumbnail);
            return tutorial.thumbnail;
        }

        // Priority 2: First image from media array (Cloudinary)
        if (tutorial.media && Array.isArray(tutorial.media) && tutorial.media.length > 0) {
            const image = tutorial.media.find(m => m.type === 'image' && m.url);
            if (image?.url) {
                console.log('Using image from media array:', image.url);
                return image.url;
            }
        }

        // Priority 3: Extract image from content (format: [IMAGE:url] or <img src="url">)
        if (tutorial.content) {
            // Try [IMAGE:url] format
            const imageMatch = tutorial.content.match(/\[IMAGE:([^\]]+)\]/);
            if (imageMatch && imageMatch[1]) {
                const imageUrl = imageMatch[1].split('|')[0].trim();
                console.log('Using image from content [IMAGE:]:', imageUrl);
                return imageUrl;
            }

            // Try <img src="url"> format
            const imgTagMatch = tutorial.content.match(/<img[^>]+src="([^"]+)"/);
            if (imgTagMatch && imgTagMatch[1]) {
                console.log('Using image from content <img>:', imgTagMatch[1]);
                return imgTagMatch[1];
            }
        }

        // Priority 4: First video thumbnail from YouTube
        if (tutorial.media && Array.isArray(tutorial.media) && tutorial.media.length > 0) {
            const video = tutorial.media.find(m => m.type === 'video' && m.videoId);
            if (video?.videoId) {
                const ytThumb = `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
                console.log('Using YouTube thumbnail:', ytThumb);
                return ytThumb;
            }
        }

        // Priority 5: Extract YouTube video from content
        if (tutorial.content) {
            const videoMatch = tutorial.content.match(/\[VIDEO:([^\]]+)\]/);
            if (videoMatch && videoMatch[1]) {
                const videoId = videoMatch[1].trim();
                const ytThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                console.log('Using YouTube from content:', ytThumb);
                return ytThumb;
            }
        }

        // Priority 6: Default placeholder
        console.log('Using placeholder');
        return '/placeholder-tutorial.jpg';
    };

    // Generate excerpt from content
    const generateExcerpt = (content, maxLength = 120) => {
        if (!content) return 'Klik untuk membaca selengkapnya...';

        // Remove media embeds first (IMAGE, VIDEO tags)
        let cleanContent = content
            .replace(/\[IMAGE:[^\]]+\]/g, '') // Remove [IMAGE:url]
            .replace(/\[VIDEO:[^\]]+\]/g, '') // Remove [VIDEO:id]
            .replace(/<img[^>]*>/g, '')       // Remove <img> tags
            .replace(/<iframe[^>]*>.*?<\/iframe>/g, ''); // Remove iframes

        // Remove ALL markdown syntax
        const plainText = cleanContent
            // Remove headers (# ## ###)
            .replace(/^#{1,6}\s+/gm, '')
            // Remove bold/italic (**text** or *text* or __text__ or _text_)
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            .replace(/(\*|_)(.*?)\1/g, '$2')
            // Remove strikethrough (~~text~~)
            .replace(/~~(.*?)~~/g, '$1')
            // Remove code blocks (```code```)
            .replace(/```[\s\S]*?```/g, '')
            // Remove inline code (`code`)
            .replace(/`([^`]+)`/g, '$1')
            // Remove links [text](url)
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            // Remove images ![alt](url)
            .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
            // Remove blockquotes (> text)
            .replace(/^>\s+/gm, '')
            // Remove horizontal rules (---, ***, ___)
            .replace(/^[-*_]{3,}\s*$/gm, '')
            // Remove list markers (-, *, +, 1.)
            .replace(/^[\s]*[-*+]\s+/gm, '')
            .replace(/^[\s]*\d+\.\s+/gm, '')
            // Remove remaining special characters
            .replace(/[#*`~_\[\]]/g, '')
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Clean up whitespace
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!plainText) return 'Klik untuk membaca selengkapnya...';
        if (plainText.length <= maxLength) return plainText;

        return plainText.substring(0, maxLength).trim() + '...';
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Link href={`/tutorial/${tutorial.slug}`} className="post-card">
            <div className="post-card-thumbnail">
                <img
                    src={getThumbnail()}
                    alt={tutorial.title}
                    onError={(e) => {
                        e.target.src = '/placeholder-tutorial.jpg';
                    }}
                />
                {category && (
                    <div className="post-card-category">
                        {category.icon && <span>{category.icon}</span>}
                        <span>{category.name}</span>
                    </div>
                )}
            </div>
            <div className="post-card-content">
                <h3 className="post-card-title">{tutorial.title}</h3>
                <p className="post-card-excerpt">
                    {generateExcerpt(tutorial.content)}
                </p>
                <div className="post-card-meta">
                    {tutorial.createdAt && (
                        <span className="meta-item">
                            <Clock size={14} />
                            {formatDate(tutorial.createdAt)}
                        </span>
                    )}
                    {tutorial.views > 0 && (
                        <span className="meta-item">
                            <Eye size={14} />
                            {tutorial.views} views
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
