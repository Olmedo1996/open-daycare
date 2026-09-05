'use client';

import { useState, useRef, useCallback } from 'react';
import { PlusIcon } from '@/components/shared/icons';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif';

export type ExistingPhoto = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  position: number;
};

interface PhotoUploadProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  existingPhotos?: ExistingPhoto[];
  onRemoveExisting?: (id: string) => void;
  disabled?: boolean;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  existingPhotos = [],
  onRemoveExisting,
  disabled = false,
}: PhotoUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPhotos = existingPhotos.length + photos.length;
  const canAddMore = totalPhotos < maxPhotos;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" no es un formato permitido (jpg, png, webp, gif)`;
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `"${file.name}" pesa ${sizeMB}MB (máximo 3MB)`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      setError(null);
      const newFiles = Array.from(files);
      const errors: string[] = [];

      const validFiles: File[] = [];
      for (const file of newFiles) {
        if (existingPhotos.length + photos.length + validFiles.length >= maxPhotos) {
          break;
        }
        const err = validateFile(file);
        if (err) {
          errors.push(err);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        setError(errors.join('. '));
      }

      if (validFiles.length > 0) {
        onPhotosChange([...photos, ...validFiles]);
      }
    },
    [photos, existingPhotos.length, maxPhotos, onPhotosChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeNewPhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && canAddMore) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {/* Existing photos */}
        {existingPhotos.map((photo) => (
          <div key={photo.id} className="relative h-[96px] w-[96px]">
            <img
              src={photo.url}
              alt=""
              className="h-full w-full rounded-[14px] object-cover"
            />
            {onRemoveExisting && (
              <button
                type="button"
                onClick={() => onRemoveExisting(photo.id)}
                disabled={disabled}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#D9583C] text-[14px] font-bold text-white shadow-md hover:bg-[#C44A2E] disabled:opacity-50"
              >
                &times;
              </button>
            )}
          </div>
        ))}

        {/* New photos (preview) */}
        {photos.map((file, index) => (
          <div key={`new-${index}`} className="relative h-[96px] w-[96px]">
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="h-full w-full rounded-[14px] object-cover"
            />
            <button
              type="button"
              onClick={() => removeNewPhoto(index)}
              disabled={disabled}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#D9583C] text-[14px] font-bold text-white shadow-md hover:bg-[#C44A2E] disabled:opacity-50"
            >
              &times;
            </button>
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className="flex h-[96px] w-[96px] flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290] transition-colors hover:border-[#C5503A] hover:text-[#C5503A] disabled:opacity-50"
          >
            <PlusIcon width={22} height={22} style={{ color: 'currentColor' }} />
            <span className="text-[12px]">Agregar</span>
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Counter */}
      <p className="mt-2 text-[12px] text-[#94887B]">
        {totalPhotos}/{maxPhotos} fotos
      </p>

      {/* Error */}
      {error && (
        <p className="mt-1 text-[13px] font-medium text-[#D9583C]">{error}</p>
      )}
    </div>
  );
}
