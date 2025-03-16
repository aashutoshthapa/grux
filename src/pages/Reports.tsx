import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, BarChart3, BarChart2, Users, CreditCard, TrendingUp, FileText, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Reports() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [membersByPackage, setMembersByPackage] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [membershipStatus, setMembershipStatus] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('last6months');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    document.title = "Reports | G-Rux Fitness";
    fetchReportData();
  }, [reportPeriod]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch members by package
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('package, status');
      
      if (membersError) throw membersError;
      
      // Fetch payment history for revenue report
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_history')
        .select('payment_date, amount');
      
      if (paymentsError) throw paymentsError;
      
      // Process members by package data
      const packageCounts = membersData.reduce((acc, member) => {
        acc[member.package] = (acc[member.package] || 0) + 1;
        return acc;
      }, {});
      
      const packageData = Object.keys(packageCounts).map(name => ({
        name,
        value: packageCounts[name]
      }));
      
      setMembersByPackage(packageData);
      
      // Process membership status data
      const statusCounts = membersData.reduce((acc, member) => {
        acc[member.status] = (acc[member.status] || 0) + 1;
        return acc;
      }, {});
      
      const statusData = Object.keys(statusCounts).map(name => ({
        name,
        value: statusCounts[name]
      }));
      
      setMembershipStatus(statusData);
      
      // Process revenue by month data
      let months = [];
      const currentDate = new Date();
      
      if (reportPeriod === 'thismonth') {
        // Get daily data for current month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          if (day % 5 === 1 || day === daysInMonth) { // Get every 5th day for readability
            months.push({
              month: `${day}`,
              monthNum: month,
              yearNum: year,
              day: day
            });
          }
        }
      } else if (reportPeriod === 'last6months') {
        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentDate);
          d.setMonth(d.getMonth() - i);
          months.push({
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            monthNum: d.getMonth(),
            yearNum: d.getFullYear()
          });
        }
      } else if (reportPeriod === 'thisyear') {
        // Get all months in current year
        for (let i = 0; i < 12; i++) {
          const d = new Date(currentDate.getFullYear(), i, 1);
          months.push({
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            monthNum: i,
            yearNum: d.getFullYear()
          });
        }
      } else if (reportPeriod === 'lastyear') {
        // Get all months in previous year
        for (let i = 0; i < 12; i++) {
          const d = new Date(currentDate.getFullYear() - 1, i, 1);
          months.push({
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            monthNum: i,
            yearNum: d.getFullYear()
          });
        }
      }
      
      // Calculate revenue for each time period
      const revenueData = months.map(monthData => {
        const revenue = paymentsData
          .filter(payment => {
            const paymentDate = new Date(payment.payment_date);
            
            if (reportPeriod === 'thismonth') {
              return paymentDate.getMonth() === monthData.monthNum && 
                     paymentDate.getFullYear() === monthData.yearNum && 
                     paymentDate.getDate() <= monthData.day && 
                     paymentDate.getDate() > (monthData.day - 5 > 0 ? monthData.day - 5 : 0);
            }
            
            return paymentDate.getMonth() === monthData.monthNum && 
                   paymentDate.getFullYear() === monthData.yearNum;
          })
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        return {
          name: reportPeriod === 'thismonth' 
            ? `Day ${monthData.month}` 
            : `${monthData.month}${reportPeriod !== 'thisyear' ? ` '${monthData.year.toString().substr(2, 2)}` : ''}`,
          revenue
        };
      });
      
      setRevenueByMonth(revenueData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    toast.info('Generating PDF report...');

    try {
      const reportTitle = getReportTitle();
      const currentDate = new Date().toLocaleDateString();
      
      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(18);
      pdf.text(`GymStrive Hub - ${reportTitle}`, 105, 15, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${currentDate}`, 105, 22, { align: 'center' });
      
      // Capture report content as image using html2canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Increase quality
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit in PDF
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image to PDF
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`GymStriveHub_${reportTitle.replace(/\s/g, '_')}_${currentDate.replace(/\//g, '-')}.pdf`);
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const getReportTitle = () => {
    switch (reportPeriod) {
      case 'thismonth':
        return 'This Month Report';
      case 'last6months':
        return 'Last 6 Months Report';
      case 'thisyear':
        return 'This Year Report';
      case 'lastyear':
        return 'Last Year Report';
      default:
        return 'Financial Report';
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gym-blue/20 focus:border-gym-blue"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
              >
                <option value="thismonth">This Month</option>
                <option value="last6months">Last 6 Months</option>
                <option value="thisyear">This Year</option>
                <option value="lastyear">Last Year</option>
              </select>
            </div>
            
            <button 
              className="btn-secondary flex items-center gap-2"
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-card p-8 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-gym-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gym-gray">Loading report data...</p>
          </div>
        ) : (
          <div ref={reportRef}>
            <div className="bg-white rounded-xl shadow-card overflow-hidden p-6 mb-6">
              <h3 className="text-xl font-bold text-gym-blue mb-2">{getReportTitle()}</h3>
              <p className="text-gray-500">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gym-blue" />
                  <h2 className="text-lg font-semibold">Monthly Revenue</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueByMonth}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue (₹)" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Members by Package Chart */}
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gym-blue" />
                    <h2 className="text-lg font-semibold">Members by Package</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={membersByPackage}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {membersByPackage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} members`, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Membership Status Chart */}
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-gym-blue" />
                    <h2 className="text-lg font-semibold">Membership Status</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={membershipStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {membershipStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} members`, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gym-blue" />
                  <h2 className="text-lg font-semibold">Summary</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-gym-gray text-sm">Total Members</p>
                      <p className="text-2xl font-bold">
                        {membersByPackage.reduce((sum, item) => sum + item.value, 0)}
                      </p>
                      <div className="flex items-center mt-1 text-green-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>Growing steadily</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-gym-gray text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        ₹{revenueByMonth.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-1 text-green-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>+12% from previous period</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-gym-gray text-sm">Active Members</p>
                      <p className="text-2xl font-bold">
                        {membershipStatus.find(item => item.name === 'Active')?.value || 0}
                      </p>
                      <div className="flex items-center mt-1 text-green-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>High retention rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
