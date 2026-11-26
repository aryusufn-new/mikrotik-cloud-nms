import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Search, 
  Plus, 
  Link as LinkIcon, 
  Server, 
  Wifi, 
  Maximize2, 
  ZoomIn, 
  ZoomOut,
  ChevronDown
} from 'lucide-react';
import { getTopology, saveTopology } from '../api';

// Custom Node for Router/Switch matching Screenshot 1
function DeviceNode({ data }) {
  return (
    <div className="bg-white/95 backdrop-blur-sm border-2 border-emerald-400/80 rounded-2xl p-4 shadow-sm min-w-[190px] text-center relative group hover:shadow-md transition-all">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white" />
      
      {/* Device Icon */}
      <div className="mx-auto w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 mb-2">
        {data.device_type === 'switch' ? (
          <Server className="w-5 h-5 text-emerald-600" />
        ) : (
          <Server className="w-5 h-5 text-slate-700" />
        )}
      </div>

      {/* Device Label */}
      <h4 className="text-xs font-bold text-slate-800 truncate">{data.label}</h4>
      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{data.ip || '172.20.2.1'}</p>

      {/* Status Badge */}
      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Online</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white" />
      <Handle type="target" position={Position.Left} id="left" className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white" />
    </div>
  );
}

const nodeTypes = {
  deviceNode: DeviceNode,
};

export default function Topologi() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Semua grup');
  const [zoomLevel, setZoomLevel] = useState(93);

  const fetchTopologyData = async () => {
    try {
      const res = await getTopology();
      if (res.data) {
        const rawNodes = res.data.nodes || [];
        const rawEdges = res.data.edges || [];

        const flowNodes = rawNodes.map((n) => ({
          id: String(n.id),
          type: 'deviceNode',
          position: { x: n.position_x, y: n.position_y },
          data: { 
            label: n.label, 
            device_type: n.device_type, 
            status: n.status,
            ip: n.ip_address || '192.168.88.1' 
          },
        }));

        const flowEdges = rawEdges.map((e) => ({
          id: `edge-${e.id}`,
          source: String(e.source_node_id),
          target: String(e.target_node_id),
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4 4' },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (e) {
      console.error("Failed to load topology:", e);
    }
  };

  useEffect(() => {
    fetchTopologyData();
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Topologi</h1>
          <p className="text-xs text-slate-500 font-medium">Organisasi utama</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Group Filter */}
          <div className="relative">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="text-xs font-semibold px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 focus:outline-none shadow-xs cursor-pointer pr-8"
            >
              <option>Semua grup</option>
              <option>Kantor Pusat</option>
              <option>Cabang Jakarta</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Perangkat */}
          <div className="relative w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari perangkat atau IP..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-[#d96734] shadow-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Hubungkan</span>
          </button>

          <button className="px-4 py-2.5 rounded-2xl bg-[#d96734] hover:bg-[#c25828] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Tambah perangkat</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Right Side Drawer */}
      <div className="flex-1 flex gap-3 min-h-[550px] relative">
        {/* Canvas Area */}
        <div className="flex-1 bg-[#fcfdfd] rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
          {/* Canvas Subtitle Hint */}
          <div className="p-4 z-10 pointer-events-none">
            <p className="text-xs text-slate-400">
              Geser perangkat untuk mengatur posisi. Tarik titik koneksi ke perangkat lain.
            </p>
          </div>

          {/* React Flow Interactive Graph */}
          <div className="flex-1 w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background color="#cbd5e1" gap={20} size={1.5} />
            </ReactFlow>
          </div>

          {/* Bottom Left Status Pill (Screenshot 1) */}
          <div className="absolute bottom-5 left-5 z-20">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-2xl text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>14 perangkat • 14 online</span>
            </div>
          </div>

          {/* Bottom Right Zoom & Fit Controls (Screenshot 1) */}
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 p-1.5 rounded-2xl text-xs font-bold text-slate-700 shadow-sm">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px]">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-200 mx-1"></div>
            <button className="px-2 py-0.5 hover:bg-slate-100 rounded-lg text-[11px]">
              Pas layar
            </button>
          </div>
        </div>

        {/* Right Drawer: Peta Jaringan Proyek (Screenshot 1) */}
        <div className="w-72 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Peta jaringan proyek</h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Router yang terdaftar otomatis muncul di kanvas. Tambahkan AP, switch, atau perangkat lain lalu hubungkan sesuai jaringan lu.
            </p>

            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Online
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Offline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full border border-slate-400"></span>
                  Tidak terpantau
                </span>
              </div>
            </div>

            <button className="w-full py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs flex items-center justify-center gap-1.5 transition-all">
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah perangkat</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4 leading-relaxed">
            Semua perangkat dipantau otomatis melalui router yang dipilih. Garis menggambarkan hubungan yang Anda tentukan.
          </div>
        </div>
      </div>
    </div>
  );
}

