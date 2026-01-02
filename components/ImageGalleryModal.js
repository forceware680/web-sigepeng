'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, Check, ImageIcon, ZoomIn } from 'lucide-react';

export default function ImageGalleryModal({ isOpen, onClose, onSelect }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchImages();
            setSelectedImage(null);
            setPreviewImage(null);
        }
    }, [isOpen]);

    const fetchImages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/gallery?limit=50');
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

            if (response.ok) {
                setImages(images.filter(img => img.public_id !== public_id));
                if (selectedImage?.public_id === public_id) {
                    setSelectedImage(null);
                }
                if (previewImage?.public_id === public_id) {
                    setPreviewImage(null);
                }
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

    if (!isOpen) return null;

    return (
        <div className="gallery-modal-overlay" onClick={onClose}>
            <div className="gallery-modal gallery-modal-with-preview" onClick={e => e.stopPropagation()}>
                <div className="gallery-header">
                    <h2><ImageIcon size={20} /> Gallery Gambar</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

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
                                <button onClick={fetchImages}>Coba Lagi</button>
                            </div>
                        ) : images.length === 0 ? (
                            <div className="gallery-empty">
                                <ImageIcon size={48} />
                                <p>Belum ada gambar di gallery.</p>
                                <p>Upload gambar menggunakan tombol Upload di editor.</p>
                            </div>
                        ) : (
                            <div className="gallery-grid">
                                {images.map((img) => (
                                    <div
                                        key={img.public_id}
                                        className={`gallery-item ${selectedImage?.public_id === img.public_id ? 'selected' : ''}`}
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <img src={img.thumbnail} alt="" loading="lazy" />
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
                        <button className="btn-secondary" onClick={onClose}>
                            Batal
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleSelect}
                            disabled={!selectedImage}
                        >
                            Pilih Gambar
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen Preview Lightbox */}
            {previewImage && (
                <div className="gallery-lightbox" onClick={(e) => { e.stopPropagation(); closePreview(); }}>
                    <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); closePreview(); }}>
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
