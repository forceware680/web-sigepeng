'use client';

import { useState, useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';

export default function ZoomableImage({ src, alt, title, className = "" }) {
    const [isOpen, setIsOpen] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Thumbnail */}
            <div
                className={`zoomable-image-container ${className}`}
                onClick={() => setIsOpen(true)}
                title="Klik untuk memperbesar"
            >
                <img
                    src={src}
                    alt={alt}
                    className="zoomable-thumbnail"
                    loading="lazy"
                />
                <div className="zoom-overlay">
                    <Maximize2 size={24} color="white" />
                </div>
            </div>

            {/* Lightbox Modal */}
            {isOpen && (
                <div className="lightbox-overlay" onClick={() => setIsOpen(false)}>
                    <button className="lightbox-close" onClick={() => setIsOpen(false)}>
                        <X size={32} />
                    </button>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={src} alt={alt} className="lightbox-image" />
                        {title && <div className="lightbox-caption">{title}</div>}
                    </div>
                </div>
            )}

            {/* Styles are defined in globals.css or styled-jsx below */}
            <style jsx global>{`
                .zoomable-image-container {
                    position: relative;
                    cursor: pointer;
                    display: inline-block;
                    max-width: 100%;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .zoomable-thumbnail {
                    display: block;
                    width: 100%;
                    height: auto;
                    transition: transform 0.3s ease;
                }

                .zoomable-image-container:hover .zoomable-thumbnail {
                    transform: scale(1.02);
                }

                .zoom-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .zoomable-image-container:hover .zoom-overlay {
                    opacity: 1;
                }

                .lightbox-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    animation: fadeIn 0.2s ease-out;
                }

                .lightbox-content {
                    position: relative;
                    max-width: 100%;
                    max-height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .lightbox-image {
                    max-width: 100%;
                    max-height: 90vh;
                    object-fit: contain;
                    border-radius: 4px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }

                .lightbox-caption {
                    color: white;
                    margin-top: 1rem;
                    font-size: 1.1rem;
                    text-align: center;
                    font-weight: 500;
                }

                .lightbox-close {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    transition: background 0.2s;
                    z-index: 10000;
                }

                .lightbox-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </>
    );
}
