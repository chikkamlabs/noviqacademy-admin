'use client';

import { useState } from 'react';
import {
  updateCourseResource,
  CourseResource,
  ResourceType,
} from '@/lib/courseresourcesStore';
import {
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
  Presentation,
  Link2,
  ExternalLink,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Layers,
} from 'lucide-react';

interface OpenResourceProps {
  resource: CourseResource | null;
  courseTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onResourceUpdated: (updatedResource: CourseResource) => void;
}

export default function OpenResource({
  resource,
  courseTitle,
  isOpen,
  onClose,
  onResourceUpdated,
}: OpenResourceProps) {
  if (!isOpen || !resource) return null;

  return (
    <OpenResourceModalInner
      key={resource.id}
      resource={resource}
      courseTitle={courseTitle}
      onClose={onClose}
      onResourceUpdated={onResourceUpdated}
    />
  );
}

function OpenResourceModalInner({
  resource,
  courseTitle,
  onClose,
  onResourceUpdated,
}: {
  resource: CourseResource;
  courseTitle?: string;
  onClose: () => void;
  onResourceUpdated: (updatedResource: CourseResource) => void;
}) {
  const [description, setDescription] = useState<string>(resource.description || '');
  const [relatedUrl, setRelatedUrl] = useState<string>(resource.related_url || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      const result = await updateCourseResource(resource.id, {
        description: description.trim() || null,
        related_url: relatedUrl.trim() || null,
      });

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || 'Failed to update resource.');
        setSaving(false);
        return;
      }

      setSuccessMessage('Resource updated successfully!');
      onResourceUpdated(result.data);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const renderTypeIcon = (t: ResourceType) => {
    switch (t) {
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'pdf':
        return <FileCode className="w-4 h-4 text-red-600" />;
      case 'ppt':
        return <Presentation className="w-4 h-4 text-amber-600" />;
      case 'link':
        return <Link2 className="w-4 h-4 text-purple-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-[var(--color-tangerine)]" />;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A0A]/50 backdrop-blur-xs overflow-y-auto">
      <div className="card w-full max-w-2xl bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] border border-[var(--color-tangerine)]/20 flex items-center justify-center shrink-0">
              {renderTypeIcon(resource.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] line-clamp-1">
                  {resource.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--color-surface)] border border-[#E5DFD3] text-[var(--color-text-secondary)] shrink-0">
                  {resource.type}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                {courseTitle ? `Course: ${courseTitle}` : `Course ID: ${resource.course_id}`}
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

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section: Display All Details (Read-only metadata) */}
          <div className="rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] p-3 sm:p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              Resource Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[var(--color-text-muted)] block">Resource Name:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{resource.name}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Type:</span>
                <span className="font-semibold text-[var(--color-text-primary)] capitalize">{resource.type}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Uploaded By:</span>
                <span className="font-semibold text-[var(--color-text-primary)] capitalize inline-flex items-center gap-1">
                  <User className="w-3 h-3 text-[var(--color-tangerine)]" />
                  {resource.uploaded_by}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Course ID:</span>
                <span className="font-mono font-semibold text-[var(--color-tangerine)]">{resource.course_id}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Created At:</span>
                <span className="text-[var(--color-text-secondary)] inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--color-text-muted)]" />
                  {formatDate(resource.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Last Updated:</span>
                <span className="text-[var(--color-text-secondary)] inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--color-text-muted)]" />
                  {formatDate(resource.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Editable Form for Description & Link */}
          <form onSubmit={handleSave} id="open-resource-form" className="space-y-4">
            {/* Link / Related URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                  Resource Link (Google Drive / External URL)
                </label>
                {relatedUrl && (
                  <a
                    href={relatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-tangerine)] hover:underline"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={relatedUrl}
                onChange={(e) => setRelatedUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none font-mono"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Learners and mentors can open this URL directly from their dashboards.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description, syllabus context, or instructions for this resource..."
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer with Actions */}
        <div className="flex items-center justify-between p-4 border-t border-[#E5DFD3] bg-[var(--color-soft-cream)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-outline px-4 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            type="submit"
            form="open-resource-form"
            disabled={saving}
            className="btn btn-primary inline-flex items-center gap-1.5 px-5 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 anim-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
