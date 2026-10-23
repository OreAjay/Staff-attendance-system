import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ClockInOut from './pages/ClockInOut'
import StaffRegistration from './pages/StaffRegistration'
import StaffRecords from './pages/StaffRecords'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clock" element={<ClockInOut />} />
        <Route path="register" element={<StaffRegistration />} />
        <Route path="records" element={<StaffRecords />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}