import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, MicOff, AlertCircle, Clock, Volume2, Loader2, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Card from '../../components/ui/Card';

const AiAdvisor = () => {
  const [isListening, setIsListening] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [translations, setTranslations] = useState({}); // { messageIndex: translation }
  const [selectedAccent, setSelectedAccent] = useState(() => localStorage.getItem('ai_accent') || 'en-US');
  
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['ai-advisor-status'],
    queryFn: async () => {
      const response = await api.get('/student/ai-advisor/status');
      return response.data;
    },
    refetchInterval: 60000 // Refetch every minute to sync
  });

  // Tick time mutation
  const tickMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch('/student/ai-advisor/tick-time');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-advisor-status'], data);
    }
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (text) => {
      const response = await api.post('/student/ai-advisor/chat', { text });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Optimistically update the history instantly!
      queryClient.setQueryData(['ai-advisor-status'], (old) => {
        if (!old) return old;
        
        const newUserMsg = { role: 'user', content: variables };
        const newAiMsg = { role: 'assistant', content: data.reply };
        
        return {
          ...old,
          time_remaining_seconds: data.time_remaining_seconds,
          history: [...(old.history || []), newUserMsg, newAiMsg]
        };
      });
      
      // Still trigger a background sync just to be safe, but with 'refetchType: none' 
      // so it doesn't cause UI flickering or re-renders until data actually arrives.
      queryClient.invalidateQueries({ queryKey: ['ai-advisor-status'], refetchType: 'none' });
      
      speakResponse(data.reply);
    },
    onError: (error) => {
      setIsProcessing(false);
      toast.error(error.response?.data?.detail || 'Failed to communicate with AI');
    }
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/student/ai-advisor/history');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-advisor-status']);
      setTranscript('');
      setTranslations({});
      toast.success('Conversation history reset!');
    }
  });

  // Settings mutation
  const settingsMutation = useMutation({
    mutationFn: async (native_language) => {
      const response = await api.patch('/student/ai-advisor/settings', { native_language });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-advisor-status']);
      toast.success('Native language updated!');
    }
  });

  // Translate mutation
  const translateMutation = useMutation({
    mutationFn: async ({ text, index }) => {
      const response = await api.post('/student/ai-advisor/translate', { text });
      return { translation: response.data.translation, index };
    },
    onSuccess: ({ translation, index }) => {
      setTranslations(prev => ({ ...prev, [index]: translation }));
      setSelectedText(''); // Hide button after success
    },
    onError: () => {
        toast.error('Failed to translate');
    }
  });

  // Tick timer while engaged (in room)
  useEffect(() => {
    if (!status?.has_access) return;

    const interval = setInterval(() => {
      // Call backend to consume 1 minute
      tickMutation.mutate();
    }, 60000); // Every 60s

    return () => clearInterval(interval);
  }, [status?.has_access]);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [status?.history]);

  // Setup Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let currentTranscript = '';
      // We start from 0 to capture the ENTIRE accumulated transcript 
      // of this session, not just the new words (delta).
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);

      // --- SILENCE DETECTION LOGIC ---
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      // If we have content, start the silence timer. 
      // Increased to 3s to give you more room for natural pauses.
      if (currentTranscript.trim().length > 0) {
        silenceTimeoutRef.current = setTimeout(() => {
          handleStopListeningAndSend(currentTranscript);
        }, 3000);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast.error(`Microphone error: ${event.error}`);
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel(); // Stop talking on unmount
    };
  }, []);

  const handleStartListening = () => {
    if (!status?.has_access) {
      toast.error('You do not have active access or your time is up today!');
      setIsSessionActive(false);
      return;
    }
    
    // Ensure session is marked active
    setIsSessionActive(true);

    // Interrupt AI if it's talking
    if (isAiTalking) {
      window.speechSynthesis.cancel();
      setIsAiTalking(false);
    }
    
    setTranscript('');
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      // recognition might already be started, ignore
    }
  };

  const handleStopListeningAndSend = (finalTranscript) => {
    setIsListening(false);
    
    if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Use the passed transcript or the state one
    const textToSend = finalTranscript || transcript;

    if (textToSend.trim().length > 0) {
      setIsProcessing(true);
      setTranscript(textToSend); // Ensure UI shows the final words
      chatMutation.mutate(textToSend);
    } else {
      // In automatic mode, we don't toast if nothing was heard, just wait
      setTranscript('');
    }
  };

  const speakResponse = (text) => {
    if (!('speechSynthesis' in window)) {
      setIsProcessing(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find voice based on selected accent
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === selectedAccent && v.name.includes('Neural'))
               || voices.find(v => v.lang === selectedAccent && v.name.includes('Google')) 
               || voices.find(v => v.lang === selectedAccent)
               || voices.find(v => v.lang.startsWith('en') && v.name.includes('Neural'))
               || voices.find(v => v.lang.startsWith('en'));
                     
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 0.95; // Slightly slower for clear English practice
    
    utterance.onstart = () => {
      setIsProcessing(false);
      setIsAiTalking(true);
    };

    utterance.onend = () => {
      setIsAiTalking(false);
      // --- AUTO-RESUME LOOP ---
      // Automatically start listening again after the AI finishes speaking, but ONLY if session is still active
      if (isSessionActive) {
        setTimeout(() => {
          handleStartListening();
        }, 500); 
      }
    };

    utterance.onerror = (e) => {
      console.error('TTS Error', e);
      setIsProcessing(false);
      setIsAiTalking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Text selection handler
  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position the button slightly above the selection
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10
      });
      setSelectedText(text);
    } else {
      setSelectedText('');
    }
  };

  const handleTranslateClick = (index) => {
    if (selectedText) {
      translateMutation.mutate({ text: selectedText, index });
    }
  };

  const languages = ["Arabic", "Spanish", "French", "German", "Chinese", "Japanese", "Turkish", "Italian", "Portuguese", "Russian"];

  if (statusLoading && !status) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!status?.is_active) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-lg">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">AI Advisor Locked</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            This feature requires an active subscription. Please contact an administrator to enroll in the AI Speaking Advisor program.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-8 px-2 md:px-0">
      <div className="text-center">
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mb-2 md:mb-4">
          AI Speaking Advisor
        </h1>
        <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
          Practice your English dynamically. Your level: <span className="font-bold text-emerald-600">{status.level}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Left column: Timing & Session Control */}
        <Card className="col-span-1 md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 border-0 flex flex-col items-center justify-center p-6 md:p-8 text-white text-center">
          <Clock className={`w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-4 ${status.has_access ? 'text-emerald-400' : 'text-red-400'}`} />
          <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-slate-200">Daily Time Remaining</h3>
          <div className={`text-4xl md:text-5xl font-bold tracking-tight mb-2 md:mb-4 font-mono ${status.has_access ? 'text-white' : 'text-red-400'}`}>
            {formatTime(status.time_remaining_seconds)}
          </div>
          <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">
            Resets automatically at midnight.
          </p>

          <div className="w-full font-bold space-y-4">
             {/* Native Language Input */}
             <div className="text-left">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Native Language</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. Arabic, French..."
                    defaultValue={status.native_language || "Arabic"}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value !== status.native_language) {
                        settingsMutation.mutate(e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        settingsMutation.mutate(e.target.value);
                        e.target.blur();
                      }
                    }}
                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 italic">Press Enter to save</p>
             </div>

             {/* Accent Selection */}
             <div className="text-left mt-4 mb-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Accent</label>
                <select 
                  value={selectedAccent}
                  onChange={(e) => {
                    setSelectedAccent(e.target.value);
                    localStorage.setItem('ai_accent', e.target.value);
                  }}
                  className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="en-US">American English</option>
                  <option value="en-GB">British English</option>
                  <option value="en-AU">Australian English</option>
                  <option value="en-IE">Irish English</option>
                  <option value="en-IN">Indian English</option>
                </select>
             </div>

             {!status.has_access ? (
                <div className="px-4 py-3 bg-red-900/40 text-red-400 rounded-xl font-bold border border-red-900/50 text-sm">
                  Time limit reached for today
                </div>
             ) : isSessionActive ? (
               <button
                onClick={() => {
                   setIsSessionActive(false);
                   setIsListening(false);
                   window.speechSynthesis.cancel();
                   if (recognitionRef.current) recognitionRef.current.stop();
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-all font-semibold text-base md:text-lg"
               >
                 <StopCircle className="w-5 h-5 md:w-6 md:h-6" /> End Conversation
               </button>
             ) : (
               <button
                disabled={isProcessing}
                onClick={handleStartListening}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all font-semibold text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Mic className="w-5 h-5 md:w-6 md:h-6" /> Start Conversation
               </button>
             )}
          </div>
        </Card>

        {/* Right columns: Visualizer Area */}
        <Card className="col-span-1 md:col-span-2 p-6 md:p-8 min-h-[350px] md:min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Main Visualizer Area */}
          <div className="relative w-32 h-32 md:w-48 md:h-48 mb-8 md:mb-12 flex items-center justify-center">
            {/* Pulsing ring for listening */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-blue-500 rounded-full"
                />
              )}
              {isAiTalking && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-500 rounded-full"
                />
              )}
            </AnimatePresence>
            
            <div className={`relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-500 ${
              isListening ? 'bg-blue-600' : isAiTalking ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-slate-700'
            }`}>
              {isProcessing ? (
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-white animate-spin" />
              ) : isAiTalking ? (
                <Volume2 className="w-10 h-10 md:w-12 md:h-12 text-white" />
              ) : isListening ? (
                <Mic className="w-10 h-10 md:w-12 md:h-12 text-white animate-pulse" />
              ) : (
                <MicOff className="w-10 h-10 md:w-12 md:h-12 text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>

          <div className="h-24 w-full text-center px-4 flex items-center justify-center overflow-auto">
            {transcript ? (
              <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 italic line-clamp-3">"{transcript}"</p>
            ) : isProcessing ? (
               <p className="text-emerald-500 font-medium animate-pulse text-sm md:text-base">AI is thinking...</p>
            ) : isListening ? (
              <p className="text-blue-500 animate-pulse font-medium text-sm md:text-base">Listening to you...</p>
            ) : isAiTalking ? (
              <p className="text-emerald-500 font-medium tracking-wide text-sm md:text-base">AI is speaking...</p>
            ) : isSessionActive ? (
              <p className="text-emerald-500 font-medium animate-pulse text-sm md:text-base">I'm listening! Say something...</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Press the button on the left to start</p>
            )}
          </div>
        </Card>
      </div>

      {/* Conversation Log Section - Always mounted to prevent layout jumps */}
      <Card className="p-4 md:p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-gray-100 dark:border-slate-800 transition-all duration-300">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Conversation Log</h3>
          </div>
          {status?.history?.length > 0 && (
            <button
              onClick={() => {
                  if (window.confirm('Are you sure you want to clear the conversation history?')) {
                      resetMutation.mutate();
                  }
              }}
              className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded bg-red-50 dark:bg-red-900/20"
            >
              Reset History
            </button>
          )}
        </div>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar min-h-[100px] flex flex-col">
          {status?.history?.length > 0 ? (
            <>
              {status.history.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  onMouseUp={msg.role === 'assistant' ? handleTextSelection : null}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm md:text-base selection:bg-emerald-500/30 ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 shadow-sm border border-gray-100 dark:border-slate-700 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Inline Translation Result */}
                    {translations[idx] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Translation</span>
                          <span className="text-[10px] text-gray-400 font-medium">{status.native_language}</span>
                        </div>
                        <p className="text-gray-600 dark:text-slate-400 italic text-sm leading-relaxed">
                          {translations[idx]}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 py-8">
              <Mic className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No messages yet. Start speaking to see the transcript!</p>
            </div>
          )}
        </div>
      </Card>

      {/* Floating Translate Button */}
      <AnimatePresence>
        {selectedText && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => {
              // Find which message index is closest to selection
              // For simplicity, we can use the last assistant message or better, 
              // check which message bubble is actually containing the selection.
              // Here we'll find the message containing the selection
              const selection = window.getSelection();
              const container = selection.anchorNode.parentElement;
              const messageEl = container.closest('.flex');
              if (messageEl) {
                // Find index in history
                const allMessages = document.querySelectorAll('.custom-scrollbar > div');
                const index = Array.from(allMessages).indexOf(messageEl);
                if (index !== -1) handleTranslateClick(index);
              }
            }}
            style={{
              position: 'absolute',
              left: selectionPosition.x,
              top: selectionPosition.y,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
            className="z-[100] flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl border border-slate-700 hover:bg-emerald-600 transition-colors text-sm font-semibold"
          >
            {translateMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Volume2 className="w-3 h-3 text-emerald-400" />
            )}
            Translate
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiAdvisor;
