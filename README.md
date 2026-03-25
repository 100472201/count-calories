# Contador de Calorías con IA

Aplicación web personal orientada a una fase de volumen muscular. Permite registrar comidas y bebidas en lenguaje natural, estimar macronutrientes con ayuda de IA y llevar un seguimiento diario adaptado al tipo de día y al movimiento.

## Qué hace la app

- **Registro natural de ingestas**: si escribes algo que has comido o bebido, la app lo interpreta como un registro sin necesidad de decir “añádelo” o “regístralo”.
- **Estimación automática de macros**: calcula kcal, proteína, carbohidratos y grasas.
- **Suma diaria automática**: cada ingesta se añade al total real del día.
- **Objetivos por tipo de día**: adapta el target según la actividad.
- **Ajuste conservador por pasos**: los pasos pueden mover ligeramente el objetivo, pero solo cuando la diferencia es suficientemente relevante.
- **Asistente práctico para rellenar carbohidratos**: propone opciones realistas y alineadas con la alimentación habitual del usuario.
- **Memoria local diaria**: chat, macros e historial se guardan localmente para retomar el día donde lo dejaste.

## Perfil y enfoque del proyecto

La app está pensada para un usuario con objetivo de **volumen pre-verano**, buscando ganar peso de forma controlada sin complicar la experiencia con microajustes absurdos.

Prioridades principales:
- ganar aproximadamente **0,3 kg/semana**
- mantener una proteína objetivo cercana a **160 g/día**
- priorizar la **hipertrofia del tren superior**
- compatibilizar gimnasio con running, escalada y tenis

## Tipos de día disponibles

Actualmente la app contempla estos tipos de día:

- **Gym fuerza**
- **Running**
- **Escalada**
- **Descanso**
- **Tenis**

`Tenis` ya está integrado como un día deportivo intermedio, con objetivos cercanos a running y escalada.

## Desayuno fijo oficial

Si el usuario escribe expresiones como **“desayuno fijo”**, **“mi desayuno de siempre”** o similares, deben usarse **exactamente** estos valores:

### Desayuno 1
- Avena 40g → 140 kcal | P: 5g | C: 24g | G: 2.5g
- Yogur griego 111g → 108 kcal | P: 10g | C: 4.4g | G: 5.5g
- Arándanos 15g → 8 kcal | P: 0g | C: 2g | G: 0g
- Frutos secos 30g → 185 kcal | P: 5g | C: 6g | G: 16g
- Miel 20g → 60 kcal | P: 0g | C: 16g | G: 0g
- Leche 250ml → 120 kcal | P: 8g | C: 12g | G: 4.5g

**Subtotal:** 621 kcal | P: 28g | C: 64g | G: 28.5g

### Segundo desayuno
- Pan integral 90g → 215 kcal | P: 7g | C: 40g | G: 2g
- Queso 20g → 70 kcal | P: 4g | C: 0g | G: 6g
- Jamón york 40g → 50 kcal | P: 7g | C: 1g | G: 1.5g
- Aceite de oliva 10g → 88 kcal | P: 0g | C: 0g | G: 10g
- Aguacate 40g → 64 kcal | P: 0.8g | C: 3g | G: 5.5g
- Manzana 150g → 75 kcal | P: 0.3g | C: 19g | G: 0.2g

**Subtotal:** 562 kcal | P: 19g | C: 63g | G: 25g

### Total desayuno fijo
- **1183 kcal**
- **47g proteína**
- **127g carbohidratos**
- **53.5g grasas**

> Importante: no usar valores antiguos ni estimaciones alternativas para este desayuno.

## Regla clave de registro

La app debe interpretar automáticamente como **registro** cualquier mensaje donde el usuario diga algo que ha comido o bebido.

Ejemplos que sí deberían registrarse:
- “me he tomado un batido de proteínas”
- “he comido arroz con pollo y un yogur”
- “un café con leche y una tostada”

Solo **no** se registra si el mensaje es claramente teórico o general.

## Formato de respuesta del modelo cuando hay ingesta

Cuando se detecta una ingesta, el modelo debe responder en español, de forma breve y natural, y añadir **siempre** al final este bloque:

```text
<<<MACROS>>>
{"kcal": NUMBER, "prot": NUMBER, "carbs": NUMBER, "fat": NUMBER, "label": "nombre corto"}
<<<END>>>
```

### Reglas del bloque
- es obligatorio si hay ingesta
- solo debe aparecer una vez
- debe ir al final de la respuesta
- dentro del bloque debe haber solo JSON válido
- si el usuario menciona varios alimentos, devolver el total combinado
- si la consulta es general, no incluir el bloque

## Lógica de pasos diarios

La referencia base es:

- **8000 pasos/día**

Fórmula base:

```text
ajuste = ((steps - 8000) / 1000) * 35
```

Pero ese ajuste **solo se aplica** al objetivo real si supera **±100 kcal**.

### Interpretación
- diferencias pequeñas → solo **estimación informativa**
- diferencias relevantes → **ajuste aplicado** al target

### Ejemplos
- 6500 pasos → ajuste bruto ≈ -52 kcal → **no aplicado**
- 8500 pasos → ajuste bruto ≈ +18 kcal → **no aplicado**
- 12000 pasos → ajuste bruto ≈ +140 kcal → **sí aplicado**
- 4000 pasos → ajuste bruto ≈ -140 kcal → **sí aplicado**

La lógica es deliberadamente conservadora para evitar microgestión y decisiones absurdas por ruido de estimación.

## Guía personalizada para rellenar carbohidratos

Cuando el usuario pregunte cómo llegar a carbohidratos, cómo subir hidratos o cómo rellenar calorías priorizando carbos, la app debe priorizar esta guía antes que recomendaciones genéricas.

### Fuentes densas
- Arroz blanco cocido 200g → ~52g C, ~260 kcal
- Pasta cocida 200g → ~50g C, ~260 kcal
- Patata cocida/asada 200g → ~34g C, ~160 kcal
- Boniato 200g → ~40g C, ~180 kcal
- Pan integral 60g → ~28g C, ~145 kcal
- Avena seca 60g → ~38g C, ~220 kcal

### Fuentes rápidas
- Plátano grande (~130g) → ~30g C
- Mango 150g → ~23g C
- Dátiles 4–5 uds (~40g) → ~30g C
- Zumo naranja 250ml → ~25g C
- Miel extra 20g → ~16g C

### Fuentes escalables que ya usa
- Avena: de 40g a 80g → +24g C
- Pan integral: +60g → +28g C
- Manzana: pasar de 1 a 2 unidades → +19g C

### Reglas de recomendación
- **Comida/cena** → priorizar arroz, pasta, patata o boniato
- **Pre-entreno** → priorizar plátano, dátiles, zumo o miel
- **Snacks/meriendas** → priorizar pan + fruta o similares
- priorizar siempre opciones realistas y compatibles con la dieta habitual del usuario

## Stack actual

- **Frontend**: `index.html` con lógica en JavaScript vanilla
- **Backend**: Netlify Function en `/.netlify/functions/chat`
- **Proveedor principal de IA**: **Gemini** mediante `GEMINI_API_KEY`
- **Fallback opcional**: OpenRouter, solo si se quiere mantener como respaldo

## Seguridad

La API key **no** debe exponerse en el frontend. La web debe hablar con un endpoint backend o serverless que actúe como intermediario con el proveedor de IA.

## Desarrollo local

Como la app usa backend para la IA, no basta con abrir `index.html` con doble clic. Debe arrancarse con el entorno de Netlify.

### 1. Requisitos previos

Tener instalado Node.js y luego instalar Netlify CLI:

```bash
npm install -g netlify-cli
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con la clave principal de Gemini:

```text
GEMINI_API_KEY=tu_clave_secreta_aqui
```

Si quieres mantener OpenRouter como fallback opcional, puedes añadir también:

```text
OPENROUTER_API_KEY=tu_clave_opcional_aqui
```

### 3. Arrancar en local

```bash
netlify dev
```

Netlify levantará el frontend y las funciones localmente, normalmente en una URL tipo `http://localhost:8888`.

## Flujo recomendado de ramas y despliegue

Para evitar consumir créditos innecesarios en Netlify:

- **`main`** → rama de producción
- **`dev`** → rama de trabajo y pruebas

Flujo recomendado:
1. trabajar en `dev`
2. probar cambios en preview o branch deploy
3. hacer merge a `main` solo cuando realmente quieras publicar

Esto ayuda a no gastar créditos de producción por cada cambio pequeño.

## Objetivo de comportamiento del asistente

El asistente de la app debe ser:

- breve
- claro
- práctico
- consistente con el estado real del día
- respetuoso con el diseño actual de la interfaz

No debe inventar comidas, no debe usar versiones antiguas del desayuno fijo y no debe romper la estética salvo que se pida explícitamente.
