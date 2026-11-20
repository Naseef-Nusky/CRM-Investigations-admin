import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Calls from './pages/Calls'
import Enquiries from './pages/Enquiries'
import Services from './pages/Services'
import Quotations from './pages/Quotations'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import Investigators from './pages/Investigators'
import Finance from './pages/Finance'
import Emails from './pages/Emails'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="calls" element={<Calls />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="services" element={<Services />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="cases" element={<Cases />} />
            <Route path="cases/:id" element={<CaseDetail />} />
            <Route path="investigators" element={<Investigators />} />
            <Route path="finance" element={<Finance />} />
            <Route path="emails" element={<Emails />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
