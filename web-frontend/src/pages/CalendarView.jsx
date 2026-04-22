import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { format } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MapPin, Loader2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';

const localizer = momentLocalizer(moment);

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const res = await fetch('/api/calendar', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch calendar');
        const data = await res.json();
        
        const formattedEvents = data.map(item => ({
          ...item,
          start: new Date(item.start),
          end: new Date(item.end)
        }));
        
        setEvents(formattedEvents);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalendarEvents();
  }, [token]);

  const handleSelectSlot = (slotInfo) => {
    const clickedDate = new Date(slotInfo.start);
    // Normalize clicked date for comparison
    clickedDate.setHours(0,0,0,0);
    
    // Find all events that fall on this day
    const matchingEvents = events.filter(e => {
      const eventDate = new Date(e.start);
      eventDate.setHours(0,0,0,0);
      return eventDate.getTime() === clickedDate.getTime();
    });
    
    setSelectedDate(clickedDate);
    setDayEvents(matchingEvents);
  };

  return (
    <div className="p-8 h-full flex flex-col relative overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Event Calendar</h1>
        <p className="text-slate-500 font-medium mb-6">Click on a specific date to view its scheduled events.</p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative z-0">
        {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
             </div>
        ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'week', 'day']}
              date={currentDate}
              view={currentView}
              onNavigate={(newDate) => setCurrentDate(newDate)}
              onView={(newView) => setCurrentView(newView)}
              selectable
              onSelectEvent={(event) => handleSelectSlot({ start: event.start })}
              onSelectSlot={handleSelectSlot}
              className="font-sans"
              style={{ height: '100%' }}
            />
        )}
      </div>

      {/* Sliding Side Panel overlay */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm flex justify-end"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {format(selectedDate, 'EEEE, MMMM do')}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{dayEvents.length} events scheduled</p>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {dayEvents.length === 0 ? (
                  <div className="text-center text-slate-400 py-10">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No events scheduled for this day.</p>
                  </div>
                ) : (
                  dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      onClick={() => navigate(`/orders/${event.orderId}`)}
                      className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all bg-white group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{event.customerName}</h3>
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-3">{event.title.split(' - ')[1]}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.location}</div>
                        <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {event.guestCount} Guests</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
