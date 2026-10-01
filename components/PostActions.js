'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Edit, MessageCircle } from 'lucide-react';
import { decodeHtmlEntities } from '@/lib/html';

function buildExcerpt(content) {
    if (!content) return '';
    const text = decodeHtmlEntities(String(content)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\[VIDEO:[^\]]*\]/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_`#]/g, '')
        .replace(/\s+/g, ' ')
        .trim());
    if (!text) return '';
    if (text.length <= 120) return text;
    return text.slice(0, 120).replace(/\s+\S*$/, '') + '…';
}

export default function PostActions({ tutorialId, tutorialTitle, tutorialSlug, tutorialContent }) {
    const { data: session } = useSession();

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/tutorial/${tutorialSlug}`
        : '';

    const title = (tutorialTitle || '').replace(/\*/g, '');
    const excerpt = buildExcerpt(tutorialContent);

    const parts = [`*${title}*`];
    if (excerpt) parts.push(excerpt);
    parts.push(`Baca selengkapnya:\n${shareUrl}`);

    const whatsappText = encodeURIComponent(parts.join('\n\n'));
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

    const handleShare = () => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="post-actions">
            {/* WhatsApp Share Button */}
            <button
                onClick={handleShare}
                className="btn-share-wa"
                title="Bagikan ke WhatsApp"
            >
                <MessageCircle size={18} />
                <span>Bagikan</span>
            </button>

            {/* Edit Button - Only visible for logged in admin */}
            {session && (
                <Link
                    href={`/admin/edit/${tutorialId}`}
                    className="btn-edit-post"
                    title="Edit Post"
                >
                    <Edit size={18} />
                    <span>Edit</span>
                </Link>
            )}
        </div>
    );
}
