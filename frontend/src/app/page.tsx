'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Volume2, Sparkles, User, Settings, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { chatWithBlacko, checkAudioStatus } from '@/lib/api';
import { trackBlackoEvent, initAnalytics } from '@/lib/analytics';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isPoetic?: boolean;
  audioUrl?: string;
  audioStatus?: 'generating' | 'completed' | 'failed';
  messageId?: string;
}

export default function BlackoAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: "Yo, chale. I be Blacko AI. What's on your mind? The hustle, the music, or you just want some poetic vibes? Talk to me.",
      timestamp: new Date(),
      isPoetic: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initAnalytics();
    // Load local storage session if exists
    const storedSession = localStorage.getItem('blacko_session');
    if (storedSession) {
      const { sessionId, userId } = JSON.parse(storedSession);
      setSessionId(sessionId);
      setUserId(userId);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const pollForAudio = async (messageId: string, retryCount = 0) => {
    if (retryCount > 15) { // Stop after ~30 seconds (15 * 2s)
      setMessages(prev => prev.map(msg =>
        msg.messageId === messageId ? { ...msg, audioStatus: 'failed' } : msg
      ));
      return;
    }

    try {
      const status = await checkAudioStatus(messageId);

      if (status.status === 'completed' && status.audio_url) {
        setMessages(prev => prev.map(msg =>
          msg.messageId === messageId ? { ...msg, audioStatus: 'completed', audioUrl: status.audio_url } : msg
        ));
      } else if (status.status === 'failed') {
        setMessages(prev => prev.map(msg =>
          msg.messageId === messageId ? { ...msg, audioStatus: 'failed' } : msg
        ));
      } else {
        // Still generating or not found yet, retry in 2s
        setTimeout(() => pollForAudio(messageId, retryCount + 1), 2000);
      }
    } catch (e) {
      console.error("Polling error", e);
      setTimeout(() => pollForAudio(messageId, retryCount + 1), 2000);
    }
  };

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    if (!finalInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsTyping(true);
    trackBlackoEvent('prompt_sent', { text: finalInput });

    try {
      const response = await chatWithBlacko(finalInput, sessionId, userId);

      if (!sessionId) {
        setSessionId(response.session_id);
        setUserId(response.user_id);
        localStorage.setItem('blacko_session', JSON.stringify({
          sessionId: response.session_id,
          userId: response.user_id
        }));
        trackBlackoEvent('session_started', { sessionId: response.session_id });
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.response,
        timestamp: new Date(),
        isPoetic: true,
        audioUrl: response.audio_url || undefined,
        audioStatus: response.audio_status || 'completed', // 'completed' if legacy or immediate
        messageId: response.message_id
      };

      setMessages((prev) => [...prev, aiResponse]);
      trackBlackoEvent('response_received');

      // Start polling if status is generating
      if (response.audio_status === 'generating' && response.message_id) {
        pollForAudio(response.message_id);
      }

    } catch (error) {
      console.error(error);
      trackBlackoEvent('error_occurred', { error });
      // Add error message to chat
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: "Chale, network dey mess up or something. Try again.",
        timestamp: new Date(),
        isPoetic: false
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startVoiceCapture = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    // @ts-ignore
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(undefined, transcript);
    };

    recognition.start();
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      startVoiceCapture();
    }
  };

  const playAudio = (url: string, messageId: string) => {
    if (playingAudioId === messageId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.play().catch(e => console.error("Audio playback failed:", e));
    setPlayingAudioId(messageId);

    audio.onended = () => {
      setPlayingAudioId(null);
    };
  };

  return (
    <main className="flex h-screen w-full flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 glass-dark">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.5)]">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white/90 uppercase">
            Blacko <span className="text-red-500">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-white/60">
          <Info size={20} className="cursor-pointer hover:text-white transition-colors" />
          <Settings size={20} className="cursor-pointer hover:text-white transition-colors" />
        </div>
      </header>

      {/* Messages Area */}
      <section className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scrollbar-hide">
        <div className="max-w-3xl mx-auto flex flex-col space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === 'user' ? "bg-white/10" : "bg-red-600/20 text-red-500"
                )}>
                  {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                </div>
                <div className={cn(
                  "relative group",
                  msg.role === 'user' ? "message-bubble-user" : "message-bubble-ai"
                )}>
                  <p className={cn(
                    "text-[15px] leading-relaxed",
                    msg.isPoetic && "poetic-text text-white/90"
                  )}>
                    {msg.content}
                  </p>
                  <span className="text-[10px] text-white/30 mt-2 block opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'ai' && (
                    <div className="absolute -right-10 top-2 flex items-center justify-center w-8 h-8">
                      {msg.audioStatus === 'generating' ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-red-500 rounded-full animate-spin"></div>
                      ) : msg.audioUrl ? (
                        <button
                          onClick={() => playAudio(msg.audioUrl!, msg.id)}
                          className={cn(
                            "p-2 rounded-full transition-all group-hover:opacity-100",
                            // Keep visible if playing, otherwise fade with group hover
                            playingAudioId === msg.id ? "opacity-100 text-red-500 bg-white/10" : "opacity-0 hover:bg-white/5 text-white/40 hover:text-red-500"
                          )}
                        >
                          <Volume2 size={16} className={playingAudioId === msg.id ? "animate-pulse" : ""} />
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3"
            >
              <div className="h-8 w-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="message-bubble-ai py-4 px-6 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </section>

      {/* Input Area */}
      <footer className="p-4 border-t border-white/10 glass-dark">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSend}
            className="relative flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleRecording}
              className={cn(
                "p-3 rounded-full transition-all duration-300",
                isRecording
                  ? "bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                  : "bg-white/5 text-white/40 hover:text-white"
              )}
            >
              <Mic size={22} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Talk to Blacko..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[15px] focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={cn(
                "p-3 rounded-full transition-all duration-300",
                input.trim()
                  ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              )}
            >
              <Send size={22} />
            </button>
          </form>
          <p className="text-center text-[10px] text-white/20 mt-3 font-light tracking-wide uppercase">
            Ghana-focused intelligence • POETICALLY CRAFTED BY BLACKO
          </p>
        </div>
      </footer>
    </main>
  );
}
