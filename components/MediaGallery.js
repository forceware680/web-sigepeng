'use client';

import YouTubeEmbed from './YouTubeEmbed';
import ImageEmbed from './ImageEmbed';

export default function MediaGallery({ media = [], tutorialTitle = "" }) {
    if (!media || media.length === 0) return null;

    return (
        <div className="media-gallery">
            {media.map((item, index) => (
                <div key={item.id || index} className="media-item">
                    {item.title && (
                        <h3 className="media-title">{item.title}</h3>
                    )}

                    {item.type === 'video' && item.videoId && (
                        <YouTubeEmbed
                            videoId={item.videoId}
                            title={item.title || `${tutorialTitle} - Video ${index + 1}`}
                        />
                    )}

                    {item.type === 'image' && item.url && (
                        <ImageEmbed
                            url={item.url}
                            title={item.title}
                            caption={item.caption}
                            alt={item.title || `${tutorialTitle} - Image ${index + 1}`}
                        />
                    )}

                    {item.caption && (
                        <p className="media-caption">{item.caption}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
