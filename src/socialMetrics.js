import { calculateQuestionDifficulty, DEFAULT_WEIGHTS } from './advancedQuiz.js';

/**
 * Registre déclaratif et unifié des 4 métriques sociales & culturelles (DRY).
 */
export const SOCIAL_METRICS = {
  lifeExpectancy: {
    id: 'lifeExpectancy',
    label: 'Espérance de vie',
    icon: '🏥',
    unit: 'ans',
    format: (v) => `${Number(v).toFixed(1)} ans`,
    questionText: (c1, c2, val2) =>
      `L'espérance de vie de ${c1.name} est-elle supérieure à celle de ${c2.name} (${val2}) ?`,
  },
  hdi: {
    id: 'hdi',
    label: 'Indice de Développement Humain (IDH)',
    icon: '🌍',
    unit: 'IDH',
    format: (v) => Number(v).toFixed(3),
    questionText: (c1, c2, val2) =>
      `L'IDH de ${c1.name} est-il supérieur à celui de ${c2.name} (${val2}) ?`,
  },
  medianAge: {
    id: 'medianAge',
    label: 'Âge médian',
    icon: '🎂',
    unit: 'ans',
    format: (v) => `${Number(v).toFixed(1)} ans`,
    questionText: (c1, c2, val2) =>
      `L'âge médian de ${c1.name} est-il supérieur à celui de ${c2.name} (${val2}) ?`,
  },
  schoolingYears: {
    id: 'schoolingYears',
    label: 'Scolarisation moyenne',
    icon: '📚',
    unit: 'ans',
    format: (v) => `${Number(v).toFixed(1)} ans`,
    questionText: (c1, c2, val2) =>
      `La durée moyenne de scolarisation de ${c1.name} est-elle supérieure à celle de ${c2.name} (${val2}) ?`,
  },
};

/**
 * Répartit les pays en K catégories équitablement réparties (quantiles / déciles).
 * L'algorithme trie les pays selon la métrique et attribue un tier de 1 à K.
 *
 * @param {Array<Object>} countries - Liste des pays
 * @param {string} metricKey - Clé de la métrique ('lifeExpectancy', 'hdi', 'medianAge', 'schoolingYears')
 * @param {number} [k=10] - Nombre de catégories (déciles par défaut, facilement tunable)
 * @returns {Map<string, number>} Map associant chaque code de pays à son tier (1 à k)
 */
export function assignMetricTiers(countries, metricKey, k = 10) {
  const sorted = [...countries].sort((a, b) => a[metricKey] - b[metricKey]);
  const n = sorted.length;
  const tiersMap = new Map();

  sorted.forEach((country, index) => {
    // Calcul de quantile équitable de 1 à k
    const tier = Math.min(k, Math.floor((index * k) / n) + 1);
    tiersMap.set(country.code, tier);
  });

  return tiersMap;
}

/**
 * Calcule le bonus de difficulté selon l'écart de catégorie entre deux pays.
 * Un écart de 1 catégorie (très proche) donne le bonus maximal (très difficile à départager).
 * Un écart de (k - 1) catégories (très éloigné) donne le bonus minimal (très facile).
 *
 * @param {number} tier1 - Catégorie du premier pays (1 à k)
 * @param {number} tier2 - Catégorie du second pays (1 à k)
 * @param {number} [k=10] - Nombre total de catégories
 * @param {number} [bonusMultiplier=1] - Facteur d'amplification
 * @returns {number} Points de bonus de difficulté
 */
export function calculateCategoryGapBonus(tier1, tier2, k = 10, bonusMultiplier = 1) {
  const gap = Math.abs(tier1 - tier2);
  return Math.max(1, (k - gap) * bonusMultiplier);
}

/**
 * Générateur unifié et mutualisé pour les 4 métriques sociales (DRY).
 * Compare deux pays obligatoirement de catégories différentes (tierA !== tierB).
 * Affiche la valeur connue à droite dans la question et masque celle de gauche jusqu'à la réponse.
 *
 * @param {Object} country - Pays cible (affiché à gauche)
 * @param {Array<Object>} allCountries - Liste de tous les pays
 * @param {string} metricKey - Identifiant de la métrique
 * @param {number} [k=10] - Nombre de catégories pour la répartition
 * @param {Object} [weights] - Pondérations configurables
 * @returns {Object} Question de duel générée
 */
export function generateSocialMetricQuestion(
  country,
  allCountries,
  metricKey,
  k = 10,
  weights = DEFAULT_WEIGHTS
) {
  const metricDef = SOCIAL_METRICS[metricKey];
  if (!metricDef) return null;

  const tiersMap = assignMetricTiers(allCountries, metricKey, k);
  const tierA = tiersMap.get(country.code) || 1;

  // Sélectionner des candidats OBLIGATOIREMENT de catégories différentes (tierB !== tierA)
  const eligibleCandidates = allCountries.filter((c) => {
    if (c.code === country.code) return false;
    const tierB = tiersMap.get(c.code);
    return tierB !== tierA;
  });

  if (eligibleCandidates.length === 0) return null;

  // Équilibrer 50% réponses Oui / 50% réponses Non
  const smallerPool = eligibleCandidates.filter((c) => c[metricKey] < country[metricKey]);
  const biggerPool = eligibleCandidates.filter((c) => c[metricKey] > country[metricKey]);

  const shouldBeSuperior = Math.random() < 0.5;
  let candidate = null;

  if (shouldBeSuperior && smallerPool.length > 0) {
    candidate = smallerPool[Math.floor(Math.random() * smallerPool.length)];
  } else if (biggerPool.length > 0) {
    candidate = biggerPool[Math.floor(Math.random() * biggerPool.length)];
  } else {
    candidate = eligibleCandidates[Math.floor(Math.random() * eligibleCandidates.length)];
  }

  const tierB = tiersMap.get(candidate.code) || 1;
  const gapBonus = calculateCategoryGapBonus(tierA, tierB, k, 1);

  const isSuperior = country[metricKey] > candidate[metricKey];
  const leftValueFormatted = metricDef.format(country[metricKey]);
  const rightValueFormatted = metricDef.format(candidate[metricKey]);

  // Difficulté de base de la catégorie (même niveau que le PIB par défaut : 12) + bonus d'écart
  const baseDiff = calculateQuestionDifficulty(country, metricKey, 2, 2, weights);
  const difficulty = baseDiff + gapBonus;

  return {
    category: metricKey,
    metricKey,
    metricLabel: metricDef.label,
    metricUnit: metricDef.unit,
    metricIcon: metricDef.icon,
    country,
    secondCountry: candidate,
    tierLeft: tierA,
    tierRight: tierB,
    gap: Math.abs(tierA - tierB),
    gapBonus,
    questionText: metricDef.questionText(country, candidate, rightValueFormatted),
    leftValueText: leftValueFormatted,
    rightValueText: rightValueFormatted,
    visualComparison: `${country.name} > ${candidate.name} (${rightValueFormatted})`,
    flagCode: country.code,
    secondFlagCode: candidate.code,
    correctAnswer: isSuperior ? 'Oui' : 'Non',
    options: ['Oui', 'Non'],
    difficulty,
  };
}
