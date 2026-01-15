'use client';

import YouTubeEmbed from './YouTubeEmbed';
import ImageEmbed from './ImageEmbed';

export default function MarkdownContent({ content }) {
    if (!content) return null;

    // Check if content is HTML (starts with < or contains HTML tags)
    const isHtml = content.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(content);

    // If content is HTML, handle it specially to preserve structure
    if (isHtml) {
        return renderHtmlContent(content);
    }

    // Parse content and extract embeds
    const parseContent = (text) => {
        const parts = [];
        let key = 0;

        // Split by embed patterns: [VIDEO:...], [IMAGE:...], or <img ...>
        const embedPattern = /\[(VIDEO|IMAGE):([^\]]+)\]|<img\s+[^>]*>/g;
        let lastIndex = 0;
        let match;

        while ((match = embedPattern.exec(text)) !== null) {
            // Add text before this match
            if (match.index > lastIndex) {
                const textBefore = text.substring(lastIndex, match.index);
                if (textBefore.trim()) {
                    parts.push({
                        type: 'text',
                        content: textBefore,
                        key: key++
                    });
                }
            }

            const matchStr = match[0];

            // Handle [VIDEO:...]
            if (match[1] === 'VIDEO') {
                parts.push({
                    type: 'video',
                    videoId: match[2].trim(),
                    key: key++
                });
            }
            // Handle [IMAGE:...]
            else if (match[1] === 'IMAGE') {
                const [url, caption] = match[2].split('|').map(s => s.trim());
                parts.push({
                    type: 'image',
                    url: url,
                    caption: caption || '',
                    key: key++
                });
            }
            // Handle <img ...>
            else if (matchStr.startsWith('<img')) {
                // Extract src
                const srcMatch = matchStr.match(/src="([^"]+)"/);
                const url = srcMatch ? srcMatch[1] : '';

                // Extract alt/title for caption
                const altMatch = matchStr.match(/alt="([^"]+)"/);
                const titleMatch = matchStr.match(/title="([^"]+)"/);
                const caption = (altMatch ? altMatch[1] : '') || (titleMatch ? titleMatch[1] : '');

                if (url) {
                    parts.push({
                        type: 'image',
                        url: url,
                        caption: caption,
                        key: key++
                    });
                }
            }

            lastIndex = match.index + matchStr.length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            const remaining = text.substring(lastIndex);
            if (remaining.trim()) {
                parts.push({
                    type: 'text',
                    content: remaining,
                    key: key++
                });
            }
        }

        return parts;
    };

    // Simple markdown to HTML converter
    const parseMarkdown = (text) => {
        let result = text
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            // Blockquote - must come before list items
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

        // Process ordered lists - group consecutive numbered items
        result = result.replace(/^(\d+\. .+(?:\n\d+\. .+)*)/gm, (match) => {
            const items = match.split('\n').map(line => {
                const text = line.replace(/^\d+\. /, '').trim();
                return `<li>${text}</li>`;
            }).join('');
            return `<ol>${items}</ol>`;
        });

        // Process unordered lists - group consecutive bullet items
        result = result.replace(/^(- .+(?:\n- .+)*)/gm, (match) => {
            const items = match.split('\n').map(line => {
                const text = line.replace(/^- /, '').trim();
                return `<li>${text}</li>`;
            }).join('');
            return `<ul>${items}</ul>`;
        });

        // Line breaks
        result = result
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br />');

        return result;
    };

    const parts = parseContent(content);

    // If no embeds found, just render as markdown
    if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
        const html = `<p>${parseMarkdown(content)}</p>`;
        return (
            <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }

    // Render parts with embeds
    return (
        <div className="markdown-content">
            {parts.map((part) => {
                if (part.type === 'video') {
                    return (
                        <div key={part.key} className="content-embed">
                            <YouTubeEmbed videoId={part.videoId} title="Embedded Video" />
                        </div>
                    );
                }

                if (part.type === 'image') {
                    return (
                        <div key={part.key} className="content-embed">
                            <ImageEmbed
                                url={part.url}
                                caption={part.caption}
                                alt={part.caption || "Tutorial image"}
                            />
                        </div>
                    );
                }

                // Text content
                const html = `<p>${parseMarkdown(part.content)}</p>`;
                return (
                    <div
                        key={part.key}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            })}
        </div>
    );
}

// Render HTML content directly, handling VIDEO embeds
function renderHtmlContent(content) {
    // Split by VIDEO embed pattern only (images in HTML are already handled by browser)
    const videoPattern = /\[VIDEO:([^\]]+)\]/g;
    const parts = [];
    let key = 0;
    let lastIndex = 0;
    let match;

    while ((match = videoPattern.exec(content)) !== null) {
        // Add HTML before this match
        if (match.index > lastIndex) {
            const htmlBefore = content.substring(lastIndex, match.index);
            if (htmlBefore.trim()) {
                parts.push({
                    type: 'html',
                    content: htmlBefore,
                    key: key++
                });
            }
        }

        // Add video embed
        parts.push({
            type: 'video',
            videoId: match[1].trim(),
            key: key++
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining HTML
    if (lastIndex < content.length) {
        const remaining = content.substring(lastIndex);
        if (remaining.trim()) {
            parts.push({
                type: 'html',
                content: remaining,
                key: key++
            });
        }
    }

    // If no video embeds, render as single HTML block
    if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'html')) {
        return (
            <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    // Render parts with video embeds
    return (
        <div className="markdown-content">
            {parts.map((part) => {
                if (part.type === 'video') {
                    return (
                        <div key={part.key} className="content-embed">
                            <YouTubeEmbed videoId={part.videoId} title="Embedded Video" />
                        </div>
                    );
                }

                // HTML content - render directly
                return (
                    <div
                        key={part.key}
                        dangerouslySetInnerHTML={{ __html: part.content }}
                    />
                );
            })}
        </div>
    );
}

