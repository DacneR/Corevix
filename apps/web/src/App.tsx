import { useEffect, useState } from 'react';

interface Device {
  id: string;
  ip: string;
  mac: string | null;
  hostname: string | null;
  vendor: string | null;
  lastSeen: string;
}

interface EventLog {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

const API_BASE = 'http://127.0.0.1:8000/api';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [status, setStatus] = useState('Conectando...');

  const loadDevices = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices`);
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus('API no disponible');
      setDevices([]);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/events`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      setEvents([]);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadDevices(), loadEvents()]);
  };

  useEffect(() => {
    refreshAll();

    const socket = new WebSocket('ws://127.0.0.1:8000/api/ws');

    socket.onopen = () => {
      setStatus('Tiempo real activo');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'devices:update') {
        setDevices(Array.isArray(message.payload) ? message.payload : []);
      }
      if (message.type === 'event:new') {
        setEvents((prev) => [message.payload, ...prev].slice(0, 10));
      }
      if (message.type === 'status') {
        setStatus(message.message);
      }
    };

    socket.onerror = () => {
      setStatus('WebSocket no disponible');
    };

    socket.onclose = () => {
      setStatus('Sin conexión en tiempo real');
    };

    return () => socket.close();
  }, []);

  const runScan = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: '192.168.1.0' }),
      });
      const data = await res.json();
      if (Array.isArray(data.devices)) {
        setDevices(data.devices);
      }
      await loadEvents();
    } catch (error) {
      setStatus('No se pudo ejecutar el escaneo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">Corevix</p>
            <h1 className="text-3xl font-bold">Network Monitor</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              {status}
            </span>
            <button
              className="rounded bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400"
              onClick={runScan}
            >
              Escanear red
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Dispositivos</p>
            <p className="mt-2 text-3xl font-bold">{devices.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Estado</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">Online</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Tiempo real</p>
            <p className="mt-2 text-3xl font-bold text-violet-400">WS</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-4 py-3 font-semibold">Dispositivos detectados</div>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Hostname</th>
                  <th className="px-4 py-3">MAC</th>
                  <th className="px-4 py-3">Fabricante</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-t border-slate-800">
                    <td className="px-4 py-3">{device.ip}</td>
                    <td className="px-4 py-3">{device.hostname ?? '—'}</td>
                    <td className="px-4 py-3">{device.mac ?? '—'}</td>
                    <td className="px-4 py-3">{device.vendor ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 font-semibold">Eventos recientes</div>
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="rounded border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs uppercase tracking-wide text-cyan-400">{event.type}</div>
                  <div className="mt-1 text-sm">{event.message}</div>
                  <div className="mt-2 text-[10px] text-slate-500">{new Date(event.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
