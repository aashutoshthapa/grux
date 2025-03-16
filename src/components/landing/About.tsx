
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function About() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById('about-section');
      if (element) {
        const position = element.getBoundingClientRect();
        // Check if section is visible in viewport
        if (position.top < window.innerHeight * 0.8) {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial load
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="about-section" className="section bg-gym-lightGray">
      <div className="container-tight">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image side with mosaic layout */}
          <div className={cn(
            "grid grid-cols-12 grid-rows-6 gap-3 h-[600px]",
            "transition-all duration-1000 transform",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
          )}>
            {/* Main image */}
            <div className="col-span-8 row-span-4 rounded-2xl overflow-hidden shadow-card">
              <img 
                src="https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=1974" 
                alt="Gym interior with modern equipment" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Secondary image */}
            <div className="col-span-4 row-span-3 col-start-9 rounded-2xl overflow-hidden shadow-card">
              <img 
                src="https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?q=80&w=2069" 
                alt="Person using gym equipment" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Tertiary image */}
            <div className="col-span-7 row-span-2 row-start-5 rounded-2xl overflow-hidden shadow-card">
              <img 
                src="https://images.unsplash.com/photo-1533681904393-9ab6eee7e408?q=80&w=2070" 
                alt="Group fitness class" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Text content */}
          <div className={cn(
            "space-y-6",
            "transition-all duration-1000 delay-300 transform",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          )}>
            <div className="inline-block rounded-full bg-gym-blue/10 px-4 py-1.5 text-sm font-medium text-gym-blue">
              Our Story
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gym-black">
              Building a Healthier Community Since 2025
            </h2>
            
            <p className="text-gym-gray text-lg">
              GymStriveHub was founded with a simple mission: to create a fitness center that truly puts 
              members' health and wellness first. Our founders, passionate fitness enthusiasts themselves, 
              recognized the need for a gym that combines state-of-the-art equipment with personalized 
              attention and a supportive community.
            </p>
            
            <p className="text-gym-gray text-lg">
              Since opening our doors in 2025, we've grown to become more than just a place to work out. 
              We're a community of individuals dedicated to self-improvement, supporting each other through 
              every step of the fitness journey.
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gym-blue">Our Mission</h3>
                <p className="text-gym-gray">To inspire and support every member in achieving their personal fitness goals through expert guidance and premium facilities.</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gym-blue">Our Vision</h3>
                <p className="text-gym-gray">To be the leading fitness center that transforms lives through accessible, innovative, and inclusive health solutions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
