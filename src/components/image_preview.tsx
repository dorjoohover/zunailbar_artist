"use client";
import { useEffect } from "react";

export function ImagePreview({
  file,
  image,
}: {
  file?: File | null;
  image?: string | null;
}) {
  const objectUrl = file ? URL.createObjectURL(file) : null;
  const src = objectUrl ?? (image ? `/api/file/${image}` : null);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt="preview"
      className="size-full object-cover rounded bg-white overflow-hidden"
    />
  );
}
