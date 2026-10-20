import { FRANCE_REFERENCE } from './data/advancedCountries.js';

/**
 * Pondérations par défaut pour la formule de difficulté.
 * 2 choix ou indices -> 1 pt
 * 3 choix ou indices -> 2 pts
 * 4 choix ou indices -> 3 pts
 */
export const DEFAULT_WEIGHTS = {
  countryWeight: 1,
  categoryWeight: 1,
  optionsWeight: 1,
  hintsWeight: 1,
};

export const STORAGE_KEY_CATEGORY_DIFFICULTIES = 'flags_quiz_category_difficulties';

/**
 * Valeurs par défaut des difficultés par catégorie.
 */
export const DEFAULT_CATEGORY_DIFFICULTY = {
  drapeau: 1,
  capitale: 1,
  frontiere: 3,
  monnaie: 3,
  population: 4,
  surface: 5,
  pib: 6,
};

/**
 * Niveaux de difficulté actifs en mémoire.
 */
export let CATEGORY_DIFFICULTY = { ...DEFAULT_CATEGORY_DIFFICULTY };

/**
 * Récupère les poids actuels des catégories (depuis le stockage ou les valeurs par défaut).
 */
export function getCategoryDifficulties(storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return { ...CATEGORY_DIFFICULTY };

  try {
    const raw = store.getItem(STORAGE_KEY_CATEGORY_DIFFICULTIES);
    if (!raw) return { ...DEFAULT_CATEGORY_DIFFICULTY };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_CATEGORY_DIFFICULTY };

    return {
      ...DEFAULT_CATEGORY_DIFFICULTY,
      ...Object.fromEntries(
        Object.entries(parsed).filter(
          ([k, v]) => k in DEFAULT_CATEGORY_DIFFICULTY && typeof v === 'number' && v >= 1
        )
      ),
    };
  } catch {
    return { ...DEFAULT_CATEGORY_DIFFICULTY };
  }
}

/**
 * Enregistre de nouveaux poids pour les catégories et les persiste dans le stockage.
 */
export function saveCategoryDifficulties(newDifficulties, storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  const validated = { ...getCategoryDifficulties(store) };

  for (const [k, v] of Object.entries(newDifficulties)) {
    if (k in DEFAULT_CATEGORY_DIFFICULTY && typeof v === 'number' && v >= 1) {
      validated[k] = Math.round(v);
    }
  }

  Object.assign(CATEGORY_DIFFICULTY, validated);

  if (store) {
    try {
      store.setItem(STORAGE_KEY_CATEGORY_DIFFICULTIES, JSON.stringify(validated));
    } catch (e) {
      console.warn('Erreur sauvegarde difficultés catégories', e);
    }
  }

  return validated;
}

/**
 * Réinitialise tous les poids de catégories à leurs valeurs par défaut.
 */
export function resetCategoryDifficulties(storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  Object.assign(CATEGORY_DIFFICULTY, DEFAULT_CATEGORY_DIFFICULTY);
  if (store) {
    try {
      store.removeItem(STORAGE_KEY_CATEGORY_DIFFICULTIES);
    } catch (e) {
      console.warn('Erreur reset difficultés catégories', e);
    }
  }
  return { ...DEFAULT_CATEGORY_DIFFICULTY };
}

/**
 * Calcule la difficulté d'une question selon les 4 critères :
 * - Pays : Tier (1 à 5) + 4 si petit pays (< 5M habitants)
 * - Catégorie : drapeau, capitale, monnaie, frontiere, population, surface, pib
 * - Choix multiples : 2 choix -> 1 pt, 3 choix -> 2 pts, 4 choix -> 3 pts
 * - Indices : 2 indices -> 1 pt, 3 indices -> 2 pts, 4 indices -> 3 pts
 *
 * @param {Object|number} countryOrTier - Objet pays ou tier numérique (1 à 5)
 * @param {string} category - Catégorie de la question
 * @param {number} [optionsCount=2] - Nombre de choix multiples (2, 3, 4)
 * @param {number} [hintsCount=2] - Nombre d'indices (2, 3, 4)
 * @param {typeof DEFAULT_WEIGHTS} [weights] - Pondérations configurables
 * @param {Object} [categoryDifficulties] - Poids personnalisés optionnels
 * @returns {number} Score total de difficulté (entre 4 et 20)
 */
export function calculateQuestionDifficulty(
  countryOrTier,
  category,
  optionsCount = 2,
  hintsCount = 2,
  weights = DEFAULT_WEIGHTS,
  categoryDifficulties = null
) {
  const cWeight = weights.countryWeight ?? 1;
  const catWeight = weights.categoryWeight ?? 1;
  const optWeight = weights.optionsWeight ?? 1;
  const hWeight = weights.hintsWeight ?? 1;

  let countryPoints = 1;
  if (typeof countryOrTier === 'object' && countryOrTier !== null) {
    countryPoints = countryOrTier.tier || 1;
    // Petit pays (< 5M habitants, sans critère de surface) : bonus +4
    if (countryOrTier.population < 5000000) {
      countryPoints += 4;
    }
  } else {
    countryPoints = Number(countryOrTier) || 1;
  }

  const activeCatDifficulties = categoryDifficulties || CATEGORY_DIFFICULTY;
  const catPoints = activeCatDifficulties[category] ?? 1;
  const optionsPoints = Math.max(1, optionsCount - 1);
  const hintsPoints = Math.max(1, hintsCount - 1);

  return (
    (countryPoints * cWeight) +
    (catPoints * catWeight) +
    (optionsPoints * optWeight) +
    (hintsPoints * hWeight)
  );
}

/**
 * Mélange aléatoire de tableau (Fisher-Yates).
 */
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Formate un grand nombre avec des espaces comme séparateurs de milliers.
 */
function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Construit une chaîne d'inégalités ordonnée selon une grandeur numérique (ex: "Portugal < Espagne < France < Chine").
 */
function buildInequalityChain(targetCountry, allCountries, metricKey, count = 2) {
  const targetVal = targetCountry[metricKey];
  const half = Math.floor(count / 2);
  const otherHalf = count - half;

  const smallerPool = shuffle(
    allCountries.filter((c) => c[metricKey] < targetVal && c.code !== targetCountry.code)
  );
  const biggerPool = shuffle(
    allCountries.filter((c) => c[metricKey] > targetVal && c.code !== targetCountry.code)
  );

  const selectedSmaller = smallerPool.slice(0, Math.min(half, smallerPool.length));
  const selectedBigger = biggerPool.slice(0, Math.min(otherHalf, biggerPool.length));

  const missing = count - (selectedSmaller.length + selectedBigger.length);
  if (missing > 0) {
    if (selectedSmaller.length < half) {
      selectedBigger.push(...biggerPool.slice(selectedBigger.length, selectedBigger.length + missing));
    } else {
      selectedSmaller.push(...smallerPool.slice(selectedSmaller.length, selectedSmaller.length + missing));
    }
  }

  const allInChain = [...selectedSmaller, targetCountry, ...selectedBigger].sort(
    (a, b) => a[metricKey] - b[metricKey]
  );

  return allInChain.map((c) => c.name).join(' < ');
}

/**
 * Générateur de question : Drapeau
 */
export function generateFlagQuestion(country, allCountries, count = 2) {
  const otherCountries = allCountries
    .filter((c) => c.code !== country.code)
    .map((c) => c.name);

  const lures = shuffle(otherCountries).slice(0, Math.max(1, count - 1));
  const options = shuffle([country.name, ...lures]);

  return {
    category: 'drapeau',
    country,
    questionText: 'À quel pays appartient ce drapeau ?',
    flagCode: country.code,
    correctAnswer: country.name,
    options,
    difficulty: calculateQuestionDifficulty(country, 'drapeau', count, 2),
  };
}

/**
 * Générateur de question : Capitale
 */
export function generateCapitalQuestion(country, allCountries, count = 2) {
  let lures = [];

  if (country.population > 10000000 && Array.isArray(country.cities) && country.cities.length > 0) {
    const localCity = country.cities[Math.floor(Math.random() * country.cities.length)];
    lures.push(localCity);
  }

  const otherCapitals = allCountries
    .filter((c) => c.code !== country.code && c.capital !== country.capital)
    .map((c) => c.capital);

  const needed = Math.max(0, count - 1 - lures.length);
  const extraLures = shuffle(otherCapitals).slice(0, needed);
  lures = [...lures, ...extraLures];

  const options = shuffle([country.capital, ...lures]);

  return {
    category: 'capitale',
    country,
    questionText: `Quelle est la capitale de : ${country.name} ?`,
    flagCode: country.code,
    correctAnswer: country.capital,
    options,
    difficulty: calculateQuestionDifficulty(country, 'capitale', count, 2),
  };
}

/**
 * Générateur de question : Monnaie (Niveau 2)
 */
export function generateCurrencyQuestion(country, allCountries, count = 2) {
  const otherCurrencies = [
    ...new Set(
      allCountries
        .filter((c) => c.currency !== country.currency)
        .map((c) => c.currency)
    ),
  ];

  const lures = shuffle(otherCurrencies).slice(0, Math.max(1, count - 1));
  const options = shuffle([country.currency, ...lures]);

  return {
    category: 'monnaie',
    country,
    questionText: `Quelle est la monnaie de : ${country.name} ?`,
    flagCode: country.code,
    correctAnswer: country.currency,
    options,
    difficulty: calculateQuestionDifficulty(country, 'monnaie', count, 2),
  };
}

/**
 * Générateur de question : Frontière terrestre (Niveau 2)
 * Pose une question binaire 'Oui' ou 'Non' si deux pays partagent une frontière.
 * Exclut strictement les îles (isIsland: true ou sans frontières).
 */
export function generateBorderQuestion(country, allCountries) {
  if (!country || country.isIsland || !Array.isArray(country.borders) || country.borders.length === 0) {
    return null;
  }

  const continentalCountries = allCountries.filter((c) => !c.isIsland && c.code !== country.code);
  if (continentalCountries.length === 0) return null;

  // 50% de chance d'interroger sur un vrai voisin, 50% sur un non-voisin
  const shouldBeNeighbor = Math.random() < 0.5;
  let candidate = null;

  if (shouldBeNeighbor) {
    const neighborCode = country.borders[Math.floor(Math.random() * country.borders.length)];
    candidate = allCountries.find((c) => c.code === neighborCode);
  }

  if (!candidate) {
    const nonNeighbors = continentalCountries.filter((c) => !country.borders.includes(c.code));
    candidate = nonNeighbors[Math.floor(Math.random() * nonNeighbors.length)] || continentalCountries[0];
  }

  const isNeighbor = country.borders.includes(candidate.code);
  const sameContinent = country.continent && candidate.continent && country.continent === candidate.continent;
  const difficulty = calculateQuestionDifficulty(country, 'frontiere', 2, 2) + (sameContinent ? 2 : 0);

  return {
    category: 'frontiere',
    country,
    secondCountry: candidate,
    questionText: `Ces deux pays partagent-ils une frontière terrestre : ${country.name} et ${candidate.name} ?`,
    flagCode: country.code,
    secondFlagCode: candidate.code,
    correctAnswer: isNeighbor ? 'Oui' : 'Non',
    options: ['Oui', 'Non'],
    difficulty,
  };
}

/**
 * Générateur de question : Population (Niveau 4)
 */
export function generatePopulationQuestion(country, allCountries, optionsCount = 2, hintsCount = 2) {
  const pop = country.population;
  const margin = 0.10; // 10%
  const lower = Math.round(pop * (1 - margin));
  const upper = Math.round(pop * (1 + margin));

  const formatPop = (n) => {
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)} milliard(s)`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)} million(s)`;
    return formatNumber(n);
  };

  const correctRange = `Entre ${formatPop(lower)} et ${formatPop(upper)}`;
  const lure1 = `Entre ${formatPop(Math.round(pop * 0.4))} et ${formatPop(Math.round(pop * 0.6))}`;
  const lure2 = `Entre ${formatPop(Math.round(pop * 1.5))} et ${formatPop(Math.round(pop * 1.9))}`;
  const lure3 = `Entre ${formatPop(Math.round(pop * 2.8))} et ${formatPop(Math.round(pop * 3.5))}`;

  const allLures = shuffle([lure1, lure2, lure3]);
  const selectedLures = allLures.slice(0, Math.max(1, optionsCount - 1));
  const options = shuffle([correctRange, ...selectedLures]);

  const inequality = buildInequalityChain(country, allCountries, 'population', hintsCount);
  const hints = [`Inégalité de population : ${inequality}`];

  return {
    category: 'population',
    country,
    questionText: `Quelle est la population approximative de : ${country.name} ?`,
    flagCode: country.code,
    correctAnswer: correctRange,
    options,
    inequality,
    hints,
    difficulty: calculateQuestionDifficulty(country, 'population', optionsCount, hintsCount),
  };
}

/**
 * Générateur de question : Surface (Niveau 5)
 * Duel de comparaison binaire Oui / Non (visuellement Drapeau A > Drapeau B)
 */
export function generateSurfaceQuestion(country, allCountries) {
  const smallerPool = allCountries.filter((c) => c.area < country.area && c.code !== country.code);
  const biggerPool = allCountries.filter((c) => c.area > country.area && c.code !== country.code);

  const shouldBeBigger = Math.random() < 0.5;
  let candidate = null;

  if (shouldBeBigger && smallerPool.length > 0) {
    candidate = smallerPool[Math.floor(Math.random() * smallerPool.length)];
  } else if (biggerPool.length > 0) {
    candidate = biggerPool[Math.floor(Math.random() * biggerPool.length)];
  } else {
    candidate = smallerPool[0] || biggerPool[0];
  }

  const isLarger = country.area > candidate.area;

  return {
    category: 'surface',
    country,
    secondCountry: candidate,
    questionText: `${country.name} est-il plus grand que ${candidate.name} ?`,
    visualComparison: `${country.name} > ${candidate.name}`,
    flagCode: country.code,
    secondFlagCode: candidate.code,
    correctAnswer: isLarger ? 'Oui' : 'Non',
    options: ['Oui', 'Non'],
    difficulty: calculateQuestionDifficulty(country, 'surface', 2, 2),
  };
}

/**
 * Générateur de question : PIB par habitant (Niveau 5)
 */
export function generateGdpQuestion(country, allCountries, optionsCount = 2, hintsCount = 2) {
  const gdpPC = country.gdpPerCapita;
  const margin = 0.20; // 20%
  const lower = Math.round(gdpPC * (1 - margin));
  const upper = Math.round(gdpPC * (1 + margin));

  const formatGdpPC = (val) => `${formatNumber(val)} $ / hab`;
  const correctRange = `Entre ${formatGdpPC(lower)} et ${formatGdpPC(upper)}`;
  const lure1 = `Entre ${formatGdpPC(Math.round(gdpPC * 0.4))} et ${formatGdpPC(Math.round(gdpPC * 0.6))}`;
  const lure2 = `Entre ${formatGdpPC(Math.round(gdpPC * 1.6))} et ${formatGdpPC(Math.round(gdpPC * 2.2))}`;
  const lure3 = `Entre ${formatGdpPC(Math.round(gdpPC * 3.5))} et ${formatGdpPC(Math.round(gdpPC * 4.8))}`;

  const allLures = shuffle([lure1, lure2, lure3]);
  const selectedLures = allLures.slice(0, Math.max(1, optionsCount - 1));
  const options = shuffle([correctRange, ...selectedLures]);

  const refText = `🇫🇷 Référence France : ~44 100 $ / habitant`;
  const inequality = buildInequalityChain(country, allCountries, 'gdpPerCapita', hintsCount);
  const hints = [`Inégalité de PIB par habitant : ${inequality}`, refText];

  return {
    category: 'pib',
    country,
    questionText: `Quel est le PIB par habitant approximatif de : ${country.name} ?`,
    flagCode: country.code,
    correctAnswer: correctRange,
    options,
    inequality,
    hints,
    referenceFrance: refText,
    clues: { smallerThan: null, biggerThan: null },
    difficulty: calculateQuestionDifficulty(country, 'pib', optionsCount, hintsCount),
  };
}

/**
 * Générateur unifié de questions avancées
 */
export function generateAdvancedQuestion(country, category, optionsCount, hintsCount, allCountries) {
  switch (category) {
    case 'drapeau':
      return generateFlagQuestion(country, allCountries, optionsCount);
    case 'capitale':
      return generateCapitalQuestion(country, allCountries, optionsCount);
    case 'monnaie':
      return generateCurrencyQuestion(country, allCountries, optionsCount);
    case 'frontiere':
      return generateBorderQuestion(country, allCountries);
    case 'population':
      return generatePopulationQuestion(country, allCountries, optionsCount, hintsCount);
    case 'surface':
      return generateSurfaceQuestion(country, allCountries);
    case 'pib':
      return generateGdpQuestion(country, allCountries, optionsCount, hintsCount);
    default:
      return generateCapitalQuestion(country, allCountries, optionsCount);
  }
}

/**
 * Moteur du Mode Avancé (Survie & Culture)
 */
export class AdvancedQuizEngine {
  /**
   * @param {Array<Object>} allCountries
   * @param {typeof DEFAULT_WEIGHTS} [weights]
   */
  constructor(allCountries, weights = DEFAULT_WEIGHTS) {
    this.allCountries = [...allCountries];
    this.weights = weights;
    this.streak = 0;
    this.bestStreak = 0;
    this.isGameOver = false;
    this.currentQuestion = null;
    this.getNextQuestion();
  }

  getTargetDifficulty(streak) {
    return Math.min(20, Math.floor(5 + streak * 0.75));
  }

  getNextQuestion() {
    if (this.isGameOver) {
      this.currentQuestion = null;
      return null;
    }

    const s = this.streak;
    const target = this.getTargetDifficulty(s);

    const categories = ['drapeau', 'capitale', 'monnaie', 'frontiere', 'population', 'surface', 'pib'];
    const choiceOptions = [2, 3, 4];
    const hintOptions = [2, 3, 4];

    let bestCandidate = null;
    let minDiff = Infinity;

    for (let attempt = 0; attempt < 35; attempt++) {
      const category = categories[Math.floor(Math.random() * categories.length)];

      // Si catégorie frontière : filtrer sur les pays continentaux non-insulaires
      let eligible = this.allCountries;
      if (category === 'frontiere') {
        eligible = this.allCountries.filter((c) => !c.isIsland && c.borders.length > 0);
      }

      const country = eligible[Math.floor(Math.random() * eligible.length)] || this.allCountries[0];
      const optionsCount = (category === 'frontiere' || category === 'surface') ? 2 : choiceOptions[Math.floor(Math.random() * choiceOptions.length)];
      const hintsCount = hintOptions[Math.floor(Math.random() * hintOptions.length)];

      const score = calculateQuestionDifficulty(country, category, optionsCount, hintsCount, this.weights);
      const diff = Math.abs(score - target);

      if (diff < minDiff) {
        minDiff = diff;
        bestCandidate = { country, category, optionsCount, hintsCount };
        if (diff === 0) break;
      }
    }

    const { country, category, optionsCount, hintsCount } = bestCandidate;
    this.currentQuestion = generateAdvancedQuestion(country, category, optionsCount, hintsCount, this.allCountries);

    // En cas de fallback
    if (!this.currentQuestion) {
      this.currentQuestion = generateCapitalQuestion(country, this.allCountries, 2);
    }

    return this.currentQuestion;
  }

  answer(selectedAnswer) {
    if (this.isGameOver || !this.currentQuestion) {
      return {
        isCorrect: false,
        streak: this.streak,
        isGameOver: true,
        correctAnswer: this.currentQuestion?.correctAnswer || '',
      };
    }

    const isCorrect = selectedAnswer === this.currentQuestion.correctAnswer;

    if (isCorrect) {
      this.streak += 1;
      if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak;
      }
      this.getNextQuestion();
      return {
        isCorrect: true,
        streak: this.streak,
        isGameOver: false,
        correctAnswer: selectedAnswer,
      };
    } else {
      this.isGameOver = true;
      const rightAnswer = this.currentQuestion.correctAnswer;
      return {
        isCorrect: false,
        streak: this.streak,
        isGameOver: true,
        correctAnswer: rightAnswer,
      };
    }
  }

  reset() {
    this.streak = 0;
    this.isGameOver = false;
    this.getNextQuestion();
  }
}
