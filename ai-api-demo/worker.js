/**
 * AI API Proxy — Cloudflare Worker
 *
 * 前端 → Worker → OpenAI / DeepSeek
 * API Key 存于 Worker 环境变量或 .dev.vars 中，前端不可见。
 *
 * 部署:
 *   1. npx wrangler deploy
 *   2. Cloudflare Dashboard > Workers > Settings > Secrets:
 *        OPENAI_API_KEY, DEEPSEEK_API_KEY
 *   3. 将 Worker URL 填入前端页面的 API Endpoint
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders() });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

async function handleChat(request, env) {
  try {
    const body = await request.json();
    const { provider, model, messages, temperature, max_tokens, stream } = body;

    if (!provider || !model || !messages || messages.length === 0) {
      return json({ error: 'Missing required fields: provider, model, messages' }, 400);
    }

    switch (provider) {
      case 'openai':
        return callOpenAI(env, model, messages, temperature, max_tokens, stream, 'https://api.openai.com/v1/chat/completions');
      case 'deepseek':
        return callOpenAI(env, model, messages, temperature, max_tokens, stream, 'https://api.deepseek.com/v1/chat/completions');
      default:
        return json({ error: 'Unsupported provider: ' + provider }, 400);
    }
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// ── OpenAI / OpenAI-compatible (DeepSeek) ──
async function callOpenAI(env, model, messages, temperature, max_tokens, stream, baseUrl) {
  const apiKey = baseUrl.includes('deepseek') ? env.DEEPSEEK_API_KEY : env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: 'API key not configured for this provider' }, 500);

  const reqBody = {
    model,
    messages,
    temperature: temperature ?? 0.7,
    max_tokens: max_tokens || 4096,
    stream: stream || false
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  let res;
  try {
    res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(reqBody),
      signal: controller.signal
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      return json({ error: 'Upstream API timeout (25s). Check model name or network.' }, 504);
    }
    return json({ error: 'Fetch error: ' + e.message }, 502);
  }
  clearTimeout(timer);

  if (!res.ok) {
    const err = await res.text();
    return json({ error: 'API error (' + res.status + '): ' + err }, res.status);
  }

  if (stream) {
    return streamOpenAI(res);
  }

  const data = await res.json();
  return json({
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage ? {
      input_tokens: data.usage.prompt_tokens,
      output_tokens: data.usage.completion_tokens
    } : null
  });
}

// ── SSE normalization for OpenAI-compatible streams ──
// Upstream format:
//   data: {"choices":[{"delta":{"content":"hello"}}]}
//   data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{...}}
//   data: [DONE]
//
// Normalized output:
//   data: {"content":"hello"}
//   data: {"content":"","usage":{"input_tokens":10,"output_tokens":20}}
//   data: [DONE]
function streamOpenAI(upstreamRes) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const reader = upstreamRes.body.getReader();
  let buffer = '';

  function emit(obj) {
    writer.write(encoder.encode('data: ' + JSON.stringify(obj) + '\n\n'));
  }

  function processChunk(chunk) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') {
        emit({ content: '', done: true });
        continue;
      }
      try {
        const json = JSON.parse(payload);
        const choice = json.choices?.[0];
        if (!choice) continue;
        const delta = choice.delta || {};
        const content = delta.content || '';

        const result = { content };
        if (json.usage) {
          result.usage = {
            input_tokens: json.usage.prompt_tokens,
            output_tokens: json.usage.completion_tokens
          };
        }
        emit(result);
      } catch (e) {
        // skip malformed JSON lines
      }
    }
  }

  function pump() {
    reader.read().then(({ done, value }) => {
      if (done) {
        // flush remaining buffer
        if (buffer.startsWith('data: ') && buffer.slice(6).trim() !== '[DONE]') {
          try {
            const json = JSON.parse(buffer.slice(6).trim());
            const choice = json.choices?.[0];
            if (choice) {
              const content = choice.delta?.content || '';
              const result = { content };
              if (json.usage) {
                result.usage = {
                  input_tokens: json.usage.prompt_tokens,
                  output_tokens: json.usage.completion_tokens
                };
              }
              emit(result);
            }
          } catch (e) { /* skip */ }
        }
        writer.close();
        return;
      }
      processChunk(value);
      pump();
    }).catch(() => writer.close());
  }
  pump();

  return new Response(readable, {
    headers: { ...corsHeaders(), 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
  });
}
