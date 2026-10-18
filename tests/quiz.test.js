import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAnswer,
  getRandomQuestions,
  generateOptions,
  QuizEngine,
  getTopStreaks,
  recordStreak,
  computeLiveTopStreaks,
  LiveStreakTracker,
} from '../src/quiz.js';

const mockCountries = [
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Allemagne' },
  { code: 'es', name: 'Espagne' },
  { code: 'it', name: 'Italie' },
  { code: 'pt', name: 'Portugal' },
  { code: 'jp', name: 'Japon' },
  { code: 'ca', name: 'Canada' },
  { code: 'br', name: 'Brésil' },
];

describe('Quiz Logic - TDD Suite', () => {
  describe('checkAnswer(question, selectedAnswer)', () => {
    it('devrait retourner true lorsque la réponse sélectionnée est correcte', () => {
      const question = {
        correctAnswer: 'France',
        country: { code: 'fr', name: 'France' },
        options: ['France', 'Italie', 'Espagne', 'Allemagne'],
      };
      expect(checkAnswer(question, 'France')).toBe(true);
    });

    it('devrait retourner false lorsque la réponse sélectionnée est incorrecte', () => {
      const question = {
        correctAnswer: 'France',
        country: { code: 'fr', name: 'France' },
        options: ['France', 'Italie', 'Espagne', 'Allemagne'],
      };
      expect(checkAnswer(question, 'Italie')).toBe(false);
    });

    it('devrait gérer un objet question contenant directement la propriété country', () => {
      const question = { country: { code: 'jp', name: 'Japon' } };
      expect(checkAnswer(question, 'Japon')).toBe(true);
      expect(checkAnswer(question, 'Canada')).toBe(false);
    });

    it('devrait retourner false si la question ou la réponse est invalide', () => {
      expect(checkAnswer(null, 'France')).toBe(false);
      expect(checkAnswer(undefined, 'France')).toBe(false);
      expect(checkAnswer({ correctAnswer: 'France' }, null)).toBe(false);
    });
  });

  describe('generateOptions(correctCountry, allCountries, count)', () => {
    it('devrait générer par défaut 4 options uniques incluant la bonne réponse', () => {
      const targetCountry = { code: 'fr', name: 'France' };
      const options = generateOptions(targetCountry, mockCountries);

      expect(options).toHaveLength(4);
      expect(options).toContain('France');
      const uniqueOptions = new Set(options);
      expect(uniqueOptions.size).toBe(4);
    });

    it('devrait respecter le nombre d options demandé via le paramètre count', () => {
      const targetCountry = { code: 'it', name: 'Italie' };
      const options = generateOptions(targetCountry, mockCountries, 3);

      expect(options).toHaveLength(3);
      expect(options).toContain('Italie');
      expect(new Set(options).size).toBe(3);
    });

    it('ne devrait jamais contenir de leurres en double ni le pays cible en double', () => {
      const targetCountry = { code: 'de', name: 'Allemagne' };
      const options = generateOptions(targetCountry, mockCountries, 4);

      const occurrences = options.filter((opt) => opt === 'Allemagne').length;
      expect(occurrences).toBe(1);
    });

    it('devrait accepter un objet pays ou une chaîne de caractères pour correctCountry', () => {
      const options = generateOptions('Espagne', mockCountries, 4);
      expect(options).toContain('Espagne');
      expect(options).toHaveLength(4);
    });
  });

  describe('getRandomQuestions(countries, count)', () => {
    it('devrait extraire le nombre spécifié de questions sans doublons', () => {
      const count = 5;
      const questions = getRandomQuestions(mockCountries, count);

      expect(questions).toHaveLength(count);

      const codes = questions.map((q) => q.country.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(count);
    });

    it('devrait supporter le paramètre "tout" ou "all" pour récupérer l ensemble des questions', () => {
      const questionsTout = getRandomQuestions(mockCountries, 'tout');
      expect(questionsTout).toHaveLength(mockCountries.length);

      const questionsAll = getRandomQuestions(mockCountries, 'all');
      expect(questionsAll).toHaveLength(mockCountries.length);
    });

    it('devrait supporter une chaîne de caractères convertible en nombre (ex: "20")', () => {
      const questions = getRandomQuestions(mockCountries, '4');
      expect(questions).toHaveLength(4);
    });

    it('devrait formater chaque question avec country, options et correctAnswer', () => {
      const questions = getRandomQuestions(mockCountries, 3);
      const first = questions[0];

      expect(first).toHaveProperty('country');
      expect(first.country).toHaveProperty('code');
      expect(first.country).toHaveProperty('name');
      expect(first).toHaveProperty('options');
      expect(first.options).toHaveLength(4);
      expect(first.options).toContain(first.country.name);
      expect(first.correctAnswer).toBe(first.country.name);
    });

    it('ne devrait pas retourner plus de questions qu il n y a de pays disponibles', () => {
      const questions = getRandomQuestions(mockCountries, 20);
      expect(questions).toHaveLength(mockCountries.length);
    });

    it('devrait retourner un tableau vide si la liste de pays est vide', () => {
      expect(getRandomQuestions([], 5)).toEqual([]);
    });
  });

  describe('QuizEngine - Suivi des séries (Streaks)', () => {
    let sampleQuestions;
    let engine;

    beforeEach(() => {
      sampleQuestions = [
        {
          country: { code: 'fr', name: 'France' },
          correctAnswer: 'France',
          options: ['France', 'Italie', 'Espagne', 'Allemagne'],
        },
        {
          country: { code: 'de', name: 'Allemagne' },
          correctAnswer: 'Allemagne',
          options: ['Canada', 'Allemagne', 'Brésil', 'Japon'],
        },
        {
          country: { code: 'jp', name: 'Japon' },
          correctAnswer: 'Japon',
          options: ['Portugal', 'Italie', 'Japon', 'France'],
        },
        {
          country: { code: 'es', name: 'Espagne' },
          correctAnswer: 'Espagne',
          options: ['Espagne', 'Italie', 'Japon', 'France'],
        },
      ];
      engine = new QuizEngine(sampleQuestions);
    });

    it('devrait initialiser currentStreak et maxStreak à 0', () => {
      expect(engine.currentStreak).toBe(0);
      expect(engine.maxStreak).toBe(0);
    });

    it('devrait incrémenter currentStreak et maxStreak à chaque bonne réponse consécutive', () => {
      const res1 = engine.answer('France');
      expect(res1.currentStreak).toBe(1);
      expect(res1.maxStreak).toBe(1);
      expect(engine.currentStreak).toBe(1);
      expect(engine.maxStreak).toBe(1);

      const res2 = engine.answer('Allemagne');
      expect(res2.currentStreak).toBe(2);
      expect(res2.maxStreak).toBe(2);
      expect(engine.currentStreak).toBe(2);
      expect(engine.maxStreak).toBe(2);
    });

    it('devrait réinitialiser currentStreak à 0 lors d une mauvaise réponse tout en conservant maxStreak', () => {
      engine.answer('France'); // streak = 1
      engine.answer('Allemagne'); // streak = 2

      const res3 = engine.answer('Brésil'); // Mauvaise réponse !
      expect(res3.currentStreak).toBe(0);
      expect(res3.maxStreak).toBe(2);
      expect(engine.currentStreak).toBe(0);
      expect(engine.maxStreak).toBe(2);

      // Reprise de streak après une erreur
      const res4 = engine.answer('Espagne'); // Bonne réponse
      expect(res4.currentStreak).toBe(1);
      expect(res4.maxStreak).toBe(2);
    });

    it('devrait réinitialiser currentStreak et maxStreak lors d un reset()', () => {
      engine.answer('France');
      engine.answer('Allemagne');
      expect(engine.maxStreak).toBe(2);

      engine.reset();
      expect(engine.currentStreak).toBe(0);
      expect(engine.maxStreak).toBe(0);
    });
  });

  describe('Gestion du Top 3 des séries (getTopStreaks & recordStreak)', () => {
    let mockStorage;

    beforeEach(() => {
      const store = {};
      mockStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
          store[key] = value.toString();
        },
      };
    });

    it('devrait retourner un tableau vide si aucune série n est enregistrée', () => {
      expect(getTopStreaks(mockStorage)).toEqual([]);
    });

    it('devrait enregistrer une première série avec succès', () => {
      const result = recordStreak(5, mockStorage);
      expect(result.topStreaks).toEqual([5]);
      expect(result.isNewRecord).toBe(true);
      expect(result.rank).toBe(1);
      expect(getTopStreaks(mockStorage)).toEqual([5]);
    });

    it('devrait conserver uniquement le Top 3 trié par ordre décroissant', () => {
      recordStreak(3, mockStorage);
      recordStreak(7, mockStorage);
      recordStreak(5, mockStorage);
      recordStreak(10, mockStorage);
      recordStreak(2, mockStorage);

      const top = getTopStreaks(mockStorage);
      expect(top).toEqual([10, 7, 5]);
      expect(top).toHaveLength(3);
    });

    it('devrait indiquer le bon rang (1, 2, 3) et si c est un nouveau record absolu', () => {
      recordStreak(8, mockStorage);
      recordStreak(4, mockStorage);

      const res1 = recordStreak(12, mockStorage);
      expect(res1.rank).toBe(1);
      expect(res1.isNewRecord).toBe(true);
      expect(res1.topStreaks).toEqual([12, 8, 4]);

      const res2 = recordStreak(6, mockStorage);
      expect(res2.rank).toBe(3);
      expect(res2.isNewRecord).toBe(false);
      expect(res2.topStreaks).toEqual([12, 8, 6]);

      const res3 = recordStreak(2, mockStorage);
      expect(res3.rank).toBeNull();
      expect(res3.isNewRecord).toBe(false);
      expect(res3.topStreaks).toEqual([12, 8, 6]);
    });

    it('ne devrait pas enregistrer les séries nulles ou négatives', () => {
      const res = recordStreak(0, mockStorage);
      expect(res.rank).toBeNull();
      expect(res.topStreaks).toEqual([]);
      expect(getTopStreaks(mockStorage)).toEqual([]);
    });

    it('devrait résister aux données corrompues dans le storage', () => {
      mockStorage.setItem('flags_quiz_top_streaks', 'not-valid-json');
      expect(getTopStreaks(mockStorage)).toEqual([]);
    });
  });

  describe('Alimentation en direct du Top 3 (computeLiveTopStreaks & LiveStreakTracker)', () => {
    it('devrait calculer le Top 3 dynamique sans dupliquer la série en cours', () => {
      const baseline = [10, 8, 5];

      // Série inférieure au top 3
      const live1 = computeLiveTopStreaks(baseline, 4);
      expect(live1.isLiveInTop3).toBe(false);
      expect(live1.rank).toBeNull();
      expect(live1.topStreaks).toEqual([10, 8, 5]);

      // Série entrant en 3ème position
      const live2 = computeLiveTopStreaks(baseline, 6);
      expect(live2.isLiveInTop3).toBe(true);
      expect(live2.rank).toBe(3);
      expect(live2.topStreaks).toEqual([10, 8, 6]);

      // Même série qui progresse en 2ème position
      const live3 = computeLiveTopStreaks(baseline, 9);
      expect(live3.isLiveInTop3).toBe(true);
      expect(live3.rank).toBe(2);
      expect(live3.topStreaks).toEqual([10, 9, 8]); // Le 6 de tout à l'heure n'a pas pollué la 3ème place !

      // Série qui bat le record absolu (#1)
      const live4 = computeLiveTopStreaks(baseline, 15);
      expect(live4.isLiveInTop3).toBe(true);
      expect(live4.rank).toBe(1);
      expect(live4.isNewRecord).toBe(true);
      expect(live4.topStreaks).toEqual([15, 10, 8]);
    });

    it('LiveStreakTracker devrait mettre à jour et persister le Top 3 en temps réel', () => {
      const store = {};
      const mockStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v.toString(); },
      };

      // Historique de départ : [10, 8, 5] (3 scores établis)
      recordStreak(10, mockStorage);
      recordStreak(8, mockStorage);
      recordStreak(5, mockStorage);

      const tracker = new LiveStreakTracker(mockStorage);
      expect(tracker.baseline).toEqual([10, 8, 5]);

      // Le joueur progresse dans sa série : 4 n'entre pas dans le top 3
      const live4 = tracker.update(4);
      expect(live4.isLiveInTop3).toBe(false);
      expect(getTopStreaks(mockStorage)).toEqual([10, 8, 5]);

      // Atteint 6 : entre au rang 3 en direct !
      const live6 = tracker.update(6);
      expect(live6.isLiveInTop3).toBe(true);
      expect(live6.rank).toBe(3);
      expect(live6.topStreaks).toEqual([10, 8, 6]);
      expect(getTopStreaks(mockStorage)).toEqual([10, 8, 6]);

      // Atteint 9 : progresse dans la même série au rang 2 !
      const live9 = tracker.update(9);
      expect(live9.rank).toBe(2);
      expect(live9.topStreaks).toEqual([10, 9, 8]);
      expect(getTopStreaks(mockStorage)).toEqual([10, 9, 8]);

      // Le joueur fait une erreur : fin de cette série
      tracker.onStreakEnd();
      expect(tracker.baseline).toEqual([10, 9, 8]); // Nouvelle base verrouillée

      // Nouvelle série qui commence : atteint 9 (égalise la 2e place)
      const newRun = tracker.update(9);
      expect(newRun.rank).toBe(2);
      expect(newRun.topStreaks).toEqual([10, 9, 9]);
      expect(getTopStreaks(mockStorage)).toEqual([10, 9, 9]);
    });
  });
});
