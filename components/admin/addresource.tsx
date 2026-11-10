'use client';

import { useState, useEffect } from 'react';
import {
  createCourseResource,
  CourseResource,
  ResourceType,
  UploaderRole,
} from '@/lib/courseresourcesStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  X,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  HelpCircle,
} from 'lucide-react';

interface AddResourceProps {
  courseId: string;
  courseTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onResourceAdded: (newResource: CourseResource) => void;
}

const RESOURCE_TYPE_OPTIONS: { label: string; value: ResourceType }[] = [
  { label: 'Doc (doc)', value: 'doc' },
  { label: 'PPT (ppt)', value: 'ppt' },
  { label: 'Web (link)', value: 'link' },
  { label: 'Image (image)', value: 'image' },
];

export default function AddResource({
  courseId,
  courseTitle,
  isOpen,
  onClose,
  onResourceAdded,
}: AddResourceProps) {
  const [type, setType] = useState<ResourceType>('doc');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [relatedUrl, setRelatedUrl] = useState<string>('');
  const [uploadedByRole, setUploadedByRole] = useState<UploaderRole>('admin');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect which role is logged in (admin vs mentor)
  useEffect(() => {
    async function detectRole() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile?.role === 'mentor') {
            setUploadedByRole('mentor');
          } else {
            setUploadedByRole('admin');
          }
        }
      } catch {
        setUploadedByRole('admin');
      }
    }
    if (isOpen) {
      detectRole();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Please enter a name for the resource.');
      return;
    }

    if (!courseId) {
      setErrorMessage('Course ID is missing. Cannot add resource.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await createCourseResource({
        course_id: courseId,
        name: cleanName,
        type,
        description: description.trim() || null,
        related_url: relatedUrl.trim() || null,
        uploaded_by: uploadedByRole,
        is_preview: false,
      });

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || 'Failed to add course resource.');
        setSubmitting(false);
        return;
      }

      // Reset form
      setName('');
      setDescription('');
      setRelatedUrl('');
      setType('doc');
      setSubmitting(false);
      onResourceAdded(result.data);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/50 backdrop-blur-xs overflow-y-auto">
      <div className="card w-full max-w-lg bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Add Course Resource
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                {courseTitle ? `For ${courseTitle}` : 'Attach learning materials & drive links'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Resource Type */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Resource Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ResourceType)}
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            >
              {RESOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Resource Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Python Basics Cheat Sheet & Notes"
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            />
          </div>

          {/* Related URL (Drive link) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--color-text-primary)]">
                Related URL (Drive link / URL)
              </label>
              <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                Drive link
              </span>
            </div>
            <input
              type="url"
              value={relatedUrl}
              onChange={(e) => setRelatedUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none font-mono"
            />
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Provide Google Drive or external URL. Clicking will open this in a new browser tab.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about what this resource contains..."
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none resize-none"
            />
          </div>

          {/* Auto-filled Metadata Info box */}
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] text-xs space-y-1">
            <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
              <span>Uploaded By (auto-assigned):</span>
              <span className="font-semibold text-[var(--color-text-primary)] capitalize">
                {uploadedByRole}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
              <span>Course ID (auto-selected):</span>
              <span className="font-mono font-semibold text-[var(--color-tangerine)] truncate max-w-[200px]">
                {courseId}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5DFD3]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-outline px-4 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
