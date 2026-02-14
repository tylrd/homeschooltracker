export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: "missing_file" | "invalid_type" | "file_too_large";
      message: string;
    };

export function validateImageFile(
  file: File | null | undefined,
  options?: { maxBytes?: number },
): ImageValidationResult {
  if (!file || file.size === 0) {
    return {
      ok: false,
      code: "missing_file",
      message: "Please select an image.",
    };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as AcceptedImageType)) {
    return {
      ok: false,
      code: "invalid_type",
      message: "Only JPG, PNG, or WEBP images are supported.",
    };
  }

  const maxBytes = options?.maxBytes ?? MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return {
      ok: false,
      code: "file_too_large",
      message: "Image is too large. Maximum size is 5MB.",
    };
  }

  return { ok: true };
}
