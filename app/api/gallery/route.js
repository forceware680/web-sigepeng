import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// GET - List all images from Cloudinary folder
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const maxResults = parseInt(searchParams.get('limit') || '30');
        const nextCursor = searchParams.get('cursor') || null;

        // Get images from simaset-wiki folder
        const options = {
            type: 'upload',
            prefix: 'simaset-wiki/',
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
        });

        return NextResponse.json({
            success: true,
            images,
            next_cursor: result.next_cursor || null,
            total: result.resources.length,
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

        await cloudinary.uploader.destroy(public_id);

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
