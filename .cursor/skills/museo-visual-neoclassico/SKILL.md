---
name: museo-visual-neoclassico
description: >-
  Mejora el aspecto visual del Museo Virtual: paredes sin cortes de textura entre
  paneles, estilo neoclásico luminoso. Usar cuando el usuario pida paredes, texturas,
  iluminación ambiente, estilo neoclásico/clásico, costuras visibles en muros, o
  más luminosidad sin añadir luces puntuales.
---

# Museo Virtual — aspecto neoclásico y paredes continuas

## Objetivo

1. **Sin costuras** entre paneles de pared (cada `buildPanel` / arco de rotonda debe compartir offset UV a lo largo del muro).
2. **Estilo neoclásico luminoso**: yeso/mármol claro, molduras doradas discretas, salas amplias y claras.
3. **Rendimiento**: no añadir `PointLight` ni `SpotLight` nuevos. Solo ajustar luz global existente y materiales.

## Archivos clave

| Archivo | Rol |
|---------|-----|
| [`src/materials.js`](src/materials.js) | Texturas canvas (`makeDamaskTexture` → yeso; `makeWainscotTexture` → zócalo claro) y colores de materiales |
| [`src/wallBuilder.js`](src/wallBuilder.js) | `applyWorldUVs`, `buildPanel`, `DAMASK_TILE_*` — **offset U por posición en el muro** |
| [`src/rotunda.js`](src/rotunda.js) | Mismos materiales; UV en arcos con `offsetU = arcStart * radius / tileW` |
| [`src/scene.js`](src/scene.js) | `HemisphereLight`, `AmbientLight`, `Fog`, `toneMappingExposure` — vía principal de luminosidad |
| [`src/museum.js`](src/museum.js) | `addRoomLights` — ya hay un `PointLight` por sala; no duplicar |

## Causa de las costuras

Cada panel es un `PlaneGeometry` con `applyWorldUVs` que escala UV desde 0. Paneles adyacentes reinician el patrón → se ve el “corte” del bloque.

**Solución:** pasar `offsetU` (y si aplica `offsetV`) en world space:

```js
// Pared recta: span.from mide desde -length/2
const offsetU = (span.from + length / 2) / DAMASK_TILE_W;
applyWorldUVs(geo, panelW, upperH, DAMASK_TILE_W, DAMASK_TILE_H, offsetU, 0);

// Rotonda: arco desde arcStart, radio wallR
const offsetU = (arcStart * wallR) / DAMASK_TILE_W;
```

`applyWorldUVs` debe sumar offset a las UV escaladas:

```js
uv.setXY(i, uv.getX(i) * sX + offsetU, uv.getY(i) * sY + offsetV);
```

Textura con `THREE.RepeatWrapping` y motivo **seamless** (período exacto en el canvas) para que offsets fraccionarios no generen saltos.

## Estilo neoclásico (materiales)

- **Pared superior:** yeso/estuco claro (`#f5f2ea`–`#ebe6dc`), ruido fino, vetas muy suaves; evitar damasco de alto contraste.
- **Zócalo (wainscot):** mármol o madera pintada clara, no nogal oscuro.
- **Techo:** artesonado claro existente; puede aclarar base en `makeCofferedCeilingTexture`.
- **Suelo:** parquet o mármol hub; mantener legible.
- **Trim:** oro pálido `#d4b878` / `#c7a060`.
- **Salas por autor:** en `getAuthorRoomMaterials`, tinte HSL muy suave (saturación &lt; 0.12, lightness &gt; 0.94) para no romper continuidad.

## Luminosidad sin luces nuevas

En [`src/scene.js`](src/scene.js):

- Subir intensidad de `HemisphereLight` y `AmbientLight`.
- Aclarar `scene.background` y `Fog`.
- Subir `renderer.toneMappingExposure` (p. ej. 1.1–1.2).
- Opcional: `hemi.groundColor` más claro para rebote simulado.

**No hacer:** añadir luces por sala, chandelier extra, etc.

Puedes **reducir ligeramente** intensidad de `PointLight` existentes si la escena queda quemada tras subir ambiente.

## Checklist antes de cerrar

- [ ] Recorrer una sala con varios paneles y puerta: no hay línea vertical de patrón cortado entre paneles.
- [ ] Hall (rotonda): transición suave entre arcos de muro.
- [ ] Escena globalmente más clara; cuadros siguen legibles.
- [ ] `npm run build` sin errores.
- [ ] No aumentar recuento de luces dinámicas en el código.

## Validación visual

```bash
npm run dev
```

Entrar al museo, inspeccionar esquinas de pared y paso entre panel y panel junto a puertas. Comparar hall y una sala de autor con muchos cuadros.
