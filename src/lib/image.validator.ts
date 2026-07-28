// src/lib/imageValidation.ts
export const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] as const;
export const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

export const ACCEPT_ATTR = Array.from(ALLOWED_MIME).join(',');

export const MAX_IMAGE_MB = 20;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

function formatBytes(b: number) {
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateImageFile(file: File) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const okByExt = ALLOWED_EXT.includes(ext as any);
  const okByType = ALLOWED_MIME.has(file.type);

  if (!okByExt || !okByType) {
    return {
      ok: false as const,
      message:
        `Тохирохгүй зураг. Зөвшөөрөгдөх өргөтгөл: ${ALLOWED_EXT.join(', ')}. ` +
        `Ирсэн файл: “${file.name}” (${file.type || 'unknown type'}).`,
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false as const,
      message:
        `Файлын хэмжээ хэтэрлээ: ${formatBytes(file.size)}. ` +
        `Дээд хэмжээ: ${MAX_IMAGE_MB} MB.`,
    };
  }

  return { ok: true as const };
}
