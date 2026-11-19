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
import Placeholder from './pages/Placeholder'

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
            <Route path="cases" element={<Placeholder title="Investigation cases" phase="6" />} />
            <Route
              path="investigators"
              element={<Placeholder title="Investigator management" phase="6–7" />}
            />
            <Route path="finance" element={<Placeholder title="Finance & invoicing" phase="3" />} />
            <Route path="settings" element={<Placeholder title="System settings" phase="1+" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
