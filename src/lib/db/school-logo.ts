import { createAdminClient } from '@/lib/supabase/admin';
import {
  ALLOWED_SCHOOL_LOGO_TYPES,
  LOGO_BUCKET,
  MAX_SCHOOL_LOGO_BYTES,
  validateSchoolLogoFile,
} from '@/lib/school/referentials/logo';

export { MAX_SCHOOL_LOGO_BYTES, validateSchoolLogoFile };

export async function uploadSchoolLogo(input: {
  schoolId: string;
  file: File;
}): Promise<string> {
  const validationError = validateSchoolLogoFile(input.file);
  if (validationError) {
    throw new Error(validationError);
  }

  const ext =
    input.file.type === 'image/jpeg'
      ? 'jpg'
      : input.file.type === 'image/png'
        ? 'png'
        : input.file.type === 'image/webp'
          ? 'webp'
          : 'svg';
  const path = `${input.schoolId}/logo.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, {
      contentType: input.file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error('Téléversement impossible. Réessayez plus tard.');
  }

  const { data: publicUrl } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const logoUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await admin
    .from('schools')
    .update({ logo_url: logoUrl })
    .eq('id', input.schoolId);
  if (updateError) throw new Error(updateError.message);

  return logoUrl;
}
