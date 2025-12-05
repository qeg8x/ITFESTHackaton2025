/**
 * Health check скрипт для Docker
 */

const PORT = Deno.env.get('PORT') ?? '8000';

try {
  const response = await fetch(`http://localhost:${PORT}/api/debug?action=health`, {
    signal: AbortSignal.timeout(5000),
  });
  
  if (response.ok) {
    const data = await response.json();
    if (data.status === 'healthy') {
      console.log('✅ Health check passed');
      Deno.exit(0);
    }
  }
  
  console.error('❌ Health check failed: unhealthy status');
  Deno.exit(1);
} catch (err) {
  console.error('❌ Health check failed:', err);
  Deno.exit(1);
}
