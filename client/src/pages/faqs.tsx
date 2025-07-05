import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import {
  DndContext,
  closestCenter,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import type { Faq, InsertFaq } from "@shared/schema";

interface FaqSection {
  section: string;
  sectionNameEn: string;
  sectionNameFr: string;
  faqs: Faq[];
}

// Sortable Question Component
function SortableQuestion({ 
  faq, 
  onEdit, 
  onDelete 
}: { 
  faq: Faq; 
  onEdit: (faq: Faq) => void; 
  onDelete: (id: string) => void; 
}) {
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
    transition,
    opacity: isDragging ? 0 : 1, // Completely hide when dragging since DragOverlay shows it
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="mb-3 border border-gray-200 hover:border-gray-300 transition-colors"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex-shrink-0 mt-1 text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-gray-900 mb-2">{faq.questionEn}</h5>
            <p className="text-gray-600 text-sm line-clamp-2">{faq.answerEn}</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(faq)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(faq.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable Section Component
// Overlay component for drag preview
function OverlayItem({ activeId, sections }: { activeId: string; sections: FaqSection[] }) {
  // Check if it's a section
  if (activeId.startsWith('section-')) {
    const sectionId = activeId.replace('section-', '');
    const section = sections.find(s => s.section === sectionId);
    if (!section) return null;
    
    return (
      <div className="bg-white border-2 border-memopyk-blue rounded-lg shadow-lg opacity-95">
        <div className="flex items-center justify-between mb-4 p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-gray-400" />
            <div>
              <h4 className="font-semibold text-gray-900">{section.sectionNameEn}</h4>
              <p className="text-gray-600 text-sm">{section.faqs.length} questions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // It's a FAQ item
  let faq: Faq | undefined;
  for (const section of sections) {
    faq = section.faqs.find(f => f.id === activeId);
    if (faq) break;
  }
  
  if (!faq) return null;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg opacity-95 p-4">
      <div className="flex items-start gap-3">
        <GripVertical className="h-5 w-5 text-gray-400 mt-1" />
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 mb-2">{faq.questionEn}</h5>
          <p className="text-gray-600 text-sm line-clamp-2">{faq.answerEn}</p>
        </div>
      </div>
    </div>
  );
}

function SortableSection({ 
  section, 
  onAddFaq, 
  onEditFaq, 
  onDeleteFaq 
}: { 
  section: FaqSection; 
  onAddFaq: (sectionId: string) => void;
  onEditFaq: (faq: Faq) => void;
  onDeleteFaq: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.section}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Completely hide when dragging since DragOverlay shows it
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <div 
        className="flex items-center justify-between mb-4 p-4 bg-orange-50 rounded-lg border-2 border-dashed border-transparent hover:border-memopyk-blue transition-colors"
        data-section-id={section.section}
      >
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{section.sectionNameEn}</h4>
            <p className="text-gray-600 text-sm">{section.faqs.length} questions</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAddFaq(section.section)}
          className="memopyk-blue hover:memopyk-navy text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="ml-8">
        <SortableContext 
          items={section.faqs.map(faq => faq.id)} 
          strategy={verticalListSortingStrategy}
        >
          {section.faqs.map((faq) => (
            <SortableQuestion
              key={faq.id}
              faq={faq}
              onEdit={onEditFaq}
              onDelete={onDeleteFaq}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function FAQs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [answerEn, setAnswerEn] = useState("");
  const [answerFr, setAnswerFr] = useState("");

  const [activeId, setActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 5 } 
    })
  );

  const { data: faqs = [], isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
  });

  // Group FAQs by section
  const sections: FaqSection[] = faqs.reduce((acc: FaqSection[], faq) => {
    let section = acc.find(s => s.section === faq.section);
    if (!section) {
      section = {
        section: faq.section,
        sectionNameEn: faq.sectionNameEn,
        sectionNameFr: faq.sectionNameFr,
        faqs: []
      };
      acc.push(section);
    }
    section.faqs.push(faq);
    return acc;
  }, []);

  const createMutation = useMutation({
    mutationFn: async (faq: InsertFaq) => {
      return await apiRequest("POST", "/api/faqs", faq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      setIsDialogOpen(false);
      setEditingFaq(null);
      setAnswerEn("");
      setAnswerFr("");
      toast({ title: "FAQ created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create FAQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, faq }: { id: string; faq: Partial<InsertFaq> }) => {
      return await apiRequest("PUT", `/api/faqs/${id}`, faq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      setIsDialogOpen(false);
      setEditingFaq(null);
      setAnswerEn("");
      setAnswerFr("");
      toast({ title: "FAQ updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update FAQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/faqs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({ title: "FAQ deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete FAQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (faqIds: string[]) => {
      await apiRequest("POST", "/api/faqs/reorder", { faqIds });
    },
    onMutate: async (faqIds: string[]) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/faqs"] });
      
      // Snapshot previous value
      const previousFaqs = queryClient.getQueryData(["/api/faqs"]);
      
      // Simple optimistic update - just reorder based on IDs
      if (previousFaqs) {
        const optimisticFaqs = [...(previousFaqs as Faq[])];
        const reorderedFaqs = faqIds.map(id => 
          optimisticFaqs.find(faq => faq.id === id)
        ).filter(Boolean) as Faq[];
        
        queryClient.setQueryData(["/api/faqs"], reorderedFaqs);
      }
      
      return { previousFaqs };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({ title: "Order updated successfully" });
    },
    onError: (error, faqIds, context) => {
      // On error, roll back to previous value
      if (context?.previousFaqs) {
        queryClient.setQueryData(["/api/faqs"], context.previousFaqs);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({ 
        title: "Failed to reorder items", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Handle section dragging  
    if (activeId.startsWith('section-') && overId.startsWith('section-')) {
      // Both are sections - reorder sections
      const activeSectionId = activeId.replace('section-', '');
      const overSectionId = overId.replace('section-', '');
      
      const activeSection = sections.find(s => s.section === activeSectionId);
      const overSection = sections.find(s => s.section === overSectionId);
      
      if (!activeSection || !overSection) return;
      
      // Create array of section identifiers in current order
      const sectionIds = sections.map(s => s.section);
      const activeSectionIndex = sectionIds.indexOf(activeSectionId);
      const overSectionIndex = sectionIds.indexOf(overSectionId);
      
      // Reorder sections using arrayMove
      const reorderedSectionIds = arrayMove(sectionIds, activeSectionIndex, overSectionIndex);
      
      // Build FAQ order based on new section order
      const newOrder: string[] = [];
      reorderedSectionIds.forEach(sectionId => {
        const section = sections.find(s => s.section === sectionId);
        if (section) {
          section.faqs.forEach(faq => newOrder.push(faq.id));
        }
      });
      
      reorderMutation.mutate(newOrder);
      return;
    }

    // Handle FAQ dragging
    if (!activeId.startsWith('section-') && !overId.startsWith('section-')) {
      // Both are FAQs - simple reorder within or across sections
      const flatFaqIds: string[] = [];
      sections.forEach(section => {
        section.faqs.forEach(faq => {
          flatFaqIds.push(faq.id);
        });
      });

      const activeIndex = flatFaqIds.indexOf(activeId);
      const overIndex = flatFaqIds.indexOf(overId);

      if (activeIndex === -1 || overIndex === -1) return;

      const reorderedFaqs = arrayMove(flatFaqIds, activeIndex, overIndex);
      reorderMutation.mutate(reorderedFaqs);
      return;
    }

    // Handle FAQ dropped on section
    if (!activeId.startsWith('section-') && overId.startsWith('section-')) {
      const targetSectionId = overId.replace('section-', '');
      
      // Find the section that contains the target section
      const targetSectionIndex = sections.findIndex(s => s.section === targetSectionId);
      if (targetSectionIndex === -1) return;
      
      // Create new order: maintain current section order, just move FAQ to target section
      const newOrder: string[] = [];
      
      sections.forEach((section, sectionIndex) => {
        section.faqs.forEach(faq => {
          if (faq.id !== activeId) { // Skip the moved FAQ for now
            newOrder.push(faq.id);
          }
        });
        
        // If this is the target section, add the moved FAQ at the end
        if (sectionIndex === targetSectionIndex) {
          newOrder.push(activeId);
        }
      });
      
      reorderMutation.mutate(newOrder);
      return;
    }
  };

  const openFaqDialog = (sectionId: string) => {
    setSelectedSection(sectionId);
    setAnswerEn("");
    setAnswerFr("");
    setEditingFaq(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (faq: Faq) => {
    setEditingFaq(faq);
    setSelectedSection(faq.section);
    setAnswerEn(faq.answerEn);
    setAnswerFr(faq.answerFr);
    setIsDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Generate section ID from English name
    const sectionNameEn = formData.get("sectionNameEn") as string;
    const sectionId = sectionNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const faq: InsertFaq = {
      section: selectedSection || sectionId,
      sectionNameEn: formData.get("sectionNameEn") as string,
      sectionNameFr: formData.get("sectionNameFr") as string,
      questionEn: formData.get("questionEn") as string,
      questionFr: formData.get("questionFr") as string,
      answerEn: answerEn,
      answerFr: answerFr,
    };

    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, faq });
    } else {
      createMutation.mutate(faq);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading FAQs...</div>
      </div>
    );
  }

  return (
    <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FAQ Management</CardTitle>
              <p className="text-gray-600 mt-1">Drag and drop to reorder sections and questions</p>
            </div>
            <div className="space-x-2">
              <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    New Section
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New FAQ Section</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const sectionNameEn = formData.get("sectionNameEn") as string;
                    const sectionId = sectionNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setSelectedSection(sectionId);
                    setIsSectionDialogOpen(false);
                    setIsDialogOpen(true);
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sectionNameEn">Section Name (English)</Label>
                        <Input
                          id="sectionNameEn"
                          name="sectionNameEn"
                          placeholder="General Questions"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sectionNameFr">Section Name (Français)</Label>
                        <Input
                          id="sectionNameFr"
                          name="sectionNameFr"
                          placeholder="Questions Générales"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Section</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingFaq(null);
                  setSelectedSection("");
                  setAnswerEn("");
                  setAnswerFr("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="memopyk-blue hover:memopyk-navy">
                    <Plus className="mr-2 h-4 w-4" />
                    Add FAQ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {!selectedSection && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sectionNameEn">Section Name (English)</Label>
                          <Input
                            id="sectionNameEn"
                            name="sectionNameEn"
                            defaultValue={editingFaq?.sectionNameEn}
                            placeholder="General Questions"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sectionNameFr">Section Name (Français)</Label>
                          <Input
                            id="sectionNameFr"
                            name="sectionNameFr"
                            defaultValue={editingFaq?.sectionNameFr}
                            placeholder="Questions Générales"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="questionEn">Question (English)</Label>
                        <Input
                          id="questionEn"
                          name="questionEn"
                          defaultValue={editingFaq?.questionEn}
                          placeholder="What is your return policy?"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="questionFr">Question (Français)</Label>
                        <Input
                          id="questionFr"
                          name="questionFr"
                          defaultValue={editingFaq?.questionFr}
                          placeholder="Quelle est votre politique de retour?"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="answerEn">Answer (English)</Label>
                        <WysiwygEditor
                          value={answerEn}
                          onChange={setAnswerEn}
                          placeholder="Enter detailed answer with rich formatting..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="answerFr">Answer (Français)</Label>
                        <WysiwygEditor
                          value={answerFr}
                          onChange={setAnswerFr}
                          placeholder="Entrez une réponse détaillée avec mise en forme..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {editingFaq ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sections.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              modifiers={[restrictToVerticalAxis]}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <SortableContext 
                items={(() => {
                  const allItems: string[] = [];
                  sections.forEach(section => {
                    allItems.push(`section-${section.section}`);
                    section.faqs.forEach(faq => allItems.push(faq.id));
                  });
                  return allItems;
                })()} 
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section) => (
                  <SortableSection
                    key={section.section}
                    section={section}
                    onAddFaq={openFaqDialog}
                    onEditFaq={openEditDialog}
                    onDeleteFaq={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeId ? <OverlayItem activeId={activeId} sections={sections} /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="text-center py-12">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No FAQs</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first FAQ section.</p>
            </div>
          )}
        </CardContent>
    </Card>
  );
}