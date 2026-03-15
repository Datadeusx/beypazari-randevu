'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import GalleryGrid, { Photo } from '@/components/GalleryGrid';
import { STORAGE_BUCKET } from '@/lib/storage/setup';

interface SalonGallerySectionProps {
  salonId: string;
}

export default function SalonGallerySection({ salonId }: SalonGallerySectionProps) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredPhoto, setFeaturedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    async function loadPhotos() {
      setLoading(true);

      const { data: photosData } = await supabase
        .from('salon_photos')
        .select('*')
        .eq('salon_id', salonId)
        .order('display_order', { ascending: true });

      if (photosData && photosData.length > 0) {
        const photosWithUrls = photosData.map((photo) => ({
          ...photo,
          url: supabase.storage.from(STORAGE_BUCKET).getPublicUrl(photo.storage_path)
            .data.publicUrl,
        }));

        setPhotos(photosWithUrls);

        // Set featured photo if any
        const featured = photosWithUrls.find((p) => p.is_featured);
        setFeaturedPhoto(featured || photosWithUrls[0]);
      }

      setLoading(false);
    }

    loadPhotos();
  }, [salonId, supabase]);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (photos.length === 0) {
    return null; // Don't show section if no photos
  }

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: 28,
        border: '1px solid #e5e7eb',
        padding: 32,
        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        marginBottom: 32,
      }}
    >
      {/* Section Header */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Galeri
        </h2>
        <p style={{ marginTop: 8, color: '#6b7280', fontSize: 15 }}>
          Çalışmalarımızdan örnekler
        </p>
      </div>

      {/* Featured Photo (if exists) */}
      {featuredPhoto && (
        <div
          style={{
            position: 'relative',
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 24,
            height: 400,
            background: '#f3f4f6',
          }}
        >
          <img
            src={featuredPhoto.url}
            alt={featuredPhoto.caption || 'Vitrin fotoğrafı'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {featuredPhoto.caption && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                padding: '40px 24px 24px',
                color: '#ffffff',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {featuredPhoto.caption}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      <GalleryGrid photos={photos} columns={4} showCaptions={false} />
    </section>
  );
}
