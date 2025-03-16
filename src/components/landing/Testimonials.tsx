
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Member since 2025',
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=1974',
    quote: "Joining GymStriveHub was the best decision I made for my health. The trainers are incredibly knowledgeable and supportive. I've lost 15kg and gained so much confidence!",
    rating: 5
  },
  {
    id: 2,
    name: 'Rahul Mehta',
    role: 'Member since 2025',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=1974',
    quote: 'The facilities are top-notch and always clean. What I appreciate most is how the staff remembers everyone by name and truly cares about your progress.',
    rating: 5
  },
  {
    id: 3,
    name: 'Priya Sharma',
    role: 'Diamond Member',
    image: 'https://images.unsplash.com/photo-1664575602554-2087b04935a5?q=80&w=1974',
    quote: 'As someone who was intimidated by gyms, GymStriveHub created such a welcoming environment. The Diamond package is worth every rupee for the personalized attention.',
    rating: 4
  },
  {
    id: 4,
    name: 'Michael Chen',
    role: 'Gold Member',
    image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1780',
    quote: "The variety of classes keeps my routine fresh and exciting. I've tried everything from HIIT to yoga, and the instructors are all excellent at what they do.",
    rating: 5
  }
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById('testimonials-section');
      if (element) {
        const position = element.getBoundingClientRect();
        // Check if section is visible in viewport
        if (position.top < window.innerHeight * 0.75) {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial load
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    
    if (autoplay) {
      interval = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % testimonials.length);
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoplay, testimonials.length]);

  const handlePrev = () => {
    setAutoplay(false);
    setActiveIndex((current) => (current === 0 ? testimonials.length - 1 : current - 1));
  };

  const handleNext = () => {
    setAutoplay(false);
    setActiveIndex((current) => (current + 1) % testimonials.length);
  };

  return (
    <section className="section bg-white" id="testimonials-section">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block rounded-full bg-gym-blue/10 px-4 py-1.5 text-sm font-medium text-gym-blue mb-4">
            Success Stories
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gym-black">
            Hear From Our Members
          </h2>
          <p className="text-gym-gray text-lg">
            Real people, real results. Discover how GymStriveHub has transformed the lives of our community.
          </p>
        </div>

        {/* Testimonials carousel */}
        <div className={cn(
          "relative max-w-4xl mx-auto",
          "transition-all duration-700 transform",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <div className="overflow-hidden rounded-2xl bg-gym-lightGray shadow-card">
            <div 
              className="transition-all duration-500 ease-in-out flex" 
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id} 
                  className="min-w-full p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center"
                >
                  {/* Image */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-subtle">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-5 w-5", 
                            i < testimonial.rating ? "text-gym-blue fill-gym-blue" : "text-gym-gray"
                          )} 
                        />
                      ))}
                    </div>
                    
                    <blockquote className="text-lg md:text-xl italic text-gym-black mb-6">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div>
                      <h4 className="font-bold text-gym-black">{testimonial.name}</h4>
                      <p className="text-gym-gray">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-center mt-8 space-x-2">
            <button 
              onClick={handlePrev}
              className="p-2 rounded-full border border-gym-gray/20 text-gym-black hover:bg-gym-lightGray transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  setAutoplay(false);
                }}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  index === activeIndex 
                    ? "bg-gym-blue w-6" 
                    : "bg-gym-gray/30 hover:bg-gym-gray/50"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
            
            <button 
              onClick={handleNext}
              className="p-2 rounded-full border border-gym-gray/20 text-gym-black hover:bg-gym-lightGray transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
