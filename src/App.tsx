import { Navigate, Route, Routes } from 'react-router-dom';
import Tracker from './pages/Tracker';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Tracker />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
