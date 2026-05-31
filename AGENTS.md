# Guía cueva para agentes: Museo Virtual

Agente cuidar museo. Museo come JSON. Si usuario pide catálogo, agente toca **solo datos JSON**. Código no tocar salvo usuario pedir campo nuevo o conducta nueva.

## Dónde agente toca

- `public/catalog/index.json`: orden de categorías y autores.
- `public/catalog/authors/{autor-slug}.json`: autor, bio, categoría, cuadros.
- `dist/`: no tocar. Build lo regenera.
- `public/paintings.json` y `public/authors.json`: no crear, no editar. Catálogo viejo muerto.

Si usuario pide catálogo, obras, autores, salas llenas o `/museo`, agente usa reglas de este archivo. Si usuario pide paredes, texturas, luz o estilo neoclásico, agente mira sección visual abajo.

## Regla grande: ids iguales

Archivo manda slug. Slug debe ser igual en tres sitios:

```text
public/catalog/authors/claude-monet.json
```

```json
{
  "id": "claude-monet",
  "name": "Claude Monet",
  "category": "impresionismo-postimpresionismo",
  "paintings": []
}
```

Y en `public/catalog/index.json`:

```json
"authors": ["claude-monet"]
```

`author.category` debe existir como `categories[].id` en `index.json`. Autor aparece una sola vez en todo `index.json`.

## Cómo museo piensa

1. App carga `/catalog/index.json`.
2. Índice da orden de puertas: primero categorías, luego autores.
3. App carga `public/catalog/authors/{id}.json`.
4. Sala de autor es rectángulo; cuadros van en paredes norte, este y oeste.
5. Cargador mete `author` en memoria. Agente no lo escribe.
6. Viaje: hall principal -> categoría -> autor -> cuadros.
7. Catálogo (`M` o botón Catálogo) salta a categoría, sala o cuadro.

## Forma de `index.json`

```json
{
  "categories": [
    {
      "id": "impresionismo-postimpresionismo",
      "label": "Impresionismo y postimpresionismo",
      "description": "Texto breve.",
      "authors": ["claude-monet", "edgar-degas"]
    }
  ]
}
```

Campos necesarios: `categories`, `id`, `label`, `authors`. `description` opcional. Orden importa.

## Forma de autor

Archivo: `public/catalog/authors/{autor-slug}.json`.

Campos:

- `id`: obligatorio, igual que archivo.
- `name`: obligatorio.
- `category`: obligatorio, categoría existente.
- `fullName`, `years`, `bio`: recomendados para placa.
- `origin`: opcional.
- `paintings`: obligatorio, array de obras.

## Forma de cuadro

Cuadro vive dentro de `paintings`. No poner campo `author`.

Campos obligatorios:

- `id`: único global, kebab-case, sin tildes, con prefijo de autor.
- `url`: HTTPS directo a imagen en `upload.wikimedia.org`.
- `title`: texto visible.
- `year`: número.
- `description`: español, 1 a 3 frases.
- `dimensions.width` y `dimensions.height`: centímetros reales.

## URL buena

Agente usa imagen directa de Wikimedia CDN:

```json
"url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Monet_-_Impression%2C_Sunrise.jpg"
```

Agente no usa `commons.wikimedia.org/wiki/Special:FilePath/...`. Eso puede traer redirect, HTML o mala codificación.

En ruta de `upload.wikimedia.org`, caracteres raros van encoded:

- `é`, `á`, `ñ`: UTF-8, ejemplo `%C3%A9`.
- `(` y `)`: `%28` y `%29`.
- `,`: `%2C`.
- espacio: `%20` o mejor `_`.

Validar imagen nueva:

```bash
curl -L -I "URL_DE_IMAGEN" | sed -n '1,12p'
```

Debe salir estado válido y `content-type: image/...`.

## Cómo hacer cambios

Añadir obras buenas:

- Para autor nuevo: 3 a 6 cuadros representativos.
- Para autor existente: 1 a 3 cuadros que falten, salvo usuario pida otra cantidad.
- Evitar duplicar título, tema o `painting.id`.
- Priorizar obra famosa, verificable, con imagen buena y dimensiones reales.
- Usar fuentes fiables: Wikimedia Commons para imagen; Prado, Louvre, Met, Uffizi y museos para dimensiones; Wikidata/Wikipedia solo como apoyo.
- Si usuario pide muchos autores, repartir épocas, escuelas y formatos. No meter relleno mediocre.

Añadir cuadro:

1. Abrir `public/catalog/authors/{autor-slug}.json`.
2. Añadir objeto en `paintings`.
3. No poner `author`.
4. Revisar `painting.id` único.
5. Ejecutar `npm run validate:catalog`.

Añadir autor:

1. Crear slug kebab-case.
2. Crear `public/catalog/authors/{slug}.json`.
3. Rellenar datos y al menos una obra.
4. Añadir slug en `categories[].authors` de `index.json`.
5. Ejecutar `npm run validate:catalog`.

Añadir categoría:

1. Añadir objeto en `index.json` con `id`, `label`, `description`, `authors`.
2. Crear o mover autores.
3. Actualizar `author.category`.
4. Ejecutar `npm run validate:catalog`.

Mover autor:

1. Quitar slug de categoría vieja.
2. Poner slug en categoría nueva.
3. Cambiar `category` en archivo de autor.
4. Ejecutar `npm run validate:catalog`.

Rellenar sala o `/museo`:

1. Entender alcance: autor, época, escuela, país, cantidad, sala concreta.
2. Decidir si ampliar autores existentes o crear autores nuevos.
3. Buscar obras reales con fecha, dimensiones, institución, procedencia e imagen.
4. Rechazar obra sin imagen usable o procedencia clara.
5. Redactar descripción en español, tono museo, 1 a 3 frases.
6. Editar una vez los JSON necesarios.
7. Ejecutar `npm run validate:catalog` y `npm run build`.

Imagen buena:

- Mejor: `upload.wikimedia.org`, archivo original o resolución alta.
- IIIF vale solo si URL final es imagen directa y estable.
- Evitar Google Images, Google Arts & Culture, miniatura pequeña, hotlink con cookies, CORS roto o HTML.
- Si obra moderna tiene copyright dudoso, avisar o sustituir.

## Cambios visuales

Si usuario pide paredes, texturas, iluminación ambiente, estilo clásico/neoclásico, costuras UV o más claridad:

- Archivos clave: `src/materials.js`, `src/wallBuilder.js`, `src/rotunda.js`, `src/scene.js`, `src/museum.js`.
- Meta: paredes sin costuras, yeso/mármol claro, molduras doradas discretas, salas claras.
- No añadir `PointLight` ni `SpotLight` nuevos. Primero ajustar luz global y materiales.
- `src/scene.js`: tocar `HemisphereLight`, `AmbientLight`, `Fog`, `scene.background`, `toneMappingExposure`.
- `src/wallBuilder.js`: paneles vecinos deben compartir offset UV en world space. Patrón no debe reiniciar en cada panel.
- `src/rotunda.js`: arcos de rotonda también usan offset por arco para que pared no corte textura.
- `src/materials.js`: pared superior clara (`#f5f2ea` a `#ebe6dc`), zócalo claro, oro pálido `#d4b878` / `#c7a060`.
- Salas de autor: tinte muy suave; saturación baja, claridad alta.
- Validar visualmente con `npm run dev`: mirar puertas, esquinas, paneles y hall.
- Cerrar con `npm run build`.

## Checklist de salida

- `npm run validate:catalog` pasa.
- Todo autor listado tiene archivo.
- `author.id` igual a slug de archivo.
- `author.category` existe y coincide con `index.json`.
- Todo `painting.id` único.
- Cada cuadro tiene URL, título, año, descripción, dimensiones.
- URL es HTTPS y `upload.wikimedia.org`.
- URL tiene encoding correcto.
- Texto en español claro.
- No tocar `dist/`.
- No revivir catálogo viejo.
- Si hubo cambio visual, build pasa y no aumentó número de luces dinámicas.

## Errores cueva

- Categoría sin puerta: `index.json` mal. Validar.
- Autor no aparece: slug no está en `index.json`.
- Autor falla al cargar: archivo falta o `id` no coincide.
- Sala vacía: `paintings` vacío o inválido.
- Cuadro deformado: dimensiones mal.
- Cuadro blanco: URL mala. Usar `upload.wikimedia.org` y probar con `curl`.
- Teletransporte falla: `painting.id` duplicado o mal escrito.
