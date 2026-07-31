import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  tone?: 'danger' | 'default';
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isSubmitting = false,
  tone = 'danger',
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const confirmClassName =
    tone === 'danger'
      ? 'bg-red-700 text-white hover:bg-red-800'
      : 'bg-united-red text-white hover:bg-red-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4">
      <section className="w-full max-w-md rounded-lg bg-white p-5 shadow-subtle">
        <h2 className="text-xl font-black text-zinc-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{message}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:bg-zinc-300 ${confirmClassName}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.processing') : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
