import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import DashboardPage from './pages/admin/DashboardPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import StagingPage from './pages/admin/StagingPage'
import UnidadesPage from './pages/admin/UnidadesPage'
import MedicosPage from './pages/admin/MedicosPage'
import EspecialidadesPage from './pages/admin/EspecialidadesPage'
import EspecialidadesNormalizacaoPage from './pages/admin/EspecialidadesNormalizacaoPage'
import IconesPage from './pages/admin/IconesPage'
import BairrosPage from './pages/admin/BairrosPage'
import OfertasEnsinoPage from './pages/admin/OfertasEnsinoPage'
import CategoriasPage from './pages/admin/CategoriasPage'
import UsersPage from './pages/admin/UsersPage'
import AuditPage from './pages/admin/AuditPage'
import ETLPage from './pages/admin/ETLPage'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<MapPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="staging" element={<StagingPage />} />
          <Route path="unidades" element={<UnidadesPage />} />
          <Route path="medicos" element={<MedicosPage />} />
          <Route path="especialidades" element={<EspecialidadesPage />} />
          <Route path="especialidades-normalizacao" element={<EspecialidadesNormalizacaoPage />} />
          <Route path="icones" element={<IconesPage />} />
          <Route path="bairros" element={<BairrosPage />} />
          <Route path="ofertas-ensino" element={<OfertasEnsinoPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="users" element={<SuperadminRoute><UsersPage /></SuperadminRoute>} />
          <Route path="audit" element={<SuperadminRoute><AuditPage /></SuperadminRoute>} />
          <Route path="etl" element={<SuperadminRoute><ETLPage /></SuperadminRoute>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Superadmin Only Route
function SuperadminRoute({ children }) {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role !== 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />
  }
  
  return children
}

export default App
