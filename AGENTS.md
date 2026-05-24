# Guía para agentes AI: catálogo del Museo Virtual

Este documento describe cómo ampliar el catálogo del museo editando **solo datos JSON**. No hace falta tocar código salvo que se quieran campos nuevos o comportamiento distinto.

## Archivos que debes editar

| Archivo | Qué contiene |
|---------|--------------|
| [`public/catalog/index.json`](public/catalog/index.json) | Orden público de categorías y autores |
| [`public/catalog/authors/{autor-slug}.json`](public/catalog/authors/) | Biografía, categoría y obras de cada autor |

**No edites** `dist/` — es la build de producción y se regenera con `npm run build`.

**No recrees ni edites** `public/paintings.json` ni `public/authors.json`. El catálogo antiguo fue retirado y ya no es fuente de verdad.

Para cambios de **paredes, texturas o iluminación ambiente** (estilo neoclásico, costuras de UV), sigue la skill [`.cursor/skills/museo-visual-neoclassico/SKILL.md`](.cursor/skills/museo-visual-neoclassico/SKILL.md).

Para **añadir autores y cuadros famosos** (solo JSON), sigue la skill [`.cursor/skills/museo-catalogo-obras/SKILL.md`](.cursor/skills/museo-catalogo-obras/SKILL.md).

Para **rellenar salas completas** o cuando el usuario invoque **`/museo`**, sigue la skill [`.cursor/skills/museo-rellenar-salas/SKILL.md`](.cursor/skills/museo-rellenar-salas/SKILL.md).

---

## Regla crítica: ids coherentes

Cada autor vive en un archivo propio:

```text
public/catalog/authors/claude-monet.json
```

El campo `id` dentro de ese archivo debe coincidir exactamente con el slug del archivo y con el slug listado en `index.json`:

```json
// public/catalog/index.json
"authors": ["claude-monet"]

// public/catalog/authors/claude-monet.json
{
  "id": "claude-monet",
  "name": "Claude Monet",
  "category": "impresionismo-postimpresionismo",
  "paintings": []
}
```

El campo `category` del autor debe coincidir con el `id` de una categoría existente en `index.json`.

---

## Cómo el museo usa estos datos

1. Al arrancar, la app carga `/catalog/index.json`.
2. El índice define:
   - el **orden de las puertas de categorías** en el hall principal;
   - el **orden de las puertas de autores** dentro de cada sala de categoría.
3. La app carga cada archivo `public/catalog/authors/{id}.json`.
4. Cada autor tiene una **sala rectangular** con sus cuadros en las paredes norte, este y oeste.
5. El cargador inyecta en memoria el nombre del autor en cada obra para que el HUD, etiquetas y teletransporte sigan funcionando.
6. La navegación 3D es: **Hall principal → sala de categoría → sala de autor → cuadros**.
7. El **catálogo** (`M` o botón «Catálogo») permite saltar a una categoría, a una sala de autor o delante de un cuadro.

---

## Esquema de `index.json`

```json
{
  "categories": [
    {
      "id": "impresionismo-postimpresionismo",
      "label": "Impresionismo y postimpresionismo",
      "description": "Luz moderna, vida cotidiana y nuevas formas de construir el espacio pictórico.",
      "authors": ["claude-monet", "edgar-degas"]
    }
  ]
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `categories` | array | sí | Lista ordenada de categorías |
| `categories[].id` | string | sí | Slug único de categoría |
| `categories[].label` | string | sí | Nombre visible en puertas, HUD y catálogo |
| `categories[].description` | string | opcional | Texto breve para el catálogo |
| `categories[].authors` | array | sí | Slugs de autores, en orden |

Un autor debe aparecer **una sola vez** en todo `index.json`.

---

## Esquema de un autor

Archivo: `public/catalog/authors/{autor-slug}.json`

```json
{
  "id": "claude-monet",
  "name": "Claude Monet",
  "category": "impresionismo-postimpresionismo",
  "fullName": "Oscar-Claude Monet",
  "years": "1840 – 1926",
  "origin": "París, Francia",
  "bio": "Padre del impresionismo y de la pintura en serie...",
  "paintings": [
    {
      "id": "monet-impresion-sol-naciente",
      "url": "https://upload.wikimedia.org/wikipedia/commons/5/59/Monet_-_Impression%2C_Sunrise.jpg",
      "title": "Impresión, sol naciente",
      "year": 1872,
      "description": "Vista del puerto de Le Havre al amanecer...",
      "dimensions": {
        "width": 65,
        "height": 50
      }
    }
  ]
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string | sí | Slug único; debe coincidir con el nombre del archivo |
| `name` | string | sí | Nombre visible del autor |
| `category` | string | sí | `id` de categoría existente en `index.json` |
| `fullName` | string | recomendado | Nombre completo para la placa biográfica |
| `years` | string | recomendado | Fechas de nacimiento y muerte, p. ej. `"1746 – 1828"` |
| `origin` | string | opcional | Lugar de origen |
| `bio` | string | recomendado | Párrafo biográfico en español, tono divulgativo de museo |
| `paintings` | array | sí | Obras de ese autor |

---

## Esquema de un cuadro

Los cuadros van dentro de `paintings` en el archivo del autor. **No añadas campo `author`**: el cargador lo inyecta desde `name`.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string | sí | Identificador único global, en kebab-case |
| `url` | string | sí | URL HTTPS de imagen directa; Wikimedia Commons funciona bien |
| `title` | string | sí | Título visible en etiqueta 3D y panel |
| `year` | number | sí | Año de creación, entero cuando sea posible |
| `description` | string | sí | Texto breve, 1–3 frases, en español |
| `dimensions.width` | number | sí | Ancho real en centímetros |
| `dimensions.height` | number | sí | Alto real en centímetros |

Convenciones para `id`:

- Minúsculas, palabras separadas por guiones.
- Prefijo del autor para evitar colisiones: `sorolla-...`, `monet-...`.
- Sin espacios ni tildes.
- Único en todo el catálogo, no solo dentro de un autor.

---

## Procedimientos

### Añadir cuadros a un autor existente

1. Abre `public/catalog/authors/{autor-slug}.json`.
2. Añade los objetos nuevos al array `paintings`.
3. No añadas `author` a las obras.
4. Verifica que cada `id` es único globalmente.
5. Ejecuta `npm run validate:catalog`.

### Añadir un autor nuevo

1. Elige un slug en kebab-case, por ejemplo `frida-kahlo`.
2. Crea `public/catalog/authors/frida-kahlo.json`.
3. Rellena `id`, `name`, `category`, biografía y al menos una obra.
4. Añade `frida-kahlo` al array `authors` de la categoría correspondiente en `public/catalog/index.json`.
5. El orden dentro de ese array define la puerta del autor en la sala de categoría.
6. Ejecuta `npm run validate:catalog`.

### Añadir una categoría nueva

1. Añade un objeto en `public/catalog/index.json` con `id`, `label`, `description` y `authors`.
2. Crea los archivos de autor referenciados o mueve autores existentes actualizando su campo `category`.
3. El orden de `categories` define las puertas del hall principal.
4. Ejecuta `npm run validate:catalog`.

### Mover un autor de categoría

1. Quita el slug del autor de la categoría antigua en `index.json`.
2. Añádelo a la nueva categoría.
3. Cambia `category` en `public/catalog/authors/{autor-slug}.json`.
4. Ejecuta `npm run validate:catalog`.

---

## Checklist antes de terminar

- [ ] `npm run validate:catalog` pasa.
- [ ] Cada autor de `index.json` tiene archivo en `public/catalog/authors/`.
- [ ] `author.id` coincide con el slug del archivo.
- [ ] `author.category` existe y coincide con la categoría donde está listado.
- [ ] Cada `painting.id` es único globalmente.
- [ ] Cada obra tiene `url`, `title`, `year`, `description` y `dimensions.width/height`.
- [ ] Las URLs son HTTPS e imagen real.
- [ ] Textos en español, concisos y sin errores.
- [ ] No se ha editado `dist/`.
- [ ] No se han recreado `public/paintings.json` ni `public/authors.json`.

---

## Validación rápida

```bash
npm run validate:catalog
npm run build
```

Para una imagen concreta:

```bash
curl -L -I "URL_DE_IMAGEN" | sed -n '1,12p'
```

Debe responder con `content-type: image/...` y un estado HTTP válido.

---

## Errores frecuentes

| Problema | Causa | Solución |
|----------|-------|----------|
| Categoría sin puerta | `index.json` inválido o categoría sin `id` | Ejecuta `npm run validate:catalog` |
| Autor no aparece | Archivo no listado en `index.json` | Añade el slug a `categories[].authors` |
| Autor listado pero falla carga | Falta `public/catalog/authors/{slug}.json` o `id` no coincide | Corrige archivo o slug |
| Sala sin obras | `paintings` vacío o inválido | Añade obras válidas |
| Cuadro desproporcionado | `dimensions` incorrectas | Corrige ancho/alto en cm |
| Teletransporte al cuadro falla | `painting.id` duplicado o mal escrito | Usa ids únicos y valida |

---

## Navegación

- Tecla **`M`** o botón **Catálogo**: lista categorías, autores y obras con búsqueda agrupada.
- Hall principal: puertas a categorías.
- Sala de categoría: puerta de vuelta al hall y puertas a autores.
- Sala de autor: puerta de vuelta a su categoría y cuadros del autor.
- El teletransporte usa `atPainting:{id}`; por eso cada `painting.id` debe ser único.
