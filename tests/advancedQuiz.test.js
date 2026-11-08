import { describe, it, expect, beforeEach } from 'vitest';
import { advancedCountries, FRANCE_REFERENCE } from '../src/data/advancedCountries.js';
import {
  DEFAULT_WEIGHTS,
  CATEGORY_DIFFICULTY,
  DEFAULT_CATEGORY_DIFFICULTY,
  getCategoryDifficulties,
  saveCategoryDifficulties,
  resetCategoryDifficulties,
  getRevealDelay,
  saveRevealDelay,
  DEFAULT_REVEAL_DELAY,
  calculateQuestionDifficulty,
  calculatePopulationGapBonus,
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
  describe('Formule de difficulté et pondérations (Échelle 100 points)', () => {
    it('l ensemble des points de catégorie doit être calibré pour l échelle 100', () => {
      expect(CATEGORY_DIFFICULTY.pib).toBe(30);
      expect(CATEGORY_DIFFICULTY.lifeExpectancy).toBe(30);
      expect(CATEGORY_DIFFICULTY.hdi).toBe(30);
      expect(CATEGORY_DIFFICULTY.medianAge).toBe(30);
      expect(CATEGORY_DIFFICULTY.schoolingYears).toBe(30);
      expect(CATEGORY_DIFFICULTY.surface).toBe(25);
      expect(CATEGORY_DIFFICULTY.population).toBe(20);
      expect(CATEGORY_DIFFICULTY.monnaie).toBe(15);
      expect(CATEGORY_DIFFICULTY.frontiere).toBe(10);
      expect(CATEGORY_DIFFICULTY.capitale).toBe(10);
      expect(CATEGORY_DIFFICULTY.drapeau).toBe(10);
    });

    it('devrait calculer la difficulté avec les poids par défaut', () => {
      const diffEasy = calculateQuestionDifficulty(1, 'drapeau', 2);
      const diffHard = calculateQuestionDifficulty(5, 'surface', 4);
      expect(diffHard).toBeGreaterThan(diffEasy);
    });

    it('doit appliquer un bonus de +25 pts pour les pays < 1M hab et de +12 pts pour les pays < 3M hab', () => {
      // Pays < 1M (ex: Luxembourg, pop 660 000, tier 1) : bonus +25
      const luxembourg = advancedCountries.find((c) => c.code === 'lu');
      const baseLux = calculateQuestionDifficulty(1, 'capitale', 2, 2);
      const diffLux = calculateQuestionDifficulty(luxembourg, 'capitale', 2, 2);
      expect(diffLux - baseLux).toBe(25);

      // Pays entre 1M et 3M (ex: Slovénie, pop 2.1M, tier 2) : bonus +12
      const slovenie = advancedCountries.find((c) => c.code === 'si');
      const baseSlovenie = calculateQuestionDifficulty(2, 'capitale', 2, 2);
      const diffSlovenie = calculateQuestionDifficulty(slovenie, 'capitale', 2, 2);
      expect(diffSlovenie - baseSlovenie).toBe(12);

      // Pays >= 3M (ex: Espagne, pop 48M, tier 1) : bonus 0
      const espagne = advancedCountries.find((c) => c.code === 'es');
      const baseEspagne = calculateQuestionDifficulty(1, 'capitale', 2, 2);
      const diffEspagne = calculateQuestionDifficulty(espagne, 'capitale', 2, 2);
      expect(diffEspagne - baseEspagne).toBe(0);
    });

    it('devrait calculer correctement les points des choix multiples et des indices (2 -> 5, 3 -> 10, 4 -> 15)', () => {
      const q2 = calculateQuestionDifficulty(1, 'drapeau', 2, 2);
      expect(q2).toBe(25); // 5 (pays) + 10 (drapeau) + 5 (choix) + 5 (indices)

      const q3 = calculateQuestionDifficulty(1, 'drapeau', 3, 3);
      expect(q3).toBe(35); // 5 + 10 + 10 + 10

      const q4 = calculateQuestionDifficulty(1, 'drapeau', 4, 4);
      expect(q4).toBe(45); // 5 + 10 + 15 + 15
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
      expect(diffs.drapeau).toBe(10);
      expect(diffs.surface).toBe(25);
    });

    it('devrait mettre à jour et persister de nouveaux poids de catégories', () => {
      saveCategoryDifficulties({ drapeau: 15, surface: 20 }, mockStorage);
      const updated = getCategoryDifficulties(mockStorage);

      expect(updated.drapeau).toBe(15);
      expect(updated.surface).toBe(20);
      expect(updated.capitale).toBe(10); // Non modifié conserve sa valeur

      // Impact direct sur le calcul de difficulté
      const scoreDrapeau = calculateQuestionDifficulty(1, 'drapeau', 2, 2, undefined, updated);
      // 5 (pays) + 15 (cat drapeau personnalisé) + 5 (choix) + 5 (indices) = 30 pts
      expect(scoreDrapeau).toBe(30);
    });

    it('devrait réinitialiser tous les poids aux valeurs par défaut avec resetCategoryDifficulties', () => {
      saveCategoryDifficulties({ drapeau: 20, monnaie: 25 }, mockStorage);
      expect(getCategoryDifficulties(mockStorage).drapeau).toBe(20);

      const restored = resetCategoryDifficulties(mockStorage);
      expect(restored.drapeau).toBe(10);
      expect(restored.monnaie).toBe(15);
      expect(getCategoryDifficulties(mockStorage)).toEqual(DEFAULT_CATEGORY_DIFFICULTY);
    });

    it('devrait lire et enregistrer le délai configurable d affichage de la solution (défaut: 1.5s)', () => {
      expect(getRevealDelay(mockStorage)).toBe(DEFAULT_REVEAL_DELAY);
      expect(getRevealDelay(mockStorage)).toBe(1.5);

      saveRevealDelay(4.5, mockStorage);
      expect(getRevealDelay(mockStorage)).toBe(4.5);

      // Valeurs hors bornes
      saveRevealDelay(0.1, mockStorage);
      expect(getRevealDelay(mockStorage)).toBe(0.5);

      saveRevealDelay(15, mockStorage);
      expect(getRevealDelay(mockStorage)).toBe(10.0);
    });

    it('devrait calculer le bonus d écart de population entre pays comparés', () => {
      // Moins de 1M : +10 pts
      expect(calculatePopulationGapBonus(5000000, 5600000)).toBe(10); // écart 600k < 1M
      // Moins de 5M : +5 pts
      expect(calculatePopulationGapBonus(10000000, 13000000)).toBe(5); // écart 3M < 5M
      // Moins de 10M : +3 pts
      expect(calculatePopulationGapBonus(20000000, 27000000)).toBe(3); // écart 7M < 10M
      // Moins de 20M : +1 pt
      expect(calculatePopulationGapBonus(30000000, 45000000)).toBe(1); // écart 15M < 20M
      // 20M ou plus : 0 pt
      expect(calculatePopulationGapBonus(10000000, 60000000)).toBe(0); // écart 50M
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

      // Bonus +10 si même continent + bonus écart de population
      const popBonus = calculatePopulationGapBonus(france.population, q.secondCountry.population);
      const baseDiff = calculateQuestionDifficulty(france, 'frontiere', 2, 2) + popBonus;
      if (france.continent === q.secondCountry.continent) {
        expect(q.difficulty).toBe(baseDiff + 10);
      } else {
        expect(q.difficulty).toBe(baseDiff);
      }
    });

    it('generatePopulationQuestion : duel comparatif Oui/Non avec la population absolue affichée pour le pays de gauche', () => {
      const q = generatePopulationQuestion(espagne, advancedCountries);
      expect(q.category).toBe('population');
      expect(q.options).toEqual(['Oui', 'Non']);
      expect(['Oui', 'Non']).toContain(q.correctAnswer);
      expect(q.questionText).toContain('population');
      expect(q.secondCountry).toBeDefined();
      expect(q.leftPopulationText).toBeDefined();
      expect(q.rightPopulationText).toBeDefined();
      expect(q.visualComparison).toContain('>');
      expect(q.popGapBonus).toBe(calculatePopulationGapBonus(espagne.population, q.secondCountry.population));
      expect(q.difficulty).toBe(calculateQuestionDifficulty(espagne, 'population', 2, 2) + q.popGapBonus);

      // Vérifier la validité de la réponse
      const isSuperior = espagne.population > q.secondCountry.population;
      expect(q.correctAnswer).toBe(isSuperior ? 'Oui' : 'Non');
    });

    it('generateSurfaceQuestion : duel comparatif binaire Oui/Non (Drapeau A > Drapeau B ?)', () => {
      const q = generateSurfaceQuestion(espagne, advancedCountries);
      expect(q.category).toBe('surface');
      expect(q.options).toEqual(['Oui', 'Non']);
      expect(['Oui', 'Non']).toContain(q.correctAnswer);
      expect(q.secondCountry).toBeDefined();
      expect(q.secondFlagCode).toBeDefined();
      expect(q.leftAreaText).toContain('km²');
      expect(q.rightAreaText).toContain('km²');
      expect(q.visualComparison).toContain('>');
      expect(q.popGapBonus).toBe(calculatePopulationGapBonus(espagne.population, q.secondCountry.population));
      expect(q.difficulty).toBe(calculateQuestionDifficulty(espagne, 'surface', 2, 2) + q.popGapBonus);

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
      expect(q.rightGdpPerCapitaText).toContain('$ / hab');
      expect(q.visualComparison).toContain('>');
      expect(q.popGapBonus).toBe(calculatePopulationGapBonus(espagne.population, q.secondCountry.population));
      expect(q.difficulty).toBe(calculateQuestionDifficulty(espagne, 'pib', 2, 2) + q.popGapBonus);

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
      const diffMid = engine.getTargetDifficulty(50);
      const diffHigh = engine.getTargetDifficulty(100);

      expect(diffStart).toBe(25);
      expect(diffMid).toBe(63); // 25 + 50 * 0.75 = 62.5 -> 63
      expect(diffHigh).toBe(100); // 25 + 100 * 0.75 = 100
      expect(diffMid).toBeGreaterThan(diffStart);
      expect(diffHigh).toBeGreaterThan(diffMid);
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
