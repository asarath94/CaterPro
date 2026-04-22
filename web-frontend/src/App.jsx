import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import CalendarView from './pages/CalendarView';
import CreateCustomer from './pages/CreateCustomer';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CreateOrder from './pages/CreateOrder';
import OrderDetail from './pages/OrderDetail';
import MenuSettings from './pages/MenuSettings';
import Profile from './pages/Profile';


function App() {
  return (
    <Router>
      <AuthProvider>
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
      </AuthProvider>
    </Router>
  );
}

export default App;
