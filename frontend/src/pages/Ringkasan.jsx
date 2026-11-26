import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Layers, 
  Cpu, 
  HardDrive, 
  ChevronDown,
  RefreshCw,
  Server
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getDashboardSummary } from '../api';

export default function Ringkasan() {
  const [summary, setSummary] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [availRange, setAvailRange] = useState('24h');
  const [trafficRange, setTrafficRange] = useState('5m');
  const [selectedInterface, setSelectedInterface] = useState('PO1');
  const [loading, setLoading] = useState(true);

  // Real-time simulated traffic generator for smooth visual fidelity
  const [trafficData, setTrafficData] = useState([]);
  const [curRx, setCurRx] = useState(212.1);
  const [curTx, setCurTx] = useState(33.8);

  const fetchSummary = async () => {
    try {
      const res = await getDashboardSummary();
      if (res.data) {
        setSummary(res.data);
        if (!selectedDevice && res.data.devices && res.data.devices.length > 0) {
          setSelectedDevice(res.data.devices[0]);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dashboard summary:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update real-time traffic chart points
  useEffect(() => {
    const times = ['22.56', '22.57', '22.58', '22.59', '23.00', '23.01'];
    const initial = times.map((t) => ({
      time: t,
      rx: Math.floor(150 + Math.random() * 120),
      tx: Math.floor(20 + Math.random() * 25),
    }));
    setTrafficData(initial);

    const trafficInterval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
      const newRx = Number((180 + Math.random() * 80).toFixed(1));
      const newTx = Number((28 + Math.random() * 15).toFixed(1));
      setCurRx(newRx);
      setCurTx(newTx);

      setTrafficData((prev) => {
        const next = [...prev.slice(1), { time: timeStr, rx: newRx, tx: newTx }];
        return next;
      });
    }, 2500);

    return () => clearInterval(trafficInterval);
  }, []);

  const totalRouters = summary?.total_routers ?? 4;
  const onlineRouters = summary?.online_routers ?? 4;
  const offlineRouters = summary?.offline_routers ?? 0;
  const devices = summary?.devices ?? [];
  const incidents = summary?.recent_incidents ?? [];

  return (
    <div className="space-y-4 pb-6">
      {/* Top Banner Status Bar */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Semua router online</h2>
            <p className="text-xs text-slate-400">Data terakhir 23.01.05 WIB</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Total router</span>
            <span className="font-bold text-slate-900">{totalRouters}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Router online</span>
            <span className="font-bold">{onlineRouters}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>Router offline</span>
            <span className="font-bold">{offlineRouters}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left & Right Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Topologi Preview + Availability + Incident History */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mini Topology Canvas Preview */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative min-h-[310px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <h3 className="text-sm font-bold text-slate-800">Topologi jaringan</h3>
            </div>

            {/* Simulated mini topology graph matching screenshot */}
            <div className="relative h-56 w-full flex items-center justify-between px-4">
              {/* Dot Grid Background */}
              <div 
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                  backgroundSize: '16px 16px'
                }}
              />

              {/* Central Hub Node */}
              <div className="z-10 bg-[#162721] text-white px-5 py-4 rounded-2xl shadow-md border border-emerald-800/50 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-bold tracking-wide">Hub pusat</span>
                </div>
                <span className="text-[10px] text-emerald-200/70 font-mono">10.0.0.1</span>
              </div>

              {/* Connecting Curved Flow Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                <path d="M 170 120 C 230 120, 260 50, 310 50" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 170 120 C 230 120, 260 95, 310 95" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 170 120 C 230 120, 260 145, 310 145" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 170 120 C 230 120, 260 190, 310 190" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>

              {/* 4 Connected Routers on the Right */}
              <div className="space-y-2 z-10 w-56">
                {devices.slice(0, 4).map((d) => (
                  <div 
                    key={d.id} 
                    className="bg-white/90 backdrop-blur-sm border border-slate-200 hover:border-emerald-300 px-3 py-2 rounded-xl flex items-center justify-between shadow-xs transition-all cursor-pointer"
                    onClick={() => setSelectedDevice(d)}
                  >
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate">{d.name}</p>
                      <p className="text-[10px] text-slate-400">{d.model}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Online
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="z-10 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
              <span className="font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{totalRouters} router</span>
              <a href="/topologi" className="text-xs font-semibold text-[#d96734] hover:underline">Buka topologi penuh &rarr;</a>
            </div>
          </div>

          {/* Row: Availability Card & Connection History Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Availability Dark Forest Card */}
            <div className="bg-[#112821] text-white rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">Availability</h3>
                  <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-[10px]">
                    <button 
                      onClick={() => setAvailRange('24h')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all ${availRange === '24h' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
                    >
                      24 jam
                    </button>
                    <button 
                      onClick={() => setAvailRange('7d')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all ${availRange === '7d' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
                    >
                      7 hari
                    </button>
                    <button 
                      onClick={() => setAvailRange('30d')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all ${availRange === '30d' ? 'bg-white text-slate-900' : 'text-slate-300'}`}
                    >
                      30 hari
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-200/70 truncate mb-4">
                  Router {selectedDevice?.name || 'CCR2004-16G-2S+'}
                </p>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-extrabold tracking-tight text-white">99,8%</span>
                  <span className="text-xs text-emerald-200/80">uptime 24 jam terakhir</span>
                </div>

                {/* 24-Hour Timeline Bar Chart */}
                <div className="flex items-center justify-between gap-1 py-2">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="h-8 flex-1 rounded-sm transition-all"
                      style={{ 
                        backgroundColor: i === 18 ? '#eab308' : '#10b981',
                        opacity: i > 22 ? 0.35 : 1
                      }}
                      title={`Jam ${i}:00 - ${i === 18 ? 'Sebagian offline' : 'Online'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-emerald-200/60 mt-1">
                  <span>24 jam lalu</span>
                  <span>Sekarang</span>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-900/60 mt-3 text-[10px] text-emerald-200/70">
                <p className="mb-2">21/24 jam punya data • 75.025 detik teramati</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span>Online</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Sebagian offline</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Offline</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500"></span>Tidak ada data</span>
                </div>
              </div>
            </div>

            {/* Connection History Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-800">Riwayat koneksi</h3>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {incidents.length} kejadian
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3 truncate">
                  Router {selectedDevice?.name || 'CCR2004-16G-2S+'}
                </p>

                {/* Incident Timeline List */}
                <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                  {incidents.map((inc) => (
                    <div 
                      key={inc.id}
                      className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                        inc.status === 'Online'
                          ? 'bg-emerald-50/70 border-emerald-100'
                          : 'bg-red-50/70 border-red-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inc.status === 'Online'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          {inc.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {inc.timestamp}
                        </span>
                      </div>
                      {inc.details && (
                        <p className="text-[11px] text-slate-500">{inc.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-right">
                <a href="/riwayat" className="text-xs font-semibold text-[#d96734] hover:underline">
                  Lihat semua riwayat &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Router Hero Details + Live Traffic */}
        <div className="lg:col-span-5 space-y-4">
          {/* Router Selection Dropdown */}
          <div className="bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pilih router</span>
            <select
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-[240px] truncate"
              value={selectedDevice?.id ?? ''}
              onChange={(e) => {
                const found = devices.find(d => d.id === Number(e.target.value));
                if (found) setSelectedDevice(found);
              }}
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.model})
                </option>
              ))}
            </select>
          </div>

          {/* Router Hero Card (Dark Forest Green Header) */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-[#122b22] text-white p-5 flex items-center justify-between relative overflow-hidden">
              <div className="z-10">
                <p className="text-[10px] tracking-wider uppercase font-semibold text-emerald-300">
                  {selectedDevice?.model || 'CCR2004-16G-2S+'} • {selectedDevice?.group_name || 'GRUP DEFAULT'}
                </p>
                <h4 className="text-lg font-extrabold text-white mt-0.5">
                  {selectedDevice?.name || 'CCR2004-Core-Router'}
                </h4>
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Online
                </div>
              </div>

              {/* Hardware Device Graphic */}
              <div className="z-10 bg-slate-900/60 p-2.5 rounded-2xl border border-white/10 shadow-lg">
                <Server className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            {/* Spec Cards Below Header */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium">IP manajemen</p>
                  <p className="text-xs font-bold text-slate-800 font-mono mt-0.5 truncate">
                    {selectedDevice?.ip_address || '172.20.2.1'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium">RouterOS</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                    {selectedDevice?.routeros_version || '7.19.5 (stable)'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium">Uptime</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                    {selectedDevice?.uptime || '1 hari 19 jam'}
                  </p>
                </div>
              </div>

              {/* Radial Gauges: CPU, RAM, Disk */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {/* CPU Gauge */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${selectedDevice?.cpu_usage || 15}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-slate-800">
                      {selectedDevice?.cpu_usage || 15}%
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-1">CPU</span>
                </div>

                {/* RAM Gauge */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-orange-500"
                        strokeDasharray={`${selectedDevice?.memory_usage || 7}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-slate-800">
                      {selectedDevice?.memory_usage || 7}%
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-1">RAM</span>
                </div>

                {/* Disk Gauge */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-500"
                        strokeDasharray={`${selectedDevice?.disk_usage || 17}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-slate-800">
                      {selectedDevice?.disk_usage || 17}%
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-1">Disk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interface Traffic Chart Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Trafik interface</h4>
                <p className="text-[11px] text-slate-400">Rata-rata 5 detik • diperbarui tiap detik</p>
              </div>

              <div className="flex items-center gap-2">
                <select 
                  value={selectedInterface}
                  onChange={(e) => setSelectedInterface(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none"
                >
                  <option value="PO1">PO1</option>
                  <option value="ether1">ether1</option>
                  <option value="sfp-sfpplus1">sfp-sfpplus1</option>
                  <option value="bridge1">bridge1</option>
                </select>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                  <button 
                    onClick={() => setTrafficRange('5m')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${trafficRange === '5m' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'}`}
                  >
                    5 mnt
                  </button>
                  <button 
                    onClick={() => setTrafficRange('15m')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${trafficRange === '15m' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'}`}
                  >
                    15 mnt
                  </button>
                  <button 
                    onClick={() => setTrafficRange('24h')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${trafficRange === '24h' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'}`}
                  >
                    24 jam
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-36 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#e2e8f0" />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="rx" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#downloadGrad)" name="Download (Mbps)" />
                  <Area type="monotone" dataKey="tx" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#uploadGrad)" name="Upload (Mbps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom summary boxes */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-1.5 text-blue-700 text-xs font-semibold mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Download</span>
                </div>
                <div className="text-xl font-extrabold text-blue-900 tracking-tight">
                  {curRx} Mbps
                </div>
                <p className="text-[10px] text-blue-500 mt-0.5">Maks. 5 mnt 1.131,5 Mbps</p>
              </div>

              <div className="bg-orange-50/80 p-3.5 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-1.5 text-orange-700 text-xs font-semibold mb-1">
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                  <span>Upload</span>
                </div>
                <div className="text-xl font-extrabold text-orange-900 tracking-tight">
                  {curTx} Mbps
                </div>
                <p className="text-[10px] text-orange-500 mt-0.5">Maks. 5 mnt 49,7 Mbps</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

