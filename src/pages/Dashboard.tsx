import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Users, User, LogOut, Clock, Activity, FileText, DollarSign, PlusCircle, CreditCard, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ProfileModal from '@/components/admin/ProfileModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [adminName, setAdminName] = useState('Admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expiringMemberships, setExpiringMemberships] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<Record<string, string>>({});
  const [revenue, setRevenue] = useState(0);
  const [revenueBreakdown, setRevenueBreakdown] = useState<{ [key: string]: { amount: number, count: number } }>({
    'New Members': { amount: 0, count: 0 },
    'Renewals': { amount: 0, count: 0 }
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Admin Panel | G-Rux Fitness";
    checkAuth();
    fetchAdminUsers();
    updateExpiredMemberships().then(() => {
      fetchDashboardData();
      fetchExpiringMemberships();
      calculateRevenue();
    });
  }, []);

  const checkAuth = () => {
    const adminEmail = localStorage.getItem('adminEmail');
    const adminName = localStorage.getItem('adminName');
    
    if (!adminEmail) {
      navigate('/admin/login');
      return;
    }

    setAdminEmail(adminEmail);
    if (adminName) {
      setAdminName(adminName);
    }
  };

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

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { count: total, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      const { count: active, error: activeError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
      
      if (activeError) throw activeError;
      
      const { count: expired, error: expiredError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Expired');
      
      if (expiredError) throw expiredError;
      
      setMemberCount(total || 0);
      setActiveCount(active || 0);
      setExpiredCount(expired || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpiredMemberships = async () => {
    try {
      const now = new Date().toISOString();
      
      // Find all members with Active status but expired subscription
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'Active')
        .lt('subscription_end_date', now);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Extract the IDs of expired members
        const expiredMemberIds = data.map(member => member.id);
        
        // Update their status to Expired
        const { error: updateError } = await supabase
          .from('members')
          .update({ status: 'Expired' })
          .in('id', expiredMemberIds);
        
        if (updateError) throw updateError;
        
        // Log this activity
        for (const memberId of expiredMemberIds) {
          await supabase
            .from('activity_logs')
            .insert({
              member_id: memberId,
              action_type: 'status_change',
              action_details: 'Membership expired automatically',
              performed_by: null
            });
        }
        
        console.log(`Updated ${expiredMemberIds.length} members to Expired status`);
      }
    } catch (error) {
      console.error('Error updating expired memberships:', error);
    }
  };

  const fetchExpiringMemberships = async () => {
    try {
      const now = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(now.getDate() + 7);
      
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'Active')
        .lt('subscription_end_date', sevenDaysLater.toISOString())
        .gte('subscription_end_date', now.toISOString())
        .order('subscription_end_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      setExpiringMemberships(data || []);
    } catch (error) {
      console.error('Error fetching expiring memberships:', error);
    }
  };

  const calculateRevenue = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('payment_history')
        .select(`
          amount,
          member_id,
          payment_date
        `)
        .gte('payment_date', firstDayOfMonth.toISOString())
        .lte('payment_date', now.toISOString());
      
      if (error) throw error;
      
      let totalRevenue = 0;
      const breakdown: { [key: string]: { amount: number, count: number } } = {
        'New Members': { amount: 0, count: 0 },
        'Renewals': { amount: 0, count: 0 }
      };

      if (data) {
        // Get all members to check if payment is for new member or renewal
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, join_date');
          
        if (membersError) throw membersError;
        
        const membersMap = new Map(membersData.map(m => [m.id, m.join_date]));
        
        data.forEach(payment => {
          const amount = payment.amount || 0;
          totalRevenue += amount;
          
          // Check if this payment was made on the member's join date
          const memberJoinDate = membersMap.get(payment.member_id);
          const paymentDate = new Date(payment.payment_date);
          const joinDate = memberJoinDate ? new Date(memberJoinDate) : null;
          
          // If payment date matches join date (same day), it's a new member payment
          const isNewMember = joinDate && 
            paymentDate.getFullYear() === joinDate.getFullYear() &&
            paymentDate.getMonth() === joinDate.getMonth() &&
            paymentDate.getDate() === joinDate.getDate();
          
          const category = isNewMember ? 'New Members' : 'Renewals';
          breakdown[category].amount += amount;
          breakdown[category].count += 1;
        });
      }
      
      setRevenue(totalRevenue);
      setRevenueBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating revenue:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'add':
        return 'bg-green-100 text-green-800';
      case 'renewal':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAdminName = (email: string | null) => {
    if (!email) return 'System';
    return adminUsers[email] || email;
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
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const getPackageStyle = (packageName: string) => {
    switch(packageName) {
      case 'Diamond':
        return 'bg-purple-100 text-purple-800';
      case 'Gold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'just now';
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gym-lightGray">
      <header className="bg-white shadow-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold">
                Admin Panel
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="btn-secondary flex items-center gap-2 text-sm py-2"
              >
                <Settings className="h-4 w-4" />
                Edit Profile
              </button>
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
        <div className="grid grid-cols-1 gap-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Members</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {isLoading ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      memberCount
                    )}
                  </h3>
                  {!isLoading && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                        <span className="font-medium">{activeCount} members</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          Expired
                        </span>
                        <span className="font-medium">{expiredCount} members</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full" 
                          style={{ 
                            width: `${(activeCount / (memberCount || 1)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Monthly Revenue</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {isLoading ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      `₹${revenue.toLocaleString()}`
                    )}
                  </h3>
                  {!isLoading && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(revenueBreakdown).map(([category, data]) => (
                        data.amount > 0 && (
                          <div key={category} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`${
                                category === 'New Members' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              } px-2 py-0.5 rounded-full`}>
                                {category}
                              </span>
                              <span className="text-gray-500">({data.count})</span>
                            </div>
                            <span className="font-medium">₹{data.amount.toLocaleString()}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <CreditCard className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Expiring Soon</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {isLoading ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      expiringMemberships.length
                    )}
                  </h3>
                </div>
                <div className="bg-orange-50 p-3 rounded-full">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold">Expiring Soon</h2>
              </div>
              <div className="p-6">
                {expiringMemberships.length > 0 ? (
                  <div className="space-y-4">
                    {expiringMemberships.map((member) => (
                      <div key={member.id} className="border-b border-gray-50 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-2 rounded-full bg-orange-50 text-orange-500">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <Link to={`/admin/members/${member.id}`} className="text-sm font-medium hover:text-gym-blue">
                              {member.name}
                            </Link>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${getPackageStyle(member.package)}`}>
                                {member.package}
                              </span>
                              <span className={`text-xs ${
                                calculateDaysLeft(member.subscription_end_date) <= 3 ? 'text-red-600' :
                                calculateDaysLeft(member.subscription_end_date) <= 7 ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {calculateDaysLeft(member.subscription_end_date)} days left
                              </span>
                            </div>
                            <div className="mt-2">
                              <Link to={`/admin/members/renew/${member.id}`} className="text-xs text-gym-blue hover:underline">
                                Renew membership →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-6">No memberships expiring soon.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/admin/members/add"
              className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="bg-blue-50 p-3 rounded-full">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">Add Member</h3>
              </div>
            </Link>

            <Link
              to="/admin/members"
              className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="bg-indigo-50 p-3 rounded-full">
                <Users className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-medium">All Members</h3>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="bg-yellow-50 p-3 rounded-full">
                <BarChart3 className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-medium">Reports</h3>
              </div>
            </Link>

            <Link
              to="/admin/contacts"
              className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="bg-green-50 p-3 rounded-full">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">Contact Forms</h3>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

