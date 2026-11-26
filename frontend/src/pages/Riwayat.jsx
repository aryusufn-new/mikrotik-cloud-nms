import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, Clock, Search } from 'lucide-react';
import { getConnectionHistory } from '../api';

export default function Riwayat() {
  const [incidents, setIncidents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConnectionHistory().then((res) => {
      if (res.data && res.data.history) {
        setIncidents(res.data.history);
      }
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filtered = incidents.filter(i => {
    if (filter === 'all') return true;
    return i.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Riwayat Koneksi</h1>
          <p className="text-xs text-slate-500 font-medium">Log kejadian online/offline router secara riil</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${filter === 'all' ? 'bg-[#152e25] text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilter('online')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${filter === 'online' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            Online
          </button>
          <button 
            onClick={() => setFilter('offline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${filter === 'offline' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            Offline
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="divide-y divide-slate-100">
          {filtered.map((inc) => (
            <div key={inc.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  inc.status === 'Online'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {inc.status}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">{inc.device_name}</p>
                  <p className="text-[11px] text-slate-400">{inc.details || 'Koneksi stabil'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{inc.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

