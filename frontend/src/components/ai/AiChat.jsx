import { useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Send, Sparkles, UserRound } from 'lucide-react';
import Button from '../ui/Button.jsx';
import AiMark from './AiMark.jsx';
import { ask } from '../../services/ai.service.js';
import { formatDateTime } from '../../utils/format.js';

export default function AiChat({ workspaceId, range, suggestions = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const lastQuestion = useRef('');

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }

  async function submit(question) {
    const trimmed = (question ?? '').trim();
    if (!trimmed || loading || !workspaceId) return;

    lastQuestion.current = trimmed;
    setInput('');
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setLoading(true);
    scrollToBottom();

    try {
      const data = await ask({
        workspaceId,
        question: trimmed,
        from: range?.from,
        to: range?.to,
      });
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: data.answer,
          notice: data.notice,
          available: data.available,
          generatedAt: data.generatedAt,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', error: true, text: error.message || 'Unable to answer right now.' },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  function retry() {
    if (lastQuestion.current) submit(lastQuestion.current);
  }

  const lastMessage = messages[messages.length - 1];
  const canRetry = !loading && lastMessage && lastMessage.role === 'assistant' && lastMessage.error;

  return (
    <div className="surface-card flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-100">Ask about your analytics</h3>
          <p className="mt-0.5 text-xs text-ink-500">
            Answers use only your workspace's aggregated metrics.
          </p>
        </div>
        <Sparkles className="h-4 w-4 text-accent-400" />
      </div>

      <div
        ref={scrollRef}
        className="min-h-[12rem] flex-1 space-y-4 overflow-y-auto rounded-xl border border-base-700 bg-base-900/40 p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <Sparkles className="mb-2 h-5 w-5 text-accent-400" />
            <p className="text-sm text-ink-300">Ask a question to get started.</p>
            <p className="mt-1 text-xs text-ink-500">
              If the data can't answer your question, the assistant will say so.
            </p>
          </div>
        ) : (
          messages.map((message, index) =>
            message.role === 'user' ? (
              <div key={index} className="flex justify-end gap-2">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent-500/15 px-3.5 py-2 text-sm text-ink-100">
                  {message.text}
                </div>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-base-800 text-ink-400 ring-1 ring-base-700">
                  <UserRound className="h-3.5 w-3.5" />
                </span>
              </div>
            ) : (
              <div key={index} className="space-y-2">
                {message.text && (
                  <div
                    className={`max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm ${
                      message.error
                        ? 'border border-danger-500/30 bg-danger-500/10 text-danger-400'
                        : 'bg-base-800 text-ink-200'
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                {message.notice && (
                  <p className="flex items-start gap-1.5 text-xs text-warn-400">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{message.notice}</span>
                  </p>
                )}
                <div className="flex items-center gap-3 pl-1">
                  {message.available && !message.error && <AiMark label="AI answer" />}
                  {message.generatedAt && !message.error && (
                    <span className="text-[11px] text-ink-600">
                      {formatDateTime(message.generatedAt)}
                    </span>
                  )}
                </div>
              </div>
            )
          )
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.slice(0, 4).map((question) => (
            <button
              key={question}
              type="button"
              disabled={loading}
              onClick={() => submit(question)}
              className="rounded-none border border-base-700 bg-base-900/60 px-3 py-1.5 text-xs text-ink-300 transition hover:border-accent-600/50 hover:text-ink-100 disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={300}
          placeholder="e.g. Which campaign deserves more attention?"
          disabled={loading || !workspaceId}
          className="h-11 w-full rounded-xl border border-base-600 bg-base-850 px-3 text-sm text-ink-100 placeholder:text-ink-500 transition focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:opacity-60"
        />
        {canRetry && (
          <Button variant="secondary" icon={RefreshCw} onClick={retry}>
            Retry
          </Button>
        )}
        <Button type="submit" icon={Send} loading={loading} disabled={!input.trim() || !workspaceId}>
          Ask
        </Button>
      </form>
    </div>
  );
}
