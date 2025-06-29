import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Cloud, Globe, Server, ArrowRight, Copy, ExternalLink, Rocket, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeploymentStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  completed: boolean;
}

export default function DeploymentPanel() {
  const { toast } = useToast();
  const [deploymentTarget, setDeploymentTarget] = useState<'staging' | 'production' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([]);

  const handleDeploy = async (target: 'staging' | 'production') => {
    setDeploymentTarget(target);
    const domain = target === 'staging' ? 'new.memopyk.com' : 'memopyk.com';
    
    const steps: DeploymentStep[] = [
      {
        id: 'prepare',
        title: 'Prepare for Deployment',
        description: `Get ready to deploy MEMOPYK to ${domain}`,
        completed: false
      },
      {
        id: 'coolify',
        title: 'Configure Coolify',
        description: 'Set up the application in your Coolify dashboard',
        completed: false
      },
      {
        id: 'dns',
        title: 'Update DNS Settings',
        description: 'Configure Namecheap DNS to point to your VPS',
        completed: false
      },
      {
        id: 'verify',
        title: 'Verify Deployment',
        description: 'Test the live site and confirm everything works',
        completed: false
      }
    ];
    
    setDeploymentSteps(steps);
    setCurrentStep(0);
    
    toast({
      title: `Starting ${target} deployment`,
      description: `Follow the step-by-step guide to deploy to ${domain}`,
    });
  };

  const completeStep = (stepIndex: number) => {
    const updatedSteps = [...deploymentSteps];
    updatedSteps[stepIndex].completed = true;
    setDeploymentSteps(updatedSteps);
    
    if (stepIndex < deploymentSteps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      toast({
        title: "Deployment Complete!",
        description: `MEMOPYK is now live at ${deploymentTarget === 'staging' ? 'new.memopyk.com' : 'memopyk.com'}`,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard",
    });
  };

  const resetDeployment = () => {
    setDeploymentTarget(null);
    setDeploymentSteps([]);
    setCurrentStep(0);
  };

  if (!deploymentTarget) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-memopyk-navy mb-2">Deploy MEMOPYK</h2>
          <p className="text-memopyk-blue">Choose your deployment target and get step-by-step guidance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Staging Deployment */}
          <Card className="border-2 border-memopyk-blue/20 hover:border-memopyk-blue/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-memopyk-sky/20 rounded-lg">
                    <Cloud className="w-6 h-6 text-memopyk-blue" />
                  </div>
                  <div>
                    <CardTitle className="text-memopyk-navy">Staging Deployment</CardTitle>
                    <Badge variant="outline" className="mt-1">new.memopyk.com</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-memopyk-blue mb-4">
                Deploy to staging environment for testing before going live
              </p>
              <ul className="space-y-2 text-sm text-memopyk-blue mb-6">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Safe testing environment
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Verify all features work
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Preview changes before production
                </li>
              </ul>
              <Button 
                onClick={() => handleDeploy('staging')}
                className="w-full bg-memopyk-blue hover:bg-memopyk-blue/90 text-white"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Deploy to Staging
              </Button>
            </CardContent>
          </Card>

          {/* Production Deployment */}
          <Card className="border-2 border-memopyk-highlight/20 hover:border-memopyk-highlight/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-memopyk-highlight/20 rounded-lg">
                    <Globe className="w-6 h-6 text-memopyk-highlight" />
                  </div>
                  <div>
                    <CardTitle className="text-memopyk-navy">Production Deployment</CardTitle>
                    <Badge variant="outline" className="mt-1 border-memopyk-highlight text-memopyk-highlight">memopyk.com</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-memopyk-blue mb-4">
                Deploy to live production environment for your customers
              </p>
              <ul className="space-y-2 text-sm text-memopyk-blue mb-6">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Live customer-facing site
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  SSL certificates included
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Production optimizations
                </li>
              </ul>
              <Button 
                onClick={() => handleDeploy('production')}
                className="w-full bg-memopyk-highlight hover:bg-memopyk-highlight/90 text-white"
              >
                <Globe className="w-4 h-4 mr-2" />
                Deploy to Production
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Prerequisites */}
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-yellow-800">Prerequisites</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• Access to your Coolify dashboard on your VPS</li>
              <li>• Namecheap account with access to DNS management</li>
              <li>• Your VPS IP address ready</li>
              <li>• Database URL configured (currently connected to Supabase)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-memopyk-navy">
            Deploying to {deploymentTarget === 'staging' ? 'new.memopyk.com' : 'memopyk.com'}
          </h2>
          <p className="text-memopyk-blue">Follow these steps to complete your deployment</p>
        </div>
        <Button onClick={resetDeployment} variant="outline">
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to Selection
        </Button>
      </div>

      {/* Step Progress */}
      <div className="flex items-center space-x-4 overflow-x-auto pb-2">
        {deploymentSteps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-2 min-w-0">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.completed 
                ? 'bg-green-500 border-green-500 text-white' 
                : index === currentStep 
                  ? 'bg-memopyk-highlight border-memopyk-highlight text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
            }`}>
              {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-sm font-medium ${
              step.completed ? 'text-green-600' : index === currentStep ? 'text-memopyk-highlight' : 'text-gray-400'
            }`}>
              {step.title}
            </span>
            {index < deploymentSteps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      {deploymentSteps[currentStep] && (
        <Card className="border-2 border-memopyk-highlight/20">
          <CardHeader>
            <CardTitle className="text-memopyk-navy flex items-center">
              <span className="bg-memopyk-highlight text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                {currentStep + 1}
              </span>
              {deploymentSteps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && <PrepareStep target={deploymentTarget} onComplete={() => completeStep(0)} />}
            {currentStep === 1 && <CoolifyStep target={deploymentTarget} onComplete={() => completeStep(1)} copyToClipboard={copyToClipboard} />}
            {currentStep === 2 && <DNSStep target={deploymentTarget} onComplete={() => completeStep(2)} copyToClipboard={copyToClipboard} />}
            {currentStep === 3 && <VerifyStep target={deploymentTarget} onComplete={() => completeStep(3)} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Step Components
function PrepareStep({ target, onComplete }: { target: 'staging' | 'production', onComplete: () => void }) {
  const domain = target === 'staging' ? 'new.memopyk.com' : 'memopyk.com';
  
  return (
    <div className="space-y-4">
      <p className="text-memopyk-blue">
        Let's prepare for deploying MEMOPYK to <strong>{domain}</strong>. 
        Make sure you have the following ready:
      </p>
      
      <div className="bg-memopyk-cream p-4 rounded-lg">
        <h4 className="font-semibold text-memopyk-navy mb-3">Checklist:</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-memopyk-blue">Coolify dashboard access on your VPS</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-memopyk-blue">Namecheap account access</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-memopyk-blue">VPS IP address available</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-memopyk-blue">Database connection confirmed (Supabase)</span>
          </label>
        </div>
      </div>

      <Button onClick={onComplete} className="w-full bg-memopyk-highlight hover:bg-memopyk-highlight/90 text-white">
        Ready - Continue to Coolify Setup
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function CoolifyStep({ target, onComplete, copyToClipboard }: { 
  target: 'staging' | 'production', 
  onComplete: () => void,
  copyToClipboard: (text: string) => void 
}) {
  const domain = target === 'staging' ? 'new.memopyk.com' : 'memopyk.com';
  const repoUrl = 'https://github.com/stephane46/memopyk.com';
  
  return (
    <div className="space-y-6">
      <p className="text-memopyk-blue">
        Configure your Coolify instance to deploy MEMOPYK to <strong>{domain}</strong>.
      </p>

      <div className="space-y-4">
        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3 flex items-center">
            <Server className="w-4 h-4 mr-2" />
            Step 1: Create New Application
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-memopyk-blue">
            <li>Open your Coolify dashboard</li>
            <li>Click "New Application" or "Add Resource"</li>
            <li>Select "Public Repository" as source</li>
            <li>Enter repository URL:</li>
          </ol>
          <div className="mt-2 p-2 bg-gray-100 rounded flex items-center justify-between">
            <code className="text-sm">{repoUrl}</code>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(repoUrl)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Step 2: Configure Application
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-memopyk-navy">Application Name:</label>
              <div className="mt-1 p-2 bg-gray-100 rounded flex items-center justify-between">
                <code className="text-sm">memopyk-{target}</code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(`memopyk-${target}`)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-memopyk-navy">Domain:</label>
              <div className="mt-1 p-2 bg-gray-100 rounded flex items-center justify-between">
                <code className="text-sm">{domain}</code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(domain)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-memopyk-navy">Port:</label>
              <div className="mt-1 p-2 bg-gray-100 rounded flex items-center justify-between">
                <code className="text-sm">5000</code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard('5000')}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3">Step 3: Environment Variables</h4>
          <p className="text-sm text-memopyk-blue mb-3">Add these environment variables in Coolify:</p>
          <div className="space-y-2">
            <div className="p-2 bg-gray-100 rounded flex items-center justify-between">
              <code className="text-sm">DATABASE_URL=your_supabase_connection_string</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard('DATABASE_URL')}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="p-2 bg-gray-100 rounded flex items-center justify-between">
              <code className="text-sm">NODE_ENV=production</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard('NODE_ENV=production')}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={onComplete} className="w-full bg-memopyk-highlight hover:bg-memopyk-highlight/90 text-white">
        Coolify Configured - Continue to DNS Setup
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function DNSStep({ target, onComplete, copyToClipboard }: { 
  target: 'staging' | 'production', 
  onComplete: () => void,
  copyToClipboard: (text: string) => void 
}) {
  const domain = target === 'staging' ? 'new.memopyk.com' : 'memopyk.com';
  const subdomain = target === 'staging' ? 'new' : '@';
  
  return (
    <div className="space-y-6">
      <p className="text-memopyk-blue">
        Configure DNS settings in Namecheap to point <strong>{domain}</strong> to your VPS.
      </p>

      <div className="space-y-4">
        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3 flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Step 1: Access Namecheap DNS
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-memopyk-blue">
            <li>Log in to your Namecheap account</li>
            <li>Go to "Domain List" in your dashboard</li>
            <li>Find "memopyk.com" and click "Manage"</li>
            <li>Go to the "Advanced DNS" tab</li>
          </ol>
        </div>

        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3">Step 2: Add DNS Record</h4>
          <p className="text-sm text-memopyk-blue mb-3">
            {target === 'staging' ? 'Add a new A record for the subdomain:' : 'Update the main A record:'}
          </p>
          
          <div className="space-y-3 bg-white p-3 rounded border">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-memopyk-navy border-b pb-2">
              <span>Type</span>
              <span>Host</span>
              <span>Value</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span>A Record</span>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard('A')}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <code>{subdomain}</code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(subdomain)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-600">Your VPS IP</span>
                <span className="text-xs text-gray-500">(Enter your IP)</span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> Replace "Your VPS IP" with the actual IP address of your VPS server where Coolify is running.
            </p>
          </div>
        </div>

        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3">Step 3: Configure TTL</h4>
          <div className="space-y-2">
            <p className="text-sm text-memopyk-blue">Set TTL (Time To Live) for faster propagation:</p>
            <div className="p-2 bg-gray-100 rounded flex items-center justify-between">
              <code className="text-sm">300 seconds (5 minutes)</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard('300')}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> DNS changes can take 5-30 minutes to propagate. You can check propagation status using tools like "whatsmydns.net".
        </p>
      </div>

      <Button onClick={onComplete} className="w-full bg-memopyk-highlight hover:bg-memopyk-highlight/90 text-white">
        DNS Configured - Continue to Verification
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function VerifyStep({ target, onComplete }: { target: 'staging' | 'production', onComplete: () => void }) {
  const domain = target === 'staging' ? 'new.memopyk.com' : 'memopyk.com';
  const siteUrl = `https://${domain}`;
  
  return (
    <div className="space-y-6">
      <p className="text-memopyk-blue">
        Verify that your deployment is working correctly and all features are functional.
      </p>

      <div className="space-y-4">
        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Step 1: Check Site Access
          </h4>
          <div className="space-y-3">
            <p className="text-sm text-memopyk-blue">
              Open your site in a new browser tab:
            </p>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => window.open(siteUrl, '_blank')}
                className="bg-memopyk-blue hover:bg-memopyk-blue/90 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open {domain}
              </Button>
              <span className="text-sm text-memopyk-blue">Check if the site loads properly</span>
            </div>
          </div>
        </div>

        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3">Step 2: Test Key Features</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-memopyk-blue">Hero video carousel plays correctly</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-memopyk-blue">Language switcher works (EN/FR)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-memopyk-blue">Gallery videos play in modal</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-memopyk-blue">Contact form submits successfully</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-memopyk-blue">FAQ sections expand/collapse</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-memopyk-blue">Admin panel accessible (/admin)</span>
            </label>
          </div>
        </div>

        <div className="bg-memopyk-cream p-4 rounded-lg">
          <h4 className="font-semibold text-memopyk-navy mb-3">Step 3: SSL Certificate</h4>
          <p className="text-sm text-memopyk-blue mb-2">
            Verify SSL is working by checking:
          </p>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-memopyk-blue">Site loads with HTTPS (green lock icon)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-memopyk-blue">No SSL warnings in browser</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <p className="text-sm text-green-700">
          <strong>Success!</strong> Once all checks pass, your MEMOPYK site will be live and ready for customers.
        </p>
      </div>

      <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700 text-white">
        <CheckCircle className="w-4 h-4 mr-2" />
        Deployment Complete!
      </Button>
    </div>
  );
}