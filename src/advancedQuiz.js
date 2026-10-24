import { FRANCE_REFERENCE } from './data/advancedCountries.js';
import { generateSocialMetricQuestion, SOCIAL_METRICS } from './socialMetrics.js';

/**
 * Pondérations par défaut pour la formule de difficulté doublée (échelle de 8 à 40 points).
 * 2 choix ou indices -> 2 pts
 * 3 choix ou indices -> 4 pts
 * 4 choix ou indices -> 6 pts
 */
export const DEFAULT_WEIGHTS = {
  countryWeight: 1,
  categoryWeight: 1,
  optionsWeight: 1,
  hintsWeight: 1,
};

export const STORAGE_KEY_CATEGORY_DIFFICULTIES = 'flags_quiz_category_difficulties';

/**
 * Valeurs par défaut des difficultés par catégorie (points doublés pour un lissage optimal).
 * Les métriques sociales sont par défaut au même niveau que le PIB (12).
 */
export const DEFAULT_CATEGORY_DIFFICULTY = {
  drapeau: 2,
  capitale: 2,
  frontiere: 4,
  monnaie: 6,
  population: 8,
  surface: 10,
  pib: 12,
  lifeExpectancy: 12,
  hdi: 12,
  medianAge: 12,
  schoolingYears: 12,
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
 * Calcule la difficulté d'une question selon l'échelle doublée (8 à 40 points) :
 * - Pays : Tier (2 à 10 pts) + 8 pts si petit pays (< 5M habitants)
 * - Catégorie : drapeau (2), capitale (2), frontiere (4), monnaie (6), population (8), surface (10), pib (12)
 * - Choix multiples : 2 choix -> 2 pts, 3 choix -> 4 pts, 4 choix -> 6 pts
 * - Indices : 2 indices -> 2 pts, 3 indices -> 4 pts, 4 indices -> 6 pts
 *
 * @param {Object|number} countryOrTier - Objet pays ou tier numérique (1 à 5)
 * @param {string} category - Catégorie de la question
 * @param {number} [optionsCount=2] - Nombre de choix multiples (2, 3, 4)
 * @param {number} [hintsCount=2] - Nombre d'indices (2, 3, 4)
 * @param {typeof DEFAULT_WEIGHTS} [weights] - Pondérations configurables
 * @param {Object} [categoryDifficulties] - Poids personnalisés optionnels
 * @returns {number} Score total de difficulté (entre 8 et 40)
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

  let countryPoints = 2;
  let popBonus = 0;
  if (typeof countryOrTier === 'object' && countryOrTier !== null) {
    countryPoints = (countryOrTier.tier || 1) * 2;
    // Bonus petits pays : +10 pts si < 1M hab, +5 pts si < 3M hab
    if (countryOrTier.population < 1000000) {
      popBonus = 10;
    } else if (countryOrTier.population < 3000000) {
      popBonus = 5;
    }
  } else {
    countryPoints = (Number(countryOrTier) || 1) * 2;
  }
  countryPoints += popBonus;

  const activeCatDifficulties = categoryDifficulties || CATEGORY_DIFFICULTY;
  const catPoints = activeCatDifficulties[category] ?? 2;

  // 2 choix -> 2 pts, 3 choix -> 4 pts, 4 choix -> 6 pts
  const optionsPoints = Math.max(1, optionsCount - 1) * 2;
  // 2 indices -> 2 pts, 3 indices -> 4 pts, 4 indices -> 6 pts
  const hintsPoints = Math.max(1, hintsCount - 1) * 2;

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
 * Construit une chaîne d'inégalités ordonnée selon une grandeur numérique.
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
 * Générateur de question : Monnaie
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
 * Générateur de question : Frontière terrestre (Oui/Non)
 * Bonus +6 points si les deux pays appartiennent au même continent.
 */
export function generateBorderQuestion(country, allCountries) {
  if (!country || country.isIsland || !Array.isArray(country.borders) || country.borders.length === 0) {
    return null;
  }

  const continentalCountries = allCountries.filter((c) => !c.isIsland && c.code !== country.code);
  if (continentalCountries.length === 0) return null;

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
  // Bonus de frontière doublé à +6 points si même continent
  const difficulty = calculateQuestionDifficulty(country, 'frontiere', 2, 2) + (sameContinent ? 6 : 0);

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
 * Générateur de question : Population (Niveau 8)
 * Duel de comparaison binaire Oui / Non. Le pays de gauche affiche sa population exacte en valeur absolue,
 * et le joueur doit déterminer si cette population est supérieure à celle du pays de droite.
 */
export function generatePopulationQuestion(country, allCountries) {
  const smallerPool = allCountries.filter(
    (c) => c.population < country.population && c.code !== country.code
  );
  const biggerPool = allCountries.filter(
    (c) => c.population > country.population && c.code !== country.code
  );

  const shouldBeSuperior = Math.random() < 0.5;
  let candidate = null;

  if (shouldBeSuperior && smallerPool.length > 0) {
    candidate = smallerPool[Math.floor(Math.random() * smallerPool.length)];
  } else if (biggerPool.length > 0) {
    candidate = biggerPool[Math.floor(Math.random() * biggerPool.length)];
  } else {
    candidate = smallerPool[0] || biggerPool[0];
  }

  const isSuperior = country.population > candidate.population;

  const formatPop = (n) => {
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)} milliard(s) d'hab.`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)} million(s) d'hab.`;
    return `${formatNumber(n)} hab.`;
  };

  const leftPopulationText = formatPop(country.population);
  const rightPopulationText = formatPop(candidate.population);

  return {
    category: 'population',
    country,
    secondCountry: candidate,
    questionText: `La population de ${country.name} (${leftPopulationText}) est-elle supérieure à celle de ${candidate.name} ?`,
    leftPopulationText,
    rightPopulationText,
    visualComparison: `${country.name} (${leftPopulationText}) > ${candidate.name}`,
    flagCode: country.code,
    secondFlagCode: candidate.code,
    correctAnswer: isSuperior ? 'Oui' : 'Non',
    options: ['Oui', 'Non'],
    difficulty: calculateQuestionDifficulty(country, 'population', 2, 2),
  };
}

/**
 * Générateur de question : Surface (Duel Oui/Non Drapeau A > Drapeau B)
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
  const leftAreaText = `${formatNumber(country.area)} km²`;
  const rightAreaText = `${formatNumber(candidate.area)} km²`;

  return {
    category: 'surface',
    country,
    secondCountry: candidate,
    questionText: `${country.name} est-il plus grand que ${candidate.name} ?`,
    visualComparison: `${country.name} > ${candidate.name}`,
    leftAreaText,
    rightAreaText,
    flagCode: country.code,
    secondFlagCode: candidate.code,
    correctAnswer: isLarger ? 'Oui' : 'Non',
    options: ['Oui', 'Non'],
    difficulty: calculateQuestionDifficulty(country, 'surface', 2, 2),
  };
}

/**
 * Générateur de question : PIB par habitant (Niveau 6)
 * Duel de comparaison binaire Oui / Non. Le pays de gauche affiche son PIB par habitant,
 * et le joueur doit déterminer si ce PIB est supérieur à celui du pays de droite.
 */
export function generateGdpQuestion(country, allCountries) {
  const smallerPool = allCountries.filter(
    (c) => c.gdpPerCapita < country.gdpPerCapita && c.code !== country.code
  );
  const biggerPool = allCountries.filter(
    (c) => c.gdpPerCapita > country.gdpPerCapita && c.code !== country.code
  );

  const shouldBeSuperior = Math.random() < 0.5;
  let candidate = null;

  if (shouldBeSuperior && smallerPool.length > 0) {
    candidate = smallerPool[Math.floor(Math.random() * smallerPool.length)];
  } else if (biggerPool.length > 0) {
    candidate = biggerPool[Math.floor(Math.random() * biggerPool.length)];
  } else {
    candidate = smallerPool[0] || biggerPool[0];
  }

  const isSuperior = country.gdpPerCapita > candidate.gdpPerCapita;
  const leftGdpPerCapitaText = `${formatNumber(country.gdpPerCapita)} $ / hab`;
  const rightGdpPerCapitaText = `${formatNumber(candidate.gdpPerCapita)} $ / hab`;

  return {
    category: 'pib',
    country,
    secondCountry: candidate,
    questionText: `Le PIB par habitant de ${country.name} (${leftGdpPerCapitaText}) est-il supérieur à celui de ${candidate.name} ?`,
    leftGdpPerCapitaText,
    rightGdpPerCapitaText,
    visualComparison: `${country.name} (${leftGdpPerCapitaText}) > ${candidate.name}`,
    flagCode: country.code,
    secondFlagCode: candidate.code,
    correctAnswer: isSuperior ? 'Oui' : 'Non',
    options: ['Oui', 'Non'],
    difficulty: calculateQuestionDifficulty(country, 'pib', 2, 2),
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
      return generatePopulationQuestion(country, allCountries);
    case 'surface':
      return generateSurfaceQuestion(country, allCountries);
    case 'pib':
      return generateGdpQuestion(country, allCountries);
    case 'lifeExpectancy':
    case 'hdi':
    case 'medianAge':
    case 'schoolingYears':
      return generateSocialMetricQuestion(country, allCountries, category, 10, DEFAULT_WEIGHTS);
    default:
      return generateCapitalQuestion(country, allCountries, optionsCount);
  }
}

/**
 * Moteur du Mode Avancé (Survie & Culture)
 * Fonctionne sur une échelle lissée de 8 à 40 points :
 * Score Cible = Math.min(40, Math.floor(10 + streak * 1.5))
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
    this.askedQuestions = new Set();
    this.history = [];
    this.getNextQuestion();
  }

  getTargetDifficulty(streak) {
    return Math.min(40, Math.floor(10 + streak * 1.5));
  }

  getNextQuestion() {
    if (this.isGameOver) {
      this.currentQuestion = null;
      return null;
    }

    const s = this.streak;
    const target = this.getTargetDifficulty(s);

    const categories = [
      'drapeau',
      'capitale',
      'monnaie',
      'frontiere',
      'population',
      'surface',
      'pib',
      'lifeExpectancy',
      'hdi',
      'medianAge',
      'schoolingYears',
    ];
    const choiceOptions = [2, 3, 4];
    const hintOptions = [2, 3, 4];

    let bestCandidate = null;
    let minDiff = Infinity;

    for (let attempt = 0; attempt < 50; attempt++) {
      const category = categories[Math.floor(Math.random() * categories.length)];

      let eligible = this.allCountries;
      if (category === 'frontiere') {
        eligible = this.allCountries.filter((c) => !c.isIsland && c.borders.length > 0);
      }

      const country = eligible[Math.floor(Math.random() * eligible.length)] || this.allCountries[0];
      const qKey = `${country.code}_${category}`;

      if (this.askedQuestions.has(qKey)) {
        continue;
      }

      const isTwoChoicesOnly = (
        category === 'frontiere' ||
        category === 'surface' ||
        category === 'pib' ||
        category === 'population' ||
        category in SOCIAL_METRICS
      );
      const optionsCount = isTwoChoicesOnly ? 2 : choiceOptions[Math.floor(Math.random() * choiceOptions.length)];
      const hintsCount = hintOptions[Math.floor(Math.random() * hintOptions.length)];

      const score = calculateQuestionDifficulty(country, category, optionsCount, hintsCount, this.weights);
      const diff = Math.abs(score - target);

      if (diff < minDiff) {
        minDiff = diff;
        bestCandidate = { country, category, optionsCount, hintsCount, qKey };
        if (diff === 0) break;
      }
    }

    if (!bestCandidate) {
      const unasked = this.allCountries.find((c) => !this.askedQuestions.has(`${c.code}_capitale`));
      const country = unasked || this.allCountries[Math.floor(Math.random() * this.allCountries.length)];
      const qKey = `${country.code}_capitale_${Date.now()}`;
      bestCandidate = { country, category: 'capitale', optionsCount: 2, hintsCount: 2, qKey };
    }

    this.askedQuestions.add(bestCandidate.qKey);
    const { country, category, optionsCount, hintsCount } = bestCandidate;
    this.currentQuestion = generateAdvancedQuestion(country, category, optionsCount, hintsCount, this.allCountries);

    if (!this.currentQuestion) {
      this.currentQuestion = generateCapitalQuestion(country, this.allCountries, 2);
    }

    this.history.push(this.currentQuestion);
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

    if (this.history.length > 0) {
      this.history[this.history.length - 1].userAnswer = selectedAnswer;
      this.history[this.history.length - 1].isCorrect = isCorrect;
    }

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
    this.askedQuestions.clear();
    this.history = [];
    this.getNextQuestion();
  }
}
