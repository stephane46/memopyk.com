import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { SeoSetting, InsertSeoSetting } from "@shared/schema";

const pages = [
  { value: "homepage", label: "Homepage" },
  { value: "gallery", label: "Gallery" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
  { value: "faq", label: "FAQ" },
];

export default function SEOSettings() {
  const [selectedPage, setSelectedPage] = useState("homepage");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings = [], isLoading } = useQuery<SeoSetting[]>({
    queryKey: ["/api/seo-settings"],
  });

  const { data: currentSetting } = useQuery<SeoSetting>({
    queryKey: ["/api/seo-settings/page", selectedPage],
    enabled: !!selectedPage,
  });

  const createMutation = useMutation({
    mutationFn: async (setting: InsertSeoSetting) => {
      const res = await apiRequest("POST", "/api/seo-settings", setting);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-settings"] });
      toast({ title: "SEO settings created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create SEO settings", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, setting }: { id: number; setting: Partial<InsertSeoSetting> }) => {
      const res = await apiRequest("PUT", `/api/seo-settings/${id}`, setting);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seo-settings/page", selectedPage] });
      toast({ title: "SEO settings updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update SEO settings", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const setting: InsertSeoSetting = {
      page: selectedPage,
      urlSlugEn: formData.get("urlSlugEn") as string,
      urlSlugFr: formData.get("urlSlugFr") as string,
      titleEn: formData.get("titleEn") as string,
      titleFr: formData.get("titleFr") as string,
      descriptionEn: formData.get("descriptionEn") as string,
      descriptionFr: formData.get("descriptionFr") as string,
      ogTitle: formData.get("ogTitle") as string,
      ogDescription: formData.get("ogDescription") as string,
      ogImage: formData.get("ogImage") as string,
      twitterTitle: formData.get("twitterTitle") as string,
      twitterDescription: formData.get("twitterDescription") as string,
      twitterImage: formData.get("twitterImage") as string,
      robotsIndex: formData.get("robotsIndex") === "on",
      robotsFollow: formData.get("robotsFollow") === "on",
      jsonLd: formData.get("jsonLd") ? JSON.parse(formData.get("jsonLd") as string) : null,
    };

    if (currentSetting) {
      updateMutation.mutate({ id: currentSetting.id, setting });
    } else {
      createMutation.mutate(setting);
    }
  };

  const generateJsonLd = () => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "MEMOPYK",
      "url": "https://memopyk.com",
      "description": "Professional photography services in Montreal",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Montreal",
        "addressCountry": "CA"
      },
      "serviceType": ["Wedding Photography", "Corporate Photography", "Event Photography"]
    };

    const jsonLdTextarea = document.querySelector('[name="jsonLd"]') as HTMLTextAreaElement;
    if (jsonLdTextarea) {
      jsonLdTextarea.value = JSON.stringify(baseSchema, null, 2);
    }

    toast({ title: "JSON-LD schema generated successfully" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SEO Settings</CardTitle>
            <p className="text-gray-600 text-sm mt-1">
              Manage meta tags, Open Graph, and JSON-LD structured data
            </p>
          </div>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.value} value={page.value}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic SEO</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="structured">Structured Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titleEn">Page Title (English)</Label>
                    <Input
                      id="titleEn"
                      name="titleEn"
                      defaultValue={currentSetting?.titleEn || ""}
                      placeholder="MEMOPYK - Professional Photography Services in Montreal"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="descriptionEn">Meta Description (English)</Label>
                    <Textarea
                      id="descriptionEn"
                      name="descriptionEn"
                      rows={3}
                      defaultValue={currentSetting?.descriptionEn || ""}
                      placeholder="Professional wedding and corporate photography services in Montreal. Capturing moments that matter with creative excellence."
                    />
                  </div>

                  <div>
                    <Label htmlFor="urlSlugEn">URL Slug (English)</Label>
                    <Input
                      id="urlSlugEn"
                      name="urlSlugEn"
                      defaultValue={currentSetting?.urlSlugEn || ""}
                      placeholder="photography-services"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titleFr">Page Title (Français)</Label>
                    <Input
                      id="titleFr"
                      name="titleFr"
                      defaultValue={currentSetting?.titleFr || ""}
                      placeholder="MEMOPYK - Services de Photographie Professionnelle à Montréal"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="descriptionFr">Meta Description (Français)</Label>
                    <Textarea
                      id="descriptionFr"
                      name="descriptionFr"
                      rows={3}
                      defaultValue={currentSetting?.descriptionFr || ""}
                      placeholder="Services de photographie professionnelle pour mariages et entreprises à Montréal. Capturer les moments qui comptent avec excellence créative."
                    />
                  </div>

                  <div>
                    <Label htmlFor="urlSlugFr">URL Slug (Français)</Label>
                    <Input
                      id="urlSlugFr"
                      name="urlSlugFr"
                      defaultValue={currentSetting?.urlSlugFr || ""}
                      placeholder="services-photographie"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Open Graph</h3>
                  <div>
                    <Label htmlFor="ogTitle">OG Title</Label>
                    <Input
                      id="ogTitle"
                      name="ogTitle"
                      defaultValue={currentSetting?.ogTitle || ""}
                      placeholder="MEMOPYK - Professional Photography"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ogDescription">OG Description</Label>
                    <Textarea
                      id="ogDescription"
                      name="ogDescription"
                      rows={3}
                      defaultValue={currentSetting?.ogDescription || ""}
                      placeholder="Capturing moments that matter with creative excellence"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ogImage">OG Image URL</Label>
                    <Input
                      id="ogImage"
                      name="ogImage"
                      type="url"
                      defaultValue={currentSetting?.ogImage || ""}
                      placeholder="https://memopyk.com/og-image.jpg"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Twitter</h3>
                  <div>
                    <Label htmlFor="twitterTitle">Twitter Title</Label>
                    <Input
                      id="twitterTitle"
                      name="twitterTitle"
                      defaultValue={currentSetting?.twitterTitle || ""}
                      placeholder="MEMOPYK - Professional Photography"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="twitterDescription">Twitter Description</Label>
                    <Textarea
                      id="twitterDescription"
                      name="twitterDescription"
                      rows={3}
                      defaultValue={currentSetting?.twitterDescription || ""}
                      placeholder="Capturing moments that matter with creative excellence"
                    />
                  </div>

                  <div>
                    <Label htmlFor="twitterImage">Twitter Image URL</Label>
                    <Input
                      id="twitterImage"
                      name="twitterImage"
                      type="url"
                      defaultValue={currentSetting?.twitterImage || ""}
                      placeholder="https://memopyk.com/twitter-image.jpg"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <h3 className="text-lg font-semibold">Robot Instructions</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="robotsIndex"
                    name="robotsIndex"
                    defaultChecked={currentSetting?.robotsIndex !== false}
                  />
                  <Label htmlFor="robotsIndex">Allow search engines to index this page</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="robotsFollow"
                    name="robotsFollow"
                    defaultChecked={currentSetting?.robotsFollow !== false}
                  />
                  <Label htmlFor="robotsFollow">Allow search engines to follow links</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="structured" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">JSON-LD Structured Data</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateJsonLd}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Auto-generate Schema
                </Button>
              </div>
              
              <div>
                <Label htmlFor="jsonLd">JSON-LD Schema</Label>
                <Textarea
                  id="jsonLd"
                  name="jsonLd"
                  rows={12}
                  className="font-mono text-sm"
                  defaultValue={currentSetting?.jsonLd ? JSON.stringify(currentSetting.jsonLd, null, 2) : ""}
                  placeholder='{"@context": "https://schema.org", "@type": "ProfessionalService", "name": "MEMOPYK"}'
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-6 border-t">
            <Button
              type="submit"
              className="memopyk-blue hover:memopyk-navy"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Save SEO Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
