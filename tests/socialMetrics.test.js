import { describe, it, expect } from 'vitest';
import { advancedCountries } from '../src/data/advancedCountries.js';
import {
  SOCIAL_METRICS,
  assignMetricTiers,
  calculateCategoryGapBonus,
  generateSocialMetricQuestion,
} from '../src/socialMetrics.js';

describe('Module Métriques Sociales & Culturelles (socialMetrics)', () => {
  const france = advancedCountries.find((c) => c.code === 'fr');
  const espagne = advancedCountries.find((c) => c.code === 'es');

  describe('Définition du registre SOCIAL_METRICS', () => {
    it('doit définir les 4 métriques avec leurs unités et formateurs', () => {
      const keys = Object.keys(SOCIAL_METRICS);
      expect(keys).toEqual(['lifeExpectancy', 'hdi', 'medianAge', 'schoolingYears']);

      expect(SOCIAL_METRICS.lifeExpectancy.label).toContain('Espérance de vie');
      expect(SOCIAL_METRICS.lifeExpectancy.unit).toBe('ans');

      expect(SOCIAL_METRICS.hdi.label).toContain('IDH');
      expect(SOCIAL_METRICS.hdi.format(0.9104)).toBe('0.910');

      expect(SOCIAL_METRICS.medianAge.label).toContain('Âge médian');
      expect(SOCIAL_METRICS.schoolingYears.label).toContain('Scolarisation');
    });
  });

  describe('Algorithme de répartition en K catégories (assignMetricTiers)', () => {
    it('répartit équitablement les pays en 10 déciles (K = 10)', () => {
      const tiersMap = assignMetricTiers(advancedCountries, 'lifeExpectancy', 10);
      expect(tiersMap.size).toBe(advancedCountries.length);

      const counts = {};
      tiersMap.forEach((tier) => {
        counts[tier] = (counts[tier] || 0) + 1;
      });

      // 10 catégories bien créées
      expect(Object.keys(counts).length).toBe(10);
      // Chaque décile contient environ 19 ou 20 pays
      for (let t = 1; t <= 10; t++) {
        expect(counts[t]).toBeGreaterThanOrEqual(18);
        expect(counts[t]).toBeLessThanOrEqual(22);
      }
    });

    it('permet de tuner facilement le nombre de catégories (ex: K = 5 quintiles)', () => {
      const tiersMap5 = assignMetricTiers(advancedCountries, 'hdi', 5);
      const counts5 = {};
      tiersMap5.forEach((tier) => {
        counts5[tier] = (counts5[tier] || 0) + 1;
      });

      expect(Object.keys(counts5).length).toBe(5);
      for (let t = 1; t <= 5; t++) {
        expect(counts5[t]).toBeGreaterThanOrEqual(37);
        expect(counts5[t]).toBeLessThanOrEqual(41);
      }
    });

    it('respecte l ordre de grandeur croissant des valeurs selon les tiers', () => {
      const tiersMap = assignMetricTiers(advancedCountries, 'medianAge', 10);
      const tier1Countries = advancedCountries.filter((c) => tiersMap.get(c.code) === 1);
      const tier10Countries = advancedCountries.filter((c) => tiersMap.get(c.code) === 10);

      const maxTier1 = Math.max(...tier1Countries.map((c) => c.medianAge));
      const minTier10 = Math.min(...tier10Countries.map((c) => c.medianAge));

      expect(maxTier1).toBeLessThan(minTier10);
    });
  });

  describe('Calcul du bonus d écart de catégorie (calculateCategoryGapBonus)', () => {
    it('accorde un bonus élevé pour un écart faible (très serré/difficile) et faible pour un grand écart', () => {
      const bonusGap1 = calculateCategoryGapBonus(5, 6, 10); // gap = 1
      const bonusGap5 = calculateCategoryGapBonus(2, 7, 10); // gap = 5
      const bonusGap9 = calculateCategoryGapBonus(1, 10, 10); // gap = 9

      expect(bonusGap1).toBe(9); // (10 - 1) = 9
      expect(bonusGap5).toBe(5); // (10 - 5) = 5
      expect(bonusGap9).toBe(1); // (10 - 9) = 1
      expect(bonusGap1).toBeGreaterThan(bonusGap5);
      expect(bonusGap5).toBeGreaterThan(bonusGap9);
    });
  });

  describe('Générateur unifié generateSocialMetricQuestion (DRY)', () => {
    it('génère un duel pour l espérance de vie avec la valeur connue à droite', () => {
      const q = generateSocialMetricQuestion(france, advancedCountries, 'lifeExpectancy', 10);

      expect(q.category).toBe('lifeExpectancy');
      expect(q.options).toEqual(['Oui', 'Non']);
      expect(['Oui', 'Non']).toContain(q.correctAnswer);
      expect(q.secondCountry).toBeDefined();

      // Les pays comparés doivent OBLIGATOIREMENT être de catégories différentes
      expect(q.tierLeft).not.toBe(q.tierRight);
      expect(q.gap).toBeGreaterThanOrEqual(1);
      expect(q.gapBonus).toBe(10 - q.gap);

      // Valeur connue à droite dans la question
      expect(q.questionText).toContain(q.rightValueText);
      expect(q.questionText).toContain(france.name);
      expect(q.questionText).toContain(q.secondCountry.name);
      expect(q.leftValueText).toBeDefined();

      // Vérification de la réponse
      const expectedAns = france.lifeExpectancy > q.secondCountry.lifeExpectancy ? 'Oui' : 'Non';
      expect(q.correctAnswer).toBe(expectedAns);
    });

    it('génère des duels pour les 3 autres métriques : IDH, âge médian et scolarisation', () => {
      const qHdi = generateSocialMetricQuestion(espagne, advancedCountries, 'hdi', 10);
      expect(qHdi.category).toBe('hdi');
      expect(qHdi.options).toEqual(['Oui', 'Non']);
      expect(qHdi.questionText).toContain('IDH');

      const qAge = generateSocialMetricQuestion(france, advancedCountries, 'medianAge', 10);
      expect(qAge.category).toBe('medianAge');
      expect(qAge.questionText).toContain('âge médian');

      const qSchool = generateSocialMetricQuestion(espagne, advancedCountries, 'schoolingYears', 10);
      expect(qSchool.category).toBe('schoolingYears');
      expect(qSchool.questionText).toContain('scolarisation');
    });
  });
});
