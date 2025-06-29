import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface AdminAuthProps {
  onAuthenticated: () => void;
}

export default function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple password check - in production, use proper authentication
    const adminPassword = "memopyk2024admin"; // You should change this
    
    if (password === adminPassword) {
      sessionStorage.setItem('admin-authenticated', 'true');
      onAuthenticated();
    } else {
      setError("Invalid password");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-memopyk-cream flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-memopyk-sky/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-memopyk-blue" />
          </div>
          <CardTitle className="text-2xl text-memopyk-navy">Admin Access</CardTitle>
          <p className="text-memopyk-blue">Enter the admin password to manage FAQs</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            
            <Button type="submit" className="w-full">
              Access Admin Panel
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Temporary Password:</strong> memopyk2024admin
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Change this in production for security
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}