'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import AddResource from '@/components/admin/addresource';
import OpenResource from '@/components/admin/openresource';
import {
  getCourseResources,
  getCourseResourcesCount,
  deleteCourseResource,
  CourseResource,
  ResourceType,
  UploaderRole,
} from '@/lib/courseresourcesStore';
import { getCourseById, Course } from '@/lib/coursesStore';
import {
  FolderOpen,
  Plus,
  ArrowLeft,
  ExternalLink,
  Loader2,
  FileText,
  FileCode,
  Image as ImageIcon,
  Presentation,
  Link2,
  Trash2,
  Filter,
  CheckCircle,
} from 'lucide-react';

function CourseResourcesContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id') || searchParams.get('id') || '';

  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [viewingResource, setViewingResource] = useState<CourseResource | null>(null);

  // Filters: type and uploaded_by
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [uploadedByFilter, setUploadedByFilter] = useState<UploaderRole | 'all'>('all');

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!courseId) {
        await Promise.resolve();
        if (!ignore) {
          setErrorMsg('No course ID was specified in the URL.');
          setLoading(false);
        }
        return;
      }

      try {
        const [courseRes, countRes, resourcesRes] = await Promise.all([
          getCourseById(courseId),
          getCourseResourcesCount(courseId),
          getCourseResources(courseId, {
            type: typeFilter,
            uploaded_by: uploadedByFilter,
          }),
        ]);

        if (!ignore) {
          if (courseRes.data) {
            setCourse(courseRes.data);
          } else if (courseRes.error) {
            setErrorMsg(courseRes.error.message);
          }

          setTotalCount(countRes);

          if (resourcesRes.data) {
            setResources(resourcesRes.data);
          } else if (resourcesRes.error) {
            setErrorMsg(resourcesRes.error.message);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load resources');
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
  }, [courseId, typeFilter, uploadedByFilter, refreshKey]);

  const handleResourceAdded = (newResource: CourseResource) => {
    setActionSuccess(`Added "${newResource.name}" successfully!`);
    setTimeout(() => setActionSuccess(null), 3000);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = async (resourceId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the resource "${name}"?`)) {
      return;
    }

    const res = await deleteCourseResource(resourceId);
    if (res.error) {
      alert(`Failed to delete resource: ${res.error.message}`);
    } else {
      setActionSuccess(`Deleted "${name}"`);
      setTimeout(() => setActionSuccess(null), 3000);
      setRefreshKey((k) => k + 1);
    }
  };

  // Helper for resource icon & badge color
  const renderTypeBadge = (t: ResourceType) => {
    switch (t) {
      case 'doc':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FileText className="w-3 h-3" />
            <span>Doc</span>
          </span>
        );
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <FileCode className="w-3 h-3" />
            <span>PDF</span>
          </span>
        );
      case 'ppt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Presentation className="w-3 h-3" />
            <span>PPT</span>
          </span>
        );
      case 'link':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Link2 className="w-3 h-3" />
            <span>Link</span>
          </span>
        );
      case 'image':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ImageIcon className="w-3 h-3" />
            <span>Image</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <span>{t}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/courses/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-tangerine)] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </Link>
      </div>

      {/* Header section with Title, Course info, and Add Resource CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Course Resources
            </h1>
            {course?.course_id && (
              <span className="px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-mono font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/30">
                {course.course_id}
              </span>
            )}
          </div>
          <p className="subheading-text text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
            {course?.title
              ? `Manage study notes, drive links, presentations, and resources for "${course.title}".`
              : 'Manage study materials, downloadable slides, and external Google Drive links.'}
          </p>
        </div>

        {/* Add Resource Button */}
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="btn btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Resource</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Total Resources & Filters Section */}
      <div className="card px-3.5 py-2.5 bg-[var(--color-surface)] border border-[#D5CDBD] rounded-[var(--radius-lg)] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Total Resources count */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] shrink-0 self-start md:self-auto">
          <span className="font-semibold text-xs sm:text-sm md:text-base text-[var(--color-text-primary)]">
            Total Resources : <span className="font-bold text-[var(--color-tangerine)] text-xs sm:text-sm md:text-base">{loading && totalCount === 0 ? '...' : totalCount}</span>
          </span>
          <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-tangerine)] shrink-0" />
        </div>

        {/* Filters: Type & Uploaded By */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
            <Filter className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <span>Filters:</span>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-[var(--color-text-muted)]">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ResourceType | 'all')}
              className="rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            >
              <option value="all">All Types</option>
              <option value="doc">Doc (.doc)</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="ppt">PPT (.ppt)</option>
              <option value="link">Web / Drive Link</option>
              <option value="image">Image</option>
            </select>
          </div>

          {/* Uploaded By Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-[var(--color-text-muted)]">Uploaded By:</label>
            <select
              value={uploadedByFilter}
              onChange={(e) => setUploadedByFilter(e.target.value as UploaderRole | 'all')}
              className="rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          {(typeFilter !== 'all' || uploadedByFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setUploadedByFilter('all');
              }}
              className="text-xs text-[var(--color-tangerine)] hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* List of Resources Table */}
      <div className="card bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
          <div>
            <h3 className="card-title text-base font-bold text-[var(--color-text-primary)]">
              List of Resources
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {resources.length} {resources.length === 1 ? 'resource' : 'resources'} listed
            </p>
          </div>
        </div>

        <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
          <table className="table-base w-full">
            <thead className="table-head bg-[var(--color-soft-orange)]/40 border-b border-[#E5DFD3]">
              <tr>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)]">
                  Name
                </th>
                <th className="table-header-cell text-left py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-28">
                  Type
                </th>
                <th className="table-header-cell text-center py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-36">
                  Related URL
                </th>
                <th className="table-header-cell text-right py-3 px-4 font-semibold text-xs text-[var(--color-text-primary)] w-32">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="table-body divide-y divide-[#E5DFD3]">
              {loading && resources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 anim-spin text-[var(--color-tangerine)]" />
                      <span className="text-sm">Loading resources...</span>
                    </div>
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <FolderOpen className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        No resources found
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                        {typeFilter !== 'all' || uploadedByFilter !== 'all'
                          ? 'No resources match your active filter criteria. Try resetting filters.'
                          : 'Click "Add Resource" above to attach your first learning document, presentation, or Drive link.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr
                    key={resource.id}
                    className="table-row table-row-hover hover:bg-[var(--color-soft-cream)]/60 transition-colors"
                  >
                    {/* Name */}
                    <td className="table-data-cell py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                      <div>
                        <span className="font-semibold text-xs sm:text-sm block">
                          {resource.name}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)] capitalize">
                          Uploaded by: {resource.uploaded_by}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="table-data-cell py-3.5 px-4">
                      {renderTypeBadge(resource.type)}
                    </td>

                    {/* Related URL: Icon on tap open new tab. It is drive link */}
                    <td className="table-data-cell py-3.5 px-4 text-center">
                      {resource.related_url ? (
                        <a
                          href={resource.related_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] hover:bg-[var(--color-soft-orange)]/30 border border-[var(--color-tangerine)]/30 transition cursor-pointer"
                          title="Open Drive Link in new tab"
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

                    {/* Action: Open & Delete */}
                    <td className="table-data-cell py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingResource(resource)}
                          className="btn btn-outline inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-tangerine)] hover:text-[var(--color-tangerine)] border border-[#D5CDBD] transition cursor-pointer"
                          title="Open and edit resource"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
                          <span>Open</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(resource.id, resource.name)}
                          className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete resource"
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
      </div>

      {/* Add Resource Modal */}
      {isAddOpen && (
        <AddResource
          courseId={course?.id || courseId}
          courseTitle={course?.title}
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onResourceAdded={handleResourceAdded}
        />
      )}

      {/* Open Resource Modal (Display all & Allow to edit Description & Link) */}
      {viewingResource && (
        <OpenResource
          resource={viewingResource}
          courseTitle={course?.title}
          isOpen={Boolean(viewingResource)}
          onClose={() => setViewingResource(null)}
          onResourceUpdated={(updated) => {
            setViewingResource(null);
            setActionSuccess(`Updated "${updated.name}" successfully!`);
            setTimeout(() => setActionSuccess(null), 3000);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

export default function CourseResourcesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-[var(--color-text-muted)]">
                <Loader2 className="w-8 h-8 anim-spin text-[var(--color-tangerine)]" />
              </div>
            }
          >
            <CourseResourcesContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
