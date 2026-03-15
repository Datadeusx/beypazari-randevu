'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface Photo {
  id: string;
  storage_path: string;
  file_name: string;
  caption?: string | null;
  is_featured?: boolean;
  display_order?: number;
  url: string;
}

interface GalleryGridProps {
  photos: Photo[];
  columns?: number;
  showCaptions?: boolean;
}

export default function GalleryGrid({
  photos,
  columns = 3,
  showCaptions = false,
}: GalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrevious();
  };

  if (photos.length === 0) {
    return (
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
          background: '#f9fafb',
          color: '#6b7280',
        }}
      >
        Henüz fotoğraf eklenmemiş.
      </div>
    );
  }

  return (
    <>
      {/* Gallery Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 16,
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => openLightbox(index)}
            style={{
              position: 'relative',
              paddingTop: '100%',
              borderRadius: 16,
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#f3f4f6',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Image
              src={photo.url}
              alt={photo.caption || photo.file_name}
              fill
              sizes={`(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${100 / columns}vw`}
              style={{
                objectFit: 'cover',
              }}
              loading="lazy"
            />

            {showCaptions && photo.caption && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#ffffff',
                  padding: '12px 16px',
                  fontSize: 14,
                }}
              >
                {photo.caption}
              </div>
            )}

            {photo.is_featured && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: '#fbbf24',
                  color: '#111827',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Vitrin
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 48,
              height: 48,
              borderRadius: 999,
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontSize: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
            }}
          >
            ×
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              style={{
                position: 'absolute',
                left: 20,
                width: 48,
                height: 48,
                borderRadius: 999,
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: 24,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
              }}
            >
              ‹
            </button>
          )}

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              style={{
                position: 'absolute',
                right: 20,
                width: 48,
                height: 48,
                borderRadius: 999,
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: 24,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
              }}
            >
              ›
            </button>
          )}

          {/* Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
            }}
          >
            <img
              src={photos[currentIndex].url}
              alt={photos[currentIndex].caption || photos[currentIndex].file_name}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />

            {/* Caption */}
            {photos[currentIndex].caption && (
              <div
                style={{
                  marginTop: 16,
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: 16,
                }}
              >
                {photos[currentIndex].caption}
              </div>
            )}

            {/* Counter */}
            {photos.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
