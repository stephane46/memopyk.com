import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Bold, Italic, List, ListOrdered, Link, Mail, Indent } from "lucide-react";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function WysiwygEditor({ value, onChange, placeholder, className }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  // Convert markdown-like text to HTML for display
  const markdownToHtml = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" contenteditable="false">$1</a>')
      .replace(/^- (.+)$/gm, "• $1")
      .replace(/^(\d+)\. (.+)$/gm, "$1. $2")
      .replace(/^    (.+)$/gm, "&nbsp;&nbsp;&nbsp;&nbsp;$1")
      .replace(/\n/g, "<br>");
  };

  // Convert HTML back to markdown-like text
  const htmlToMarkdown = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Process text nodes and elements
    let text = tempDiv.innerHTML
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<em>(.*?)<\/em>/g, "*$1*")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, "[$2]($1)")
      .replace(/&nbsp;&nbsp;&nbsp;&nbsp;/g, "    ")
      .replace(/^• /gm, "- ")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]*>/g, ""); // Remove any remaining HTML tags
    
    return text;
  };

  // Update editor content when value changes
  useEffect(() => {
    if (editorRef.current && !isEditorFocused) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
  }, [value, isEditorFocused]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      const markdownContent = htmlToMarkdown(htmlContent);
      onChange(markdownContent);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
    editorRef.current?.focus();
  };

  const insertText = (text: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    handleContentChange();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const insertEmail = () => {
    const email = prompt("Enter email address:");
    if (email) {
      executeCommand("createLink", `mailto:${email}`);
    }
  };

  const insertList = () => {
    executeCommand("insertUnorderedList");
  };

  const insertNumberedList = () => {
    executeCommand("insertOrderedList");
  };

  const indent = () => {
    executeCommand("indent");
  };

  return (
    <div className={className}>
      <style>{`
        [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
      <div className="flex items-center space-x-1 flex-wrap mb-2 p-2 border-b">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={indent}
          title="Indent"
        >
          <Indent className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertList}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertNumberedList}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertLink}
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertEmail}
          title="Insert Email"
        >
          <Mail className="h-4 w-4" />
        </Button>
      </div>
      
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ whiteSpace: "pre-wrap" }}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => {
          setIsEditorFocused(false);
          handleContentChange();
        }}
        onInput={handleContentChange}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />
    </div>
  );
}