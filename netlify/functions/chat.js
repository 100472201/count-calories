exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Falta configurar OPENROUTER_API_KEY en las variables de entorno de Netlify'
      })
    };
  }

  try {
    const { messages, system_prompt, day_label } = JSON.parse(event.body || '{}');

    const models = [
      'stepfun/step-3.5-flash:free',
      'z-ai/glm-4.5-air:free',
      'openrouter/free',
      'nvidia/nemotron-3-super-120b-a12b:free'
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
                content: `${system_prompt}\n\nDÍA ACTUAL: ${day_label}`
              },
              ...messages
            ]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          lastError = `${model}: ${data.error?.message || `HTTP ${response.status}`}`;
          continue;
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            used_model: model
          })
        };
      } catch (err) {
        lastError = `${model}: ${err.message}`;
      }
    }

    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Todos los modelos gratuitos fallaron',
        details: lastError
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Error interno en la función Serverless'
      })
    };
  }
};