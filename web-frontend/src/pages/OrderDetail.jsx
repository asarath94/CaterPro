import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, ArrowLeft, Download, Calendar, MapPin, Users, Printer, FileText, Trash2, Edit } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import API_BASE from '../config/api';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Catering_Manifest_${order?.customer?.name.replace(/\s+/g, '_')}_${order?._id.slice(-6)}`,
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [orderRes, profileRes] = await Promise.all([
          fetch(`${API_BASE}/api/orders/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        if (!orderRes.ok) throw new Error('Order not found');
        const orderData = await orderRes.json();
        const profileData = profileRes.ok ? await profileRes.json() : {};
        setOrder(orderData);
        setBusiness(profileData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, token]);

  const handleDeleteOrder = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this Event Order?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete order.');
      navigate('/orders');
    } catch (err) {
      alert(err.message);
    }
  };

  // Use React-to-Print over html2pdf

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (error) return <div className="p-8 text-red-600"><AlertCircle className="w-6 h-6 inline mr-2"/> {error}</div>;
  if (!order) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full pb-20">
      {/* Utility Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => navigate(`/orders/${id}/edit`)}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition flex items-center gap-2 shadow-sm"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button 
            onClick={handleDeleteOrder}
            className="px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition flex items-center gap-2 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button 
            onClick={() => handlePrint()}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export Manifest PDF
          </button>
        </div>
      </div>

      {/* Visible Dashboard UI */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <FileText className="w-40 h-40" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
           {/* Client Summary */}
           <div className="w-full md:w-1/3 border-r border-slate-100 pr-0 md:pr-8">
               <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Client Details</h2>
               <div className="flex items-center gap-4 mb-4">
                 <img src={order.customer.photoURL || 'https://via.placeholder.com/150'} alt="Avatar" className="w-16 h-16 rounded-full object-cover bg-slate-100 border border-slate-200" crossOrigin="anonymous" />
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">{order.customer.name}</h3>
                    <p className="text-sm text-slate-500">{order.customer.phone}</p>
                 </div>
               </div>
               <div className="bg-slate-50 rounded-xl p-4 mt-6">
                 <p className="text-sm font-semibold text-slate-700">Status</p>
                 <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-extrabold uppercase tracking-widest rounded-md">
                   {order.status}
                 </span>
               </div>
               {order.notes && (
                 <div className="mt-4">
                   <p className="text-sm font-semibold text-slate-700 mb-1">Internal Notes</p>
                   <p className="text-sm text-slate-600 italic">"{order.notes}"</p>
                 </div>
               )}
           </div>

           {/* Event Overview */}
           <div className="w-full md:w-2/3">
               <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Itinerary Overview</h2>
               <div className="grid gap-4">
                 {order.subEvents.map((ev, i) => (
                   <div key={ev._id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold">
                             {i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> {new Date(ev.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-500"/> {ev.location}</p>
                          </div>
                       </div>
                       <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-black text-slate-800">{ev.guestCount}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase">Guests</p>
                       </div>
                     </div>

                     {/* Dashboard Menu Display */}
                     {ev.selectedMenuItems && ev.selectedMenuItems.length > 0 && (
                       <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Selected Menu</p>
                          <div className="flex flex-wrap gap-2">
                            {ev.selectedMenuItems.map(item => (
                              <span key={item._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm">
                                 <div className={`w-1.5 h-1.5 rounded-full ${item.category === 'Veg' ? 'bg-green-500' : 'bg-rose-500'}`}></div>
                                 {item.itemName} <span className="text-slate-400 font-normal">({item.subCategory})</span>
                              </span>
                            ))}
                          </div>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
           </div>
        </div>
      </div>

      {/* HIDDEN RENDER TARGET — react-to-print */}
      <div className="overflow-hidden h-0 w-0 absolute -left-[9999px]">
        <div ref={contentRef} className="font-sans w-[800px] bg-white text-black">

          {/* ══ BRANDED HEADER ══ */}
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
            {/* Left: Logo + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {business?.businessLogo ? (
                <img src={business.businessLogo} alt="logo" style={{ height: '72px', width: '72px', objectFit: 'contain', background: 'white', borderRadius: '12px', padding: '6px' }} />
              ) : (
                <div style={{ height: '72px', width: '72px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Printer style={{ width: '36px', height: '36px', color: 'rgba(255,255,255,0.5)' }} />
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', margin: 0, textTransform: 'uppercase' }}>
                  {business?.businessName || 'Booking Manifest'}
                </h1>
                {business?.proprietorName && (
                  <p style={{ fontSize: '13px', color: 'rgba(199,210,254,1)', fontWeight: '600', margin: '4px 0 0 0' }}>{business.proprietorName}</p>
                )}
              </div>
            </div>

            {/* Right: Contact */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {business?.phones?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px', marginBottom: '6px', justifyItems: 'end' }}>
                  {business.phones.map((ph, i) => (
                    <p key={i} style={{ fontSize: '12px', color: 'rgba(199,210,254,1)', margin: 0, fontWeight: '500' }}>📞 {ph}</p>
                  ))}
                </div>
              )}
              {business?.contactEmails?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  {business.contactEmails.map((em, i) => (
                    <p key={i} style={{ fontSize: '12px', color: 'rgba(199,210,254,1)', margin: '2px 0 0 0', fontWeight: '500' }}>✉ {em}</p>
                  ))}
                </div>
              )}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '6px', marginTop: '4px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(165,180,252,0.8)', margin: 0 }}>Generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* ══ AMBER ACCENT STRIPE ══ */}
          <div style={{ height: '5px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)' }} />

          <div style={{ padding: '32px 36px' }}>

            {/* ══ CUSTOMER CARD ══ */}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              {order.customer.photoURL ? (
                <img src={order.customer.photoURL} alt={order.customer.name} crossOrigin="anonymous" style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', border: '3px solid white', boxShadow: '0 2px 8px rgba(59,130,246,0.2)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: '28px', fontWeight: '900' }}>{order.customer.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', fontWeight: '800', color: '#3b82f6', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Prepared For</p>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1e3a8a', margin: '0 0 6px 0' }}>{order.customer.name}</h2>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {order.customer.phone && <p style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: '600', margin: 0 }}>📞 {order.customer.phone}</p>}
                  {order.customer.location && <p style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: '600', margin: 0 }}>📍 {order.customer.location}</p>}
                </div>
              </div>
              {/* Status badge */}
              <div style={{ background: '#1e3a8a', color: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
                {order.status}
              </div>
            </div>

            {/* ══ EVENT BLOCKS ══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {order.subEvents.map((ev, i) => {
                const grouped = (ev.selectedMenuItems || []).reduce((acc, item) => {
                  const mainCat = item.category === 'Veg' ? 'veg' : 'nonVeg';
                  const subCat = item.subCategory || 'Other';
                  if (!acc[mainCat][subCat]) acc[mainCat][subCat] = [];
                  acc[mainCat][subCat].push(item);
                  return acc;
                }, { veg: {}, nonVeg: {} });

                return (
                  <div key={ev._id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', breakInside: 'avoid' }}>
                    {/* Event Header Banner */}
                    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Event {i + 1}</p>
                        <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>{ev.eventName}</h2>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: '500' }}>
                          {new Date(ev.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;•&nbsp; {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ background: '#f59e0b', color: '#1c1917', borderRadius: '8px', padding: '6px 14px', fontSize: '14px', fontWeight: '900', display: 'inline-block' }}>
                          {ev.guestCount} Guests
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}>📍 {ev.location}</p>
                      </div>
                    </div>

                    {/* Menu Items Section */}
                    <div style={{ padding: '20px 24px', background: '#fafafa' }}>
                      {ev.selectedMenuItems && ev.selectedMenuItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                          {/* Veg Section */}
                          {Object.keys(grouped.veg).length > 0 && (
                            <div>
                              <div style={{ background: 'linear-gradient(90deg, #dcfce7, #f0fdf4)', border: '1px solid #86efac', borderRadius: '10px', padding: '8px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', letterSpacing: '1px', textTransform: 'uppercase' }}>Vegetarian</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                                {Object.keys(grouped.veg).map(subCat => (
                                  <div key={subCat}>
                                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px 0' }}>{subCat}</p>
                                    {grouped.veg[subCat].map(item => (
                                      <p key={item._id} style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500', margin: '0 0 4px 0', borderBottom: '1px dashed #d1fae5', paddingBottom: '3px' }}>• {item.itemName}</p>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Non-Veg Section */}
                          {Object.keys(grouped.nonVeg).length > 0 && (
                            <div>
                              <div style={{ background: 'linear-gradient(90deg, #fee2e2, #fff1f2)', border: '1px solid #fca5a5', borderRadius: '10px', padding: '8px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#b91c1c', letterSpacing: '1px', textTransform: 'uppercase' }}>Non-Vegetarian</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                                {Object.keys(grouped.nonVeg).map(subCat => (
                                  <div key={subCat}>
                                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px 0' }}>{subCat}</p>
                                    {grouped.nonVeg[subCat].map(item => (
                                      <p key={item._id} style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500', margin: '0 0 4px 0', borderBottom: '1px dashed #fee2e2', paddingBottom: '3px' }}>• {item.itemName}</p>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      ) : (
                        <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No menu items allocated for this event.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ══ FOOTER ══ */}
            <div style={{ marginTop: '36px', paddingTop: '16px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                {business?.businessName || 'Catering Manager'} &nbsp;•&nbsp; Official Booking Manifest
              </p>
              <div style={{ height: '4px', width: '80px', background: 'linear-gradient(90deg, #6366f1, #f59e0b)', borderRadius: '999px' }} />
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Thank you for choosing us!</p>
            </div>

          </div>
        </div>
      </div>

    
    </div>
  );
};

export default OrderDetail;
