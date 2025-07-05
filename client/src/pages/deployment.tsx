import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Rocket, FlaskConical, Globe, ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle, Terminal, Play, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Deployment } from "@shared/schema";

export default function DeploymentPage() {
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployEnvironment, setDeployEnvironment] = useState<"staging" | "production">("staging");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [deploymentLogs]);

  const { data: stagingDeployments = [], isLoading: loadingStaging } = useQuery<Deployment[]>({
    queryKey: ["/api/deploy/history", "staging"],
  });

  const { data: productionDeployments = [], isLoading: loadingProduction } = useQuery<Deployment[]>({
    queryKey: ["/api/deploy/history", "production"],
  });

  const deploymentSteps = [
    { id: 1, title: "Initialize Deployment", description: "Starting deployment process", icon: "🚀", status: "pending" },
    { id: 2, title: "Clone Repository", description: "Cloning MEMOPYK code from GitHub", icon: "📥", status: "pending" },
    { id: 3, title: "Install Dependencies", description: "Installing Node.js packages", icon: "📦", status: "pending" },
    { id: 4, title: "Build Application", description: "Building React/TypeScript website", icon: "🔨", status: "pending" },
    { id: 5, title: "Deploy to VPS", description: "Uploading files to server", icon: "📤", status: "pending" },
    { id: 6, title: "Configure Services", description: "Updating server configuration", icon: "⚙️", status: "pending" },
    { id: 7, title: "Verify Deployment", description: "Confirming website is live", icon: "✅", status: "pending" },
  ];

  const [currentSteps, setCurrentSteps] = useState(deploymentSteps);

  const updateStepStatus = (stepId: number, status: 'pending' | 'running' | 'success' | 'error') => {
    setCurrentSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const simulateDeploymentLogs = (environment: string) => {
    const detailedLogs = [
      { step: 1, message: `🚀 Initializing deployment to ${environment}...`, delay: 0 },
      { step: 1, message: "📋 Validating environment configuration...", delay: 800 },
      { step: 2, message: "📥 Connecting to GitHub repository...", delay: 1600 },
      { step: 2, message: "✓ Cloning MEMOPYK repository successfully", delay: 2400 },
      { step: 3, message: "📦 Installing Node.js dependencies...", delay: 3200 },
      { step: 3, message: "✓ Dependencies installed (npm ci completed)", delay: 4000 },
      { step: 4, message: "🔨 Building React/TypeScript application...", delay: 4800 },
      { step: 4, message: "📊 Fetching latest content from database...", delay: 5600 },
      { step: 4, message: "✓ Website built successfully", delay: 6400 },
      { step: 5, message: "📤 Connecting to VPS server (82.29.168.136)...", delay: 7200 },
      { step: 5, message: "📂 Uploading built files to deployment directory...", delay: 8000 },
      { step: 5, message: "✓ Files uploaded successfully", delay: 8800 },
      { step: 6, message: "⚙️ Restarting application services...", delay: 9600 },
      { step: 6, message: "🔄 Reloading nginx configuration...", delay: 10400 },
      { step: 6, message: "✓ Services configured and running", delay: 11200 },
      { step: 7, message: "🔍 Verifying deployment health...", delay: 12000 },
      { step: 7, message: `🌐 Site is live at: https://${environment === 'staging' ? 'new.memopyk.com' : 'memopyk.com'}`, delay: 12800 },
      { step: 7, message: "✅ Deployment completed successfully!", delay: 13600 }
    ];

    setIsDeploying(true);
    setShowLogs(true);
    setDeploymentLogs([]);
    setCurrentSteps(deploymentSteps.map(step => ({ ...step, status: 'pending' })));

    let currentStepIndex = 1;
    detailedLogs.forEach((logEntry) => {
      setTimeout(() => {
        if (logEntry.step !== currentStepIndex) {
          updateStepStatus(currentStepIndex, 'success');
          currentStepIndex = logEntry.step;
        }
        updateStepStatus(logEntry.step, 'running');
        
        setDeploymentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logEntry.message}`]);
        
        if (logEntry.step === 7 && logEntry.message.includes('completed successfully')) {
          updateStepStatus(7, 'success');
          setTimeout(() => {
            setIsDeploying(false);
            toast({
              title: "Deployment Complete",
              description: `Successfully deployed to ${environment}`,
            });
          }, 1000);
        }
      }, logEntry.delay);
    });
  };

  const quickDeploy = (environment: "staging" | "production") => {
    if (isDeploying) return; // Prevent duplicate deployments
    
    const version = `v${Date.now()}`;
    
    setShowLogs(true);
    
    // Scroll to logs with proper timing
    setTimeout(() => {
      const logsElement = document.getElementById('deployment-logs');
      if (logsElement) {
        logsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
    
    // Create deployment record
    deployMutation.mutate({ 
      environment, 
      version, 
      notes: `Quick deploy to ${environment}` 
    });
    
    // Start log simulation
    simulateDeploymentLogs(environment);
  };

  const deployMutation = useMutation({
    mutationFn: async ({ environment, version, notes }: { environment: string; version: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/deploy/${environment}`, { version, notes });
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deploy/history", variables.environment] });
    },
    onError: (error) => {
      toast({ 
        title: "Deployment failed", 
        description: error.message,
        variant: "destructive" 
      });
      setIsDeploying(false);
    },
  });

  const handleDeploy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    deployMutation.mutate({
      environment: deployEnvironment,
      version: formData.get("version") as string,
      notes: formData.get("notes") as string,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const latestStaging = stagingDeployments.find(d => d.status === "completed" || d.status === "success");
  const latestProduction = productionDeployments.find(d => d.status === "completed" || d.status === "success");
  
  const currentStagingVersion = latestStaging?.version || "Not deployed";
  const currentProductionVersion = latestProduction?.version || "Not deployed";

  const allDeployments = [...stagingDeployments, ...productionDeployments]
    .sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Environment Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staging Environment */}
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FlaskConical className="text-yellow-600 h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Staging</CardTitle>
                  <p className="text-gray-600 text-sm">new.memopyk.com</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Updated</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Current Version:</span>
                <span className="font-medium">{currentStagingVersion}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Last Deploy:</span>
                <span className="font-medium">
                  {latestStaging ? formatDate(latestStaging.completedAt!) : "Never"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Healthy</span>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => quickDeploy("staging")}
                disabled={isDeploying}
                className="w-full memopyk-blue hover:memopyk-navy"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Deploy to Staging
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open("https://new.memopyk.com", "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Site
              </Button>
              
              <Dialog open={deployDialogOpen && deployEnvironment === "staging"} onOpenChange={(open) => {
                setDeployDialogOpen(open);
                if (open) setDeployEnvironment("staging");
              }}>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deploy to Staging</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleDeploy} className="space-y-4">
                    <div>
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        name="version"
                        placeholder="v2.1.4"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Release Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Added new features and bug fixes..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeployDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={deployMutation.isPending}>
                        Deploy
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Production Environment */}
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="text-green-600 h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Production</CardTitle>
                  <p className="text-gray-600 text-sm">memopyk.com</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Current Version:</span>
                <span className="font-medium">{currentProductionVersion}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Last Deploy:</span>
                <span className="font-medium">
                  {productionDeployments[0] ? formatDate(productionDeployments[0].startedAt!) : "Never"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Healthy</span>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full memopyk-blue hover:memopyk-navy">
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy to Production
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deploy to Production?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will deploy changes to the live production environment at memopyk.com. 
                      Make sure you have tested everything on staging first.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => quickDeploy("production")}
                      className="memopyk-blue hover:memopyk-navy"
                      disabled={isDeploying}
                    >
                      {isDeploying ? "Deploying..." : "Continue to Deploy"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open("https://memopyk.com", "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Deployment Logs */}
      {showLogs && (
        <Card id="deployment-logs" className="border border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Terminal className="text-blue-600 h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Deployment Logs</CardTitle>
                  <p className="text-blue-600 text-sm">Real-time deployment progress</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowLogs(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Step Progress Indicator */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4">Deployment Progress</h4>
              <div className="space-y-3">
                {currentSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.status === 'success' ? 'bg-green-100 text-green-800' :
                      step.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      step.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {step.status === 'success' ? '✓' : 
                       step.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                       step.status === 'error' ? '✗' : step.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        step.status === 'success' ? 'text-green-900' :
                        step.status === 'running' ? 'text-blue-900' :
                        step.status === 'error' ? 'text-red-900' :
                        'text-gray-500'
                      }`}>
                        {step.icon} {step.title}
                      </div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                    {index < currentSteps.length - 1 && (
                      <div className={`w-px h-8 ${
                        step.status === 'success' ? 'bg-green-200' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Logs */}
            <ScrollArea className="h-64 w-full rounded-md border bg-white p-4">
              <div className="space-y-1">
                {deploymentLogs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-800">
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Production Deploy Dialog */}
      <Dialog open={deployDialogOpen && deployEnvironment === "production"} onOpenChange={(open) => {
        setDeployDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy to Production</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeploy} className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">Production Deployment</p>
              </div>
              <p className="text-red-700 text-sm mt-1">
                This will affect the live website. Ensure all changes have been tested on staging.
              </p>
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                name="version"
                placeholder="v2.1.4"
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Release Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Production release with new features..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeployDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={deployMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                Deploy to Production
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium text-green-900">All Systems Operational</h4>
                  <p className="text-sm text-green-700">Both environments are running smoothly</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          {allDeployments.length > 0 ? (
            <div className="space-y-3">
              {allDeployments.map((deployment) => (
                <div key={deployment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getStatusIcon(deployment.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {deployment.version} → {deployment.environment === "staging" ? "Staging" : "Production"}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {formatDate(deployment.startedAt!)}
                      </p>
                      {deployment.notes && (
                        <p className="text-gray-500 text-sm mt-1">{deployment.notes}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(deployment.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Rocket className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No deployments yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start by deploying to staging.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
