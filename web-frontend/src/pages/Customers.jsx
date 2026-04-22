import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Phone, Mail, MapPin, Loader2, AlertCircle, Search, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE from '../config/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch customers');
        const data = await res.json();
        setCustomers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
    fetchCustomers();
  }, [token]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [customers, searchQuery]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="w-full md:w-auto">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Customer Directory</h1>
          <p className="text-slate-500 font-medium mb-4">Manage your catering clients.</p>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all text-slate-900 font-medium"
              placeholder="Search customers by name..."
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <button 
          onClick={() => navigate('/create-customer')}
          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 shadow-lg shadow-blue-600/20 whitespace-nowrap flex-shrink-0 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Customer
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center text-slate-400 py-20 border-2 border-dashed border-slate-200 rounded-2xl">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium text-slate-500">{searchQuery ? 'No customers match your search.' : 'No customers found.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredCustomers.map((customer, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={customer._id}
              onClick={() => navigate(`/customers/${customer._id}`)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="aspect-video w-full bg-slate-100 relative">
                {customer.photoURL ? (
                  <img src={customer.photoURL} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                    <Users className="w-12 h-12 opacity-50" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <h3 className="absolute bottom-4 left-4 right-4 text-white font-bold text-lg truncate drop-shadow-md">
                  {customer.name}
                </h3>
              </div>
              
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.location && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="truncate">{customer.location}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
