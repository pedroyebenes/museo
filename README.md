# Museo Virtual

Museo de arte en **primera persona** en el navegador: recorre un hall central (rotonda), salas por categoría y salas dedicadas a cada autor, con cuadros a escala real y fichas informativas al mirar las obras.

El catálogo es **estático** (JSON en `public/`); no hay backend ni base de datos.

## Características principales

| Área | Descripción |
|------|-------------|
| **Recorrido 3D** | Movimiento tipo FPS (ratón + WASD/flechas en escritorio; controles táctiles en móvil). |
| **Hall principal** | Rotonda con una puerta por categoría; el orden lo define `public/catalog/index.json`. |
| **Salas por categoría** | Rotondas intermedias con una puerta por autor y vuelta al hall principal. |
| **Salas por autor** | Cada autor tiene una sala rectangular; los cuadros se colocan en las paredes norte, este y oeste. |
| **Escala real** | Si el cuadro incluye `dimensions` (cm), el lienzo y el tamaño de la sala se calculan a partir de esas medidas. |
| **Placas biográficas** | Cada archivo de autor incluye la biografía que se muestra en la sala. |
| **HUD e información** | Panel de sala (autor, número de obras) y ficha del cuadro (título, autor, año, descripción) al enfocar una obra. Tecla **H** para mostrar/ocultar la ficha. |
| **Reportar errores** | Tecla **R** en escritorio o botón táctil (arriba a la derecha) y enlace en la ficha del cuadro; abre un issue en GitHub con contexto del cuadro o sala de autor. |
| **Carga progresiva** | Al entrar en una sala por primera vez, barra de progreso mientras se descargan las texturas. |
| **Calidad adaptativa** | Perfil distinto en móvil (menos antialiasing, texturas hasta 1024 px) y en escritorio (hasta 2048 px). |

## Stack tecnológico

- **[Vite](https://vitejs.dev/)** 5 — bundler y servidor de desarrollo
- **[Three.js](https://threejs.org/)** 0.160 — escena 3D (ES modules, `"type": "module"` en `package.json`)
- **Catálogo** — `public/catalog/index.json` y `public/catalog/authors/*.json`
- **Código fuente** — `src/` (`main.js`, `museum.js`, `scene.js`, `roomManager.js`, etc.)

---

## Requisitos

| Herramienta | Versión recomendada |
|-------------|---------------------|
| **Node.js** | LTS **20+** (o 22 LTS) |
| **npm** | Incluido con Node (npm 10+ habitual en Node 20+) |

Comprueba tu versión:

```bash
node -v
npm -v
```

---

## Desarrollo local

### 1. Clonar e instalar dependencias

```bash
git clone <URL-del-repositorio> museo
cd museo
npm install
```

### 2. Arrancar el servidor de desarrollo

```bash
npm run dev
```

Por defecto Vite escucha en **http://localhost:5173** (puerto configurable con la variable de entorno `PORT`; ver `vite.config.js`). El servidor se enlaza a `0.0.0.0`, así que también es accesible desde otros dispositivos en la red local.

```bash
PORT=3000 npm run dev
```

### 3. Controles (resumen)

- **Escritorio:** WASD o flechas, ratón para mirar, Mayús para correr, **H** para la ficha del cuadro, **M** para el catálogo, **R** para reportar un error, **Esc** para liberar el cursor.
- **Móvil:** mitad izquierda para moverse, mitad derecha para mirar; botones con iconos de correr, información y reportar en pantalla; catálogo arriba a la izquierda.

---

## Build de producción

Genera los archivos estáticos en `dist/`:

```bash
npm run build
```

**No edites `dist/` a mano** — se regenera en cada build.

### Vista previa local (smoke test)

Sirve la carpeta `dist/` con el servidor de preview de Vite:

```bash
npm run preview
```

Por defecto usa el mismo puerto que en desarrollo (**5173**, o el valor de `PORT`). Para forzar otro puerto:

```bash
PORT=3000 npm run preview
```

En producción real se recomienda un servidor estático dedicado (`serve`, **nginx**, etc.) en lugar de depender de `vite preview`.

---

## Despliegue persistente en producción

Tras `npm run build`, el sitio es **solo archivos estáticos** en `dist/`. Elige una de las opciones siguientes. En todos los ejemplos se asume:

- Ruta del proyecto: `/ruta/a/museo`
- Puerto HTTP: **3000** (ajústalo si hace falta)
- Usuario de despliegue en Linux: `deploy` (cámbialo por tu usuario)

### Preparación común (macOS y Linux)

```bash
cd /ruta/a/museo
git pull
npm install
npm run build
```

Instala un servidor estático global si usas `serve` (opcional; también funciona con `npx`):

```bash
npm install -g serve
```

Alternativa sin instalación global:

```bash
npx serve -s dist -l 3000
```

- `-s` — modo SPA: reescribe rutas al `index.html` (útil si enlazas rutas del cliente).
- `-l 3000` — puerto de escucha.

**Firewall:** si el servicio debe ser accesible desde otras máquinas, abre el puerto elegido (p. ej. 3000) en el cortafuegos del sistema o en la nube.

**Actualizar en producción:** `git pull` → `npm install` → `npm run build` → reiniciar el servicio (systemd, launchd, pm2 o nginx no requiere reinicio salvo que cambies su configuración).

---

## Linux — Opción A: systemd

Ejemplo de unidad de **usuario** (`~/.config/systemd/user/museo.service`). Para un servicio de sistema, coloca el archivo en `/etc/systemd/system/museo.service` y ajusta `User=` / rutas.

Crea el directorio si no existe:

```bash
mkdir -p ~/.config/systemd/user
```

Archivo `~/.config/systemd/user/museo.service`:

```ini
[Unit]
Description=Museo Virtual (archivos estáticos)
After=network.target

[Service]
Type=simple
WorkingDirectory=/ruta/a/museo
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/npx serve -s dist -l 3000
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

Si prefieres el binario global de `serve` (tras `npm install -g serve`):

```ini
ExecStart=/usr/local/bin/serve -s dist -l 3000
```

Habilitar y arrancar (sesión de usuario):

```bash
systemctl --user daemon-reload
systemctl --user enable museo.service
systemctl --user start museo.service
systemctl --user status museo.service
```

Para que el servicio de usuario siga activo sin sesión gráfica:

```bash
loginctl enable-linger "$USER"
```

Tras actualizar el código:

```bash
cd /ruta/a/museo
git pull
npm install
npm run build
systemctl --user restart museo.service
```

**Servicio de sistema** (requiere root): copia la unidad a `/etc/systemd/system/museo.service`, añade `User=deploy` bajo `[Service]`, usa `WantedBy=multi-user.target` y:

```bash
sudo systemctl daemon-reload
sudo systemctl enable museo.service
sudo systemctl start museo.service
```

---

## macOS — Opción B: launchd

Ejemplo de agente de usuario en `~/Library/LaunchAgents/com.example.museo.plist`.

Asegúrate de tener `serve` disponible (`npm install -g serve`) o usa la ruta completa a `npx` (sustituye `TU_USUARIO`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.example.museo</string>
  <key>WorkingDirectory</key>
  <string>/ruta/a/museo</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key>
    <string>production</string>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/npx</string>
    <string>serve</string>
    <string>-s</string>
    <string>dist</string>
    <string>-l</string>
    <string>3000</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/museo.stdout.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/museo.stderr.log</string>
</dict>
</plist>
```

Con Homebrew en Apple Silicon, `npx` suele estar en `/opt/homebrew/bin/npx`; ajústalo en `ProgramArguments`.

### Cargar y descargar el agente

**macOS 10.10+ (recomendado — `bootstrap`):**

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.example.museo.plist
launchctl print gui/$(id -u)/com.example.museo
```

Detener y descargar:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.example.museo.plist
```

**Versiones antiguas (legacy — `load` / `unload`):**

```bash
launchctl load ~/Library/LaunchAgents/com.example.museo.plist
launchctl unload ~/Library/LaunchAgents/com.example.museo.plist
```

Tras un despliegue nuevo:

```bash
cd /ruta/a/museo
git pull
npm install
npm run build
launchctl kickstart -k gui/$(id -u)/com.example.museo
```

En macOS sin `kickstart`, usa `bootout` + `bootstrap` de nuevo.

---

## macOS y Linux — Opción C: nginx

Sirve `dist/` directamente (sin proceso Node en runtime). Instala nginx con el gestor de paquetes de tu sistema.

Ejemplo de bloque `server` (p. ej. `/etc/nginx/sites-available/museo` en Debian/Ubuntu, o `servers/museo.conf` en Homebrew macOS):

```nginx
server {
    listen 80;
    server_name museo.ejemplo.local;

    root /ruta/a/museo/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|json)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

Activar y recargar (Linux, Debian/Ubuntu):

```bash
sudo ln -sf /etc/nginx/sites-available/museo /etc/nginx/sites-enabled/museo
sudo nginx -t
sudo systemctl reload nginx
```

Tras `npm run build`, nginx sirve los archivos nuevos de inmediato; no hace falta reiniciar nginx salvo que cambies la configuración.

---

## macOS y Linux — Opción D: PM2 (opcional)

[PM2](https://pm2.keymetrics.io/) gestiona el proceso del servidor estático de forma uniforme en ambos sistemas.

```bash
npm install -g pm2
cd /ruta/a/museo
npm run build
NODE_ENV=production pm2 start npx --name museo -- serve -s dist -l 3000
pm2 save
pm2 startup
```

Actualizar:

```bash
cd /ruta/a/museo
git pull
npm install
npm run build
pm2 restart museo
```

---

## Ampliar el catálogo (categorías, autores y cuadros)

Puedes añadir obras y biografías **sin tocar el código**, editando solo JSON:

| Archivo | Contenido |
|---------|-----------|
| `public/catalog/index.json` | Orden de categorías y autores |
| `public/catalog/authors/{autor-slug}.json` | Biografía, categoría y obras de cada autor |

No recrees `public/paintings.json` ni `public/authors.json`; el catálogo antiguo fue retirado. Cada autor debe estar listado una sola vez en `index.json`, y el campo `id` del archivo de autor debe coincidir con su slug.

Guía detallada (esquemas, convenciones, validación en terminal): **[`AGENTS.md`](AGENTS.md)**.

---

## Estructura del proyecto

```
museo/
├── index.html          # Entrada HTML, overlays de bienvenida y HUD
├── styles.css          # Estilos de la UI
├── vite.config.js      # Puerto (PORT), host 0.0.0.0
├── package.json
├── AGENTS.md           # Cómo añadir cuadros/autores (JSON)
├── README.md           # Este archivo
├── public/
│   └── catalog/
│       ├── index.json          # Categorías y orden de autores
│       └── authors/*.json      # Biografías y obras por autor
├── scripts/
│   ├── validate-catalog.mjs    # Valida esquema del catálogo
│   ├── check-urls.mjs          # Comprueba URLs de cuadros con HEAD HTTP
│   ├── catalog-inventory.mjs   # Estadísticas y snapshot del catálogo
│   └── commons-url.mjs         # Utilidad: construye URLs de Wikimedia Commons
├── src/
│   ├── main.js         # Arranque, bucle de render, carga de datos
│   ├── catalogData.js  # Cargador y normalización del catálogo
│   ├── scene.js        # Escena Three.js, cámara, renderer
│   ├── museum.js       # Construcción de salas de autor
│   ├── hub.js          # Rotondas de hall y categoría
│   ├── roomManager.js  # Cambio de sala, caché, transiciones
│   ├── paintings.js    # Colocación de cuadros y dimensiones
│   ├── controls.js     # Movimiento (ratón / táctil)
│   ├── ui.js           # Paneles e HUD
│   └── …               # rotunda, wallBuilder, materials, etc.
└── dist/               # Salida de `npm run build` (generado, no versionar)
```

---

## Scripts npm

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `npm run dev` | Servidor de desarrollo Vite con recarga en caliente |
| `build` | `npm run build` | Genera `dist/` para producción |
| `preview` | `npm run preview` | Sirve `dist/` localmente (prueba post-build) |
| `validate:catalog` | `npm run validate:catalog` | Valida esquema del catálogo JSON (estructura, campos, duplicados) |
| `check:urls` | `npm run check:urls` | Verifica con HEAD HTTP que todas las URLs de los cuadros son accesibles. Acepta un id de autor como argumento para comprobar solo esa sala (`node scripts/check-urls.mjs van-gogh`) |
| `catalog:stats` | `npm run catalog:stats` | Imprime estadísticas por categoría y autor, y escribe un snapshot JSON en `scripts/data/` |

---

## Licencia

El repositorio **no incluye un archivo LICENSE**; el proyecto se distribuye sin licencia explícita. Consulta al mantenedor antes de reutilizar el código o los assets fuera de este contexto.
