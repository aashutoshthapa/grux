import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gym-black text-white">
      <div className="container-tight py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="G-Rux Fitness" className="h-14 w-auto bg-white rounded-md p-1" />
            </div>
            <p className="text-gym-lightGray max-w-xs">
              Transforming lives through fitness excellence. Join our movement for a stronger, fitter, healthier you.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gym-lightGray hover:text-gym-blue transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gym-lightGray hover:text-gym-blue transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gym-lightGray hover:text-gym-blue transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gym-lightGray hover:text-gym-blue transition-colors" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-gym-lightGray hover:text-gym-blue transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/#packages" className="text-gym-lightGray hover:text-gym-blue transition-colors">
                  Memberships
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="text-gym-lightGray hover:text-gym-blue transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-gym-lightGray hover:text-gym-blue transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gym-lightGray hover:text-gym-blue transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gym-lightGray hover:text-gym-blue transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gym-lightGray hover:text-gym-blue transition-colors">
                  Membership Agreement
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-gym-blue mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gym-lightGray">
                  Pandu Bazar-06, Suryabinayak, Bhaktapur
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-gym-blue mr-3 flex-shrink-0" />
                <span className="text-gym-lightGray">+977 9865477263, +977 9851059606</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-gym-blue mr-3 flex-shrink-0" />
                <span className="text-gym-lightGray">gruxfitness@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gym-lightGray text-sm">
            &copy; {currentYear} G-Rux Fitness. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
