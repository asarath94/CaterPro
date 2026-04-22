import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Calendar, MapPin, Users, ClipboardList } from 'lucide-react';
import clsx from 'clsx';
import API_BASE from '../config/api';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = async (filter) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/orders?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto overflow-y-auto relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Event Orders</h1>
          <p className="text-slate-500 font-medium tracking-wide">Manage upcoming and past catering events.</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" /> Book New Event
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="bg-slate-200/50 p-1 rounded-xl flex items-center mb-8 max-w-sm relative">
        {['upcoming', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "relative flex-1 py-2.5 text-sm font-semibold capitalize rounded-lg transition-colors z-10",
              activeTab === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900">Oops, something went wrong.</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => fetchOrders(activeTab)}
              className="mt-4 px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500">No {activeTab} orders found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {orders.map((order) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={clsx(
                      "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full",
                      order.status === 'Confirmed' ? "bg-green-100 text-green-700" :
                      order.status === 'Pending' ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {order.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">#{order._id.substring(order._id.length - 6)}</span>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      {order.customer?.name || "Unknown Customer"}
                    </h2>
                    <p className="text-slate-500 text-sm flex items-center gap-1.5 object-cover">
                      {order.customer?.email}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {order.subEvents?.map((event, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="font-bold text-slate-800 text-sm mb-3 border-b border-slate-200 pb-2">{event.eventName}</p>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-slate-600 gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 gap-2">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 gap-2">
                            <Users className="w-4 h-4 text-emerald-500" />
                            <span>{event.guestCount} Guests</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
