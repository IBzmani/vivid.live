'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Sparkles, User, Bot, Loader2, ChevronDown, ChevronUp, Mic, MicOff, Check, Ban } from 'lucide-react';
import { chatWithCoCreator } from '../services/geminiService';
import { VisualManifest, Genre } from '../types';

interface Suggestion {
  type: 'script' | 'character' | 'environment';
  content: string;
  metadata?: any;
  id: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  suggestions?: Suggestion[];
}

interface CoCreatorAgentProps {
  script: string;
  manifest: VisualManifest;
  genre: Genre;
  onUpdateScript: (newScript: string) => void;
  onAddCharacter: (name: string, description: string) => void;
  onAddEnvironment: (name: string, mood: string) => void;
}

const CoCreatorAgent: React.FC<CoCreatorAgentProps> = ({
  script,
  manifest,
  genre,
  onUpdateScript,
  onAddCharacter,
  onAddEnvironment
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your Co-Creator Agent. I've analyzed your project and I'm ready to help you craft a blockbuster. What's on your mind? We can brainstorm the script, refine characters, or fix plot holes." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithCoCreator(userMessage, history, { script, manifest, genre });
      
      if (response) {
        const suggestions = processCommands(response);
        setMessages(prev => [...prev, { role: 'model', text: response, suggestions }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I couldn't generate a response. Please try again." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Let's try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const processCommands = (text: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // [UPDATE_SCRIPT]: New script content here...
    const scriptMatch = text.match(/\[UPDATE_SCRIPT\]:\s*([\s\S]*?)(?=\[|$)/);
    if (scriptMatch) {
      suggestions.push({
        id: `s-script-${Date.now()}`,
        type: 'script',
        content: scriptMatch[1].trim()
      });
    }

    // [ADD_CHARACTER]: Name | Description
    const charMatches = text.matchAll(/\[ADD_CHARACTER\]:\s*(.*?)\s*\|\s*(.*?)(?=\[|$)/g);
    for (const match of charMatches) {
      suggestions.push({
        id: `s-char-${Date.now()}-${Math.random()}`,
        type: 'character',
        content: match[2].trim(),
        metadata: { name: match[1].trim() }
      });
    }

    // [ADD_ENVIRONMENT]: Name | Description/Mood
    const envMatches = text.matchAll(/\[ADD_ENVIRONMENT\]:\s*(.*?)\s*\|\s*(.*?)(?=\[|$)/g);
    for (const match of envMatches) {
      suggestions.push({
        id: `s-env-${Date.now()}-${Math.random()}`,
        type: 'environment',
        content: match[2].trim(),
        metadata: { name: match[1].trim() }
      });
    }

    return suggestions;
  };

  const approveSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === 'script') {
      onUpdateScript(suggestion.content);
    } else if (suggestion.type === 'character') {
      onAddCharacter(suggestion.metadata.name, suggestion.content);
    } else if (suggestion.type === 'environment') {
      onAddEnvironment(suggestion.metadata.name, suggestion.content);
    }

    // Remove suggestion from UI
    setMessages(prev => prev.map(m => ({
      ...m,
      suggestions: m.suggestions?.filter(s => s.id !== suggestion.id)
    })));
  };

  const declineSuggestion = (suggestion: Suggestion) => {
    setMessages(prev => prev.map(m => ({
      ...m,
      suggestions: m.suggestions?.filter(s => s.id !== suggestion.id)
    })));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '60px' : '500px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-96 bg-obsidian border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden mb-4 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 bg-primary rounded-full flex items-center justify-center text-obsidian">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Co-Creator Agent</h3>
                  <p className="text-[8px] text-primary font-bold uppercase tracking-widest">Master Director</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400"
                >
                  {isMinimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                >
                  {messages.map((m, i) => (
                    <div key={i} className="space-y-3">
                      <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`size-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${m.role === 'user' ? 'bg-indigo-500' : 'bg-primary text-obsidian'}`}>
                            {m.role === 'user' ? <User className="size-3" /> : <Bot className="size-3" />}
                          </div>
                          <div className={`p-3 rounded-2xl text-[11px] leading-relaxed ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-100 rounded-tr-none' : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'}`}>
                            {m.text.split('\n').map((line, idx) => (
                              <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Suggestions UI */}
                      {m.suggestions && m.suggestions.length > 0 && (
                        <div className="ml-9 space-y-2">
                          {m.suggestions.map((s) => (
                            <motion.div 
                              key={s.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white/5 border border-primary/20 rounded-xl p-3 flex flex-col gap-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                                  Suggestion: {s.type}
                                </span>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => approveSuggestion(s)}
                                    className="size-6 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center hover:bg-emerald-500/40 transition-colors"
                                    title="Approve & Create"
                                  >
                                    <Check className="size-3" />
                                  </button>
                                  <button 
                                    onClick={() => declineSuggestion(s)}
                                    className="size-6 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center hover:bg-rose-500/40 transition-colors"
                                    title="Decline"
                                  >
                                    <Ban className="size-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {s.type === 'script' ? (
                                  <p className="italic line-clamp-2">&quot;{s.content}&quot;</p>
                                ) : (
                                  <p><span className="text-white font-bold">{s.metadata.name}:</span> {s.content}</p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] flex gap-3">
                        <div className="size-6 rounded-full bg-primary flex items-center justify-center text-obsidian shrink-0 mt-1">
                          <Bot className="size-3" />
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 text-slate-300 rounded-tl-none border border-white/5 flex items-center gap-2">
                          <Loader2 className="size-3 animate-spin text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask your co-creator..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-24 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all resize-none h-20"
                    />
                    <div className="absolute right-3 bottom-3 flex gap-2">
                      <button
                        onClick={toggleListening}
                        className={`size-8 rounded-lg flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                      >
                        {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="size-8 bg-primary text-obsidian rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        <Send className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-600 mt-2 uppercase tracking-widest font-bold text-center">
                    Agent suggestions require your approval to execute
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`size-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-primary text-obsidian' : 'bg-obsidian border border-primary/30 text-primary hover:bg-primary/10'}`}
      >
        <MessageSquare className="size-6" />
        {!isOpen && (
          <div className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full border-2 border-obsidian animate-pulse"></div>
        )}
      </motion.button>
    </div>
  );
};

export default CoCreatorAgent;
