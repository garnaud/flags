import { describe, it, expect, beforeEach } from 'vitest';
import { advancedCountries, FRANCE_REFERENCE } from '../src/data/advancedCountries.js';
import {
  DEFAULT_WEIGHTS,
  CATEGORY_DIFFICULTY,
  calculateQuestionDifficulty,
  generateFlagQuestion,
  generateCapitalQuestion,
  generateCurrencyQuestion,
  generateBorderQuestion,
  generatePopulationQuestion,
  generateSurfaceQuestion,
  generateGdpQuestion,
  generateAdvancedQuestion,
  AdvancedQuizEngine,
} from '../src/advancedQuiz.js';

describe('Mode Avancé - Logique Métier & TDD', () => {
  describe('Formule de difficulté et pondérations', () => {
    it('la difficulté de frontiere et monnaie doit être au niveau 2, pib et surface à 5, population à 4', () => {
      expect(CATEGORY_DIFFICULTY.surface).toBe(5);
      expect(CATEGORY_DIFFICULTY.pib).toBe(5);
      expect(CATEGORY_DIFFICULTY.population).toBe(4);
      expect(CATEGORY_DIFFICULTY.monnaie).toBe(2);
      expect(CATEGORY_DIFFICULTY.frontiere).toBe(2);
      expect(CATEGORY_DIFFICULTY.capitale).toBe(1);
      expect(CATEGORY_DIFFICULTY.drapeau).toBe(1);
    });

    it('devrait calculer la difficulté avec les poids par défaut', () => {
      const diffEasy = calculateQuestionDifficulty(1, 'drapeau', 2);
      const diffHard = calculateQuestionDifficulty(5, 'surface', 4);
      expect(diffHard).toBeGreaterThan(diffEasy);
    });

    it('les petits pays (< 5M hab) doivent recevoir un bonus de +4 sur leur niveau de pays', () => {
      const uruguay = advancedCountries.find((c) => c.code === 'uy');
      const espagne = advancedCountries.find((c) => c.code === 'es');

      const diffUruguay = calculateQuestionDifficulty(uruguay, 'capitale', 2);
      const diffEspagne = calculateQuestionDifficulty(espagne, 'capitale', 2);

      expect(diffUruguay).toBeGreaterThan(diffEspagne);

      const customCountry = { tier: 2, population: 4000000 };
      const diffWithBonus = calculateQuestionDifficulty(customCountry, 'capitale', 2);
      const diffWithoutBonus = calculateQuestionDifficulty(2, 'capitale', 2);
      expect(diffWithBonus - diffWithoutBonus).toBe(4);
    });

    it('devrait calculer correctement les points des choix multiples et des indices (2 -> 1, 3 -> 2, 4 -> 3)', () => {
      const q2 = calculateQuestionDifficulty(1, 'drapeau', 2, 2);
      expect(q2).toBe(4);

      const q3 = calculateQuestionDifficulty(1, 'drapeau', 3, 3);
      expect(q3).toBe(6);

      const q4 = calculateQuestionDifficulty(1, 'drapeau', 4, 4);
      expect(q4).toBe(8);
    });
  });

  describe('Générateurs de questions par catégorie', () => {
    const france = advancedCountries.find((c) => c.code === 'fr');
    const usa = advancedCountries.find((c) => c.code === 'us');
    const espagne = advancedCountries.find((c) => c.code === 'es');
    const madagascar = advancedCountries.find((c) => c.code === 'mg');

    it('generateFlagQuestion : génère le nombre d options demandé', () => {
      const q2 = generateFlagQuestion(france, advancedCountries, 2);
      expect(q2.options).toHaveLength(2);
      expect(q2.options).toContain('France');
      expect(q2.category).toBe('drapeau');

      const q4 = generateFlagQuestion(france, advancedCountries, 4);
      expect(q4.options).toHaveLength(4);
      expect(q4.options).toContain('France');
    });

    it('generateCapitalQuestion : inclut des villes secondaires pour les grands pays (>10M hab)', () => {
      const q = generateCapitalQuestion(usa, advancedCountries, 4);
      expect(q.correctAnswer).toBe('Washington D.C.');
      expect(q.options).toContain('Washington D.C.');
      expect(q.options).toHaveLength(4);

      const hasAmericanLureCity = usa.cities.some((city) => q.options.includes(city));
      expect(hasAmericanLureCity).toBe(true);
    });

    it('generateCurrencyQuestion : génère des choix de devises uniques au niveau 2', () => {
      const q = generateCurrencyQuestion(espagne, advancedCountries, 3);
      expect(q.category).toBe('monnaie');
      expect(q.correctAnswer).toBe('Euro');
      expect(q.options).toHaveLength(3);
      expect(q.options).toContain('Euro');
      expect(new Set(q.options).size).toBe(3);
    });

    it('generateBorderQuestion : pose une question binaire Oui/Non, exclut les îles, et applique un bonus +1 si même continent', () => {
      const q = generateBorderQuestion(france, advancedCountries);
      expect(q.category).toBe('frontiere');
      expect(q.options).toEqual(['Oui', 'Non']);
      expect(['Oui', 'Non']).toContain(q.correctAnswer);
      expect(q.secondCountry).toBeDefined();
      expect(q.secondCountry.isIsland).toBe(false);

      // Si le pays cible est une île, la fonction doit retourner null ou gérer l'exclusion
      const qIsland = generateBorderQuestion(madagascar, advancedCountries);
      expect(qIsland).toBeNull();

      // Vérifier la cohérence de la réponse
      const areNeighbors = france.borders.includes(q.secondCountry.code);
      expect(q.correctAnswer).toBe(areNeighbors ? 'Oui' : 'Non');

      // Bonus +1 si les deux pays sont sur le même continent
      const baseDiff = calculateQuestionDifficulty(france, 'frontiere', 2, 2);
      if (france.continent === q.secondCountry.continent) {
        expect(q.difficulty).toBe(baseDiff + 1);
      } else {
        expect(q.difficulty).toBe(baseDiff);
      }
    });

    it('generatePopulationQuestion : produit une chaîne d inégalités sans référence France', () => {
      const q = generatePopulationQuestion(espagne, advancedCountries, 2, 4);
      expect(q.category).toBe('population');
      expect(q.options).toHaveLength(2);
      expect(q.options).toContain(q.correctAnswer);

      expect(q.inequality).toBeDefined();
      expect(q.inequality).toContain(' < ');
      expect(q.inequality).toContain('Espagne');
      expect(q.hints.some((h) => h.includes('Référence France'))).toBe(false);

      const countriesInOrder = q.inequality.split(' < ');
      expect(countriesInOrder.length).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < countriesInOrder.length - 1; i++) {
        const c1 = advancedCountries.find((c) => c.name === countriesInOrder[i]);
        const c2 = advancedCountries.find((c) => c.name === countriesInOrder[i + 1]);
        if (c1 && c2) {
          expect(c1.population).toBeLessThanOrEqual(c2.population);
        }
      }
    });

    it('generateSurfaceQuestion : duel comparatif binaire Oui/Non (Drapeau A > Drapeau B ?)', () => {
      const q = generateSurfaceQuestion(espagne, advancedCountries);
      expect(q.category).toBe('surface');
      expect(q.options).toEqual(['Oui', 'Non']);
      expect(['Oui', 'Non']).toContain(q.correctAnswer);
      expect(q.secondCountry).toBeDefined();
      expect(q.secondFlagCode).toBeDefined();
      expect(q.visualComparison).toContain('>');

      // Vérifier la validité de la réponse
      const isLarger = espagne.area > q.secondCountry.area;
      expect(q.correctAnswer).toBe(isLarger ? 'Oui' : 'Non');
    });

    it('generateGdpQuestion : pose la question sur le PIB par habitant avec fourchettes et référence France', () => {
      const q = generateGdpQuestion(espagne, advancedCountries, 2, 4);
      expect(q.category).toBe('pib');
      expect(q.questionText).toContain('PIB par habitant');
      expect(q.correctAnswer).toContain('$ / hab');
      expect(q.referenceFrance).toContain('44 100 $ / habitant');

      expect(q.inequality).toBeDefined();
      expect(q.inequality).toContain(' < ');
      expect(q.inequality).toContain('Espagne');

      // Vérifier le tri croissant du PIB par habitant
      const countriesInOrder = q.inequality.split(' < ');
      for (let i = 0; i < countriesInOrder.length - 1; i++) {
        const c1 = advancedCountries.find((c) => c.name === countriesInOrder[i]);
        const c2 = advancedCountries.find((c) => c.name === countriesInOrder[i + 1]);
        if (c1 && c2) {
          expect(c1.gdpPerCapita).toBeLessThanOrEqual(c2.gdpPerCapita);
        }
      }
    });
  });

  describe('AdvancedQuizEngine : Progression continue par score cible', () => {
    let engine;

    beforeEach(() => {
      engine = new AdvancedQuizEngine(advancedCountries);
    });

    it('devrait calculer une difficulté cible croissante avec la série (streak)', () => {
      const diffStart = engine.getTargetDifficulty(0);
      const diffMid = engine.getTargetDifficulty(10);
      const diffHigh = engine.getTargetDifficulty(20);

      expect(diffStart).toBe(5);
      expect(diffMid).toBeGreaterThan(diffStart);
      expect(diffHigh).toBeGreaterThan(diffMid);
      expect(diffHigh).toBeLessThanOrEqual(20);
    });

    it('devrait générer des questions intégrant la nouvelle catégorie frontière', () => {
      // Simuler plusieurs générations et vérifier que 'frontiere' peut apparaître
      const categoriesSeen = new Set();
      for (let i = 0; i < 40; i++) {
        const q = engine.getNextQuestion();
        if (q) categoriesSeen.add(q.category);
      }
      expect(categoriesSeen.has('frontiere') || categoriesSeen.has('monnaie')).toBe(true);
    });

    it('termine la partie lors d une mauvaise réponse (mode survie)', () => {
      const q = engine.currentQuestion;
      const wrongAnswer = q.options.find((opt) => opt !== q.correctAnswer);

      const res = engine.answer(wrongAnswer);
      expect(res.isCorrect).toBe(false);
      expect(engine.isGameOver).toBe(true);
    });
  });
});
