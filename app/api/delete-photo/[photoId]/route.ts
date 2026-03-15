import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STORAGE_BUCKET } from '@/lib/storage/setup';

type RouteContext = {
  params: Promise<{
    photoId: string;
  }>;
};

export async function DELETE(
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

    // Get photo record
    const { data: photo, error: photoError } = await supabase
      .from('salon_photos')
      .select('id, salon_id, storage_path')
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
        { error: 'Bu fotoğrafı silme yetkiniz yok.' },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database deletion even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('salon_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      return NextResponse.json(
        { error: 'Veritabanından silinemedi: ' + dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fotoğraf başarıyla silindi.',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu.' },
      { status: 500 }
    );
  }
}
