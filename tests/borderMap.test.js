import { describe, it, expect } from 'vitest';
import { advancedCountries } from '../src/data/advancedCountries.js';
import {
  computeZoomViewBox,
  getBorderInfo,
  getCountryPathD,
  computeSameScaleViewBoxes,
} from '../src/borderMap.js';

describe('Module Carte Vectorielle SVG des Frontières (borderMap)', () => {
  const france = advancedCountries.find((c) => c.code === 'fr');
  const espagne = advancedCountries.find((c) => c.code === 'es');
  const vietnam = advancedCountries.find((c) => c.code === 'vn');

  describe('getBorderInfo', () => {
    it('détecte correctement deux pays voisins et génère la légende adéquate', () => {
      const info = getBorderInfo(france, espagne);
      expect(info.areNeighbors).toBe(true);
      expect(info.text).toContain('partagent une frontière');
      expect(info.text).toContain('France');
      expect(info.text).toContain('Espagne');
    });

    it('détecte correctement deux pays non voisins', () => {
      const info = getBorderInfo(france, vietnam);
      expect(info.areNeighbors).toBe(false);
      expect(info.text).toContain('ne partagent aucune frontière');
    });

    it('gère les entrées invalides ou nulles de manière sécurisée', () => {
      expect(getBorderInfo(null, null)).toEqual({ areNeighbors: false, text: '' });
    });
  });

  describe('computeZoomViewBox', () => {
    it('calcule un viewBox centré et dézoomé (au moins 280x200) pour deux pays', () => {
      const b1 = { x: 450, y: 300, width: 50, height: 50 };
      const b2 = { x: 480, y: 340, width: 40, height: 40 };

      const viewBox = computeZoomViewBox(b1, b2, 1010, 666);
      expect(typeof viewBox).toBe('string');

      const parts = viewBox.split(' ').map(Number);
      expect(parts).toHaveLength(4);

      const [x, y, w, h] = parts;
      expect(x).toBeLessThan(450);
      expect(y).toBeLessThan(300);
      expect(x + w).toBeGreaterThan(520);
      expect(y + h).toBeGreaterThan(380);
      expect(w).toBeGreaterThanOrEqual(280);
      expect(h).toBeGreaterThanOrEqual(200);
      expect(w).toBeLessThanOrEqual(1010);
      expect(h).toBeLessThanOrEqual(666);
    });

    it('retourne le viewBox mondial par défaut si les boîtes sont nulles ou de largeur nulle', () => {
      expect(computeZoomViewBox(null, null)).toBe('0 0 1010 666');
      expect(computeZoomViewBox({ x: 0, y: 0, width: 0, height: 0 }, { x: 0, y: 0, width: 0, height: 0 })).toBe('0 0 1010 666');
    });
  });

  describe('getCountryPathD', () => {
    const mockSvg = `
      <svg viewBox="0 0 100 100">
        <path id="fr" d="M 10 10 L 20 20 Z" />
        <path id="es" d="M 30 30 L 40 40 Z" />
      </svg>
    `;

    it('extrait correctement la chaîne de tracé d pour un pays donné', () => {
      expect(getCountryPathD(mockSvg, 'fr')).toBe('M 10 10 L 20 20 Z');
      expect(getCountryPathD(mockSvg, 'es')).toBe('M 30 30 L 40 40 Z');
    });

    it('retourne null si le pays n existe pas ou en cas d entrée vide', () => {
      expect(getCountryPathD(mockSvg, 'xx')).toBeNull();
      expect(getCountryPathD('', 'fr')).toBeNull();
      expect(getCountryPathD(null, null)).toBeNull();
    });
  });

  describe('computeSameScaleViewBoxes (Silhouettes à échelle 1:1 pour les surfaces)', () => {
    it('génère deux viewboxes avec exactement la même largeur et hauteur pour garantir une échelle identique', () => {
      // Pays A plus petit (ex: 40x40) et Pays B plus grand (ex: 80x60)
      const b1 = { x: 100, y: 100, width: 40, height: 40 };
      const b2 = { x: 500, y: 500, width: 80, height: 60 };

      const result = computeSameScaleViewBoxes(b1, b2, 0.20);
      expect(result).toBeDefined();
      expect(result.scaleSize).toBe(96); // 80 * 1.2 = 96

      const p1 = result.viewBox1.split(' ').map(Number);
      const p2 = result.viewBox2.split(' ').map(Number);

      // Les deux viewboxes doivent avoir EXACTEMENT la même largeur et hauteur
      expect(p1[2]).toBe(result.scaleSize);
      expect(p1[3]).toBe(result.scaleSize);
      expect(p2[2]).toBe(result.scaleSize);
      expect(p2[3]).toBe(result.scaleSize);

      // Et être centrées sur leurs pays respectifs
      // Centre 1: x = 120, y = 120 -> coin supérieur gauche: 120 - 48 = 72
      expect(p1[0]).toBe(72);
      expect(p1[1]).toBe(72);

      // Centre 2: x = 540, y = 530 -> coin supérieur gauche: 540 - 48 = 492, 530 - 48 = 482
      expect(p2[0]).toBe(492);
      expect(p2[1]).toBe(482);
    });

    it('gère les boîtes invalides avec un fallback sécurisé', () => {
      const fallback = computeSameScaleViewBoxes(null, null);
      expect(fallback.scaleSize).toBe(100);
      expect(fallback.viewBox1).toBe('0 0 100 100');
    });
  });
});
