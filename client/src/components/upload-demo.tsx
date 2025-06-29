import { Button } from "@/components/ui/button";
import { CloudUpload, Plus, Folder, Play, Heart, Star, Check } from "lucide-react";

export default function UploadDemo() {
  const sampleMedia = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1609220136736-443140cffec6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      alt: "Family photo sample",
      type: "image",
      selected: true
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      alt: "Children playing outdoors",
      type: "image",
      selected: false
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      alt: "Family beach vacation",
      type: "video",
      duration: "2:14",
      selected: false
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      alt: "Birthday celebration",
      type: "image",
      starred: true,
      selected: false
    },
    {
      id: 5,
      src: "https://images.unsplash.com/photo-1611095566888-b47c48ac4e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      alt: "Grandparents with grandchildren",
      type: "image",
      selected: false
    },
    {
      id: 6,
      src: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      alt: "Pet dog playing",
      type: "image",
      selected: false
    }
  ];

  return (
    <section className="py-20 bg-memopyk-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-memopyk-navy mb-4">Intuitive Media Management</h2>
          <p className="text-xl text-memopyk-blue">Experience our user-friendly interface designed for effortless media organization</p>
        </div>
        
        {/* Upload Demo Interface */}
        <div className="bg-memopyk-cream rounded-2xl shadow-xl overflow-hidden border border-memopyk-blue/10">
          <div className="bg-gradient-to-r from-memopyk-blue to-memopyk-navy p-6 text-memopyk-cream">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Project: Summer Family Vacation 2024</h3>
              <div className="flex items-center space-x-4">
                <span className="bg-memopyk-cream/20 px-3 py-1 rounded-full text-sm">247 files uploaded</span>
                <span className="bg-memopyk-highlight px-3 py-1 rounded-full text-sm flex items-center">
                  <Check className="mr-1" size={16} />
                  Ready for editing
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-memopyk-blue/30 rounded-xl p-12 text-center mb-8 hover:border-memopyk-blue hover:bg-memopyk-sky/10 transition-colors cursor-pointer">
              <CloudUpload className="text-5xl text-memopyk-blue-light mb-4 mx-auto" size={64} />
              <h4 className="text-xl font-semibold text-memopyk-navy mb-2">Drag & Drop Your Media Here</h4>
              <p className="text-memopyk-blue mb-4">or click to browse files</p>
              <Button className="bg-memopyk-blue text-memopyk-cream hover:bg-memopyk-navy">
                Choose Files
              </Button>
              <p className="text-sm text-memopyk-blue-light mt-4">Supports: JPG, PNG, MP4, MOV, HEIC • Max 2GB per file</p>
            </div>
            
            {/* File Grid Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sampleMedia.map((item) => (
                <div key={item.id} className="aspect-square bg-memopyk-cream rounded-lg overflow-hidden relative group cursor-pointer">
                  <img 
                    src={item.src} 
                    alt={item.alt} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-memopyk-navy/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {item.type === "video" ? (
                      <Play className="text-memopyk-cream text-xl" size={24} />
                    ) : (
                      <Heart className="text-memopyk-cream text-xl" size={24} />
                    )}
                  </div>
                  
                  {item.selected && (
                    <div className="absolute top-2 right-2 bg-memopyk-highlight w-6 h-6 rounded-full flex items-center justify-center">
                      <Check className="text-memopyk-cream text-xs" size={12} />
                    </div>
                  )}
                  
                  {item.starred && (
                    <div className="absolute top-2 right-2 bg-yellow-500 w-6 h-6 rounded-full flex items-center justify-center">
                      <Star className="text-white text-xs" size={12} />
                    </div>
                  )}
                  
                  {item.type === "video" && item.duration && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {item.duration}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" className="text-memopyk-blue hover:text-blue-700">
                  <Plus className="mr-2" size={16} />
                  Add More Files
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-800">
                  <Folder className="mr-2" size={16} />
                  Create Folder
                </Button>
              </div>
              <Button className="bg-memopyk-blue text-white hover:bg-blue-700">
                Start Editing Process
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
