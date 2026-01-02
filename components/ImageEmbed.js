import ZoomableImage from './ZoomableImage';

export default function ImageEmbed({ url, title = "", caption = "", alt = "" }) {
    if (!url) return null;

    return (
        <figure className="image-embed">
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
