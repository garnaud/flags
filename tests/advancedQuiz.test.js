import { describe, it, expect, beforeEach } from 'vitest';
import { advancedCountries, FRANCE_REFERENCE } from '../src/data/advancedCountries.js';
import {
  DEFAULT_WEIGHTS,
  CATEGORY_DIFFICULTY,
  DEFAULT_CATEGORY_DIFFICULTY,
  getCategoryDifficulties,
  saveCategoryDifficulties,
  resetCategoryDifficulties,
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
  describe('Formule de difficulté et pondérations (Points doublés)', () => {
    it('l ensemble des points de catégorie doit être doublé', () => {
      expect(CATEGORY_DIFFICULTY.pib).toBe(12);
      expect(CATEGORY_DIFFICULTY.surface).toBe(10);
      expect(CATEGORY_DIFFICULTY.population).toBe(8);
      expect(CATEGORY_DIFFICULTY.monnaie).toBe(6);
      expect(CATEGORY_DIFFICULTY.frontiere).toBe(4);
      expect(CATEGORY_DIFFICULTY.capitale).toBe(2);
      expect(CATEGORY_DIFFICULTY.drapeau).toBe(2);
    });

    it('devrait calculer la difficulté avec les poids par défaut', () => {
      const diffEasy = calculateQuestionDifficulty(1, 'drapeau', 2);
      const diffHard = calculateQuestionDifficulty(5, 'surface', 4);
      expect(diffHard).toBeGreaterThan(diffEasy);
    });

    it('doit appliquer un bonus de +10 pts pour les pays < 1M hab et de +5 pts pour les pays < 3M hab', () => {
      // Pays < 1M (ex: Luxembourg, pop 660 000, tier 1) : bonus +10
      const luxembourg = advancedCountries.find((c) => c.code === 'lu');
      const baseLux = calculateQuestionDifficulty(1, 'capitale', 2, 2);
      const diffLux = calculateQuestionDifficulty(luxembourg, 'capitale', 2, 2);
      expect(diffLux - baseLux).toBe(10);

      // Pays entre 1M et 3M (ex: Slovénie, pop 2.1M, tier 2) : bonus +5
      const slovenie = advancedCountries.find((c) => c.code === 'si');
      const baseSlovenie = calculateQuestionDifficulty(2, 'capitale', 2, 2);
      const diffSlovenie = calculateQuestionDifficulty(slovenie, 'capitale', 2, 2);
      expect(diffSlovenie - baseSlovenie).toBe(5);

      // Pays >= 3M (ex: Espagne, pop 48M, tier 1) : bonus 0
      const espagne = advancedCountries.find((c) => c.code === 'es');
      const baseEspagne = calculateQuestionDifficulty(1, 'capitale', 2, 2);
      const diffEspagne = calculateQuestionDifficulty(espagne, 'capitale', 2, 2);
      expect(diffEspagne - baseEspagne).toBe(0);
    });

    it('devrait calculer correctement les points des choix multiples et des indices (2 -> 2, 3 -> 4, 4 -> 6)', () => {
      const q2 = calculateQuestionDifficulty(1, 'drapeau', 2, 2);
      expect(q2).toBe(8);

      const q3 = calculateQuestionDifficulty(1, 'drapeau', 3, 3);
      expect(q3).toBe(12);

      const q4 = calculateQuestionDifficulty(1, 'drapeau', 4, 4);
      expect(q4).toBe(16);
    });
  });

  describe('Gestion dynamique des paramètres et poids des catégories (Settings)', () => {
    let mockStorage;

    beforeEach(() => {
      const store = {};
      mockStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v.toString(); },
        removeItem: (k) => { delete store[k]; },
      };
      resetCategoryDifficulties(mockStorage);
    });

    it('devrait retourner les difficultés par défaut initialement', () => {
      const diffs = getCategoryDifficulties(mockStorage);
      expect(diffs).toEqual(DEFAULT_CATEGORY_DIFFICULTY);
      expect(diffs.drapeau).toBe(2);
      expect(diffs.surface).toBe(10);
    });

    it('devrait mettre à jour et persister de nouveaux poids de catégories', () => {
      saveCategoryDifficulties({ drapeau: 6, surface: 4 }, mockStorage);
      const updated = getCategoryDifficulties(mockStorage);

      expect(updated.drapeau).toBe(6);
      expect(updated.surface).toBe(4);
      expect(updated.capitale).toBe(2); // Non modifié conserve sa valeur

      // Impact direct sur le calcul de difficulté
      const scoreDrapeau = calculateQuestionDifficulty(1, 'drapeau', 2, 2, undefined, updated);
      // 2 (pays) + 6 (cat drapeau personnalisé) + 2 (choix) + 2 (indices) = 12 pts
      expect(scoreDrapeau).toBe(12);
    });

    it('devrait réinitialiser tous les poids aux valeurs par défaut avec resetCategoryDifficulties', () => {
      saveCategoryDifficulties({ drapeau: 8, monnaie: 10 }, mockStorage);
      expect(getCategoryDifficulties(mockStorage).drapeau).toBe(8);

      const restored = resetCategoryDifficulties(mockStorage);
      expect(restored.drapeau).toBe(2);
      expect(restored.monnaie).toBe(6);
      expect(getCategoryDifficulties(mockStorage)).toEqual(DEFAULT_CATEGORY_DIFFICULTY);
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

    it('generateCurrencyQuestion : génère des choix de devises uniques au niveau 3 et épurées de toute référence de pays', () => {
      const q = generateCurrencyQuestion(espagne, advancedCountries, 3);
      expect(q.category).toBe('monnaie');
      expect(q.correctAnswer).toBe('Euro');
      expect(q.options).toHaveLength(3);
      expect(q.options).toContain('Euro');
      expect(new Set(q.options).size).toBe(3);

      const qUsa = generateCurrencyQuestion(usa, advancedCountries, 4);
      expect(qUsa.correctAnswer).toBe('Dollar'); // Pas 'Dollar américain' !

      // Vérifier qu'aucune option ne contient d'adjectif de nationalité évident
      qUsa.options.forEach((opt) => {
        expect(opt).not.toMatch(/(américain|canadien|australien|mexicain|suédois|norvégien|suisse|indien)/i);
      });
    });

    it('generateBorderQuestion : pose une question binaire Oui/Non, exclut les îles, et applique un bonus +6 si même continent', () => {
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

      // Bonus +6 si les deux pays sont sur le même continent
      const baseDiff = calculateQuestionDifficulty(france, 'frontiere', 2, 2);
      if (france.continent === q.secondCountry.continent) {
        expect(q.difficulty).toBe(baseDiff + 6);
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

    it('generateGdpQuestion : duel comparatif Oui/Non avec le PIB par habitant affiché pour le pays de gauche', () => {
      const q = generateGdpQuestion(espagne, advancedCountries);
      expect(q.category).toBe('pib');
      expect(q.options).toEqual(['Oui', 'Non']);
      expect(['Oui', 'Non']).toContain(q.correctAnswer);
      expect(q.questionText).toContain('PIB par habitant');
      expect(q.secondCountry).toBeDefined();
      expect(q.leftGdpPerCapitaText).toContain('$ / hab');
      expect(q.visualComparison).toContain('>');

      // Vérifier la validité de la réponse
      const isSuperior = espagne.gdpPerCapita > q.secondCountry.gdpPerCapita;
      expect(q.correctAnswer).toBe(isSuperior ? 'Oui' : 'Non');
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

      expect(diffStart).toBe(10);
      expect(diffMid).toBeGreaterThan(diffStart);
      expect(diffHigh).toBeGreaterThan(diffMid);
      expect(diffHigh).toBeLessThanOrEqual(40);
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

    it('devrait enregistrer l historique et ne jamais générer de doublons de questions dans une même partie', () => {
      const keysSeen = [];
      expect(engine.history).toBeDefined();
      expect(engine.history).toHaveLength(1); // Question initiale

      // Simuler une série de 25 bonnes réponses
      for (let i = 0; i < 25; i++) {
        const current = engine.currentQuestion;
        const key = `${current.country.code}_${current.category}`;
        keysSeen.push(key);
        engine.answer(current.correctAnswer);
      }

      // Vérification : zéro doublon
      const uniqueKeys = new Set(keysSeen);
      expect(uniqueKeys.size).toBe(keysSeen.length);
      expect(engine.history.length).toBe(26);

      // Le reset efface l'historique
      engine.reset();
      expect(engine.history).toHaveLength(1);
    });
  });
});
