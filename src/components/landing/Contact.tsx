import { useState } from 'react';
import { Send, Mail, Phone, MapPin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Save contact form to Supabase
      const { error } = await supabase
        .from('contacts')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message
        });
        
      if (error) throw error;
      
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section bg-gym-lightGray">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block rounded-full bg-gym-blue/10 px-4 py-1.5 text-sm font-medium text-gym-blue mb-4">
            Get In Touch
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gym-black">
            We'd Love to Hear From You
          </h2>
          <p className="text-gym-gray text-lg">
            Have questions about our memberships or facilities? Reach out to us and our team will get back to you shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact form */}
          <div className="bg-white rounded-2xl p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gym-black mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gym-gray/20 focus:border-gym-blue focus:ring-2 focus:ring-gym-blue/20 outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gym-black mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gym-gray/20 focus:border-gym-blue focus:ring-2 focus:ring-gym-blue/20 outline-none transition-all"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gym-black mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gym-gray/20 focus:border-gym-blue focus:ring-2 focus:ring-gym-blue/20 outline-none transition-all"
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gym-black mb-2">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gym-gray/20 focus:border-gym-blue focus:ring-2 focus:ring-gym-blue/20 outline-none transition-all resize-none"
                  placeholder="How can we help you?"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary relative overflow-hidden group"
              >
                <span className={`flex items-center justify-center gap-2 transition-all ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                  Send Message
                  <Send className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </span>
                
                {isSubmitting && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>
          
          {/* Contact info and map */}
          <div className="space-y-8">
            {/* Contact info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: MapPin, title: 'Visit Us', content: 'Pandu Bazar-06, Suryabinayak, Bhaktapur' },
                { icon: Phone, title: 'Call Us', content: '+977 9865477263, +977 9851059606' },
                { icon: Mail, title: 'Email Us', content: 'gruxfitness@gmail.com' }
              ].map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-card text-center">
                  <div className="w-12 h-12 bg-gym-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-gym-blue" />
                  </div>
                  <h3 className="font-semibold text-gym-black mb-2">{item.title}</h3>
                  <p className="text-gym-gray text-sm">{item.content}</p>
                </div>
              ))}
            </div>
            
            {/* Map */}
            <div className="bg-white p-4 rounded-2xl shadow-card h-[300px] overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3533.029605484612!2d85.41977867479733!3d27.67152907621781!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1a565555555%3A0x66f227536613456c!2sPandu%20Bazar%2C%20Suryabinayak%2C%20Bhaktapur!5e0!3m2!1sen!2snp!4v1710614988377!5m2!1sen!2snp"
                className="w-full h-full rounded-lg"
                frameBorder="0"
                style={{ border: 0 }}
                allowFullScreen
                aria-hidden="false"
                tabIndex={0}
                loading="lazy"
                title="Gym location"
              />
            </div>
            
            {/* Business hours */}
            <div className="bg-white p-6 rounded-2xl shadow-card">
              <h3 className="font-semibold text-gym-black mb-4">Business Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gym-gray">Monday - Friday</span>
                  <span className="font-medium text-gym-black">5:00 AM - 11:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gym-gray">Saturday</span>
                  <span className="font-medium text-gym-black">6:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gym-gray">Sunday</span>
                  <span className="font-medium text-gym-black">7:00 AM - 9:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
