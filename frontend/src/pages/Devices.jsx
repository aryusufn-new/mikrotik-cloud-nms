import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Server, 
  Wifi, 
  Trash2, 
  Terminal, 
  Radio, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Pencil
} from 'lucide-react';
import { getDevices, deleteDevice } from '../api';
import AddRouterModal from '../components/AddRouterModal';

export default function Devices() {
  const navigate = useNavigate();
  const { openAddRouter, refreshDevices: globalRefresh } = useOutletContext() || {};
  const [devices, setDevices] = useState([]);
  const [filter, setFilter] = useState('all'); // all, online, offline
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState(null);

  const fetchDevicesList = async () => {
    try {
      const res = await getDevices();
      if (res.data && res.data.devices) {
        setDevices(res.data.devices);
      }
      setLoading(false);
    } catch (e) {
      console.error("Failed to fetch devices:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevicesList();
    const onUpdated = () => fetchDevicesList();
    window.addEventListener('devices-updated', onUpdated);
    return () => window.removeEventListener('devices-updated', onUpdated);
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus router "${name}"?`)) {
      try {
        await deleteDevice(id);
        fetchDevicesList();
        if (globalRefresh) globalRefresh();
      } catch (err) {
        alert("Gagal menghapus device: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  const filteredDevices = devices.filter((d) => {
    const isOnline = (d.status || '').toLowerCase() === 'online';
    const matchFilter = 
      filter === 'all' ? true :
      filter === 'online' ? isOnline :
      !isOnline;

    const matchSearch = 
      (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.ip_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.group_name && d.group_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchFilter && matchSearch;
  });

  const onlineCount = devices.filter(d => (d.status || '').toLowerCase() === 'online').length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Devices</h1>
          <p className="text-xs text-slate-500 font-medium">Organisasi utama • {devices.length} router</p>
        </div>

        <button
          onClick={openAddRouter}
          className="px-4 py-2.5 rounded-2xl bg-[#d96734] hover:bg-[#c25828] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah router</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, model, grup, atau IP..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-[#d96734] focus:ring-1 focus:ring-[#d96734] shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-[#152e25] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Semua</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'all' ? 'bg-white/20' : 'bg-slate-100'}`}>
              {devices.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('online')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'online'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Online</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'online' ? 'bg-white/20' : 'bg-slate-100'}`}>
              {onlineCount}
            </span>
          </button>

          <button
            onClick={() => setFilter('offline')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'offline'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            <span>Offline</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'offline' ? 'bg-white/20' : 'bg-slate-100'}`}>
              {offlineCount}
            </span>
          </button>
        </div>
      </div>

      {/* Devices Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                <th className="py-3.5 px-5">Device / model</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">IP manajemen</th>
                <th className="py-3.5 px-4">CPU / RAM</th>
                <th className="py-3.5 px-4">RouterOS</th>
                <th className="py-3.5 px-4">Uptime</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDevices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Device / Model */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-sm">{d.name}</span>
                          <button
                            onClick={() => setEditingDevice(d)}
                            title="Edit router"
                            className="p-1 rounded-lg text-slate-400 hover:text-[#d96734] hover:bg-orange-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">{d.model} • {d.group_name || 'Default'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {(d.status || '').toLowerCase() === 'online' ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Online</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span>Offline</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">Terbaca baru saja</p>
                  </td>

                  {/* IP Manajemen */}
                  <td className="py-4 px-4 font-mono font-medium text-slate-700">
                    {d.ip_address}
                  </td>

                  {/* CPU / RAM dual progress bars */}
                  <td className="py-4 px-4 min-w-[130px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold w-7">CPU</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${d.cpu_usage || 15}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 w-7 text-right">
                          {d.cpu_usage || 15}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold w-7">RAM</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${d.memory_usage || 16}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 w-7 text-right">
                          {d.memory_usage || 16}%
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* RouterOS Version Badge */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">
                        {d.routeros_version?.split(' ')[0] || '7.21.4'}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {d.routeros_version?.includes('stable') ? 'stable' : 'long-term'}
                      </span>
                    </div>
                  </td>

                  {/* Uptime */}
                  <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                    {d.uptime || '10 hari 5 jam 44 mnt'}
                  </td>

                  {/* Actions: Detail, Remote, Delete */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/?device=${d.id}`)}
                        className="px-3 py-1.5 rounded-xl border border-emerald-800/40 text-emerald-900 bg-emerald-50/50 hover:bg-emerald-100/70 text-xs font-semibold transition-all"
                      >
                        Detail
                      </button>

                      <button
                        onClick={() => navigate(`/remote/${d.id}`)}
                        className="px-3 py-1.5 rounded-xl border border-emerald-800/40 text-emerald-900 bg-white hover:bg-emerald-50 text-xs font-semibold transition-all"
                      >
                        Remote
                      </button>

                      <button
                        onClick={() => handleDelete(d.id, d.name)}
                        className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                        title="Hapus router"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>1-4 dari {devices.length} devices</p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Per halaman</span>
              <select className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none">
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button disabled className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Router Modal */}
      {editingDevice && (
        <AddRouterModal
          isOpen={!!editingDevice}
          initialDevice={editingDevice}
          onClose={() => setEditingDevice(null)}
          onSuccess={() => {
            setEditingDevice(null);
            fetchDevicesList();
            if (globalRefresh) globalRefresh();
          }}
        />
      )}
    </div>
  );
}

