import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, Loader2, Radar } from 'lucide-react';
import { createDevice, updateDevice, getGroups, probeDeviceResource } from '../api';

export default function AddRouterModal({ isOpen, onClose, onSuccess, initialDevice = null }) {
  const isEdit = Boolean(initialDevice);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    ip_address: '',
    api_port: 8728,
    ssh_port: 22,
    winbox_port: 8291,
    username: 'admin',
    password: '',
    group_id: 1,
  });

  useEffect(() => {
    if (isOpen) {
      setProbeResult(null);
      setError(null);

      if (initialDevice) {
        setFormData({
          name: initialDevice.name || '',
          model: initialDevice.model || '',
          ip_address: initialDevice.ip_address || initialDevice.host || '',
          api_port: initialDevice.api_port || 8728,
          ssh_port: initialDevice.ssh_port || 22,
          winbox_port: initialDevice.winbox_port || 8291,
          username: initialDevice.username || 'admin',
          password: '',
          group_id: 1,
        });
      } else {
        setFormData({
          name: '',
          model: '',
          ip_address: '',
          api_port: 8728,
          ssh_port: 22,
          winbox_port: 8291,
          username: 'admin',
          password: '',
          group_id: 1,
        });
      }

      getGroups().then((res) => {
        if (res.data && res.data.groups) {
          setGroups(res.data.groups);
          if (res.data.groups.length > 0) {
            const matchedGroup = initialDevice?.group_name
              ? res.data.groups.find(g => g.name === initialDevice.group_name)
              : null;
            setFormData(prev => ({
              ...prev,
              group_id: matchedGroup ? matchedGroup.id : res.data.groups[0].id
            }));
          }
        }
      }).catch(console.error);
    }
  }, [isOpen, initialDevice]);

  if (!isOpen) return null;

  const handleProbe = async () => {
    if (!formData.ip_address.trim()) {
      setError('Isi IP Manajemen / Host terlebih dahulu untuk deteksi.');
      return;
    }
    setProbing(true);
    setError(null);
    setProbeResult(null);
    try {
      const res = await probeDeviceResource({
        device_id: initialDevice?.id || null,
        host: formData.ip_address,
        ip_address: formData.ip_address,
        api_port: formData.api_port,
        ssh_port: formData.ssh_port,
        winbox_port: formData.winbox_port,
        username: formData.username,
        password: formData.password,
      });
      setProbeResult(res.data);
      if (res.data?.resource) {
        const r = res.data.resource;
        setFormData(prev => ({
          ...prev,
          model: r.model || prev.model,
          name: prev.name.trim() ? prev.name : (r.identity || prev.name),
        }));
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Gagal mendeteksi resource router.');
    } finally {
      setProbing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const selectedGroup = groups.find(g => g.id === formData.group_id);
      const payload = {
        ...formData,
        host: formData.ip_address,
        group_name: selectedGroup?.name || 'Default',
      };

      if (isEdit) {
        if (!payload.password) {
          delete payload.password;
        }
        await updateDevice(initialDevice.id, payload);
      } else {
        await createDevice(payload);
      }

      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : typeof detail === 'string'
        ? detail
        : `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} router. Pastikan parameter sudah benar.`;
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#d96734] flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEdit ? 'Edit Router' : 'Tambah Router Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? `Perbarui konfigurasi ${initialDevice.name}` : 'Model & resource terdeteksi otomatis dari RouterOS API'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {probeResult && (
            <div className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
              probeResult.resource
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : probeResult.online
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                {probeResult.resource ? (
                  <>
                    <p className="font-bold">Terdeteksi: {probeResult.resource.model} ({probeResult.resource.identity || 'MikroTik'})</p>
                    <p className="text-[11px] opacity-85">
                      RouterOS {probeResult.resource.routeros_version} • CPU {probeResult.resource.cpu_load}% • RAM {probeResult.resource.ram_usage}% • Uptime {probeResult.resource.uptime}
                    </p>
                  </>
                ) : probeResult.online ? (
                  <div>
                    <p>Host terjangkau, tapi API port {formData.api_port} tidak merespons atau login API gagal.</p>
                    {probeResult.error && (
                      <p className="text-[11px] font-mono mt-1 opacity-80">Detail: {probeResult.error}</p>
                    )}
                  </div>
                ) : (
                  <p>Router tidak terjangkau pada port API/SSH/WinBox.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">IP Manajemen / Host *</label>
              <input
                type="text"
                required
                placeholder="mis. 192.168.88.1"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734] focus:ring-1 focus:ring-[#d96734]"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grup</label>
              <select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734] focus:ring-1 focus:ring-[#d96734] bg-white"
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: Number(e.target.value) })}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username MikroTik *</label>
              <input
                type="text"
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734]"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                placeholder={isEdit ? 'Biarkan kosong jika tidak diubah' : 'Kosongkan bila tanpa password'}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734]"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Port API</label>
              <input
                type="number"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734]"
                value={formData.api_port}
                onChange={(e) => setFormData({ ...formData, api_port: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Port SSH</label>
              <input
                type="number"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734]"
                value={formData.ssh_port}
                onChange={(e) => setFormData({ ...formData, ssh_port: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Port WinBox</label>
              <input
                type="number"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734]"
                value={formData.winbox_port}
                onChange={(e) => setFormData({ ...formData, winbox_port: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perangkat</label>
              <input
                type="text"
                placeholder="Otomatis dari Identity / isi manual"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734] focus:ring-1 focus:ring-[#d96734]"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Board Name</label>
              <input
                type="text"
                placeholder="Otomatis dari /system/resource"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#d96734] focus:ring-1 focus:ring-[#d96734] bg-slate-50"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleProbe}
              disabled={probing}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {probing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radar className="w-3.5 h-3.5" />}
              <span>Deteksi Resource</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#d96734] hover:bg-[#c25828] rounded-xl flex items-center gap-2 shadow-sm transition-colors"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Router'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
