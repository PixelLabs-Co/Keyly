import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<Placeholder title="Sign in" note="Built in step 2." />} />
      <Route element={<AppShell />}>
        <Route path="/homes" element={<Placeholder title="Homes" note="Built in step 4." />} />
        <Route path="/homes/new" element={<Placeholder title="New home" note="Built in step 4." />} />
        <Route path="/homes/:id" element={<Placeholder title="Home details" note="Built in step 4." />} />
        <Route path="/homes/:id/send" element={<Placeholder title="Preview & send" note="Built in step 6." />} />
        <Route path="/vendors" element={<Placeholder title="My vendors" note="Built in step 5." />} />
        <Route path="/brand" element={<Placeholder title="Brand" note="Built in step 3." />} />
        <Route path="/account" element={<Placeholder title="Account & plan" note="Built in step 7." />} />
      </Route>
      <Route path="*" element={<Navigate to="/homes" replace />} />
    </Routes>
  )
}
