'use client';

import { useState } from 'react';
import {
  addQuestionToExam,
  QuestionInput,
  ExamQuestion,
} from '@/lib/courseexamsStore';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AddQuestionProps {
  isOpen: boolean;
  onClose: () => void;
  examId?: string; // If exam already exists in DB, will insert directly
  onQuestionAdded?: (input: QuestionInput, savedQuestion?: ExamQuestion) => void;
}

export default function AddQuestionModal({
  isOpen,
  onClose,
  examId,
  onQuestionAdded,
}: AddQuestionProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [hint, setHint] = useState('');
  const [choices, setChoices] = useState<string[]>(['', '', '', '']);
  const [answerIndex, setAnswerIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChoiceChange = (index: number, val: string) => {
    setChoices((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleAddChoiceSlot = () => {
    setChoices((prev) => [...prev, '']);
  };

  const handleRemoveChoiceSlot = (index: number) => {
    if (choices.length <= 2) {
      setError('A question must have at least 2 choices.');
      return;
    }
    setChoices((prev) => prev.filter((_, i) => i !== index));
    if (answerIndex === index) {
      setAnswerIndex(0);
    } else if (answerIndex > index) {
      setAnswerIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please provide the question text.');
      return;
    }

    const filteredChoices = choices.map((c) => c.trim());
    if (filteredChoices.some((c) => !c)) {
      setError('All choice fields must be filled in. Remove any unused choices.');
      return;
    }

    if (filteredChoices.length < 2) {
      setError('Please provide at least 2 choices.');
      return;
    }

    if (answerIndex < 0 || answerIndex >= filteredChoices.length) {
      setError('Please select one of the choices as the correct answer.');
      return;
    }

    const questionInput: QuestionInput = {
      question: trimmedQuestion,
      description: description.trim() || undefined,
      hint: hint.trim() || undefined,
      choices: filteredChoices,
      answerIndex,
    };

    // If examId is provided and saved in DB, insert directly via store
    if (examId) {
      setLoading(true);
      try {
        const { data, error: err } = await addQuestionToExam(examId, questionInput);
        if (err || !data) {
          setError(err?.message || 'Failed to save question.');
          setLoading(false);
          return;
        }

        if (onQuestionAdded) {
          onQuestionAdded(questionInput, data);
        }
        resetAndClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding question.');
      } finally {
        setLoading(false);
      }
    } else {
      // Local addition (e.g. while composing new exam before submit)
      if (onQuestionAdded) {
        onQuestionAdded(questionInput);
      }
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setQuestion('');
    setDescription('');
    setHint('');
    setChoices(['', '', '', '']);
    setAnswerIndex(0);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A0A]/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-[var(--color-surface)] border border-[#E5DFD3] rounded-[var(--radius-lg)] shadow-xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E5DFD3] bg-[var(--color-soft-cream)]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)]">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                Add Question
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Enter question details, choices, and select the correct answer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[#E5DFD3]/40 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Question Text */}
          <div>
            <label
              htmlFor="question_text"
              className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
            >
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              id="question_text"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the primary purpose of state in React?"
              required
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="question_description"
              className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1"
            >
              Description <span className="text-xs font-normal text-[var(--color-text-muted)]">(optional context or code snippet)</span>
            </label>
            <textarea
              id="question_description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context or code block for this question..."
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] p-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            />
          </div>

          {/* Hint */}
          <div>
            <label
              htmlFor="question_hint"
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)] mb-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[var(--color-tangerine)]" />
              <span>Hint</span>
              <span className="text-xs font-normal text-[var(--color-text-muted)]">(optional)</span>
            </label>
            <input
              id="question_hint"
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Think about component re-rendering and data encapsulation"
              className="w-full rounded-[var(--radius-md)] border border-[#D5CDBD] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-tangerine)] focus:ring-1 focus:ring-[var(--color-tangerine)] outline-none"
            />
          </div>

          {/* Choices Section */}
          <div className="pt-2 border-t border-[#E5DFD3]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                  Answer Choices <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Add multiple options and select the radio button for the correct answer.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddChoiceSlot}
                className="btn btn-outline inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--color-tangerine)] border-dashed border-[var(--color-tangerine)]/50 hover:bg-[var(--color-soft-orange)]/30 rounded-[var(--radius-md)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Choice</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {choices.map((choiceText, idx) => {
                const isSelectedAnswer = answerIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-[var(--radius-md)] border transition-all ${
                      isSelectedAnswer
                        ? 'border-[var(--color-tangerine)] bg-[var(--color-soft-orange)]/20 shadow-xs'
                        : 'border-[#D5CDBD] bg-[var(--color-surface)]'
                    }`}
                  >
                    {/* Radio Button to select correct answer */}
                    <label
                      htmlFor={`choice_radio_${idx}`}
                      className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none"
                      title="Select as correct answer"
                    >
                      <input
                        type="radio"
                        id={`choice_radio_${idx}`}
                        name="correct_choice_radio"
                        checked={isSelectedAnswer}
                        onChange={() => setAnswerIndex(idx)}
                        className="w-4 h-4 text-[var(--color-tangerine)] accent-[var(--color-tangerine)] cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-[var(--color-text-secondary)] w-4 text-center">
                        {String.fromCharCode(65 + idx)}
                      </span>
                    </label>

                    {/* Choice text input */}
                    <input
                      type="text"
                      value={choiceText}
                      onChange={(e) => handleChoiceChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      required
                      className="flex-1 rounded-[var(--radius-sm)] border border-[#E5DFD3] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[var(--color-tangerine)] outline-none"
                    />

                    {/* Badge if selected */}
                    {isSelectedAnswer && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold bg-[var(--color-primary-subtle)] text-[var(--color-tangerine)] shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Correct
                      </span>
                    )}

                    {/* Delete choice button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveChoiceSlot(idx)}
                      disabled={choices.length <= 2}
                      className="p-1 text-[var(--color-text-muted)] hover:text-red-500 rounded-[var(--radius-sm)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shrink-0"
                      title="Delete choice"
                      aria-label={`Delete Option ${String.fromCharCode(65 + idx)}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={resetAndClose}
              className="btn btn-outline px-4 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] border border-[#D5CDBD] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-5 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 anim-spin" />
                  <span>Saving Question...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Question</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
