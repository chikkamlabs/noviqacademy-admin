'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getWorkshopById,
  updateWorkshop,
  uploadWorkshopPreviewImage,
  Workshop,
  WorkshopMode,
} from '@/lib/workshopsStore';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Presentation,
  Calendar,
  Link2,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';

function isDisplayableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  );
}

function OpenWorkshopContent() {
  const searchParams = useSearchParams();
  const workshopId = searchParams.get('id') || searchParams.get('workshop_id') || '';

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable fields (all columns in workshops table)
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [learningItem, setLearningItem] = useState<string>('');
  const [learnings, setLearnings] = useState<string[]>([]);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [mode, setMode] = useState<WorkshopMode>('online');
  const [duration, setDuration] = useState<string>('');
  const [registrationsLink, setRegistrationsLink] = useState<string>('');
  const [tag, setTag] = useState<string>('');
  const [previewImageLink, setPreviewImageLink] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<boolean>(true);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      e.target.value = '';
      return;
    }

    setErrorMessage(null);
    setImageFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCancelImageChange = () => {
    setImageFile(null);
    setLocalPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadWorkshop() {
      if (!workshopId) {
        if (!ignore) {
          setLoadError('No workshop ID specified in the URL.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const res = await getWorkshopById(workshopId);
        if (!ignore) {
          if (res.error || !res.data) {
            setLoadError(res.error?.message || 'Workshop not found.');
          } else {
            const w = res.data;
            setWorkshop(w);
            setTitle(w.title || '');
            setDescription(w.description || '');
            setLearnings(Array.isArray(w.learnings) ? w.learnings : []);
            setDate(w.date || '');
            setTime(w.time || '');
            setMode(w.mode || 'online');
            setDuration(w.duration || '');
            setRegistrationsLink(w.registrations_link || '');
            setTag(w.tag || '');
            setPreviewImageLink(w.preview_image_link || '');
            setStatus(Boolean(w.status));
            setWhatsappGroupLink(w.whatsapp_group_link || '');
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load workshop.');
          setLoading(false);
        }
      }
    }

    loadWorkshop();

    return () => {
      ignore = true;
    };
  }, [workshopId]);

  const addLearning = () => {
    if (learningItem.trim()) {
      setLearnings((prev) => [...prev, learningItem.trim()]);
      setLearningItem('');
    }
  };

  const handleEditLearning = (index: number, val: string) => {
    setLearnings((prev) => prev.map((item, i) => (i === index ? val : item)));
  };

  const removeLearning = (index: number) => {
    setLearnings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workshop) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Workshop Title is required.');
      return;
    }

    setSaving(true);

    try {
      let nextPreviewImageLink = previewImageLink.trim() || null;

      if (imageFile) {
        const uploadRes = await uploadWorkshopPreviewImage(imageFile);
        if (uploadRes.error || !uploadRes.publicUrl) {
          setErrorMessage(uploadRes.error?.message || 'Failed to upload workshop preview image.');
          setSaving(false);
          return;
        }
        nextPreviewImageLink = uploadRes.publicUrl;
      }

      const cleanedLearnings = learnings.map((l) => l.trim()).filter(Boolean);

      const res = await updateWorkshop(workshop.id, {
        title: title.trim(),
        description: description.trim() || null,
        learnings: cleanedLearnings,
        date: date || null,
        time: time.trim() || null,
        mode,
        duration: duration.trim() || null,
        registrations_link: registrationsLink.trim() || null,
        tag: tag.trim() || null,
        preview_image_link: nextPreviewImageLink,
        status,
        whatsapp_group_link: whatsappGroupLink.trim() || null,
      });

      if (res.error || !res.data) {
        setErrorMessage(res.error?.message || 'Failed to update workshop.');
      } else {
        setWorkshop(res.data);
        setLearnings(res.data.learnings);
        setPreviewImageLink(res.data.preview_image_link || '');
        setImageFile(null);
        setLocalPreviewUrl(null);
        setSuccessMessage('Workshop details saved successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          Loading workshop details...
        </span>
      </div>
    );
  }

  if (loadError || !workshop) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card p-8 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-xl)] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-danger-subtle)] text-[var(--color-danger)] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Workshop Not Found
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loadError || 'The requested workshop could not be found.'}
          </p>
          <div className="pt-2">
            <Link
              href="/admin/workshops/dashboard"
              className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Workshops</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/workshops/dashboard"
            className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] border border-[#D5CDBD] transition"
            title="Back to Workshops"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-tangerine)]">
              Workshop Details
            </span>
            <h1 className="page-title text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              {workshop.title}
            </h1>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
            workshop.status
              ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]/30'
              : 'bg-[var(--color-soft-cream)] text-[var(--color-text-muted)] border border-[#E5DFD3]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              workshop.status ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]'
            }`}
          />
          {workshop.status ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Feedback notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Basic Information */}
        <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2 flex items-center gap-2">
            <Presentation className="w-4 h-4 text-[var(--color-tangerine)]" />
            <span>1. Basic Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="form-group md:col-span-2 mb-0">
              <label htmlFor="editWorkshopTitle" className="form-label mb-1">
                Title <span className="text-[var(--color-tangerine)]">*</span>
              </label>
              <input
                id="editWorkshopTitle"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              />
            </div>

            {/* Tag */}
            <div className="form-group mb-0">
              <label htmlFor="editWorkshopTag" className="form-label mb-1">
                Tag
              </label>
              <input
                id="editWorkshopTag"
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Live Hands-On, Free"
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              />
            </div>

            {/* Status */}
            <div className="form-group mb-0">
              <label htmlFor="editWorkshopStatus" className="form-label mb-1">
                Status
              </label>
              <select
                id="editWorkshopStatus"
                value={status ? 'true' : 'false'}
                onChange={(e) => setStatus(e.target.value === 'true')}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              >
                <option value="true">Active (True)</option>
                <option value="false">Inactive (False)</option>
              </select>
            </div>

            {/* Description */}
            <div className="form-group md:col-span-2 mb-0">
              <label htmlFor="editWorkshopDescription" className="form-label mb-1">
                Description
              </label>
              <textarea
                id="editWorkshopDescription"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none resize-y"
              />
            </div>
          </div>
        </div>

        {/* 2. Schedule & Mode */}
        <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--color-tangerine)]" />
            <span>2. Schedule &amp; Format</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="form-group mb-0">
              <label htmlFor="editWorkshopDate" className="form-label mb-1">
                Date
              </label>
              <input
                id="editWorkshopDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              />
            </div>

            {/* Time */}
            <div className="form-group mb-0">
              <label htmlFor="editWorkshopTime" className="form-label mb-1">
                Time (IST)
              </label>
              <input
                id="editWorkshopTime"
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 7:00 PM - 8:30 PM IST"
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              />
            </div>

            {/* Mode */}
            <div className="form-group mb-0">
              <label htmlFor="editWorkshopMode" className="form-label mb-1">
                Mode
              </label>
              <select
                id="editWorkshopMode"
                value={mode}
                onChange={(e) => setMode(e.target.value as WorkshopMode)}
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {/* Duration */}
            <div className="form-group mb-0">
              <label htmlFor="editWorkshopDuration" className="form-label mb-1">
                Duration
              </label>
              <input
                id="editWorkshopDuration"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 90 mins / 2 Hours"
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Learnings */}
        <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2">
            3. Learnings (What attendees will learn)
          </h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={learningItem}
                onChange={(e) => setLearningItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLearning();
                  }
                }}
                placeholder="Add learning point..."
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
              />
              <button
                type="button"
                onClick={addLearning}
                className="btn btn-outline px-3 py-2 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {learnings.length > 0 && (
              <div className="space-y-2 pt-1">
                {learnings.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-1.5 rounded-[var(--radius-sm)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]"
                  >
                    <span className="text-xs text-[var(--color-tangerine)] font-bold pl-2 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleEditLearning(idx, e.target.value)}
                      className="flex-1 bg-transparent border-0 px-2 py-1 text-xs text-[var(--color-text-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-tangerine)] rounded outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => removeLearning(idx)}
                      className="text-red-500 hover:text-red-700 cursor-pointer p-1.5 shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Links & Preview Image */}
        <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[var(--color-tangerine)]" />
            <span>4. Links &amp; Preview Image</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="form-group mb-0">
              <label htmlFor="editRegistrationsLink" className="form-label mb-1">
                Registrations Link
              </label>
              <input
                id="editRegistrationsLink"
                type="url"
                value={registrationsLink}
                onChange={(e) => setRegistrationsLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="editWhatsappGroupLink" className="form-label mb-1">
                WhatsApp Group Link
              </label>
              <input
                id="editWhatsappGroupLink"
                type="url"
                value={whatsappGroupLink}
                onChange={(e) => setWhatsappGroupLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label mb-1.5">
                Workshop Preview Image
              </label>
              <input
                ref={fileInputRef}
                id="editWorkshopPreviewImage"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {(() => {
                const activeImageUrl = localPreviewUrl || previewImageLink;
                if (isDisplayableImageUrl(activeImageUrl)) {
                  return (
                    <div className="space-y-3">
                      <div className="relative w-full sm:w-96 h-52 rounded-[var(--radius-md)] overflow-hidden border border-[#D5CDBD] bg-[var(--color-soft-cream)]">
                        <Image
                          src={activeImageUrl}
                          alt={title || 'Workshop preview'}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Change Image</span>
                        </button>
                        {imageFile && (
                          <button
                            type="button"
                            onClick={handleCancelImageChange}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Revert Change</span>
                          </button>
                        )}
                        {imageFile && (
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            New file: {imageFile.name} (uploads on Save)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-96 h-40 rounded-[var(--radius-md)] border-2 border-dashed border-[#D5CDBD] hover:border-[var(--color-tangerine)] bg-[var(--color-soft-cream)]/60 flex flex-col items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-tangerine)] transition cursor-pointer"
                  >
                    <ImageIcon className="w-7 h-7" />
                    <span className="text-xs font-semibold">
                      Click to Upload Workshop Image
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      No image uploaded yet
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-[11px] text-[var(--color-text-muted)] border-t border-[#E5DFD3]">
            <span>
              Created:{' '}
              {workshop.created_at
                ? new Date(workshop.created_at).toLocaleString()
                : 'N/A'}
            </span>
            {workshop.updated_at && (
              <span>
                Updated: {new Date(workshop.updated_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin/workshops/dashboard"
            className="btn btn-outline px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] border border-[#D5CDBD]"
          >
            Back to Workshops
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 anim-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OpenWorkshopPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
                <span className="text-sm text-[var(--color-text-muted)]">
                  Loading workshop...
                </span>
              </div>
            }
          >
            <OpenWorkshopContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
