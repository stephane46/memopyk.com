import { Link, useLocation } from "wouter";
import { 
  Video, 
  Images, 
  HelpCircle, 
  Search, 
  Rocket, 
  FileText, 
  LayoutDashboard,
  Crown,
  User,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Hero Videos", href: "/hero-videos", icon: Video },
  { name: "Gallery", href: "/gallery", icon: Images },
  { name: "FAQs", href: "/faqs", icon: HelpCircle },
  { name: "SEO Settings", href: "/seo", icon: Search },
  { name: "Deployment", href: "/deployment", icon: Rocket },
  { name: "Content Editor", href: "/content", icon: FileText },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  const currentPage = navigation.find(item => item.href === location) || navigation[0];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 memopyk-navy text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 memopyk-highlight rounded-lg flex items-center justify-center">
              <Crown className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">MEMOPYK</h1>
              <p className="text-blue-200 text-sm opacity-80">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "memopyk-blue text-white"
                      : "hover:bg-blue-800/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 memopyk-highlight rounded-full flex items-center justify-center">
              <User className="text-white h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Administrator</p>
              <p className="text-blue-200 text-xs opacity-80">admin@memopyk.com</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-blue-200 hover:text-white hover:bg-blue-800/50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentPage.name}</h2>
              <p className="text-gray-600">
                {currentPage.name === "Dashboard" && "Manage your MEMOPYK website content"}
                {currentPage.name === "Hero Videos" && "Manage homepage hero videos with drag-and-drop reordering"}
                {currentPage.name === "Gallery" && "Manage portfolio items with bilingual content"}
                {currentPage.name === "FAQs" && "Organize frequently asked questions by sections"}
                {currentPage.name === "SEO Settings" && "Manage meta tags and structured data"}
                {currentPage.name === "Deployment" && "Deploy to staging and production environments"}
                {currentPage.name === "Content Editor" && "Edit legal documents and content pages"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 text-sm font-medium">Production Live</span>
              </div>
              <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-700 text-sm font-medium">Staging Updated</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
