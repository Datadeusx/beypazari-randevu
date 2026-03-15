import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  STORAGE_BUCKET,
  validateImageFile,
  generateStoragePath,
} from '@/lib/storage/setup';

// Subscription limits for photo uploads
const PHOTO_LIMITS = {
  BASIC: 5,
  PREMIUM: 20,
  FREE: 3, // Default for salons without subscription
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor.' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const salonId = formData.get('salon_id') as string | null;
    const caption = formData.get('caption') as string | null;
    const isFeatured = formData.get('is_featured') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı.' },
        { status: 400 }
      );
    }

    if (!salonId) {
      return NextResponse.json(
        { error: 'Salon ID gerekli.' },
        { status: 400 }
      );
    }

    // Verify user owns this salon
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('id, user_id, subscription_plan')
      .eq('id', salonId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: 'Salon bulunamadı veya erişim yetkiniz yok.' },
        { status: 403 }
      );
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check photo count limit based on subscription plan
    const { count: photoCount, error: countError } = await supabase
      .from('salon_photos')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salonId);

    if (countError) {
      return NextResponse.json(
        { error: 'Fotoğraf sayısı kontrol edilemedi.' },
        { status: 500 }
      );
    }

    // Determine photo limit based on subscription plan
    const subscriptionPlan = salon.subscription_plan?.toUpperCase() || 'FREE';
    const photoLimit =
      PHOTO_LIMITS[subscriptionPlan as keyof typeof PHOTO_LIMITS] ||
      PHOTO_LIMITS.FREE;

    if (photoCount !== null && photoCount >= photoLimit) {
      return NextResponse.json(
        {
          error: `Fotoğraf limitine ulaştınız. ${subscriptionPlan} planında maksimum ${photoLimit} fotoğraf yükleyebilirsiniz. Premium plana yükseltmek için bizimle iletişime geçin.`,
        },
        { status: 403 }
      );
    }

    // Generate unique storage path
    const storagePath = generateStoragePath(salonId, file.name);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Fotoğraf yüklenemedi: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    // Get next display order
    const { data: lastPhoto } = await supabase
      .from('salon_photos')
      .select('display_order')
      .eq('salon_id', salonId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastPhoto?.display_order || 0) + 1;

    // If this is featured, unset other featured photos
    if (isFeatured) {
      await supabase
        .from('salon_photos')
        .update({ is_featured: false })
        .eq('salon_id', salonId)
        .eq('is_featured', true);
    }

    // Create database record
    const { data: photoRecord, error: dbError } = await supabase
      .from('salon_photos')
      .insert({
        salon_id: salonId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: nextOrder,
        caption: caption || null,
        is_featured: isFeatured,
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);

      return NextResponse.json(
        { error: 'Veritabanı kaydı oluşturulamadı: ' + dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: {
        ...photoRecord,
        url: urlData.publicUrl,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu.' },
      { status: 500 }
    );
  }
}
