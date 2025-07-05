import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GripVertical, Image, Video } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GalleryItem, InsertGalleryItem } from "@shared/schema";

interface SortableGalleryItemProps {
  item: GalleryItem;
  onEdit: (item: GalleryItem) => void;
  onDelete: (id: string) => void;
}

function SortableGalleryItem({ item, onEdit, onDelete }: SortableGalleryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`border border-gray-200 overflow-hidden ${isDragging ? 'z-50' : ''}`}
    >
      <div className="relative">
        <img
          src={item.imageUrlEn || "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250"}
          alt={item.titleEn}
          className="w-full h-32 object-cover"
        />
        <div 
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1 bg-white/80 rounded cursor-grab active:cursor-grabbing hover:bg-white/90 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>
        <div className="absolute top-2 right-2 flex space-x-1">
          {item.videoUrl && (
            <div className="p-1 bg-white/80 rounded">
              <Video className="h-4 w-4 text-blue-600" />
            </div>
          )}
          {(item.imageUrlEn || item.imageUrlFr) && (
            <div className="p-1 bg-white/80 rounded">
              <Image className="h-4 w-4 text-green-600" />
            </div>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 line-clamp-1">{item.titleEn}</h4>
          <div className="flex items-center space-x-1">
            <span className="w-4 h-3 bg-blue-500 rounded-sm" title="English"></span>
            <span className="w-4 h-3 bg-red-500 rounded-sm" title="Français"></span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.descriptionEn}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-orange-600 font-semibold">
            {item.priceEn}
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Gallery() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
  });

  const createMutation = useMutation({
    mutationFn: async (item: InsertGalleryItem) => {
      const res = await apiRequest("POST", "/api/gallery", item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setIsDialogOpen(false);
      toast({ title: "Gallery item created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create gallery item", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, item }: { id: number; item: Partial<InsertGalleryItem> }) => {
      const res = await apiRequest("PUT", `/api/gallery/${id}`, item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Gallery item updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update gallery item", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "Gallery item deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete gallery item", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const item: InsertGalleryItem = {
      titleEn: formData.get("titleEn") as string,
      titleFr: formData.get("titleFr") as string,
      descriptionEn: formData.get("descriptionEn") as string,
      descriptionFr: formData.get("descriptionFr") as string,
      imageUrlEn: formData.get("imageUrlEn") as string,
      imageUrlFr: formData.get("imageUrlFr") as string,
      videoUrl: formData.get("videoUrl") as string,
      videoUrlFr: formData.get("videoUrlFr") as string,
      altTextEn: formData.get("altTextEn") as string,
      altTextFr: formData.get("altTextFr") as string,
      additionalInfoEn: formData.get("additionalInfoEn") as string,
      additionalInfoFr: formData.get("additionalInfoFr") as string,
      priceEn: formData.get("priceEn") as string,
      priceFr: formData.get("priceFr") as string,
      orderIndex: items.length,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, item });
    } else {
      createMutation.mutate(item);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
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
            <CardTitle>Gallery Management</CardTitle>
            <p className="text-gray-600 text-sm mt-1">
              Manage portfolio items with bilingual content and video processing
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="memopyk-highlight hover:bg-orange-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Gallery Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Gallery Item" : "Add Gallery Item"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="titleEn">Title (English)</Label>
                    <Input
                      id="titleEn"
                      name="titleEn"
                      defaultValue={editingItem?.titleEn}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="titleFr">Title (Français)</Label>
                    <Input
                      id="titleFr"
                      name="titleFr"
                      defaultValue={editingItem?.titleFr}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="descriptionEn">Description (English)</Label>
                    <Textarea
                      id="descriptionEn"
                      name="descriptionEn"
                      defaultValue={editingItem?.descriptionEn || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descriptionFr">Description (Français)</Label>
                    <Textarea
                      id="descriptionFr"
                      name="descriptionFr"
                      defaultValue={editingItem?.descriptionFr || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imageUrlEn">Image URL (English)</Label>
                    <Input
                      id="imageUrlEn"
                      name="imageUrlEn"
                      type="url"
                      defaultValue={editingItem?.imageUrlEn || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageUrlFr">Image URL (Français)</Label>
                    <Input
                      id="imageUrlFr"
                      name="imageUrlFr"
                      type="url"
                      defaultValue={editingItem?.imageUrlFr || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="videoUrl">Video URL (English)</Label>
                    <Input
                      id="videoUrl"
                      name="videoUrl"
                      type="url"
                      defaultValue={editingItem?.videoUrl || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="videoUrlFr">Video URL (Français)</Label>
                    <Input
                      id="videoUrlFr"
                      name="videoUrlFr"
                      type="url"
                      defaultValue={editingItem?.videoUrlFr || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="altTextEn">Alt Text (English)</Label>
                    <Input
                      id="altTextEn"
                      name="altTextEn"
                      defaultValue={editingItem?.altTextEn || ""}
                      placeholder="Descriptive text for images"
                    />
                  </div>
                  <div>
                    <Label htmlFor="altTextFr">Alt Text (Français)</Label>
                    <Input
                      id="altTextFr"
                      name="altTextFr"
                      defaultValue={editingItem?.altTextFr || ""}
                      placeholder="Texte descriptif pour les images"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="additionalInfoEn">Additional Info (English)</Label>
                    <Textarea
                      id="additionalInfoEn"
                      name="additionalInfoEn"
                      defaultValue={editingItem?.additionalInfoEn || ""}
                      placeholder="Bullet points for description boxes"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="additionalInfoFr">Additional Info (Français)</Label>
                    <Textarea
                      id="additionalInfoFr"
                      name="additionalInfoFr"
                      defaultValue={editingItem?.additionalInfoFr || ""}
                      placeholder="Puces pour les boîtes de description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceEn">Price (English)</Label>
                    <Input
                      id="priceEn"
                      name="priceEn"
                      defaultValue={editingItem?.priceEn || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceFr">Price (Français)</Label>
                    <Input
                      id="priceFr"
                      name="priceFr"
                      defaultValue={editingItem?.priceFr || ""}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="border border-gray-200 overflow-hidden">
                <img
                  src={item.imageUrlEn || "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250"}
                  alt={item.titleEn}
                  className="w-full h-32 object-cover"
                />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{item.titleEn}</h4>
                    <div className="flex items-center space-x-1">
                      <span className="w-4 h-3 bg-blue-500 rounded-sm"></span>
                      <span className="w-4 h-3 bg-red-500 rounded-sm"></span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.descriptionEn}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-semibold">
                      {item.priceEn}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Plus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No gallery items</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first gallery item.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
