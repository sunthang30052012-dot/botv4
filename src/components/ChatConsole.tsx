import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Trash2, ArrowDown, Terminal } from 'lucide-react';
import { parseMinecraftText } from '../utils/minecraftColors';

interface ChatConsoleProps {
  messages: string[];
  onSendMessage: (msg: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  messages,
  onSendMessage,
  onClear,
  disabled,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'player' | 'system'>('all');

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text) return;

    onSendMessage(text);
    setHistory((prev) => [...prev, text]);
    setHistoryIndex(-1);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx] || '');
      }
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'player') return m.includes('<') && m.includes('>');
    if (filter === 'system') return !m.includes('<') || m.includes('[HỆ THỐNG]') || m.includes('[SERVER]');
    return true;
  });

  return (
    <div className="bg-[#0b101b] border border-emerald-950/40 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-xs">Khung Xem Chat & Console Máy Chủ</h2>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 font-mono text-[11px] tabular-nums">
            {messages.length} dòng
          </span>
        </div>

        {/* Filter controls & Action buttons */}
        <div className="flex items-center gap-2">
          {/* Segmented filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => setFilter('player')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filter === 'player'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chat Người Chơi
            </button>
            <button
              type="button"
              onClick={() => setFilter('system')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filter === 'system'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hệ Thống
            </button>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Xóa nhật ký chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Terminal Box */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
          setAutoScroll(isAtBottom);
        }}
        className="h-64 overflow-y-auto bg-black border border-slate-800/80 rounded-lg p-3 font-mono text-xs text-slate-200 space-y-1 select-text"
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-[11px]">
            --- Hệ thống chat sẵn sàng. Chưa có tin nhắn mới ---
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const spans = parseMinecraftText(msg);
            return (
              <div key={idx} className="leading-relaxed break-words hover:bg-slate-900/30 px-1 rounded">
                {spans.map((span, sIdx) => (
                  <span
                    key={sIdx}
                    style={{ color: span.color }}
                    className={`${span.bold ? 'font-bold' : ''} ${span.italic ? 'italic' : ''}`}
                  >
                    {span.text}
                  </span>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn chat hoặc lệnh (/login, /msg, /spawn)..."
            disabled={disabled}
            className="w-full bg-[#111827] border border-slate-700/80 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-40"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !inputVal.trim()}
          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-sm shadow-emerald-950"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Gửi</span>
        </button>
      </form>
    </div>
  );
};
