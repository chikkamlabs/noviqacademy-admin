'use client';

import { useState, useEffect } from 'react';
import {
  getAvailableCourseExamsForBatch,
  addBatchExam,
  AvailableCourseExam,
} from '@/lib/mentor/batchexamsStore';
import {
  X,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  HelpCircle,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';

interface AddBatchExamProps {
  batchId: string;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onExamAdded: () => void;
}

export default function AddBatchExam({
  batchId,
  courseId,
  isOpen,
  onClose,
  onExamAdded,
}: AddBatchExamProps) {
  const [availableExams, setAvailableExams] = useState<AvailableCourseExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [status, setStatus] = useState<boolean>(true);
  const [conduct, setConduct] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [duration, setDuration] = useState<number | ''>(60);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchAvailable() {
      if (!courseId || !batchId) return;
      setLoading(true);
      setErrorMessage(null);

      const res = await getAvailableCourseExamsForBatch(batchId, courseId);
      if (!ignore) {
        if (res.error) {
          setErrorMessage(res.error.message);
        } else if (res.data) {
          setAvailableExams(res.data);
          if (res.data.length > 0) {
            setSelectedExamId(res.data[0].id);
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
    if (!selectedExamId) {
      setErrorMessage('Please select an exam to assign to this batch.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const parsedDuration = typeof duration === 'number' ? duration : parseInt(String(duration), 10) || 0;

      const res = await addBatchExam({
        batch_id: batchId,
        exam_id: selectedExamId,
        status,
        conduct,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        duration: parsedDuration,
      });

      if (res.error) {
        setErrorMessage(res.error.message);
        setSaving(false);
      } else {
        onExamAdded();
        onClose();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add exam to batch');
      setSaving(false);
    }
  };

  const selectedExam = availableExams.find((e) => e.id === selectedExamId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A0A]/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-xl overflow-hidden my-6 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                Add Exam to Batch
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Assign a curriculum course exam and set its active visibility status.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[#E5DFD3]/40 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
              <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
              <span className="text-xs">Loading available course exams...</span>
            </div>
          ) : availableExams.length === 0 ? (
            <div className="py-8 text-center rounded-[var(--radius-md)] border border-dashed border-[#D5CDBD] bg-[var(--color-soft-cream)]/30 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                All Available Exams Are Assigned
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                All exams registered for this course have already been linked to this batch.
              </p>
            </div>
          ) : (
            <>
              {/* Select Exam Dropdown */}
              <div>
                <label
                  htmlFor="select_exam"
                  className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
                >
                  Select Course Exam <span className="text-red-500">*</span>
                </label>
                <select
                  id="select_exam"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  required
                  className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                >
                  {availableExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.total_q} {exam.total_q === 1 ? 'question' : 'questions'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Exam Information Snippet */}
              {selectedExam && (
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)]/60 border border-[#E5DFD3] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {selectedExam.title}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--color-tangerine)] bg-[var(--color-primary-subtle)] px-2 py-0.5 rounded-[var(--radius-sm)]">
                      <HelpCircle className="w-3 h-3" />
                      {selectedExam.total_q} questions
                    </span>
                  </div>
                  {selectedExam.description && (
                    <p className="text-[var(--color-text-muted)] line-clamp-2">
                      {selectedExam.description}
                    </p>
                  )}
                </div>
              )}

              {/* Status (Boolean) */}
              <div>
                <label
                  htmlFor="exam_status"
                  className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
                >
                  Status (batch_exams.status) <span className="text-red-500">*</span>
                </label>
                <select
                  id="exam_status"
                  value={status ? 'active' : 'inactive'}
                  onChange={(e) => setStatus(e.target.value === 'active')}
                  className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                >
                  <option value="active">Active (Visible to batch learners)</option>
                  <option value="inactive">Inactive (Hidden / Draft for this batch)</option>
                </select>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Active exams can be conducted and taken by learners assigned to this batch.
                </p>
              </div>

              {/* Start Time and End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="exam_start_time"
                    className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
                  >
                    Start Time (start_time)
                  </label>
                  <input
                    id="exam_start_time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exam_end_time"
                    className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
                  >
                    End Time (end_time)
                  </label>
                  <input
                    id="exam_end_time"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                  />
                </div>
              </div>

              {/* Duration and Conduct */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="exam_duration"
                    className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
                  >
                    Duration in Minutes (duration)
                  </label>
                  <div className="relative">
                    <input
                      id="exam_duration"
                      type="number"
                      min="0"
                      value={duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDuration(val === '' ? '' : parseInt(val, 10));
                      }}
                      placeholder="e.g. 60"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] pointer-events-none">
                      mins
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="exam_conduct"
                    className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
                  >
                    Conduct Exam (default false)
                  </label>
                  <select
                    id="exam_conduct"
                    value={conduct ? 'true' : 'false'}
                    onChange={(e) => setConduct(e.target.value === 'true')}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
                  >
                    <option value="false">No (conduct = false)</option>
                    <option value="true">Yes (conduct = true)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] border border-[#D5CDBD] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            {availableExams.length > 0 && (
              <button
                type="submit"
                disabled={saving || !selectedExamId}
                className="btn btn-primary px-5 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 anim-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Batch Exam</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
