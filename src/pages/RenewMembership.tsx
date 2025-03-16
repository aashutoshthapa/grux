import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, LogOut, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Package options for the gym with their respective durations in months and prices
const PACKAGE_OPTIONS = [
  { name: 'Silver', months: 1, price: 2000 },
  { name: 'Gold', months: 3, price: 5000 },
  { name: 'Diamond', months: 12, price: 20000 }
];
const PAYMENT_METHOD_OPTIONS = ['Cash', 'Bank'];

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  package: string;
  status: string;
  subscription_end_date: string | null;
}

export default function RenewMembership() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [adminName, setAdminName] = useState('Admin');
  const [adminEmail, setAdminEmail] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    package: 'Silver',
    payment_method: 'Cash',
    amount: PACKAGE_OPTIONS[0].price,
    discount: 0,
    notes: '',
  });

  // Get admin name and member data on component mount
  useEffect(() => {
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

    if (id) {
      fetchMemberData(id);
    }
  }, [id]);

  const fetchMemberData = async (memberId: string) => {
    setIsLoading(true);
    try {
      // Fetch member data
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email, phone, package, status, subscription_end_date')
        .eq('id', memberId)
        .single();
      
      if (error) throw error;
      
      setMember(data);
      // Set default package to member's current package
      setFormData({
        ...formData,
        package: data.package,
        amount: PACKAGE_OPTIONS.find(pkg => pkg.name === data.package)?.price || formData.amount
      });
    } catch (error) {
      console.error('Error fetching member data:', error);
      toast.error('Failed to load member data');
      navigate('/admin/members');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Calculate new subscription end date based on package
  const calculateNewEndDate = (packageName: string, currentEndDate: string | null) => {
    // Use the current date or the current subscription end date, whichever is later
    const now = new Date();
    const baseDate = currentEndDate ? Math.max(now.getTime(), new Date(currentEndDate).getTime()) : now.getTime();
    const startDate = new Date(baseDate);
    
    const packageInfo = PACKAGE_OPTIONS.find(pkg => pkg.name === packageName);
    
    if (packageInfo) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + packageInfo.months);
      return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
    }
    
    return { startDate: startDate.toISOString(), endDate: null };
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!member) {
      toast.error("Member information not available");
      return;
    }

    setIsSubmitting(true);

    try {
      const { startDate, endDate } = calculateNewEndDate(formData.package, member.subscription_end_date);
      
      console.log("Renewing membership:", {
        member_id: member.id,
        package: formData.package,
        payment_method: formData.payment_method,
        amount: formData.amount,
        discount: formData.discount || 0,
        notes: formData.notes || null,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
        added_by: adminEmail
      });

      // Update the member record
      const { error: updateError } = await supabase
        .from('members')
        .update({
          package: formData.package,
          status: 'Active',
          subscription_start_date: startDate,
          subscription_end_date: endDate,
        })
        .eq('id', member.id);

      if (updateError) {
        console.error("Member update error:", updateError);
        throw updateError;
      }
      
      // Add an entry to payment_history
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          member_id: member.id,
          amount: formData.amount,
          discount: formData.discount || 0,
          payment_method: formData.payment_method,
          package: formData.package,
          notes: formData.notes || null,
          added_by: adminEmail,
          payment_date: new Date().toISOString()
        });

      if (paymentError) {
        console.error('Payment history insertion error:', paymentError);
        // Continue even if payment history insertion fails
      }

      // Log the renewal action
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert({
          action_type: 'renewal',
          description: `${adminName} renewed ${member.name}'s membership with ${formData.package} package`,
          performed_by: adminEmail,
          member_id: member.id
        });

      if (logError) {
        console.error('Log insertion error:', logError);
        // Continue even if log insertion fails
      }

      // Send confirmation email (will be implemented later)
      try {
        const response = await fetch(`${window.location.origin}/api/send-renewal-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: member.email,
            name: member.name,
            package: formData.package,
            amount: formData.amount,
            discount: formData.discount,
            startDate: startDate,
            endDate: endDate
          }),
        });
        
        if (!response.ok) {
          console.error('Email sending failed');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue even if email sending fails
      }

      toast.success("Membership renewed successfully!");
      navigate(`/admin/members/${member.id}`);
    } catch (error) {
      console.error('Error renewing membership:', error);
      toast.error("Failed to renew membership. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleLogout = () => {
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gym-lightGray">
      <header className="bg-white shadow-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold">
                GymStrive<span className="text-gym-blue">Hub</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2 text-sm py-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(`/admin/members/${id}`)}
            className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Renew Membership</h1>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-card p-8 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-gym-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gym-gray">Loading member data...</p>
          </div>
        ) : member ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Member Info Card */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gym-blue" />
                  <h2 className="text-lg font-semibold">Member Information</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gym-gray mb-1">Full Name</p>
                  <p className="font-medium">{member.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gym-gray mb-1">Email Address</p>
                  <p>{member.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gym-gray mb-1">Phone Number</p>
                  <p>{member.phone || 'Not provided'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gym-gray mb-1">Current Membership Package</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.package === 'Diamond' ? 'bg-purple-100 text-purple-800' :
                    member.package === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {member.package}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gym-gray mb-1">Current Expiry Date</p>
                  <p>{formatDate(member.subscription_end_date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gym-gray mb-1">Status</p>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    member.status === 'Active' ? 'bg-green-100 text-green-800' :
                    member.status === 'Expired' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {member.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Renewal Form */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gym-blue" />
                  <h2 className="text-lg font-semibold">Renewal Details</h2>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gym-gray mb-1">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                    placeholder="Any special requirements or notes..."
                  ></textarea>
                </div>
                
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
                    ) : 'Renew Membership'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card p-8 text-center">
            <p className="text-gym-gray">Member not found or has been removed.</p>
            <button 
              onClick={() => navigate('/admin/members')}
              className="mt-4 btn-primary"
            >
              Go Back to Members List
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
