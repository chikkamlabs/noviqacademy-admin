'use client';

import { useState } from 'react';
import { addBatchRecording } from '@/lib/mentor/batchclassrecodingsStore';
import { X, Video, Calendar, Link2, Loader2, AlertCircle } from 'lucide-react';

interface AddBatchRecordingProps {
  batchId: string;
  isOpen: boolean;
  onClose: () => void;
  onRecordingAdded: () => void;
}

export default function AddBatchRecording({
  batchId,
  isOpen,
  onClose,
  onRecordingAdded,
}: AddBatchRecordingProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(today);
  const [link, setLink] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!batchId) {
      setErrorMsg('Batch ID is missing.');
      return;
    }
    if (!date) {
      setErrorMsg('Please select a date.');
      return;
    }
    if (!link.trim()) {
      setErrorMsg('Please provide a recording link.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await addBatchRecording({
        batch_id: batchId,
        date,
        link: link.trim(),
      });

      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        // Reset and notify
        setLink('');
        setDate(today);
        onRecordingAdded();
        onClose();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save recording');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-recording-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E5DFD3] bg-[var(--color-soft-orange)]/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-tangerine)]/10 text-[var(--color-tangerine)]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="add-recording-title"
                className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]"
              >
                Add Class Recording
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Provide class date and recording link for this batch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Class Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
              />
            </div>
          </div>

          {/* Recording Link */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Recording Link (URL) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/file/... or https://youtube.com/..."
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
              />
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Enter the Google Drive, Zoom, Vimeo, or YouTube link to the class recording.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5DFD3]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-outline px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[#D5CDBD] hover:bg-[var(--color-soft-cream)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
