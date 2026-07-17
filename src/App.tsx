import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Budget from './pages/Budget'
import Contacts from './pages/Contacts'
import Dashboard from './pages/Dashboard'
import Purchases from './pages/Purchases'
import Settings from './pages/Settings'
import Tasks from './pages/Tasks'
import Timeline from './pages/Timeline'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
