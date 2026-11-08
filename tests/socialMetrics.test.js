import { describe, it, expect } from 'vitest';
import { advancedCountries } from '../src/data/advancedCountries.js';
import { calculateQuestionDifficulty } from '../src/advancedQuiz.js';
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
    it('répartit équitablement les pays en 5 quintiles par défaut (K = 5)', () => {
      const tiersMap = assignMetricTiers(advancedCountries, 'lifeExpectancy', 5);
      expect(tiersMap.size).toBe(advancedCountries.length);

      const counts = {};
      tiersMap.forEach((tier) => {
        counts[tier] = (counts[tier] || 0) + 1;
      });

      // 5 catégories bien créées
      expect(Object.keys(counts).length).toBe(5);
      // Chaque quintile contient environ 39 pays (37 à 41)
      for (let t = 1; t <= 5; t++) {
        expect(counts[t]).toBeGreaterThanOrEqual(37);
        expect(counts[t]).toBeLessThanOrEqual(41);
      }
    });

    it('permet de tuner facilement le nombre de catégories (ex: K = 10 déciles)', () => {
      const tiersMap10 = assignMetricTiers(advancedCountries, 'hdi', 10);
      const counts10 = {};
      tiersMap10.forEach((tier) => {
        counts10[tier] = (counts10[tier] || 0) + 1;
      });

      expect(Object.keys(counts10).length).toBe(10);
      for (let t = 1; t <= 10; t++) {
        expect(counts10[t]).toBeGreaterThanOrEqual(18);
        expect(counts10[t]).toBeLessThanOrEqual(22);
      }
    });

    it('respecte l ordre de grandeur croissant des valeurs selon les tiers', () => {
      const tiersMap = assignMetricTiers(advancedCountries, 'medianAge', 5);
      const tier1Countries = advancedCountries.filter((c) => tiersMap.get(c.code) === 1);
      const tier5Countries = advancedCountries.filter((c) => tiersMap.get(c.code) === 5);

      const maxTier1 = Math.max(...tier1Countries.map((c) => c.medianAge));
      const minTier5 = Math.min(...tier5Countries.map((c) => c.medianAge));

      expect(maxTier1).toBeLessThan(minTier5);
    });
  });

  describe('Calcul du bonus d écart de catégorie (calculateCategoryGapBonus)', () => {
    it('accorde un bonus élevé pour un écart faible (très serré/difficile) et faible pour un grand écart', () => {
      const bonusGap1 = calculateCategoryGapBonus(1, 2, 5, 2.5); // gap = 1 -> (5 - 1)*2.5 = 10
      const bonusGap2 = calculateCategoryGapBonus(1, 3, 5, 2.5); // gap = 2 -> (5 - 2)*2.5 = 7.5 -> 8
      const bonusGap4 = calculateCategoryGapBonus(1, 5, 5, 2.5); // gap = 4 -> (5 - 4)*2.5 = 2.5 -> 3

      expect(bonusGap1).toBe(10);
      expect(bonusGap2).toBe(8);
      expect(bonusGap4).toBe(3);
      expect(bonusGap1).toBeGreaterThan(bonusGap2);
      expect(bonusGap2).toBeGreaterThan(bonusGap4);
    });
  });

  describe('Générateur unifié generateSocialMetricQuestion (DRY)', () => {
    it('génère un duel pour l espérance de vie avec la valeur connue à droite', () => {
      const q = generateSocialMetricQuestion(france, advancedCountries, 'lifeExpectancy', 5);

      expect(q.category).toBe('lifeExpectancy');
      expect(q.options).toEqual(['Oui', 'Non']);
      expect(['Oui', 'Non']).toContain(q.correctAnswer);
      expect(q.secondCountry).toBeDefined();

      // Les pays comparés doivent OBLIGATOIREMENT être de catégories différentes
      expect(q.tierLeft).not.toBe(q.tierRight);
      expect(q.gap).toBeGreaterThanOrEqual(1);
      expect(q.gapBonus).toBe(calculateCategoryGapBonus(q.tierLeft, q.tierRight, 5, 2.5));
      expect(q.gapBonus).toBeGreaterThanOrEqual(3);
      expect(q.gapBonus).toBeLessThanOrEqual(10);

      // Valeur connue à droite dans la question
      expect(q.questionText).toContain(q.rightValueText);
      expect(q.questionText).toContain(france.name);
      expect(q.questionText).toContain(q.secondCountry.name);
      expect(q.leftValueText).toBeDefined();

      // Bonus d'écart de population et difficulté totale
      expect(q.popGapBonus).toBeDefined();
      const baseDiff = calculateQuestionDifficulty(france, 'lifeExpectancy', 2, 2);
      expect(q.difficulty).toBe(baseDiff + q.gapBonus + q.popGapBonus);

      // Vérification de la réponse
      const expectedAns = france.lifeExpectancy > q.secondCountry.lifeExpectancy ? 'Oui' : 'Non';
      expect(q.correctAnswer).toBe(expectedAns);
    });

    it('génère des duels pour les 3 autres métriques : IDH, âge médian et scolarisation', () => {
      const qHdi = generateSocialMetricQuestion(espagne, advancedCountries, 'hdi', 5);
      expect(qHdi.category).toBe('hdi');
      expect(qHdi.options).toEqual(['Oui', 'Non']);
      expect(qHdi.questionText).toContain('IDH');

      const qAge = generateSocialMetricQuestion(france, advancedCountries, 'medianAge', 5);
      expect(qAge.category).toBe('medianAge');
      expect(qAge.questionText).toContain('âge médian');

      const qSchool = generateSocialMetricQuestion(espagne, advancedCountries, 'schoolingYears', 5);
      expect(qSchool.category).toBe('schoolingYears');
      expect(qSchool.questionText).toContain('scolarisation');
    });
  });
});
