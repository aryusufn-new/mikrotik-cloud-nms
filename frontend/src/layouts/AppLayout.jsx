import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AddRouterModal from '../components/AddRouterModal';
import GroupModal from '../components/GroupModal';
import { getDevices } from '../api';

export default function AppLayout() {
  const [deviceCount, setDeviceCount] = useState(4);
  const [isAddRouterOpen, setIsAddRouterOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

  const fetchDeviceStats = async () => {
    try {
      const res = await getDevices();
      if (res.data && res.data.devices) {
        setDeviceCount(res.data.devices.length);
      }
    } catch (e) {
      console.error("Failed to fetch device stats:", e);
    }
  };

  useEffect(() => {
    fetchDeviceStats();
    const interval = setInterval(fetchDeviceStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen p-4 bg-[#f1f4f9] overflow-hidden gap-4">
      {/* Sidebar Navigation */}
      <Sidebar 
        deviceCount={deviceCount}
        onOpenAddRouter={() => setIsAddRouterOpen(true)}
        onOpenAddGroup={() => setIsAddGroupOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 h-full overflow-y-auto rounded-3xl">
        <Outlet context={{ refreshDevices: fetchDeviceStats, openAddRouter: () => setIsAddRouterOpen(true) }} />
      </main>

      {/* Modals */}
      {isAddRouterOpen && (
        <AddRouterModal 
          isOpen={isAddRouterOpen} 
          onClose={() => setIsAddRouterOpen(false)}
          onSuccess={() => {
            setIsAddRouterOpen(false);
            fetchDeviceStats();
          }}
        />
      )}

      {isAddGroupOpen && (
        <GroupModal 
          isOpen={isAddGroupOpen} 
          onClose={() => setIsAddGroupOpen(false)}
          onSuccess={() => {
            setIsAddGroupOpen(false);
          }}
        />
      )}
    </div>
  );
}

