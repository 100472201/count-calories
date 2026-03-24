# Contador de Calorías con AI

Un contador de calorías diseñado para fases de volumen y uso diario, con una interfaz de chat conectada a una IA que calcula automáticamente los macronutrientes.

## Características Principales
- **Chat Asistido por IA**: Registra tus comidas hablando de forma natural y la IA estima las calorías.
- **Memoria de Sesión (Local Storage)**: Todos los registros del chat, macros e historial de alimentos se guardan automáticamente a nivel local en tu dispositivo (asociado al día actual). Puedes cerrar la ventana y, si vuelves el mismo día, recuperarás exactamente por dónde te quedaste.
- **Objetivos por Tipo de Día**: Permite cambiar entre Gym, Running, Escalada y Descanso, ajustando los objetivos calóricos.
- **Desayuno Fijo**: Un comando rápido ("desayuno fijo") para pre-cargar tu comida habitual.

## Backend Seguro (¡Novedad!)
Para no exponer la API Key de OpenRouter en el código visible del navegador (`index.html`), el proyecto ahora utiliza **Netlify Functions** (`netlify/functions/chat.js`). Esto significa que la web se comunica con un servidor intermedio propio que gestiona tus claves secretas y hace la petición real a la inteligencia artificial (`openrouter/free`).

---

## 💻 Desarrollo Local (Cómo usarlo en tu ordenador)

Dado que ahora la aplicación tiene un "backend" para la IA, ya no puedes simplemente abrir el archivo `index.html` con doble clic. Debes utilizar el entorno de desarrollo local y servidor de Netlify.

### 1. Requisitos Previos (Instalación local)
Al igual que en frameworks como Angular u otros entornos modernos, necesitas instalar la herramienta oficial de Netlify globalmente en tu PC para que emule el entorno de producción. Abre tu terminal y ejecuta:

```bash
npm install -g netlify-cli
```
*(Se requiere tener Node/npm instalado previamente).*

### 2. Configurar la API Key
Crea un archivo llamado `.env` en la misma carpeta donde está este `README.md` (no te preocupes, el archivo `.gitignore` ya está configurado para que nunca se suba a GitHub ni se haga público). 
Dentro del archivo `.env`, pega tu clave de OpenRouter así:
```text
OPENROUTER_API_KEY=tu_clave_secreta_aqui
```

### 3. Arrancar la Aplicación
Para levantar el sistema con las funciones corriendo en paralelo, abre la terminal en esta misma carpeta y ejecuta:

```bash
netlify dev
```

Esto levantará el simulador (usualmente en \`http://localhost:8888\` o \`http://localhost:3999\`), leerá tu \`.env\` automáticamente y abrirá tu navegador listo para funcionar. ¡A partir de ahí, el chat inteligente y la memoria persistente operarán de forma nativa!