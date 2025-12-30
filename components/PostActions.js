'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Share2, Edit, MessageCircle } from 'lucide-react';

export default function PostActions({ tutorialId, tutorialTitle, tutorialSlug }) {
    const { data: session } = useSession();

    // Generate WhatsApp share URL
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/tutorial/${tutorialSlug}`
        : '';

    const whatsappText = encodeURIComponent(`📚 *${tutorialTitle}*\n\nBaca tutorial ini:\n${shareUrl}`);
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
                    title="Edit Tutorial"
                >
                    <Edit size={18} />
                    <span>Edit</span>
                </Link>
            )}
        </div>
    );
}
