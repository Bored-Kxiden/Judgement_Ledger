import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import SubmitPage from './pages/SubmitPage'
import EscalationPage from './pages/EscalationPage'
import PolicyReviewPage from './pages/PolicyReviewPage'

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<SubmitPage />} />
          <Route path="/escalation" element={<EscalationPage />} />
          <Route path="/policy-review" element={<PolicyReviewPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}
