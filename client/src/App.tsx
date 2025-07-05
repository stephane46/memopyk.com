import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/admin-layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import HeroVideos from "@/pages/hero-videos";
import Gallery from "@/pages/gallery";
import FAQs from "@/pages/faqs";
import SEOSettings from "@/pages/seo-settings";
import Deployment from "@/pages/deployment";
import ContentEditor from "@/pages/content-editor";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/hero-videos" component={HeroVideos} />
        <Route path="/gallery" component={Gallery} />
        <Route path="/faqs" component={FAQs} />
        <Route path="/seo" component={SEOSettings} />
        <Route path="/deployment" component={Deployment} />
        <Route path="/content" component={ContentEditor} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
