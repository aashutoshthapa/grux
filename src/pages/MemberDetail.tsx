import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, LogOut, User, Calendar, CreditCard, Clipboard, Clock, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  package: string;
  join_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  status: string;
  body_weight: number | null;
  height: number | null;
  notes: string | null;
  added_by: string | null;
}

interface Payment {
  id: string;
  member_id: string;
  payment_date: string;
  amount: number;
  discount: number | null;
  payment_method: string;
  package: string;
  notes: string | null;
  added_by: string | null;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export default function MemberDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMemberData(id);
      fetchAdminUsers();
    }
  }, [id]);

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('email, name');
      
      if (error) throw error;
      
      const adminMap: Record<string, string> = {};
      if (data) {
        data.forEach(admin => {
          adminMap[admin.email] = admin.name;
        });
      }
      
      setAdminUsers(adminMap);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const fetchMemberData = async (memberId: string) => {
    setIsLoading(true);
    try {
      // Fetch member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();
      
      if (memberError) throw memberError;
      
      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_history')
        .select('*')
        .eq('member_id', memberId)
        .order('payment_date', { ascending: false });
      
      if (paymentError) throw paymentError;
      
      setMember(memberData);
      setPayments(paymentData || []);
    } catch (error) {
      console.error('Error fetching member data:', error);
      toast.error('Failed to load member data');
      navigate('/admin/members');
    } finally {
      setIsLoading(false);
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

  const calculateDaysLeft = (endDateStr: string | null) => {
    if (!endDateStr) return 0;
    
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const handleLogout = () => {
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const getAdminName = (email: string | null) => {
    if (!email) return 'System';
    return adminUsers[email] || email;
  };

  const handleEditClick = () => {
    setEditedMember({ ...member! });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMember(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedMember(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleSaveChanges = async () => {
    if (!editedMember) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: editedMember.name,
          email: editedMember.email,
          phone: editedMember.phone,
          subscription_end_date: editedMember.subscription_end_date,
          status: editedMember.status,
          body_weight: editedMember.body_weight,
          height: editedMember.height,
          notes: editedMember.notes
        })
        .eq('id', editedMember.id);
      
      if (error) throw error;
      
      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          member_id: editedMember.id,
          action_type: 'edit',
          action_details: 'Member details updated',
          performed_by: localStorage.getItem('adminEmail')
        });
      
      setMember(editedMember);
      setIsEditing(false);
      setEditedMember(null);
      toast.success('Member details updated successfully');
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member details');
    } finally {
      setIsSaving(false);
    }
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/admin/members')}
              className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">Member Details</h1>
          </div>
          
          {member && !isEditing && (
            <button 
              onClick={handleEditClick}
              className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-gym-blue rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Member
            </button>
          )}
          
          {isEditing && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges}
                className="flex items-center gap-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Member Info Card */}
              <div className="md:col-span-2 bg-white rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gym-blue" />
                    <h2 className="text-lg font-semibold">Member Information</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Full Name</p>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={editedMember?.name || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                          required
                        />
                      ) : (
                        <p className="font-medium">{member.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Email Address</p>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={editedMember?.email || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                          required
                        />
                      ) : (
                        <p>{member.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Phone Number</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={editedMember?.phone || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                        />
                      ) : (
                        <p>{member.phone || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Membership Package</p>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.package === 'Diamond' ? 'bg-purple-100 text-purple-800' :
                        member.package === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.package}
                      </span>
                      <p className="mt-1 text-xs text-gym-gray">(To change package, use Renew Membership option)</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Joined On</p>
                      <p>{formatDate(member.join_date)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Membership Status</p>
                      {isEditing ? (
                        <select
                          name="status"
                          value={editedMember?.status || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                        >
                          <option value="Active">Active</option>
                          <option value="Expired">Expired</option>
                        </select>
                      ) : (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          member.status === 'Active' ? 'bg-green-100 text-green-800' :
                          member.status === 'Expired' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Height</p>
                      {isEditing ? (
                        <input
                          type="number"
                          name="height"
                          value={editedMember?.height || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                          placeholder="Height in cm"
                        />
                      ) : (
                        <p>{member.height ? `${member.height} cm` : 'Not recorded'}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Weight</p>
                      {isEditing ? (
                        <input
                          type="number"
                          name="body_weight"
                          value={editedMember?.body_weight || ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                          placeholder="Weight in kg"
                        />
                      ) : (
                        <p>{member.body_weight ? `${member.body_weight} kg` : 'Not recorded'}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gym-gray mb-1">Added By</p>
                      <p>{getAdminName(member.added_by)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gym-gray mb-1">Subscription End Date</p>
                      {isEditing ? (
                        <input
                          type="date"
                          name="subscription_end_date"
                          value={editedMember?.subscription_end_date ? new Date(editedMember.subscription_end_date).toISOString().split('T')[0] : ''}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gym-gray" />
                          <p>
                            {member.subscription_end_date ? (
                              <>
                                {formatDate(member.subscription_end_date)}
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                  calculateDaysLeft(member.subscription_end_date) <= 3 ? 'bg-red-100 text-red-800' :
                                  calculateDaysLeft(member.subscription_end_date) <= 7 ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {calculateDaysLeft(member.subscription_end_date) > 0 
                                    ? `${calculateDaysLeft(member.subscription_end_date)} days left` 
                                    : 'Expired'}
                                </span>
                              </>
                            ) : (
                              'Not set'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <p className="text-sm text-gym-gray mb-1">Notes</p>
                      {isEditing ? (
                        <textarea
                          name="notes"
                          value={editedMember?.notes || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                          placeholder="Add notes about this member"
                        />
                      ) : (
                        <p className="text-sm">{member.notes || 'No notes added.'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Subscription Card */}
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gym-blue" />
                    <h2 className="text-lg font-semibold">Subscription Details</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-sm text-gym-gray mb-1">Current Period</p>
                    <div className="flex items-center justify-between">
                      <p>{formatDate(member.subscription_start_date)}</p>
                      <span className="text-gray-400">to</span>
                      <p>{formatDate(member.subscription_end_date)}</p>
                    </div>
                  </div>
                  
                  {member.status === 'Active' && member.subscription_end_date && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gym-gray">Time Remaining</p>
                        <p className={`text-sm font-medium ${
                          calculateDaysLeft(member.subscription_end_date) <= 3 ? 'text-red-600' :
                          calculateDaysLeft(member.subscription_end_date) <= 7 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {calculateDaysLeft(member.subscription_end_date)} days left
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            calculateDaysLeft(member.subscription_end_date) <= 3 ? 'bg-red-600' :
                            calculateDaysLeft(member.subscription_end_date) <= 7 ? 'bg-orange-500' :
                            'bg-green-600'
                          }`}
                          style={{ 
                            width: `${calculateDaysLeft(member.subscription_end_date) / 30 * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className="w-full btn-primary mb-3"
                    onClick={() => navigate('/admin/members/renew/' + member.id)}
                  >
                    Renew Membership
                  </button>
                </div>
              </div>
            </div>
            
            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gym-blue" />
                    <h2 className="text-lg font-semibold">Payment History</h2>
                  </div>
                  <span className="bg-gym-blue/10 text-gym-blue text-xs font-medium rounded-full px-2.5 py-1">
                    {payments.length} payments
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {payments.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gym-gray text-sm border-b border-gray-200">
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Package</th>
                        <th className="px-6 py-4 font-medium">Payment Method</th>
                        <th className="px-6 py-4 font-medium">Processed By</th>
                        <th className="px-6 py-4 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
                          <td className="px-6 py-4 text-gym-black">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gym-gray" />
                              {formatDate(payment.payment_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">
                            ₹{payment.amount.toLocaleString()}
                            {payment.discount && payment.discount > 0 && (
                              <span className="ml-2 text-green-600 text-xs">
                                (₹{payment.discount.toLocaleString()} discount)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.package === 'Diamond' ? 'bg-purple-100 text-purple-800' :
                              payment.package === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payment.package}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gym-gray">{payment.payment_method}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-gym-blue" />
                              <span>{getAdminName(payment.added_by)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gym-gray">
                            {payment.notes ? (
                              <div className="flex items-center gap-1">
                                <Clipboard className="h-4 w-4" />
                                <span>{payment.notes}</span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gym-gray">No payment records found for this member.</p>
                  </div>
                )}
              </div>
            </div>
          </>
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
