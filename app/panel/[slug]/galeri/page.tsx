'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PhotoUpload from '@/components/PhotoUpload';
import { STORAGE_BUCKET } from '@/lib/storage/setup';
import Link from 'next/link';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

interface Salon {
  id: string;
  name: string;
  slug: string;
  subscription_plan?: string;
}

interface Photo {
  id: string;
  salon_id: string;
  storage_path: string;
  file_name: string;
  caption: string | null;
  is_featured: boolean;
  display_order: number;
  uploaded_at: string;
  url?: string;
}

const PHOTO_LIMITS = {
  BASIC: 5,
  PREMIUM: 20,
  FREE: 3,
};

export default function GalleryManagementPage({ params }: PageProps) {
  const { slug } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState('');

  useEffect(() => {
    loadData();
  }, [slug]);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      // Get salon info
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id, name, slug, subscription_plan')
        .eq('slug', slug)
        .maybeSingle();

      if (salonError || !salonData) {
        setError('Salon bulunamadı.');
        setLoading(false);
        return;
      }

      setSalon(salonData);

      // Get photos
      await loadPhotos(salonData.id);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPhotos(salonId: string) {
    const { data: photosData, error: photosError } = await supabase
      .from('salon_photos')
      .select('*')
      .eq('salon_id', salonId)
      .order('display_order', { ascending: true });

    if (photosError) {
      setError('Fotoğraflar yüklenemedi.');
      return;
    }

    // Add public URLs to photos
    const photosWithUrls = (photosData || []).map((photo) => ({
      ...photo,
      url: supabase.storage.from(STORAGE_BUCKET).getPublicUrl(photo.storage_path)
        .data.publicUrl,
    }));

    setPhotos(photosWithUrls);
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/delete-photo/${photoId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Silme başarısız');
      }

      setSuccess('Fotoğraf silindi.');
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme başarısız');
    }
  }

  async function handleSetFeatured(photoId: string) {
    try {
      const response = await fetch(`/api/update-photo/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Güncelleme başarısız');
      }

      setSuccess('Vitrin fotoğrafı güncellendi.');
      if (salon) await loadPhotos(salon.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    }
  }

  async function handleUpdateCaption(photoId: string) {
    try {
      const response = await fetch(`/api/update-photo/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: captionInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Güncelleme başarısız');
      }

      setSuccess('Açıklama güncellendi.');
      setEditingCaption(null);
      setCaptionInput('');
      if (salon) await loadPhotos(salon.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;

    const photo = photos[index];
    const prevPhoto = photos[index - 1];

    try {
      await fetch(`/api/update-photo/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: prevPhoto.display_order }),
      });

      await fetch(`/api/update-photo/${prevPhoto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: photo.display_order }),
      });

      if (salon) await loadPhotos(salon.id);
    } catch (err) {
      setError('Sıralama güncellenemedi.');
    }
  }

  async function handleMoveDown(index: number) {
    if (index === photos.length - 1) return;

    const photo = photos[index];
    const nextPhoto = photos[index + 1];

    try {
      await fetch(`/api/update-photo/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: nextPhoto.display_order }),
      });

      await fetch(`/api/update-photo/${nextPhoto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: photo.display_order }),
      });

      if (salon) await loadPhotos(salon.id);
    } catch (err) {
      setError('Sıralama güncellenemedi.');
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: '#6b7280' }}>Yükleniyor...</div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: '#ef4444' }}>Salon bulunamadı.</div>
      </div>
    );
  }

  const subscriptionPlan = salon.subscription_plan?.toUpperCase() || 'FREE';
  const photoLimit =
    PHOTO_LIMITS[subscriptionPlan as keyof typeof PHOTO_LIMITS] || PHOTO_LIMITS.FREE;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <Link
            href={`/panel/${slug}`}
            style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            ← Panel'e Dön
          </Link>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 36,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 8,
          }}
        >
          Fotoğraf Galerisi
        </h1>

        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          {salon.name} için fotoğraf galerisini yönetin.
        </p>

        <div
          style={{
            marginTop: 12,
            padding: '10px 16px',
            borderRadius: 12,
            background: '#f3f4f6',
            display: 'inline-block',
          }}
        >
          <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
            {photos.length} / {photoLimit} fotoğraf kullanıldı
          </span>
          {subscriptionPlan === 'FREE' && (
            <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>
              (Premium plana yükseltin)
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div
          style={{
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            border: '1px solid #bbf7d0',
            background: '#f0fdf4',
            color: '#15803d',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      {/* Upload Section */}
      {photos.length < photoLimit && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 20,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Fotoğraf Yükle
          </h2>

          <PhotoUpload
            salonId={salon.id}
            onUploadSuccess={() => {
              setSuccess('Fotoğraf yüklendi!');
              loadPhotos(salon.id);
            }}
            onUploadError={(err) => setError(err)}
          />
        </div>
      )}

      {/* Photos Grid */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 20,
          padding: 24,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Yüklenen Fotoğraflar ({photos.length})
        </h2>

        {photos.length === 0 ? (
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
            Henüz fotoğraf yüklenmemiş.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: '200px 1fr auto',
                  gap: 16,
                  background: '#ffffff',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    position: 'relative',
                    paddingTop: '100%',
                    background: '#f3f4f6',
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.file_name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {/* Info */}
                <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {photo.file_name}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      Yüklenme: {new Date(photo.uploaded_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>

                  {/* Caption */}
                  {editingCaption === photo.id ? (
                    <div>
                      <input
                        type="text"
                        value={captionInput}
                        onChange={(e) => setCaptionInput(e.target.value)}
                        placeholder="Fotoğraf açıklaması"
                        style={{
                          width: '100%',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 14,
                          marginBottom: 8,
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleUpdateCaption(photo.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#111827',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => {
                            setEditingCaption(null);
                            setCaptionInput('');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: '#374151',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
                        {photo.caption || 'Açıklama yok'}
                      </div>
                      <button
                        onClick={() => {
                          setEditingCaption(photo.id);
                          setCaptionInput(photo.caption || '');
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Açıklama Düzenle
                      </button>
                    </div>
                  )}

                  {/* Featured Badge */}
                  {photo.is_featured && (
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#fef3c7',
                        color: '#92400e',
                        fontSize: 13,
                        fontWeight: 600,
                        alignSelf: 'flex-start',
                      }}
                    >
                      ⭐ Vitrin Fotoğrafı
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  style={{
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    alignItems: 'flex-end',
                  }}
                >
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      background: index === 0 ? '#f3f4f6' : '#ffffff',
                      color: index === 0 ? '#9ca3af' : '#374151',
                      fontSize: 13,
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      minWidth: 100,
                    }}
                  >
                    ↑ Yukarı
                  </button>

                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === photos.length - 1}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      background: index === photos.length - 1 ? '#f3f4f6' : '#ffffff',
                      color: index === photos.length - 1 ? '#9ca3af' : '#374151',
                      fontSize: 13,
                      cursor: index === photos.length - 1 ? 'not-allowed' : 'pointer',
                      minWidth: 100,
                    }}
                  >
                    ↓ Aşağı
                  </button>

                  {!photo.is_featured && (
                    <button
                      onClick={() => handleSetFeatured(photo.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #fbbf24',
                        background: '#fffbeb',
                        color: '#92400e',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        minWidth: 100,
                      }}
                    >
                      Vitrin Yap
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(photo.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#b91c1c',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minWidth: 100,
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
