'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

export default function ViewCounter({ slug, initialViews = 0 }) {
    const [views, setViews] = useState(initialViews);
    const [counted, setCounted] = useState(false);

    useEffect(() => {
        // Only count view once per session
        const viewedKey = `viewed_${slug}`;
        const hasViewed = sessionStorage.getItem(viewedKey);

        if (!hasViewed && !counted) {
            // Increment view count
            fetch(`/api/tutorials/${slug}/views`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.views) {
                        setViews(data.views);
                    }
                })
                .catch(console.error);

            sessionStorage.setItem(viewedKey, 'true');
            setCounted(true);
        } else {
            // Just fetch current count
            fetch(`/api/tutorials/${slug}/views`)
                .then(res => res.json())
                .then(data => {
                    if (data.views !== undefined) {
                        setViews(data.views);
                    }
                })
                .catch(console.error);
        }
    }, [slug, counted]);

    const formatViews = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    return (
        <span className="view-counter">
            <Eye size={14} />
            <span>{formatViews(views)} views</span>
        </span>
    );
}
