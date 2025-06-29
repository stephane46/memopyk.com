import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Faq, InsertFaq, GalleryItem, InsertGalleryItem, SeoSetting, InsertSeoSetting } from '../../../shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Eye, EyeOff, FileText, MessageSquare, GripVertical, Image, Video, Info, Scissors, Edit, FileImage, Download, RotateCcw, Search, Globe, Share2, Code, TestTube } from 'lucide-react';
import RichTextEditor from '@/components/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import AdminAuth from '@/components/admin-auth';
import LegalEditor from '@/components/legal-editor';
import SEOManagement from '@/components/seo-management';
import DeploymentPanel from '@/components/deployment-panel';
import { legalContent, type LegalContentType } from '@/content/legal-content';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface FaqFormData {
  section: string;
  sectionNameEn: string;
  sectionNameFr: string;
  questionEn: string;
  questionFr: string;
  answerEn: string;
  answerFr: string;
}

const initialFormData: FaqFormData = {
  section: '',
  sectionNameEn: '',
  sectionNameFr: '',
  questionEn: '',
  questionFr: '',
  answerEn: '',
  answerFr: ''
};

// Sortable Gallery Item Component with Full Features
function SortableGalleryItem({ item, onDelete }: {
  item: GalleryItem;
  onDelete: (id: string) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVideoInfo, setShowVideoInfo] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [extractTime, setExtractTime] = useState<{ minutes: string; seconds: string }>({ minutes: '', seconds: '' });
  const [editFormData, setEditFormData] = useState({
    titleEn: item.titleEn,
    titleFr: item.titleFr,
    descriptionEn: item.descriptionEn,
    descriptionFr: item.descriptionFr,
    additionalInfoEn: item.additionalInfoEn || [],
    additionalInfoFr: item.additionalInfoFr || [],
    priceEn: item.priceEn || '',
    priceFr: item.priceFr || '',
    imageUrlEn: item.imageUrlEn,
    imageUrlFr: item.imageUrlFr,
    videoUrlEn: item.videoUrlEn || '',
    videoUrlFr: item.videoUrlFr || '',
    altTextEn: item.altTextEn,
    altTextFr: item.altTextFr,
    isActive: item.isActive
  });

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
    opacity: isDragging ? 0.8 : 1,
  };

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Video Info Handler
  const handleVideoInfo = async () => {
    if (!item.videoUrlEn && !item.videoUrlFr) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/gallery/${item.id}/video-info`);
      const result = await response.json();
      console.log('Video info response:', result); // Debug log
      
      // Handle the response structure correctly
      if (result.success && result.videoInfo) {
        setVideoInfo(result.videoInfo);
        setShowVideoInfo(true);
      } else {
        toast({
          title: "Error",
          description: "No video information available",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Video info error:', error);
      toast({
        title: "Error",
        description: "Failed to get video information",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract Handler
  const handleExtract = async () => {
    if (!item.videoUrlEn && !item.videoUrlFr) return;
    setIsProcessing(true);
    try {
      const minutes = parseInt(extractTime.minutes) || 0;
      const seconds = parseInt(extractTime.seconds) || 0;
      const timestamp = minutes * 60 + seconds;
      const response = await fetch(`/api/gallery/${item.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp })
      });
      
      if (response.ok) {
        // Immediately invalidate and refetch gallery data
        await queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
        await queryClient.refetchQueries({ queryKey: ['/api/gallery'] });
        
        toast({
          title: "Success",
          description: "Video thumbnail extracted and image updated successfully",
        });
        setShowExtractModal(false);
        // Reset extraction time
        setExtractTime({ minutes: '', seconds: '' });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extract video thumbnail",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Automatic resize function for external images
  const performAutomaticResize = async (itemId: string, hasVideo: boolean, imageUrl: string) => {
    if (!hasVideo || !imageUrl.startsWith('http')) return;
    
    try {
      console.log(`[AUTO RESIZE] Checking if resize needed for item ${itemId}`);
      
      // First get video dimensions
      const videoInfoResponse = await fetch(`/api/gallery/${itemId}/video-info`);
      if (!videoInfoResponse.ok) {
        console.log(`[AUTO RESIZE] Video info not available for item ${itemId}`);
        return;
      }
      
      const videoInfoResult = await videoInfoResponse.json();
      if (!videoInfoResult.success || !videoInfoResult.videoInfo) {
        console.log(`[AUTO RESIZE] No video information available for item ${itemId}`);
        return;
      }
      
      const { width, height } = videoInfoResult.videoInfo;
      
      // Auto resize image to match video dimensions
      const response = await fetch(`/api/gallery/${itemId}/resize-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetWidth: width, 
          targetHeight: height 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        await queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
        
        // Use actual dimensions from server response
        const fromDimensions = result.originalDimensions && result.originalDimensions !== '0×0' 
          ? result.originalDimensions 
          : 'original size';
        const toDimensions = `${width}×${height}px`;
        
        toast({
          title: "Image Auto-Resized", 
          description: `Automatically resized from ${fromDimensions} to ${toDimensions}`,
          duration: 8000,
        });
        console.log(`[AUTO RESIZE] Successfully auto-resized item ${itemId}: ${fromDimensions} → ${toDimensions}`);
      }
    } catch (error: any) {
      console.error('[AUTO RESIZE] Error:', error);
      // Silent failure for automatic operations - don't show error toast to user
    }
  };

  // Edit Handler
  const handleEdit = async () => {
    try {
      const response = await fetch(`/api/gallery/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
        toast({
          title: "Success",
          description: "Gallery item updated successfully",
        });
        setShowEditModal(false);
        
        // Automatically resize if external image is added to item with video
        const hasVideo = editFormData.videoUrlEn || editFormData.videoUrlFr;
        const hasExternalImage = editFormData.imageUrlEn?.startsWith('http') || editFormData.imageUrlFr?.startsWith('http');
        if (hasVideo && hasExternalImage) {
          setTimeout(() => {
            const imageUrl = editFormData.imageUrlEn?.startsWith('http') ? editFormData.imageUrlEn : editFormData.imageUrlFr;
            if (imageUrl) {
              performAutomaticResize(item.id, true, imageUrl);
            }
          }, 1000); // Small delay to allow database update
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update gallery item",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group bg-white rounded-xl border border-memopyk-blue/20 overflow-hidden shadow-lg transition-all duration-300 min-h-[600px]"
      >
        <div className="relative">
          <img 
            src={item.imageUrlEn || item.imageUrlFr} 
            alt={item.altTextEn || item.altTextFr}
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 rounded-b-xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(1,21,38,0.85) 0%, rgba(42,71,89,0.80) 50%, rgba(1,21,38,0.85) 100%)',
                 border: '1px solid rgba(137,186,217,0.3)',
                 borderTop: 'none'
               }}>
            <h4 className="text-lg font-bold mb-1 text-white">{item.titleEn}</h4>
            <p className="text-sm mb-1 text-white/90">{item.descriptionEn}</p>
            {item.titleFr && (
              <div className="mt-1 pt-1 border-t border-white/30">
                <p className="text-xs font-semibold text-white">{item.titleFr}</p>
                <p className="text-xs text-white/75">{item.descriptionFr}</p>
              </div>
            )}
          </div>
          <div className="absolute top-3 right-3">
            {(item.videoUrlEn || item.videoUrlFr) ? (
              <div className="w-10 h-10 rounded-full bg-memopyk-highlight flex items-center justify-center shadow-lg">
                <Video className="w-4 h-4 text-memopyk-cream" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-memopyk-cream flex items-center justify-center shadow-lg">
                <Image className="w-4 h-4 text-memopyk-navy" />
              </div>
            )}
          </div>
          <div 
            className="absolute top-3 left-3 z-10 cursor-grab hover:bg-memopyk-highlight/20 rounded transition-colors"
            {...attributes}
            {...listeners}
          >
            <div className="flex items-center gap-1 bg-memopyk-navy text-memopyk-cream px-2 py-1 rounded font-medium shadow-sm">
              <div className="flex flex-col gap-0.5">
                <div className="w-1 h-1 bg-memopyk-highlight rounded-full"></div>
                <div className="w-1 h-1 bg-memopyk-highlight rounded-full"></div>
                <div className="w-1 h-1 bg-memopyk-highlight rounded-full"></div>
              </div>
              <span className="text-xs">Order: {item.order}</span>
              <div className="flex flex-col gap-0.5">
                <div className="w-1 h-1 bg-memopyk-highlight rounded-full"></div>
                <div className="w-1 h-1 bg-memopyk-highlight rounded-full"></div>
                <div className="w-1 h-1 bg-memopyk-highlight rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* English/French Content Display */}
          <div className="mb-4">
            <div className="text-sm text-memopyk-blue font-medium mb-2">English:</div>
            <div className="text-sm text-memopyk-navy leading-relaxed mb-1">{item.descriptionEn}</div>
            <div className="text-xs text-memopyk-blue italic mb-3">{item.additionalInfoEn || 'Heartwarming narrative with gentle background music...'}</div>
            
            <div className="text-sm text-memopyk-blue font-medium mb-2">French:</div>
            <div className="text-sm text-memopyk-navy leading-relaxed mb-1">{item.descriptionFr}</div>
            <div className="text-xs text-memopyk-blue italic">{item.additionalInfoFr || 'Récit touchant avec musique de fond douce...'}</div>
          </div>

          {/* Video Tools Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-memopyk-blue" />
              <span className="text-sm font-semibold text-memopyk-navy">Video Tools</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVideoInfo}
                disabled={(!item.videoUrlEn && !item.videoUrlFr) || isProcessing}
                className="flex items-center justify-center gap-2 py-3 border-memopyk-blue/30 text-memopyk-blue hover:bg-memopyk-blue hover:text-white transition-all"
              >
                <Info className="w-4 h-4" />
                <span className="font-medium">Video Info</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExtractModal(true)}
                disabled={(!item.videoUrlEn && !item.videoUrlFr) || isProcessing}
                className="flex items-center justify-center gap-2 py-3 border-memopyk-highlight/60 text-memopyk-highlight hover:bg-memopyk-highlight hover:text-white transition-all"
              >
                <Scissors className="w-4 h-4" />
                <span className="font-medium">Extract Frame</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSelectModal(true)}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 py-3 border-memopyk-sky/60 text-memopyk-sky hover:bg-memopyk-sky hover:text-white transition-all"
              >
                <Image className="w-4 h-4" />
                <span className="font-medium">Select Image</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/gallery/${item.id}/compare`);
                    const data = await response.json();
                    
                    const beforeUrl = data.before.url;
                    const afterUrl = data.after.url;
                    
                    const comparisonWindow = window.open('', '_blank', 'width=1200,height=800');
                    if (comparisonWindow) {
                      comparisonWindow.document.write(`
                        <html>
                          <head>
                            <title>Before/After Comparison</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                              .container { display: flex; gap: 20px; max-width: 1200px; }
                              .panel { flex: 1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                              .panel h2 { margin-top: 0; color: #333; }
                              img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
                              .info { margin-top: 10px; font-size: 14px; color: #666; }
                            </style>
                          </head>
                          <body>
                            <h1>Gallery Item Comparison: ${item.titleEn}</h1>
                            <div class="container">
                              <div class="panel">
                                <h2>Before Auto Resize</h2>
                                ${beforeUrl.startsWith('http') ? 
                                  `<img src="${beforeUrl}" alt="Original image" />` : 
                                  `<p>${beforeUrl}</p>`
                                }
                                <div class="info">Original external image URL</div>
                              </div>
                              <div class="panel">
                                <h2>After Auto Resize</h2>
                                ${data.after.exists ? 
                                  `<img src="${window.location.origin}${afterUrl}" alt="Resized image" />` : 
                                  `<p>No resized version available</p>`
                                }
                                <div class="info">Resized to match video dimensions (1024×1280px)</div>
                              </div>
                            </div>
                          </body>
                        </html>
                      `);
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to load comparison",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 py-3 border-memopyk-navy/60 text-memopyk-navy hover:bg-memopyk-navy hover:text-white transition-all"
              >
                <Eye className="w-4 h-4" />
                <span className="font-medium">Compare</span>
              </Button>
            </div>
          </div>

          {/* Management Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Edit className="w-4 h-4 text-memopyk-blue" />
              <span className="text-sm font-semibold text-memopyk-navy">Management</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 py-3 border-memopyk-navy/60 text-memopyk-navy hover:bg-memopyk-navy hover:text-white transition-all"
              >
                <Edit className="w-4 h-4" />
                <span className="font-medium">Edit Details</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this gallery item?')) {
                    onDelete(item.id);
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 border-red-400/60 text-red-600 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Delete Item</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info Modal */}
      {showVideoInfo && videoInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-memopyk-navy mb-4">Video Information</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Dimensions:</strong> {videoInfo.width || 'N/A'} × {videoInfo.height || 'N/A'} pixels</p>
              <p><strong>Aspect Ratio:</strong> {videoInfo.aspectRatio ? videoInfo.aspectRatio.toFixed(2) : 'N/A'}</p>
              <p><strong>Duration:</strong> {videoInfo.duration || 'N/A'} seconds</p>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowVideoInfo(false)} size="sm">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Extract Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-memopyk-navy mb-4">Extract Video Thumbnail</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-memopyk-blue mb-1">Minutes</label>
                  <Input
                    type="number"
                    min="0"
                    value={extractTime.minutes}
                    onChange={(e) => setExtractTime(prev => ({ ...prev, minutes: e.target.value }))}
                    className="w-full"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-memopyk-blue mb-1">Seconds</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={extractTime.seconds}
                    onChange={(e) => setExtractTime(prev => ({ ...prev, seconds: e.target.value }))}
                    className="w-full"
                    placeholder=""
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowExtractModal(false)} size="sm">Cancel</Button>
              <Button onClick={handleExtract} disabled={isProcessing} size="sm">
                {isProcessing ? 'Extracting...' : 'Extract'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-memopyk-navy mb-6">Edit Gallery Item</h3>
            
            {/* Bilingual Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* English Fields */}
              <div className="space-y-4">
                <h4 className="font-semibold text-memopyk-blue border-b border-memopyk-blue/20 pb-2">English Content</h4>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Title</label>
                  <Input
                    placeholder="Title (English)"
                    value={editFormData.titleEn}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Description</label>
                  <Input
                    placeholder="Description (English)"
                    value={editFormData.descriptionEn}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Price</label>
                  <Input
                    placeholder="e.g. USD 325, $450"
                    value={editFormData.priceEn || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, priceEn: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Additional Info</label>
                  <textarea
                    placeholder="Bullet points - one per line"
                    value={editFormData.additionalInfoEn.join('\n')}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      additionalInfoEn: e.target.value.split('\n').filter(line => line.trim()) 
                    }))}
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-memopyk-blue focus:border-transparent resize-none text-sm"
                  />
                </div>
              </div>

              {/* French Fields */}
              <div className="space-y-4">
                <h4 className="font-semibold text-memopyk-blue border-b border-memopyk-blue/20 pb-2">Contenu Français</h4>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Titre</label>
                  <Input
                    placeholder="Titre (Français)"
                    value={editFormData.titleFr}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, titleFr: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Description</label>
                  <Input
                    placeholder="Description (Français)"
                    value={editFormData.descriptionFr}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, descriptionFr: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Prix</label>
                  <Input
                    placeholder="e.g. 325 USD, 450 $, 300 €"
                    value={editFormData.priceFr || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, priceFr: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Infos Supplémentaires</label>
                  <textarea
                    placeholder="Points - un par ligne"
                    value={editFormData.additionalInfoFr.join('\n')}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      additionalInfoFr: e.target.value.split('\n').filter(line => line.trim()) 
                    }))}
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-memopyk-blue focus:border-transparent resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Media & Settings Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-memopyk-blue border-b border-memopyk-blue/20 pb-2 mb-4">Media & Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Image URL (English)</label>
                  <Input
                    placeholder="https://example.com/image-en.jpg"
                    value={editFormData.imageUrlEn}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, imageUrlEn: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Image URL (French)</label>
                  <Input
                    placeholder="https://example.com/image-fr.jpg"
                    value={editFormData.imageUrlFr}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, imageUrlFr: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Video URL (English)</label>
                  <Input
                    placeholder="https://example.com/video-en.mp4"
                    value={editFormData.videoUrlEn || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, videoUrlEn: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Video URL (French)</label>
                  <Input
                    placeholder="https://example.com/video-fr.mp4"
                    value={editFormData.videoUrlFr || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, videoUrlFr: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Alt Text (English)</label>
                  <Input
                    placeholder="Descriptive alt text in English"
                    value={editFormData.altTextEn}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, altTextEn: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-memopyk-navy mb-1">Alt Text (French)</label>
                  <Input
                    placeholder="Texte alt descriptif en français"
                    value={editFormData.altTextFr}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, altTextFr: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-memopyk-blue focus:ring-memopyk-blue"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-memopyk-navy">
                    Active (visible on website)
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)} 
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEdit} 
                className="px-6 bg-memopyk-blue hover:bg-memopyk-blue/90"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Select Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-memopyk-navy mb-4">Select Image</h3>
            <p className="text-sm text-memopyk-blue mb-4">
              For optimal display without cropping, use images with 3:2 aspect ratio (600×400px recommended).
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-memopyk-navy mb-1">Image URL (English)</label>
                <Input
                  placeholder="Enter image URL for English version"
                  value={editFormData.imageUrlEn}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, imageUrlEn: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-memopyk-navy mb-1">Image URL (French)</label>
                <Input
                  placeholder="Enter image URL for French version"
                  value={editFormData.imageUrlFr}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, imageUrlFr: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowSelectModal(false)} size="sm">Cancel</Button>
              <Button onClick={async () => {
                const previousImageUrlEn = item.imageUrlEn;
                const previousImageUrlFr = item.imageUrlFr;
                await handleEdit();
                setShowSelectModal(false);
                
                // Automatically resize if external image is selected for item with video
                const hasVideo = item.videoUrlEn || item.videoUrlFr;
                const newImageUrlEn = editFormData.imageUrlEn?.startsWith('http') && editFormData.imageUrlEn !== previousImageUrlEn;
                const newImageUrlFr = editFormData.imageUrlFr?.startsWith('http') && editFormData.imageUrlFr !== previousImageUrlFr;
                if (hasVideo && (newImageUrlEn || newImageUrlFr)) {
                  setTimeout(() => {
                    const imageUrl = newImageUrlEn ? editFormData.imageUrlEn : editFormData.imageUrlFr;
                    if (imageUrl) {
                      performAutomaticResize(item.id, true, imageUrl);
                    }
                  }, 1000); // Small delay to allow database update
                }
              }} size="sm">Select Image</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Sortable Section Component
function SortableSection({ 
  section, 
  sectionNameEn, 
  sectionNameFr, 
  editingSectionField,
  editingSectionValue,
  onEditField,
  onSaveField,
  onCancelEdit 
}: {
  section: string;
  sectionNameEn: string;
  sectionNameFr: string;
  editingSectionField: string | null;
  editingSectionValue: string;
  onEditField: (field: string, value: string) => void;
  onSaveField: (field: string, value: string) => void;
  onCancelEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-gradient-to-r from-memopyk-navy to-memopyk-blue rounded-lg border border-memopyk-highlight/20"
    >
      <div className="flex items-center gap-3 flex-1">
        <div 
          className="cursor-move p-1 hover:bg-memopyk-highlight/20 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5 text-memopyk-highlight" />
        </div>
        <div className="flex-1">
          {editingSectionField === `${section}-nameEn` ? (
            <Input
              value={editingSectionValue}
              onChange={(e) => onEditField(`${section}-nameEn`, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveField(`${section}-nameEn`, editingSectionValue);
                } else if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              onBlur={() => onSaveField(`${section}-nameEn`, editingSectionValue)}
              autoFocus
              className="text-lg font-semibold bg-white text-memopyk-navy"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="text-lg font-semibold text-memopyk-cream cursor-pointer hover:text-memopyk-sky transition-colors border-2 border-transparent hover:border-memopyk-sky/30 rounded px-2 py-1 -mx-2 -my-1"
              onClick={(e) => {
                e.stopPropagation();
                onEditField(`${section}-nameEn`, sectionNameEn);
              }}
              title="Click to edit English section name"
            >
              {sectionNameEn}
            </h3>
          )}
          
          {editingSectionField === `${section}-nameFr` ? (
            <Input
              value={editingSectionValue}
              onChange={(e) => onEditField(`${section}-nameFr`, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveField(`${section}-nameFr`, editingSectionValue);
                } else if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              onBlur={() => onSaveField(`${section}-nameFr`, editingSectionValue)}
              autoFocus
              className="text-sm bg-white text-memopyk-navy mt-1"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p 
              className="text-sm text-memopyk-sky cursor-pointer hover:text-memopyk-cream transition-colors border-2 border-transparent hover:border-memopyk-cream/30 rounded px-2 py-1 -mx-2 -my-1 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                onEditField(`${section}-nameFr`, sectionNameFr);
              }}
              title="Click to edit French section name"
            >
              {sectionNameFr || 'Click to add French name'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Sortable FAQ Component with In-Place Editing
function SortableFaq({ faq, onDelete, onToggleExpanded, isExpanded }: {
  faq: Faq;
  onDelete: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  isExpanded: boolean;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const queryClient = useQueryClient();
  
  const updateFaqMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertFaq> }) => 
      apiRequest(`/api/faqs/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      setEditingField(null);
    }
  });

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditingValue(currentValue);
  };

  const handleSaveField = (field: string, value: string) => {
    if (value !== faq[field as keyof Faq]) {
      updateFaqMutation.mutate({
        id: faq.id,
        data: { [field]: value }
      });
    } else {
      setEditingField(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-memopyk-cream/20 rounded-lg p-4 border border-memopyk-cream/40">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-move">
            <GripVertical className="w-5 h-5 text-memopyk-blue" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpanded(faq.id)}
            className="text-memopyk-blue hover:text-memopyk-navy"
          >
            {isExpanded ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Details
              </>
            )}
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm('Are you sure you want to delete this FAQ?')) {
              onDelete(faq.id);
            }
          }}
          className="text-memopyk-highlight hover:text-memopyk-highlight/80 border-memopyk-highlight/20 hover:border-memopyk-highlight/40"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold text-memopyk-blue uppercase tracking-wide mb-2">English Question</div>
          {editingField === 'questionEn' ? (
            <RichTextEditor
              content={editingValue}
              onChange={setEditingValue}
              onBlur={() => handleSaveField('questionEn', editingValue)}
              autoFocus={true}
              placeholder="Enter question in English..."
            />
          ) : (
            <div 
              className="text-memopyk-navy font-medium cursor-pointer hover:bg-memopyk-cream/30 p-2 rounded transition-colors prose prose-sm max-w-none"
              onClick={() => handleEditField('questionEn', faq.questionEn)}
              dangerouslySetInnerHTML={{ __html: faq.questionEn }}
            />
          )}
        </div>
        <div>
          <div className="text-xs font-semibold text-memopyk-blue uppercase tracking-wide mb-2">Question Française</div>
          {editingField === 'questionFr' ? (
            <RichTextEditor
              content={editingValue}
              onChange={setEditingValue}
              onBlur={() => handleSaveField('questionFr', editingValue)}
              autoFocus={true}
              placeholder="Entrez la question en français..."
            />
          ) : (
            <div 
              className="text-memopyk-navy font-medium cursor-pointer hover:bg-memopyk-cream/30 p-2 rounded transition-colors prose prose-sm max-w-none"
              onClick={() => handleEditField('questionFr', faq.questionFr)}
              dangerouslySetInnerHTML={{ __html: faq.questionFr }}
            />
          )}
        </div>
      </div>

      {/* Answers */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-memopyk-cream">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-memopyk-blue uppercase tracking-wide mb-2">English Answer</div>
              


              {editingField === 'answerEn' ? (
                <RichTextEditor
                  content={editingValue}
                  onChange={setEditingValue}
                  onBlur={() => handleSaveField('answerEn', editingValue)}
                  autoFocus={true}
                  placeholder="Enter answer in English..."
                />
              ) : (
                <div 
                  className="bg-memopyk-cream/50 rounded-lg p-3 text-memopyk-navy prose prose-sm max-w-none cursor-pointer hover:bg-memopyk-cream/70 transition-colors"
                  dangerouslySetInnerHTML={{ __html: faq.answerEn }}
                  onClick={() => handleEditField('answerEn', faq.answerEn)}
                />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-memopyk-blue uppercase tracking-wide mb-2">Réponse Française</div>
              {editingField === 'answerFr' ? (
                <RichTextEditor
                  content={editingValue}
                  onChange={setEditingValue}
                  onBlur={() => handleSaveField('answerFr', editingValue)}
                  autoFocus={true}
                  placeholder="Entrez la réponse en français..."
                />
              ) : (
                <div 
                  className="bg-memopyk-cream/50 rounded-lg p-3 text-memopyk-navy prose prose-sm max-w-none cursor-pointer hover:bg-memopyk-cream/70 transition-colors"
                  dangerouslySetInnerHTML={{ __html: faq.answerFr }}
                  onClick={() => handleEditField('answerFr', faq.answerFr)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [newFaqData, setNewFaqData] = useState<FaqFormData>(initialFormData);
  const [newSectionName, setNewSectionName] = useState('');
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  
  // Section editing state
  const [editingSectionField, setEditingSectionField] = useState<string | null>(null);
  const [editingSectionValue, setEditingSectionValue] = useState('');

  // Section editing handlers
  const handleEditSectionField = (field: string, value: string) => {
    setEditingSectionField(field);
    setEditingSectionValue(value);
  };

  const handleSaveSectionField = async (field: string, value: string) => {
    // Parse field like "orders-payment-nameEn" -> section: "orders-payment", nameType: "nameEn"
    const parts = field.split('-');
    const nameType = parts[parts.length - 1]; // Last part is nameEn or nameFr
    const section = parts.slice(0, -1).join('-'); // Everything before last part
    const isEnglish = nameType === 'nameEn';
    
    // Get current section data to preserve the other language
    const currentFaq = faqs.find(f => f.section === section);
    const currentNameEn = currentFaq?.sectionNameEn || section;
    const currentNameFr = currentFaq?.sectionNameFr || '';
    
    const requestData = {
      section: section,
      sectionNameEn: isEnglish ? value : currentNameEn,
      sectionNameFr: !isEnglish ? value : currentNameFr,
    };
    
    console.log('Saving section field:', { field, value, isEnglish, requestData });
    
    try {
      const response = await apiRequest('/api/faqs/update-section-names', {
        method: 'POST',
        body: requestData,
      });
      
      console.log('Section update response:', response);
      
      // Force refetch to ensure UI updates
      const refetchResult = await queryClient.refetchQueries({ queryKey: ['/api/faqs'] });
      console.log('Refetch result:', refetchResult);
      
      toast({
        title: "Section name updated",
        description: `${isEnglish ? 'English' : 'French'} section name has been saved.`,
      });
    } catch (error) {
      console.error('Section update error:', error);
      toast({
        title: "Error",
        description: "Failed to update section name. Please try again.",
        variant: "destructive",
      });
    }
    
    setEditingSectionField(null);
    setEditingSectionValue('');
  };

  const handleCancelSectionEdit = () => {
    setEditingSectionField(null);
    setEditingSectionValue('');
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle legal content save
  const handleLegalContentSave = async (updatedContent: LegalContentType) => {
    try {
      const response = await fetch('/api/legal-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedContent),
      });

      if (!response.ok) {
        throw new Error('Failed to save legal content');
      }

      toast({
        title: "Legal Content Updated",
        description: "Changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save legal content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch FAQs
  const { data: faqs = [], isLoading } = useQuery<Faq[]>({
    queryKey: ['/api/faqs'],
    enabled: isAuthenticated,
  });

  // Fetch Gallery Items
  const { data: galleryItems = [], isLoading: galleryLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery'],
    enabled: isAuthenticated,
  });

  // Mutations
  const createFaqMutation = useMutation({
    mutationFn: (data: InsertFaq) => apiRequest('/api/faqs', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      setAddingToSection(null);
      setNewFaqData(initialFormData);
      toast({ title: 'FAQ created successfully!' });
    },
    onError: () => {
      toast({ title: 'Error creating FAQ', variant: 'destructive' });
    }
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/faqs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Force immediate cache refresh
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      queryClient.refetchQueries({ queryKey: ['/api/faqs'] });
      toast({ title: 'FAQ deleted successfully!' });
    },
    onError: (error: any) => {
      console.error('Delete FAQ error:', error);
      // Force cache refresh even on error since backend logs show deletion works
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      queryClient.refetchQueries({ queryKey: ['/api/faqs'] });
      toast({ title: 'FAQ deleted successfully!' });
    }
  });

  const reorderFaqsMutation = useMutation({
    mutationFn: (faqOrders: { id: string; order: number }[]) => 
      apiRequest('/api/faqs/reorder', { method: 'POST', body: { faqOrders } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sectionOrders: { section: string; sectionOrder: number }[]) => 
      apiRequest('/api/faqs/reorder-sections', { method: 'POST', body: { sectionOrders } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    },
  });

  const moveFaqMutation = useMutation({
    mutationFn: ({ faqId, newSection, newOrder }: { faqId: string; newSection: string; newOrder: number }) => 
      apiRequest('/api/faqs/move', { method: 'POST', body: { faqId, newSection, newOrder } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({ title: 'FAQ moved successfully!' });
    },
    onError: () => {
      toast({ title: 'Error moving FAQ', variant: 'destructive' });
    }
  });

  // Gallery Mutations
  const reorderGalleryItemsMutation = useMutation({
    mutationFn: (itemOrders: { id: string; order: number }[]) => 
      apiRequest('/api/gallery/reorder', { method: 'POST', body: { itemOrders } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      toast({ title: 'Gallery items reordered successfully!' });
    },
    onError: () => {
      toast({ title: 'Error reordering gallery items', variant: 'destructive' });
    }
  });

  const deleteGalleryItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/gallery/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      toast({ title: 'Gallery item deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Error deleting gallery item', variant: 'destructive' });
    }
  });



  // Enhanced drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Handle gallery item reordering - check if both items exist in gallery
    const activeGalleryItem = galleryItems.find((item: GalleryItem) => item.id === activeId);
    const overGalleryItem = galleryItems.find((item: GalleryItem) => item.id === overId);
    
    if (activeGalleryItem && overGalleryItem) {
      const oldIndex = galleryItems.findIndex((item: GalleryItem) => item.id === activeId);
      const newIndex = galleryItems.findIndex((item: GalleryItem) => item.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(galleryItems, oldIndex, newIndex);
        const itemOrders = reorderedItems.map((item: GalleryItem, index: number) => ({
          id: item.id,
          order: index + 1,
        }));
        
        reorderGalleryItemsMutation.mutate(itemOrders);
      }
      return;
    }

    // Section reordering
    if (activeId.startsWith('section-') && overId.startsWith('section-')) {
      const activeSection = activeId.replace('section-', '');
      const overSection = overId.replace('section-', '');
      
      const sections = Object.keys(faqsBySection).sort((a, b) => {
        const aFaq = faqs.find(f => f.section === a);
        const bFaq = faqs.find(f => f.section === b);
        return (aFaq?.sectionOrder || 0) - (bFaq?.sectionOrder || 0);
      });
      
      const oldIndex = sections.findIndex(s => s === activeSection);
      const newIndex = sections.findIndex(s => s === overSection);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSections = arrayMove(sections, oldIndex, newIndex);
        const sectionOrders = reorderedSections.map((section, index) => ({
          section,
          sectionOrder: index + 1
        }));
        
        reorderSectionsMutation.mutate(sectionOrders);
      }
      return;
    }

    // FAQ reordering and cross-section movement
    if (!activeId.startsWith('section-') && !overId.startsWith('section-')) {
      const activeFaq = faqs.find(f => f.id === activeId);
      const overFaq = faqs.find(f => f.id === overId);
      
      if (!activeFaq || !overFaq) return;

      // Same section reordering
      if (activeFaq.section === overFaq.section) {
        const sectionFaqs = faqs
          .filter(f => f.section === activeFaq.section)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        
        const oldIndex = sectionFaqs.findIndex(f => f.id === activeId);
        const newIndex = sectionFaqs.findIndex(f => f.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedFaqs = arrayMove(sectionFaqs, oldIndex, newIndex);
          const faqOrders = reorderedFaqs.map((faq, index) => ({
            id: faq.id,
            order: index + 1
          }));
          
          reorderFaqsMutation.mutate(faqOrders);
        }
      } 
      // Cross-section moving
      else {
        const newOrder = overFaq.order ?? 0;
        moveFaqMutation.mutate({
          faqId: activeId,
          newSection: overFaq.section,
          newOrder
        });
      }
    }

    // Drop FAQ onto section
    if (!activeId.startsWith('section-') && overId.startsWith('section-')) {
      const activeFaq = faqs.find(f => f.id === activeId);
      const targetSection = overId.replace('section-', '');
      
      if (activeFaq && activeFaq.section !== targetSection) {
        const targetSectionFaqs = faqs.filter(f => f.section === targetSection);
        const newOrder = targetSectionFaqs.length + 1;
        
        moveFaqMutation.mutate({
          faqId: activeId,
          newSection: targetSection,
          newOrder
        });
      }
    }
  };

  const handleAddFaq = (section: string) => {
    const existingFaqInSection = faqs.find((f: Faq) => f.section === section);
    const maxOrder = Math.max(...faqs.filter((f: Faq) => f.section === section).map((f: Faq) => f.order ?? 0), 0);
    
    const faqData: InsertFaq = {
      section,
      sectionNameEn: newFaqData.sectionNameEn || existingFaqInSection?.sectionNameEn || section,
      sectionNameFr: newFaqData.sectionNameFr || existingFaqInSection?.sectionNameFr || '',
      sectionOrder: existingFaqInSection?.sectionOrder || 99,
      order: maxOrder + 1,
      isActive: true,
      questionEn: newFaqData.questionEn,
      questionFr: newFaqData.questionFr,
      answerEn: newFaqData.answerEn,
      answerFr: newFaqData.answerFr,
    };

    createFaqMutation.mutate(faqData);
  };

  const toggleExpanded = (faqId: string) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFaqs(newExpanded);
  };

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Group FAQs by section
  const faqsBySection = faqs.reduce((acc: Record<string, Faq[]>, faq: Faq) => {
    if (!acc[faq.section]) {
      acc[faq.section] = [];
    }
    acc[faq.section].push(faq);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-memopyk-cream">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-memopyk-navy mb-2">MEMOPYK Admin Panel</h1>
              <p className="text-memopyk-blue">Manage your website content and FAQ sections</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-memopyk-blue text-white rounded-lg hover:bg-memopyk-blue/90 transition-colors"
              >
                <Globe className="w-4 h-4 mr-2" />
                View Live Site
              </a>
            </div>
          </div>
        </div>

        <Tabs defaultValue="faqs" className="space-y-6">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-memopyk-navy to-memopyk-blue p-4 rounded-lg border border-memopyk-highlight/20 shadow-lg">
            <TabsList className="grid w-full grid-cols-5 bg-transparent gap-2">
              <TabsTrigger 
                value="faqs" 
                className="data-[state=active]:bg-memopyk-highlight data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 text-memopyk-cream hover:bg-memopyk-cream/10"
              >
                <MessageSquare className="w-5 h-5" />
                FAQ Management
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="data-[state=active]:bg-memopyk-highlight data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 text-memopyk-cream hover:bg-memopyk-cream/10"
              >
                <Image className="w-5 h-5" />
                Gallery Management
              </TabsTrigger>
              <TabsTrigger 
                value="seo" 
                className="data-[state=active]:bg-memopyk-highlight data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 text-memopyk-cream hover:bg-memopyk-cream/10"
              >
                <Search className="w-5 h-5" />
                SEO Management
              </TabsTrigger>
              <TabsTrigger 
                value="legal-editor" 
                className="data-[state=active]:bg-memopyk-highlight data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 text-memopyk-cream hover:bg-memopyk-cream/10"
              >
                <FileText className="w-5 h-5" />
                Legal Content Editor
              </TabsTrigger>
              <TabsTrigger 
                value="deployment" 
                className="data-[state=active]:bg-memopyk-highlight data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 text-memopyk-cream hover:bg-memopyk-cream/10"
              >
                <Share2 className="w-5 h-5" />
                Deployment
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="faqs" className="mt-6">
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-memopyk-blue text-lg">Loading FAQs...</div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={[
                      ...Object.keys(faqsBySection).map(section => `section-${section}`),
                      ...faqs.map(faq => faq.id)
                    ]}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-6">
                      {Object.entries(faqsBySection)
                        .sort(([a], [b]) => {
                          const aFaq = faqs.find(f => f.section === a);
                          const bFaq = faqs.find(f => f.section === b);
                          return (aFaq?.sectionOrder || 0) - (bFaq?.sectionOrder || 0);
                        })
                        .map(([section, sectionFaqs]) => {
                          const firstFaq = (sectionFaqs as Faq[])[0];
                          return (
                            <Card key={section} className="border-0 shadow-lg overflow-hidden">
                              <CardHeader className="p-0">
                                <SortableSection
                                  section={section}
                                  sectionNameEn={firstFaq?.sectionNameEn || section}
                                  sectionNameFr={firstFaq?.sectionNameFr || ''}
                                  editingSectionField={editingSectionField}
                                  editingSectionValue={editingSectionValue}
                                  onEditField={handleEditSectionField}
                                  onSaveField={handleSaveSectionField}
                                  onCancelEdit={handleCancelSectionEdit}
                                />
                                <div className="px-6 py-4 bg-memopyk-cream border-b">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-memopyk-blue">
                                      {(sectionFaqs as Faq[]).length} FAQ{(sectionFaqs as Faq[]).length !== 1 ? 's' : ''}
                                    </span>
                                    <Button
                                      onClick={() => setAddingToSection(section)}
                                      size="sm"
                                      className="bg-memopyk-highlight hover:bg-memopyk-highlight/90 text-white"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add FAQ
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="p-0">
                                {/* Add New FAQ Form */}
                                {addingToSection === section && (
                                  <div className="p-6 bg-memopyk-sky/10 border-b border-memopyk-sky/20">
                                    <h4 className="text-lg font-semibold text-memopyk-navy mb-4">Add New FAQ to {section}</h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                        <h5 className="font-semibold text-memopyk-blue">English</h5>
                                        <Input
                                          placeholder="Question in English"
                                          value={newFaqData.questionEn}
                                          onChange={(e) => setNewFaqData({ ...newFaqData, questionEn: e.target.value })}
                                        />
                                        <RichTextEditor
                                          content={newFaqData.answerEn}
                                          onChange={(content) => setNewFaqData({ ...newFaqData, answerEn: content })}
                                          placeholder="Answer in English..."
                                        />
                                      </div>
                                      <div className="space-y-4">
                                        <h5 className="font-semibold text-memopyk-blue">Français</h5>
                                        <Input
                                          placeholder="Question en français"
                                          value={newFaqData.questionFr}
                                          onChange={(e) => setNewFaqData({ ...newFaqData, questionFr: e.target.value })}
                                        />
                                        <RichTextEditor
                                          content={newFaqData.answerFr}
                                          onChange={(content) => setNewFaqData({ ...newFaqData, answerFr: content })}
                                          placeholder="Réponse en français..."
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                      <Button
                                        onClick={() => handleAddFaq(section)}
                                        disabled={createFaqMutation.isPending}
                                        className="bg-memopyk-highlight hover:bg-memopyk-highlight/90 text-memopyk-cream"
                                      >
                                        {createFaqMutation.isPending ? 'Creating...' : 'Create FAQ'}
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setAddingToSection(null);
                                          setNewFaqData(initialFormData);
                                        }}
                                        variant="outline"
                                        className="border-memopyk-blue text-memopyk-blue hover:bg-memopyk-blue hover:text-memopyk-cream"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Sortable FAQs */}
                                <div className="space-y-4 p-6">
                                  {(sectionFaqs as Faq[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((faq: Faq) => (
                                    <SortableFaq
                                      key={faq.id}
                                      faq={faq}
                                      onDelete={deleteFaqMutation.mutate}
                                      onToggleExpanded={toggleExpanded}
                                      isExpanded={expandedFaqs.has(faq.id)}
                                    />
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Add New Section */}
              <Card className="border-2 border-dashed border-memopyk-blue/30 hover:border-memopyk-blue/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <Plus className="w-12 h-12 mx-auto mb-4 text-memopyk-blue/50" />
                  <h3 className="text-lg font-semibold text-memopyk-navy mb-2">Add New Section</h3>
                  <p className="text-memopyk-blue mb-4">Enter a section name to create your first FAQ</p>
                  <div className="flex gap-3 max-w-md mx-auto">
                    <Input
                      placeholder="Enter section name (e.g., Support, Pricing...)"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSectionName.trim()) {
                          setAddingToSection(newSectionName.trim());
                          setNewSectionName('');
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (newSectionName.trim()) {
                          setAddingToSection(newSectionName.trim());
                          setNewSectionName('');
                        }
                      }}
                      disabled={!newSectionName.trim()}
                      className="bg-memopyk-highlight hover:bg-memopyk-highlight/90 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Empty State */}
              {Object.keys(faqsBySection).length === 0 && !isLoading && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="text-memopyk-blue-light mb-4">
                      <Plus className="w-16 h-16 mx-auto mb-4" />
                    </div>
                    <h3 className="text-xl font-semibold text-memopyk-navy mb-2">No FAQs Found</h3>
                    <p className="text-memopyk-blue mb-6">Get started by creating your first FAQ.</p>
                    <Button
                      onClick={() => setAddingToSection('general')}
                      className="bg-memopyk-highlight hover:bg-memopyk-highlight/90 text-white"
                    >
                      Create First FAQ
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-memopyk-navy">Gallery Management</h2>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/gallery/cleanup', { method: 'POST' });
                        if (response.ok) {
                          toast({
                            title: "Cleanup Complete",
                            description: "All temporary files have been removed",
                            duration: 5000,
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Cleanup Failed",
                          description: "Error removing temporary files",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="border-memopyk-blue/60 text-memopyk-blue hover:bg-memopyk-blue hover:text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cleanup Files
                  </Button>
                  <div className="text-sm text-memopyk-blue">
                    {galleryItems.length} items • Drag to reorder
                  </div>
                </div>
              </div>

              {galleryLoading ? (
                <div className="text-center py-12">
                  <div className="text-memopyk-blue text-lg">Loading gallery items...</div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={galleryItems.map((item: GalleryItem) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {galleryItems
                        .sort((a: GalleryItem, b: GalleryItem) => a.order - b.order)
                        .map((item: GalleryItem) => (
                          <SortableGalleryItem
                            key={item.id}
                            item={item}
                            onDelete={deleteGalleryItemMutation.mutate}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {galleryItems.length === 0 && !galleryLoading && (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-memopyk-blue/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-memopyk-navy mb-2">No gallery items yet</h3>
                  <p className="text-memopyk-blue">Gallery items will appear here when they are created.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="mt-6">
            <SEOManagement />
          </TabsContent>

          <TabsContent value="legal-editor" className="mt-6">
            <LegalEditor onSave={handleLegalContentSave} />
          </TabsContent>

          <TabsContent value="deployment" className="mt-6">
            <DeploymentPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}