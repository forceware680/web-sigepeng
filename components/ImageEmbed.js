import ZoomableImage from './ZoomableImage';

const ALIGN_STYLES = {
    left: { width: 'fit-content', margin: '1rem 0' },
    center: { width: 'fit-content', margin: '1rem auto' },
    right: { width: 'fit-content', margin: '1rem 0 1rem auto' },
};

export default function ImageEmbed({ url, title = "", caption = "", alt = "", align = "" }) {
    if (!url) return null;

    return (
        <figure className="image-embed" style={ALIGN_STYLES[align] || undefined}>
            <ZoomableImage
                src={url}
                alt={alt || title || "Tutorial image"}
                title={title || caption}
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
