import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    currentEmail: ''
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      const adminEmail = localStorage.getItem('adminEmail');
      if (!adminEmail) return;

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('name, email')
          .eq('email', adminEmail)
          .single();

        if (error) throw error;
        if (data) {
          setAdminData({
            name: data.name,
            email: data.email,
            currentEmail: data.email
          });
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
      }
    };

    fetchAdminData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First update activity logs
      const { error: logsError } = await supabase
        .from('activity_logs')
        .update({ performed_by: adminData.email })
        .eq('performed_by', adminData.currentEmail);

      if (logsError) throw logsError;

      // Then update admin user
      const { error: userError } = await supabase
        .from('admin_users')
        .update({ email: adminData.email })
        .eq('email', adminData.currentEmail);

      if (userError) throw userError;

      // Update local storage
      localStorage.setItem('adminEmail', adminData.email);
      setAdminData(prev => ({ ...prev, currentEmail: adminData.email }));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      // Revert form data
      setAdminData(prev => ({ ...prev, email: prev.currentEmail }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gym-gray mb-2">
            Name
          </label>
          <input
            type="text"
            value={adminData.name}
            disabled
            className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg bg-gray-50"
          />
          <p className="mt-1 text-sm text-gym-gray">Contact support to change your name</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gym-gray mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={adminData.email}
            onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
            placeholder="admin@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || adminData.email === adminData.currentEmail}
          className="btn-primary w-full md:w-auto relative overflow-hidden"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            'Update Profile'
          )}
        </button>
      </form>
    </div>
  );
} 