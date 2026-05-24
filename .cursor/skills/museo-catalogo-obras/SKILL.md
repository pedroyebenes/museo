---
name: museo-catalogo-obras
description: >-
  Añade autores y cuadros famosos al Museo Virtual editando paintings.json y
  authors.json. Usar cuando el usuario pida nuevas obras, autores, ampliar el
  catálogo, obras maestras, pintores famosos, o contenido del museo en JSON.
---

# Museo Virtual — ampliar catálogo (autores y cuadros)

Amplía el museo **solo con datos JSON**. La guía completa está en [`AGENTS.md`](../../AGENTS.md); esta skill define el **flujo de trabajo** y criterios de calidad.

## Archivos (única fuente de verdad)

| Archivo | Acción |
|---------|--------|
| [`public/paintings.json`](../../public/paintings.json) | Array de cuadros |
| [`public/authors.json`](../../public/authors.json) | Biografías (clave = `author` del cuadro) |

**No editar** `dist/` ni código salvo que el usuario pida campos o comportamiento nuevos.

## Regla de oro

El string `"author"` en cada cuadro debe ser **idéntico** a la clave en `authors.json` (tildes, espacios, mayúsculas). Un solo nombre por pintor en todo el proyecto (p. ej. `"Claude Monet"`, no `"Monet"` en un sitio y otro en otro).

---

## Flujo recomendado

### 1. Comprobar qué hay ya

Ejecuta antes y después:

```bash
cd /ruta/al/repo/museo

node -e "
const p=require('./public/paintings.json');
const a=require('./public/authors.json');
const authors=[...new Set(p.map(x=>x.author))];
const byAuthor={};
p.forEach(x=>{byAuthor[x.author]=(byAuthor[x.author]||0)+1});
console.log('Cuadros:', p.length, '| Autores:', authors.length);
authors.forEach(n=>console.log(' ',n,':',byAuthor[n]));
const missing=authors.filter(n=>!a[n]);
if(missing.length) console.log('Sin biografía:', missing);
const ids=new Set(p.map(x=>x.id));
if(ids.size!==p.length) console.log('ERROR: ids duplicados');
"
```

No duplicar `id` ni autor ya cubierto con el mismo nombre mal escrito.

### 2. Elegir obras

Priorizar **obras reconocibles** (iconos del arte occidental y oriental ya presente en el museo). Por autor nuevo, apunta a **3–6 cuadros** representativos; para autor existente, **1–3** obras que falten.

Comprueba en `paintings.json` que el título/obras no estén ya (mismo autor + tema similar).

### 3. Autor nuevo → orden de edición

1. Añadir entrada en **`authors.json`** (`fullName`, `years`, `origin`, `bio` en español, 3–5 frases, tono museo).
2. Añadir cuadros en **`paintings.json`** con el mismo `"author"`.
3. **Primera aparición** del autor en el array define la **puerta del hall** y el orden en el catálogo (`M`). Si importa la posición, inserta el primer cuadro de ese autor donde quieras la puerta; si no, al final del array.

### 4. Autor existente

Solo `paintings.json`: nuevos objetos **juntos** a los demás cuadros del mismo `author` (o al final si no importa agrupación en archivo).

### 5. Por cada cuadro

| Campo | Cómo rellenarlo |
|-------|------------------|
| `id` | `{apellido}-{slug-titulo}` kebab-case, único, sin tildes |
| `url` | HTTPS Wikimedia Commons (`upload.wikimedia.org`), imagen JPG/PNG, CORS OK |
| `title` | Título en español (nombre habitual en museos españoles) |
| `author` | Igual que clave en `authors.json` |
| `year` | Entero (año de ejecución; `c.` en `years` del autor, no en `year`) |
| `description` | 1–3 frases en español: contexto, técnica o legado; sin spoilers vacíos |
| `dimensions` | **Siempre** si existen datos de museo: `width` y `height` en **cm** |

### 6. Buscar imagen en Wikimedia Commons

1. Buscar en [commons.wikimedia.org](https://commons.wikimedia.org): «Author Title painting».
2. Elegir archivo de **dominio público** o licencia compatible.
3. Clic en el archivo → botón derecho «Archivo original» / URL que empiece por `https://upload.wikimedia.org/...`.
4. Comprobar con `curl -sI "URL" | head -5` que responde `200` y `content-type: image/...`.

No uses Google Arts, museos con hotlinking ni URLs que requieran cookies.

### 7. Dimensiones

Fuentes fiables: ficha del museo (Prado, Louvre, Met, Uffizi), Wikipedia infobox «Dimensiones», Wikidata.  
`width` = ancho horizontal del **lienzo**; `height` = alto. Obras murales/frescos: dimensiones del campo pictórico si constan.

### 8. Validar y cerrar

```bash
node -e "JSON.parse(require('fs').readFileSync('public/paintings.json','utf8')); console.log('paintings.json OK')"
node -e "JSON.parse(require('fs').readFileSync('public/authors.json','utf8')); console.log('authors.json OK')"
```

Checklist:

- [ ] JSON válido, sin comas finales
- [ ] `id` únicos
- [ ] `author` ↔ clave `authors.json`
- [ ] Todas las entradas con `dimensions`
- [ ] URLs HTTPS verificadas
- [ ] Textos en español, estilo divulgativo como las entradas vecinas
- [ ] Autor nuevo: bio + al menos un cuadro
- [ ] No se tocó `dist/` ni código innecesario

Opcional: `npm run build` si hubo cambios de código (solo JSON no hace falta build para probar con `npm run dev`).

---

## Estilo de redacción

- **Biografías:** tercera persona, datos verificables, una frase de estilo/época.
- **Descripciones de cuadros:** qué se ve, por qué importa, dónde se conserva o quién encargó si es relevante.
- Evitar juicios vacíos («obra maestra increíble»); preferir hechos.

Copia el tono de entradas cercanas en `paintings.json` / `authors.json` (p. ej. Sorolla, David, Tiziano).

---

## Autores en el museo (referencia dinámica)

Antes de añadir, **lee** `public/paintings.json` y lista autores actuales con el script del §1.  
A mayo de 2026 el museo incluye entre otros: Tiziano, Paolo Veronese, Velázquez, Murillo, Vermeer, Hokusai, Monet, Van Gogh, Munch, Sorolla, Dalí, Jacques-Louis David, Miguel Ángel (~40 cuadros).

## Ideas de autores aún no representados (sugerencias)

Usar solo si el usuario no especifica lista. Comprobar siempre que no existan ya:

| Autor (clave sugerida) | Obras icono (ejemplos) |
|------------------------|-------------------------|
| Leonardo da Vinci | La Gioconda, La Última Cena (detalle), Virgen de las Rocas |
| Rafael | La Escuela de Atenas (detalle), La Virgen del Jilguero |
| Caravaggio | La vocación de San Mateo, David con la cabeza de Goliat |
| Rembrandt | La ronda de noche, Autorretrato |
| Peter Paul Rubens | El descendimiento de la cruz |
| El Greco | El entierro del Conde de Orgaz, Vista de Toledo |
| Francisco de Goya | El tres de mayo, La maja desnuda |
| Sandro Botticelli | El nacimiento de Venus, La Primavera |
| Pablo Picasso | Guernica, Las señoritas de Aviñón |
| Pierre-Auguste Renoir | Baile en Moulin de la Galette |
| Edgar Degas | La clase de ballet |
| Paul Cézanne | Los jugadores de cartas |
| Gustav Klimt | El beso |
| Frida Kahlo | Las dos Fridas |
| Jan van Eyck | El matrimonio Arnolfini |
| Francisco de Zurbarán | Santa Casilda |

Añade **varios cuadros por autor** cuando el usuario pida «ampliar mucho» el museo; si pide «un autor», 3–5 obras bastan.

---

## Si el usuario pide cantidad concreta

| Petición | Acción |
|----------|--------|
| «Añade a Goya» | Bio en `authors.json` si falta + 3–5 obras en `paintings.json` |
| «10 pintores nuevos» | 10 autores con bio + 2–4 obras cada uno; variedad de épocas |
| «Solo un cuadro» | Una entrada; no crear autor duplicado |
| «Reordena el hall» | Reordenar **primer** cuadro de cada autor en `paintings.json` (con cuidado) |

---

## Errores a evitar

- Duplicar variantes del nombre (`"Van Gogh"` vs `"Vincent van Gogh"`).
- Olvidar `authors.json` → sala sin placa biográfica.
- `id` sin prefijo de autor → colisión futura.
- Dimensiones en metros o pulgadas sin convertir a cm.
- URL de miniatura de Wikimedia (`.../thumb/...`) en lugar del original.

---

## Relación con otras skills

- Aspecto visual del museo: [museo-visual-neoclassico](../museo-visual-neoclassico/SKILL.md)
- Datos y esquema detallado: [`AGENTS.md`](../../AGENTS.md)
