// netlify/functions/claude.js
// Proxy seguro — compatible con Node 14, 16, 18+

const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = JSON.parse(event.body);

    // Usar https nativo de Node (sin fetch, funciona en cualquier versión)
    const data = await new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 1000,
        messages: body.messages,
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch(e) { reject(new Error('Respuesta inválida de la API')); }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    if (data.status !== 200) {
      return {
        statusCode: data.status,
        headers: CORS,
        body: JSON.stringify({ error: data.body?.error?.message || 'Error de API' }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(data.body),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
