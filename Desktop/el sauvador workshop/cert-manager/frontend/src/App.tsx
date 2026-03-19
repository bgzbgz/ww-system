import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Upload from './pages/Upload';
import Review from './pages/Review';
import Editor from './pages/Editor';
import Generate from './pages/Generate';
import Schedule from './pages/Schedule';
import Status from './pages/Status';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/review/:workshopId" element={<Review />} />
        <Route path="/editor/:workshopId" element={<Editor />} />
        <Route path="/generate/:workshopId" element={<Generate />} />
        <Route path="/schedule/:workshopId" element={<Schedule />} />
        <Route path="/status/:workshopId" element={<Status />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
