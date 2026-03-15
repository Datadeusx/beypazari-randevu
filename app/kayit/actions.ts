'use server';

import { createClient } from '@/lib/supabase/server';
import { createTrialSubscription } from '@/lib/subscription/trial';

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function registerSalon(formData: {
  salonName: string;
  phone: string;
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  error?: string;
  slug?: string;
}> {
  const { salonName, phone, email, password } = formData;

  const trimmedSalonName = salonName.trim();
  const trimmedPhone = phone.trim();
  const trimmedEmail = email.trim();

  if (!trimmedSalonName || !trimmedPhone || !trimmedEmail || !password) {
    return { success: false, error: 'Lütfen tüm alanları doldurun.' };
  }

  let baseSlug = toSlug(trimmedSalonName);

  if (!baseSlug) {
    return { success: false, error: 'Geçerli bir salon adı girin.' };
  }

  const supabase = await createClient();

  // Check for existing slugs
  const { data: existingSlugs, error: slugError } = await supabase
    .from('salons')
    .select('slug')
    .like('slug', `${baseSlug}%`);

  if (slugError) {
    return { success: false, error: 'Slug kontrol hatası: ' + slugError.message };
  }

  let finalSlug = baseSlug;

  if (existingSlugs && existingSlugs.length > 0) {
    const usedSlugs = new Set(existingSlugs.map((item) => item.slug));

    if (usedSlugs.has(baseSlug)) {
      let counter = 2;
      while (usedSlugs.has(`${baseSlug}-${counter}`)) {
        counter += 1;
      }
      finalSlug = `${baseSlug}-${counter}`;
    }
  }

  // Create user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
  });

  if (authError) {
    return { success: false, error: 'Kayıt hatası: ' + authError.message };
  }

  const user = authData.user;

  if (!user) {
    return { success: false, error: 'Kullanıcı oluşturulamadı.' };
  }

  // Create salon
  const { data: salonData, error: salonError } = await supabase
    .from('salons')
    .insert({
      name: trimmedSalonName,
      slug: finalSlug,
      phone: trimmedPhone,
      user_id: user.id,
    })
    .select('id')
    .single();

  if (salonError || !salonData) {
    return { success: false, error: 'Salon oluşturma hatası: ' + salonError?.message };
  }

  // Create trial subscription
  const subscriptionResult = await createTrialSubscription(salonData.id);

  if (!subscriptionResult.success) {
    // Salon was created but subscription failed
    // We should still let them proceed, but log this
    console.error('Trial subscription creation failed:', subscriptionResult.error);
    // Don't fail the registration, just proceed without subscription
    // Admin can manually add subscription later
  }

  return {
    success: true,
    slug: finalSlug,
  };
}
