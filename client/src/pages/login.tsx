import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();

  // Load saved password on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem('memopyk_admin_password');
    if (savedPassword) {
      setPassword(savedPassword);
      setRememberPassword(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({ password });
      
      // Save or remove password from localStorage based on checkbox
      if (rememberPassword) {
        localStorage.setItem('memopyk_admin_password', password);
      } else {
        localStorage.removeItem('memopyk_admin_password');
      }
      
      toast({
        title: "Login successful",
        description: "Welcome to the MEMOPYK admin panel.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 memopyk-highlight rounded-xl mx-auto flex items-center justify-center">
            <Shield className="text-white text-2xl h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-memopyk-navy">MEMOPYK Admin</h1>
            <p className="text-gray-600">Content Management System</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                disabled={isLoggingIn}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberPassword}
                onCheckedChange={(checked) => setRememberPassword(checked === true)}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember my password
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full memopyk-blue hover:memopyk-navy"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                "Signing in..."
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <Lock className="inline mr-1 h-3 w-3" />
              Secure admin access only
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
