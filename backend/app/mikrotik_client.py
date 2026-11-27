import socket
import threading
import asyncio
import time
import re
from typing import Optional, Dict, Any

try:
    import paramiko
except ImportError:
    paramiko = None

try:
    import routeros_api
except ImportError:
    routeros_api = None


def test_tcp_port(host: str, port: int, timeout: float = 1.5) -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def probe_router(host: str, api_port: int = 8728, ssh_port: int = 22, winbox_port: int = 8291) -> Dict[str, Any]:
    api_ok = test_tcp_port(host, api_port)
    ssh_ok = test_tcp_port(host, ssh_port)
    winbox_ok = test_tcp_port(host, winbox_port)
    online = api_ok or ssh_ok or winbox_ok

    return {
        "online": online,
        "api_port": api_ok,
        "ssh_port": ssh_ok,
        "winbox_port": winbox_ok,
    }


def _format_uptime(raw_uptime: str) -> str:
    """Convert RouterOS uptime like '1w2d5h44m10s' into readable Indonesian string."""
    if not raw_uptime:
        return "0 mnt"
    weeks = re.search(r"(\d+)w", raw_uptime)
    days = re.search(r"(\d+)d", raw_uptime)
    hours = re.search(r"(\d+)h", raw_uptime)
    mins = re.search(r"(\d+)m", raw_uptime)
    total_days = (int(weeks.group(1)) * 7 if weeks else 0) + (int(days.group(1)) if days else 0)
    parts = []
    if total_days:
        parts.append(f"{total_days} hari")
    if hours:
        parts.append(f"{int(hours.group(1))} jam")
    if mins:
        parts.append(f"{int(mins.group(1))} mnt")
    return " ".join(parts) if parts else raw_uptime


def fetch_mikrotik_resource_detailed(
    host: str,
    port: int = 8728,
    username: str = "admin",
    password: str = "",
) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Query /system/resource and /system/identity from MikroTik RouterOS API. Returns (data, error)."""
    if not routeros_api or not host:
        return None, "library routeros_api tidak tersedia atau host kosong"

    last_err = None
    attempts = [
        {"plaintext": True, "use_ssl": False},
        {"plaintext": False, "use_ssl": False},
        {"plaintext": True, "use_ssl": True},
    ]
    for opt in attempts:
        pool = None
        try:
            pool = routeros_api.RouterOsApiPool(
                host,
                username=username or "admin",
                password=password or "",
                port=int(port or 8728),
                plaintext_login=opt["plaintext"],
                use_ssl=opt["use_ssl"],
                ssl_verify=False,
            )
            api = pool.get_api()
            res_list = api.get_resource("/system/resource").get()
            if not res_list:
                continue
            res = res_list[0]

            identity_name = None
            try:
                id_list = api.get_resource("/system/identity").get()
                if id_list:
                    identity_name = id_list[0].get("name")
            except Exception:
                pass

            total_mem = int(res.get("total-memory") or 0)
            free_mem = int(res.get("free-memory") or 0)
            ram_pct = round(((total_mem - free_mem) / total_mem) * 100) if total_mem > 0 else 0

            total_hdd = int(res.get("total-hdd-space") or 0)
            free_hdd = int(res.get("free-hdd-space") or 0)
            disk_pct = round(((total_hdd - free_hdd) / total_hdd) * 100) if total_hdd > 0 else 0

            board_name = res.get("board-name") or res.get("platform") or "MikroTik Router"
            return {
                "model": board_name,
                "board_name": board_name,
                "platform": res.get("platform", ""),
                "architecture": res.get("architecture-name", ""),
                "routeros_version": res.get("version", "7.x"),
                "uptime": _format_uptime(res.get("uptime", "")),
                "cpu_load": int(res.get("cpu-load") or 0),
                "ram_usage": max(0, min(100, ram_pct)),
                "disk_usage": max(0, min(100, disk_pct)),
                "identity": identity_name,
            }, None
        except Exception as exc:
            last_err = str(exc)
            continue
        finally:
            if pool:
                try:
                    pool.disconnect()
                except Exception:
                    pass
    return None, last_err


def fetch_mikrotik_resource(
    host: str,
    port: int = 8728,
    username: str = "admin",
    password: str = "",
) -> Optional[Dict[str, Any]]:
    data, _ = fetch_mikrotik_resource_detailed(host, port=port, username=username, password=password)
    return data


ROUTEROS_BANNER = """
  MMM      MMM       KKK                          TTTTTTTTTTT      KKK
  MMMM    MMMM       KKK                          TTTTTTTTTTT      KKK
  MMM MMMM MMM  III  KKK  KKK  RRRRRR     OOOOOO      TTT     III  KKK  KKK
  MMM  MM  MMM  III  KKKKK     RRR  RRR  OOO  OOO     TTT     III  KKKKK
  MMM      MMM  III  KKK KKK   RRRRRR    OOO  OOO     TTT     III  KKK KKK
  MMM      MMM  III  KKK  KKK  RRR  RRR   OOOOOO      TTT     III  KKK  KKK

  MikroTik RouterOS 7.21.4 (c) 1999-2026       https://www.mikrotik.com/

Press F1 for help

"""

class SimulatedMikrotikShell:
    """Fallback interactive RouterOS shell when actual router SSH is not connected."""
    def __init__(self, router_name: str = "MikroTik"):
        self.router_name = router_name
        self.prompt = f"[{router_name}] > "
        self.buffer = ""

    def get_banner(self) -> str:
        return ROUTEROS_BANNER + f"[{self.router_name}] > "

    def handle_input(self, data: str) -> str:
        if data == "\r" or data == "\n":
            cmd = self.buffer.strip()
            self.buffer = ""
            resp = "\r\n"
            if cmd == "help" or cmd == "?":
                resp += "Available commands:\r\n  system resource print\r\n  interface print\r\n  ip address print\r\n  ping <host>\r\n  quit\r\n"
            elif cmd == "system resource print":
                resp += "                   uptime: 10d5h44m12s\r\n                  version: 7.21.4 (long-term)\r\n               build-time: Nov/12/2026 14:10:00\r\n              free-memory: 812.4MiB\r\n             total-memory: 1024.0MiB\r\n                      cpu: ARM\r\n                cpu-count: 4\r\n            cpu-frequency: 1400MHz\r\n                 cpu-load: 15%\r\n           free-hdd-space: 412.0MiB\r\n          total-hdd-space: 512.0MiB\r\n"
            elif cmd == "interface print":
                resp += "Flags: D - DYNAMIC; X - DISABLED; R - RUNNING; S - SLAVE\r\nColumns: NAME, TYPE, ACTUAL-MTU, MAC-ADDRESS\r\n#    NAME      TYPE   ACTUAL-MTU  MAC-ADDRESS\r\n0 R  ether1    ether        1500  48:8F:5A:11:22:33\r\n1 R  ether2    ether        1500  48:8F:5A:11:22:34\r\n2 R  ether3    ether        1500  48:8F:5A:11:22:35\r\n3 R  sfp-sfpplus1 ether     1500  48:8F:5A:11:22:36\r\n"
            elif cmd == "ip address print":
                resp += "Flags: D - DYNAMIC\r\nColumns: ADDRESS, NETWORK, INTERFACE\r\n#   ADDRESS          NETWORK        INTERFACE\r\n0   192.168.88.1/24  192.168.88.0   ether2\r\n1 D 10.10.10.25/24   10.10.10.0     ether1\r\n"
            elif cmd.startswith("ping"):
                target = cmd.split()[1] if len(cmd.split()) > 1 else "8.8.8.8"
                resp += f"  SEQ HOST                                     SIZE TTL TIME  STATUS\r\n    0 {target}                                 56  57 12ms\r\n    1 {target}                                 56  57 11ms\r\n    2 {target}                                 56  57 13ms\r\n    sent=3 received=3 packet-loss=0% min-rtt=11ms avg-rtt=12ms max-rtt=13ms\r\n"
            elif cmd == "":
                pass
            else:
                resp += f"bad command name {cmd} (line 1 column 1)\r\n"
            resp += f"[{self.router_name}] > "
            return resp
        elif data == "\x7f" or data == "\x08":  # Backspace
            if self.buffer:
                self.buffer = self.buffer[:-1]
                return "\b \b"
            return ""
        else:
            self.buffer += data
            return data

