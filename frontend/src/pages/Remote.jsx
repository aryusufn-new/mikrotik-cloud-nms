import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Terminal as TerminalIcon, 
  Monitor, 
  Copy, 
  Check, 
  RefreshCw, 
  PowerOff,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getDevice, getRemoteSession, terminateRemoteSession, getRemoteActivities } from '../api';

export default function Remote() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' or 'winbox'
  const [session, setSession] = useState(null);
  const [activities, setActivities] = useState([]);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  // Terminal state
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [inputCommand, setInputCommand] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const terminalEndRef = useRef(null);
  const wsRef = useRef(null);

  // Load device info and remote session
  const loadRemoteData = async () => {
    try {
      const devRes = await getDevice(id);
      setDevice(devRes.data);

      const sessRes = await getRemoteSession(id, activeTab);
      setSession(sessRes.data);
      if (sessRes.data && sessRes.data.expires_in_seconds) {
        setTimeLeft(sessRes.data.expires_in_seconds);
      }

      const actRes = await getRemoteActivities(id);
      if (actRes.data && actRes.data.activities) {
        setActivities(actRes.data.activities);
      }
    } catch (err) {
      console.error("Failed to load remote data:", err);
    }
  };

  useEffect(() => {
    loadRemoteData();
  }, [id, activeTab]);

  // Session timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Connect WebSocket for live browser CLI Terminal
  useEffect(() => {
    if (activeTab !== 'terminal') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${id}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      setTerminalLogs((prev) => [...prev, event.data]);
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [id, activeTab]);

  // Scroll to bottom on new terminal output
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    if (!inputCommand.trim() || !wsRef.current) return;

    // Send command to websocket
    wsRef.current.send(inputCommand);
    setInputCommand('');
  };

  const handleCopyWinboxAddress = () => {
    if (session?.remote_address) {
      navigator.clipboard.writeText(session.remote_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTerminate = async () => {
    if (session?.session_id) {
      await terminateRemoteSession(session.session_id);
      loadRemoteData();
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Back button & Title Header */}
      <div>
        <Link 
          to="/devices" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke router</span>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Remote • {device?.name || 'Router'}
          </h1>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          {device?.model || 'CCR2004-16G-2S+'} • {device?.group_name || 'Default'}
        </p>
      </div>

      {/* Two Top Sub-Tab Switchers */}
      <div className="grid grid-cols-2 gap-4">
        {/* Terminal Tab Switcher Card */}
        <button
          onClick={() => setActiveTab('terminal')}
          className={`p-5 rounded-3xl text-left border transition-all ${
            activeTab === 'terminal'
              ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <TerminalIcon className={`w-4 h-4 ${activeTab === 'terminal' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className={`text-sm font-bold ${activeTab === 'terminal' ? 'text-emerald-900' : 'text-slate-800'}`}>
              Terminal
            </span>
          </div>
          <p className="text-xs text-slate-500">CLI MikroTik langsung di browser</p>
        </button>

        {/* WinBox Tab Switcher Card */}
        <button
          onClick={() => setActiveTab('winbox')}
          className={`p-5 rounded-3xl text-left border transition-all ${
            activeTab === 'winbox'
              ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Monitor className={`w-4 h-4 ${activeTab === 'winbox' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className={`text-sm font-bold ${activeTab === 'winbox' ? 'text-emerald-900' : 'text-slate-800'}`}>
              WinBox
            </span>
          </div>
          <p className="text-xs text-slate-500">Akses sementara untuk aplikasi WinBox</p>
        </button>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'terminal' ? (
        /* TERMINAL VIEW (Screenshot 4) */
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-800">Terminal MikroTik</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Terhubung
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Port layanan 22 • Dapat dijangkau
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={loadRemoteData}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Periksa ulang</span>
              </button>
              <button 
                onClick={handleTerminate}
                className="px-3.5 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-all"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Putuskan sesi</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Terminal • {session?.session_id || '98583489'} {formatTimer(timeLeft)}
          </div>

          {/* Authentic RouterOS Terminal Window */}
          <div className="bg-[#121417] rounded-2xl p-5 font-mono text-xs text-slate-200 shadow-inner h-[400px] overflow-y-auto flex flex-col terminal-scroll border border-slate-800">
            <div className="flex-1 space-y-1">
              {terminalLogs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap leading-relaxed">
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Prompt Form */}
            <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <span className="text-emerald-400 font-bold">[{device?.username || 'admin'}@{device?.name || 'CCR2004'}] &gt;</span>
              <input
                type="text"
                className="flex-1 bg-transparent text-white focus:outline-none font-mono text-xs"
                placeholder="Ketik perintah (mis. interface print, ip address print, system resource print)..."
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                autoFocus
              />
            </form>
          </div>
        </div>
      ) : (
        /* WINBOX VIEW (Screenshot 2) */
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-800">Remote WinBox</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Menunggu WinBox
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Port layanan 8291 • Dapat dijangkau
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={loadRemoteData}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Periksa ulang</span>
              </button>
              <button 
                onClick={handleTerminate}
                className="px-3.5 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-all"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Putuskan sesi</span>
              </button>
            </div>
          </div>

          {/* Akses sementara timer */}
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Akses sementara: <strong className="text-slate-800 font-mono text-sm">{formatTimer(timeLeft)}</strong></span>
          </div>

          {/* Pale Green Box for WinBox Connect Address */}
          <div className="bg-[#f0f8f4] border border-emerald-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-800 mb-1">Connect To di WinBox</p>
              <div className="text-xl font-mono font-black text-slate-800 tracking-wider">
                {session?.remote_address || '103.151.28.1:41891'}
              </div>
            </div>

            <button
              onClick={handleCopyWinboxAddress}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-2 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin alamat'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Audit: Aktivitas Remote Saya (Screenshot 2) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-4">Aktivitas remote saya</h3>
        <div className="divide-y divide-slate-100 text-xs">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">{act.activity_type}</span>
                  {act.session_id && (
                    <span className="text-[11px] text-slate-400 font-mono">• {act.session_id}</span>
                  )}
                </div>
                <div className="text-slate-500 font-mono">
                  {act.timestamp}
                </div>
                <div className="text-slate-500">
                  {act.status}
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 py-3 text-center">Belum ada aktivitas remote</p>
          )}
        </div>
      </div>
    </div>
  );
}

