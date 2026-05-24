---
name: museo-catalogo-obras
description: >-
  Añade categorías, autores y cuadros famosos al Museo Virtual editando el
  catálogo modular en public/catalog. Usar cuando el usuario pida nuevas obras,
  autores, ampliar el catálogo, obras maestras, pintores famosos o contenido del
  museo en JSON.
---

# Museo Virtual — ampliar catálogo

Amplía el museo **solo con datos JSON**. La guía completa está en [`AGENTS.md`](../../../AGENTS.md); esta skill resume el flujo operativo.

## Fuente de verdad

| Archivo | Acción |
|---------|--------|
| [`public/catalog/index.json`](../../../public/catalog/index.json) | Orden de categorías y autores |
| [`public/catalog/authors/{autor-slug}.json`](../../../public/catalog/authors/) | Biografía, categoría y obras del autor |

**No editar** `dist/` ni código salvo que el usuario pida campos o comportamiento nuevos.

**No recrear** `public/paintings.json` ni `public/authors.json`; el catálogo antiguo fue retirado.

## Reglas de estructura

- Cada autor tiene un archivo `public/catalog/authors/{slug}.json`.
- `author.id` debe coincidir con `{slug}`.
- `author.category` debe existir en `public/catalog/index.json`.
- El slug del autor debe aparecer una sola vez en `categories[].authors`.
- Las obras dentro de `paintings` **no llevan** campo `author`; el cargador lo inyecta desde `author.name`.
- Cada `painting.id` es único globalmente.

## Flujo recomendado

### 1. Comprobar qué hay ya

Ejecuta antes y después:

```bash
cd /ruta/al/repo/museo
npm run validate:catalog
```

Lee `public/catalog/index.json` para entender categorías y orden público. Lee el archivo del autor si ya existe.

### 2. Elegir obras

Priorizar obras reconocibles y verificables. Por autor nuevo, apunta a **3–6 cuadros** representativos; para autor existente, **1–3** obras que falten.

Comprueba en el archivo del autor que el título/tema no esté ya duplicado.

### 3. Autor nuevo

1. Elegir slug en kebab-case, sin tildes: `frida-kahlo`.
2. Crear `public/catalog/authors/frida-kahlo.json` con `id`, `name`, `category`, `fullName`, `years`, `origin`, `bio` y `paintings`.
3. Añadir `frida-kahlo` al array `authors` de la categoría correspondiente en `public/catalog/index.json`.
4. El orden en ese array define la puerta dentro de la sala de categoría.

### 4. Autor existente

Editar solo `public/catalog/authors/{slug}.json` y añadir obras al array `paintings`. No tocar `index.json` salvo que haya que reordenar o mover al autor.

### 5. Por cada cuadro

| Campo | Cómo rellenarlo |
|-------|------------------|
| `id` | `{apellido}-{slug-titulo}` kebab-case, único, sin tildes |
| `url` | HTTPS Wikimedia Commons (`upload.wikimedia.org`), imagen directa JPG/PNG/WebP, CORS OK |
| `title` | Título en español cuando exista nombre habitual |
| `year` | Número; si la fecha es aproximada, usar el año principal |
| `description` | 1–3 frases en español: contexto, técnica o legado |
| `dimensions` | `width` y `height` en centímetros |

No añadas `author` dentro del cuadro.

### 6. Imagen y dimensiones

Fuentes fiables:

- Wikimedia Commons para imagen directa.
- Fichas de museos (Prado, Louvre, Met, Uffizi, etc.) para dimensiones.
- Wikidata/Wikipedia como apoyo cuando citen fuente clara.

Comprobar imagen:

```bash
curl -L -I "URL_DE_IMAGEN" | sed -n '1,12p'
```

Debe verse una respuesta válida y `content-type: image/...`.

### 7. Validar y cerrar

```bash
npm run validate:catalog
npm run build
```

Checklist:

- [ ] `npm run validate:catalog` pasa.
- [ ] Autor nuevo listado en `index.json`.
- [ ] `author.id` coincide con el archivo.
- [ ] `author.category` coincide con la categoría donde está listado.
- [ ] `painting.id` únicos.
- [ ] Obras con URL, título, año, descripción y dimensiones.
- [ ] Textos en español, estilo divulgativo como entradas vecinas.
- [ ] No se tocó `dist/`.

## Si el usuario pide cantidad concreta

| Petición | Acción |
|----------|--------|
| «Añade a Goya» | Editar `public/catalog/authors/francisco-de-goya.json` y añadir 3–5 obras |
| «10 pintores nuevos» | Crear 10 archivos de autor + listarlos en `index.json`, con variedad de categorías |
| «Solo un cuadro» | Añadir una entrada al autor correcto; no crear duplicados |
| «Reordena el hall» | Reordenar `categories` en `public/catalog/index.json` |
| «Reordena autores» | Reordenar `categories[].authors` dentro de la categoría |

## Errores a evitar

- Crear un archivo de autor sin listarlo en `index.json`.
- Poner `author` dentro de cada cuadro.
- Duplicar ids de obras.
- Cambiar `category` en el autor sin moverlo en `index.json`.
- Dimensiones en metros o pulgadas sin convertir a cm.
- URL de miniatura cuando exista imagen original de Wikimedia.

## Relación con otras skills

- Aspecto visual del museo: [museo-visual-neoclassico](../museo-visual-neoclassico/SKILL.md)
- Datos y esquema detallado: [`AGENTS.md`](../../../AGENTS.md)
