/** @typedef {{ id: string, filename: string, title: string, year: number, description: string, width: number, height: number }} Painting */

/** @param {string} id @param {string} filename @param {string} title @param {number} year @param {string} description @param {number} width @param {number} height @returns {Painting} */
export function p(id, filename, title, year, description, width, height) {
  return { id, filename, title, year, description, width, height };
}
