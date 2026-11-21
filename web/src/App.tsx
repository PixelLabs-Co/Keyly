import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Homes from './pages/Homes'
import NewHome from './pages/NewHome'
import HomeDetails from './pages/HomeDetails'
import Vendors from './pages/Vendors'
import Send from './pages/Send'
import Gift from './pages/Gift'
import Account from './pages/Account'
import Brand from './pages/Brand'
import SignIn from './pages/SignIn'
import RequireAgent from './components/RequireAgent'

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/gift/:token" element={<Gift />} />
      <Route element={<RequireAgent />}>
      <Route element={<AppShell />}>
        <Route path="/homes" element={<Homes />} />
        <Route path="/homes/new" element={<NewHome />} />
        <Route path="/homes/:id" element={<HomeDetails />} />
        <Route path="/homes/:id/edit" element={<NewHome />} />
        <Route path="/homes/:id/send" element={<Send />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/brand" element={<Brand />} />
        <Route path="/account" element={<Account />} />
      </Route>
      </Route>
      <Route path="*" element={<Navigate to="/homes" replace />} />
    </Routes>
  )
}
