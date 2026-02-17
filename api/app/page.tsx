export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Meshtastic API</h1>
      <p>REST API for accessing Meshtastic mesh network data.</p>

      <h2>Available Endpoints</h2>
      <ul>
        <li><strong>Health Check:</strong> GET /api/health</li>
        <li><strong>Authentication:</strong>
          <ul>
            <li>POST /api/v1/auth/login</li>
            <li>POST /api/v1/auth/refresh</li>
            <li>POST /api/v1/auth/logout</li>
          </ul>
        </li>
        <li><strong>Coordinates:</strong>
          <ul>
            <li>GET /api/v1/coordinates</li>
            <li>GET /api/v1/coordinates/latest/:nodeId</li>
            <li>GET /api/v1/coordinates/history/:nodeId</li>
          </ul>
        </li>
        <li><strong>Nodes:</strong>
          <ul>
            <li>GET /api/v1/nodes</li>
            <li>GET /api/v1/nodes/:nodeId</li>
          </ul>
        </li>
        <li><strong>Messages:</strong>
          <ul>
            <li>GET /api/v1/messages</li>
          </ul>
        </li>
        <li><strong>Telemetry:</strong>
          <ul>
            <li>GET /api/v1/telemetry</li>
            <li>GET /api/v1/telemetry/latest/:nodeId</li>
          </ul>
        </li>
        <li><strong>Statistics:</strong>
          <ul>
            <li>GET /api/v1/stats/network</li>
            <li>GET /api/v1/stats/node/:nodeId</li>
          </ul>
        </li>
        <li><strong>Events:</strong>
          <ul>
            <li>GET /api/v1/events/recent</li>
          </ul>
        </li>
      </ul>

      <h2>Authentication</h2>
      <p>All endpoints (except /api/health and /api/v1/auth/login) require JWT authentication.</p>
      <p>Include the token in the Authorization header:</p>
      <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px' }}>
        Authorization: Bearer &lt;your-token&gt;
      </pre>

      <h2>Default Credentials</h2>
      <p><strong>Username:</strong> admin</p>
      <p><strong>Password:</strong> admin</p>
      <p style={{ color: 'red' }}><strong>⚠️ Change the default password immediately in production!</strong></p>

      <h2>Documentation</h2>
      <p>For full API documentation, see API_SPECIFICATION.md in the repository.</p>
    </main>
  );
}
