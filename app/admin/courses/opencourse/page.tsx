'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import AdminSidebar from '@/components/admin/sidebar';
import {
  getCourses,
  getCourseById,
  updateCourse,
  getMentorsList,
  getAllTopics,
  createTopic,
  getCourseTopicIds,
  saveCourseTopics,
  getCourseModulesWithContent,
  createCourseModuleWithContent,
  addCourseModuleContent,
  updateCourseModule,
  updateCourseModuleContent,
  updateModulesOrder,
  deleteCourseModule,
  deleteCourseModuleContent,
  Course,
  MentorSummary,
  CourseStatus,
  Topic,
  CourseModule,
  CourseModuleContent,
} from '@/lib/coursesStore';
import {
  ArrowLeft,
  Check,
  Lock,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Tag,
  Layers,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Edit2,
  Save,
  X,
} from 'lucide-react';

function OpenCourseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [course, setCourse] = useState<Course | null>(null);
  const [mentors, setMentors] = useState<MentorSummary[]>([]);

  // Editable Form Fields (Existing Core Fields + UK Pricing)
  const [title, setTitle] = useState<string>('');
  const [subHeading, setSubHeading] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [ukPrice, setUkPrice] = useState<number>(0);
  const [ukSellingPrice, setUkSellingPrice] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [mentorId, setMentorId] = useState<string>('');
  const [previewMediaId, setPreviewMediaId] = useState<string>('');
  const [status, setStatus] = useState<CourseStatus>('active');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);

  // Dynamic Array Fields (Learnings & Includes)
  const [learningItem, setLearningItem] = useState<string>('');
  const [courseLearnings, setCourseLearnings] = useState<string[]>([]);

  const [includeItem, setIncludeItem] = useState<string>('');
  const [courseIncludes, setCourseIncludes] = useState<string[]>([]);

  // Status & Feedback for Core Course Form
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Topics State ---
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [quickAddingTopic, setQuickAddingTopic] = useState<boolean>(false);
  const [savingTopics, setSavingTopics] = useState<boolean>(false);
  const [topicFeedback, setTopicFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Course Modules & Content State ---
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);

  // Accordion State: Initially collapsed (empty array so no module expanded by default)
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>([]);

  // New Module Form Fields (Default is_preview: true)
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [moduleDisplayOrder, setModuleDisplayOrder] = useState<number>(1);
  const [moduleIsPreview, setModuleIsPreview] = useState<boolean>(true);

  // Immediate Module Content Form Fields (Default is_preview: true)
  const [contentEmoji, setContentEmoji] = useState<string>('📘');
  const [contentText, setContentText] = useState<string>('');
  const [contentIsPreview, setContentIsPreview] = useState<boolean>(true);

  const [savingModule, setSavingModule] = useState<boolean>(false);
  const [moduleFeedback, setModuleFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick add extra content to an existing module (Default is_preview: true)
  const [activeModuleForContent, setActiveModuleForContent] = useState<string | null>(null);
  const [extraEmoji, setExtraEmoji] = useState<string>('📝');
  const [extraContent, setExtraContent] = useState<string>('');
  const [extraIsPreview, setExtraIsPreview] = useState<boolean>(true);
  const [savingExtraContent, setSavingExtraContent] = useState<boolean>(false);

  // Edit Existing Module State
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState<string>('');
  const [editModuleIsPreview, setEditModuleIsPreview] = useState<boolean>(true);
  const [savingEditModule, setSavingEditModule] = useState<boolean>(false);

  // Edit Existing Content State
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editContentEmoji, setEditContentEmoji] = useState<string>('');
  const [editContentText, setEditContentText] = useState<string>('');
  const [editContentIsPreview, setEditContentIsPreview] = useState<boolean>(true);
  const [savingEditContent, setSavingEditContent] = useState<boolean>(false);

  const loadTopicsData = useCallback(async (courseId: string) => {
    const [topicsRes, assignedRes] = await Promise.all([
      getAllTopics(),
      getCourseTopicIds(courseId),
    ]);
    if (topicsRes.data) {
      setAvailableTopics(topicsRes.data);
    }
    if (assignedRes.data) {
      setSelectedTopicIds(assignedRes.data);
    }
  }, []);

  const loadModulesData = useCallback(async (courseId: string) => {
    setLoadingModules(true);
    const modulesRes = await getCourseModulesWithContent(courseId);
    if (modulesRes.data) {
      setCourseModules(modulesRes.data);
      // Auto set next display order
      const maxOrder = modulesRes.data.reduce((max, m) => Math.max(max, m.display_order), 0);
      setModuleDisplayOrder(maxOrder + 1);
    }
    setLoadingModules(false);
  }, []);

  const loadCourseDetails = useCallback(async (id: string) => {
    const res = await getCourseById(id);
    if (res.data) {
      const c = res.data;
      setCourse(c);
      setTitle(c.title || '');
      setSubHeading(c.sub_heading || '');
      setDescription(c.description || '');
      setPrice(c.price || 0);
      setSellingPrice(c.selling_price || 0);
      setUkPrice(c.uk_price || 0);
      setUkSellingPrice(c.uk_selling_price || 0);
      setDuration(c.duration || 0);
      setMentorId(c.mentor_id || '');
      setPreviewMediaId(c.preview_media_id || '');
      setStatus(c.status || 'deactivated');
      setIsFeatured(Boolean(c.is_featured));
      setCourseLearnings(Array.isArray(c.course_learnings) ? c.course_learnings : []);
      setCourseIncludes(Array.isArray(c.course_includes) ? c.course_includes : []);

      // Load topics for this course
      await loadTopicsData(c.id);

      // Load modules for this course
      await loadModulesData(c.id);
    }
  }, [loadTopicsData, loadModulesData]);

  // Initial Data Load
  useEffect(() => {
    async function init() {
      setLoading(true);
      const [coursesResult, mentorsList] = await Promise.all([
        getCourses(),
        getMentorsList(),
      ]);

      const coursesList = coursesResult.data || [];
      setMentors(mentorsList || []);

      const targetId = initialId || (coursesList.length > 0 ? coursesList[0].id : '');
      if (targetId) {
        await loadCourseDetails(targetId);
      }
      setLoading(false);
    }

    init();
  }, [initialId, loadCourseDetails]);

  // Learnings item management
  const addLearning = () => {
    if (learningItem.trim()) {
      setCourseLearnings([...courseLearnings, learningItem.trim()]);
      setLearningItem('');
    }
  };

  const handleEditLearning = (index: number, val: string) => {
    const updated = [...courseLearnings];
    updated[index] = val;
    setCourseLearnings(updated);
  };

  const removeLearning = (index: number) => {
    setCourseLearnings(courseLearnings.filter((_, i) => i !== index));
  };

  // Inclusions item management
  const addInclude = () => {
    if (includeItem.trim()) {
      setCourseIncludes([...courseIncludes, includeItem.trim()]);
      setIncludeItem('');
    }
  };

  const handleEditInclude = (index: number, val: string) => {
    const updated = [...courseIncludes];
    updated[index] = val;
    setCourseIncludes(updated);
  };

  const removeInclude = (index: number) => {
    setCourseIncludes(courseIncludes.filter((_, i) => i !== index));
  };

  // Update Core Course
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!course) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Course Title is required.');
      return;
    }

    if (price < 0 || sellingPrice < 0 || ukPrice < 0 || ukSellingPrice < 0) {
      setErrorMessage('Prices cannot be negative numbers.');
      return;
    }

    setUpdating(true);

    const result = await updateCourse(course.id, {
      title: title.trim(),
      sub_heading: subHeading.trim() || null,
      description: description.trim() || null,
      price: Number(price),
      selling_price: Number(sellingPrice),
      uk_price: Number(ukPrice),
      uk_selling_price: Number(ukSellingPrice),
      duration: Number(duration),
      mentor_id: mentorId || null,
      preview_media_id: previewMediaId.trim() || null,
      course_learnings: courseLearnings,
      course_includes: courseIncludes,
      status,
      is_featured: isFeatured,
    });

    if (result.error) {
      setErrorMessage(result.error.message || 'Failed to update course in Supabase.');
      setUpdating(false);
      return;
    }

    setSuccessMessage(`Course "${result.data?.title}" updated successfully.`);
    setUpdating(false);
  };

  // --- Topic Handlers ---
  const toggleTopic = (topicId: string) => {
    if (selectedTopicIds.includes(topicId)) {
      setSelectedTopicIds(selectedTopicIds.filter((id) => id !== topicId));
    } else {
      setSelectedTopicIds([...selectedTopicIds, topicId]);
    }
  };

  const handleQuickAddTopic = async () => {
    if (!newTopicName.trim()) return;

    setQuickAddingTopic(true);
    setTopicFeedback(null);

    const res = await createTopic(newTopicName.trim());
    if (res.error || !res.data) {
      setTopicFeedback({
        type: 'error',
        text: res.error?.message || 'Failed to add topic to table.',
      });
      setQuickAddingTopic(false);
      return;
    }

    const addedTopic = res.data;
    setAvailableTopics((prev) => [...prev, addedTopic]);
    setSelectedTopicIds((prev) => [...prev, addedTopic.id]);
    setNewTopicName('');
    setTopicFeedback({
      type: 'success',
      text: `Topic "${addedTopic.topic_name}" created and selected!`,
    });
    setQuickAddingTopic(false);
  };

  const handleSaveTopics = async () => {
    if (!course) return;
    setSavingTopics(true);
    setTopicFeedback(null);

    const res = await saveCourseTopics(course.id, selectedTopicIds);
    if (res.error) {
      setTopicFeedback({
        type: 'error',
        text: res.error.message || 'Failed to save course topics.',
      });
    } else {
      setTopicFeedback({
        type: 'success',
        text: 'Course topics saved successfully to Supabase!',
      });
    }
    setSavingTopics(false);
  };

  // --- Module Accordion Toggle ---
  const toggleModuleCollapse = (moduleId: string) => {
    setExpandedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  // --- Auto Reorder Display Orders When One Changes ---
  const handleModuleOrderChange = async (targetModuleId: string, targetOrder: number) => {
    if (targetOrder < 1) targetOrder = 1;
    // Sort current modules
    const sorted = [...courseModules].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sorted.findIndex((m) => m.id === targetModuleId);
    if (currentIndex === -1) return;

    const [targetModule] = sorted.splice(currentIndex, 1);
    const newIndex = Math.min(Math.max(0, targetOrder - 1), sorted.length);
    sorted.splice(newIndex, 0, targetModule);

    // Re-index all sequentially from 1 to N
    const reorderedList = sorted.map((mod, index) => ({
      id: mod.id,
      display_order: index + 1,
    }));

    // Optimistically update local state
    setCourseModules((prev) =>
      prev.map((mod) => {
        const found = reorderedList.find((r) => r.id === mod.id);
        return found ? { ...mod, display_order: found.display_order } : mod;
      })
    );

    // Persist to Supabase
    setModuleFeedback(null);
    const res = await updateModulesOrder(reorderedList);
    if (res.error) {
      setModuleFeedback({ type: 'error', text: res.error.message || 'Failed to update module order.' });
      if (course) await loadModulesData(course.id);
    } else {
      setModuleFeedback({
        type: 'success',
        text: 'Module display order updated. Other modules shifted automatically.',
      });
      if (course) await loadModulesData(course.id);
    }
  };

  // --- Save New Module and Content ---
  const handleSaveModuleAndContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    if (!moduleTitle.trim()) {
      setModuleFeedback({ type: 'error', text: 'Module title is required.' });
      return;
    }

    setSavingModule(true);
    setModuleFeedback(null);

    const res = await createCourseModuleWithContent(
      course.id,
      {
        title: moduleTitle.trim(),
        display_order: Number(moduleDisplayOrder || 1),
        is_preview: moduleIsPreview,
      },
      contentText.trim()
        ? {
            emoji: contentEmoji.trim() || '📘',
            content: contentText.trim(),
            is_preview: contentIsPreview,
          }
        : undefined
    );

    if (res.error) {
      setModuleFeedback({ type: 'error', text: res.error.message || 'Failed to create module and content.' });
      setSavingModule(false);
      return;
    }

    setModuleFeedback({ type: 'success', text: `Module "${moduleTitle}" and content saved successfully!` });
    setModuleTitle('');
    setContentText('');
    setModuleIsPreview(true);
    setContentIsPreview(true);

    // Refresh modules
    await loadModulesData(course.id);
    setSavingModule(false);
  };

  // --- Edit Existing Module Header (Title & Preview) ---
  const startEditModule = (m: CourseModule) => {
    setEditingModuleId(m.id);
    setEditModuleTitle(m.title);
    setEditModuleIsPreview(Boolean(m.is_preview));
  };

  const handleSaveModuleEdit = async (moduleId: string) => {
    if (!editModuleTitle.trim()) return;
    setSavingEditModule(true);
    const res = await updateCourseModule(moduleId, {
      title: editModuleTitle.trim(),
      is_preview: editModuleIsPreview,
    });
    if (res.error) {
      setModuleFeedback({ type: 'error', text: res.error.message || 'Failed to update module.' });
    } else {
      setModuleFeedback({ type: 'success', text: 'Module updated successfully.' });
      setEditingModuleId(null);
      if (course) await loadModulesData(course.id);
    }
    setSavingEditModule(false);
  };

  // --- Edit Existing Module Content ---
  const startEditContent = (content: CourseModuleContent) => {
    setEditingContentId(content.id);
    setEditContentEmoji(content.emoji || '📘');
    setEditContentText(content.content);
    setEditContentIsPreview(Boolean(content.is_preview));
  };

  const handleSaveContentEdit = async (contentId: string) => {
    if (!editContentText.trim()) return;
    setSavingEditContent(true);
    const res = await updateCourseModuleContent(contentId, {
      emoji: editContentEmoji.trim() || '📘',
      content: editContentText.trim(),
      is_preview: editContentIsPreview,
    });
    if (res.error) {
      setModuleFeedback({ type: 'error', text: res.error.message || 'Failed to update content.' });
    } else {
      setModuleFeedback({ type: 'success', text: 'Content updated successfully.' });
      setEditingContentId(null);
      if (course) await loadModulesData(course.id);
    }
    setSavingEditContent(false);
  };

  // --- Quick Add Extra Content to Existing Module ---
  const handleSaveExtraContent = async (moduleId: string) => {
    if (!extraContent.trim()) return;

    setSavingExtraContent(true);
    const res = await addCourseModuleContent(moduleId, {
      emoji: extraEmoji.trim() || '📝',
      content: extraContent.trim(),
      is_preview: extraIsPreview,
    });

    if (res.error) {
      setModuleFeedback({ type: 'error', text: res.error.message || 'Failed to add content.' });
    } else {
      setModuleFeedback({ type: 'success', text: 'New content item added successfully!' });
      setExtraContent('');
      setExtraIsPreview(true);
      setActiveModuleForContent(null);
      if (course) await loadModulesData(course.id);
    }
    setSavingExtraContent(false);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Delete this course module and its content?')) return;
    const res = await deleteCourseModule(moduleId);
    if (!res.error && course) {
      await loadModulesData(course.id);
      setModuleFeedback({ type: 'success', text: 'Module deleted.' });
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    const res = await deleteCourseModuleContent(contentId);
    if (!res.error && course) {
      await loadModulesData(course.id);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[var(--color-tangerine)] anim-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Bar with Back Link (Select Course Option Removed) */}
      <div className="flex items-center gap-3 pb-2 border-b border-[#E5DFD3]">
        <Link
          href="/admin/courses/dashboard"
          className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-soft-cream)] border border-[#E5DFD3] transition"
          title="Back to Courses Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Course Details &amp; Editor
          </h1>
          <p className="subheading-text text-xs text-[var(--color-text-muted)]">
            View and edit complete course details. Course ID is strictly locked and cannot be changed.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-success-subtle)] border border-[var(--color-success)] flex items-start gap-2.5 text-[var(--color-success)] text-sm anim-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{successMessage}</div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] flex items-start gap-2.5 text-[var(--color-danger)] text-sm anim-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{errorMessage}</div>
        </div>
      )}

      {!course ? (
        <div className="card p-12 text-center bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            No course selected or found.
          </p>
          <Link
            href="/admin/courses/dashboard"
            className="btn btn-primary mt-4 inline-flex text-xs px-4 py-2"
          >
            Go to Courses Dashboard
          </Link>
        </div>
      ) : (
        <>
          {/* =========================================================================
              PART 1: CORE COURSE FORM (UUID REMOVED AS REQUESTED)
              ========================================================================= */}
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Section 1: Course Identity & Content */}
            <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
              <div className="border-b border-[#E5DFD3] pb-2">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  1. Core Identity &amp; Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* course_id - LOCKED / READONLY */}
                <div className="form-group mb-0">
                  <label className="form-label mb-1 flex items-center justify-between">
                    <span>Course ID (Protected Identifier)</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-danger)]">
                      <Lock className="w-3 h-3" />
                      Locked (Read-Only)
                    </span>
                  </label>
                  <div className="flex items-center w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-soft-cream)] px-3 py-2 text-sm font-mono font-bold text-[var(--color-text-primary)] cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5 text-[var(--color-text-muted)] mr-2 shrink-0" />
                    <span>{course.course_id}</span>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Database constraint: course_id is permanently locked and cannot be edited.
                  </span>
                </div>

                {/* Title */}
                <div className="form-group mb-0">
                  <label htmlFor="editTitle" className="form-label mb-1">
                    Course Title <span className="text-[var(--color-tangerine)]">*</span>
                  </label>
                  <input
                    id="editTitle"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                {/* Sub Heading */}
                <div className="form-group md:col-span-2 mb-0">
                  <label htmlFor="editSubHeading" className="form-label mb-1">
                    Sub Heading / Tagline
                  </label>
                  <input
                    id="editSubHeading"
                    type="text"
                    value={subHeading}
                    onChange={(e) => setSubHeading(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                {/* Description */}
                <div className="form-group md:col-span-2 mb-0">
                  <label htmlFor="editDescription" className="form-label mb-1">
                    Course Description
                  </label>
                  <textarea
                    id="editDescription"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing (India + UK Pricing), Mentor Allocation & Status */}
            <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
              <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2">
                2. Pricing, Mentor Allocation &amp; Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Original Price (India) */}
                <div className="form-group mb-0">
                  <label htmlFor="editPrice" className="form-label mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    id="editPrice"
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                {/* Selling Price (India) */}
                <div className="form-group mb-0">
                  <label htmlFor="editSellingPrice" className="form-label mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    id="editSellingPrice"
                    type="number"
                    min={0}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                {/* Duration in Days */}
                <div className="form-group mb-0">
                  <label htmlFor="editDuration" className="form-label mb-1">
                    Duration (Days)
                  </label>
                  <input
                    id="editDuration"
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                {/* UK Original Price */}
                <div className="form-group mb-0">
                  <label htmlFor="editUkPrice" className="form-label mb-1">
                    UK Original Price (£) (uk_price)
                  </label>
                  <input
                    id="editUkPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    value={ukPrice}
                    onChange={(e) => setUkPrice(Number(e.target.value))}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                {/* UK Selling Price */}
                <div className="form-group mb-0">
                  <label htmlFor="editUkSellingPrice" className="form-label mb-1">
                    UK Selling Price (£) (uk_selling_price)
                  </label>
                  <input
                    id="editUkSellingPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    value={ukSellingPrice}
                    onChange={(e) => setUkSellingPrice(Number(e.target.value))}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                {/* Preview Media ID */}
                <div className="form-group mb-0">
                  <label htmlFor="editPreviewMediaId" className="form-label mb-1">
                    Preview Media ID / URL
                  </label>
                  <input
                    id="editPreviewMediaId"
                    type="text"
                    value={previewMediaId}
                    onChange={(e) => setPreviewMediaId(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                {/* Mentor Assignment */}
                <div className="form-group md:col-span-2 mb-0">
                  <label htmlFor="editMentorId" className="form-label mb-1">
                    Assigned Mentor
                  </label>
                  <select
                    id="editMentorId"
                    value={mentorId}
                    onChange={(e) => setMentorId(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  >
                    <option value="">-- No Mentor Assigned --</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="form-group mb-0">
                  <label htmlFor="editStatus" className="form-label mb-1">
                    Catalog Status
                  </label>
                  <select
                    id="editStatus"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CourseStatus)}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="deactivated">Deactivated (Hidden)</option>
                  </select>
                </div>

                {/* Is Featured */}
                <div className="form-group mb-0 flex items-center pt-6 gap-2">
                  <input
                    id="editFeatured"
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-tangerine)] cursor-pointer"
                  />
                  <label htmlFor="editFeatured" className="text-sm font-semibold text-[var(--color-text-primary)] cursor-pointer">
                    Featured Course
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Curriculum Details (Editable Existing Data) */}
            <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
              <h2 className="text-base font-bold text-[var(--color-text-primary)] border-b border-[#E5DFD3] pb-2">
                3. Learnings &amp; Inclusions
              </h2>

              {/* Course Learnings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="form-label mb-0">
                    Course Learnings (course_learnings)
                  </label>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    Edit existing items directly below or add new ones
                  </span>
                </div>

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
                    placeholder="Add learning objective..."
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

                {courseLearnings.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {courseLearnings.map((item, idx) => (
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
                          placeholder="Edit learning item..."
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

              {/* Course Includes */}
              <div className="space-y-3 pt-3 border-t border-[#E5DFD3]">
                <div className="flex items-center justify-between">
                  <label className="form-label mb-0">
                    Course Includes (course_includes)
                  </label>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    Edit existing items directly below or add new ones
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={includeItem}
                    onChange={(e) => setIncludeItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addInclude();
                      }
                    }}
                    placeholder="Add item included in course..."
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={addInclude}
                    className="btn btn-outline px-3 py-2 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {courseIncludes.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {courseIncludes.map((item, idx) => (
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
                          onChange={(e) => handleEditInclude(idx, e.target.value)}
                          placeholder="Edit inclusion item..."
                          className="flex-1 bg-transparent border-0 px-2 py-1 text-xs text-[var(--color-text-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-tangerine)] rounded outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => removeInclude(idx)}
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

            {/* Action Bar with Update Button */}
            <div className="flex items-center justify-between pt-2 border-b border-[#E5DFD3] pb-6">
              <Link
                href="/admin/courses/dashboard"
                className="btn btn-outline px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)]"
              >
                Back to Courses List
              </Link>

              <button
                type="submit"
                disabled={updating}
                className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 anim-spin" />
                    <span>Updating Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Course</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* =========================================================================
              PART 2: COURSE TOPICS (FETCH, QUICK ADD TO TOPICS TABLE & SAVE BUTTON)
              ========================================================================= */}
          <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5DFD3] pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[var(--color-tangerine)]" />
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    Course Topics
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Fetch topics from Topics table, select relevant topics, or quick-add new topics.
                  </p>
                </div>
              </div>

              {/* Save Topics Button */}
              <button
                type="button"
                onClick={handleSaveTopics}
                disabled={savingTopics}
                className="btn btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                {savingTopics ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 anim-spin" />
                    <span>Saving Topics...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Course Topics</span>
                  </>
                )}
              </button>
            </div>

            {/* Topic Feedback Notification */}
            {topicFeedback && (
              <div
                className={`p-3 rounded-[var(--radius-md)] border text-xs font-semibold flex items-center gap-2 ${
                  topicFeedback.type === 'success'
                    ? 'bg-[var(--color-success-subtle)] border-[var(--color-success)] text-[var(--color-success)]'
                    : 'bg-[var(--color-danger-subtle)] border-[var(--color-danger)] text-[var(--color-danger)]'
                }`}
              >
                {topicFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{topicFeedback.text}</span>
              </div>
            )}

            {/* Quick Add to Topics Table */}
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] space-y-2">
              <label htmlFor="quickAddTopic" className="form-label text-xs">
                Quick Add New Topic to Topics Table
              </label>
              <div className="flex gap-2">
                <input
                  id="quickAddTopic"
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAddTopic();
                    }
                  }}
                  placeholder="e.g. Next.js 15, PostgreSQL, Cloud Deployments..."
                  className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleQuickAddTopic}
                  disabled={quickAddingTopic || !newTopicName.trim()}
                  className="btn btn-outline inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {quickAddingTopic ? (
                    <Loader2 className="w-3.5 h-3.5 anim-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Quick Add Topic</span>
                </button>
              </div>
            </div>

            {/* Selectable Topics from Topics Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Available Topics from Topics Table ({availableTopics.length})
                </span>
                <span className="text-xs text-[var(--color-tangerine)] font-medium">
                  {selectedTopicIds.length} selected for this course
                </span>
              </div>

              {availableTopics.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] py-3">
                  No topics in database yet. Use &quot;Quick Add&quot; above to create one.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto p-1">
                  {availableTopics.map((topic) => {
                    const isSelected = selectedTopicIds.includes(topic.id);
                    return (
                      <button
                        type="button"
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-primary-subtle)] border-[var(--color-tangerine)] text-[var(--color-tangerine)] font-semibold'
                            : 'bg-[var(--color-surface)] border-[#D5CDBD] text-[var(--color-text-secondary)] hover:border-[var(--color-tangerine)]'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-40" />}
                        <span>{topic.topic_name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              PART 3: COURSE MODULES & CONTENT
              - "Create New Course Module & Content" placed ABOVE the Existing Course Modules
              - Default is_preview is TRUE
              - All content collapsed by default; tap module header to expand
              - Allow editing Existing Course Modules & Content
              - Changing one display order auto-adjusts other module orders
              ========================================================================= */}
          <div className="card p-6 bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--color-tangerine)]" />
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    Course Modules &amp; Content
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Create new modules or edit existing modules, display orders, and content lessons.
                  </p>
                </div>
              </div>
            </div>

            {/* Module Feedback Notification */}
            {moduleFeedback && (
              <div
                className={`p-3 rounded-[var(--radius-md)] border text-xs font-semibold flex items-center gap-2 ${
                  moduleFeedback.type === 'success'
                    ? 'bg-[var(--color-success-subtle)] border-[var(--color-success)] text-[var(--color-success)]'
                    : 'bg-[var(--color-danger-subtle)] border-[var(--color-danger)] text-[var(--color-danger)]'
                }`}
              >
                {moduleFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{moduleFeedback.text}</span>
              </div>
            )}

            {/* 1. "Create New Course Module & Content" SECTION PLACED ABOVE */}
            <form
              onSubmit={handleSaveModuleAndContent}
              className="p-5 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#D5CDBD] space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-[#E5DFD3] pb-2">
                <Bookmark className="w-4 h-4 text-[var(--color-tangerine)]" />
                <span className="font-bold text-sm text-[var(--color-text-primary)]">
                  Create New Course Module &amp; Content
                </span>
              </div>

              {/* Module Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label htmlFor="newModuleTitle" className="form-label text-xs mb-1">
                    Module Title <span className="text-[var(--color-tangerine)]">*</span>
                  </label>
                  <input
                    id="newModuleTitle"
                    type="text"
                    required
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="e.g. Module 1: Introduction to Web Architecture"
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs md:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="newModuleOrder" className="form-label text-xs mb-1">
                    Display Order
                  </label>
                  <input
                    id="newModuleOrder"
                    type="number"
                    min={1}
                    value={moduleDisplayOrder}
                    onChange={(e) => setModuleDisplayOrder(Number(e.target.value))}
                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs md:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                  />
                </div>

                <div className="md:col-span-3 flex items-center gap-2">
                  <input
                    id="newModulePreview"
                    type="checkbox"
                    checked={moduleIsPreview}
                    onChange={(e) => setModuleIsPreview(e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-tangerine)] cursor-pointer"
                  />
                  <label htmlFor="newModulePreview" className="text-xs font-semibold text-[var(--color-text-primary)] cursor-pointer">
                    Module Is Preview (Open for unenrolled learners - Default: True)
                  </label>
                </div>
              </div>

              {/* Immediately Ask Course Module Content */}
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[#E5DFD3] space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-tangerine)]" />
                  <span className="font-bold text-xs text-[var(--color-text-primary)] uppercase tracking-wide">
                    Initial Module Content Details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="newContentEmoji" className="form-label text-xs mb-1">
                      Emoji
                    </label>
                    <input
                      id="newContentEmoji"
                      type="text"
                      value={contentEmoji}
                      onChange={(e) => setContentEmoji(e.target.value)}
                      placeholder="e.g. 📘"
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-center text-sm text-[var(--color-text-primary)] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="newContentText" className="form-label text-xs mb-1">
                      Content Description / Lesson Summary
                    </label>
                    <textarea
                      id="newContentText"
                      rows={2}
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      placeholder="Enter content details or summary for this module..."
                      className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] outline-none resize-y"
                    />
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-2">
                    <input
                      id="newContentPreview"
                      type="checkbox"
                      checked={contentIsPreview}
                      onChange={(e) => setContentIsPreview(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-tangerine)] cursor-pointer"
                    />
                    <label htmlFor="newContentPreview" className="text-xs font-semibold text-[var(--color-text-primary)] cursor-pointer">
                      Content item is previewable (Default: True)
                    </label>
                  </div>
                </div>
              </div>

              {/* Module & Content Save Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingModule || !moduleTitle.trim()}
                  className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] text-xs md:text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingModule ? (
                    <>
                      <Loader2 className="w-4 h-4 anim-spin" />
                      <span>Saving Module &amp; Content...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Module &amp; Content</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* 2. EXISTING COURSE MODULES & CONTENT LIST (COLLAPSED BY DEFAULT, TAP TO EXPAND) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Existing Course Modules ({courseModules.length})
                </h3>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Tap any module to expand / collapse contents
                </span>
              </div>

              {loadingModules ? (
                <div className="flex items-center justify-center py-6 text-xs text-[var(--color-text-muted)] gap-2">
                  <Loader2 className="w-4 h-4 anim-spin text-[var(--color-tangerine)]" />
                  <span>Loading modules and content...</span>
                </div>
              ) : courseModules.length === 0 ? (
                <div className="p-6 text-center rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#E5DFD3] text-xs text-[var(--color-text-muted)]">
                  No modules created for this course yet. Use the form above to create your first module and content.
                </div>
              ) : (
                <div className="space-y-3">
                  {[...courseModules]
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((m) => {
                      const isExpanded = expandedModuleIds.includes(m.id);
                      const isEditingThisModule = editingModuleId === m.id;

                      return (
                        <div
                          key={m.id}
                          className="rounded-[var(--radius-md)] border border-[#E5DFD3] bg-[var(--color-surface)] overflow-hidden shadow-xs"
                        >
                          {/* Module Header - Tap to Expand/Collapse */}
                          <div className="p-3.5 bg-[var(--color-soft-cream)] border-b border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            {/* Left: Tap to Expand / Collapse toggle and Info */}
                            <div
                              onClick={() => toggleModuleCollapse(m.id)}
                              className="flex items-center gap-2.5 cursor-pointer flex-1 select-none"
                            >
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-black/5 text-[var(--color-text-muted)]"
                                aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-[var(--color-tangerine)]" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                                )}
                              </button>

                              {/* Display Order Selector: Changing one auto changes others */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 shrink-0"
                                title="Change display order (auto-shifts others)"
                              >
                                <span className="text-[11px] font-bold text-[var(--color-text-muted)]">
                                  Order:
                                </span>
                                <select
                                  value={m.display_order}
                                  onChange={(e) =>
                                    handleModuleOrderChange(m.id, Number(e.target.value))
                                  }
                                  className="text-xs font-mono font-bold text-[var(--color-tangerine)] bg-[var(--color-surface)] border border-[#D5CDBD] rounded px-1.5 py-0.5 outline-none cursor-pointer"
                                >
                                  {courseModules.map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                      #{i + 1}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                                {m.title}
                              </span>

                              {m.is_preview ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] border border-[var(--color-tangerine)]/30">
                                  Preview Available
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                  Locked
                                </span>
                              )}

                              <span className="text-[11px] text-[var(--color-text-muted)] ml-auto sm:ml-0">
                                ({m.contents?.length || 0} lessons)
                              </span>
                            </div>

                            {/* Right: Actions (Edit Module, Add Content, Delete Module) */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              {/* Edit Module Button */}
                              <button
                                type="button"
                                onClick={() => startEditModule(m)}
                                className="btn btn-outline text-[11px] px-2.5 py-1 rounded-[var(--radius-sm)] flex items-center gap-1 cursor-pointer"
                                title="Edit Module Title & Preview status"
                              >
                                <Edit2 className="w-3 h-3 text-[var(--color-tangerine)]" />
                                <span>Edit Module</span>
                              </button>

                              {/* Add Content Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isExpanded) toggleModuleCollapse(m.id);
                                  setActiveModuleForContent(
                                    activeModuleForContent === m.id ? null : m.id
                                  );
                                }}
                                className="btn btn-outline text-[11px] px-2.5 py-1 rounded-[var(--radius-sm)] flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Content</span>
                              </button>

                              {/* Delete Module Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteModule(m.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 cursor-pointer rounded hover:bg-red-50"
                                title="Delete Module"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Edit Form for Module Header */}
                          {isEditingThisModule && (
                            <div className="p-3.5 bg-[var(--color-surface)] border-b border-[#E5DFD3] space-y-3">
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                Edit Module Details
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-2">
                                  <label className="form-label text-[11px] mb-1">
                                    Module Title
                                  </label>
                                  <input
                                    type="text"
                                    value={editModuleTitle}
                                    onChange={(e) => setEditModuleTitle(e.target.value)}
                                    className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-tangerine)]"
                                  />
                                </div>
                                <div className="flex items-center pt-4">
                                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editModuleIsPreview}
                                      onChange={(e) => setEditModuleIsPreview(e.target.checked)}
                                      className="w-4 h-4 accent-[var(--color-tangerine)] cursor-pointer"
                                    />
                                    <span>Preview Available</span>
                                  </label>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingModuleId(null)}
                                  className="btn btn-outline text-xs px-2.5 py-1 flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={savingEditModule || !editModuleTitle.trim()}
                                  onClick={() => handleSaveModuleEdit(m.id)}
                                  className="btn btn-primary text-xs px-3 py-1 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {savingEditModule ? (
                                    <Loader2 className="w-3 h-3 anim-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  <span>Save Module</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Module Content Items (Shown ONLY if expanded by tap) */}
                          {isExpanded && (
                            <div className="p-3.5 space-y-3 bg-[var(--color-surface)] anim-fade-in">
                              {(!m.contents || m.contents.length === 0) ? (
                                <div className="text-xs text-[var(--color-text-muted)] italic py-2">
                                  No content items in this module yet. Click &quot;Add Content&quot; above to add lessons.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {m.contents.map((item) => {
                                    const isEditingThisContent = editingContentId === item.id;

                                    if (isEditingThisContent) {
                                      return (
                                        <div
                                          key={item.id}
                                          className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-soft-cream)] border border-[var(--color-tangerine)]/40 space-y-2"
                                        >
                                          <div className="text-xs font-bold text-[var(--color-text-primary)]">
                                            Edit Lesson Content
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                            <div>
                                              <label className="form-label text-[11px] mb-1">
                                                Emoji
                                              </label>
                                              <input
                                                type="text"
                                                value={editContentEmoji}
                                                onChange={(e) => setEditContentEmoji(e.target.value)}
                                                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2 py-1 text-xs text-center outline-none"
                                              />
                                            </div>
                                            <div className="sm:col-span-3">
                                              <label className="form-label text-[11px] mb-1">
                                                Content Text
                                              </label>
                                              <input
                                                type="text"
                                                value={editContentText}
                                                onChange={(e) => setEditContentText(e.target.value)}
                                                className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2.5 py-1 text-xs outline-none focus:border-[var(--color-tangerine)]"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between pt-1">
                                            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={editContentIsPreview}
                                                onChange={(e) => setEditContentIsPreview(e.target.checked)}
                                                className="accent-[var(--color-tangerine)]"
                                              />
                                              <span>Allow Public Preview</span>
                                            </label>

                                            <div className="flex gap-2">
                                              <button
                                                type="button"
                                                onClick={() => setEditingContentId(null)}
                                                className="btn btn-outline text-xs px-2.5 py-1"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleSaveContentEdit(item.id)}
                                                disabled={savingEditContent || !editContentText.trim()}
                                                className="btn btn-primary text-xs px-3 py-1 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                              >
                                                {savingEditContent ? (
                                                  <Loader2 className="w-3 h-3 anim-spin" />
                                                ) : (
                                                  <Save className="w-3 h-3" />
                                                )}
                                                <span>Save</span>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={item.id}
                                        className="flex items-start justify-between p-2.5 rounded-[var(--radius-sm)] bg-[#FAF8F3] border border-[#EBE5D8] text-xs"
                                      >
                                        <div className="flex items-start gap-2.5 flex-1">
                                          <span className="text-sm shrink-0">{item.emoji || '📄'}</span>
                                          <div>
                                            <p className="text-[var(--color-text-primary)] font-medium leading-relaxed">
                                              {item.content}
                                            </p>
                                            {item.is_preview ? (
                                              <span className="text-[10px] text-[var(--color-tangerine)] font-semibold mt-0.5 inline-block">
                                                Public Preview
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-gray-500 font-semibold mt-0.5 inline-block">
                                                Enrolled Only
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                          <button
                                            type="button"
                                            onClick={() => startEditContent(item)}
                                            className="text-gray-500 hover:text-[var(--color-tangerine)] p-1 cursor-pointer"
                                            title="Edit Content"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteContent(item.id)}
                                            className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                                            title="Delete Content Item"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Quick Add Content Drawer to this specific module */}
                              {activeModuleForContent === m.id && (
                                <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-soft-cream)] border border-[#D5CDBD] space-y-3 anim-fade-in">
                                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                    Add Additional Content to &quot;{m.title}&quot;
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                    <div>
                                      <label className="form-label text-[11px] mb-1">Emoji</label>
                                      <input
                                        type="text"
                                        value={extraEmoji}
                                        onChange={(e) => setExtraEmoji(e.target.value)}
                                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-center"
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <label className="form-label text-[11px] mb-1">Content Text</label>
                                      <input
                                        type="text"
                                        value={extraContent}
                                        onChange={(e) => setExtraContent(e.target.value)}
                                        placeholder="e.g. Chapter 1: Installing dependencies..."
                                        className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)]"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={extraIsPreview}
                                        onChange={(e) => setExtraIsPreview(e.target.checked)}
                                        className="accent-[var(--color-tangerine)]"
                                      />
                                      <span>Allow Public Preview (Default: True)</span>
                                    </label>

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setActiveModuleForContent(null)}
                                        className="btn btn-outline text-xs px-2.5 py-1"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveExtraContent(m.id)}
                                        disabled={savingExtraContent || !extraContent.trim()}
                                        className="btn btn-primary text-xs px-3 py-1 font-semibold cursor-pointer"
                                      >
                                        {savingExtraContent ? 'Saving...' : 'Save Content'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OpenCoursePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-main)]">
      <AdminHeader />

      <div className="flex flex-1 relative">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[var(--color-tangerine)] anim-spin" />
              </div>
            }
          >
            <OpenCourseContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
