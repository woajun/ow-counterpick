import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { usePageView } from './lib/analytics';
import { CounterPage } from './pages/CounterPage';
import { MatrixPage } from './pages/MatrixPage';
import { EditPage } from './pages/EditPage';
import { BrowsePage } from './pages/BrowsePage';

export default function App() {
  return (
    // 프로젝트 사이트라 주소 앞에 /ow-counterpick 이 붙는다.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PageView />
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

/** 화면이 바뀔 때마다 방문을 센다. 라우터 안에 있어야 주소를 안다. */
function PageView() {
  usePageView();
  return null;
}
