import { Navigate, Route, Routes } from 'react-router-dom';
import Tracker from './pages/Tracker';
import TailorResume from './pages/TailorResume';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Tracker />} />
      <Route path="/tailor-resume" element={<TailorResume />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
