import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Pools from './pages/Pools';
import PoolDetail from './pages/PoolDetail';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import PaymentSuccess from './pages/PaymentSuccess';
import DonatePage from './pages/DonatePage';
import CampaignDetail from './pages/CampaignDetail';
import SubmitCampaign from './pages/SubmitCampaign';
import CommunityPage from './pages/CommunityPage';
import EditCampaign from './pages/EditCampaignPage';
import Startups from './pages/Startups';
import StartupDetail from './pages/StartupDetail';
import StartupSubmit from './pages/StartupSubmit';
// ADD import
import Notifications from './pages/Notifications';
import CreatePool from './pages/CreatePool';




// Inside your routes:



export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="pt-5 min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pools" element={<Pools />} />
            <Route path="/pools/:id" element={<PoolDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/donate/:id" element={<CampaignDetail />} />
            <Route path="/donate/submit" element={<SubmitCampaign />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/donate/edit/:id" element={<EditCampaign />} />
            <Route path="/startups" element={<Startups />} />
            <Route path="/startups/:id" element={<StartupDetail />} />
            <Route path="/startups/submit" element={<StartupSubmit />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin/create-pool" element={<CreatePool />} />
           
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
