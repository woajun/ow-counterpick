import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { CounterPage } from './pages/CounterPage';
import { MatrixPage } from './pages/MatrixPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CounterPage />} />
        <Route path="/table" element={<MatrixPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
