import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Mail, MapPin, Loader2, AlertCircle, Calendar, ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { fetcherWithToken, apiUrl } from '../config/fetcher';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const { data: customer, error: customerError, isLoading: customerLoading } = useSWR(
    token ? [apiUrl(`/api/customers/${id}`), token] : null,
    fetcherWithToken
  );

  const { data: orders = [], error: ordersError, isLoading: ordersLoading } = useSWR(
    token ? [apiUrl(`/api/orders?customerId=${id}`), token] : null,
    fetcherWithToken
  );

  const isLoading = customerLoading || ordersLoading;
  const error = customerError || ordersError;


  const handleDelete = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this customer?')) return;
    try {
      const res = await fetch(apiUrl(`/api/customers/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete customer.');
      navigate('/customers');
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  
  if (error) return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" /> {error.message}
      </div>
      <button onClick={() => navigate('/customers')} className="mt-4 flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -z-10 mix-blend-multiply opacity-50"></div>
        
        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-slate-100">
          {customer.photoURL ? (
            <img src={customer.photoURL} alt={customer.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex justify-center items-center text-4xl text-slate-400 font-bold bg-slate-200">
              {customer.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{customer.name}</h1>
          <div className="flex flex-col gap-3 text-slate-600 font-medium">
            <p className="flex items-center justify-center md:justify-start gap-2"><Phone className="w-5 h-5 text-blue-500"/> {customer.phone}</p>
            {customer.email && <p className="flex items-center justify-center md:justify-start gap-2"><Mail className="w-5 h-5 text-amber-500"/> {customer.email}</p>}
            {customer.location && <p className="flex items-center justify-center md:justify-start gap-2"><MapPin className="w-5 h-5 text-red-500"/> {customer.location}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0 md:self-stretch md:my-auto justify-center">
            <button 
              onClick={() => navigate(`/orders/new?customer=${customer._id}`)}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Book New Event
            </button>
            <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => navigate('/customers/new', { state: { editCustomer: customer } })}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition flex items-center justify-center cursor-pointer"
                  title="Delete Customer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

      {/* Linked Event Orders */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Event History</h2>
        
        {orders.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 text-center">
            <p className="text-slate-500 font-medium text-lg mb-2">No events booked yet.</p>
            <p className="text-slate-400 text-sm">When you book an event for {customer.name}, it will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:shadow-md transition-all gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-800">Order #{order._id.substring(order._id.length - 6)}</h3>
                    <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600">
                      {order.status}
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-slate-500 text-sm">
                    <Calendar className="w-4 h-4 text-blue-500"/> 
                    {order.subEvents?.length || 0} Scheduled Event(s)
                  </p>
                </div>
                <div className="text-right w-full md:w-auto">
                    <p className="text-sm font-semibold text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
