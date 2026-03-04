import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Clock, ChevronLeft, ChevronRight, Send, CheckCircle,
  XCircle, Award, RotateCcw, Volume2, Maximize2, X
} from 'lucide-react';
import api from '../../utils/api';

// ─── Timer ─────────────────────────────────────────────────────────────────────
function useTimer(seconds, onExpire) {
  const [remaining, setRemaining] = useState(seconds ?? null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (seconds == null) return;
    setRemaining(seconds);
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [seconds]);

  const fmt = () => {
    if (remaining == null) return null;
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return { remaining, formatted: fmt() };
}

// ─── Result screen ─────────────────────────────────────────────────────────────
function ResultScreen({ result, onBack }) {
  const pct = result.percentage;
  const grade = pct >= 80 ? { label: 'Excellent!', color: 'text-emerald-500', bg: 'from-emerald-400 to-green-500' }
    : pct >= 60 ? { label: 'Good job!', color: 'text-amber-500', bg: 'from-amber-400 to-orange-500' }
    : { label: 'Keep practicing', color: 'text-red-500', bg: 'from-red-400 to-rose-500' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center"
      >
        {/* Score circle */}
        <div className={`w-28 h-28 mx-auto mb-5 rounded-full bg-gradient-to-br ${grade.bg} flex flex-col items-center justify-center shadow-xl`}>
          <span className="text-3xl font-black text-white">{pct.toFixed(0)}%</span>
        </div>

        <h2 className={`text-2xl font-bold mb-1 ${grade.color}`}>{grade.label}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{result.quiz_title}</p>

        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.score}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Points scored</p>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-600" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.max_score}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total points</p>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-600" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">#{result.attempt_number}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Attempt</p>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="text-left space-y-2 max-h-60 overflow-y-auto pr-1 mb-6">
          {result.answers?.map((ans, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                ans.is_correct
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}
            >
              {ans.is_correct
                ? <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                : <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 dark:text-gray-200 line-clamp-2 font-medium">{ans.question_text}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ans.points_awarded} / {ans.max_points} pts
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Back to Quizzes
        </button>
      </motion.div>
    </div>
  );
}

// ─── Main QuizTake Page ────────────────────────────────────────────────────────
export default function QuizTake() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading'); // loading | taking | result
  const [quiz, setQuiz] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});   // questionId → optionId
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null); // enlarged image URL

  // Start the quiz
  useEffect(() => {
    const start = async () => {
      try {
        const res = await api.post(`/student/quizzes/${quizId}/start`);
        setQuiz(res.data.quiz);
        setSubmissionId(res.data.submission_id);
        setPhase('taking');
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to start quiz');
        navigate('/student/quizzes');
      }
    };
    start();
  }, [quizId]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: (quiz?.questions || []).map(q => ({
          question_id: q.id,
          selected_option_id: answers[q.id] || null
        }))
      };
      const res = await api.post(`/student/submissions/${submissionId}/submit`, payload);
      setResult(res.data);
      setPhase('result');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, submissionId, submitting]);

  const { formatted: timerDisplay, remaining } = useTimer(
    quiz?.time_limit_minutes ? quiz.time_limit_minutes * 60 : null,
    handleSubmit
  );

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Starting quiz…</p>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return <ResultScreen result={result} onBack={() => navigate('/student/quizzes')} />;
  }

  const questions = quiz?.questions || [];
  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const answered = Object.keys(answers).length;

  const timerColor = remaining != null && remaining < 60
    ? 'text-red-500 animate-pulse'
    : 'text-gray-700 dark:text-gray-300';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white text-sm">{quiz?.title}</h1>
          <p className="text-xs text-gray-400">{answered} / {questions.length} answered</p>
        </div>
        <div className="flex items-center gap-4">
          {timerDisplay && (
            <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timerColor}`}>
              <Clock size={18} />
              {timerDisplay}
            </div>
          )}
          <button
            onClick={() => {
              if (window.confirm('Submit quiz now?')) handleSubmit();
            }}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={14} />
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-1 bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {q && (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full shadow-sm"
            >
              {/* Question header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                  Q{currentQ + 1} of {questions.length}
                </span>
                <span className="text-xs text-gray-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                {q.question_type === 'LISTENING' && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Volume2 size={10} /> Listening
                  </span>
                )}
              </div>

              {/* Audio player */}
              {q.question_type === 'LISTENING' && q.audio_file_path && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">🎧 Listen carefully:</p>
                  <audio
                    controls
                    className="w-full"
                    src={`http://localhost:8000${q.audio_file_path}`}
                  />
                </div>
              )}

              {/* Question text */}
              <p className="text-gray-900 dark:text-white font-medium text-base leading-relaxed mb-6">
                {q.question_text}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {(q.options || []).map((opt) => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ${
                        selected
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all flex items-center justify-center ${
                          selected ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        {opt.option_image_path ? (
                          <div className="relative group flex-1">
                            <img
                              src={`http://localhost:8000${opt.option_image_path}`}
                              alt="option"
                              className="max-h-28 rounded-lg object-contain"
                            />
                            {/* Expand / zoom button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // don't select the option
                                setLightboxSrc(`http://localhost:8000${opt.option_image_path}`);
                              }}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              title="View full size"
                            >
                              <Maximize2 size={13} />
                            </button>
                          </div>
                        ) : (
                          opt.option_text
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 py-3 flex justify-between items-center">
        <button
          onClick={() => setCurrentQ(i => Math.max(0, i - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 text-sm font-medium"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        {/* Dot navigation */}
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentQ
                  ? 'bg-green-500 scale-125'
                  : answers[questions[i]?.id]
                  ? 'bg-green-300 dark:bg-green-700'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={() => { if (window.confirm('Submit quiz?')) handleSubmit(); }}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={15} /> Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQ(i => Math.min(questions.length - 1, i + 1))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────────── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxSrc}
              alt="Full size option"
              className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
