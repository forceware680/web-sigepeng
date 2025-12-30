'use client';

import { useState, useRef } from 'react';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Code, Link, Video, Image, Eye, Edit, Quote } from 'lucide-react';

export default function BlogEditor({ value, onChange, placeholder = "Tulis konten tutorial..." }) {
    const [previewMode, setPreviewMode] = useState(false);
    const textareaRef = useRef(null);

    const insertText = (before, after = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
        onChange(newText);

        // Set cursor position after insertion
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + selectedText.length + after.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertAtNewLine = (text) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const beforeCursor = value.substring(0, start);
        const afterCursor = value.substring(start);

        // Check if we need a newline before
        const needsNewLine = beforeCursor.length > 0 && !beforeCursor.endsWith('\n');
        const prefix = needsNewLine ? '\n' : '';

        const newText = beforeCursor + prefix + text + '\n' + afterCursor;
        onChange(newText);

        setTimeout(() => {
            textarea.focus();
        }, 0);
    };

    const handleBold = () => insertText('**', '**');
    const handleItalic = () => insertText('*', '*');
    const handleH1 = () => insertAtNewLine('# ');
    const handleH2 = () => insertAtNewLine('## ');
    const handleH3 = () => insertAtNewLine('### ');
    const handleBulletList = () => insertAtNewLine('- ');
    const handleNumberList = () => insertAtNewLine('1. ');
    const handleCode = () => insertText('`', '`');
    const handleQuote = () => insertAtNewLine('> ');

    const handleLink = () => {
        const url = prompt('Masukkan URL:');
        if (url) {
            insertText('[', `](${url})`);
        }
    };

    const handleVideoEmbed = () => {
        const videoId = prompt('Masukkan YouTube Video ID:\n(Contoh: dQw4w9WgXcQ dari URL youtube.com/watch?v=dQw4w9WgXcQ)');
        if (videoId) {
            insertAtNewLine(`\n[VIDEO:${videoId}]\n`);
        }
    };

    const handleImageEmbed = () => {
        const imageUrl = prompt('Masukkan URL Gambar:');
        if (imageUrl) {
            const caption = prompt('Masukkan caption gambar (opsional):') || '';
            insertAtNewLine(`\n[IMAGE:${imageUrl}${caption ? '|' + caption : ''}]\n`);
        }
    };

    // Simple markdown preview
    const renderPreview = () => {
        if (!value) return '<p class="preview-empty">Belum ada konten...</p>';

        let html = value
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Video embeds
            .replace(/\[VIDEO:(.*?)\]/g, '<div class="preview-video"><span>📹 Video: $1</span></div>')
            // Image embeds
            .replace(/\[IMAGE:(.*?)\|(.*?)\]/g, '<div class="preview-image"><span>🖼️ Gambar: $1</span><br/><small>Caption: $2</small></div>')
            .replace(/\[IMAGE:(.*?)\]/g, '<div class="preview-image"><span>🖼️ Gambar: $1</span></div>')
            // Lists
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            // Blockquote
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br />');

        return `<p>${html}</p>`;
    };

    return (
        <div className="blog-editor">
            <div className="editor-toolbar">
                <div className="toolbar-group">
                    <button type="button" onClick={handleBold} title="Bold">
                        <Bold size={16} />
                    </button>
                    <button type="button" onClick={handleItalic} title="Italic">
                        <Italic size={16} />
                    </button>
                    <button type="button" onClick={handleCode} title="Code">
                        <Code size={16} />
                    </button>
                </div>

                <div className="toolbar-separator" />

                <div className="toolbar-group">
                    <button type="button" onClick={handleH1} title="Heading 1">
                        <Heading1 size={16} />
                    </button>
                    <button type="button" onClick={handleH2} title="Heading 2">
                        <Heading2 size={16} />
                    </button>
                    <button type="button" onClick={handleH3} title="Heading 3">
                        <Heading3 size={16} />
                    </button>
                </div>

                <div className="toolbar-separator" />

                <div className="toolbar-group">
                    <button type="button" onClick={handleBulletList} title="Bullet List">
                        <List size={16} />
                    </button>
                    <button type="button" onClick={handleNumberList} title="Numbered List">
                        <ListOrdered size={16} />
                    </button>
                    <button type="button" onClick={handleQuote} title="Quote">
                        <Quote size={16} />
                    </button>
                </div>

                <div className="toolbar-separator" />

                <div className="toolbar-group">
                    <button type="button" onClick={handleLink} title="Insert Link">
                        <Link size={16} />
                    </button>
                    <button type="button" onClick={handleVideoEmbed} title="Embed Video" className="embed-btn video">
                        <Video size={16} />
                    </button>
                    <button type="button" onClick={handleImageEmbed} title="Embed Image" className="embed-btn image">
                        <Image size={16} />
                    </button>
                </div>

                <div className="toolbar-spacer" />

                <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`preview-toggle ${previewMode ? 'active' : ''}`}
                    title={previewMode ? 'Edit' : 'Preview'}
                >
                    {previewMode ? <Edit size={16} /> : <Eye size={16} />}
                    {previewMode ? 'Edit' : 'Preview'}
                </button>
            </div>

            {previewMode ? (
                <div
                    className="editor-preview markdown-content"
                    dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
            ) : (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={15}
                    className="editor-textarea"
                />
            )}

            <div className="editor-help">
                <span>💡 Tips: Gunakan <code>[VIDEO:id]</code> untuk embed video dan <code>[IMAGE:url|caption]</code> untuk gambar</span>
            </div>
        </div>
    );
}
