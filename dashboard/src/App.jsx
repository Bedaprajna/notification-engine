import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function App() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ COMPLETED: 0, PENDING: 0, FAILED_DLQ: 0 });
  const [eventType, setEventType] = useState('ORDER_PLACED');
  const [channel, setChannel] = useState('EMAIL');
  const [recipient, setRecipient] = useState('fail@user.com');

  const fetchData = async () => {
    try {
      const [logsRes, metricsRes] = await Promise.all([
        axios.get('http://localhost:5003/api/logs'),
        axios.get('http://localhost:5003/api/metrics')
      ]);
      setLogs(logsRes.data);

      const counts = { COMPLETED: 0, PENDING: 0, FAILED_DLQ: 0 };
      metricsRes.data.forEach(m => { counts[m.status] = m.count; });
      setMetrics(counts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5003/api/events', {
      eventType,
      channel,
      recipient,
      payload: { orderId: Math.floor(Math.random() * 90000), amount: "$150.00" }
    });
    fetchData();
  };

  const handleRetry = async (id) => {
    await axios.post(`http://localhost:5003/api/logs/${id}/retry`);
    fetchData();
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '2.5rem', backgroundColor: '#0f172a', color: '#f8fafc', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#38bdf8' }}>Multi-Channel Notification Dashboard</h1>
        <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>Asynchronous Queue Engine Telemetry & DLQ Replay Control</p>
      </header>

      {/* Health Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Processed</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.25rem' }}>{logs.length}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #059669' }}>
          <div style={{ color: '#34d399', fontSize: '0.875rem' }}>Completed</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.25rem', color: '#34d399' }}>{metrics.COMPLETED || 0}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #d97706' }}>
          <div style={{ color: '#fbbf24', fontSize: '0.875rem' }}>In Queue / Processing</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.25rem', color: '#fbbf24' }}>{metrics.PENDING || 0}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #dc2626' }}>
          <div style={{ color: '#f87171', fontSize: '0.875rem' }}>Dead Letter Queue (DLQ)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.25rem', color: '#f87171' }}>{metrics.FAILED_DLQ || 0}</div>
        </div>
      </div>

      {/* Dispatch Event Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #334155' }}>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569' }}>
          <option value="ORDER_PLACED">ORDER_PLACED</option>
          <option value="PASSWORD_RESET">PASSWORD_RESET</option>
        </select>

        <select value={channel} onChange={(e) => setChannel(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569' }}>
          <option value="EMAIL">EMAIL</option>
          <option value="WEBHOOK">WEBHOOK</option>
          <option value="SMS">SMS</option>
        </select>

        <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient (Use 'fail' to test DLQ)" style={{ padding: '0.6rem 1rem', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569', flex: '1', minWidth: '260px' }} />

        <button type="submit" style={{ padding: '0.6rem 1.5rem', borderRadius: '6px', backgroundColor: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Dispatch Event</button>
      </form>

      {/* Live Logs Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Live Telemetry Logs</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Event</th>
              <th style={{ padding: '1rem' }}>Channel</th>
              <th style={{ padding: '1rem' }}>Recipient</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Attempts</th>
              <th style={{ padding: '1rem' }}>Error Log</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '1rem' }}>{log.id}</td>
                <td style={{ padding: '1rem', fontWeight: '600' }}>{log.event_type}</td>
                <td style={{ padding: '1rem' }}>{log.channel}</td>
                <td style={{ padding: '1rem', color: '#cbd5e1' }}>{log.recipient}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '4px', 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    backgroundColor: log.status === 'COMPLETED' ? '#059669' : log.status === 'FAILED_DLQ' ? '#dc2626' : '#d97706', 
                    color: '#fff' 
                  }}>
                    {log.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{log.attempts}/{log.max_attempts}</td>
                <td style={{ padding: '1rem', color: '#f87171', fontSize: '0.85rem' }}>{log.error_message || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  {log.status === 'FAILED_DLQ' && (
                    <button onClick={() => handleRetry(log.id)} style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', backgroundColor: '#d97706', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Re-queue</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}