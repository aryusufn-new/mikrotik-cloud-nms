import os
import sqlite3
import json
from datetime import datetime, timedelta
from passlib.context import CryptContext

DB_PATH = os.environ.get("NMS_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "nms.db"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    # Users
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT DEFAULT 'Administrator',
            role TEXT DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Groups
    cur.execute("""
        CREATE TABLE IF NOT EXISTS device_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Devices (Routers)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            model TEXT NOT NULL DEFAULT 'RB450Gx4',
            host TEXT NOT NULL,
            api_port INTEGER NOT NULL DEFAULT 8728,
            ssh_port INTEGER NOT NULL DEFAULT 22,
            winbox_port INTEGER NOT NULL DEFAULT 8291,
            username TEXT NOT NULL DEFAULT 'admin',
            password TEXT NOT NULL DEFAULT '',
            group_name TEXT NOT NULL DEFAULT 'Default',
            routeros_version TEXT NOT NULL DEFAULT '7.21.4 long-term',
            status TEXT NOT NULL DEFAULT 'online', -- online, offline
            cpu_load INTEGER DEFAULT 15,
            ram_usage INTEGER DEFAULT 25,
            disk_usage INTEGER DEFAULT 17,
            uptime TEXT DEFAULT '10 hari 5 jam 44 mnt',
            last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Topology Nodes
    cur.execute("""
        CREATE TABLE IF NOT EXISTS topology_nodes (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            device_id INTEGER,
            node_type TEXT NOT NULL DEFAULT 'router', -- router, switch, ap, hub
            label TEXT NOT NULL,
            model TEXT DEFAULT '',
            ip TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'online', -- online, offline, unmonitored
            pos_x REAL NOT NULL DEFAULT 0,
            pos_y REAL NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Topology Edges (Connections)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS topology_edges (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            label TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Connection History (Events)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS connection_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            device_id INTEGER,
            device_name TEXT NOT NULL,
            status TEXT NOT NULL, -- Online, Offline
            reason TEXT DEFAULT 'Normal operation',
            event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Remote Activities (Audit log for Terminal and Winbox sessions)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS remote_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            device_id INTEGER NOT NULL,
            device_name TEXT NOT NULL,
            session_type TEXT NOT NULL, -- Terminal, WinBox
            target_address TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Ditutup pengguna',
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP
        )
    """)

    conn.commit()

    # Seed admin user if not exists
    cur.execute("SELECT id FROM users WHERE username = 'admin'")
    admin = cur.fetchone()
    if not admin:
        hashed = pwd_context.hash("admin")
        cur.execute("INSERT INTO users (username, hashed_password, full_name, role) VALUES ('admin', ?, 'Admin Utama', 'admin')", (hashed,))
        admin_id = cur.lastrowid
    else:
        admin_id = admin["id"]

    # Seed default group if empty
    cur.execute("SELECT count(*) as cnt FROM device_groups WHERE user_id = ?", (admin_id,))
    if cur.fetchone()["cnt"] == 0:
        cur.execute("INSERT INTO device_groups (user_id, name, description) VALUES (?, 'Default', 'Grup router utama')", (admin_id,))
        cur.execute("INSERT INTO device_groups (user_id, name, description) VALUES (?, 'Core Distribution', 'Router backbone distribusi')", (admin_id,))

    # Seed sample routers matching screenshot if empty
    cur.execute("SELECT count(*) as cnt FROM devices WHERE user_id = ?", (admin_id,))
    if cur.fetchone()["cnt"] == 0:
        seed_devices = [
            ("Router Utama Sentral", "RB450Gx4", "192.168.88.1", 8728, 22, 8291, "admin", "", "Default", "7.21.4 long-term", "online", 15, 16, 12, "10 hari 5 jam 44 mnt"),
            ("Distribution Gate A", "RB4011iGS+", "192.168.10.1", 8728, 22, 8291, "admin", "", "Default", "7.20.6 stable", "online", 19, 12, 20, "17 jam 4 mnt"),
            ("Backbone CCR Core", "CCR2004-16G-2S+", "10.0.0.1", 8728, 22, 8291, "admin", "", "Core Distribution", "7.19.5 stable", "online", 9, 7, 17, "1 hari 19 jam 49 mnt"),
            ("Edge Gateway B4", "RB750Gr3", "192.168.20.1", 8728, 22, 8291, "admin", "", "Default", "7.21.5 long-term", "online", 6, 24, 14, "7 jam 52 mnt"),
        ]
        for d in seed_devices:
            cur.execute("""
                INSERT INTO devices (user_id, name, model, host, api_port, ssh_port, winbox_port, username, password, group_name, routeros_version, status, cpu_load, ram_usage, disk_usage, uptime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (admin_id, *d))

    # Seed sample connection history if empty
    cur.execute("SELECT count(*) as cnt FROM connection_history WHERE user_id = ?", (admin_id,))
    if cur.fetchone()["cnt"] == 0:
        now = datetime.now()
        cur.execute("INSERT INTO connection_history (user_id, device_name, status, reason, event_time) VALUES (?, 'Backbone CCR Core', 'Online', 'Koneksi kembali normal', ?)", (admin_id, (now - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")))
        cur.execute("INSERT INTO connection_history (user_id, device_name, status, reason, event_time) VALUES (?, 'Edge Gateway B4', 'Offline', 'Belum terkonfirmasi', ?)", (admin_id, (now - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")))
        cur.execute("INSERT INTO connection_history (user_id, device_name, status, reason, event_time) VALUES (?, 'Edge Gateway B4', 'Online', 'Router boot normal', ?)", (admin_id, (now - timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S")))

    # Seed sample remote activities if empty
    cur.execute("SELECT count(*) as cnt FROM remote_activities WHERE user_id = ?", (admin_id,))
    if cur.fetchone()["cnt"] == 0:
        cur.execute("INSERT INTO remote_activities (user_id, device_id, device_name, session_type, target_address, status) VALUES (?, 1, 'Router Utama Sentral', 'Terminal', '192.168.88.1:22', 'Ditutup pengguna')", (admin_id,))
        cur.execute("INSERT INTO remote_activities (user_id, device_id, device_name, session_type, target_address, status) VALUES (?, 1, 'Router Utama Sentral', 'WinBox', '192.168.88.1:8291', 'Ditutup pengguna')", (admin_id,))
        cur.execute("INSERT INTO remote_activities (user_id, device_id, device_name, session_type, target_address, status) VALUES (?, 3, 'Backbone CCR Core', 'WinBox', '10.0.0.1:8291', 'Ditutup pengguna')", (admin_id,))

    # Seed sample topology nodes & edges if empty
    cur.execute("SELECT count(*) as cnt FROM topology_nodes WHERE user_id = ?", (admin_id,))
    if cur.fetchone()["cnt"] == 0:
        nodes = [
            ("node-1", admin_id, 3, "hub", "Hub Pusat", "CCR2004", "10.0.0.1", "online", 280, 50),
            ("node-2", admin_id, 1, "router", "Router Utama", "RB450Gx4", "192.168.88.1", "online", 80, 220),
            ("node-3", admin_id, 2, "switch", "Switch Dist-A", "CRS326", "192.168.10.1", "online", 280, 220),
            ("node-4", admin_id, 4, "router", "Edge Gateway", "RB750Gr3", "192.168.20.1", "online", 480, 220),
        ]
        for n in nodes:
            cur.execute("""
                INSERT INTO topology_nodes (id, user_id, device_id, node_type, label, model, ip, status, pos_x, pos_y)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, n)

        edges = [
            ("edge-1-2", admin_id, "node-1", "node-2", "Trunk 1G", "active"),
            ("edge-1-3", admin_id, "node-1", "node-3", "Fiber SFP+", "active"),
            ("edge-1-4", admin_id, "node-1", "node-4", "Trunk 1G", "active"),
        ]
        for e in edges:
            cur.execute("""
                INSERT INTO topology_edges (id, user_id, source_id, target_id, label, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, e)

    conn.commit()
    conn.close()


# Database helper functions
def format_device(row: dict) -> dict:
    if not row:
        return row
    d = dict(row)
    d["ip_address"] = d.get("host", "")
    d["cpu_usage"] = d.get("cpu_load", 0)
    d["memory_usage"] = d.get("ram_usage", 0)
    return d


def list_devices(user_id: int, status: str = None, group: str = None, search: str = None):
    conn = get_db()
    cur = conn.cursor()
    query = "SELECT * FROM devices WHERE user_id = ?"
    params = [user_id]
    if status and status != "all":
        query += " AND status = ?"
        params.append(status)
    if group and group != "Semua":
        query += " AND group_name = ?"
        params.append(group)
    if search:
        query += " AND (name LIKE ? OR model LIKE ? OR host LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
    query += " ORDER BY id ASC"
    cur.execute(query, params)
    rows = [format_device(dict(r)) for r in cur.fetchall()]
    conn.close()
    return rows


def get_device(device_id: int, user_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM devices WHERE id = ? AND user_id = ?", (device_id, user_id))
    row = cur.fetchone()
    conn.close()
    return format_device(dict(row)) if row else None


def add_device(user_id: int, data: dict):
    conn = get_db()
    cur = conn.cursor()
    host_val = data.get("host") or data.get("ip_address") or "192.168.88.1"
    cur.execute("""
        INSERT INTO devices (
            user_id, name, model, host, api_port, ssh_port, winbox_port,
            username, password, group_name, routeros_version, status, cpu_load, ram_usage, disk_usage, uptime
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        data.get("name", "Router Baru"),
        data.get("model", "MikroTik Router"),
        host_val,
        int(data.get("api_port", 8728)),
        int(data.get("ssh_port", 22)),
        int(data.get("winbox_port", 8291)),
        data.get("username", "admin"),
        data.get("password", ""),
        data.get("group_name", "Default"),
        data.get("routeros_version", "7.21.4 long-term"),
        data.get("status", "online"),
        int(data.get("cpu_load") or data.get("cpu_usage") or 15),
        int(data.get("ram_usage") or data.get("memory_usage") or 16),
        int(data.get("disk_usage", 17)),
        data.get("uptime", "1 hari 0 jam 0 mnt"),
    ))
    new_id = cur.lastrowid
    conn.commit()
    conn.close()
    return new_id


def update_device(device_id: int, user_id: int, data: dict):
    conn = get_db()
    cur = conn.cursor()
    allowed = ["name", "model", "host", "api_port", "ssh_port", "winbox_port", "username", "password", "group_name", "routeros_version", "status", "cpu_load", "ram_usage", "disk_usage", "uptime"]
    updates = {k: v for k, v in data.items() if k in allowed and v is not None}
    if not updates:
        conn.close()
        return True
    set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
    values = list(updates.values()) + [device_id, user_id]
    cur.execute(f"UPDATE devices SET {set_clause} WHERE id = ? AND user_id = ?", values)
    conn.commit()
    conn.close()
    return True


def delete_device(device_id: int, user_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM devices WHERE id = ? AND user_id = ?", (device_id, user_id))
    cur.execute("DELETE FROM topology_nodes WHERE device_id = ? AND user_id = ?", (device_id, user_id))
    conn.commit()
    conn.close()
    return True


def get_topology(user_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM topology_nodes WHERE user_id = ?", (user_id,))
    nodes = []
    for r in cur.fetchall():
        d = dict(r)
        d["position_x"] = d.get("pos_x", 0)
        d["position_y"] = d.get("pos_y", 0)
        d["device_type"] = d.get("node_type", "router")
        d["ip_address"] = d.get("ip", "")
        nodes.append(d)

    cur.execute("SELECT * FROM topology_edges WHERE user_id = ?", (user_id,))
    edges = []
    for r in cur.fetchall():
        d = dict(r)
        d["source_node_id"] = d.get("source_id", "")
        d["target_node_id"] = d.get("target_id", "")
        edges.append(d)

    conn.close()
    return {"nodes": nodes, "edges": edges}


def save_topology_node(user_id: int, node_data: dict):
    conn = get_db()
    cur = conn.cursor()
    node_id = node_data["id"]
    cur.execute("SELECT id FROM topology_nodes WHERE id = ? AND user_id = ?", (node_id, user_id))
    if cur.fetchone():
        cur.execute("""
            UPDATE topology_nodes 
            SET label = ?, pos_x = ?, pos_y = ?, node_type = ?, status = ?, ip = ?, model = ?
            WHERE id = ? AND user_id = ?
        """, (
            node_data.get("label", "Node"),
            node_data.get("pos_x", 0),
            node_data.get("pos_y", 0),
            node_data.get("node_type", "router"),
            node_data.get("status", "online"),
            node_data.get("ip", ""),
            node_data.get("model", ""),
            node_id,
            user_id
        ))
    else:
        cur.execute("""
            INSERT INTO topology_nodes (id, user_id, device_id, node_type, label, model, ip, status, pos_x, pos_y)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            node_id,
            user_id,
            node_data.get("device_id"),
            node_data.get("node_type", "router"),
            node_data.get("label", "Node"),
            node_data.get("model", ""),
            node_data.get("ip", ""),
            node_data.get("status", "online"),
            node_data.get("pos_x", 0),
            node_data.get("pos_y", 0),
        ))
    conn.commit()
    conn.close()
    return True


def save_topology_edge(user_id: int, edge_data: dict):
    conn = get_db()
    cur = conn.cursor()
    edge_id = edge_data["id"]
    cur.execute("""
        INSERT OR REPLACE INTO topology_edges (id, user_id, source_id, target_id, label, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        edge_id,
        user_id,
        edge_data["source_id"],
        edge_data["target_id"],
        edge_data.get("label", ""),
        edge_data.get("status", "active"),
    ))
    conn.commit()
    conn.close()
    return True


def delete_topology_node(node_id: str, user_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM topology_nodes WHERE id = ? AND user_id = ?", (node_id, user_id))
    cur.execute("DELETE FROM topology_edges WHERE (source_id = ? OR target_id = ?) AND user_id = ?", (node_id, node_id, user_id))
    conn.commit()
    conn.close()
    return True


def delete_topology_edge(edge_id: str, user_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM topology_edges WHERE id = ? AND user_id = ?", (edge_id, user_id))
    conn.commit()
    conn.close()
    return True


def list_groups(user_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM device_groups WHERE user_id = ? ORDER BY id ASC", (user_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def add_group(user_id: int, name: str, description: str = ""):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO device_groups (user_id, name, description) VALUES (?, ?, ?)", (user_id, name, description))
    new_id = cur.lastrowid
    conn.commit()
    conn.close()
    return new_id


def list_history(user_id: int, limit: int = 50):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM connection_history WHERE user_id = ? ORDER BY id DESC LIMIT ?", (user_id, limit))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def log_remote_activity(user_id: int, device_id: int, device_name: str, session_type: str, target_address: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO remote_activities (user_id, device_id, device_name, session_type, target_address, status)
        VALUES (?, ?, ?, ?, ?, 'Terhubung')
    """, (user_id, device_id, device_name, session_type, target_address))
    new_id = cur.lastrowid
    conn.commit()
    conn.close()
    return new_id


def list_remote_activities(user_id: int, limit: int = 20):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM remote_activities WHERE user_id = ? ORDER BY id DESC LIMIT ?", (user_id, limit))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

