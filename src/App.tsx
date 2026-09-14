import { Routes, Route } from 'react-router-dom';
import AccessGate from './pages/AccessGate';
import Punchcard from './pages/Punchcard';
import MarshalDashboard from './pages/MarshalDashboard';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AccessGate />} />
      <Route path="/c/:code" element={<Punchcard />} />
      <Route path="/marshal" element={<MarshalDashboard />} />
      <Route path="*" element={<AccessGate />} />
    </Routes>
  );
}
