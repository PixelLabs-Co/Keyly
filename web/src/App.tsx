import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Placeholder from './pages/Placeholder'
import Homes from './pages/Homes'
import NewHome from './pages/NewHome'
import HomeDetails from './pages/HomeDetails'
import Brand from './pages/Brand'
import SignIn from './pages/SignIn'
import RequireAgent from './components/RequireAgent'

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route element={<RequireAgent />}>
      <Route element={<AppShell />}>
        <Route path="/homes" element={<Homes />} />
        <Route path="/homes/new" element={<NewHome />} />
        <Route path="/homes/:id" element={<HomeDetails />} />
        <Route path="/homes/:id/edit" element={<NewHome />} />
        <Route path="/homes/:id/send" element={<Placeholder title="Preview & send" note="Built in step 6." />} />
        <Route path="/vendors" element={<Placeholder title="My vendors" note="Built in step 5." />} />
        <Route path="/brand" element={<Brand />} />
        <Route path="/account" element={<Placeholder title="Account & plan" note="Built in step 7." />} />
      </Route>
      </Route>
      <Route path="*" element={<Navigate to="/homes" replace />} />
    </Routes>
  )
}
