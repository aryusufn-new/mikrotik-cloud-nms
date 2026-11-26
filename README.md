# 🚀 MikroTik Cloud NMS

Platform Network Management System (NMS) modern berbasis web yang dirancang khusus untuk monitoring, manajemen armada, visualisasi topologi, dan remote access router MikroTik (RouterOS v7/v6).

---

## 📸 Fitur Utama (Sesuai Referensi Tampilan)

1. **Ringkasan (Overview Dashboard)**:
   - Status banner armada router ("Semua router online", total, online, offline).
   - Mini canvas preview topologi jaringan terintegrasi (Hub pusat & links).
   - Kartu **Availability** 24 jam / 7 hari / 30 hari dengan timeline chart & rasio 99.8%.
   - Widget **Riwayat koneksi** (insiden koneksi online & offline real-time).
   - **Hero Router Card** dengan status, model, RouterOS version, Uptime, serta gauge interaktif untuk **CPU, RAM, dan Disk**.
   - Grafik trafik interface real-time (PO1 / ether1) rata-rata 5 detik download & upload.

2. **Devices (Fleet Management)**:
   - Pencarian cepat nama, model, grup, atau IP router.
   - Filter instan (`Semua`, `Online`, `Offline`).
   - Tabel router dengan indikator dual CPU & RAM, tag versi RouterOS (`7.21.4 long-term`), uptime, serta tombol aksi `Detail`, `Remote`, dan hapus.
   - Modal penambahan router baru dengan dukungan port API (8728), SSH (22), dan WinBox (8291).

3. **Topologi Jaringan Interaktif**:
   - Canvas drag-and-drop interaktif dengan dot grid halus.
   - Custom node perangkat (Router, Switch, AP) dengan icon, IP, dan badge status Online.
   - Sambungan kabel dinamis dengan titik panah flow.
   - Filter grup, search canvas, zoom in/out/fit (`[-] 93% [+] Pas layar`), serta panel panduan peta jaringan.

4. **Remote Access Hub**:
   - **Terminal MikroTik**: CLI RouterOS langsung di browser via WebSocket real-time dengan ASCII banner resmi MikroTik, prompt interaktif, dan eksekusi command.
   - **Remote WinBox**: Gateway tunneling sementara port 8291 dengan countdown timer (4:58), tombol satu-klik "Salin alamat", tombol "Periksa ulang", dan "Putuskan sesi".
   - Audit riwayat akses remote pengguna (Terminal, WinBox) lengkap dengan timestamp dan status sesi.

---

## 🛠️ Arsitektur & Teknologi

- **Backend**: Python FastAPI, Uvicorn, SQLite database, RouterOS API & SSH client (Paramiko), WebSocket full-duplex.
- **Frontend**: React 18, Vite, Tailwind CSS, `@xyflow/react` (React Flow), Recharts, Lucide Icons.

---

## ⚡ Cara Menjalankan

### Cara 1: Menggunakan Script Langsung (`run.sh`)
```bash
chmod +x run.sh
./run.sh
```
Akses di browser:
- **Frontend NMS**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Cara 2: Docker Compose
```bash
docker compose up -d
```
