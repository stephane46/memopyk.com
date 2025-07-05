import { useState } from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Bold, Italic, List, ListOrdered, Link, Mail, Indent } from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichEditor({ value, onChange, placeholder, className }: RichEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const insertFormat = (format: string) => {
    const textarea = document.getElementById("rich-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        formattedText = `*${selectedText || "italic text"}*`;
        break;
      case "list":
        formattedText = `\n- ${selectedText || "list item"}`;
        break;
      case "numbered":
        formattedText = `\n1. ${selectedText || "numbered item"}`;
        break;
      case "indent":
        formattedText = `    ${selectedText || "indented text"}`;
        break;
      case "link":
        formattedText = `[${selectedText || "link text"}](https://example.com)`;
        break;
      case "email":
        formattedText = `[${selectedText || "email text"}](mailto:contact@example.com)`;
        break;
      default:
        return;
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
    
    // Refocus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^- (.+)$/gm, "<li class='ml-4'>$1</li>")
      .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4'>$2</li>")
      .replace(/^    (.+)$/gm, "<div class='ml-8'>$1</div>")
      .replace(/(<li class='ml-4'>.*<\/li>)/g, (match) => {
        if (match.includes("1.") || /\d+\./.test(match)) {
          return `<ol class='list-decimal list-inside'>${match}</ol>`;
        }
        return `<ul class='list-disc list-inside'>${match}</ul>`;
      })
      .replace(/\n/g, "<br>");
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertFormat("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertFormat("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertFormat("indent")}
            title="Indent"
          >
            <Indent className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertFormat("list")}
            title="Bullet Points"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertFormat("numbered")}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertFormat("link")}
            title="Insert URL"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertFormat("email")}
            title="Insert Email"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? "Edit" : "Preview"}
        </Button>
      </div>
      
      {isPreview ? (
        <div 
          className="min-h-[100px] p-3 border rounded-md bg-gray-50"
          dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
        />
      ) : (
        <Textarea
          id="rich-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px]"
        />
      )}
    </div>
  );
}
