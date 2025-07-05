import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichEditor } from "@/components/ui/rich-editor";
import { FileText, Save, Eye, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContentPage {
  id: string;
  name: string;
  slug: string;
  contentEn: string;
  contentFr: string;
  lastModified: string;
}

const defaultPages: ContentPage[] = [
  {
    id: "privacy",
    name: "Privacy Policy",
    slug: "privacy-policy",
    contentEn: "# Privacy Policy\n\nYour privacy is important to us...",
    contentFr: "# Politique de Confidentialité\n\nVotre vie privée est importante pour nous...",
    lastModified: "2024-01-30T15:30:00Z",
  },
  {
    id: "terms",
    name: "Terms of Service",
    slug: "terms-of-service",
    contentEn: "# Terms of Service\n\nBy using our services, you agree to...",
    contentFr: "# Conditions d'Utilisation\n\nEn utilisant nos services, vous acceptez...",
    lastModified: "2024-01-29T10:15:00Z",
  },
  {
    id: "about",
    name: "About Us",
    slug: "about",
    contentEn: "# About MEMOPYK\n\nWe are passionate photographers...",
    contentFr: "# À Propos de MEMOPYK\n\nNous sommes des photographes passionnés...",
    lastModified: "2024-01-28T14:45:00Z",
  },
];

export default function ContentEditor() {
  const [pages] = useState<ContentPage[]>(defaultPages);
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.id || "");
  const [contentEn, setContentEn] = useState("");
  const [contentFr, setContentFr] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<"en" | "fr">("en");
  const { toast } = useToast();

  const selectedPage = pages.find(p => p.id === selectedPageId);

  // Update content when page changes
  useState(() => {
    if (selectedPage) {
      setContentEn(selectedPage.contentEn);
      setContentFr(selectedPage.contentFr);
    }
  });

  const handleSave = () => {
    // In a real app, this would make an API call
    toast({
      title: "Content saved successfully",
      description: `${selectedPage?.name} has been updated.`,
    });
  };

  const renderPreview = (content: string) => {
    return content
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-6 text-gray-900">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-4 text-gray-800">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium mb-3 text-gray-700">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside mb-4">$1</ul>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(?!<[h|u|l])(.+)$/gm, '<p class="mb-4">$1</p>');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Editor</CardTitle>
              <p className="text-gray-600 text-sm mt-1">
                Edit legal documents and content pages with rich text formatting
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select page to edit" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{page.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Page
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {selectedPage && (
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{selectedPage.name}</h3>
                <p className="text-gray-600 text-sm">/{selectedPage.slug}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Last modified: {formatDate(selectedPage.lastModified)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreview(!isPreview)}
                >
                  {isPreview ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {isPreview ? "Edit" : "Preview"}
                </Button>
                <Button
                  onClick={handleSave}
                  className="memopyk-blue hover:memopyk-navy"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Content Editor */}
      {selectedPage && (
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as "en" | "fr")}>
              <div className="p-6 border-b">
                <TabsList>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="fr">Français</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="en" className="p-6 m-0">
                {isPreview ? (
                  <div className="min-h-[500px] prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: renderPreview(contentEn || selectedPage.contentEn) 
                      }} 
                    />
                  </div>
                ) : (
                  <RichEditor
                    value={contentEn || selectedPage.contentEn}
                    onChange={setContentEn}
                    placeholder="Enter content in English..."
                    className="min-h-[500px]"
                  />
                )}
              </TabsContent>
              
              <TabsContent value="fr" className="p-6 m-0">
                {isPreview ? (
                  <div className="min-h-[500px] prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: renderPreview(contentFr || selectedPage.contentFr) 
                      }} 
                    />
                  </div>
                ) : (
                  <RichEditor
                    value={contentFr || selectedPage.contentFr}
                    onChange={setContentFr}
                    placeholder="Entrez le contenu en français..."
                    className="min-h-[500px]"
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Page Settings */}
      {selectedPage && (
        <Card>
          <CardHeader>
            <CardTitle>Page Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="pageName">Page Name</Label>
                <Input
                  id="pageName"
                  defaultValue={selectedPage.name}
                  placeholder="Privacy Policy"
                />
              </div>
              <div>
                <Label htmlFor="pageSlug">URL Slug</Label>
                <Input
                  id="pageSlug"
                  defaultValue={selectedPage.slug}
                  placeholder="privacy-policy"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button variant="outline">
                Update Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
