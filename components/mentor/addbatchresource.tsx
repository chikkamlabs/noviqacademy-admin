'use client';

import { useState, useEffect } from 'react';
import {
  getAvailableCourseResources,
  addBatchResource,
  AvailableCourseResource,
  BatchResourceStatus,
} from '@/lib/mentor/batchresourcesStore';
import {
  X,
  Layers,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  FileCode,
  Image as ImageIcon,
  Presentation,
  Link2,
  ExternalLink,
} from 'lucide-react';

interface AddBatchResourceProps {
  batchId: string;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onResourceAdded: () => void;
}

export default function AddBatchResource({
  batchId,
  courseId,
  isOpen,
  onClose,
  onResourceAdded,
}: AddBatchResourceProps) {
  const [availableResources, setAvailableResources] = useState<AvailableCourseResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [status, setStatus] = useState<BatchResourceStatus>('active');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchAvailable() {
      if (!courseId || !batchId) return;
      setLoading(true);
      setErrorMessage(null);

      const res = await getAvailableCourseResources(courseId, batchId);
      if (!ignore) {
        if (res.error) {
          setErrorMessage(res.error.message);
        } else {
          setAvailableResources(res.data);
          if (res.data.length > 0) {
            setSelectedResourceId(res.data[0].id);
          }
        }
        setLoading(false);
      }
    }

    if (isOpen) {
      fetchAvailable();
    }

    return () => {
      ignore = true;
    };
  }, [isOpen, courseId, batchId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedResourceId) {
      setErrorMessage('Please select a course resource to add.');
      return;
    }

    setSaving(true);

    try {
      const res = await addBatchResource({
        batch_id: batchId,
        resource_id: selectedResourceId,
        status,
      });

      if (res.error) {
        setErrorMessage(res.error.message);
        setSaving(false);
        return;
      }

      onResourceAdded();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add batch resource');
    } finally {
      setSaving(false);
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'doc':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'pdf':
        return <FileCode className="w-3.5 h-3.5 text-red-600" />;
      case 'ppt':
        return <Presentation className="w-3.5 h-3.5 text-amber-600" />;
      case 'link':
        return <Link2 className="w-3.5 h-3.5 text-purple-600" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A0A]/50 backdrop-blur-xs overflow-y-auto">
      <div className="card w-full max-w-lg bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Add Batch Resource
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Select an available course resource to publish for this batch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--color-text-muted)]">
              <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
              <span className="text-xs">Loading available course resources...</span>
            </div>
          ) : availableResources.length === 0 ? (
            <div className="py-8 text-center px-4 bg-[var(--color-soft-cream)] rounded-[var(--radius-md)] border border-[#E5DFD3]">
              <Layers className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                No available course resources
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                All course resources have already been assigned to this batch.
              </p>
            </div>
          ) : (
            <>
              {/* Select Course Resource */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Select Available Course Resource <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto border border-[#D5CDBD] rounded-[var(--radius-md)] p-2 bg-[var(--color-surface)]">
                  {availableResources.map((res) => {
                    const isSelected = selectedResourceId === res.id;
                    return (
                      <div
                        key={res.id}
                        onClick={() => setSelectedResourceId(res.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-[var(--radius-md)] cursor-pointer transition border ${
                          isSelected
                            ? 'bg-[var(--color-primary-subtle)]/50 border-[var(--color-tangerine)] text-[var(--color-text-primary)]'
                            : 'border-transparent hover:bg-[var(--color-soft-cream)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedResource"
                          value={res.id}
                          checked={isSelected}
                          onChange={() => setSelectedResourceId(res.id)}
                          className="mt-1 text-[var(--color-tangerine)] focus:ring-[var(--color-tangerine)]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[var(--color-text-primary)] line-clamp-1">
                              {res.name}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-[var(--color-surface)] border border-[#E5DFD3]">
                              {renderTypeIcon(res.type)}
                              <span>{res.type}</span>
                            </span>
                          </div>
                          {res.description && (
                            <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                              {res.description}
                            </p>
                          )}
                          {res.related_url && (
                            <div className="flex items-center gap-1 text-[11px] text-[var(--color-tangerine)] mt-0.5 truncate">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{res.related_url}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BatchResourceStatus)}
                  className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                >
                  <option value="active">Active (Visible to batch learners)</option>
                  <option value="deactivated">Deactivated (Hidden)</option>
                </select>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5DFD3]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-outline px-4 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || availableResources.length === 0}
              className="btn btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Batch Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
