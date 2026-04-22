import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, CalendarDays, Utensils, ArrowRight, Clock, MapPin, PlusCircle, ChefHat, Contact2, Loader2, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
     totalCustomers: 0,
     totalMenu: 0,
     totalOrders: 0
  });
  
  const [nextEvents, setNextEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [cRes, mRes, oRes] = await Promise.all([
          fetch('/api/customers', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/menu', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/orders?filter=upcoming', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (!cRes.ok || !mRes.ok || !oRes.ok) throw new Error('Failed to synchronize dashboard metrics');

        const customers = await cRes.json();
        const menu = await mRes.json();
        const upcomingOrders = await oRes.json();

        setStats({
          totalCustomers: customers.length,
          totalMenu: menu.length,
          totalOrders: upcomingOrders.length
        });

        // Parse and sort sub-events mathematically across all orders
        let flatEvents = [];
        upcomingOrders.forEach(order => {
           if (order.subEvents) {
              order.subEvents.forEach(ev => {
                 flatEvents.push({
                    ...ev,
                    orderId: order._id,
                    customerName: order.customer?.name || 'Unknown Client'
                 });
              });
           }
        });

        // Filter and sort for the immediate chronological future
        const now = new Date();
        const filteredEvents = flatEvents
           .filter(e => new Date(e.date) >= now)
           .sort((a, b) => new Date(a.date) - new Date(b.date))
           .slice(0, 3); // Grab strictly the top 3

        setNextEvents(filteredEvents);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (error) return <div className="p-8 text-red-600"><AlertCircle className="w-6 h-6 inline mr-2"/> {error}</div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto overflow-y-auto h-full pb-20 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {user?.name || 'Admin'}</h1>
        <p className="text-slate-500 font-medium mt-1">Here is your logistical snapshot for the day.</p>
      </div>

      {/* Top Level Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
         <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition duration-500">
               <CalendarDays className="w-32 h-32 text-blue-600" />
            </div>
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 z-10">
               <CalendarDays className="w-7 h-7" />
            </div>
            <div className="z-10">
               <p className="text-3xl font-black text-slate-800">{stats.totalOrders}</p>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Upcoming Bookings</p>
            </div>
         </div>

         <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition duration-500">
               <Contact2 className="w-32 h-32 text-emerald-600" />
            </div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 z-10">
               <Users className="w-7 h-7" />
            </div>
            <div className="z-10">
               <p className="text-3xl font-black text-slate-800">{stats.totalCustomers}</p>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Active Clients</p>
            </div>
         </div>

         <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition duration-500">
               <Utensils className="w-32 h-32 text-rose-600" />
            </div>
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center flex-shrink-0 z-10">
               <ChefHat className="w-7 h-7" />
            </div>
            <div className="z-10">
               <p className="text-3xl font-black text-slate-800">{stats.totalMenu}</p>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Menu Iterations</p>
            </div>
         </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* Next Up Timeline Feed */}
         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                 <Clock className="w-5 h-5 text-amber-500" /> Next Up Timeline
              </h2>
              <button onClick={() => navigate('/orders')} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group">
                 View Calendar <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </button>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
               {nextEvents.length === 0 ? (
                  <p className="text-slate-500 italic text-center py-8">There are no upcoming immediate events.</p>
               ) : (
                  nextEvents.map((ev, i) => (
                    <div key={i} onClick={() => navigate(`/orders/${ev.orderId}`)} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active hover:cursor-pointer">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition group-hover:bg-blue-600 group-hover:text-white">
                         <CalendarDays className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition group-hover:scale-[1.02] group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-blue-200">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900">{ev.eventName}</div>
                          <time className="text-xs font-bold text-slate-400">{new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</time>
                        </div>
                        <div className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-widest">{ev.customerName}</div>
                        <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-500" /> <span className="truncate">{ev.location}</span></div>
                        <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1"><Users className="w-3.5 h-3.5 text-emerald-500" /> {ev.guestCount} Headcount</div>
                      </div>
                    </div>
                  ))
               )}
            </div>
         </div>

         {/* Quick Actions Router Console */}
         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mb-6">
               <PlusCircle className="w-5 h-5 text-indigo-500" /> Command Bridge
            </h2>
            <div className="grid gap-4">
               
               <button onClick={() => navigate('/orders/new')} className="p-4 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-white rounded-2xl transition-all shadow-sm flex items-start gap-4 text-left group">
                  <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl group-hover:scale-110 transition shrink-0">
                     <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">Book a New Event</h3>
                     <p className="text-sm text-slate-500 mt-1">Spin up a new client reservation locally and allocate menus dynamically.</p>
                  </div>
               </button>

               <button onClick={() => navigate('/customers')} className="p-4 border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-white rounded-2xl transition-all shadow-sm flex items-start gap-4 text-left group">
                  <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl group-hover:scale-110 transition shrink-0">
                     <Contact2 className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition">Client Database</h3>
                     <p className="text-sm text-slate-500 mt-1">Manage physical CRM associations including localized imagery tracking.</p>
                  </div>
               </button>

               <button onClick={() => navigate('/menu-settings')} className="p-4 border border-slate-200 hover:border-rose-400 bg-slate-50 hover:bg-white rounded-2xl transition-all shadow-sm flex items-start gap-4 text-left group">
                  <div className="bg-rose-100 text-rose-600 p-3 rounded-xl group-hover:scale-110 transition shrink-0">
                     <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition">Menu Blueprints</h3>
                     <p className="text-sm text-slate-500 mt-1">Configure structural items and bucket sub-categories across layouts.</p>
                  </div>
               </button>

            </div>
         </div>

      </div>

    </div>
  );
};

export default Dashboard;
