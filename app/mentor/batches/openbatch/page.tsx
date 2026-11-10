'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MentorHeader from '@/components/mentor/header';
import MentorSidebar from '@/components/mentor/sidebar';
import AddBatchResource from '@/components/mentor/addbatchresource';
import AddBatchExam from '@/components/mentor/addbatchexam';
import {
  getMentorBatchById,
  updateBatchLiveLink,
  MentorBatch,
} from '@/lib/mentor/batchmanagementStore';
import {
  getBatchResources,
  deleteBatchResource,
  updateBatchResourceStatus,
  BatchResourceItem,
  BatchResourceStatus,
} from '@/lib/mentor/batchresourcesStore';
import {
  getBatchExams,
  getBatchExamsCount,
  deleteBatchExam,
  updateBatchExamStatus,
  updateBatchExamConduct,
  BatchExamItem,
} from '@/lib/mentor/batchexamsStore';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  GraduationCap,
  Globe,
  Video,
  FileText,
  FileCode,
  Image as ImageIcon,
  Presentation,
  Link2,
  ExternalLink,
  Plus,
  Save,
  Loader2,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
  ClipboardList,
} from 'lucide-react';

function MentorOpenBatchContent({ mentorName }: { mentorName: string }) {
  const searchParams = useSearchParams();
  const batchIdParam = searchParams.get('id') || searchParams.get('batch_id') || '';

  const [batch, setBatch] = useState<MentorBatch | null>(null);
  const [liveLink, setLiveLink] = useState<string>('');
  const [resources, setResources] = useState<BatchResourceItem[]>([]);
  const [batchExams, setBatchExams] = useState<BatchExamItem[]>([]);
  const [batchExamsCount, setBatchExamsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingLiveLink, setSavingLiveLink] = useState<boolean>(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState<boolean>(false);
  const [isAddExamOpen, setIsAddExamOpen] = useState<boolean>(false);
  const [isResourcesExpanded, setIsResourcesExpanded] = useState<boolean>(true);
  const [isExamsExpanded, setIsExamsExpanded] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!batchIdParam) {
        await Promise.resolve();
        if (!ignore) {
          setErrorMsg('No batch ID was specified in the URL.');
          setLoading(false);
        }
        return;
      }

      try {
        const [batchRes, resourcesRes, examsRes, examsCountRes] = await Promise.all([
          getMentorBatchById(batchIdParam),
          getBatchResources(batchIdParam),
          getBatchExams(batchIdParam),
          getBatchExamsCount(batchIdParam),
        ]);

        if (!ignore) {
          if (batchRes.data) {
            setBatch(batchRes.data);
            setLiveLink(batchRes.data.live_link || '');
          } else if (batchRes.error) {
            setErrorMsg(batchRes.error.message);
          }

          if (resourcesRes.data) {
            setResources(resourcesRes.data);
          } else if (resourcesRes.error) {
            console.error('Error loading batch resources:', resourcesRes.error);
          }

          if (examsRes.data) {
            setBatchExams(examsRes.data);
          } else if (examsRes.error) {
            console.error('Error loading batch exams:', examsRes.error);
          }

          setBatchExamsCount(examsCountRes);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load batch data');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [batchIdParam, refreshKey]);

  const handleSaveLiveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;

    setSavingLiveLink(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateBatchLiveLink(batch.id, liveLink);
      if (res.error) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg('Live session link updated successfully!');
        if (res.data) {
          setBatch(res.data);
        }
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update live link');
    } finally {
      setSavingLiveLink(false);
    }
  };

  const handleToggleStatus = async (item: BatchResourceItem) => {
    const newStatus: BatchResourceStatus = item.status === 'active' ? 'deactivated' : 'active';
    const res = await updateBatchResourceStatus(item.id, newStatus);
    if (res.error) {
      alert(`Failed to update status: ${res.error.message}`);
    } else {
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDeleteResource = async (item: BatchResourceItem) => {
    if (!confirm(`Are you sure you want to remove "${item.name}" from this batch?`)) {
      return;
    }
    const res = await deleteBatchResource(item.id);
    if (res.error) {
      alert(`Failed to remove resource: ${res.error.message}`);
    } else {
      setRefreshKey((k) => k + 1);
    }
  };

  const handleToggleExamStatus = async (item: BatchExamItem) => {
    const newStatus = !item.status;
    const res = await updateBatchExamStatus(item.id, newStatus);
    if (res.error) {
      alert(`Failed to update exam status: ${res.error.message}`);
    } else {
      setRefreshKey((k) => k + 1);
    }
  };

  const handleConductExam = async (item: BatchExamItem) => {
    const confirmed = window.confirm('Do you want to conduct the exam?');
    if (!confirmed) return;

    try {
      const res = await updateBatchExamConduct(item.id, true);
      if (res.error) {
        alert(`Failed to update conduct status: ${res.error.message}`);
      } else {
        setSuccessMsg(`Exam "${item.title}" is now being conducted.`);
        setTimeout(() => setSuccessMsg(null), 3000);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update conduct status');
    }
  };

  const handleDeleteBatchExam = async (item: BatchExamItem) => {
    const confirmed = window.confirm(`Are you sure you want to remove exam "${item.title}" from this batch?`);
    if (!confirmed) return;
    const res = await deleteBatchExam(item.id);
    if (res.error) {
      alert(`Failed to remove exam from batch: ${res.error.message}`);
    } else {
      setSuccessMsg(`Exam "${item.title}" removed from this batch.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setRefreshKey((k) => k + 1);
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

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/mentor/batches/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-tangerine)] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Batches</span>
        </Link>
      </div>

      {/* Header section with Title & Badges */}
      <div className="pb-2 border-b border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Batch Details
            </h1>
            {batch?.batch_id && (
              <span className="px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-mono font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/30">
                {batch.batch_id}
              </span>
            )}
          </div>
          <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
            {batch?.course_title
              ? `Management console for ${batch.course_title} (${batch.course_identifier})`
              : 'Review batch details, update live class link, and manage study materials.'}
          </p>
        </div>

        {batch && (
          <Link
            href={`/mentor/batches/learners?batch_id=${batch.id}`}
            className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold self-start sm:self-auto hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)]"
          >
            <span>View Learners</span>
          </Link>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 p-3.5 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Important Batch Details Display */}
      {batch && (
        <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--color-tangerine)]" />
              <span>Important Batch Details</span>
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                batch.registrations === 'open'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              Registrations: {batch.registrations}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]">
              <span className="text-[var(--color-text-muted)] block mb-1">Batch & Course</span>
              <span className="font-mono font-bold text-[var(--color-tangerine)] block">
                {batch.batch_id}
              </span>
              <span className="font-semibold text-[var(--color-text-primary)] line-clamp-1">
                {batch.course_title}
              </span>
            </div>

            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]">
              <span className="text-[var(--color-text-muted)] block mb-1">Assigned Mentor</span>
              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)]">
                <GraduationCap className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
                <span>{mentorName || batch.mentor_name}</span>
              </div>
            </div>

            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]">
              <span className="text-[var(--color-text-muted)] block mb-1">Schedule & Time</span>
              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)]">
                <Clock className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
                <span>
                  {batch.from_time && batch.to_time
                    ? `${batch.from_time.slice(0, 5)} – ${batch.to_time.slice(0, 5)}`
                    : 'Time not set'}
                </span>
              </div>
              <span className="text-[var(--color-text-muted)] block mt-0.5">
                Dates: {formatDate(batch.start_date)} to {formatDate(batch.end_date)}
              </span>
            </div>

            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3]">
              <span className="text-[var(--color-text-muted)] block mb-1">Region & Language</span>
              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)] capitalize">
                <Globe className="w-4 h-4 text-[var(--color-tangerine)] shrink-0" />
                <span>{batch.region} • {batch.language}</span>
              </div>
              <span className="text-[var(--color-text-muted)] block mt-0.5">
                Grace Period: {batch.grace_period} days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Update Batch Live Link Card with Save Button */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[var(--color-tangerine)]" />
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Live Session Link
            </h2>
          </div>
          {liveLink && (
            <a
              href={liveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-tangerine)] hover:underline"
            >
              <span>Test Meeting Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <form onSubmit={handleSaveLiveLink} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Google Meet / Zoom URL for Class Sessions
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={liveLink}
                onChange={(e) => setLiveLink(e.target.value)}
                placeholder="https://meet.google.com/xyz-abcd-efg or https://zoom.us/j/..."
                className="flex-1 rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none font-mono"
              />
              <button
                type="submit"
                disabled={savingLiveLink}
                className="btn btn-primary inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50 shrink-0"
              >
                {savingLiveLink ? (
                  <>
                    <Loader2 className="w-4 h-4 anim-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Live Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Learners registered for this batch will use this link to join live sessions.
            </p>
          </div>
        </form>
      </div>

      {/* 3. Batch Resources Section (Add Resource & Display List) */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--color-tangerine)]" />
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Batch Resources
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Published course resources, drive links, and study materials for this batch.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsResourcesExpanded((prev) => !prev)}
              className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[#D5CDBD] transition cursor-pointer"
              title={isResourcesExpanded ? 'Collapse resources list' : 'Expand resources list'}
            >
              {isResourcesExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expand All</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsAddResourceOpen(true)}
              disabled={!batch}
              className="btn btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Batch Resource</span>
            </button>
          </div>
        </div>

        {/* Resources Table */}
        {isResourcesExpanded && (
          <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
            <table className="table-base w-full">
              <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                <tr>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Resource Name
                  </th>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-24">
                    Type
                  </th>
                  <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-32">
                    Drive Link
                  </th>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Description
                  </th>
                  <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-28">
                    Status
                  </th>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                    Created At
                  </th>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                    Updated At
                  </th>
                  <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-16">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="table-body divide-y divide-[#E5DFD3]">
                {loading && resources.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--color-text-muted)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                        <span className="text-sm">Loading batch resources...</span>
                      </div>
                    </td>
                  </tr>
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <BookOpen className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          No resources added to this batch yet
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                          Click &quot;Add Batch Resource&quot; to publish available course materials for this batch.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  resources.map((item) => (
                    <tr
                      key={item.id}
                      className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                    >
                      {/* Resource Name */}
                      <td className="table-data-cell py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                        <span className="font-semibold text-xs sm:text-sm block">
                          {item.name}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="table-data-cell py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase bg-[var(--color-soft-cream)] border border-[#E5DFD3] text-[var(--color-text-secondary)]">
                          {renderTypeIcon(item.type)}
                          <span>{item.type}</span>
                        </span>
                      </td>

                      {/* Drive Link / URL */}
                      <td className="table-data-cell py-3.5 px-4 text-center">
                        {item.related_url ? (
                          <a
                            href={item.related_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] hover:bg-[var(--color-soft-orange)]/30 border border-[var(--color-tangerine)]/30 transition cursor-pointer"
                            title="Open Drive Link"
                          >
                            <span>Open Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] italic">
                            No URL
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="table-data-cell py-3.5 px-4 text-xs text-[var(--color-text-secondary)] max-w-xs">
                        {item.description ? (
                          <p className="line-clamp-2">{item.description}</p>
                        ) : (
                          <span className="text-[var(--color-text-muted)] italic">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="table-data-cell py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {item.status}
                        </button>
                      </td>

                      {/* Created At */}
                      <td className="table-data-cell py-3.5 px-4 text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(item.created_at)}
                      </td>

                      {/* Updated At */}
                      <td className="table-data-cell py-3.5 px-4 text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(item.updated_at)}
                      </td>

                      {/* Action: Delete */}
                      <td className="table-data-cell py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(item)}
                          className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Exams Section (After Batch Resources) */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--color-surface)]">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--color-tangerine)]" />
              <h2 className="card-title text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                Batch Examinations
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)]">
                {batchExamsCount}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Course exams assigned to this batch with evaluation status and question inspection.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto flex-wrap">
            {/* Total Exams Count */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] text-xs font-semibold text-[var(--color-text-primary)]">
              <span>Total Exams:</span>
              <span className="text-[var(--color-tangerine)] font-bold">
                {loading ? '...' : batchExamsCount}
              </span>
            </div>

            {/* Toggle Collapse/Expand All */}
            <button
              type="button"
              onClick={() => setIsExamsExpanded(!isExamsExpanded)}
              className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[#D5CDBD] hover:bg-[var(--color-soft-cream)] cursor-pointer"
              title={isExamsExpanded ? 'Collapse examinations section' : 'Expand examinations section'}
            >
              {isExamsExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expand All</span>
                </>
              )}
            </button>

            {/* Add Batch Exam Button */}
            <button
              type="button"
              onClick={() => setIsAddExamOpen(true)}
              className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Batch Exam</span>
            </button>
          </div>
        </div>

        {/* Batch Exams Table (Collapsible) */}
        {isExamsExpanded && (
          <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
            <table className="table-base w-full">
              <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
                <tr>
                  <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                    Exam Title
                  </th>
                  <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                    Total Questions (total_q)
                  </th>
                  <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-28">
                    Status
                  </th>
                  <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                    Conduct Exam
                  </th>
                  <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="table-body divide-y divide-[#E5DFD3]">
                {loading && batchExams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--color-text-muted)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                        <span className="text-sm">Loading batch exams...</span>
                      </div>
                    </td>
                  </tr>
                ) : batchExams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <FileText className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          No exams assigned to this batch yet
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                          Assign available course exams to activate them for learners in this batch.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddExamOpen(true)}
                          className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] mt-2 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Batch Exam</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batchExams.map((examItem) => (
                    <tr
                      key={examItem.id}
                      className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                    >
                      {/* Exam Title */}
                      <td className="table-data-cell py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                        <div>
                          <span className="font-semibold text-xs sm:text-sm block">
                            {examItem.title}
                          </span>
                          {examItem.description && (
                            <span className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                              {examItem.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Questions (total_q) */}
                      <td className="table-data-cell py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold font-mono bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/20">
                          <HelpCircle className="w-3 h-3" />
                          {examItem.total_q}
                        </span>
                      </td>

                      {/* Status (Boolean) */}
                      <td className="table-data-cell py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleExamStatus(examItem)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                            examItem.status
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {examItem.status ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Conduct Exam Column */}
                      <td className="table-data-cell py-3.5 px-4 text-center">
                        {examItem.conduct ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Conducted</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConductExam(examItem)}
                            className="btn btn-outline inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/40 hover:bg-[var(--color-soft-orange)]/40 hover:border-[var(--color-tangerine)] transition cursor-pointer"
                            title="Conduct this exam for this batch"
                          >
                            <Play className="w-3 h-3 fill-[var(--color-tangerine)]" />
                            <span>Conduct Exam</span>
                          </button>
                        )}
                      </td>

                      {/* Action: Submissions, Open & Delete */}
                      <td className="table-data-cell py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* Submissions button */}
                          <Link
                            href={`/mentor/batches/batchexamsubmissions?batch_exam_id=${examItem.id}&batch_id=${batch?.id}&exam_id=${examItem.exam_id}`}
                            className="btn btn-outline inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-tangerine)] bg-[var(--color-primary-subtle)] border border-[var(--color-tangerine)]/30 hover:bg-[var(--color-soft-orange)]/40 hover:border-[var(--color-tangerine)] transition cursor-pointer"
                            title="View learner submissions and evaluation"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>Submissions</span>
                          </Link>

                          {/* Open button in app/mentor/courses/openexam */}
                          <Link
                            href={`/mentor/courses/openexam?exam_id=${examItem.exam_id}&batch_id=${batch?.id}`}
                            className="btn btn-outline inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-tangerine)] hover:border-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
                            title="Open exam questions and answers"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBatchExam(examItem)}
                            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Remove exam from batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Batch Resource Modal */}
      {isAddResourceOpen && batch && (
        <AddBatchResource
          batchId={batch.id}
          courseId={batch.course_id}
          isOpen={isAddResourceOpen}
          onClose={() => setIsAddResourceOpen(false)}
          onResourceAdded={() => {
            setSuccessMsg('Batch resource added successfully!');
            setTimeout(() => setSuccessMsg(null), 3500);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Add Batch Exam Modal */}
      {isAddExamOpen && batch && (
        <AddBatchExam
          batchId={batch.id}
          courseId={batch.course_id}
          isOpen={isAddExamOpen}
          onClose={() => setIsAddExamOpen(false)}
          onExamAdded={() => {
            setSuccessMsg('Batch exam added successfully!');
            setTimeout(() => setSuccessMsg(null), 3500);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

export default function MentorOpenBatchPage() {
  const [mentorName, setMentorName] = useState<string>('Mentor Name');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadMentor() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile?.name) {
            setMentorName(profile.name);
          }
        }
      } catch {
        // Fall back gracefully
      }
    }
    loadMentor();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <MentorHeader
        mentorName={mentorName}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 relative">
        <MentorSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-[var(--color-text-muted)]">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
              </div>
            }
          >
            <MentorOpenBatchContent mentorName={mentorName} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
