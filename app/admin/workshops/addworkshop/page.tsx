'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  createWorkshop,
  uploadWorkshopPreviewImage,
  WorkshopMode,
} from '@/lib/workshopsStore';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Presentation,
  Calendar,
  Link2,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';

export default function AddWorkshopPage() {
  const router = useRouter();

  // All fields in the workshops table
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<boolean>(true);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

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
    setImagePreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Workshop Title is required.');
      return;
    }

    setSubmitting(true);

    let uploadedPreviewUrl: string | null = null;
    if (imageFile) {
      const uploadRes = await uploadWorkshopPreviewImage(imageFile);
      if (uploadRes.error || !uploadRes.publicUrl) {
        setErrorMessage(uploadRes.error?.message || 'Failed to upload workshop preview image.');
        setSubmitting(false);
        return;
      }
      uploadedPreviewUrl = uploadRes.publicUrl;
    }

    const cleanedLearnings = learnings.map((l) => l.trim()).filter(Boolean);

    const result = await createWorkshop({
      title: title.trim(),
      description: description.trim() || null,
      learnings: cleanedLearnings,
      date: date || null,
      time: time.trim() || null,
      mode,
      duration: duration.trim() || null,
      registrations_link: registrationsLink.trim() || null,
      tag: tag.trim() || null,
      preview_image_link: uploadedPreviewUrl,
      status,
      whatsapp_group_link: whatsappGroupLink.trim() || null,
    });

    if (result.error || !result.data) {
      setErrorMessage(result.error?.message || 'Failed to create workshop.');
      setSubmitting(false);
      return;
    }

    router.push('/admin/workshops/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Back & Heading */}
            <div className="flex items-center gap-3 pb-2 border-b border-[#E5DFD3]">
              <Link
                href="/admin/workshops/dashboard"
                className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] border border-[#E5DFD3] transition"
                title="Back to Workshops"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Add New Workshop
                </h1>
                <p className="subheading-text text-xs text-[var(--color-text-muted)]">
                  Enter all workshop details, schedule, learnings, and registration links.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] flex items-start gap-2.5 text-[var(--color-danger)] text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Core Workshop Details */}
              <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
                <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2 flex items-center gap-2">
                  <Presentation className="w-4 h-4 text-[var(--color-tangerine)]" />
                  <span>1. Basic Information</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="form-group md:col-span-2 mb-0">
                    <label htmlFor="workshopTitle" className="form-label mb-1">
                      Title <span className="text-[var(--color-tangerine)]">*</span>
                    </label>
                    <input
                      id="workshopTitle"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Build & Deploy Production AI Agents"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Tag */}
                  <div className="form-group mb-0">
                    <label htmlFor="workshopTag" className="form-label mb-1">
                      Tag
                    </label>
                    <input
                      id="workshopTag"
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="e.g. Live Hands-On, Free"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div className="form-group mb-0">
                    <label htmlFor="workshopStatus" className="form-label mb-1">
                      Status
                    </label>
                    <select
                      id="workshopStatus"
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
                    <label htmlFor="workshopDescription" className="form-label mb-1">
                      Description
                    </label>
                    <textarea
                      id="workshopDescription"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the workshop agenda, target audience, and key takeaways..."
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none resize-y"
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
                    <label htmlFor="workshopDate" className="form-label mb-1">
                      Date
                    </label>
                    <input
                      id="workshopDate"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Time */}
                  <div className="form-group mb-0">
                    <label htmlFor="workshopTime" className="form-label mb-1">
                      Time (IST)
                    </label>
                    <input
                      id="workshopTime"
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="e.g. 7:00 PM - 8:30 PM IST"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Mode */}
                  <div className="form-group mb-0">
                    <label htmlFor="workshopMode" className="form-label mb-1">
                      Mode
                    </label>
                    <select
                      id="workshopMode"
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
                    <label htmlFor="workshopDuration" className="form-label mb-1">
                      Duration
                    </label>
                    <input
                      id="workshopDuration"
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 90 mins / 2 Hours"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Learnings (JSONB) */}
              <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2">
                  3. Learnings (What attendees will learn)
                </h2>

                <div className="space-y-3">
                  <label htmlFor="learningInput" className="form-label mb-1">
                    Learnings
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="learningInput"
                      type="text"
                      value={learningItem}
                      onChange={(e) => setLearningItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLearning();
                        }
                      }}
                      placeholder="e.g. Hands-on deployment architecture walkthrough"
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

              {/* 4. Links & Media */}
              <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
                <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[var(--color-tangerine)]" />
                  <span>4. Links &amp; Preview Image</span>
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  {/* Registrations Link */}
                  <div className="form-group mb-0">
                    <label htmlFor="registrationsLink" className="form-label mb-1">
                      Registrations Link
                    </label>
                    <input
                      id="registrationsLink"
                      type="url"
                      value={registrationsLink}
                      onChange={(e) => setRegistrationsLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* WhatsApp Group Link */}
                  <div className="form-group mb-0">
                    <label htmlFor="whatsappGroupLink" className="form-label mb-1">
                      WhatsApp Group Link
                    </label>
                    <input
                      id="whatsappGroupLink"
                      type="url"
                      value={whatsappGroupLink}
                      onChange={(e) => setWhatsappGroupLink(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                    />
                  </div>

                  {/* Preview Image Upload */}
                  <div className="form-group mb-0">
                    <label className="form-label mb-1.5">
                      Workshop Preview Image
                    </label>
                    <input
                      ref={fileInputRef}
                      id="workshopPreviewImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {imagePreviewUrl ? (
                      <div className="space-y-3">
                        <div className="relative w-full sm:w-96 h-52 rounded-[var(--radius-md)] overflow-hidden border border-[#D5CDBD] bg-[var(--color-soft-cream)]">
                          <Image
                            src={imagePreviewUrl}
                            alt="Workshop preview"
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
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                          {imageFile && (
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              Selected: {imageFile.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
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
                          PNG, JPG, WEBP supported (uploaded on Save Workshop)
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/admin/workshops/dashboard"
                  className="btn btn-outline px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold border border-[#D5CDBD]"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 anim-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Workshop</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
