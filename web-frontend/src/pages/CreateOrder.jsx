import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Calendar, MapPin, Users, Loader2, AlertCircle, ArrowRight, Save, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateOrder = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preSelectedCustomerId = searchParams.get('customer');

  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [customers, setCustomers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState(preSelectedCustomerId || '');
  const [notes, setNotes] = useState('');
  const [subEvents, setSubEvents] = useState([
    { id: Date.now().toString(), eventName: '', date: '', location: '', guestCount: '', selectedMenuItems: [] }
  ]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          fetch('/api/customers', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/menu', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (!cRes.ok || !mRes.ok) throw new Error('Failed to fetch required database constraints.');
        
        const cData = await cRes.json();
        const mData = await mRes.json();
        
        setCustomers(cData);
        setMenuItems(mData);

        // HIJACK FOR EDIT MODE
        if (id) {
          const oRes = await fetch(`/api/orders/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (!oRes.ok) throw new Error('Failed to fetch order details for editing.');
          const orderData = await oRes.json();
          
          setSelectedCustomer(orderData.customer._id || orderData.customer);
          setNotes(orderData.notes || '');

          // Normalize subEvents & properly format ISO date to datetime-local string
          const mappedEvents = orderData.subEvents.map(ev => {
             const localDate = new Date(ev.date);
             const tzOffset = localDate.getTimezoneOffset() * 60000;
             const localISOTime = new Date(localDate - tzOffset).toISOString().slice(0, 16);

             return {
                id: ev._id || Date.now().toString() + Math.random(),
                eventName: ev.eventName,
                date: localISOTime,
                location: ev.location,
                guestCount: ev.guestCount.toString(),
                selectedMenuItems: ev.selectedMenuItems.map(m => m._id || m)
             }
          });
          setSubEvents(mappedEvents);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [token, id]);

  // Deep State Management for SubEvents
  const addSubEvent = () => {
    setSubEvents([
      ...subEvents, 
      { id: Date.now().toString(), eventName: '', date: '', location: '', guestCount: '', selectedMenuItems: [] }
    ]);
  };

  const removeSubEvent = (id) => {
    if (subEvents.length === 1) return; // Prevent removing last event
    setSubEvents(subEvents.filter(ev => ev.id !== id));
  };

  const handleSubEventChange = (id, field, value) => {
    setSubEvents(currentEvents => 
      currentEvents.map(ev => ev.id === id ? { ...ev, [field]: value } : ev)
    );
  };

  const toggleMenuItem = (eventId, itemId) => {
    setSubEvents(currentEvents => 
      currentEvents.map(ev => {
        if (ev.id !== eventId) return ev;
        
        const isSelected = ev.selectedMenuItems.includes(itemId);
        // functional deep clone state update
        const updatedMenu = isSelected 
          ? ev.selectedMenuItems.filter(i => i !== itemId)
          : [...ev.selectedMenuItems, itemId];
          
        return { ...ev, selectedMenuItems: updatedMenu };
      })
    );
  };

  // Group Menu items cleanly
  const renderCategorizedMenu = (eventId, currentSelections) => {
    // Separate by Veg/Non-Veg
    const vegItems = menuItems.filter(m => m.category === 'Veg');
    const nonVegItems = menuItems.filter(m => m.category === 'Non-Veg');

    const renderList = (items, typeColor) => {
      // Group by subcategory
      const grouped = items.reduce((acc, obj) => {
        const key = obj.subCategory || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(obj);
        return acc;
      }, {});

      return Object.keys(grouped).map(subCat => (
        <div key={subCat} className="mb-4">
          <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide border-b border-slate-100 pb-1">{subCat}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {grouped[subCat].map(item => {
              const isChecked = currentSelections.includes(item._id);
              return (
                <label key={item._id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={() => toggleMenuItem(eventId, item._id)}
                    className="w-4 h-4 text-blue-600 rounded bg-white focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${typeColor}`} />
                    <span className={`text-sm ${isChecked ? 'font-semibold text-blue-900' : 'font-medium text-slate-700'}`}>{item.itemName}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ));
    };

    return (
      <div className="mt-6 border-t border-slate-200 pt-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Utensils className="w-5 h-5 text-blue-500"/> Select Menu Items</h3>
        
        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 mb-6">
          <h3 className="text-lg font-extrabold text-green-800 mb-4">Vegetarian</h3>
          {vegItems.length > 0 ? renderList(vegItems, 'bg-green-500') : <p className="text-sm text-green-600">No veg items available.</p>}
        </div>
        
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
          <h3 className="text-lg font-extrabold text-rose-800 mb-4">Non-Vegetarian</h3>
          {nonVegItems.length > 0 ? renderList(nonVegItems, 'bg-rose-500') : <p className="text-sm text-rose-600">No non-veg items available.</p>}
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!selectedCustomer) throw new Error('Please select a customer.');
      
      // Clean subEvents payload logic specifically formatting numerical strings properly
      const formattedEvents = subEvents.map(ev => ({
        eventName: ev.eventName,
        date: ev.date,
        location: ev.location,
        guestCount: parseInt(ev.guestCount, 10),
        selectedMenuItems: ev.selectedMenuItems
      }));

      // Validate
      for (const ev of formattedEvents) {
        if (!ev.eventName || !ev.date || !ev.location || !ev.guestCount) {
          throw new Error('All sub-event fields (Name, date, location, guest count) must be filled.');
        }
      }

      const url = id ? `/api/orders/${id}` : '/api/orders';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer: selectedCustomer,
          notes,
          subEvents: formattedEvents,
          status: 'Pending' // matching Mongoose Enum constraints
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create Event Order.');
      }

      const newOrder = await res.json();
      navigate(`/orders/${newOrder._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{id ? 'Edit Event Order' : 'Book New Event'}</h1>
        <p className="text-slate-500 font-medium">{id ? 'Update logistics or menu selections.' : 'Construct a multi-day catering itinerary.'}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-24">
        
        {/* Core Customer Info */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Customer *</label>
              <select 
                required 
                value={selectedCustomer} 
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              >
                <option value="">-- Search Customer --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Overall Event Notes</label>
               <input 
                 type="text" 
                 value={notes} 
                 onChange={(e) => setNotes(e.target.value)} 
                 placeholder="e.g. Wedding Weekend / VIP Corporate"
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
            </div>
          </div>
        </div>

        {/* Dynamic Nested Sub-Events Loop */}
        <div className="space-y-6">
          <AnimatePresence>
            {subEvents.map((event, index) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                    Itinerary Block
                  </h3>
                  {subEvents.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeSubEvent(event.id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" /> Remove block
                    </button>
                  )}
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Event Name</label>
                      <input 
                        required type="text" placeholder="e.g. Sangeet"
                        value={event.eventName} 
                        onChange={(e) => handleSubEventChange(event.id, 'eventName', e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider"><Calendar className="w-4 h-4 inline mr-1"/> Date & Time</label>
                      <input 
                        required type="datetime-local" 
                        value={event.date} 
                        onChange={(e) => handleSubEventChange(event.id, 'date', e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider"><MapPin className="w-4 h-4 inline mr-1"/> Location</label>
                      <input 
                        required type="text" placeholder="e.g. Grand Hall"
                        value={event.location} 
                        onChange={(e) => handleSubEventChange(event.id, 'location', e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider"><Users className="w-4 h-4 inline mr-1"/> Headcount</label>
                      <input 
                        required type="number" min="1" placeholder="0"
                        value={event.guestCount} 
                        onChange={(e) => handleSubEventChange(event.id, 'guestCount', e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Complex Menu Nested Module */}
                  {renderCategorizedMenu(event.id, event.selectedMenuItems)}
                  
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button 
          type="button" 
          onClick={addSubEvent}
          className="w-full py-4 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Another Itinerary Block
        </button>

        {/* Floating Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 px-4 sm:px-8 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <p className="text-slate-500 font-medium hidden sm:block">Double check all event dates before submitting.</p>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {id ? 'Save Edits' : 'Confirm Order Booking'} <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateOrder;
