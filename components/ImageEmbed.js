'use client';

export default function ImageEmbed({ url, title = "", caption = "", alt = "" }) {
    if (!url) return null;

    return (
        <figure className="image-embed">
            <img
                src={url}
                alt={alt || title || "Tutorial image"}
                loading="lazy"
            />
            {(title || caption) && (
                <figcaption>
                    {title && <strong>{title}</strong>}
                    {title && caption && <br />}
                    {caption && <span>{caption}</span>}
                </figcaption>
            )}
        </figure>
    );
}
