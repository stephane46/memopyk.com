import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bold, Italic, List, ListOrdered, Undo, Redo, Save, Link as LinkIcon } from 'lucide-react';
import { legalContent, type LegalContentType, type LanguageKey, type DocumentKey } from '@/content/legal-content';

interface LegalEditorProps {
  onSave: (updatedContent: LegalContentType) => void;
}

export default function LegalEditor({ onSave }: LegalEditorProps) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentKey>('legalNotice');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>('en');
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [workingContent, setWorkingContent] = useState<LegalContentType>(legalContent);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Get current content for the selected document and language
  const currentContent = workingContent[selectedLanguage][selectedDocument];
  
  // Convert sections to HTML for TipTap
  const sectionsToHtml = (sections: any[]) => {
    return sections.map(section => {
      const content = section.content.map((item: any) => {
        if (item.type === 'text') {
          // Check if value already contains HTML, if so use it directly, otherwise wrap in <p>
          const value = item.value;
          if (value.includes('<') && value.includes('>')) {
            return `<p>${value}</p>`;
          } else {
            return `<p>${value}</p>`;
          }
        }
        return '';
      }).join('');
      
      return `<h3>${section.title}</h3>${content}`;
    }).join('');
  };

  // Convert HTML back to sections format
  const htmlToSections = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const sections: any[] = [];
    let currentSection: any = null;
    
    Array.from(tempDiv.children).forEach(element => {
      if (element.tagName === 'H3') {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: element.textContent || '',
          content: []
        };
      } else if (element.tagName === 'P' && currentSection) {
        if (element.textContent?.trim()) {
          currentSection.content.push({
            type: 'text',
            value: element.innerHTML // Preserve HTML formatting instead of textContent
          });
        }
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-memopyk-highlight underline hover:text-memopyk-navy',
        },
      }),
    ],
    content: sectionsToHtml(currentContent.sections),
    onUpdate: ({ editor }) => {
      setHasChanges(true);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 text-memopyk-blue',
      },
    },
  });

  // Update editor content when document/language changes
  useEffect(() => {
    if (editor && !isEditing) {
      const newContent = sectionsToHtml(workingContent[selectedLanguage][selectedDocument].sections);
      editor.commands.setContent(newContent);
      setHasChanges(false);
    }
  }, [selectedDocument, selectedLanguage, editor, isEditing, workingContent]);

  const handleSave = async () => {
    if (!editor || !hasChanges) return;

    const html = editor.getHTML();
    const newSections = htmlToSections(html);
    
    const updatedContent = {
      ...workingContent,
      [selectedLanguage]: {
        ...workingContent[selectedLanguage],
        [selectedDocument]: {
          ...workingContent[selectedLanguage][selectedDocument],
          sections: newSections,
          lastUpdated: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }
      }
    };

    setWorkingContent(updatedContent);
    await onSave(updatedContent);
    setHasChanges(false);
    setIsEditing(false);
  };

  const documentOptions = [
    { value: 'legalNotice' as DocumentKey, label: 'Legal Notice / Mentions Légales' },
    { value: 'privacyPolicy' as DocumentKey, label: 'Privacy Policy / Politique de Confidentialité' },
    { value: 'cookiePolicy' as DocumentKey, label: 'Cookie Policy / Politique de Cookies' },
    { value: 'termsOfSale' as DocumentKey, label: 'Terms of Sale / Conditions de Vente' },
    { value: 'termsOfUse' as DocumentKey, label: 'Terms of Use / Conditions d\'Utilisation' },
  ];

  if (!editor) {
    return <div className="text-memopyk-blue">Loading editor...</div>;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-memopyk-navy text-memopyk-cream">
        <CardTitle className="text-xl">WYSIWYG Legal Content Editor</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Fixed Document and Language Selection + Toolbar */}
        <div className="sticky top-0 z-50 bg-white pb-4 -mx-6 px-6 border-b border-memopyk-blue/10 mb-6">
          {/* Document and Language Selection */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-memopyk-navy mb-2 block">
                Select Document
              </label>
              <Select value={selectedDocument} onValueChange={(value: string) => setSelectedDocument(value as DocumentKey)}>
                <SelectTrigger className="border-memopyk-blue">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-32">
              <label className="text-sm font-medium text-memopyk-navy mb-2 block">
                Language
              </label>
              <Tabs value={selectedLanguage} onValueChange={(value: string) => setSelectedLanguage(value as LanguageKey)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en" className="text-xs">English</TabsTrigger>
                  <TabsTrigger value="fr" className="text-xs">Français</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Editor Toolbar */}
          <div className="bg-memopyk-cream border border-memopyk-blue/20 rounded-lg p-2 flex gap-2 items-center shadow-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`${editor.isActive('bold') ? 'bg-memopyk-blue text-memopyk-cream' : 'text-memopyk-blue border-memopyk-blue'}`}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`${editor.isActive('italic') ? 'bg-memopyk-blue text-memopyk-cream' : 'text-memopyk-blue border-memopyk-blue'}`}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`${editor.isActive('bulletList') ? 'bg-memopyk-blue text-memopyk-cream' : 'text-memopyk-blue border-memopyk-blue'}`}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`${editor.isActive('orderedList') ? 'bg-memopyk-blue text-memopyk-cream' : 'text-memopyk-blue border-memopyk-blue'}`}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
            
            <div className="h-4 w-px bg-memopyk-blue/30 mx-1" />
            
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Get selected text if any
                    const { from, to } = editor.state.selection;
                    const selectedText = editor.state.doc.textBetween(from, to);
                    setLinkText(selectedText);
                    setLinkUrl('');
                    setLinkDialogOpen(true);
                  }}
                  className={`${editor.isActive('link') ? 'bg-memopyk-blue text-memopyk-cream' : 'text-memopyk-blue border-memopyk-blue'}`}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-memopyk-navy">Add Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-memopyk-navy mb-2 block">
                      Link Text
                    </label>
                    <Input
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="Enter link text"
                      className="border-memopyk-blue focus:border-memopyk-navy"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-memopyk-navy mb-2 block">
                      URL
                    </label>
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com or mailto:email@domain.com"
                      className="border-memopyk-blue focus:border-memopyk-navy"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setLinkDialogOpen(false)}
                      className="text-memopyk-blue border-memopyk-blue"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (linkUrl && linkText) {
                          editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
                          setLinkDialogOpen(false);
                          setLinkUrl('');
                          setLinkText('');
                        }
                      }}
                      className="bg-memopyk-blue text-memopyk-cream hover:bg-memopyk-navy"
                      disabled={!linkUrl || !linkText}
                    >
                      Add Link
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="h-6 w-px bg-memopyk-blue/20 mx-2" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="text-memopyk-blue border-memopyk-blue"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="text-memopyk-blue border-memopyk-blue"
            >
              <Redo className="w-4 h-4" />
            </Button>

            <div className="ml-auto flex gap-2">
              {hasChanges && (
                <span className="text-sm text-memopyk-highlight font-medium">Unsaved changes</span>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-memopyk-blue text-memopyk-cream hover:bg-memopyk-navy"
                size="sm"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content Area */}
        <div className="border border-memopyk-blue/20 rounded-lg overflow-hidden">
          <div 
            className="bg-white min-h-[400px] cursor-text"
            onClick={() => {
              editor.commands.focus();
              setIsEditing(true);
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Current Document Info */}
        <div className="mt-4 p-3 bg-memopyk-sky/10 rounded border border-memopyk-sky/30">
          <div className="flex justify-between items-center text-sm text-memopyk-blue">
            <span>
              <strong>Editing:</strong> {documentOptions.find(opt => opt.value === selectedDocument)?.label} ({selectedLanguage.toUpperCase()})
            </span>
            <span>
              <strong>Last Updated:</strong> {currentContent.lastUpdated}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}