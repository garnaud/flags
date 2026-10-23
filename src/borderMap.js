/**
 * Module d'affichage et d'interaction pour la Carte Vectorielle SVG des frontières.
 */

export const DEFAULT_MAP_VIEWBOX = '0 0 1010 666';

/**
 * Retourne les informations de voisinage entre deux pays.
 * @param {Object} country1
 * @param {Object} country2
 * @returns {{ areNeighbors: boolean, text: string }}
 */
export function getBorderInfo(country1, country2) {
  if (!country1 || !country2) {
    return { areNeighbors: false, text: '' };
  }

  const areNeighbors = Array.isArray(country1.borders) && country1.borders.includes(country2.code);

  return {
    areNeighbors,
    text: areNeighbors
      ? `🤝 ${country1.name} et ${country2.name} partagent une frontière terrestre`
      : `❌ ${country1.name} et ${country2.name} ne partagent aucune frontière terrestre`,
  };
}

/**
 * Calcule un viewBox SVG centré et dézoomé (vue régionale) sur deux zones.
 * Applique une taille minimale (280x200) pour garantir que l'environnement
 * géographique soit toujours visible sans écran noir.
 *
 * @param {{x: number, y: number, width: number, height: number}} b1
 * @param {{x: number, y: number, width: number, height: number}} b2
 * @param {number} [mapWidth=1010]
 * @param {number} [mapHeight=666]
 * @returns {string} ViewBox SVG ajusté
 */
export function computeZoomViewBox(b1, b2, mapWidth = 1010, mapHeight = 666) {
  if (!b1 || !b2 || typeof b1.x !== 'number' || typeof b2.x !== 'number') {
    return DEFAULT_MAP_VIEWBOX;
  }

  // Protection stricte contre les boîtes de taille nulle (ex: rendu non finalisé)
  if (!b1.width || !b1.height || !b2.width || !b2.height || b1.width <= 0 || b2.width <= 0) {
    return DEFAULT_MAP_VIEWBOX;
  }

  const minX = Math.min(b1.x, b2.x);
  const minY = Math.min(b1.y, b2.y);
  const maxX = Math.max(b1.x + b1.width, b2.x + b2.width);
  const maxY = Math.max(b1.y + b1.height, b2.y + b2.height);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const rawW = Math.max(10, maxX - minX);
  const rawH = Math.max(10, maxY - minY);

  // Vue régionale dézoomée : au moins 280px de large et 200px de haut (ou 1.8x la taille brute)
  const targetW = Math.max(280, rawW * 1.8);
  const targetH = Math.max(200, rawH * 1.8);

  const zX = Math.max(0, Math.min(mapWidth - targetW, cx - targetW / 2));
  const zY = Math.max(0, Math.min(mapHeight - targetH, cy - targetH / 2));
  const zW = Math.min(mapWidth, targetW);
  const zH = Math.min(mapHeight, targetH);

  return `${Math.round(zX)} ${Math.round(zY)} ${Math.round(zW)} ${Math.round(zH)}`;
}

/**
 * Extrait les données de tracé 'd' d'un pays depuis le fichier SVG mondial.
 * @param {string} svgText
 * @param {string} countryCode
 * @returns {string|null}
 */
export function getCountryPathD(svgText, countryCode) {
  if (!svgText || !countryCode) return null;
  const code = countryCode.toLowerCase();
  const regex = new RegExp('<path\\b(?:(?!<path)[\\s\\S])*?id=\"' + code + '\"[\\s\\S]*?d=\"([^\"]+)\"', 'i');
  const m = svgText.match(regex);
  return m ? m[1] : null;
}

/**
 * Calcule deux viewboxes carrées de même dimension pour afficher deux silhouettes
 * de pays à la même échelle relative (1:1).
 *
 * @param {{x: number, y: number, width: number, height: number}} b1
 * @param {{x: number, y: number, width: number, height: number}} b2
 * @param {number} [paddingRatio=0.20]
 * @returns {{ viewBox1: string, viewBox2: string, scaleSize: number }}
 */
export function computeSameScaleViewBoxes(b1, b2, paddingRatio = 0.20) {
  if (!b1 || !b2 || typeof b1.x !== 'number' || typeof b2.x !== 'number') {
    return { viewBox1: '0 0 100 100', viewBox2: '0 0 100 100', scaleSize: 100 };
  }

  const w1 = b1.width || 20;
  const h1 = b1.height || 20;
  const w2 = b2.width || 20;
  const h2 = b2.height || 20;

  const maxDim = Math.max(w1, h1, w2, h2, 20);
  const sizeWithPadding = Math.round(maxDim * (1 + paddingRatio));

  const cx1 = b1.x + w1 / 2;
  const cy1 = b1.y + h1 / 2;

  const cx2 = b2.x + w2 / 2;
  const cy2 = b2.y + h2 / 2;

  const vb1 = `${Math.round(cx1 - sizeWithPadding / 2)} ${Math.round(cy1 - sizeWithPadding / 2)} ${sizeWithPadding} ${sizeWithPadding}`;
  const vb2 = `${Math.round(cx2 - sizeWithPadding / 2)} ${Math.round(cy2 - sizeWithPadding / 2)} ${sizeWithPadding} ${sizeWithPadding}`;

  return {
    viewBox1: vb1,
    viewBox2: vb2,
    scaleSize: sizeWithPadding,
  };
}
