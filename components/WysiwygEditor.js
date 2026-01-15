'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapImage from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import {
    Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
    List, ListOrdered, Code, Link as LinkIcon, Video, Image, Quote,
    Eye, Code2, Upload, Loader2, FolderOpen, Smile, MousePointerClick,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Wrench
} from 'lucide-react';
import ImageGalleryModal from './ImageGalleryModal';
import EmojiPicker from './EmojiPicker';

// Convert Markdown to HTML for loading into TipTap
const markdownToHtml = (markdown) => {
    if (!markdown) return '';

    let result = markdown;

    // First, always process custom embed syntax (IMAGE, VIDEO, BUTTON)
    // These need to be processed even if content is already HTML
    result = result
        // Custom BUTTON syntax: [BUTTON:text](url) - restore button styling
        .replace(/\[BUTTON:([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="content-button" data-button>$1</a>')
        // Custom IMAGE syntax: [IMAGE:url|caption] or [IMAGE:url]
        .replace(/\[IMAGE:([^\]|]+)\|([^\]]*)\]/g, '<img src="$1" alt="$2" title="$2" />')
        .replace(/\[IMAGE:([^\]]+)\]/g, '<img src="$1" alt="" />')
        // Custom VIDEO syntax: [VIDEO:id]
        .replace(/\[VIDEO:([^\]]+)\]/g, '<p>[VIDEO:$1]</p>');

    // Check if content is already HTML (starts with < tag)
    // If so, skip markdown processing
    if (result.trim().startsWith('<')) {
        return result;
    }

    // Process ordered lists (numbered: 1. 2. 3.)
    // Handle lists that may have images or other content between items
    result = result.replace(/^(\d+\. .+(?:\n(?:\d+\. .+|<img[^>]*>|\[IMAGE:[^\]]+\]))*)/gm, (match) => {
        const lines = match.split('\n');
        let html = '<ol>';
        let itemCount = 0;
        let needsStart = false;

        for (const line of lines) {
            if (line.match(/^\d+\. /)) {
                itemCount++;
                if (needsStart) {
                    // Continue numbering from where we left off
                    html += `<ol start="${itemCount}">`;
                    needsStart = false;
                }
                const text = line.replace(/^\d+\. /, '').trim();
                html += `<li><p>${text}</p></li>`;
            } else if (line.trim()) {
                // Non-list content (images, etc.) - close list, add content
                html += `</ol>${line}`;
                needsStart = true; // Next list item needs start attribute
            }
        }

        if (!needsStart) {
            html += '</ol>';
        }

        // Clean up empty <ol></ol> pairs
        html = html.replace(/<ol[^>]*><\/ol>/g, '');
        return html;
    });

    // Process unordered lists (bullet: - item)
    result = result.replace(/^(- .+(?:\n(?:- .+|<img[^>]*>|\[IMAGE:[^\]]+\]))*)/gm, (match) => {
        const lines = match.split('\n');
        let html = '<ul>';
        for (const line of lines) {
            if (line.match(/^- /)) {
                const text = line.replace(/^- /, '').trim();
                html += `<li><p>${text}</p></li>`;
            } else if (line.trim()) {
                // Non-list content (images, etc.) - close list, add content, reopen
                html += `</ul>${line}<ul>`;
            }
        }
        html += '</ul>';
        // Clean up empty <ul></ul> pairs
        html = html.replace(/<ul><\/ul>/g, '');
        return html;
    });

    return result
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic (single asterisk, not part of bold)
        .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Regular links (not BUTTON/IMAGE/VIDEO - already processed)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Blockquote
        .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
        // Wrap text lines in paragraphs (lines not already wrapped in tags)
        .replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>')
        // Clean up empty lines and normalize
        .replace(/\n+/g, '')
        .replace(/<\/p><p>/g, '</p>\n<p>');
};

// Convert HTML back to Markdown for source mode
const htmlToMarkdown = (html) => {
    if (!html) return '';

    let result = html;

    // First, normalize all whitespace between tags
    result = result.replace(/>\s+</g, '><');

    // Strip <p> tags inside <li> tags (TipTap wraps li content in p)
    result = result.replace(/<li[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/li>/gi, '<li>$1</li>');

    // IMPORTANT: Handle buttons BEFORE regular links (buttons have class="content-button" or data-button)
    result = result.replace(/<a[^>]*class="[^"]*content-button[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[BUTTON:$2]($1)');
    result = result.replace(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*content-button[^"]*"[^>]*>(.*?)<\/a>/gi, '[BUTTON:$2]($1)');
    result = result.replace(/<a[^>]*data-button[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[BUTTON:$2]($1)');
    result = result.replace(/<a[^>]*href="([^"]*)"[^>]*data-button[^>]*>(.*?)<\/a>/gi, '[BUTTON:$2]($1)');

    // Handle images FIRST - extract src, alt, and title in any order
    // This must happen BEFORE list processing so images inside lists are preserved
    result = result.replace(/<img\s*([^>]*)>/gi, (match, attrs) => {
        let src = '', alt = '', title = '';

        // Extract src
        const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
        if (srcMatch) src = srcMatch[1];

        // Extract alt
        const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
        if (altMatch) alt = altMatch[1];

        // Extract title
        const titleMatch = attrs.match(/title=["']([^"']*)["']/i);
        if (titleMatch) title = titleMatch[1];

        // Use alt or title as caption
        const caption = alt || title || '';

        if (!src) return ''; // Skip if no src

        return caption ? `[IMAGE:${src}|${caption}]` : `[IMAGE:${src}]`;
    });

    // Process ordered lists - convert to numbered format
    // Read the start attribute to preserve numbering when lists are split
    result = result.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi, (match, olAttrs, content) => {
        // Check for start attribute
        const startMatch = olAttrs.match(/start=["']?(\d+)["']?/i);
        let counter = startMatch ? parseInt(startMatch[1], 10) : 1;

        const items = [];
        content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, text) => {
            // Preserve [IMAGE:...], [VIDEO:...], [BUTTON:...] syntax while cleaning HTML
            const preserved = text.replace(/\[(IMAGE|VIDEO|BUTTON):[^\]]+\]/g, '###PRESERVE$1###');
            let cleanText = preserved.replace(/<[^>]*>/g, '').trim();
            cleanText = cleanText.replace(/###PRESERVE(IMAGE|VIDEO|BUTTON)###/g, (m, type) => {
                // Find original syntax
                const match = text.match(new RegExp(`\\[${type}:[^\\]]+\\]`));
                return match ? '\n' + match[0] : '';
            });
            if (cleanText) items.push(`${counter++}. ${cleanText}`);
            return '';
        });
        return items.length > 0 ? items.join('\n') + '\n' : '';
    });

    // Process unordered lists - convert to bullet format
    result = result.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
        const items = [];
        content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, text) => {
            // Preserve [IMAGE:...], [VIDEO:...], [BUTTON:...] syntax while cleaning HTML
            const preserved = text.replace(/\[(IMAGE|VIDEO|BUTTON):[^\]]+\]/g, '###PRESERVE$1###');
            let cleanText = preserved.replace(/<[^>]*>/g, '').trim();
            cleanText = cleanText.replace(/###PRESERVE(IMAGE|VIDEO|BUTTON)###/g, (m, type) => {
                // Find original syntax
                const match = text.match(new RegExp(`\\[${type}:[^\\]]+\\]`));
                return match ? '\n' + match[0] : '';
            });
            if (cleanText) items.push(`- ${cleanText}`);
            return '';
        });
        return items.length > 0 ? items.join('\n') + '\n' : '';
    });

    return result
        // Headers
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
        // Bold
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        // Italic
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        // Underline (keep as HTML)
        .replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>')
        // Code
        .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```')
        .replace(/<code>(.*?)<\/code>/gi, '`$1`')
        // Regular links (not buttons - already processed above)
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        // Blockquote
        .replace(/<blockquote[^>]*><p>(.*?)<\/p><\/blockquote>/gi, '> $1\n')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
        // Empty paragraphs - remove completely
        .replace(/<p[^>]*>\s*<\/p>/gi, '')
        // Paragraphs with content
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n')
        // Line breaks
        .replace(/<br\s*\/?>/gi, '\n')
        // Clean remaining HTML tags
        .replace(/<\/?[^>]+(>|$)/g, '')
        // Normalize multiple newlines to max 2
        .replace(/\n{3,}/g, '\n\n')
        // Remove leading/trailing whitespace on each line
        .split('\n').map(line => line.trim()).join('\n')
        // Final cleanup
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

// Toolbar Button Component
const ToolbarButton = ({ onClick, isActive, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`toolbar-btn ${isActive ? 'active' : ''}`}
        title={title}
    >
        {children}
    </button>
);

// Mode Toggle Component - Icon Only
const ModeToggle = ({ mode, onModeChange }) => (
    <div className="mode-toggle">
        <button
            type="button"
            onClick={() => onModeChange('visual')}
            className={`mode-btn ${mode === 'visual' ? 'active' : ''}`}
            title="Visual Mode - WYSIWYG"
        >
            <Eye size={18} />
        </button>
        <button
            type="button"
            onClick={() => onModeChange('source')}
            className={`mode-btn ${mode === 'source' ? 'active' : ''}`}
            title="Source Mode - Markdown"
        >
            <Code2 size={18} />
        </button>
    </div>
);

export default function WysiwygEditor({ value, onChange, placeholder = "Tulis konten tutorial..." }) {
    const [mode, setMode] = useState('visual'); // 'visual' or 'source'
    const [sourceContent, setSourceContent] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [showGallery, setShowGallery] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingImage, setEditingImage] = useState(null); // { src, alt, node, pos }
    const [captionInput, setCaptionInput] = useState('');
    const [isToolbarFloating, setIsToolbarFloating] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const bulkFileInputRef = useRef(null);
    const editorContainerRef = useRef(null);
    const toolbarRef = useRef(null);
    const editorWrapperRef = useRef(null);

    // Detect scroll to make toolbar sticky/floating
    useEffect(() => {
        const handleScroll = () => {
            if (!editorWrapperRef.current) return;

            const editorRect = editorWrapperRef.current.getBoundingClientRect();

            // Make toolbar floating when editor is in view but toolbar would be off-screen
            // Only float if we're editing (editor top is above viewport but bottom is still visible)
            const shouldFloat = editorRect.top < -50 && editorRect.bottom > 150;
            setIsToolbarFloating(shouldFloat);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                // Disable potentially conflicting extensions
                link: false,
                underline: false,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Underline,
            TiptapImage.configure({
                inline: false,
                allowBase64: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
            }),
            Placeholder.configure({
                placeholder: placeholder,
            }),
        ],
        content: markdownToHtml(value || ''),
        immediatelyRender: false, // Required for Next.js SSR compatibility
        onUpdate: ({ editor }) => {
            if (mode === 'visual') {
                const html = editor.getHTML();
                onChange(html);
            }
        },
    });

    // Sync content when switching modes
    const handleModeChange = useCallback((newMode) => {
        if (newMode === mode) return;

        if (newMode === 'source') {
            // Switching to source: convert HTML to Markdown
            const html = editor?.getHTML() || '';
            const markdown = htmlToMarkdown(html);
            setSourceContent(markdown);
        } else {
            // Switching to visual: convert Markdown to HTML
            const html = markdownToHtml(sourceContent);
            editor?.commands.setContent(html);
        }

        setMode(newMode);
    }, [mode, editor, sourceContent]);

    // Handle clicks on images in the editor for caption editing
    useEffect(() => {
        if (!editor || mode !== 'visual') return;

        const handleEditorClick = (event) => {
            const target = event.target;
            if (target.tagName === 'IMG') {
                event.preventDefault();
                event.stopPropagation();

                // Get the image position in the document
                const { state } = editor;
                let imagePos = null;
                state.doc.descendants((node, pos) => {
                    if (node.type.name === 'image' && node.attrs.src === target.src) {
                        imagePos = pos;
                        return false;
                    }
                });

                setEditingImage({
                    src: target.src,
                    alt: target.alt || '',
                    title: target.title || '',
                    pos: imagePos
                });
                setCaptionInput(target.alt || target.title || '');
            }
        };

        const editorElement = editorContainerRef.current?.querySelector('.tiptap');
        if (editorElement) {
            editorElement.addEventListener('click', handleEditorClick);
            return () => editorElement.removeEventListener('click', handleEditorClick);
        }
    }, [editor, mode]);

    // Save image caption
    const handleSaveCaption = () => {
        if (!editor || editingImage === null) return;

        const { state, view } = editor;
        let updated = false;

        state.doc.descendants((node, pos) => {
            if (node.type.name === 'image' && node.attrs.src === editingImage.src) {
                const transaction = state.tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    alt: captionInput,
                    title: captionInput
                });
                view.dispatch(transaction);
                updated = true;
                return false;
            }
        });

        if (updated) {
            // Trigger content update
            const html = editor.getHTML();
            onChange(html);
        }

        setEditingImage(null);
        setCaptionInput('');
    };

    // Cancel image caption editing
    const handleCancelCaption = () => {
        setEditingImage(null);
        setCaptionInput('');
    };

    // Handle source mode changes
    const handleSourceChange = (e) => {
        const newContent = e.target.value;
        setSourceContent(newContent);
        // Also update parent (as markdown)
        onChange(newContent);
    };

    // Insert video embed
    const handleVideoEmbed = () => {
        const videoId = prompt('Masukkan YouTube Video ID:\n(Contoh: dQw4w9WgXcQ dari URL youtube.com/watch?v=dQw4w9WgXcQ)');
        if (videoId) {
            if (mode === 'visual') {
                editor?.commands.insertContent(`<p>[VIDEO:${videoId}]</p>`);
            } else {
                insertAtCursor(`\n[VIDEO:${videoId}]\n`);
            }
        }
    };

    // Insert image embed
    const handleImageEmbed = () => {
        const imageUrl = prompt('Masukkan URL Gambar:');
        if (imageUrl) {
            const caption = prompt('Masukkan caption gambar (opsional):') || '';
            if (mode === 'visual') {
                // Insert actual image in visual mode
                editor?.chain().focus().setImage({ src: imageUrl, alt: caption, title: caption }).run();
            } else {
                // Insert embed code in source mode
                const embedCode = caption ? `[IMAGE:${imageUrl}|${caption}]` : `[IMAGE:${imageUrl}]`;
                insertAtCursor(`\n${embedCode}\n`);
            }
        }
    };

    // Insert link
    const handleLink = () => {
        const url = prompt('Masukkan URL:');
        if (url) {
            if (mode === 'visual') {
                editor?.chain().focus().setLink({ href: url }).run();
            } else {
                const textarea = textareaRef.current;
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText = sourceContent.substring(start, end) || 'link text';
                    insertAtCursor(`[${selectedText}](${url})`);
                }
            }
        }
    };

    // Insert button
    const handleButtonInsert = () => {
        const buttonText = prompt('Masukkan text button:', 'Download File');
        if (!buttonText) return;

        let buttonUrl = prompt('Masukkan URL tujuan (lengkap dengan https://):', 'https://example.com');
        if (!buttonUrl || buttonUrl === 'https://example.com') {
            alert('URL tidak boleh kosong!');
            return;
        }

        // Validate and fix URL - ensure it has protocol
        buttonUrl = buttonUrl.trim();

        // If URL doesn't start with http:// or https://, add https://
        if (!buttonUrl.match(/^https?:\/\//i)) {
            // Check if it looks like a URL (has domain pattern)
            if (buttonUrl.includes('.') || buttonUrl.includes('://')) {
                buttonUrl = 'https://' + buttonUrl.replace(/^:\/\//, '');
            } else {
                alert('⚠️ URL tidak valid! Pastikan URL lengkap dengan https://\n\nContoh yang benar:\n✅ https://example.com/file.pdf\n✅ https://drive.google.com/file/xxx\n\n❌ example.com/file.pdf\n❌ c:/folder/file.pdf');
                return;
            }
        }

        // Additional validation - check if URL is valid
        try {
            new URL(buttonUrl);
        } catch (e) {
            alert('⚠️ URL tidak valid! Pastikan format URL benar.\n\nContoh: https://example.com/file.pdf');
            return;
        }

        if (mode === 'visual') {
            // Insert as link with button styling in visual mode
            const buttonHtml = `<p><a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" class="content-button" data-button>${buttonText}</a></p>`;
            editor?.commands.insertContent(buttonHtml);
        } else {
            // Insert as link with button styling in source mode
            const buttonHtml = `<a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" class="content-button" data-button>${buttonText}</a>`;
            insertAtCursor(`\n${buttonHtml}\n`);
        }
    };

    // Upload image to ImgBB
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 32MB for ImgBB)
        if (file.size > 32 * 1024 * 1024) {
            alert('Image size must be less than 32MB');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            // Ask for caption
            const caption = prompt('Masukkan caption gambar (opsional):') || '';

            if (mode === 'visual') {
                // Insert actual image in visual mode
                editor?.chain().focus().setImage({ src: result.url, alt: caption, title: caption }).run();
            } else {
                // Insert embed code in source mode
                const embedCode = caption
                    ? `[IMAGE:${result.url}|${caption}]`
                    : `[IMAGE:${result.url}]`;
                insertAtCursor(`\n${embedCode}\n`);
            }

            alert('✅ Gambar berhasil diupload!');

        } catch (error) {
            console.error('Upload error:', error);
            alert('❌ Gagal upload gambar: ' + error.message);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Trigger file input click
    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    // Trigger bulk file input click
    const triggerBulkUpload = () => {
        bulkFileInputRef.current?.click();
    };

    // Handle bulk image upload
    const handleBulkUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Filter only valid images
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                console.warn(`Skipping non-image file: ${file.name}`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                console.warn(`Skipping large file: ${file.name}`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            alert('Tidak ada file gambar yang valid');
            return;
        }

        setUploading(true);
        setUploadProgress({ current: 0, total: validFiles.length });

        const uploadedUrls = [];
        let successCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            setUploadProgress({ current: i + 1, total: validFiles.length });

            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    uploadedUrls.push(result.url);
                    successCount++;
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }

        // Insert all uploaded images
        if (uploadedUrls.length > 0) {
            if (mode === 'visual') {
                uploadedUrls.forEach(url => {
                    editor?.chain().focus().setImage({ src: url, alt: '', title: '' }).run();
                    editor?.commands.insertContent('<p></p>'); // Add spacing
                });
            } else {
                const embedCodes = uploadedUrls.map(url => `[IMAGE:${url}]`).join('\n');
                insertAtCursor(`\n${embedCodes}\n`);
            }
            alert(`✅ ${successCount}/${validFiles.length} gambar berhasil diupload!`);
        } else {
            alert('❌ Gagal upload semua gambar');
        }

        setUploading(false);
        setUploadProgress({ current: 0, total: 0 });

        // Reset file input
        if (bulkFileInputRef.current) {
            bulkFileInputRef.current.value = '';
        }
    };

    // Helper for source mode text insertion
    const insertAtCursor = (text) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const newContent = sourceContent.substring(0, start) + text + sourceContent.substring(start);
        setSourceContent(newContent);
        onChange(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
    };

    // Handle gallery image selection
    const handleGallerySelect = (imageUrl) => {
        const caption = prompt('Masukkan caption gambar (opsional):') || '';

        if (mode === 'visual') {
            // Insert actual image in visual mode
            editor?.chain().focus().setImage({ src: imageUrl, alt: caption, title: caption }).run();
        } else {
            // Insert embed code in source mode
            const embedCode = caption
                ? `[IMAGE:${imageUrl}|${caption}]`
                : `[IMAGE:${imageUrl}]`;
            insertAtCursor(`\n${embedCode}\n`);
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        if (mode === 'visual') {
            editor?.commands.insertContent(emoji);
        } else {
            insertAtCursor(emoji);
        }
    };

    if (!editor && mode === 'visual') {
        return <div className="editor-loading">Loading editor...</div>;
    }

    return (
        <div className="wysiwyg-editor" ref={editorWrapperRef}>
            <div className={`editor-toolbar ${isToolbarFloating ? 'floating' : ''}`} ref={toolbarRef}>
                {/* Formatting buttons - only show in visual mode */}
                {mode === 'visual' && (
                    <>
                        <div className="toolbar-group">
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                isActive={editor?.isActive('bold')}
                                title="Bold"
                            >
                                <Bold size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                isActive={editor?.isActive('italic')}
                                title="Italic"
                            >
                                <Italic size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                                isActive={editor?.isActive('underline')}
                                title="Underline"
                            >
                                <UnderlineIcon size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleCode().run()}
                                isActive={editor?.isActive('code')}
                                title="Code"
                            >
                                <Code size={16} />
                            </ToolbarButton>
                        </div>

                        <div className="toolbar-separator" />

                        <div className="toolbar-group">
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                isActive={editor?.isActive('heading', { level: 1 })}
                                title="Heading 1"
                            >
                                <Heading1 size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                isActive={editor?.isActive('heading', { level: 2 })}
                                title="Heading 2"
                            >
                                <Heading2 size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                                isActive={editor?.isActive('heading', { level: 3 })}
                                title="Heading 3"
                            >
                                <Heading3 size={16} />
                            </ToolbarButton>
                        </div>

                        <div className="toolbar-separator" />

                        <div className="toolbar-group">
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                isActive={editor?.isActive('bulletList')}
                                title="Bullet List"
                            >
                                <List size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                isActive={editor?.isActive('orderedList')}
                                title="Numbered List"
                            >
                                <ListOrdered size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                isActive={editor?.isActive('blockquote')}
                                title="Quote"
                            >
                                <Quote size={16} />
                            </ToolbarButton>
                        </div>

                        <div className="toolbar-separator" />

                        <div className="toolbar-group">
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                                isActive={editor?.isActive({ textAlign: 'left' })}
                                title="Align Left"
                            >
                                <AlignLeft size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                                isActive={editor?.isActive({ textAlign: 'center' })}
                                title="Align Center"
                            >
                                <AlignCenter size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                                isActive={editor?.isActive({ textAlign: 'right' })}
                                title="Align Right"
                            >
                                <AlignRight size={16} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                                isActive={editor?.isActive({ textAlign: 'justify' })}
                                title="Justify"
                            >
                                <AlignJustify size={16} />
                            </ToolbarButton>
                        </div>

                        <div className="toolbar-separator" />
                    </>
                )}

                {/* Embed buttons - always show */}
                <div className="toolbar-group">
                    <ToolbarButton onClick={handleLink} title="Insert Link">
                        <LinkIcon size={16} />
                    </ToolbarButton>
                    <ToolbarButton onClick={handleButtonInsert} title="Insert Button">
                        <MousePointerClick size={16} />
                    </ToolbarButton>
                    <ToolbarButton onClick={handleVideoEmbed} title="Embed Video">
                        <Video size={16} />
                    </ToolbarButton>
                    <ToolbarButton onClick={handleImageEmbed} title="Embed Image URL">
                        <Image size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={triggerBulkUpload}
                        title="Upload Gambar (bisa pilih banyak)"
                        isActive={uploading}
                    >
                        {uploading ? (
                            uploadProgress.total > 1 ? (
                                <span className="upload-progress-badge">
                                    {uploadProgress.current}/{uploadProgress.total}
                                </span>
                            ) : (
                                <Loader2 size={16} className="spin" />
                            )
                        ) : (
                            <Upload size={16} />
                        )}
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => setShowGallery(true)}
                        title="Gallery Gambar Cloudinary"
                    >
                        <FolderOpen size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => setShowEmojiPicker(true)}
                        title="Insert Emoji"
                    >
                        <Smile size={16} />
                    </ToolbarButton>
                    {/* Hidden file input for upload (supports multiple) */}
                    <input
                        type="file"
                        ref={bulkFileInputRef}
                        onChange={handleBulkUpload}
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                    />
                </div>

                <div className="toolbar-spacer" />

                {/* Mode Toggle */}
                <ModeToggle mode={mode} onModeChange={handleModeChange} />
            </div>

            {/* Editor Content */}
            {mode === 'visual' ? (
                <div ref={editorContainerRef} className="editor-visual-container">
                    <EditorContent editor={editor} className="tiptap-content" />
                </div>
            ) : (
                <textarea
                    ref={textareaRef}
                    value={sourceContent}
                    onChange={handleSourceChange}
                    placeholder={placeholder}
                    rows={15}
                    className="editor-textarea source-mode"
                />
            )}

            <div className="editor-help">
                {mode === 'visual' ? (
                    <span>💡 Mode Visual: Klik gambar untuk edit caption. Switch ke Source untuk edit markdown.</span>
                ) : (
                    <span>💡 Mode Source: Edit kode markdown. Gunakan <code>[VIDEO:id]</code> dan <code>[IMAGE:url|caption]</code> untuk embed.</span>
                )}
            </div>

            {/* Image Gallery Modal */}
            <ImageGalleryModal
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                onSelect={handleGallerySelect}
            />

            {/* Emoji Picker Modal */}
            <EmojiPicker
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onSelect={handleEmojiSelect}
            />

            {/* Image Caption Edit Modal */}
            {editingImage && (
                <div className="image-caption-modal-overlay" onClick={handleCancelCaption}>
                    <div className="image-caption-modal" onClick={e => e.stopPropagation()}>
                        <div className="image-caption-preview">
                            <img src={editingImage.src} alt="" />
                        </div>
                        <div className="image-caption-form">
                            <label htmlFor="caption-input">Caption / Alt Text:</label>
                            <input
                                id="caption-input"
                                type="text"
                                value={captionInput}
                                onChange={(e) => setCaptionInput(e.target.value)}
                                placeholder="Masukkan caption gambar..."
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCaption();
                                    if (e.key === 'Escape') handleCancelCaption();
                                }}
                            />
                            <div className="image-caption-actions">
                                <button type="button" className="btn-secondary" onClick={handleCancelCaption}>
                                    Batal
                                </button>
                                <button type="button" className="btn-primary" onClick={handleSaveCaption}>
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
