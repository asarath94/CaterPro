import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Users, UserPlus, ClipboardList, LogOut, ListChecks, UserCircle, Menu, X } from 'lucide-react';

const Layout = () => {
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Overview', icon: <CalendarDays className="w-5 h-5" /> },
    { to: '/calendar', label: 'Calendar', icon: <CalendarDays className="w-5 h-5" /> },
    { to: '/orders', label: 'Orders', icon: <ClipboardList className="w-5 h-5" /> },
    { to: '/customers', label: 'Existing Customers', icon: <Users className="w-5 h-5" /> },
    { to: '/create-customer', label: 'Create Customer', icon: <UserPlus className="w-5 h-5" /> },
    { to: '/menu-settings', label: 'Menu Settings', icon: <ListChecks className="w-5 h-5" /> },
  ];

  return (
    <div className="flex relative h-screen bg-slate-50 overflow-hidden w-full flex-col md:flex-row">
      
      {/* Mobile Pinned Top Navigation */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-6 py-4 z-40 shadow-lg">
         <h1 className="text-xl font-bold tracking-tight text-white">CaterPro <span className="text-blue-500">.</span></h1>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Mobile Drawer Overlay Background */}
      {isMobileMenuOpen && (
        <div 
           className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity" 
           onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sliding Sidebar Core */}
      <aside className={`fixed inset-y-0 left-0 w-72 md:w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">CaterPro</h1>
            <p className="text-sm text-slate-400 mt-1">Management Dashboard</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              onClick={() => setIsMobileMenuOpen(false)}
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1 shrink-0">
          <NavLink
            onClick={() => setIsMobileMenuOpen(false)}
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <UserCircle className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Dynamic Main Workspace Context */}
      <main className="flex-1 overflow-y-auto w-full relative bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
