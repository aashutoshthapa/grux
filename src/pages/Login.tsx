import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    const checkLoggedIn = () => {
      const adminEmail = localStorage.getItem('adminEmail');
      if (adminEmail) {
        // Redirect to dashboard if already logged in
        navigate('/admin/dashboard');
      }
    };

    checkLoggedIn();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      // Hash the password for secure comparison
      const hashedPassword = CryptoJS.SHA256(password).toString();
      
      // Get admin with matching email
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Authentication error:', error);
        throw new Error('Invalid email or password');
      }

      if (!data) {
        throw new Error('Invalid email or password');
      }

      // Verify the hashed password
      if (data.password !== hashedPassword) {
        throw new Error('Invalid email or password');
      }

      // Store login state and admin info in local storage
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('adminEmail', email);
      localStorage.setItem('adminName', data.name);
      localStorage.setItem('adminLoginTime', Date.now().toString());
      
      toast.success(`Welcome, ${data.name}!`);
      
      // Redirect to the page they were trying to access or dashboard
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gym-lightGray px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-gray-200">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <img src="/logo.jpg" alt="G-Rux Fitness" className="h-16 w-auto" />
              </div>
              <h1 className="text-2xl font-bold text-gym-black mb-2">Admin Login</h1>
              <p className="text-gym-gray">Enter your credentials to access the admin dashboard</p>
            </div>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gym-gray mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gym-gray mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gym-gray/20 rounded-lg focus:ring-2 focus:ring-gym-blue focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gym-blue text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : 'Log In'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => navigate('/')}
                className="text-gym-blue hover:text-gym-blue/80 text-sm"
              >
                Back to Website
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
