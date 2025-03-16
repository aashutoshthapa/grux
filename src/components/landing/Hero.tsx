
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className={cn(
            "absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070')] bg-cover bg-center transition-all duration-1000 image-lazy-load",
            isLoaded ? '' : 'loading'
          )}
          style={{ 
            backgroundPosition: '50% 30%'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gym-black/90 to-gym-black/70" />
      </div>

      <div className="container-tight relative z-10 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text Content */}
          <div className={cn(
            "text-white space-y-8 transition-all duration-700 transform",
            isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          )}>
            <div className="inline-block rounded-full bg-gym-blue/20 px-4 py-1.5 text-sm font-medium text-gym-blue">
              Established 2025
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-balance">
              Stronger. Fitter. <br />
              <span className="text-gym-blue">Healthier.</span> <br />
              Join the movement!
            </h1>
            
            <p className="text-lg sm:text-xl text-gym-lightGray max-w-lg">
              Experience a premium fitness facility designed to help you reach your goals, 
              with state-of-the-art equipment and expert trainers.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                to="/#contact" 
                className="btn-primary flex items-center gap-2 group"
              >
                Contact Us
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          {/* Right side - Feature metrics */}
          <div className={cn(
            "grid grid-cols-2 gap-4 transition-all duration-700 delay-300 transform",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            {[
              { number: "5,000+", label: "Square Feet" },
              { number: "50+", label: "Fitness Classes" },
              { number: "24/7", label: "Access" },
              { number: "500+", label: "Active Members" }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="glassmorphism rounded-xl p-6 text-center card-effect"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl font-bold text-gym-blue mb-2">
                  {stat.number}
                </div>
                <div className="text-white">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-fade-in" />
        </div>
      </div>
    </section>
  );
}
