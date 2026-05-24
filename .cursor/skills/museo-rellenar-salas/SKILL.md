---
name: museo-rellenar-salas
description: "Orquesta /museo y peticiones para rellenar salas del Museo Virtual con cuadros reales de alta calidad, procedencia verificada y validacion del catalogo."
---

# Museo Virtual - rellenar salas

Usar cuando el usuario invoque `/museo` o pida rellenar, ampliar, poblar o completar salas del Museo Virtual con cuadros.

Esta skill coordina el trabajo. Para la edicion concreta de JSON, aplicar tambien [`museo-catalogo-obras`](../museo-catalogo-obras/SKILL.md).

## Principio

El proyecto `~/workspaces/museo` es un museo estatico. Rellenar salas significa, salvo peticion explicita de funcionalidad nueva, editar solo:

- `public/catalog/index.json`
- `public/catalog/authors/{autor-slug}.json`

No editar `dist/`, `src/`, `styles.css` ni `index.html` para una ampliacion normal de catalogo.
No recrear `public/paintings.json` ni `public/authors.json`; el catalogo antiguo fue retirado.

## Flujo de subagentes

1. **Hermes / router**
   - Interpreta `/museo` y el alcance: autores, epoca, escuela, pais, cantidad de cuadros o sala concreta.
   - Decide si se amplian autores existentes o se crean autores nuevos.
   - Lee primero `AGENTS.md`, esta skill y `museo-catalogo-obras`.

2. **Diogenes / investigacion y procedencia**
   - Busca obras reales, fechas, dimensiones, ubicacion y fuente visual.
   - Entrega datos estructurados por obra: `title`, `author_slug`, `author_name`, `category`, `year`, `dimensions`, `image_url`, `source_url`, `license`, `institution`.
   - Rechaza obras sin imagen localizable o sin procedencia clara.

3. **Elrond / curaduria**
   - Selecciona las obras mas representativas y evita relleno mediocre.
   - Redacta `description` en espanol, 1-3 frases, tono de museo.
   - Mantiene variedad de epocas, formatos y salas cuando el usuario no concrete.

4. **Gandalf / implementacion unica**
   - Hacer una sola intervencion de Gandalf por tarea de relleno.
   - Edita `public/catalog/index.json` y los archivos necesarios en `public/catalog/authors/`.
   - Ejecuta validaciones y devuelve resumen de cambios.

## Reglas de imagen

Las imagenes deben existir, cargar por HTTPS y ser de la mejor calidad disponible.

Prioridad de fuentes:

- `upload.wikimedia.org` con archivo original o resolucion alta.
- Repositorios Open Access de museos cuando permitan uso directo y CORS.
- IIIF solo si se transforma a una URL de imagen directa, estable y usable por la app.

Evitar:

- Google Images o URLs copiadas de resultados de busqueda.
- Google Arts & Culture.
- Miniaturas pequenas cuando exista archivo original.
- Hotlinks de museos que requieran cookies, bloqueen CORS o devuelvan HTML.
- Obras modernas con copyright dudoso sin licencia clara.

Comprobaciones obligatorias por imagen:

```bash
curl -L -I "URL_DE_IMAGEN" | sed -n '1,12p'
```

Debe verse respuesta 200 o redireccion final valida y `content-type: image/...`.

Si hay varias resoluciones, escoger la mayor razonable. La app limita texturas internamente, pero partir de una imagen pobre produce un cuadro pobre; el navegador no convierte una estampita en Velazquez, aunque lo intente con solemnidad.

## Datos obligatorios

Cada cuadro debe tener:

- `id`: unico, kebab-case, sin tildes.
- `url`: URL directa de imagen.
- `title`: titulo comun en espanol cuando exista.
- `year`: entero.
- `description`: breve y verificable.
- `dimensions.width` y `dimensions.height`: centimetros, siempre que existan.

No incluir `author` dentro de cada obra: el cargador lo inyecta desde `author.name`.

Para cada autor nuevo, crear `public/catalog/authors/{slug}.json` con:

- `id`: identico al slug del archivo.
- `name`
- `category`: id de categoria existente en `index.json`.
- `fullName`
- `years`
- `origin`
- `bio`
- `paintings`

Tambien hay que listar el slug del autor una sola vez en `public/catalog/index.json`.

## Orden del museo

El orden de `categories` en `public/catalog/index.json` define las puertas del hall. El orden de `categories[].authors` define las puertas dentro de cada sala de categoria.

## Validacion

Antes y despues de editar:

```bash
cd ~/workspaces/museo
npm run validate:catalog
```

Despues de editar:

```bash
npm run validate:catalog
npm run build
```

Si se han anadido muchas imagenes, comprobar una muestra con `curl -L -I` y preferir `npm run dev` para inspeccion visual.

## Cierre

Responder con:

- Autores y cuadros anadidos.
- Fuentes principales y licencias/procedencia.
- Validaciones ejecutadas.
- Advertencias de copyright o imagenes sustituidas por falta de calidad.
