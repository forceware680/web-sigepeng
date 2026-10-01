// Decode common HTML entities back to plain text.
// &amp; is decoded last so double-escaped content (e.g. "&amp;gt;") is not
// over-decoded into a real character.
export function decodeHtmlEntities(text) {
    if (!text) return '';
    return String(text)
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0*39;|&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
            const n = parseInt(code, 16);
            return Number.isFinite(n) ? String.fromCodePoint(n) : `&#x${code};`;
        })
        .replace(/&#(\d+);/g, (_, code) => {
            const n = parseInt(code, 10);
            return Number.isFinite(n) ? String.fromCodePoint(n) : `&${code};`;
        })
        .replace(/&amp;/g, '&');
}
