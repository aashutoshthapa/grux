import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const navItems = [
    { name: 'Home', href: '/', action: () => window.scrollTo(0, 0), active: location.pathname === '/' },
    { name: 'Packages', href: '/#packages', action: () => scrollToSection('packages'), active: false },
    { name: 'Contact', href: '/#contact', action: () => scrollToSection('contact'), active: false },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled || mobileMenuOpen ? 'glassmorphism' : 'bg-transparent'
      )}
    >
      <div className="container-tight py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2"
            aria-label="G-Rux Fitness"
          >
            <img src="/logo.jpg" alt="G-Rux Fitness" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!isAdminRoute && navItems.map((item) => (
              <button
                key={item.name}
                onClick={item.action}
                className={cn(
                  'text-sm font-medium transition-colors duration-300 relative',
                  item.active 
                    ? 'text-gym-blue' 
                    : 'text-gym-darkGray hover:text-gym-blue'
                )}
              >
                {item.name}
                {item.active && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gym-blue rounded-full animate-fade-in" />
                )}
              </button>
            ))}
          </nav>

          {/* CTA Button on desktop */}
          <div className="hidden md:block">
            {!isAdminRoute ? (
              <Link to="/admin/login" className="btn-primary">
                Admin Login
              </Link>
            ) : (
              <Link to="/" className="btn-secondary">
                Back to Website
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gym-black p-2 rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 px-6 bg-white animate-fade-in">
          <nav className="flex flex-col space-y-4">
            {!isAdminRoute && navItems.map((item) => (
              <button
                key={item.name}
                onClick={item.action}
                className={cn(
                  'text-base font-medium text-left',
                  item.active ? 'text-gym-blue' : 'text-gym-darkGray'
                )}
              >
                {item.name}
              </button>
            ))}
            {!isAdminRoute ? (
              <Link 
                to="/admin/login" 
                className="btn-primary w-full text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Login
              </Link>
            ) : (
              <Link 
                to="/" 
                className="btn-secondary w-full text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Back to Website
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
