# Guía para agentes AI: añadir cuadros y autores al Museo Virtual

Este documento describe cómo ampliar el catálogo del museo editando **solo datos JSON**. No hace falta tocar código salvo que se quieran campos nuevos o comportamiento distinto.

## Archivos que debes editar

| Archivo | Qué contiene |
|---------|----------------|
| [`public/paintings.json`](public/paintings.json) | Catálogo de cuadros (array JSON) |
| [`public/authors.json`](public/authors.json) | Biografías de autores (objeto JSON) |

**No edites** `dist/` — es la build de producción y se regenera con `npm run build`.

---

## Regla crítica: el nombre del autor debe coincidir

El campo `author` de cada cuadro en `paintings.json` debe ser **exactamente igual** (misma ortografía, tildes y espacios) a la clave correspondiente en `authors.json`.

```json
// paintings.json
"author": "Paolo Veronese"

// authors.json
"Paolo Veronese": { ... }
```

Si el autor existe en `paintings.json` pero **no** en `authors.json`, la sala se crea igualmente, pero **no aparecerá la placa biográfica** en la pared.

---

## Cómo el museo usa estos datos

1. Al arrancar, la app carga ambos JSON desde `/paintings.json` y `/authors.json`.
2. Agrupa los cuadros por `author` en el orden en que **aparecen por primera vez** en `paintings.json` → eso define:
   - el **orden de las puertas** en el hall principal;
   - el índice de cada sala de autor.
3. Cada autor tiene una **sala rectangular** con sus cuadros en las paredes norte, este y oeste.
4. El tamaño de la sala y la altura del techo se calculan a partir de las **dimensiones reales** de los cuadros.
5. Al mirar un cuadro, el HUD muestra título, autor, año y descripción.

---

## Esquema de un cuadro (`paintings.json`)

Cada entrada del array es un objeto con estos campos:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string | sí | Identificador único, en kebab-case. Convención: `{apellido-o-nombre-corto}-{slug-del-titulo}` |
| `url` | string | sí | URL HTTPS de la imagen. Debe ser accesible con CORS (Wikimedia Commons funciona bien) |
| `title` | string | sí | Título visible en la etiqueta 3D y en el panel de información |
| `author` | string | sí | Nombre del autor; debe coincidir con una clave de `authors.json` |
| `year` | number | sí | Año de creación (entero, p. ej. `1894`) |
| `description` | string | sí | Texto breve (1–3 frases) para el panel al mirar el cuadro |
| `dimensions` | object | muy recomendado | Tamaño real del lienzo en **centímetros** |
| `dimensions.width` | number | sí* | Ancho en cm |
| `dimensions.height` | number | sí* | Alto en cm |

\* Sin `dimensions`, el cuadro se renderiza con un tamaño genérico (~2 m de lado largo) usando la proporción de la imagen. **Siempre incluye dimensiones** cuando se conozcan: afectan al tamaño del cuadro, al techo y al ancho de la sala.

### Ejemplo de cuadro nuevo

```json
{
  "id": "goya-maya-vestida",
  "url": "https://upload.wikimedia.org/wikipedia/commons/.../La_maja_vestida.jpg",
  "title": "La maja vestida",
  "author": "Francisco de Goya",
  "year": 1803,
  "description": "Retrato en el que Goya contrasta con La maja desnuda. Ambas obras formaron parte de la colección de Godoy.",
  "dimensions": {
    "width": 95,
    "height": 190
  }
}
```

### Convenciones para `id`

- Minúsculas, palabras separadas por guiones.
- Prefijo del autor para evitar colisiones: `sorolla-...`, `monet-...`.
- Sin espacios ni tildes en el `id` (las tildes van en `title` y `author`).
- Debe ser **único** en todo el array.

### Imágenes (`url`)

- Usa URLs de **Wikimedia Commons** (`upload.wikimedia.org`) cuando sea posible: son estables y permiten CORS.
- Prefiere el archivo original o una resolución alta; la app redimensiona internamente (2048 px en desktop, 1024 px en móvil).
- Evita URLs que requieran cookies o que bloqueen peticiones cross-origin.
- Comprueba que la URL devuelve una imagen (jpg, png, webp).

### Dimensiones

- Unidades: **centímetros**, como en los catálogos de museos.
- `width` = ancho horizontal del lienzo; `height` = alto vertical.
- Obras muy grandes (p. ej. *Las bodas de Caná*, 994×677 cm) son válidas: la sala se adapta automáticamente.

---

## Esquema de un autor (`authors.json`)

Objeto cuya **clave** es el nombre corto del autor (el mismo string que `author` en los cuadros):

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `fullName` | string | recomendado | Nombre completo para la placa biográfica |
| `years` | string | recomendado | Fechas de nacimiento y muerte, p. ej. `"1746 – 1828"` |
| `origin` | string | opcional | Lugar de origen |
| `bio` | string | recomendado | Párrafo biográfico (3–5 frases). Se muestra en una placa dentro de la sala |

### Ejemplo de autor nuevo

```json
"Francisco de Goya": {
  "fullName": "Francisco José de Goya y Lucientes",
  "years": "1746 – 1828",
  "origin": "Fuendetodos, Aragón, España",
  "bio": "Pintor y grabador clave entre el rococó y el arte moderno. Trabajó para la corte de Carlos IV y documentó en los Caprichos y el Dos de mayo la España de finales del siglo XVIII y principios del XIX."
}
```

---

## Procedimientos paso a paso

### Añadir cuadros a un autor que ya existe

1. Abre `public/paintings.json`.
2. Añade un objeto al **final del array** (o junto a los demás cuadros del mismo autor).
3. Usa exactamente el mismo string en `author` que en `authors.json`.
4. Genera un `id` único.
5. Verifica que el JSON sigue siendo válido (array de objetos, comas correctas).
6. No hace falta tocar `authors.json` si el autor ya está registrado.

### Añadir un autor nuevo (con sus cuadros)

1. Añade la entrada del autor en `public/authors.json`.
2. Añade uno o más cuadros en `public/paintings.json` con `"author": "Nombre exacto"`.
3. **Orden de puertas:** la posición de la puerta en el hall depende del **primer cuadro** de ese autor en `paintings.json`. Si quieres controlar el orden de las salas, inserta el primer cuadro del autor en la posición deseada del array (o reordena con cuidado).
4. Tras recargar la app, aparecerá una nueva puerta en la rotonda con el nombre del autor.

### Añadir solo biografía de un autor ya presente

1. Si hay cuadros con `"author": "X"` pero no hay entrada en `authors.json`, añade la clave `"X"` en `authors.json`.
2. No modifiques los cuadros.

---

## Checklist antes de terminar

- [ ] JSON válido (sin comas finales, comillas dobles).
- [ ] `id` del cuadro único en todo `paintings.json`.
- [ ] `author` idéntico en cuadro y clave de `authors.json`.
- [ ] `dimensions.width` y `dimensions.height` en centímetros.
- [ ] `url` accesible (HTTPS, imagen real).
- [ ] `description` en español, concisa y sin errores.
- [ ] Si es autor nuevo: entrada completa en `authors.json` y al menos un cuadro.
- [ ] No se ha editado `dist/` ni código fuente innecesariamente.

---

## Validación rápida en terminal

```bash
# Comprobar que el JSON es válido
node -e "JSON.parse(require('fs').readFileSync('public/paintings.json','utf8')); console.log('paintings.json OK')"
node -e "JSON.parse(require('fs').readFileSync('public/authors.json','utf8')); console.log('authors.json OK')"

# Listar autores en cuadros vs autores con biografía
node -e "
const p=require('./public/paintings.json');
const a=require('./public/authors.json');
const fromPaintings=[...new Set(p.map(x=>x.author))];
const missing=fromPaintings.filter(n=>!a[n]);
const orphan=Object.keys(a).filter(n=>!fromPaintings.includes(n));
console.log('Autores en cuadros:', fromPaintings.length);
if(missing.length) console.log('Sin biografía:', missing);
if(orphan.length) console.log('Biografía sin cuadros:', orphan);
"
```

---

## Errores frecuentes

| Problema | Causa | Solución |
|----------|--------|----------|
| Cuadro no aparece | JSON inválido o error al cargar imagen | Revisa consola del navegador; corrige URL o JSON |
| Sala sin placa biográfica | Autor ausente en `authors.json` | Añade la entrada del autor |
| Puerta con nombre distinto al esperado | El `author` del cuadro no coincide | Unifica el string en ambos archivos |
| Cuadro desproporcionado | `dimensions` incorrectas o ausentes | Corrige width/height en cm |
| Autor duplicado en el hall | Dos variantes del nombre (`"Monet"` vs `"Claude Monet"`) | Usa un solo nombre en todos los cuadros |

---

## Autores y cuadros actuales (referencia)

Consulta los archivos fuente para el listado vigente. A mayo de 2026 el museo incluye autores como Tiziano, Paolo Veronese, Velázquez, Murillo, Vermeer, Hokusai, Monet, Van Gogh, Munch, Sorolla y Dalí, con **28 cuadros** en total.

Al añadir contenido, **mantén el estilo** de las entradas existentes: descripciones en español, tono divulgativo de museo, datos históricos verificables.
