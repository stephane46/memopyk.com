import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Faq, InsertFaq, GalleryItem, InsertGalleryItem } from '../../../shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Eye, EyeOff, FileText, MessageSquare, GripVertical, Image, Video, Info, Scissors, Edit, FileImage } from 'lucide-react';
import RichTextEditor from '@/components/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import AdminAuth from '@/components/admin-auth';
import LegalEditor from '@/components/legal-editor';
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

// Sortable Gallery Item Component
function SortableGalleryItem({ item, onDelete }: {
  item: GalleryItem;
  onDelete: (id: string) => void;
}) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white rounded-xl border border-memopyk-blue/20 overflow-hidden shadow-lg transition-all duration-300"
      {...attributes}
      {...listeners}
    >
      <div className="relative">
        <img 
          src={item.imageUrl} 
          alt={item.altText}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-memopyk-navy/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 text-memopyk-cream">
          <h4 className="text-lg font-bold mb-1">{item.titleEn}</h4>
          <p className="text-sm opacity-90">{item.descriptionEn}</p>
          {item.titleFr && (
            <div className="mt-1 pt-1 border-t border-memopyk-cream/30">
              <p className="text-xs font-semibold">{item.titleFr}</p>
              <p className="text-xs opacity-75">{item.descriptionFr}</p>
            </div>
          )}
        </div>
        <div className="absolute top-3 right-3">
          {item.videoUrl ? (
            <div className="w-10 h-10 rounded-full bg-memopyk-highlight flex items-center justify-center shadow-lg">
              <Video className="w-4 h-4 text-memopyk-cream" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-memopyk-cream flex items-center justify-center shadow-lg">
              <Image className="w-4 h-4 text-memopyk-navy" />
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className="text-xs bg-memopyk-navy/80 text-memopyk-cream px-2 py-1 rounded">
            Order: {item.order}
          </span>
        </div>
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
          <GripVertical className="w-5 h-5 text-memopyk-highlight cursor-grab" />
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-memopyk-blue font-medium">
            {item.isActive ? 'Active' : 'Inactive'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this gallery item?')) {
                onDelete(item.id);
              }
            }}
            className="border-red-400/60 text-red-600 hover:bg-red-500 hover:text-white text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sortable Section Component
function SortableSection({ section, sectionNameEn, sectionNameFr, onEdit }: {
  section: string;
  sectionNameEn: string;
  sectionNameFr: string;
  onEdit: (section: string) => void;
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
      className="flex items-center justify-between p-4 bg-gradient-to-r from-memopyk-navy to-memopyk-blue rounded-lg border border-memopyk-highlight/20 cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="w-5 h-5 text-memopyk-highlight" />
        <div>
          <h3 className="text-lg font-semibold text-memopyk-cream">
            {sectionNameEn}
          </h3>
          {sectionNameFr && (
            <p className="text-sm text-memopyk-sky">{sectionNameFr}</p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(section);
        }}
        className="text-memopyk-cream hover:text-memopyk-highlight hover:bg-memopyk-cream/10"
      >
        Edit Names
      </Button>
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
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      toast({ title: 'FAQ deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Error deleting FAQ', variant: 'destructive' });
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
          .sort((a, b) => a.order - b.order);
        
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
        const newOrder = overFaq.order;
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
    const maxOrder = Math.max(...faqs.filter((f: Faq) => f.section === section).map((f: Faq) => f.order), 0);
    
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
          <h1 className="text-3xl font-bold text-memopyk-navy mb-2">MEMOPYK Admin Panel</h1>
          <p className="text-memopyk-blue">Manage your website content and FAQ sections</p>
        </div>

        <Tabs defaultValue="faqs" className="space-y-6">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-memopyk-navy to-memopyk-blue p-4 rounded-lg border border-memopyk-highlight/20 shadow-lg">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2">
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
                value="legal-editor" 
                className="data-[state=active]:bg-memopyk-highlight data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 text-memopyk-cream hover:bg-memopyk-cream/10"
              >
                <FileText className="w-5 h-5" />
                Legal Content Editor
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
                                  onEdit={() => {}}
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
                                  {(sectionFaqs as Faq[]).sort((a, b) => a.order - b.order).map((faq: Faq) => (
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
                <div className="text-sm text-memopyk-blue">
                  {galleryItems.length} items • Drag to reorder
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

          <TabsContent value="legal-editor" className="mt-6">
            <LegalEditor onSave={handleLegalContentSave} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}