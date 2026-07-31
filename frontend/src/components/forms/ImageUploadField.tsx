import { ImagePlus, Trash2, UploadCloud, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import { StorageValidationError, validateImageFile } from '../../services/storage.service';

interface ImageUploadFieldProps {
  label: string;
  currentImageUrl: string | null;
  placeholderLabel: string;
  imageAlt: string;
  selectedFile: File | null;
  removeRequested: boolean;
  isUploading?: boolean;
  disabled?: boolean;
  error?: string | null;
  variant?: 'avatar' | 'logo';
  onFileChange: (file: File | null) => void;
  onRemoveChange: (remove: boolean) => void;
}

export function ImageUploadField({
  label,
  currentImageUrl,
  placeholderLabel,
  imageAlt,
  selectedFile,
  removeRequested,
  isUploading = false,
  disabled = false,
  error,
  variant = 'avatar',
  onFileChange,
  onRemoveChange,
}: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const { formatFileSize } = useFormatters();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const imageUrl = previewUrl ?? (removeRequested ? null : currentImageUrl);
  const hasImage = Boolean(imageUrl);
  const mediaClass =
    variant === 'logo'
      ? 'h-24 w-24 rounded-lg border border-zinc-200 bg-white object-contain p-2'
      : 'h-24 w-24 rounded-lg object-cover';

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleFileChange = (file: File | null) => {
    setClientError(null);

    if (!file) {
      onFileChange(null);
      return;
    }

    try {
      validateImageFile(file);
      onFileChange(file);
      onRemoveChange(false);
    } catch (validationError) {
      onFileChange(null);
      resetInput();
      setClientError(
        validationError instanceof StorageValidationError
          ? translateApiError(validationError, t, 'common.invalidImage')
          : t('common.invalidImage'),
      );
    }
  };

  const handleRemove = () => {
    setClientError(null);
    onFileChange(null);
    onRemoveChange(true);
    resetInput();
  };

  const handleClearSelection = () => {
    setClientError(null);
    onFileChange(null);
    onRemoveChange(false);
    resetInput();
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {hasImage ? (
          <img
            src={imageUrl ?? ''}
            alt={imageAlt}
            width={96}
            height={96}
            className={mediaClass}
            loading="lazy"
          />
        ) : (
          <span
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xl font-black text-zinc-500"
            aria-label={placeholderLabel}
            role="img"
          >
            {variant === 'logo' ? (
              <ImagePlus className="h-8 w-8" aria-hidden="true" />
            ) : (
              placeholderLabel
            )}
          </span>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-black text-zinc-800">{label}</p>
            <p className="mt-1 text-xs font-semibold text-zinc-500">
              {t('imageUpload.requirements')}
            </p>
          </div>

          {selectedFile ? (
            <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
              <p className="truncate font-bold">{selectedFile.name}</p>
              <p className="text-xs font-semibold text-zinc-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : null}

          {isUploading ? (
            <div className="space-y-2" role="status" aria-live="polite">
              <p className="text-xs font-black uppercase text-united-red">
                {t('imageUpload.inProgress')}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-red-100">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-united-red" />
              </div>
            </div>
          ) : null}

          {removeRequested ? (
            <p className="text-sm font-semibold text-amber-700">{t('imageUpload.willRemove')}</p>
          ) : null}

          {clientError || error ? (
            <p className="text-sm font-semibold text-red-700">{clientError ?? error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={disabled || isUploading}
              aria-label={t('imageUpload.selectAria', { label })}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-zinc-700 hover:border-united-red hover:text-united-red disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
              disabled={disabled || isUploading}
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              {currentImageUrl || selectedFile ? t('imageUpload.replace') : t('imageUpload.add')}
            </button>

            {selectedFile ? (
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                {t('imageUpload.cancelFile')}
              </button>
            ) : null}

            {currentImageUrl && !removeRequested ? (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                disabled={disabled || isUploading}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('common.delete')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
