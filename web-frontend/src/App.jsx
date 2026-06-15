import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const CreateCustomer = lazy(() => import('./pages/CreateCustomer'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const CreateOrder = lazy(() => import('./pages/CreateOrder'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const MenuSettings = lazy(() => import('./pages/MenuSettings'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes wrapped in Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/new" element={<CreateOrder />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/orders/:id/edit" element={<CreateOrder />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/new" element={<CreateCustomer />} />
              <Route path="/menu-settings" element={<MenuSettings />} />
              <Route path="/create-customer" element={<CreateCustomer />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
