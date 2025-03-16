import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Package options for the gym with their respective durations in months and prices
const PACKAGE_OPTIONS = [
  { name: 'Silver', months: 1, price: 2000 },
  { name: 'Gold', months: 3, price: 5000 },
  { name: 'Diamond', months: 12, price: 20000 }
];
const PAYMENT_METHOD_OPTIONS = ['Cash', 'Bank'];

export default function MemberForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminEmail, setAdminEmail] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    package: 'Silver',
    payment_method: 'Cash',
    amount: PACKAGE_OPTIONS[0].price,
    discount: 0,
    notes: '',
  });

  // Get admin name on component mount
  useEffect(() => {
    // Check authentication
    const adminEmail = localStorage.getItem('adminEmail');
    if (!adminEmail) {
      navigate('/admin/login');
      return;
    }
    
    const storedAdminEmail = localStorage.getItem('adminEmail');
    const storedAdminName = localStorage.getItem('adminName');
    
    if (storedAdminEmail) {
      setAdminEmail(storedAdminEmail);
    }
    
    if (storedAdminName) {
      setAdminName(storedAdminName);
    } else {
      // Fallback to fetching from database if not in localStorage
      const getAdminInfo = async () => {
        const adminEmail = localStorage.getItem('adminEmail');
        if (adminEmail) {
          const { data, error } = await supabase
            .from('admin_users')
            .select('name')
            .eq('email', adminEmail)
            .single();
            
          if (data && !error) {
            setAdminName(data.name);
            localStorage.setItem('adminName', data.name);
          }
        }
      };
      
      getAdminInfo();
    }
  }, [navigate]);

  // Form input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If the package changes, update the amount field with the corresponding price
    if (name === 'package') {
      const selectedPackage = PACKAGE_OPTIONS.find(pkg => pkg.name === value);
      if (selectedPackage) {
        setFormData({
          ...formData,
          [name]: value,
          amount: selectedPackage.price
        });
        return;
      }
    }
    
    const parsedValue = name === 'amount' || name === 'discount' ? parseFloat(value) || 0 : value;
    
    setFormData({
      ...formData,
      [name]: parsedValue,
    });
  };

  // Calculate subscription end date based on package
  const calculateEndDate = (packageName: string) => {
    const now = new Date();
    const packageInfo = PACKAGE_OPTIONS.find(pkg => pkg.name === packageName);
    
    if (packageInfo) {
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + packageInfo.months);
      return endDate.toISOString();
    }
    
    return null;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!formData.name || !formData.email || !formData.package || !formData.payment_method) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const subscriptionEndDate = calculateEndDate(formData.package);
      
      console.log("Submitting member data:", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        package: formData.package,
        payment_method: formData.payment_method,
        amount: formData.amount,
        discount: formData.discount || 0,
        notes: formData.notes || null,
        status: 'Active',
        subscription_start_date: now,
        subscription_end_date: subscriptionEndDate,
        added_by: adminEmail
      });

      // Insert the new member into the database
      const { data, error } = await supabase
        .from('members')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          package: formData.package,
          payment_method: formData.payment_method,
          amount: formData.amount,
          discount: formData.discount || 0,
          notes: formData.notes || null,
          status: 'Active',
          subscription_start_date: now,
          subscription_end_date: subscriptionEndDate,
          added_by: adminEmail
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Member added successfully:", data);

      // Also add an entry to payment_history
      if (data && data.length > 0) {
        const { error: paymentError } = await supabase
          .from('payment_history')
          .insert({
            member_id: data[0].id,
            amount: formData.amount,
            discount: formData.discount || 0,
            payment_method: formData.payment_method,
            package: formData.package,
            notes: formData.notes || null,
            added_by: adminEmail,
            payment_date: now
          });

        if (paymentError) {
          console.error('Payment history insertion error:', paymentError);
          // Continue even if payment history insertion fails
        }

        // Log the new member addition
        const { error: logError } = await supabase
          .from('activity_logs')
          .insert({
            action_type: 'add',
            description: `${adminName} added new member ${formData.name} with ${formData.package} package`,
            performed_by: adminEmail,
            member_id: data[0].id
          });

        if (logError) {
          console.error('Log insertion error:', logError);
          // Continue even if log insertion fails
        }
      }

      toast.success("Member added successfully!");
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error("Failed to add member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-lightGray py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="text-gym-blue hover:text-gym-blue/80 flex items-center gap-1 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gym-black">Add New Member</h1>
              <p className="text-gym-gray">Fill in the form below to register a new gym member</p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gym-gray">Logged in as:</span>
              <p className="font-medium text-gym-blue">{adminName}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gym-black">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gym-gray mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gym-gray mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gym-gray mb-1">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Membership Details Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gym-black">Membership Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="package" className="block text-sm font-medium text-gym-gray mb-1">Package <span className="text-red-500">*</span></label>
                  <select
                    id="package"
                    name="package"
                    required
                    value={formData.package}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                  >
                    {PACKAGE_OPTIONS.map(option => (
                      <option key={option.name} value={option.name}>
                        {option.name} - Rs. {option.price} ({option.months} {option.months === 1 ? 'month' : 'months'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="payment_method" className="block text-sm font-medium text-gym-gray mb-1">Payment Method <span className="text-red-500">*</span></label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    required
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                  >
                    {PAYMENT_METHOD_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gym-gray mb-1">Amount (Rs.) <span className="text-red-500">*</span></label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="discount" className="block text-sm font-medium text-gym-gray mb-1">Discount (Rs.)</label>
                  <input
                    id="discount"
                    name="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gym-gray mb-1">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                placeholder="Any special requirements or medical conditions..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-3 bg-gym-blue text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Register Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
