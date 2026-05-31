// netlify/functions/claude.js
// Proxy seguro — compatible con Node 14, 16, 18+

const https = require('https');

const API_KEY = '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';

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

    const payload = JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: body.max_tokens || 1000,
      messages: body.messages,
    });

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch(e) {
            reject(new Error('Respuesta invalida: ' + raw.slice(0, 200)));
          }
        });
      });

      req.on('error', (e) => reject(new Error('Error de red: ' + e.message)));
      req.write(payload);
      req.end();
    });

    if (data.status !== 200) {
      return {
        statusCode: data.status,
        headers: CORS,
        body: JSON.stringify({ error: data.body?.error?.message || 'Error de API: ' + JSON.stringify(data.body) }),
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
