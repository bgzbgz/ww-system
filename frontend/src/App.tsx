import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Upload from './pages/Upload';
import Review from './pages/Review';
import Generate from './pages/Generate';
import PreviewCerts from './pages/PreviewCerts';
import Send from './pages/Send';
import Status from './pages/Status';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/review/:workshopId" element={<Review />} />
        <Route path="/generate/:workshopId" element={<Generate />} />
        <Route path="/preview/:workshopId" element={<PreviewCerts />} />
        <Route path="/send/:workshopId" element={<Send />} />
        <Route path="/status/:workshopId" element={<Status />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
