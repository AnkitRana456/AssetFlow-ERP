import { useState, useRef, useEffect } from 'react';
import { useAiChat } from '../../hooks/enterpriseHooks';
import { 
  Sparkles, X, Send, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

export function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([
    { sender: 'assistant', text: 'Hello! I am your AI ERP Copilot. I can search assets, predict maintenance issues, and compile audit reports. How can I help you today?' }
  ]);

  const aiChatMutation = useAiChat();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keeps the chat panel scrolled to the latest message exchange
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim() || aiChatMutation.isPending) return;

    const query = textToSend.trim();
    setConversationHistory(prev => [...prev, { sender: 'user', text: query }]);
    setChatInput('');

    aiChatMutation.mutate(query, {
      onSuccess: (data) => {
        setConversationHistory(prev => [...prev, { sender: 'assistant', text: data.reply }]);
      },
      onError: (err: any) => {
        setConversationHistory(prev => [
          ...prev, 
          { sender: 'assistant', text: `❌ **Failed to resolve AI response.** ${err.response?.data?.message || err.message || 'Please check server connections.'}` }
        ]);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(chatInput);
  };

  const sampleQueries = [
    'Who has Laptop AST-LP-001?',
    'Show all overdue assets.',
    'Are there assets under maintenance?',
    'Generate inventory summary.'
  ];

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-650 text-white flex items-center justify-center shadow-2xl hover:shadow-indigo-500/30 transition-all border border-white/10 hover:scale-105 z-40 cursor-pointer"
        title="Ask ERP Copilot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 animate-pulse" />}
      </button>

      {/* Slide-over Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-24 right-6 w-[360px] sm:w-[400px] h-[550px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-40 flex flex-col overflow-hidden text-slate-100"
          >
            {/* Header with glow effect */}
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-4 border-b border-slate-800 flex items-center justify-between relative">
              <div className="absolute top-[-30%] right-[-10%] h-[100px] w-[100px] rounded-full bg-blue-500/10 blur-[50px]" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">ERP Copilot</h3>
                  <span className="text-[10px] text-emerald-450 font-semibold uppercase tracking-wider block">Gemini 1.5 Flash Enabled</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Transcript Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-850">
              {conversationHistory.map((msg, idx) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div 
                    key={idx} 
                    className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isAssistant 
                          ? 'bg-slate-800/80 border border-slate-750 text-slate-100 font-medium' 
                          : 'bg-indigo-600 text-white font-semibold'
                      }`}
                    >
                      {isAssistant ? (
                        // Standard parser for fallback bold text and checklists
                        msg.text.split('\n').map((line, lIdx) => (
                          <span key={lIdx} className="block mt-1 first:mt-0">
                            {line.startsWith('- ') || line.startsWith('* ') ? (
                              <span className="flex items-start gap-1">
                                <span className="text-blue-400">•</span>
                                <span>{line.replace(/^[-*]\s+/, '')}</span>
                              </span>
                            ) : line.startsWith('### ') ? (
                              <strong className="text-sm font-bold text-blue-450 block mt-2 mb-1">{line.replace(/^###\s+/, '')}</strong>
                            ) : (
                              <span>{line}</span>
                            )}
                          </span>
                        ))
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Spinner loader during Gemini queries */}
              {aiChatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/50 border border-slate-750/30 rounded-2xl p-3 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                    <span className="text-[10px] text-slate-400">Gemini is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Presets suggestions */}
            {conversationHistory.length === 1 && (
              <div className="p-3 bg-slate-950/40 border-t border-slate-850 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-1">Quick Queries</span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleQueries.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p)}
                      className="text-[10px] bg-slate-805 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-slate-200 py-1.5 px-2.5 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Submission */}
            <form 
              onSubmit={handleSubmit}
              className="p-3 bg-slate-950 border-t border-slate-850 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask assistant about inventory or repairs..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || aiChatMutation.isPending}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
