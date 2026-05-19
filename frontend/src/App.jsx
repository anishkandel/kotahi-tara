import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Pools from './pages/Pools';
import PoolDetail from './pages/PoolDetail';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import PaymentSuccess from './pages/PaymentSuccess';



export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="pt-20 min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pools" element={<Pools />} />
            <Route path="/pools/:id" element={<PoolDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}