import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Images, HelpCircle, Mail } from "lucide-react";

interface Stats {
  heroVideos: number;
  galleryItems: number;
  faqSections: number;
  contacts: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Hero Videos",
      value: stats?.heroVideos || 0,
      icon: Video,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Gallery Items",
      value: stats?.galleryItems || 0,
      icon: Images,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "FAQ Sections",
      value: stats?.faqSections || 0,
      icon: HelpCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Contact Messages",
      value: stats?.contacts || 0,
      icon: Mail,
      color: "memopyk-highlight/10 text-memopyk-highlight",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Video className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Manage Hero Videos</h3>
                  <p className="text-sm text-gray-600">Add and reorder homepage videos</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Images className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Update Gallery</h3>
                  <p className="text-sm text-gray-600">Manage portfolio items</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Edit FAQs</h3>
                  <p className="text-sm text-gray-600">Organize questions and answers</p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

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
                  <h4 className="font-medium text-green-900">Production Environment</h4>
                  <p className="text-sm text-green-700">memopyk.com is running smoothly</p>
                </div>
              </div>
              <span className="text-green-600 font-medium">Healthy</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium text-yellow-900">Staging Environment</h4>
                  <p className="text-sm text-yellow-700">new.memopyk.com has pending updates</p>
                </div>
              </div>
              <span className="text-yellow-600 font-medium">Updated</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
