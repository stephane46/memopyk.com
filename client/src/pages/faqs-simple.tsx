import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import type { Faq, InsertFaq } from "@shared/schema";

interface FaqSection {
  section: string;
  sectionNameEn: string;
  sectionNameFr: string;
  faqs: Faq[];
}

export default function FAQs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({ title: "FAQ order updated successfully" });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({ 
        title: "Failed to reorder FAQs", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const moveFaq = (faqId: string, direction: 'up' | 'down') => {
    const currentSection = sections.find(section => 
      section.faqs.some(faq => faq.id === faqId)
    );
    
    if (!currentSection) return;

    const faqIndex = currentSection.faqs.findIndex(faq => faq.id === faqId);
    if (faqIndex === -1) return;

    // Can't move up if it's the first item, or down if it's the last item
    if ((direction === 'up' && faqIndex === 0) || 
        (direction === 'down' && faqIndex === currentSection.faqs.length - 1)) {
      return;
    }

    // Create new order for this section
    const newSectionFaqs = [...currentSection.faqs];
    const targetIndex = direction === 'up' ? faqIndex - 1 : faqIndex + 1;
    
    // Swap the items
    [newSectionFaqs[faqIndex], newSectionFaqs[targetIndex]] = 
    [newSectionFaqs[targetIndex], newSectionFaqs[faqIndex]];

    // Build complete FAQ list with all sections
    const allFaqIds: string[] = [];
    sections.forEach(sec => {
      if (sec.section === currentSection.section) {
        // Use the reordered FAQs for this section
        allFaqIds.push(...newSectionFaqs.map(faq => faq.id));
      } else {
        // Use existing order for other sections
        allFaqIds.push(...sec.faqs.map(faq => faq.id));
      }
    });

    reorderMutation.mutate(allFaqIds);
  };

  const openFaqDialog = (section: string) => {
    setSelectedSection(section);
    setAnswerEn("");
    setAnswerFr("");
    setEditingFaq(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (faq: Faq) => {
    setEditingFaq(faq);
    setSelectedSection(faq.section);
    setIsDialogOpen(true);
  };

  const [answerEn, setAnswerEn] = useState("");
  const [answerFr, setAnswerFr] = useState("");

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

  // Update state when editing FAQ
  const openEditDialogWithState = (faq: Faq) => {
    setEditingFaq(faq);
    setSelectedSection(faq.section);
    setAnswerEn(faq.answerEn);
    setAnswerFr(faq.answerFr);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading FAQs...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FAQ Management</CardTitle>
              <p className="text-gray-600 mt-1">Manage frequently asked questions and organize them by sections</p>
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
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingFaq(null);
                        }}
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
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.section}>
                  <div className="flex items-center justify-between mb-4 p-4 bg-orange-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">{section.sectionNameEn}</h4>
                      <p className="text-gray-600 text-sm">{section.faqs.length} questions</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openFaqDialog(section.section)}
                      className="memopyk-blue hover:memopyk-navy text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="ml-8 space-y-3">
                    {section.faqs.map((faq, index) => (
                      <Card key={faq.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveFaq(faq.id, 'up')}
                                disabled={index === 0 || reorderMutation.isPending}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveFaq(faq.id, 'down')}
                                disabled={index === section.faqs.length - 1 || reorderMutation.isPending}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-2">{faq.questionEn}</h5>
                              <p className="text-gray-600 text-sm line-clamp-2">{faq.answerEn}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialogWithState(faq)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(faq.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No FAQs</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first FAQ.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}