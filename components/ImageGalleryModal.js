'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Trash2, Check, ImageIcon, ZoomIn, Upload, Clipboard } from 'lucide-react';

export default function ImageGalleryModal({ isOpen, onClose, onSelect }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchImages();
            setSelectedImage(null);
            setPreviewImage(null);
        }
    }, [isOpen]);

    // Handle clipboard paste (Ctrl+V)
    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = async (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        await uploadImage(file);
                    }
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [isOpen]);

    const fetchImages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/gallery?limit=50&t=${Date.now()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load images');
            }

            setImages(data.images || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Compress image if too large (for Vercel's 4.5MB body limit)
    const compressImage = (file, maxSizeMB = 2, maxWidthOrHeight = 2048) => {
        return new Promise((resolve, reject) => {
            // If file is small enough, don't compress
            if (file.size <= maxSizeMB * 1024 * 1024) {
                resolve(file);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // Scale down if too large
                    if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
                        if (width > height) {
                            height = (height / width) * maxWidthOrHeight;
                            width = maxWidthOrHeight;
                        } else {
                            width = (width / height) * maxWidthOrHeight;
                            height = maxWidthOrHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Try different quality levels
                    let quality = 0.9;
                    const tryCompress = () => {
                        canvas.toBlob(
                            (blob) => {
                                if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
                                    quality -= 0.1;
                                    tryCompress();
                                } else {
                                    const compressedFile = new File([blob], file.name, {
                                        type: 'image/jpeg',
                                        lastModified: Date.now(),
                                    });
                                    resolve(compressedFile);
                                }
                            },
                            'image/jpeg',
                            quality
                        );
                    };
                    tryCompress();
                };
                img.onerror = () => reject(new Error('Failed to load image for compression'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const uploadImage = async (file) => {
        if (!file.type.startsWith('image/')) {
            alert('File harus berupa gambar');
            return;
        }

        // Increase limit check since we'll compress
        if (file.size > 20 * 1024 * 1024) {
            alert('Ukuran file maksimal 20MB');
            return;
        }

        setUploading(true);
        setUploadProgress('Memproses...');

        try {
            // Compress image if needed
            let fileToUpload = file;
            if (file.size > 2 * 1024 * 1024) {
                setUploadProgress('Mengkompres gambar...');
                fileToUpload = await compressImage(file);
            }

            setUploadProgress('Mengupload...');

            const formData = new FormData();
            formData.append('image', fileToUpload);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            // Handle non-JSON responses (like Vercel's "Request Entity Too Large")
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                if (text.includes('Request Entity Too Large') || response.status === 413) {
                    throw new Error('Gambar terlalu besar. Coba gunakan gambar yang lebih kecil.');
                }
                throw new Error(`Server error: ${text.substring(0, 100)}`);
            }

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Upload gagal');
            }

            setUploadProgress('Berhasil!');

            // Refresh gallery to show new image
            await fetchImages();

            // Auto-select the newly uploaded image
            setTimeout(() => {
                setUploadProgress('');
            }, 1500);

        } catch (error) {
            console.error('Upload error:', error);
            alert('❌ Gagal upload: ' + error.message);
            setUploadProgress('');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        for (const file of files) {
            await uploadImage(file);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files || []);
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await uploadImage(file);
            }
        }
    };

    const handleDelete = async (public_id, e) => {
        e.stopPropagation();
        if (!confirm('Hapus gambar ini dari Cloudinary?')) return;

        setDeleting(public_id);
        try {
            const response = await fetch('/api/gallery', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_id }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Gagal menghapus gambar');
            }

            setImages(images.filter(img => img.public_id !== public_id));
            if (selectedImage?.public_id === public_id) {
                setSelectedImage(null);
            }
            if (previewImage?.public_id === public_id) {
                setPreviewImage(null);
            }
        } catch (err) {
            alert('Gagal menghapus gambar');
        } finally {
            setDeleting(null);
        }
    };

    const handleSelect = () => {
        if (selectedImage) {
            onSelect(selectedImage.url);
            onClose();
        }
    };

    const handlePreview = (img, e) => {
        e.stopPropagation();
        setPreviewImage(img);
    };

    const closePreview = () => {
        setPreviewImage(null);
    };

    const handleImageError = (public_id) => {
        // Silently remove the image from the list if it fails to load (Ghost image)
        setImages(prev => prev.filter(img => img.public_id !== public_id));
    };

    if (!isOpen) return null;

    return (
        <div className="gallery-modal-overlay" onClick={onClose}>
            <form
                className={`gallery-modal gallery-modal-with-preview ${isDragging ? 'dragging' : ''}`}
                onClick={e => e.stopPropagation()}
                onSubmit={e => e.preventDefault()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                ref={modalRef}
            >
                <div className="gallery-header">
                    <h2><ImageIcon size={20} /> Gallery Gambar</h2>
                    <div className="gallery-header-actions">
                        {/* Upload Button */}
                        <button
                            type="button"
                            className="btn-upload-gallery"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            title="Upload gambar baru"
                        >
                            {uploading ? (
                                <><Loader2 size={16} className="spin" /> {uploadProgress}</>
                            ) : (
                                <><Upload size={16} /> Upload</>
                            )}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                        />
                    </div>
                    <button type="button" className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Paste hint */}
                <div className="gallery-paste-hint">
                    <Clipboard size={14} />
                    <span>Tip: Tekan <kbd>Ctrl</kbd>+<kbd>V</kbd> untuk paste gambar dari clipboard</span>
                </div>

                {/* Drag overlay */}
                {isDragging && (
                    <div className="gallery-drag-overlay">
                        <Upload size={48} />
                        <p>Drop gambar di sini untuk upload</p>
                    </div>
                )}

                <div className="gallery-body">
                    {/* Left side - Grid */}
                    <div className="gallery-content">
                        {loading ? (
                            <div className="gallery-loading">
                                <Loader2 size={32} className="spin" />
                                <span>Memuat gambar...</span>
                            </div>
                        ) : error ? (
                            <div className="gallery-error">
                                <p>❌ {error}</p>
                                <button type="button" onClick={fetchImages}>Coba Lagi</button>
                            </div>
                        ) : images.length === 0 ? (
                            <div className="gallery-empty">
                                <ImageIcon size={48} />
                                <p>Belum ada gambar di gallery.</p>
                                <p>Klik tombol Upload atau paste gambar (Ctrl+V)</p>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={16} /> Upload Gambar
                                </button>
                            </div>
                        ) : (
                            <div className="gallery-grid">
                                {images.map((img) => (
                                    <div
                                        key={img.public_id}
                                        className={`gallery-item ${selectedImage?.public_id === img.public_id ? 'selected' : ''}`}
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <img
                                            src={img.thumbnail}
                                            alt=""
                                            loading="lazy"
                                            onError={() => handleImageError(img.public_id)}
                                        />
                                        {selectedImage?.public_id === img.public_id && (
                                            <div className="gallery-check">
                                                <Check size={20} />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className="gallery-preview-btn"
                                            onClick={(e) => handlePreview(img, e)}
                                            title="Preview gambar"
                                        >
                                            <ZoomIn size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="gallery-delete"
                                            onClick={(e) => handleDelete(img.public_id, e)}
                                            disabled={deleting === img.public_id}
                                        >
                                            {deleting === img.public_id ? (
                                                <Loader2 size={14} className="spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right side - Preview Panel */}
                    <div className={`gallery-preview-panel ${selectedImage ? 'has-image' : ''}`}>
                        {selectedImage ? (
                            <>
                                <div className="preview-image-container">
                                    <img src={selectedImage.url} alt="" />
                                </div>
                                <div className="preview-info">
                                    <p className="preview-size">
                                        {selectedImage.width} × {selectedImage.height}px
                                    </p>
                                    <p className="preview-format">
                                        {selectedImage.format?.toUpperCase()}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="preview-empty">
                                <ImageIcon size={48} />
                                <p>Pilih gambar untuk preview</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="gallery-footer">
                    <span className="gallery-count">
                        {images.length} gambar
                    </span>
                    <div className="gallery-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Batal
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleSelect}
                            disabled={!selectedImage}
                        >
                            Pilih Gambar
                        </button>
                    </div>
                </div>
            </form>

            {/* Fullscreen Preview Lightbox */}
            {previewImage && (
                <div className="gallery-lightbox" onClick={(e) => { e.stopPropagation(); closePreview(); }}>
                    <button type="button" className="lightbox-close" onClick={(e) => { e.stopPropagation(); closePreview(); }}>
                        <X size={24} />
                    </button>
                    <img src={previewImage.url} alt="" onClick={e => e.stopPropagation()} />
                    <div className="lightbox-info" onClick={e => e.stopPropagation()}>
                        {previewImage.width} × {previewImage.height}px • {previewImage.format?.toUpperCase()}
                    </div>
                </div>
            )}
        </div>
    );
}

