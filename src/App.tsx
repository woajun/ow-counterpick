import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { CounterPage } from './pages/CounterPage';
import { MatrixPage } from './pages/MatrixPage';
import { EditPage } from './pages/EditPage';
import { BrowsePage } from './pages/BrowsePage';

export default function App() {
  return (
    // 프로젝트 사이트라 주소 앞에 /ow-counterpick 이 붙는다.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<CounterPage />} />
        <Route path="/table" element={<MatrixPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="/edit/:hero" element={<EditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
