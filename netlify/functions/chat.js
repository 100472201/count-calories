exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    const { messages, system_prompt, day_label } = JSON.parse(event.body || '{}');

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!geminiApiKey && !openrouterApiKey) {
      return jsonResponse(500, {
        error: 'Falta configurar GEMINI_API_KEY o OPENROUTER_API_KEY en Netlify'
      });
    }

    // 1) Intentar primero con Gemini
    if (geminiApiKey) {
      console.log('[Gemini] Intentando conectar con Gemini...');
      try {
        const geminiResult = await callGemini({
          apiKey: geminiApiKey,
          systemPrompt: system_prompt,
          dayLabel: day_label,
          messages
        });

        return jsonResponse(200, {
          choices: [
            {
              message: {
                content: geminiResult.text
              }
            }
          ],
          used_model: geminiResult.model,
          provider: 'gemini'
        });
      } catch (err) {
        console.error('[Gemini] Error:', err.message);
      }
    }

    // 2) Fallback opcional a OpenRouter
    if (openrouterApiKey) {
      console.log('[OpenRouter] Fallback activado...');
      try {
        const openrouterResult = await callOpenRouter({
          apiKey: openrouterApiKey,
          systemPrompt: system_prompt,
          dayLabel: day_label,
          messages
        });

        return jsonResponse(200, {
          ...openrouterResult,
          provider: 'openrouter'
        });
      } catch (err) {
        console.error('[OpenRouter] Error:', err.message);
        return jsonResponse(502, {
          error: 'Fallaron Gemini y OpenRouter',
          details: err.message
        });
      }
    }

    return jsonResponse(502, {
      error: 'Gemini falló y no hay fallback disponible'
    });

  } catch (error) {
    return jsonResponse(500, {
      error: error.message || 'Error interno en la función Serverless'
    });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

async function callGemini({ apiKey, systemPrompt, dayLabel, messages }) {
  const model = 'gemini-2.5-flash';

  const contents = convertChatHistoryToGeminiContents(messages);

  const body = {
    systemInstruction: {
      parts: [
        {
          text: `${systemPrompt}\n\nDÍA ACTUAL: ${dayLabel}`
        }
      ]
    },
    contents,
    generationConfig: {
      temperature: 0.2
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg =
        data?.error?.message ||
        `Gemini HTTP ${response.status}`;
      throw new Error(msg);
    }

    const text = extractGeminiText(data);

    if (!text) {
      throw new Error('Gemini no devolvió texto utilizable');
    }

    return { text, model };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function convertChatHistoryToGeminiContents(messages) {
  const safeMessages = Array.isArray(messages) ? messages : [];

  return safeMessages
    .filter(msg => msg && typeof msg.content === 'string' && msg.content.trim())
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
}

function extractGeminiText(data) {
  const candidates = data?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';

  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';

  return parts
    .map(part => part?.text || '')
    .join('')
    .trim();
}

async function callOpenRouter({ apiKey, systemPrompt, dayLabel, messages }) {
  const models = [
    'openrouter/free',
    'z-ai/glm-4.5-air:free',
    'stepfun/step-3.5-flash:free'
  ];

  let lastError = null;

  for (const model of models) {
    console.log(`[OpenRouter] Intentando conectar con modelo: ${model}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://count-calories-ale.netlify.app',
          'X-Title': 'Count Calories AI'
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}\n\nDÍA ACTUAL: ${dayLabel}`
            },
            ...(Array.isArray(messages) ? messages : [])
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        lastError = `${model}: ${data?.error?.message || `HTTP ${response.status}`}`;
        continue;
      }

      return {
        ...data,
        used_model: model
      };
    } catch (err) {
      lastError = `${model}: ${err.message}`;
    }
  }

  throw new Error(lastError || 'Todos los modelos de OpenRouter fallaron');
}