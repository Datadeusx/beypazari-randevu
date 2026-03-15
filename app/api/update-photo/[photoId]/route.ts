import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{
    photoId: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { photoId } = await context.params;
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

    // Parse request body
    const body = await request.json();
    const { caption, is_featured, display_order } = body;

    // Get photo record
    const { data: photo, error: photoError } = await supabase
      .from('salon_photos')
      .select('id, salon_id')
      .eq('id', photoId)
      .maybeSingle();

    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'Fotoğraf bulunamadı.' },
        { status: 404 }
      );
    }

    // Verify user owns this salon
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('id, user_id')
      .eq('id', photo.salon_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: 'Bu fotoğrafı güncelleme yetkiniz yok.' },
        { status: 403 }
      );
    }

    // If setting as featured, unset other featured photos
    if (is_featured === true) {
      await supabase
        .from('salon_photos')
        .update({ is_featured: false })
        .eq('salon_id', photo.salon_id)
        .eq('is_featured', true)
        .neq('id', photoId);
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (caption !== undefined) updates.caption = caption;
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (display_order !== undefined) updates.display_order = display_order;

    // Update photo
    const { data: updatedPhoto, error: updateError } = await supabase
      .from('salon_photos')
      .update(updates)
      .eq('id', photoId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Fotoğraf güncellenemedi: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu.' },
      { status: 500 }
    );
  }
}
