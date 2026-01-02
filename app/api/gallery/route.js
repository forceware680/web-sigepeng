export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// GET - List all images from Cloudinary folder
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const maxResults = parseInt(searchParams.get('limit') || '30');
        const nextCursor = searchParams.get('cursor') || null;

        // Get images from all folders
        const options = {
            type: 'upload',
            max_results: maxResults,
            resource_type: 'image',
        };

        if (nextCursor) {
            options.next_cursor = nextCursor;
        }

        const result = await cloudinary.api.resources(options);

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

        // Format response
        const images = result.resources.map(img => {
            // Generate thumbnail URL manually
            const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_150,h_150,c_fill,q_auto,f_auto/${img.public_id}`;

            return {
                public_id: img.public_id,
                url: img.secure_url,
                width: img.width,
                height: img.height,
                format: img.format,
                created_at: img.created_at,
                bytes: img.bytes,
                thumbnail: thumbnailUrl,
            };
        }).filter(img => img.bytes > 0); // Filter out ghost/invalid images

        return NextResponse.json({
            success: true,
            images,
            next_cursor: result.next_cursor || null,
            total: result.resources.length,
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });

    } catch (error) {
        console.error('Gallery error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to load gallery' },
            { status: 500 }
        );
    }
}

// DELETE - Remove an image from Cloudinary
export async function DELETE(request) {
    try {
        const { public_id } = await request.json();

        if (!public_id) {
            return NextResponse.json(
                { error: 'No public_id provided' },
                { status: 400 }
            );
        }

        // Use Admin API to match the Listing API logic
        // delete_resources returns { deleted: { [public_id]: "deleted" | "not_found" | ... } }
        const result = await cloudinary.api.delete_resources([public_id], {
            type: 'upload',
            resource_type: 'image'
        });

        const status = result.deleted?.[public_id];

        if (status !== 'deleted') {
            console.error(`Cloudinary delete failed for ${public_id}. Status: ${status}`);
            throw new Error(`Cloudinary delete failed. Status: ${status}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully',
        });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete image' },
            { status: 500 }
        );
    }
}
