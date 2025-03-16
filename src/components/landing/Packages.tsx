
import { useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import PackageContactForm from '@/components/landing/PackageContactForm';

const packages = [
  {
    id: 'silver',
    name: 'Silver Package',
    price: 'Rs. 2,000',
    duration: '1 Month',
    features: [
      'Full gym access',
      'Basic fitness assessment',
      'Access to standard equipment',
      'Locker room access',
      'Free water station'
    ],
    popular: false,
    bgColor: 'bg-gym-lightGray',
    textColor: 'text-gym-black',
    borderColor: 'border-gym-gray/20'
  },
  {
    id: 'gold',
    name: 'Gold Package',
    price: 'Rs. 5,000',
    duration: '3 Months',
    features: [
      'Everything in Silver',
      'Personal training session (2x)',
      'Nutrition consultation',
      'Access to exclusive classes',
      'Towel service'
    ],
    popular: true,
    bgColor: 'bg-gradient-to-br from-white to-gym-lightGray',
    textColor: 'text-gym-black',
    borderColor: 'border-gym-blue'
  },
  {
    id: 'diamond',
    name: 'Diamond Package',
    price: 'Rs. 20,000',
    duration: '6 Months',
    features: [
      'Everything in Gold',
      'Unlimited personal training',
      'Quarterly body analysis',
      'Priority class booking',
      'Guest passes (4x)'
    ],
    popular: false,
    bgColor: 'bg-gradient-to-br from-gym-black to-gym-darkGray',
    textColor: 'text-white',
    borderColor: 'border-gym-gray/20'
  }
];

export default function Packages() {
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');

  const handleSelectPlan = (packageId: string) => {
    setSelectedPackage(packageId);
    setShowContactForm(true);
  };

  return (
    <section id="packages" className="section bg-white">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block rounded-full bg-gym-blue/10 px-4 py-1.5 text-sm font-medium text-gym-blue mb-4">
            Membership Options
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gym-black">
            Choose the Perfect Plan for Your Fitness Journey
          </h2>
          <p className="text-gym-gray text-lg">
            We offer flexible membership options to fit your schedule and budget.
            Start your fitness journey today with our premium facilities.
          </p>
        </div>

        {/* Packages grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {packages.map((pkg) => (
            <div 
              key={pkg.id}
              className={cn(
                'rounded-2xl overflow-hidden transition-all duration-500 transform',
                pkg.bgColor,
                pkg.popular ? 'md:-mt-4 md:mb-4 shadow-elevation scale-[1.02]' : 'shadow-card',
                hoveredPackage === pkg.id ? 'scale-[1.03]' : '',
                'border-2',
                pkg.borderColor
              )}
              onMouseEnter={() => setHoveredPackage(pkg.id)}
              onMouseLeave={() => setHoveredPackage(null)}
            >
              {pkg.popular && (
                <div className="bg-gym-blue text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className={cn("text-2xl font-bold mb-2", pkg.textColor)}>
                  {pkg.name}
                </h3>
                
                <div className="flex items-end mb-6">
                  <span className={cn("text-4xl font-bold", pkg.textColor)}>
                    {pkg.price}
                  </span>
                  <span className={cn("ml-2 pb-1", pkg.id === 'diamond' ? 'text-gym-lightGray' : 'text-gym-gray')}>
                    / {pkg.duration}
                  </span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle 
                        className={cn(
                          "h-5 w-5 flex-shrink-0 mr-3 mt-0.5", 
                          pkg.id === 'diamond' ? 'text-gym-blue' : 'text-gym-blue'
                        )} 
                      />
                      <span className={cn(
                        pkg.id === 'diamond' ? 'text-gym-lightGray' : 'text-gym-gray'
                      )}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => handleSelectPlan(pkg.id)}
                  className={cn(
                    "w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 group",
                    pkg.id === 'diamond' 
                      ? 'bg-gym-blue text-white hover:bg-opacity-90' 
                      : pkg.id === 'gold'
                        ? 'bg-gym-blue text-white hover:bg-opacity-90'
                        : 'bg-gym-black text-white hover:bg-opacity-90'
                  )}
                >
                  Select Plan
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Package Contact Form Modal */}
        {showContactForm && (
          <PackageContactForm 
            packageName={packages.find(pkg => pkg.id === selectedPackage)?.name || ''}
            onClose={() => setShowContactForm(false)}
          />
        )}
      </div>
    </section>
  );
}
