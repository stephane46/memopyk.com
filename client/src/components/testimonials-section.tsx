import { Star } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      name: "Sarah & Mike Thompson",
      package: "Premium Package",
      image: "https://images.unsplash.com/photo-1609220136736-443140cffec6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      text: "MEMOPYK turned 15 years of scattered photos into the most beautiful film. We watched it at our anniversary dinner and there wasn't a dry eye at the table. Worth every penny!"
    },
    {
      id: 2,
      name: "Jennifer Martinez",
      package: "Unlimited Package",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      text: "The collaboration feature was amazing! My siblings and I could all contribute to Mom's 70th birthday film from different countries. She absolutely loved it and watches it all the time."
    },
    {
      id: 3,
      name: "David Chen",
      package: "Essential Package",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      text: "I was skeptical about uploading so many files, but the process was seamless. The final film captured our son's first year perfectly - moments I had almost forgotten about!"
    }
  ];

  const StarRating = () => (
    <div className="flex text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={16} fill="currentColor" />
      ))}
    </div>
  );

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-poppins">What Families Are Saying</h2>
          <p className="text-xl text-gray-600">Join thousands of families who have preserved their precious memories with MEMOPYK</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <StarRating />
              </div>
              <p className="text-gray-700 mb-6 italic">
                "{testimonial.text}"
              </p>
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={`${testimonial.name} testimonial`}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.package}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
