import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Users, UserPlus, ClipboardList, LogOut, ListChecks, UserCircle } from 'lucide-react';

const Layout = () => {
  const { logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Overview', icon: <CalendarDays className="w-5 h-5" /> },
    { to: '/calendar', label: 'Calendar', icon: <CalendarDays className="w-5 h-5" /> },
    { to: '/orders', label: 'Orders', icon: <ClipboardList className="w-5 h-5" /> },
    { to: '/customers', label: 'Existing Customers', icon: <Users className="w-5 h-5" /> },
    { to: '/create-customer', label: 'Create Customer', icon: <UserPlus className="w-5 h-5" /> },
    { to: '/menu-settings', label: 'Menu Settings', icon: <ListChecks className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-white">CaterPro</h1>
          <p className="text-sm text-slate-400 mt-1">Management Dashboard</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
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

        <div className="p-4 border-t border-slate-800 space-y-1">
          <NavLink
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
