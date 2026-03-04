import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Send, Plus, Trash2, GripVertical,
  Mic, List, CheckCircle, Volume2, Image, X, Loader2
} from 'lucide-react';
import api from '../../utils/api';

// ─── Empty state factories ────────────────────────────────────────────────────
const newOption = (i) => ({
  id: `opt-${Date.now()}-${i}`,
  option_type: 'text',        // 'text' | 'image'
  option_text: '',
  option_image_path: null,
  is_correct: i === 0,
  order_index: i,
});
const newMCQ = () => ({
  id: `q-${Date.now()}`,
  question_type: 'MCQ',
  question_text: '',
  points: 1,
  order_index: 0,
  audio_file_path: null,
  options: [newOption(0), newOption(1), newOption(2), newOption(3)],
});
const newListening = () => ({
  id: `q-${Date.now()}`,
  question_type: 'LISTENING',
  question_text: '',
  points: 1,
  order_index: 0,
  audio_file_path: null,
  _audioFile: null,
  _audioUploading: false,
  options: [newOption(0), newOption(1), newOption(2), newOption(3)],
});

// ─── QuizInfoPanel ─────────────────────────────────────────────────────────────
function QuizInfoPanel({ info, setInfo, courses }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Quiz Settings</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
        <input
          value={info.title}
          onChange={e => setInfo(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Unit 3 Reading Quiz"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course *</label>
        <select
          value={info.course_id}
          onChange={e => setInfo(p => ({ ...p, course_id: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
        >
          <option value="">Select a course…</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz Type</label>
        <div className="grid grid-cols-3 gap-2">
          {['READING', 'LISTENING', 'MIXED'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setInfo(p => ({ ...p, quiz_type: t }))}
              className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                info.quiz_type === t
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400'
              }`}
            >
              {t[0] + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Limit (min)</label>
          <input
            type="number"
            min={1}
            value={info.time_limit_minutes || ''}
            onChange={e => setInfo(p => ({ ...p, time_limit_minutes: e.target.value ? +e.target.value : null }))}
            placeholder="No limit"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Attempts</label>
          <input
            type="number"
            min={1}
            value={info.max_attempts}
            onChange={e => setInfo(p => ({ ...p, max_attempts: +e.target.value || 1 }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Open Date</label>
        <input
          type="datetime-local"
          value={info.open_date || ''}
          onChange={e => setInfo(p => ({ ...p, open_date: e.target.value || null }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Close Date</label>
        <input
          type="datetime-local"
          value={info.close_date || ''}
          onChange={e => setInfo(p => ({ ...p, close_date: e.target.value || null }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
        <textarea
          rows={3}
          value={info.description || ''}
          onChange={e => setInfo(p => ({ ...p, description: e.target.value }))}
          placeholder="Brief description shown to students…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"
        />
      </div>
    </div>
  );
}

// ─── QuestionCard ──────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onChange, onDelete, dragHandleProps }) {
  const [uploading, setUploading] = useState(false);

  const setCorrect = (optId) => {
    onChange({
      ...question,
      options: question.options.map(o => ({ ...o, is_correct: o.id === optId }))
    });
  };

  const setOptionText = (optId, text) => {
    onChange({
      ...question,
      options: question.options.map(o => o.id === optId ? { ...o, option_text: text } : o)
    });
  };

  const addOption = () => {
    if (question.options.length >= 6) return;
    onChange({ ...question, options: [...question.options, newOption(question.options.length)] });
  };

  const removeOption = (optId) => {
    if (question.options.length <= 2) return;
    const remaining = question.options.filter(o => o.id !== optId);
    const hasCorrect = remaining.some(o => o.is_correct);
    if (!hasCorrect && remaining.length) remaining[0].is_correct = true;
    onChange({ ...question, options: remaining });
  };

  // Toggle option between text and image type
  const toggleOptionType = (optId, newType) => {
    onChange({
      ...question,
      options: question.options.map(o =>
        o.id === optId
          ? { ...o, option_type: newType, option_text: '', option_image_path: null }
          : o
      )
    });
  };

  // Upload option image
  const handleOptionImageUpload = async (optId, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange({
        ...question,
        options: question.options.map(o =>
          o.id === optId ? { ...o, option_image_path: res.data.url } : o
        )
      });
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Image upload failed');
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/uploads/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange({ ...question, audio_file_path: res.data.url });
      toast.success('Audio uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Audio upload failed');
    } finally {
      setUploading(false);
    }
  };

  const typeColor = question.question_type === 'LISTENING'
    ? 'from-blue-500 to-cyan-500'
    : 'from-purple-500 to-indigo-500';
  const typeLabel = question.question_type === 'LISTENING' ? 'Listening' : 'Multiple Choice';
  const TypeIcon = question.question_type === 'LISTENING' ? Volume2 : List;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
    >
      {/* Card header */}
      <div className="flex items-start gap-3 mb-4">
        <div {...dragHandleProps} className="mt-1 cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical size={18} />
        </div>
        <div className={`w-8 h-8 bg-gradient-to-br ${typeColor} rounded-lg flex items-center justify-center shrink-0`}>
          <TypeIcon size={14} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold bg-gradient-to-r ${typeColor} bg-clip-text text-transparent`}>
              Q{index + 1} · {typeLabel}
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span>pts:</span>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={question.points}
                  onChange={e => onChange({ ...question, points: +e.target.value || 1 })}
                  className="w-14 px-1.5 py-0.5 text-center text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
              <button
                onClick={() => onDelete()}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question text */}
      <textarea
        rows={2}
        value={question.question_text}
        onChange={e => onChange({ ...question, question_text: e.target.value })}
        placeholder="Type your question here…"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition resize-none text-sm mb-4"
      />

      {/* Audio upload (Listening only) */}
      {question.question_type === 'LISTENING' && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
            <Mic size={12} /> Audio File
          </p>
          {question.audio_file_path ? (
            <div className="flex items-center gap-2">
              <audio controls className="flex-1 h-8" src={`http://localhost:8000${question.audio_file_path}`} />
              <button
                onClick={() => onChange({ ...question, audio_file_path: null })}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 py-2 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              {uploading
                ? <Loader2 size={16} className="animate-spin text-blue-500" />
                : <Volume2 size={16} className="text-blue-500" />}
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {uploading ? 'Uploading…' : 'Click to upload MP3 / WAV'}
              </span>
              <input type="file" accept=".mp3,.wav,audio/*" className="hidden" onChange={handleAudioUpload} disabled={uploading} />
            </label>
          )}
        </div>
      )}

      {/* Options */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Answer Options</p>
        {question.options.map((opt) => (
          <div key={opt.id} className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-2.5">
            {/* Option row: correct radio + type toggle + input + delete */}
            <div className="flex items-center gap-2">
              {/* Correct answer indicator */}
              <button
                type="button"
                onClick={() => setCorrect(opt.id)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  opt.is_correct
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                }`}
              >
                {opt.is_correct && <CheckCircle size={12} className="text-white" />}
              </button>

              {/* Text / Image type toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleOptionType(opt.id, 'text')}
                  className={`px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                    (opt.option_type || 'text') === 'text'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <List size={11} /> Text
                </button>
                <button
                  type="button"
                  onClick={() => toggleOptionType(opt.id, 'image')}
                  className={`px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                    (opt.option_type || 'text') === 'image'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <Image size={11} /> Image
                </button>
              </div>

              {/* Text input or image upload */}
              {(opt.option_type || 'text') === 'text' ? (
                <input
                  value={opt.option_text}
                  onChange={e => setOptionText(opt.id, e.target.value)}
                  placeholder={`Option ${question.options.indexOf(opt) + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              ) : (
                <div className="flex-1">
                  {opt.option_image_path ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={`http://localhost:8000${opt.option_image_path}`}
                        alt="option"
                        className="h-12 w-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => onChange({ ...question, options: question.options.map(o => o.id === opt.id ? { ...o, option_image_path: null } : o) })}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1 py-1.5 px-3 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors text-xs text-purple-600 dark:text-purple-400">
                      <Image size={13} /> Upload image…
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleOptionImageUpload(opt.id, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Delete option */}
              {question.options.length > 2 && (
                <button
                  onClick={() => removeOption(opt.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {question.options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> Add option
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main QuizBuilder Page ─────────────────────────────────────────────────────
export default function QuizBuilder() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const queryClient = useQueryClient();
  const isEdit = Boolean(quizId);

  const [info, setInfo] = useState({
    title: '', course_id: navState?.prefill_course_id || '', quiz_type: 'READING',
    time_limit_minutes: null, max_attempts: 1,
    open_date: null, close_date: null, description: ''
  });
  const [questions, setQuestions] = useState([]);
  const [quizDbId, setQuizDbId] = useState(quizId || null);
  const [saving, setSaving] = useState(false);

  // Load teacher's courses
  const { data: courses = [] } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: async () => (await api.get('/teacher/courses')).data
  });

  // Load existing quiz when editing
  const { data: existingQuiz } = useQuery({
    queryKey: ['quiz-edit', quizId],
    enabled: isEdit,
    queryFn: async () => (await api.get(`/teacher/quizzes/${quizId}`)).data
  });

  useEffect(() => {
    if (existingQuiz) {
      setInfo({
        title: existingQuiz.title,
        course_id: existingQuiz.course_id,
        quiz_type: existingQuiz.quiz_type,
        time_limit_minutes: existingQuiz.time_limit_minutes,
        max_attempts: existingQuiz.max_attempts,
        open_date: existingQuiz.open_date ? existingQuiz.open_date.slice(0, 16) : null,
        close_date: existingQuiz.close_date ? existingQuiz.close_date.slice(0, 16) : null,
        description: existingQuiz.description || ''
      });
      // Map existing questions to local state format
      setQuestions(existingQuiz.questions.map(q => ({
        ...q,
        id: q.id || `q-${Date.now()}`,
        options: (q.options || []).map((o, i) => ({ ...o, id: o.id || `opt-${Date.now()}-${i}` }))
      })));
    }
  }, [existingQuiz]);

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);

  // ── Save draft (quiz header) ──────────────────────────────────────────────
  // Helper: build the questions-sync API calls for a given quiz id
  const saveQuestions = async (qId, currentQuestions) => {
    // Delete all existing questions first (handles re-save)
    const existingQs = existingQuiz?.questions || [];
    for (const q of existingQs) {
      await api.delete(`/teacher/quizzes/${qId}/questions/${q.id}`).catch(() => {});
    }
    // Write current questions
    for (let i = 0; i < currentQuestions.length; i++) {
      const q = currentQuestions[i];
      await api.post(`/teacher/quizzes/${qId}/questions`, {
        question_type: q.question_type,
        question_text: q.question_text || 'Untitled question',
        audio_file_path: q.audio_file_path || null,
        points: q.points || 1,
        order_index: i,
        options: (q.options || []).map((o, j) => ({
          option_text: o.option_text || '',
          option_image_path: o.option_image_path || null,
          is_correct: Boolean(o.is_correct),
          order_index: j,
        }))
      });
    }
  };

  const saveQuiz = async () => {
    if (!info.title.trim()) { toast.error('Please enter a quiz title'); return null; }
    if (!info.course_id) { toast.error('Please select a course'); return null; }
    setSaving(true);

    const parseError = (err) => {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
      return detail || err.message || 'Save failed';
    };

    // Send dates exactly as the teacher typed them (local time).
    // The backend uses datetime.now() for comparison (also local), so they match.
    const buildPayload = () => ({
      title: info.title.trim(),
      description: info.description || null,
      quiz_type: info.quiz_type,
      time_limit_minutes: info.time_limit_minutes || null,
      max_attempts: info.max_attempts || 1,
      open_date: info.open_date || null,
      close_date: info.close_date || null,
    });

    try {
      let qId = quizDbId;

      if (!qId) {
        // ── First save: create quiz header + save all questions right away ──
        const res = await api.post('/teacher/quizzes', {
          ...buildPayload(),
          course_id: info.course_id,
        });
        qId = res.data.id;
        setQuizDbId(qId);

        // Save any questions the teacher already added before clicking Save
        if (questions.length > 0) {
          await saveQuestions(qId, questions);
        }

        toast.success('Quiz saved!');
        // Silently update URL to edit path without remounting
        navigate(`/teacher/quizzes/${qId}/edit`, { replace: true });
      } else {
        // ── Subsequent saves: update header + sync all questions ──
        await api.put(`/teacher/quizzes/${qId}`, buildPayload());
        await saveQuestions(qId, questions);
        queryClient.invalidateQueries(['quiz-edit', qId]);
        queryClient.invalidateQueries(['teacher-quizzes']);
        toast.success('Quiz saved!');
      }
      return qId;
    } catch (err) {
      toast.error(parseError(err));
      return null;
    } finally {
      setSaving(false);
    }
  };


  // ── Publish ───────────────────────────────────────────────────────────────
  const publish = async () => {
    const savedId = await saveQuiz();
    const idToUse = savedId || quizDbId;
    if (!idToUse) return;
    try {
      await api.post(`/teacher/quizzes/${idToUse}/publish`);
      toast.success('🎉 Quiz published! Students can now see it.');
      queryClient.invalidateQueries(['teacher-quizzes']);
      navigate('/teacher/quizzes');
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (detail || 'Publish failed'));
    }
  };

  // ── DnD reorder ───────────────────────────────────────────────────────────
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const list = Array.from(questions);
    const [moved] = list.splice(result.source.index, 1);
    list.splice(result.destination.index, 0, moved);
    setQuestions(list);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/quizzes')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {questions.length} questions · {totalPoints} total pts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveQuiz}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Draft
          </button>
          <button
            onClick={publish}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
          >
            <Send size={15} />
            Publish
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quiz info */}
        <div className="lg:col-span-1">
          <QuizInfoPanel info={info} setInfo={setInfo} courses={courses} />
        </div>

        {/* Right: Questions */}
        <div className="lg:col-span-2 space-y-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  <AnimatePresence>
                    {questions.map((q, i) => (
                      <Draggable key={q.id} draggableId={q.id} index={i}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps}>
                            <QuestionCard
                              question={q}
                              index={i}
                              dragHandleProps={prov.dragHandleProps}
                              onChange={(updated) => setQuestions(qs => qs.map((x, j) => j === i ? updated : x))}
                              onDelete={() => setQuestions(qs => qs.filter((_, j) => j !== i))}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add question buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setQuestions(qs => [...qs, { ...newMCQ(), order_index: qs.length }])}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all font-medium text-sm"
            >
              <Plus size={16} />
              Add MCQ Question
            </button>
            <button
              onClick={() => setQuestions(qs => [...qs, { ...newListening(), order_index: qs.length }])}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-medium text-sm"
            >
              <Volume2 size={16} />
              Add Listening Question
            </button>
          </div>

          {questions.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <List size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Add your first question using the buttons above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
