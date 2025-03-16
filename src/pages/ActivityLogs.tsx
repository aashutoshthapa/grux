
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Calendar, Download, Filter, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Log {
  id: string;
  action_type: string;
  description: string;
  performed_by: string;
  member_id: string | null;
  created_at: string;
}

export default function ActivityLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('last6months');
  const [actionFilter, setActionFilter] = useState('all');
  const [adminUsers, setAdminUsers] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchAdminUsers();
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, timeFilter, actionFilter]);

  const checkAdminStatus = () => {
    const adminEmail = localStorage.getItem('adminEmail');
    
    // For now, we'll consider all logged-in users as admins
    // In a real app, you would check if the user has admin privileges
    if (adminEmail) {
      setIsAdmin(true);
    } else {
      // Redirect non-admins
      navigate('/admin/login');
      toast.error('You need to log in to access this page');
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

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...logs];
    
    // Apply time filter
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeFilter) {
      case 'last6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case 'thisyear':
        cutoffDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        break;
      case 'lastyear':
        cutoffDate = new Date(now.getFullYear() - 1, 0, 1); // January 1st of last year
        const lastYearEnd = new Date(now.getFullYear(), 0, 0); // December 31st of last year
        result = result.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= cutoffDate && logDate <= lastYearEnd;
        });
        break;
      default:
        cutoffDate = new Date(0); // No filter
    }
    
    // Apply time filter (except for 'lastyear' which is already handled)
    if (timeFilter !== 'lastyear') {
      result = result.filter(log => new Date(log.created_at) >= cutoffDate);
    }
    
    // Apply action type filter
    if (actionFilter !== 'all') {
      result = result.filter(log => log.action_type === actionFilter);
    }
    
    setFilteredLogs(result);
  };

  const formatDate = (dateString: string) => {
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

  const handleExport = (format: 'csv' | 'pdf') => {
    // For CSV export
    if (format === 'csv') {
      if (filteredLogs.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Create CSV content
      const headers = ['Date', 'Action', 'Description', 'Performed By'];
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          formatDate(log.created_at),
          log.action_type,
          log.description,
          getAdminName(log.performed_by)
        ].join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV export successful');
    } else {
      // For PDF export - in a real app, you would implement PDF generation
      toast.info('PDF export coming soon');
    }
  };

  const handleLogout = () => {
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  if (!isAdmin) {
    return null; // Prevent rendering if not admin
  }

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
            <h1 className="text-2xl font-bold">Activity Logs</h1>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Time Period:</span>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gym-blue/20 focus:border-gym-blue text-sm"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <option value="last6months">Last 6 Months</option>
                    <option value="thisyear">This Year</option>
                    <option value="lastyear">Last Year</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Action Type:</span>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gym-blue/20 focus:border-gym-blue text-sm"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    <option value="all">All Actions</option>
                    <option value="add">New Members</option>
                    <option value="renewal">Renewals</option>
                    <option value="delete">Deletions</option>
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
                <p className="mt-4 text-gym-gray">Loading activity logs...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gym-gray text-sm border-b border-gray-200">
                    <th className="px-6 py-4 font-medium">Date & Time</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
                      <td className="px-6 py-4 text-gym-gray">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionTypeColor(log.action_type)}`}>
                          {log.action_type === 'add' ? 'New Member' :
                           log.action_type === 'renewal' ? 'Renewal' :
                           log.action_type === 'delete' ? 'Deletion' : log.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gym-black">{log.description}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gym-blue" />
                          <span>{getAdminName(log.performed_by)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gym-gray">No activity logs found for the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
