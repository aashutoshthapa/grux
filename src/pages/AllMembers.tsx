import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Search, Filter, Trash, Edit, Eye, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  package: string;
  join_date: string;
  subscription_end_date: string | null;
  status: string;
  added_by: string | null;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export default function AllMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminUsers, setAdminUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = "Members | G-Rux Fitness";
    fetchMembers();
    fetchAdminUsers();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = members;
    
    if (searchTerm) {
      result = result.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(member => member.status === statusFilter);
    }
    
    if (packageFilter !== 'all') {
      result = result.filter(member => member.package === packageFilter);
    }
    
    setFilteredMembers(result);
  }, [members, searchTerm, statusFilter, packageFilter]);

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

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('join_date', { ascending: false });
      
      if (error) throw error;
      
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // Delete related payment history first to avoid foreign key constraints
      const { error: paymentError } = await supabase
        .from('payment_history')
        .delete()
        .eq('member_id', id);
      
      if (paymentError) throw paymentError;
      
      // Now delete the member
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setMembers(members.filter(member => member.id !== id));
      toast.success('Member deleted successfully');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
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

  const viewMemberDetail = (memberId: string) => {
    navigate(`/admin/members/${memberId}`);
  };

  const handleLogout = () => {
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const getAdminName = (email: string | null) => {
    if (!email) return 'System';
    return adminUsers[email] || email;
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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">All Members</h1>
          </div>
          
          <button 
            onClick={() => navigate('/admin/members/add')}
            className="btn-primary"
          >
            Add New Member
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gym-blue/20 focus:border-gym-blue outline-none w-full md:w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gym-blue/20 focus:border-gym-blue text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Package:</span>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gym-blue/20 focus:border-gym-blue text-sm"
                    value={packageFilter}
                    onChange={(e) => setPackageFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <svg className="animate-spin h-8 w-8 mx-auto text-gym-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gym-gray">Loading members...</p>
              </div>
            ) : filteredMembers.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gym-gray text-sm border-b border-gray-200">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Package</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium">Expiry</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Added By</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
                      <td className="px-6 py-4 text-gym-black font-medium cursor-pointer" onClick={() => viewMemberDetail(member.id)}>
                        {member.name}
                      </td>
                      <td className="px-6 py-4 text-gym-gray">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.package === 'Diamond' ? 'bg-purple-100 text-purple-800' :
                          member.package === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.package}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gym-gray">{formatDate(member.join_date)}</td>
                      <td className="px-6 py-4">
                        {member.subscription_end_date ? (
                          <div>
                            <div className="text-gym-gray">{formatDate(member.subscription_end_date)}</div>
                            {member.status === 'Active' && (
                              <div className={`text-xs mt-1 font-medium ${
                                calculateDaysLeft(member.subscription_end_date) <= 3 ? 'text-red-600' :
                                calculateDaysLeft(member.subscription_end_date) <= 7 ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {calculateDaysLeft(member.subscription_end_date)} days left
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gym-gray">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          member.status === 'Active' ? 'bg-green-100 text-green-800' :
                          member.status === 'Expired' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gym-blue" />
                          <span className="text-gym-gray">{getAdminName(member.added_by)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewMemberDetail(member.id)}
                            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            disabled={isDeleting}
                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title="Delete Member"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gym-gray">No members found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
