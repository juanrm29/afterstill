"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { marked } from "marked";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onWordCountChange?: (count: number) => void;
}

// Configure marked for better rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Simple HTML sanitizer (DOMPurify alternative for SSR compatibility)
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  // Remove script tags and event handlers
  doc.querySelectorAll("script").forEach(el => el.remove());
  doc.querySelectorAll("*").forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
    });
  });
  return doc.body.innerHTML;
}

// Toolbar button component
function ToolbarButton({ 
  icon, 
  label, 
  onClick, 
  active = false,
  shortcut
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  active?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
      className={`p-2 rounded-lg transition-all ${
        active 
          ? "bg-zinc-700/60 text-zinc-300" 
          : "text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/50"
      }`}
    >
      {icon}
    </button>
  );
}

export default function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Begin writing...",
  onWordCountChange
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<"write" | "preview" | "split">("write");
  const [focusMode, setFocusMode] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 });

  // Word count
  const wordCount = useMemo(() => {
    return value.trim().split(/\s+/).filter(Boolean).length;
  }, [value]);

  const charCount = value.length;

  useEffect(() => {
    onWordCountChange?.(wordCount);
  }, [wordCount, onWordCountChange]);

  // Render markdown to HTML
  const renderedContent = useMemo(() => {
    if (!value) return "";
    const html = marked(value) as string;
    return sanitizeHtml(html);
  }, [value]);

  // Insert text at cursor
  const insertAtCursor = useCallback((before: string, after: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || defaultText;
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end);
    
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selected.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  // Wrap selected text
  const wrapSelection = useCallback((wrapper: string, endWrapper?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const finalEnd = endWrapper || wrapper;
    
    const newValue = value.substring(0, start) + wrapper + selected + finalEnd + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start + wrapper.length, end + wrapper.length);
      } else {
        textarea.setSelectionRange(start + wrapper.length, start + wrapper.length);
      }
    }, 0);
  }, [value, onChange]);

  // Insert at line start
  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, [value, onChange]);

  // Toolbar actions
  const actions = {
    bold: () => wrapSelection("**"),
    italic: () => wrapSelection("*"),
    strikethrough: () => wrapSelection("~~"),
    heading1: () => insertAtLineStart("# "),
    heading2: () => insertAtLineStart("## "),
    heading3: () => insertAtLineStart("### "),
    quote: () => insertAtLineStart("> "),
    bulletList: () => insertAtLineStart("- "),
    numberList: () => insertAtLineStart("1. "),
    code: () => wrapSelection("`"),
    codeBlock: () => wrapSelection("\n```\n", "\n```\n"),
    link: () => {
      const url = prompt("Enter URL:");
      if (url) {
        const textarea = textareaRef.current;
        if (textarea) {
          const selected = value.substring(textarea.selectionStart, textarea.selectionEnd) || "link text";
          insertAtCursor(`[${selected}](${url})`, "");
        }
      }
    },
    image: () => {
      const url = prompt("Enter image URL:");
      if (url) {
        insertAtCursor(`![alt text](${url})`, "");
      }
    },
    divider: () => insertAtCursor("\n\n---\n\n", ""),
    table: () => insertAtCursor("\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n", ""),
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!textareaRef.current) return;
      
      const isMod = e.metaKey || e.ctrlKey;
      
      if (isMod && e.key === "b") {
        e.preventDefault();
        actions.bold();
      } else if (isMod && e.key === "i") {
        e.preventDefault();
        actions.italic();
      } else if (isMod && e.key === "k") {
        e.preventDefault();
        actions.link();
      } else if (isMod && e.shiftKey && e.key === "x") {
        e.preventDefault();
        actions.strikethrough();
      } else if (isMod && e.key === "`") {
        e.preventDefault();
        actions.code();
      } else if (e.key === "Escape") {
        setFocusMode(false);
        setShowAIPanel(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [actions]);

  // Track selection for AI
  const handleSelect = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selected = value.substring(textarea.selectionStart, textarea.selectionEnd);
      setSelectedText(selected);
      setCursorPosition({ start: textarea.selectionStart, end: textarea.selectionEnd });
    }
  };

  // AI Writing Functions
  const callAI = async (action: string, text: string) => {
    setAiLoading(true);
    setAiSuggestion(null);
    
    try {
      const res = await fetch("/api/admin/ai-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text, context: value }),
      });
      
      if (!res.ok) throw new Error("AI request failed");
      
      const data = await res.json();
      setAiSuggestion(data.result);
    } catch (error) {
      console.error("AI error:", error);
      setAiSuggestion("Failed to get AI response. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const aiActions = {
    continue: () => callAI("continue", value),
    improve: () => callAI("improve", selectedText || value.slice(-500)),
    shorten: () => callAI("shorten", selectedText),
    expand: () => callAI("expand", selectedText),
    rephrase: () => callAI("rephrase", selectedText),
    fixGrammar: () => callAI("fix_grammar", selectedText || value),
    makeProfessional: () => callAI("professional", selectedText),
    makePoetic: () => callAI("poetic", selectedText),
    summarize: () => callAI("summarize", value),
    generateIdeas: () => callAI("ideas", value.slice(-300)),
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    
    if (selectedText && cursorPosition.start !== cursorPosition.end) {
      // Replace selected text
      const newValue = value.substring(0, cursorPosition.start) + aiSuggestion + value.substring(cursorPosition.end);
      onChange(newValue);
    } else {
      // Append to end
      onChange(value + "\n\n" + aiSuggestion);
    }
    
    setAiSuggestion(null);
    setShowAIPanel(false);
  };

  const insertAISuggestion = () => {
    if (!aiSuggestion) return;
    
    const textarea = textareaRef.current;
    if (textarea) {
      const pos = textarea.selectionEnd;
      const newValue = value.substring(0, pos) + "\n\n" + aiSuggestion + value.substring(pos);
      onChange(newValue);
    }
    
    setAiSuggestion(null);
    setShowAIPanel(false);
  };

  return (
    <div className={`relative ${focusMode ? "fixed inset-0 z-50 bg-[#030304] flex flex-col" : ""}`}>
      {/* Focus mode background gradient */}
      {focusMode && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 via-transparent to-zinc-900/20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/[0.02] blur-[100px] rounded-full" />
        </div>
      )}
      
      {/* Toolbar */}
      <div className={`flex items-center gap-1 p-2 bg-zinc-900/40 border border-zinc-800/40 rounded-t-lg ${focusMode ? "sticky top-0 z-10 mx-auto mt-4 rounded-lg shadow-xl bg-zinc-900/80 backdrop-blur-md border-zinc-700/40 max-w-fit" : ""}`}>
        {/* Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-zinc-800/40">
          <ToolbarButton 
            icon={<span className="font-bold text-sm">B</span>} 
            label="Bold" 
            onClick={actions.bold}
            shortcut="⌘B"
          />
          <ToolbarButton 
            icon={<span className="italic text-sm">I</span>} 
            label="Italic" 
            onClick={actions.italic}
            shortcut="⌘I"
          />
          <ToolbarButton 
            icon={<span className="line-through text-sm">S</span>} 
            label="Strikethrough" 
            onClick={actions.strikethrough}
          />
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-800/40">
          <ToolbarButton 
            icon={<span className="text-xs font-semibold">H1</span>} 
            label="Heading 1" 
            onClick={actions.heading1}
          />
          <ToolbarButton 
            icon={<span className="text-xs font-semibold">H2</span>} 
            label="Heading 2" 
            onClick={actions.heading2}
          />
          <ToolbarButton 
            icon={<span className="text-xs font-semibold">H3</span>} 
            label="Heading 3" 
            onClick={actions.heading3}
          />
        </div>

        {/* Lists & Quote */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-800/40">
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            } 
            label="Bullet List" 
            onClick={actions.bulletList}
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
                <text x="3" y="8" fontSize="8" fill="currentColor">1</text>
                <text x="3" y="14" fontSize="8" fill="currentColor">2</text>
                <text x="3" y="20" fontSize="8" fill="currentColor">3</text>
              </svg>
            } 
            label="Numbered List" 
            onClick={actions.numberList}
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4v16" strokeLinecap="round" />
                <path d="M10 8h10M10 12h10M10 16h7" />
              </svg>
            } 
            label="Quote" 
            onClick={actions.quote}
          />
        </div>

        {/* Code & Links */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-800/40">
          <ToolbarButton 
            icon={<span className="text-xs font-mono">{`<>`}</span>} 
            label="Inline Code" 
            onClick={actions.code}
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
            } 
            label="Code Block" 
            onClick={actions.codeBlock}
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            } 
            label="Link" 
            onClick={actions.link}
            shortcut="⌘K"
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            } 
            label="Image" 
            onClick={actions.image}
          />
        </div>

        {/* Extra */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-800/40">
          <ToolbarButton 
            icon={<span className="text-xs">—</span>} 
            label="Divider" 
            onClick={actions.divider}
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            } 
            label="Table" 
            onClick={actions.table}
          />
        </div>

        {/* View modes */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-800/40">
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            } 
            label="Write" 
            onClick={() => setViewMode("write")}
            active={viewMode === "write"}
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
            } 
            label="Split" 
            onClick={() => setViewMode("split")}
            active={viewMode === "split"}
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            } 
            label="Preview" 
            onClick={() => setViewMode("preview")}
            active={viewMode === "preview"}
          />
        </div>

        {/* AI & Focus */}
        <div className="flex items-center gap-0.5 pl-2">
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                <path d="M8.5 8.5v.01" />
                <path d="M16 15.5v.01" />
                <path d="M12 12v.01" />
                <path d="M11 17v.01" />
                <path d="M7 14v.01" />
              </svg>
            } 
            label="AI Assistant" 
            onClick={() => setShowAIPanel(!showAIPanel)}
            active={showAIPanel}
          />
          <ToolbarButton 
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            } 
            label="Focus Mode" 
            onClick={() => setFocusMode(!focusMode)}
            active={focusMode}
          />
        </div>

        {/* Word count in toolbar */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-zinc-600 px-2">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Editor area */}
      <div className={`flex ${focusMode ? "flex-1 max-w-5xl w-full mx-auto mt-4 px-4 pb-4" : ""}`}>
        {/* Write pane */}
        {(viewMode === "write" || viewMode === "split") && (
          <div className={`${viewMode === "split" ? "w-1/2 border-r border-zinc-800/40" : "w-full"} relative flex flex-col`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onSelect={handleSelect}
              placeholder={placeholder}
              className={`w-full bg-zinc-900/20 border border-zinc-800/40 ${viewMode === "split" ? "border-r-0" : ""} ${focusMode ? "rounded-lg" : "rounded-b-lg"} text-base text-zinc-400 leading-relaxed placeholder-zinc-700 resize-none focus:outline-none focus:border-zinc-700/50 p-6 ${focusMode ? "flex-1 bg-zinc-900/40" : "min-h-[400px]"}`}
              style={{ 
                fontFamily: "var(--font-geist-mono), monospace",
                tabSize: 2,
              }}
            />
            
            {/* Floating AI suggestion indicator */}
            {selectedText && !showAIPanel && (
              <button
                onClick={() => setShowAIPanel(true)}
                className="absolute bottom-4 right-4 px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-lg text-xs text-violet-400 hover:bg-violet-600/30 transition-all flex items-center gap-2"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                </svg>
                AI: "{selectedText.slice(0, 20)}..."
              </button>
            )}
          </div>
        )}

        {/* Preview pane */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} bg-zinc-900/20 border border-zinc-800/40 ${viewMode === "split" ? "border-l-0" : ""} ${focusMode ? "rounded-lg bg-zinc-900/40" : "rounded-b-lg"} p-6 overflow-auto ${focusMode ? "flex-1" : "min-h-[400px] max-h-[600px]"}`}>
            {value ? (
              <div 
                className="prose prose-invert prose-zinc max-w-none prose-headings:font-light prose-headings:text-zinc-300 prose-p:text-zinc-400 prose-p:leading-relaxed prose-a:text-violet-400 prose-strong:text-zinc-300 prose-code:text-violet-400 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-800/50 prose-pre:border prose-pre:border-zinc-700/30 prose-blockquote:border-violet-500/30 prose-blockquote:text-zinc-500 prose-hr:border-zinc-800"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
            ) : (
              <p className="text-zinc-700 italic">Preview will appear here...</p>
            )}
          </div>
        )}
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 w-80 bg-zinc-900/95 border border-zinc-800/60 rounded-xl shadow-2xl backdrop-blur-sm z-50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800/40">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                  <path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" />
                </svg>
                AI Writing Assistant
              </h3>
              <button 
                onClick={() => setShowAIPanel(false)}
                className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {selectedText && (
              <p className="mt-2 text-[10px] text-zinc-600 truncate">
                Selected: "{selectedText.slice(0, 50)}{selectedText.length > 50 ? "..." : ""}"
              </p>
            )}
          </div>

          <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto">
            {/* Continue writing */}
            <button 
              onClick={aiActions.continue}
              disabled={aiLoading}
              className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Continue Writing
            </button>

            {selectedText && (
              <>
                <div className="text-[10px] text-zinc-600 uppercase tracking-wider px-3 pt-2">Transform Selection</div>
                
                <button onClick={aiActions.improve} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Improve Writing
                </button>

                <button onClick={aiActions.shorten} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 4H3M17 9H7M19 14H5M15 19H9" />
                  </svg>
                  Make Shorter
                </button>

                <button onClick={aiActions.expand} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 4h18M3 9h18M3 14h18M3 19h18" />
                  </svg>
                  Expand & Elaborate
                </button>

                <button onClick={aiActions.rephrase} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                  <svg className="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  Rephrase
                </button>

                <div className="text-[10px] text-zinc-600 uppercase tracking-wider px-3 pt-2">Tone</div>

                <button onClick={aiActions.makeProfessional} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  Make Professional
                </button>

                <button onClick={aiActions.makePoetic} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                  <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v18M5.5 8.5L12 3l6.5 5.5" />
                  </svg>
                  Make Poetic
                </button>
              </>
            )}

            <div className="text-[10px] text-zinc-600 uppercase tracking-wider px-3 pt-2">Utilities</div>

            <button onClick={aiActions.fixGrammar} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Fix Grammar & Spelling
            </button>

            <button onClick={aiActions.summarize} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Summarize Content
            </button>

            <button onClick={aiActions.generateIdeas} disabled={aiLoading} className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
              Generate Ideas
            </button>
          </div>

          {/* AI Loading / Result */}
          {(aiLoading || aiSuggestion) && (
            <div className="border-t border-zinc-800/40 p-4">
              {aiLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500">AI is thinking...</span>
                </div>
              ) : aiSuggestion && (
                <div className="space-y-3">
                  <div className="max-h-40 overflow-y-auto text-xs text-zinc-400 bg-zinc-800/30 rounded-lg p-3 whitespace-pre-wrap">
                    {aiSuggestion}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={applyAISuggestion}
                      className="flex-1 px-3 py-1.5 bg-violet-600/30 border border-violet-500/30 rounded-lg text-xs text-violet-300 hover:bg-violet-600/40 transition-colors"
                    >
                      {selectedText ? "Replace" : "Append"}
                    </button>
                    <button
                      onClick={insertAISuggestion}
                      className="flex-1 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/30 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800/70 transition-colors"
                    >
                      Insert at Cursor
                    </button>
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="px-3 py-1.5 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Focus mode exit button & hint */}
      {focusMode && (
        <>
          {/* Exit button - top right */}
          <button
            onClick={() => setFocusMode(false)}
            className="fixed top-4 right-4 p-2 bg-zinc-800/60 border border-zinc-700/40 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/60 transition-all z-50"
            title="Exit Focus Mode (ESC)"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          
          {/* Bottom hint */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/60 border border-zinc-800/40 rounded-full text-[10px] text-zinc-600 backdrop-blur-sm">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-400 mx-1">ESC</kbd> to exit focus mode
          </div>
        </>
      )}
    </div>
  );
}
