export function canOpenReport({ playing, catalogOpen, overlay, roomManager }) {
  if (!playing) return false;
  if (catalogOpen) return false;

  const painting = overlay.getCurrent();
  if (painting) return true;

  const { kind, authorId } = roomManager.getRoomState();
  return kind === 'author' && !!authorId;
}

export function buildReportContext({ overlay, roomManager, catalogData }) {
  const painting = overlay.getCurrent();
  const { kind, authorId } = roomManager.getRoomState();

  if (painting) {
    return {
      issueTitle: `Error en cuadro: ${painting.title}`,
      issueBody:
        `**Cuadro:** ${painting.title}\n**Autor:** ${painting.author}\n**Año:** ${painting.year}\n\n**Descripción del error:**\n\n`,
      description: `Se abrirá un issue para el cuadro "${painting.title}" de ${painting.author}.`,
    };
  }

  if (kind === 'author' && authorId) {
    const author = catalogData.authorsById[authorId];
    const name = author?.name ?? authorId;
    return {
      issueTitle: `Error en sala de ${name}`,
      issueBody: `**Autor:** ${name}\n\n**Descripción del error:**\n\n`,
      description: `Se abrirá un issue para la sala de ${name}.`,
    };
  }

  return null;
}
