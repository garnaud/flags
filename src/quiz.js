/**
 * Vérifie si la réponse sélectionnée correspond à la bonne réponse de la question.
 *
 * @param {Object|string} question - L'objet question ou le nom du pays attendu
 * @param {string} selectedAnswer - La réponse choisie par l'utilisateur
 * @returns {boolean} true si la réponse est correcte, false sinon
 */
export function checkAnswer(question, selectedAnswer) {
  if (!question || !selectedAnswer) {
    return false;
  }

  const correctAnswer =
    question.correctAnswer ??
    question.country?.name ??
    question.name ??
    (typeof question === 'string' ? question : null);

  return correctAnswer === selectedAnswer;
}

/**
 * Mélange un tableau de façon aléatoire (algorithme de Fisher-Yates).
 *
 * @template T
 * @param {T[]} array
 * @returns {T[]} Nouveau tableau mélangé
 */
function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Génère une liste d'options comprenant la bonne réponse et (count - 1) leurres uniques.
 *
 * @param {Object|string} correctCountry - Le pays cible (objet ou nom)
 * @param {Array<{code: string, name: string}>} allCountries - L'ensemble des pays disponibles
 * @param {number} [count=4] - Nombre total d'options à générer
 * @returns {string[]} Liste des noms des pays mélangés
 */
export function generateOptions(correctCountry, allCountries, count = 4) {
  const correctName =
    typeof correctCountry === 'object' && correctCountry !== null
      ? correctCountry.name
      : correctCountry;

  // Filtrer pour éliminer la réponse correcte des leurres
  const availableLures = allCountries
    .map((c) => (typeof c === 'object' ? c.name : c))
    .filter((name) => name !== correctName);

  // Extraire (count - 1) leurres uniques aléatoires
  const shuffledLures = shuffleArray(availableLures);
  const selectedLures = shuffledLures.slice(0, Math.max(0, count - 1));

  // Combiner la bonne réponse avec les leurres puis mélanger le tout
  return shuffleArray([correctName, ...selectedLures]);
}

/**
 * Extrait N questions aléatoires et uniques à partir d'une liste de pays.
 *
 * @param {Array<{code: string, name: string}>} countries - Liste complète des pays
 * @param {number|string} [count=10] - Nombre de questions souhaitées (ou 'tout' / 'all')
 * @returns {Array<{country: {code: string, name: string}, options: string[], correctAnswer: string}>}
 */
export function getRandomQuestions(countries, count = 10) {
  if (!Array.isArray(countries) || countries.length === 0) {
    return [];
  }

  let effectiveCount;
  if (count === 'tout' || count === 'all') {
    effectiveCount = countries.length;
  } else {
    const parsed = Number(count);
    if (isNaN(parsed) || parsed <= 0) {
      return [];
    }
    effectiveCount = Math.min(parsed, countries.length);
  }

  const shuffledCountries = shuffleArray(countries).slice(0, effectiveCount);

  return shuffledCountries.map((country) => ({
    country,
    options: generateOptions(country, countries, 4),
    correctAnswer: country.name,
  }));
}

/**
 * Moteur de gestion de la partie de quiz avec suivi du score et des séries (streaks).
 */
export class QuizEngine {
  /**
   * @param {Array<{country: Object, options: string[], correctAnswer: string}>} questions
   */
  constructor(questions = []) {
    this.questions = [...questions];
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
  }

  /**
   * Indique si la partie est terminée.
   * @returns {boolean}
   */
  get isGameOver() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  /**
   * Nombre total de questions.
   * @returns {number}
   */
  get totalQuestions() {
    return this.questions.length;
  }

  /**
   * Récupère la question actuellement active, ou null si terminé.
   * @returns {Object|null}
   */
  getCurrentQuestion() {
    if (this.isGameOver) {
      return null;
    }
    return this.questions[this.currentQuestionIndex] ?? null;
  }

  /**
   * Soumet une réponse pour la question courante et avance d'un cran.
   * Met à jour le score, currentStreak et maxStreak.
   *
   * @param {string} selectedAnswer
   * @returns {{ isCorrect: boolean, score: number, currentStreak: number, maxStreak: number, isGameOver: boolean }}
   */
  answer(selectedAnswer) {
    if (this.isGameOver) {
      return {
        isCorrect: false,
        score: this.score,
        currentStreak: this.currentStreak,
        maxStreak: this.maxStreak,
        isGameOver: true,
      };
    }

    const currentQuestion = this.getCurrentQuestion();
    const isCorrect = checkAnswer(currentQuestion, selectedAnswer);

    if (isCorrect) {
      this.score += 1;
      this.currentStreak += 1;
      if (this.currentStreak > this.maxStreak) {
        this.maxStreak = this.currentStreak;
      }
    } else {
      this.currentStreak = 0;
    }

    this.currentQuestionIndex += 1;

    return {
      isCorrect,
      score: this.score,
      currentStreak: this.currentStreak,
      maxStreak: this.maxStreak,
      isGameOver: this.isGameOver,
    };
  }

  /**
   * Réinitialise la partie, les compteurs de score et de série.
   *
   * @param {Array<Object>} [newQuestions] - Nouvelles questions optionnelles
   */
  reset(newQuestions) {
    if (Array.isArray(newQuestions)) {
      this.questions = [...newQuestions];
    }
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
  }
}

export const STORAGE_KEY_TOP_STREAKS = 'flags_quiz_top_streaks';

/**
 * Résout le gestionnaire de stockage (localStorage ou stockage mocké injecté).
 *
 * @param {Storage|Object} [customStorage]
 * @returns {Storage|Object|null}
 */
function resolveStorage(customStorage) {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Récupère le Top 3 des séries de bonnes réponses consécutives sauvegardées.
 *
 * @param {Storage|Object} [storage] - Stockage optionnel (par défaut localStorage)
 * @returns {number[]} Tableau des 3 meilleures séries triées de manière décroissante
 */
export function getTopStreaks(storage) {
  const store = resolveStorage(storage);
  if (!store) return [];

  try {
    const raw = store.getItem(STORAGE_KEY_TOP_STREAKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((n) => typeof n === 'number' && !isNaN(n) && n > 0)
      .sort((a, b) => b - a)
      .slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * Enregistre une nouvelle série et met à jour le Top 3.
 *
 * @param {number} streak - Série de bonnes réponses obtenue
 * @param {Storage|Object} [storage] - Stockage optionnel
 * @returns {{ topStreaks: number[], isNewRecord: boolean, rank: number|null }}
 */
export function recordStreak(streak, storage) {
  const store = resolveStorage(storage);
  const currentTop = getTopStreaks(store);

  if (typeof streak !== 'number' || streak <= 0 || isNaN(streak)) {
    return {
      topStreaks: currentTop,
      isNewRecord: false,
      rank: null,
    };
  }

  const previousBest = currentTop.length > 0 ? currentTop[0] : 0;
  const isNewRecord = streak > previousBest;

  // Fusionner, trier par ordre décroissant et conserver le Top 3
  const combined = [...currentTop, streak].sort((a, b) => b - a);
  const newTop = combined.slice(0, 3);

  // Vérifier si la série s'est hissée dans le top 3 et à quel rang (1, 2 ou 3)
  const index = newTop.indexOf(streak);
  const rank = index !== -1 ? index + 1 : null;

  if (store) {
    try {
      store.setItem(STORAGE_KEY_TOP_STREAKS, JSON.stringify(newTop));
    } catch (e) {
      console.warn('Impossible de sauvegarder la série dans le stockage local', e);
    }
  }

  return {
    topStreaks: newTop,
    isNewRecord,
    rank,
  };
}

/**
 * Calcule le Top 3 dynamique en injectant la série en cours dans la base de référence existante,
 * sans dupliquer les étapes intermédiaires de la même série.
 *
 * @param {number[]} baseline - Les meilleures séries de référence établies
 * @param {number} currentStreak - La série actuelle en cours de jeu
 * @returns {{ topStreaks: number[], isLiveInTop3: boolean, rank: number|null, isNewRecord: boolean }}
 */
export function computeLiveTopStreaks(baseline = [], currentStreak = 0) {
  if (typeof currentStreak !== 'number' || currentStreak <= 0 || isNaN(currentStreak)) {
    return {
      topStreaks: [...baseline].slice(0, 3),
      isLiveInTop3: false,
      rank: null,
      isNewRecord: false,
    };
  }

  const previousBest = baseline.length > 0 ? baseline[0] : 0;
  const isNewRecord = currentStreak > previousBest;

  // Fusionner la série en cours avec la base de référence et garder les 3 meilleures
  const combined = [...baseline, currentStreak].sort((a, b) => b - a);
  const topStreaks = combined.slice(0, 3);

  // Vérifier si la série en cours figure dans le top 3 et à quel rang
  const index = topStreaks.indexOf(currentStreak);
  const rank = index !== -1 ? index + 1 : null;
  const isLiveInTop3 = rank !== null;

  return {
    topStreaks,
    isLiveInTop3,
    rank,
    isNewRecord,
  };
}

/**
 * Gestionnaire temps réel du Top 3 des séries de bonnes réponses.
 */
export class LiveStreakTracker {
  /**
   * @param {Storage|Object} [storage] - Gestionnaire de stockage (localStorage par défaut)
   */
  constructor(storage) {
    this.storage = resolveStorage(storage);
    this.baseline = getTopStreaks(this.storage);
  }

  /**
   * Évalue la série actuelle en direct, met à jour le Top 3 et persiste immédiatement si le score entre dans le Top 3.
   *
   * @param {number} currentStreak
   * @returns {{ topStreaks: number[], isLiveInTop3: boolean, rank: number|null, isNewRecord: boolean }}
   */
  update(currentStreak) {
    const result = computeLiveTopStreaks(this.baseline, currentStreak);

    if (result.isLiveInTop3 && this.storage) {
      try {
        this.storage.setItem(STORAGE_KEY_TOP_STREAKS, JSON.stringify(result.topStreaks));
      } catch (e) {
        console.warn('Erreur de persistance du Top 3 en direct', e);
      }
    }

    return result;
  }

  /**
   * À appeler lorsque la série s'arrête (erreur ou fin de partie).
   * Verrouille la nouvelle baseline pour les séries suivantes.
   *
   * @returns {number[]} Nouvelle baseline à jour
   */
  onStreakEnd() {
    this.baseline = getTopStreaks(this.storage);
    return this.baseline;
  }

  /**
   * Réinitialise la baseline en relisant le stockage.
   */
  resetBaseline() {
    this.baseline = getTopStreaks(this.storage);
    return this.baseline;
  }
}
