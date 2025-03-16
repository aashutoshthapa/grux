import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, LogOut, Check, X, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
  contacted: boolean;
}

export default function ContactSubmissions() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactToggle = async (contact: Contact) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ contacted: !contact.contacted })
        .eq('id', contact.id);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === contact.id ? { ...c, contacted: !c.contacted } : c
      ));
      
      toast.success(`Marked as ${!contact.contacted ? 'contacted' : 'not contacted'}`);
    } catch (error) {
      console.error('Error updating contact status:', error);
      toast.error('Failed to update contact status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact submission? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.filter(contact => contact.id !== id));
      toast.success('Contact submission deleted successfully');
    } catch (error) {
      console.error('Error deleting contact submission:', error);
      toast.error('Failed to delete contact submission');
    } finally {
      setIsDeleting(false);
    }
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
              <img src="/logo.jpg" alt="G-Rux Fitness" className="h-10 w-auto" />
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
            <h1 className="text-2xl font-bold">Contact Form Submissions</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gym-blue" />
                <h2 className="text-lg font-semibold">Contact Requests</h2>
              </div>
              <span className="bg-gym-blue/10 text-gym-blue text-xs font-medium rounded-full px-2.5 py-1">
                {contacts.length} submissions
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <svg className="animate-spin h-8 w-8 mx-auto text-gym-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gym-gray">Loading contact submissions...</p>
              </div>
            ) : contacts.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gym-gray text-sm border-b border-gray-200">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium">Message</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
                      <td className="px-6 py-4 text-gym-black">{contact.name}</td>
                      <td className="px-6 py-4 text-gym-gray">{contact.email}</td>
                      <td className="px-6 py-4 text-gym-gray">{contact.phone || '-'}</td>
                      <td className="px-6 py-4 text-gym-gray">
                        <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={contact.message}>
                          {contact.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gym-gray text-sm">{formatDate(contact.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => handleContactToggle(contact)}
                            disabled={isUpdating}
                            className={`flex items-center gap-1 text-sm rounded-full px-3 py-1 ${
                              contact.contacted 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {contact.contacted ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Contacted</span>
                              </>
                            ) : (
                              <>
                                <X className="h-3.5 w-3.5" />
                                <span>Not Contacted</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            disabled={isDeleting}
                            className="flex items-center gap-1 text-sm rounded-full px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200"
                            title="Delete this contact submission"
                          >
                            <Trash className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gym-gray">No contact submissions yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
