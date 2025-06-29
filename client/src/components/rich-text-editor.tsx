import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  onBlur,
  placeholder = "Start typing...",
  autoFocus = false 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (editorRef.current && autoFocus) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
      
      // Update history
      const newHistory = [...history.slice(0, historyIndex + 1), newContent];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
      }
    }
  };

  return (
    <div className="border border-memopyk-blue/20 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-memopyk-blue/20 bg-memopyk-cream/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 w-8 p-0 hover:bg-memopyk-blue hover:text-white"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 w-8 p-0 hover:bg-memopyk-blue hover:text-white"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-memopyk-blue/20 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 w-8 p-0 hover:bg-memopyk-blue hover:text-white"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 w-8 p-0 hover:bg-memopyk-blue hover:text-white"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-memopyk-blue/20 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 w-8 p-0 hover:bg-memopyk-blue hover:text-white"
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-memopyk-blue/20 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={undo}
          onMouseDown={(e) => e.preventDefault()}
          disabled={historyIndex === 0}
          className="h-8 w-8 p-0 hover:bg-memopyk-blue hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={redo}
          onMouseDown={(e) => e.preventDefault()}
          disabled={historyIndex === history.length - 1}
          className="h-8 w-8 p-0 hover:bg-memopyk-blue hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3 bg-white"
        onInput={handleInput}
        onBlur={onBlur}
        suppressContentEditableWarning={true}
        style={{ 
          border: 'none',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
}