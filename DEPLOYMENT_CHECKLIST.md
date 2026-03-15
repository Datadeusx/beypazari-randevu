# Photo Gallery System - Deployment Checklist

## Pre-Deployment Setup

### 1. Database Migration
- [ ] Run `supabase/migrations/003_gallery_system.sql` in Supabase SQL Editor
- [ ] Verify `salon_photos` table was created
- [ ] Verify indexes were created
- [ ] Verify RLS policies are active

### 2. Storage Bucket Setup
- [ ] Run `supabase/SETUP_STORAGE.sql` in Supabase SQL Editor
- [ ] Verify bucket 'salon-galleries' exists
- [ ] Verify bucket is set to public
- [ ] Verify all 4 storage policies were created
- [ ] Test bucket access in Supabase Storage dashboard

### 3. Add Subscription Plan Column (if not exists)
If your `salons` table doesn't have a `subscription_plan` column, add it:

```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'FREE';
```

### 4. Update Public Salon Page
Add gallery section to `app/salon/[slug]/page.tsx`:

```typescript
import SalonGallerySection from '@/components/SalonGallerySection';

// Add this component before the booking form section:
{salon && (
  <SalonGallerySection salonId={salon.id} />
)}
```

### 5. Add Navigation Link
Add gallery link to salon panel navigation:

```typescript
<Link
  href={`/panel/${slug}/galeri`}
  style={{
    // your styling
  }}
>
  Fotoğraf Galerisi
</Link>
```

## Testing Checklist

### Database & Storage
- [ ] Database migration applied successfully
- [ ] Storage bucket created and public
- [ ] Storage policies allow public read
- [ ] Storage policies restrict write to owners

### Admin Panel (/panel/[slug]/galeri)
- [ ] Page loads without errors
- [ ] Can access as salon owner
- [ ] Cannot access as different user
- [ ] Upload button displays
- [ ] Drag-and-drop zone works
- [ ] File picker opens
- [ ] Multiple file selection works

### Photo Upload
- [ ] Can upload JPEG files
- [ ] Can upload PNG files
- [ ] Can upload WebP files
- [ ] Cannot upload other file types (PDF, GIF, etc.)
- [ ] Files over 5MB are rejected
- [ ] Upload progress shows
- [ ] Success message displays
- [ ] Photo appears in list after upload

### Photo Management
- [ ] Uploaded photos display in grid
- [ ] Thumbnails load correctly
- [ ] Can add/edit caption
- [ ] Can mark photo as featured
- [ ] Only one photo can be featured at a time
- [ ] Can reorder photos with up/down buttons
- [ ] Can delete photos
- [ ] Confirmation dialog shows before delete
- [ ] Photo count updates after operations

### Subscription Limits
- [ ] FREE plan limited to 3 photos
- [ ] BASIC plan limited to 5 photos
- [ ] PREMIUM plan limited to 20 photos
- [ ] Upload blocked when limit reached
- [ ] Error message shows correct limit
- [ ] Upload works when under limit

### Public Display (/salon/[slug])
- [ ] Gallery section shows when photos exist
- [ ] Gallery section hidden when no photos
- [ ] Featured photo displays in hero section
- [ ] Gallery grid displays remaining photos
- [ ] Grid is responsive (4 columns on desktop)
- [ ] Photos load with proper optimization
- [ ] Captions display when present

### Lightbox
- [ ] Clicking photo opens lightbox
- [ ] Full-size image displays correctly
- [ ] Caption displays when present
- [ ] Close button (X) works
- [ ] Escape key closes lightbox
- [ ] Previous button works (if multiple photos)
- [ ] Next button works (if multiple photos)
- [ ] Arrow left key navigates to previous
- [ ] Arrow right key navigates to next
- [ ] Photo counter shows (X / Y)
- [ ] Click outside closes lightbox

### Security
- [ ] Unauthenticated users cannot upload
- [ ] Unauthenticated users cannot delete
- [ ] Salon owners can only manage their photos
- [ ] Salon A cannot access Salon B's photos
- [ ] Public users can view all photos
- [ ] RLS policies prevent unauthorized access

### Performance
- [ ] Images lazy load in grid
- [ ] Thumbnails load quickly
- [ ] Full images load without delay
- [ ] Page loads in under 3 seconds
- [ ] No layout shift when images load
- [ ] Mobile performance acceptable

### Mobile Responsiveness
- [ ] Gallery grid adapts to mobile (2 columns)
- [ ] Upload zone works on mobile
- [ ] File picker accessible on mobile
- [ ] Lightbox works on touch devices
- [ ] Swipe gestures work in lightbox
- [ ] Admin panel usable on mobile
- [ ] All buttons tap-able on mobile

### Error Handling
- [ ] Network errors show user-friendly message
- [ ] File validation errors clear
- [ ] Upload failures can be retried
- [ ] Missing permissions show error
- [ ] Database errors handled gracefully
- [ ] Storage errors handled gracefully

## Post-Deployment

### 1. Monitor
- [ ] Check Supabase logs for errors
- [ ] Monitor storage usage
- [ ] Check for failed uploads
- [ ] Review error rates

### 2. User Training
- [ ] Create salon owner documentation
- [ ] Provide example photos
- [ ] Show how to upload
- [ ] Show how to manage photos
- [ ] Explain subscription limits

### 3. Analytics (Optional)
- [ ] Track gallery views
- [ ] Monitor photo upload rate
- [ ] Track lightbox interactions
- [ ] Measure page performance

## Rollback Plan

If issues occur:

### 1. Disable Gallery Feature
Comment out `SalonGallerySection` component in salon page:

```typescript
{/* Temporarily disabled
{salon && (
  <SalonGallerySection salonId={salon.id} />
)}
*/}
```

### 2. Revert Database Changes
```sql
-- Drop table if needed
DROP TABLE IF EXISTS salon_photos CASCADE;

-- Drop storage policies
DROP POLICY IF EXISTS "Public can view salon gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Salon owners can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon owners can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon owners can update photos" ON storage.objects;

-- Delete bucket
DELETE FROM storage.buckets WHERE id = 'salon-galleries';
```

### 3. Remove API Routes
Delete or rename these directories:
- `app/api/upload-photo/`
- `app/api/delete-photo/`
- `app/api/update-photo/`

## Support Resources

### Documentation
- `GALLERY_SYSTEM_README.md` - Complete system documentation
- `supabase/migrations/003_gallery_system.sql` - Database schema
- `supabase/SETUP_STORAGE.sql` - Storage setup commands

### Key Files
- Database: `supabase/migrations/003_gallery_system.sql`
- Storage Config: `lib/storage/setup.ts`
- Image Utils: `lib/storage/image-utils.ts`
- Upload API: `app/api/upload-photo/route.ts`
- Delete API: `app/api/delete-photo/[photoId]/route.ts`
- Update API: `app/api/update-photo/[photoId]/route.ts`
- Upload Component: `components/PhotoUpload.tsx`
- Gallery Component: `components/GalleryGrid.tsx`
- Gallery Section: `components/SalonGallerySection.tsx`
- Admin Page: `app/panel/[slug]/galeri/page.tsx`

### Common Issues

**Issue:** Photos not uploading
- Check Supabase project URL and anon key
- Verify storage bucket exists
- Check storage policies
- Review browser console for errors

**Issue:** Permission denied
- Verify user is authenticated
- Check user owns the salon
- Review RLS policies
- Check storage policies

**Issue:** Photos not displaying
- Verify public read access
- Check storage bucket is public
- Review public URL generation
- Check image paths in database

## Success Criteria

System is ready for production when:
- [ ] All testing checklist items pass
- [ ] No console errors in browser
- [ ] No errors in Supabase logs
- [ ] Performance meets requirements
- [ ] Mobile experience is smooth
- [ ] Security tests pass
- [ ] Documentation is complete
- [ ] Team is trained

## Notes

- Photo limits can be adjusted in `app/api/upload-photo/route.ts`
- Storage bucket settings can be modified in Supabase dashboard
- RLS policies can be reviewed in Supabase dashboard
- All images are stored permanently until deleted
- Delete operation removes both storage file and database record
- Featured photos are auto-selected (first becomes featured if none set)

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** 1.0.0
**Status:** Ready for Production
