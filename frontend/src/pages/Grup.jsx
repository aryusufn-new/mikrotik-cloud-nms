import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Server } from 'lucide-react';
import { getGroups } from '../api';

export default function Grup() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroups().then((res) => {
      if (res.data && res.data.groups) {
        setGroups(res.data.groups);
      }
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Grup Perangkat</h1>
          <p className="text-xs text-slate-500 font-medium">Kelompokkan router dan topologi berdasarkan lokasi fisik atau zona</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#d96734] flex items-center justify-center mb-4">
                <FolderTree className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{g.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{g.description || 'Tidak ada deskripsi'}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                {g.device_count || 0} Router
              </span>
              <a href="/devices" className="text-[#d96734] font-bold hover:underline">
                Buka &rarr;
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

