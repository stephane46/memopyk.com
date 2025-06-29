import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { Shield, Clock, RotateCcw } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function ContactSection() {
  const { toast } = useToast();
  const t = useTranslations();
  
  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      email: "",
      package: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      return await apiRequest("/api/contacts", { method: "POST", body: data });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Thank you for your interest! We will contact you soon.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertContact) => {
    contactMutation.mutate(data);
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-r from-memopyk-blue to-memopyk-navy">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-memopyk-cream mb-6 font-poppins">{t.contact.title}</h2>
        <p className="text-xl text-memopyk-cream mb-8 max-w-2xl mx-auto">
          {t.contact.subtitle}
        </p>
        
        <div className="bg-memopyk-cream/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder={t.contact.form.name} 
                        className="bg-memopyk-cream/10 border-memopyk-cream/20 text-memopyk-cream placeholder-memopyk-cream/70 focus:ring-memopyk-cream/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder={t.contact.form.email} 
                        className="bg-memopyk-cream/10 border-memopyk-cream/20 text-memopyk-cream placeholder-memopyk-cream/70 focus:ring-memopyk-cream/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="package"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/50">
                            <SelectValue placeholder={t.contact.form.package} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="essential">{t.contact.packages.essential}</SelectItem>
                          <SelectItem value="premium">{t.contact.packages.premium}</SelectItem>
                          <SelectItem value="unlimited">{t.contact.packages.unlimited}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder={t.contact.form.message} 
                          rows={4}
                          className="bg-memopyk-cream/10 border-memopyk-cream/20 text-memopyk-cream placeholder-memopyk-cream/70 focus:ring-memopyk-cream/50 resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <Button 
                  type="submit" 
                  disabled={contactMutation.isPending}
                  className="bg-memopyk-cream text-memopyk-blue px-8 py-4 text-lg font-semibold hover:bg-memopyk-cream/80 disabled:opacity-50"
                >
                  {contactMutation.isPending ? t.contact.form.sending : t.contact.form.submit}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-memopyk-cream">
          <div className="flex items-center">
            <Shield className="mr-2" size={20} />
            <span>{t.contact.features.secure}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2" size={20} />
            <span>{t.contact.features.fast}</span>
          </div>
          <div className="flex items-center">
            <RotateCcw className="mr-2" size={20} />
            <span>{t.contact.features.revisions}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
