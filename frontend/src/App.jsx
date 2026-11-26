import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Ringkasan from './pages/Ringkasan';
import Devices from './pages/Devices';
import Topologi from './pages/Topologi';
import Remote from './pages/Remote';
import Riwayat from './pages/Riwayat';
import Grup from './pages/Grup';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Ringkasan />} />
          <Route path="devices" element={<Devices />} />
          <Route path="topologi" element={<Topologi />} />
          <Route path="remote/:id" element={<Remote />} />
          <Route path="riwayat" element={<Riwayat />} />
          <Route path="grup" element={<Grup />} />
          <Route path="settings" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

