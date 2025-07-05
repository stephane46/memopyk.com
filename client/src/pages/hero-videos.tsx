import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DragDropTable } from "@/components/ui/drag-drop-table";
import { Plus, Edit, Trash2, Play } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { HeroVideo, InsertHeroVideo } from "@shared/schema";

export default function HeroVideos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<HeroVideo | null>(null);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: videos = [], isLoading } = useQuery<HeroVideo[]>({
    queryKey: ["/api/hero-videos"],
  });

  const createMutation = useMutation({
    mutationFn: async (video: InsertHeroVideo) => {
      const res = await apiRequest("POST", "/api/hero-videos", video);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      setIsDialogOpen(false);
      toast({ title: "Hero video created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create hero video", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, video }: { id: number; video: Partial<InsertHeroVideo> }) => {
      const res = await apiRequest("PUT", `/api/hero-videos/${id}`, video);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      setIsDialogOpen(false);
      setEditingVideo(null);
      toast({ title: "Hero video updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update hero video", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/hero-videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      toast({ title: "Hero video deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete hero video", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (videoIds: number[]) => {
      await apiRequest("POST", "/api/hero-videos/reorder", { videoIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      toast({ title: "Videos reordered successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to reorder videos", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const video: InsertHeroVideo = {
      titleEn: formData.get("titleEn") as string,
      titleFr: formData.get("titleFr") as string,
      urlEn: formData.get("urlEn") as string,
      urlFr: formData.get("urlFr") as string,
      orderIndex: videos.length,
    };

    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, video });
    } else {
      createMutation.mutate(video);
    }
  };

  const handleReorder = (newOrder: HeroVideo[]) => {
    const videoIds = newOrder.map(video => video.id);
    reorderMutation.mutate(videoIds);
  };

  const renderVideoItem = (video: HeroVideo) => (
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
          <Play className="h-5 w-5 text-gray-500" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">
            {language === "en" ? video.titleEn : video.titleFr}
          </h4>
          <p className="text-gray-600 text-sm">
            {language === "en" ? video.urlEn : video.urlFr}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
          Active
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditingVideo(video);
            setIsDialogOpen(true);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteMutation.mutate(video.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
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
            <CardTitle>Hero Videos Management</CardTitle>
            <p className="text-gray-600 text-sm mt-1">
              Manage homepage hero videos with drag-and-drop reordering
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={language === "en" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLanguage("en")}
              >
                English
              </Button>
              <Button
                variant={language === "fr" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLanguage("fr")}
              >
                Français
              </Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="memopyk-blue hover:memopyk-navy">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingVideo ? "Edit Hero Video" : "Add Hero Video"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="titleEn">Title (English)</Label>
                      <Input
                        id="titleEn"
                        name="titleEn"
                        defaultValue={editingVideo?.titleEn}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="titleFr">Title (Français)</Label>
                      <Input
                        id="titleFr"
                        name="titleFr"
                        defaultValue={editingVideo?.titleFr}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="urlEn">Video URL (English)</Label>
                      <Input
                        id="urlEn"
                        name="urlEn"
                        type="url"
                        defaultValue={editingVideo?.urlEn}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="urlFr">Video URL (Français)</Label>
                      <Input
                        id="urlFr"
                        name="urlFr"
                        type="url"
                        defaultValue={editingVideo?.urlFr}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingVideo(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingVideo ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {videos.length > 0 ? (
          <DragDropTable
            items={videos}
            onReorder={handleReorder}
            renderItem={renderVideoItem}
          />
        ) : (
          <div className="text-center py-12">
            <Play className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hero videos</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first hero video.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
