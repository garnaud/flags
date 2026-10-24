import { countries } from './data/countries.js';
import {
  getRandomQuestions,
  QuizEngine,
  getTopStreaks,
  LiveStreakTracker,
} from './quiz.js';
import { advancedCountries } from './data/advancedCountries.js';
import {
  AdvancedQuizEngine,
  getCategoryDifficulties,
  saveCategoryDifficulties,
  resetCategoryDifficulties,
} from './advancedQuiz.js';
import {
  computeZoomViewBox,
  getBorderInfo,
  DEFAULT_MAP_VIEWBOX,
  getCountryPathD,
  computeSameScaleViewBoxes,
} from './borderMap.js';
import { SOCIAL_METRICS } from './socialMetrics.js';

// Stockage dédié pour le Mode Avancé
const ADVANCED_STORAGE_KEY = 'flags_quiz_advanced_top_streaks';
const advancedStorage = {
  getItem: () => {
    try {
      return localStorage.getItem(ADVANCED_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(ADVANCED_STORAGE_KEY, v);
    } catch (e) {
      console.warn('Erreur stockage avancé', e);
    }
  },
};

// Éléments du DOM - Switcher de Mode
const modeClassicBtn = document.getElementById('mode-classic-btn');
const modeAdvancedBtn = document.getElementById('mode-advanced-btn');
const classicConfigBar = document.getElementById('classic-config-bar');
const advancedConfigBar = document.getElementById('advanced-config-bar');
const advancedDifficultyBadge = document.getElementById('advanced-difficulty-badge');

// Éléments du DOM - Header & Marque
const brandTitle = document.getElementById('brand-title');
const brandIcon = document.getElementById('brand-icon');
const questionCountSelect = document.getElementById('question-count-select');
const headerTopStreaksList = document.getElementById('header-top-streaks-list');
const statProgressLabel = document.getElementById('stat-progress-label');
const statScoreLabel = document.getElementById('stat-score-label');
const questionProgress = document.getElementById('question-progress');
const currentScore = document.getElementById('current-score');
const currentStreakEl = document.getElementById('current-streak');
const progressBar = document.getElementById('progress-bar');

// Éléments du DOM - Question & Indices
const questionInstruction = document.getElementById('question-instruction');
const categoryBadge = document.getElementById('category-badge');
const flagImg = document.getElementById('flag-img');
const hintsCard = document.getElementById('hints-card');
const referenceFrance = document.getElementById('reference-france');
const cluesList = document.getElementById('clues-list');
const optionsContainer = document.getElementById('options-container');

// Éléments du DOM - Modal de fin
const endModal = document.getElementById('end-modal');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalScoreLabel = document.getElementById('modal-score-label');
const finalScore = document.getElementById('final-score');
const modalBestStreak = document.getElementById('modal-best-streak');
const newRecordBadge = document.getElementById('new-record-badge');
const modalPodiumTitle = document.getElementById('modal-podium-title');
const modalPodiumList = document.getElementById('modal-podium-list');
const restartBtn = document.getElementById('restart-btn');

// Éléments du DOM - Paramètres (Settings)
const settingsOpenBtn = document.getElementById('settings-open-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseX = document.getElementById('settings-close-x');
const settingsResetBtn = document.getElementById('settings-reset-btn');
const settingsSaveBtn = document.getElementById('settings-save-btn');
const settingsSlidersContainer = document.getElementById('settings-sliders-container');

// Éléments du DOM - Carte des Frontières
const borderMapModal = document.getElementById('border-map-modal');
const borderMapStatus = document.getElementById('border-map-status');
const borderMapC1Name = document.getElementById('border-map-c1-name');
const borderMapC2Name = document.getElementById('border-map-c2-name');
const borderMapToggleZoom = document.getElementById('border-map-toggle-zoom');
const borderMapContainer = document.getElementById('border-map-container');
const borderMapNextBtn = document.getElementById('border-map-next-btn');

// État de l'application
let currentMode = 'classic'; // 'classic' | 'advanced'
let classicEngine;
let advancedEngine;

const classicStreakTracker = new LiveStreakTracker();
const advancedStreakTracker = new LiveStreakTracker(advancedStorage);

/**
 * Met à jour le bandeau Top 3 dans l'en-tête (en direct ou avec la base enregistrée).
 */
function updateHeaderTopStreaks(customStreaks, liveRank = null) {
  const store = currentMode === 'classic' ? null : advancedStorage;
  const topStreaks = customStreaks || getTopStreaks(store);
  headerTopStreaksList.innerHTML = '';

  if (topStreaks.length === 0) {
    headerTopStreaksList.textContent = 'Aucun record';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  topStreaks.forEach((streak, idx) => {
    const pill = document.createElement('span');
    pill.className = 'streak-pill';
    if (liveRank === idx + 1) {
      pill.classList.add('live');
      pill.title = 'Votre série en cours est dans le Top 3 !';
    }
    pill.textContent = `${medals[idx]} ${streak}`;
    headerTopStreaksList.appendChild(pill);
  });
}

/**
 * Lance une nouvelle partie pour le mode actif.
 */
function startNewGame() {
  if (currentMode === 'classic') {
    const selectedCount = questionCountSelect.value;
    const questions = getRandomQuestions(countries, selectedCount);
    if (!classicEngine) {
      classicEngine = new QuizEngine(questions);
    } else {
      classicEngine.reset(questions);
    }
    classicStreakTracker.resetBaseline();
  } else {
    if (!advancedEngine) {
      advancedEngine = new AdvancedQuizEngine(advancedCountries);
    } else {
      advancedEngine.reset();
    }
    advancedStreakTracker.resetBaseline();
  }

  updateHeaderTopStreaks();
  renderQuestion();
}

/**
 * Alterne entre le Mode Classique et le Mode Avancé.
 *
 * @param {'classic' | 'advanced'} mode
 */
function switchMode(mode) {
  if (currentMode === mode) return;
  currentMode = mode;

  if (mode === 'classic') {
    modeClassicBtn.classList.add('active');
    modeAdvancedBtn.classList.remove('active');

    classicConfigBar.classList.remove('hidden');
    advancedConfigBar.classList.add('hidden');
    categoryBadge.classList.add('hidden');
    hintsCard.classList.add('hidden');

    brandTitle.textContent = 'Drapeaux du Monde';
    brandIcon.textContent = '🚩';
    statProgressLabel.textContent = 'Question';
    statScoreLabel.textContent = 'Score';
    modalPodiumTitle.textContent = '🏆 Top 3 des séries (Drapeaux)';
  } else {
    modeAdvancedBtn.classList.add('active');
    modeClassicBtn.classList.remove('active');

    classicConfigBar.classList.add('hidden');
    advancedConfigBar.classList.remove('hidden');
    categoryBadge.classList.remove('hidden');

    brandTitle.textContent = 'Culture & Survie';
    brandIcon.textContent = '⚡';
    statProgressLabel.textContent = 'Progression';
    statScoreLabel.textContent = 'Survie';
    modalPodiumTitle.textContent = '⚡ Top 3 des séries (Survie)';
  }

  startNewGame();
}

/**
 * Met à jour l'affichage avec la question courante selon le mode.
 */
function renderQuestion() {
  if (currentMode === 'classic') {
    renderClassicQuestion();
  } else {
    renderAdvancedQuestion();
  }
}

/**
 * Rendu du Mode Classique (Drapeaux purs, inchangé)
 */
function renderClassicQuestion() {
  if (classicEngine.isGameOver) {
    showEndModal();
    return;
  }

  const currentQ = classicEngine.getCurrentQuestion();
  const currentIndex = classicEngine.currentQuestionIndex;
  const total = classicEngine.totalQuestions;

  questionInstruction.textContent = 'À quel pays appartient ce drapeau ?';
  categoryBadge.classList.add('hidden');
  hintsCard.classList.add('hidden');

  questionProgress.textContent = `${currentIndex + 1} / ${total}`;
  currentScore.textContent = `${classicEngine.score}`;
  currentStreakEl.textContent = `🔥 ${classicEngine.currentStreak}`;
  const progressPercent = Math.round((currentIndex / total) * 100);
  progressBar.style.width = `${progressPercent}%`;

  const flagWrapper = document.querySelector('.flag-wrapper');
  flagWrapper.innerHTML = `
    <img id="flag-img" class="flag-image loading" src="https://flagcdn.com/w320/${currentQ.country.code.toLowerCase()}.png" alt="Drapeau à identifier - Question ${currentIndex + 1}" />
  `;
  const classicImg = flagWrapper.querySelector('#flag-img');
  if (classicImg) classicImg.onload = () => classicImg.classList.remove('loading');

  optionsContainer.innerHTML = '';
  currentQ.options.forEach((optionName) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.textContent = optionName;
    btn.setAttribute('aria-label', `Choisir ${optionName}`);

    btn.addEventListener('click', () => handleClassicOptionClick(optionName, btn));
    optionsContainer.appendChild(btn);
  });
}

/**
 * Rendu du Mode Avancé (Survie, multi-catégories et indices)
 */
function renderAdvancedQuestion() {
  if (advancedEngine.isGameOver) {
    showEndModal();
    return;
  }

  const q = advancedEngine.currentQuestion;
  if (!q) return;

  // Catégorie et icônes
  const categoryLabels = {
    drapeau: '🚩 Drapeau',
    capitale: '🏛️ Capitale',
    monnaie: '🪙 Monnaie',
    frontiere: '🗺️ Frontière',
    population: '👥 Population',
    surface: '📐 Superficie',
    pib: '💰 PIB par hab.',
    lifeExpectancy: '🏥 Espérance de vie',
    hdi: '🌍 IDH',
    medianAge: '🎂 Âge médian',
    schoolingYears: '📚 Scolarisation',
  };

  categoryBadge.textContent = categoryLabels[q.category] || q.category.toUpperCase();
  categoryBadge.classList.remove('hidden');

  questionInstruction.textContent = q.questionText;

  // Affichage du ou des drapeaux (duel A > B ou repère unique)
  const flagWrapper = document.querySelector('.flag-wrapper');
  if (q.secondFlagCode) {
    const isComparison = (
      q.category === 'surface' ||
      q.category === 'pib' ||
      q.category === 'population' ||
      q.category in SOCIAL_METRICS
    );
    const operator = isComparison ? '>' : '🤝';

    const leftVal = q.leftGdpPerCapitaText || q.leftPopulationText;
    const rightValLabel = q.leftGdpPerCapitaText
      ? '??? $ / hab'
      : (q.leftPopulationText ? '??? hab.' : '');

    const leftSubText = leftVal
      ? `<br><strong style="color: #60a5fa; font-size: 0.78rem; display: block; margin-top: 2px;">${leftVal}</strong>`
      : '';
    const rightSubText = rightValLabel
      ? `<br><span id="right-country-value" style="color: #94a3b8; font-size: 0.78rem; display: block; margin-top: 2px;">${rightValLabel}</span>`
      : '';

    if (q.category in SOCIAL_METRICS) {
      const metricDef = SOCIAL_METRICS[q.category];
      flagWrapper.innerHTML = `
        <div class="duel-flags-container">
          <div class="duel-flag-item">
            <img class="flag-image loading" src="https://flagcdn.com/w320/${q.flagCode.toLowerCase()}.png" alt="${q.country.name}" />
            <span class="duel-country-name">${q.country.name}<br><span id="left-country-value" style="color: #94a3b8; font-size: 0.78rem; display: block; margin-top: 2px;">??? ${metricDef.unit}</span></span>
          </div>
          <span class="duel-operator comparison">&gt;</span>
          <div class="duel-flag-item">
            <img class="flag-image loading" src="https://flagcdn.com/w320/${q.secondFlagCode.toLowerCase()}.png" alt="${q.secondCountry.name}" />
            <span class="duel-country-name">${q.secondCountry.name}<br><strong id="right-country-value" style="color: #60a5fa; font-size: 0.78rem; display: block; margin-top: 2px;">${q.rightValueText}</strong></span>
          </div>
        </div>
      `;
    } else if (q.category === 'surface') {
      const formatArea = (num) => new Intl.NumberFormat('fr-FR').format(num);
      flagWrapper.innerHTML = `
        <div class="duel-flags-container">
          <div class="duel-flag-item">
            <img class="flag-image loading" src="https://flagcdn.com/w320/${q.flagCode.toLowerCase()}.png" alt="${q.country.name}" />
            <span class="duel-country-name">${q.country.name}</span>
            <div class="duel-silhouette-box hidden" id="silhouette-left" title="Silhouette de ${q.country.name} à l'échelle">
              <span class="silhouette-scale-label">ÉCHELLE 1:1</span>
            </div>
            <span class="silhouette-area-reveal" id="area-reveal-left">${q.leftAreaText || formatArea(q.country.area) + ' km²'}</span>
          </div>
          <span class="duel-operator comparison">&gt;</span>
          <div class="duel-flag-item">
            <img class="flag-image loading" src="https://flagcdn.com/w320/${q.secondFlagCode.toLowerCase()}.png" alt="${q.secondCountry.name}" />
            <span class="duel-country-name">${q.secondCountry.name}</span>
            <div class="duel-silhouette-box hidden" id="silhouette-right" title="Silhouette de ${q.secondCountry.name} à l'échelle">
              <span class="silhouette-scale-label">ÉCHELLE 1:1</span>
            </div>
            <span class="silhouette-area-reveal" id="area-reveal-right">${q.rightAreaText || formatArea(q.secondCountry.area) + ' km²'}</span>
          </div>
        </div>
      `;
      loadSurfaceSilhouettes(q.flagCode, q.secondFlagCode);
    } else {
      flagWrapper.innerHTML = `
        <div class="duel-flags-container">
          <div class="duel-flag-item">
            <img class="flag-image loading" src="https://flagcdn.com/w320/${q.flagCode.toLowerCase()}.png" alt="${q.country.name}" />
            <span class="duel-country-name">${q.country.name}${leftSubText}</span>
          </div>
          <span class="duel-operator ${isComparison ? 'comparison' : 'border'}">${operator}</span>
          <div class="duel-flag-item">
            <img class="flag-image loading" src="https://flagcdn.com/w320/${q.secondFlagCode.toLowerCase()}.png" alt="${q.secondCountry.name}" />
            <span class="duel-country-name">${q.secondCountry.name}${rightSubText}</span>
          </div>
        </div>
      `;
    }
    flagWrapper.querySelectorAll('.flag-image').forEach((img) => {
      img.onload = () => img.classList.remove('loading');
    });
  } else {
    flagWrapper.innerHTML = `
      <img id="flag-img" class="flag-image loading" src="https://flagcdn.com/w320/${q.flagCode.toLowerCase()}.png" alt="Drapeau de repère - ${q.country.name}" />
    `;
    const singleImg = flagWrapper.querySelector('#flag-img');
    if (singleImg) singleImg.onload = () => singleImg.classList.remove('loading');
  }

  // Gestion des indices pour le mode avancé (unifié et numéroté)
  const hasHints = Array.isArray(q.hints) && q.hints.length > 0;

  if (hasHints) {
    hintsCard.classList.remove('hidden');
    if (referenceFrance) referenceFrance.style.display = 'none';
    cluesList.innerHTML = '';

    q.hints.forEach((hintText, idx) => {
      const item = document.createElement('div');
      item.className = 'hint-item';

      if (hintText.startsWith('Inégalité')) {
        item.classList.add('hint-inequality');
        const parts = hintText.split(' : ');
        const label = parts[0];
        const chain = parts[1] || '';

        const formattedChain = chain
          .split(' < ')
          .map((cName) => {
            if (cName === q.country.name) {
              return `<span class="inequality-target">${cName}</span>`;
            }
            return `<span>${cName}</span>`;
          })
          .join('<span class="inequality-operator">&lt;</span>');

        item.innerHTML = `<span style="color: #94a3b8; font-size: 0.78rem; display: block; margin-bottom: 0.25rem;">📊 ${label}</span>${formattedChain}`;
      } else {
        if (hintText.includes('Référence France')) {
          item.classList.add('hint-ref');
        }
        item.textContent = `💡 Indice ${idx + 1}/${q.hints.length} : ${hintText.replace(/^💡\s*/, '')}`;
      }

      cluesList.appendChild(item);
    });
  } else {
    hintsCard.classList.add('hidden');
  }

  // Statistiques en direct
  questionProgress.textContent = `Série : ${advancedEngine.streak}`;
  currentScore.textContent = `${advancedEngine.streak}`;
  currentStreakEl.textContent = `🔥 ${advancedEngine.streak}`;

  const diffStars = '⭐'.repeat(Math.min(5, Math.floor(q.difficulty / 8) + 1));
  advancedDifficultyBadge.textContent = `Difficulté : ${diffStars} (Nv. ${q.difficulty})`;

  const progressPercent = Math.min(100, Math.round((advancedEngine.streak / 25) * 100));
  progressBar.style.width = `${progressPercent}%`;

  // Rendu des options adaptatif (2, 3 ou 4 options)
  optionsContainer.innerHTML = '';
  q.options.forEach((optionText) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.textContent = optionText;
    btn.setAttribute('aria-label', `Choisir ${optionText}`);

    btn.addEventListener('click', () => handleAdvancedOptionClick(optionText, btn));
    optionsContainer.appendChild(btn);
  });
}

/**
 * Clic d'option en Mode Classique
 */
function handleClassicOptionClick(selectedOption, clickedButton) {
  const currentQ = classicEngine.getCurrentQuestion();
  const isCorrect = selectedOption === currentQ.correctAnswer;

  const buttons = optionsContainer.querySelectorAll('.option-btn');
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (!isCorrect && btn.textContent === currentQ.correctAnswer) {
      btn.classList.add('revealed');
    }
  });

  if (isCorrect) {
    clickedButton.classList.add('correct');
  } else {
    clickedButton.classList.add('wrong');
  }

  const result = classicEngine.answer(selectedOption);

  if (isCorrect) {
    const liveUpdate = classicStreakTracker.update(result.currentStreak);
    if (liveUpdate.isLiveInTop3) {
      currentStreakEl.textContent = `🔥 ${result.currentStreak} (#${liveUpdate.rank})`;
      updateHeaderTopStreaks(liveUpdate.topStreaks, liveUpdate.rank);
    } else {
      currentStreakEl.textContent = `🔥 ${result.currentStreak}`;
    }
  } else {
    classicStreakTracker.onStreakEnd();
    updateHeaderTopStreaks();
    currentStreakEl.textContent = '🔥 0';
  }

  setTimeout(() => {
    if (classicEngine.isGameOver) {
      progressBar.style.width = '100%';
      currentScore.textContent = `${classicEngine.score}`;
      currentStreakEl.textContent = `🔥 ${classicEngine.currentStreak}`;
      showEndModal();
    } else {
      renderQuestion();
    }
  }, 850);
}

let cachedWorldSvgText = null;

/**
 * Récupère le contenu SVG de la carte du monde (en cache après le premier appel).
 */
async function getWorldSvgText() {
  if (cachedWorldSvgText) return cachedWorldSvgText;
  try {
    const res = await fetch('./world.svg');
    if (res.ok) {
      cachedWorldSvgText = await res.text();
      return cachedWorldSvgText;
    }
  } catch (e) {
    console.warn('Erreur chargement world.svg', e);
  }
  return null;
}

/**
 * Charge et affiche les silhouettes vectorielles des deux pays à la même échelle relative (1:1).
 */
async function loadSurfaceSilhouettes(code1, code2) {
  const svgText = await getWorldSvgText();
  if (!svgText) return;

  const boxLeft = document.getElementById('silhouette-left');
  const boxRight = document.getElementById('silhouette-right');
  if (!boxLeft || !boxRight) return;

  const d1 = getCountryPathD(svgText, code1);
  const d2 = getCountryPathD(svgText, code2);
  if (!d1 || !d2) return;

  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tempSvg.style.position = 'absolute';
  tempSvg.style.visibility = 'hidden';
  tempSvg.style.width = '0';
  tempSvg.style.height = '0';

  const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p1.setAttribute('d', d1);
  const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p2.setAttribute('d', d2);

  tempSvg.appendChild(p1);
  tempSvg.appendChild(p2);
  document.body.appendChild(tempSvg);

  let b1 = { x: 0, y: 0, width: 30, height: 30 };
  let b2 = { x: 0, y: 0, width: 30, height: 30 };
  try {
    const raw1 = p1.getBBox();
    const raw2 = p2.getBBox();
    if (raw1 && raw1.width > 0) b1 = raw1;
    if (raw2 && raw2.width > 0) b2 = raw2;
  } catch (e) {
    console.warn('Erreur BBox silhouette', e);
  }
  document.body.removeChild(tempSvg);

  const { viewBox1, viewBox2 } = computeSameScaleViewBoxes(b1, b2, 0.20);

  boxLeft.innerHTML = `
    <svg viewBox="${viewBox1}" preserveAspectRatio="xMidYMid meet">
      <path d="${d1}" class="silhouette-path-left" />
    </svg>
    <span class="silhouette-scale-label">ÉCHELLE 1:1</span>
  `;

  boxRight.innerHTML = `
    <svg viewBox="${viewBox2}" preserveAspectRatio="xMidYMid meet">
      <path d="${d2}" class="silhouette-path-right" />
    </svg>
    <span class="silhouette-scale-label">ÉCHELLE 1:1</span>
  `;
}

/**
 * Affiche la boîte modale de la carte des frontières après avoir répondu à une question frontière.
 */
async function showBorderMapModal(question, onNext) {
  if (!question || !question.secondCountry) {
    onNext();
    return;
  }

  borderMapC1Name.textContent = question.country.name;
  borderMapC2Name.textContent = question.secondCountry.name;

  const borderInfo = getBorderInfo(question.country, question.secondCountry);
  borderMapStatus.className = `border-map-status-badge ${borderInfo.areNeighbors ? 'status-neighbor' : 'status-not-neighbor'}`;
  borderMapStatus.textContent = borderInfo.areNeighbors
    ? '🤝 Voisins frontaliers'
    : '❌ Non frontaliers';

  const svgText = await getWorldSvgText();
  if (!svgText) {
    onNext();
    return;
  }

  borderMapContainer.innerHTML = svgText;
  const svg = borderMapContainer.querySelector('svg');
  if (!svg) {
    onNext();
    return;
  }

  const code1 = question.country.code.toLowerCase();
  const code2 = question.secondCountry.code.toLowerCase();

  const path1 = svg.querySelector(`#${code1}`);
  const path2 = svg.querySelector(`#${code2}`);

  // Fond sombre pour tous les pays
  svg.querySelectorAll('path').forEach((p) => {
    p.style.fill = '#1e293b';
    p.style.stroke = '#334155';
    p.style.strokeWidth = '0.5';
  });

  if (path1) {
    path1.style.fill = '#3b82f6';
    path1.style.stroke = '#93c5fd';
    path1.style.strokeWidth = '1.8';
    path1.parentElement.appendChild(path1);
  }

  if (path2) {
    path2.style.fill = '#f97316';
    path2.style.stroke = '#fdba74';
    path2.style.strokeWidth = '1.8';
    path2.parentElement.appendChild(path2);
  }

  // Par défaut : Vue Régionale dézoomée
  let isZoomed = true;
  let zoomBox = DEFAULT_MAP_VIEWBOX;
  borderMapToggleZoom.textContent = '🌍 Vue Monde';

  const calculateZoom = () => {
    if (path1 && path2) {
      try {
        const b1 = path1.getBBox();
        const b2 = path2.getBBox();
        const computed = computeZoomViewBox(b1, b2, 1010, 666);
        if (computed && computed !== DEFAULT_MAP_VIEWBOX) {
          zoomBox = computed;
          if (isZoomed) {
            svg.setAttribute('viewBox', zoomBox);
          }
        }
      } catch (e) {
        console.warn('Erreur calcul BBox', e);
      }
    }
  };

  borderMapToggleZoom.onclick = () => {
    calculateZoom();
    isZoomed = !isZoomed;
    svg.setAttribute('viewBox', isZoomed ? zoomBox : DEFAULT_MAP_VIEWBOX);
    borderMapToggleZoom.textContent = isZoomed ? '🌍 Vue Monde' : '🔍 Zoom Pays';
  };

  const advanceHandler = () => {
    borderMapModal.close();
    borderMapNextBtn.removeEventListener('click', advanceHandler);
    window.removeEventListener('keydown', keydownHandler);
    onNext();
  };

  const keydownHandler = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      advanceHandler();
    }
  };

  borderMapNextBtn.addEventListener('click', advanceHandler);
  window.addEventListener('keydown', keydownHandler);

  borderMapModal.showModal();
  // Calculer la boîte de zoom une fois le modal visible dans le DOM
  requestAnimationFrame(calculateZoom);
}

/**
 * Clic d'option en Mode Avancé (Survie)
 */
function handleAdvancedOptionClick(selectedOption, clickedButton) {
  const currentQ = advancedEngine.currentQuestion;
  const isCorrect = selectedOption === currentQ.correctAnswer;

  const buttons = optionsContainer.querySelectorAll('.option-btn');
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (!isCorrect && btn.textContent === currentQ.correctAnswer) {
      btn.classList.add('revealed');
    }
  });

  if (isCorrect) {
    clickedButton.classList.add('correct');
  } else {
    clickedButton.classList.add('wrong');
  }

  const result = advancedEngine.answer(selectedOption);

  if (isCorrect) {
    const liveUpdate = advancedStreakTracker.update(result.streak);
    if (liveUpdate.isLiveInTop3) {
      currentStreakEl.textContent = `🔥 ${result.streak} (#${liveUpdate.rank})`;
      updateHeaderTopStreaks(liveUpdate.topStreaks, liveUpdate.rank);
    } else {
      currentStreakEl.textContent = `🔥 ${result.streak}`;
    }
  } else {
    advancedStreakTracker.onStreakEnd();
    updateHeaderTopStreaks();
    currentStreakEl.textContent = '🔥 0';
  }

  // Révélations post-réponse pour les duels comparatifs
  let advanceDelay = 850;

  if (currentQ.category === 'surface') {
    // Révéler les silhouettes à l'échelle et les superficies en km²
    document.getElementById('silhouette-left')?.classList.remove('hidden');
    document.getElementById('silhouette-right')?.classList.remove('hidden');
    document.getElementById('area-reveal-left')?.classList.add('visible');
    document.getElementById('area-reveal-right')?.classList.add('visible');
    advanceDelay = 1800;
  } else if (currentQ.category === 'population') {
    // Révéler la population exacte du pays de droite
    const rightValEl = document.getElementById('right-country-value');
    if (rightValEl && currentQ.rightPopulationText) {
      rightValEl.innerHTML = `<strong style="color: #fbbf24; font-size: 0.8rem;">${currentQ.rightPopulationText}</strong>`;
    }
    advanceDelay = 1700;
  } else if (currentQ.category === 'pib') {
    // Révéler le PIB par habitant exact du pays de droite
    const rightValEl = document.getElementById('right-country-value');
    if (rightValEl && currentQ.rightGdpPerCapitaText) {
      rightValEl.innerHTML = `<strong style="color: #fbbf24; font-size: 0.8rem;">${currentQ.rightGdpPerCapitaText}</strong>`;
    }
    advanceDelay = 1700;
  } else if (currentQ.category in SOCIAL_METRICS) {
    // Révéler la valeur sociale exacte du pays de gauche
    const leftValEl = document.getElementById('left-country-value');
    if (leftValEl && currentQ.leftValueText) {
      leftValEl.innerHTML = `<strong style="color: #fbbf24; font-size: 0.8rem;">${currentQ.leftValueText}</strong>`;
    }
    advanceDelay = 1800;
  }

  // Pour les questions frontière : afficher la carte vectorielle avant d'enchaîner
  if (currentQ.category === 'frontiere') {
    setTimeout(() => {
      showBorderMapModal(currentQ, () => {
        if (advancedEngine.isGameOver) {
          showEndModal();
        } else {
          renderQuestion();
        }
      });
    }, 600);
    return;
  }

  setTimeout(() => {
    if (advancedEngine.isGameOver) {
      showEndModal();
    } else {
      renderQuestion();
    }
  }, advanceDelay);
}

/**
 * Affiche la boîte de fin de partie.
 */
function showEndModal() {
  if (currentMode === 'classic') {
    showClassicEndModal();
  } else {
    showAdvancedEndModal();
  }
}

function showClassicEndModal() {
  const score = classicEngine.score;
  const total = classicEngine.totalQuestions;
  const percentage = Math.round((score / total) * 100);
  const bestStreak = classicEngine.maxStreak;

  classicStreakTracker.onStreakEnd();
  const topStreaks = getTopStreaks();

  modalTitle.textContent = 'Partie terminée !';
  modalScoreLabel.textContent = 'Score Final';
  finalScore.textContent = `${score} / ${total} (${percentage}%)`;
  modalBestStreak.textContent = `🔥 ${bestStreak}`;

  const rank = topStreaks.indexOf(bestStreak);
  const isInTop3 = bestStreak > 0 && rank !== -1;

  if (isInTop3) {
    newRecordBadge.classList.remove('hidden');
    if (rank === 0) {
      newRecordBadge.textContent = `👑 Nouveau Record Absolu : ${bestStreak} d'affilée !`;
    } else {
      newRecordBadge.textContent = `🎉 Entrée dans le Top 3 (#${rank + 1}) avec ${bestStreak} d'affilée !`;
    }
  } else {
    newRecordBadge.classList.add('hidden');
  }

  renderPodium(topStreaks, isInTop3 ? rank + 1 : null);

  if (percentage === 100) {
    modalIcon.textContent = '🏆';
    modalMessage.textContent = 'Score parfait, vous êtes un expert mondial des drapeaux !';
  } else if (percentage >= 70) {
    modalIcon.textContent = '🌟';
    modalMessage.textContent = 'Impressionnante culture géographique.';
  } else if (percentage >= 50) {
    modalIcon.textContent = '👍';
    modalMessage.textContent = 'Une belle partie ! Rejouez pour battre votre série.';
  } else {
    modalIcon.textContent = '🎯';
    modalMessage.textContent = 'Continuez l\'entraînement !';
  }

  updateHeaderTopStreaks();
  endModal.showModal();
}

function showAdvancedEndModal() {
  const streak = advancedEngine.streak;
  const bestStreak = advancedEngine.bestStreak;

  advancedStreakTracker.onStreakEnd();
  const topStreaks = getTopStreaks(advancedStorage);

  modalTitle.textContent = 'Survie Terminée !';
  modalScoreLabel.textContent = 'Série Finale';
  finalScore.textContent = `${streak} question(s)`;
  modalBestStreak.textContent = `🔥 ${bestStreak}`;

  const rank = topStreaks.indexOf(bestStreak);
  const isInTop3 = bestStreak > 0 && rank !== -1;

  if (isInTop3) {
    newRecordBadge.classList.remove('hidden');
    if (rank === 0) {
      newRecordBadge.textContent = `👑 Record Survie Battu : ${bestStreak} d'affilée !`;
    } else {
      newRecordBadge.textContent = `⚡ Top 3 Survie (#${rank + 1}) : ${bestStreak} d'affilée !`;
    }
  } else {
    newRecordBadge.classList.add('hidden');
  }

  renderPodium(topStreaks, isInTop3 ? rank + 1 : null);

  modalIcon.textContent = streak >= 15 ? '👑' : streak >= 8 ? '🌟' : '🎯';
  modalMessage.textContent =
    streak >= 15
      ? 'Incroyable performance en mode survie ! Vous maîtrisez le monde.'
      : streak >= 8
      ? 'Très belle série de culture générale !'
      : 'La difficulté monte vite ! Rejouez pour tenter de battre votre record.';

  updateHeaderTopStreaks();
  endModal.showModal();
}

/**
 * Rendu visuel du podium Top 3.
 */
function renderPodium(topStreaks, highlightedRank) {
  modalPodiumList.innerHTML = '';
  const medals = ['🥇 1er', '🥈 2e', '🥉 3e'];

  for (let i = 0; i < 3; i++) {
    const li = document.createElement('li');
    li.className = 'podium-item';
    if (highlightedRank === i + 1) {
      li.classList.add('highlight');
    }

    const rankSpan = document.createElement('span');
    rankSpan.className = 'podium-rank';
    rankSpan.textContent = medals[i];

    const valueSpan = document.createElement('span');
    if (topStreaks[i] !== undefined) {
      valueSpan.className = 'podium-value';
      valueSpan.textContent = `${topStreaks[i]} pts`;
    } else {
      valueSpan.className = 'podium-empty';
      valueSpan.textContent = '-';
    }

    li.appendChild(rankSpan);
    li.appendChild(valueSpan);
    modalPodiumList.appendChild(li);
  }
}

// ==========================================================================
// Gestion des Paramètres (Poids des Catégories)
// ==========================================================================
const categoryDefs = [
  { id: 'drapeau', label: '🚩 Drapeau' },
  { id: 'capitale', label: '🏛️ Capitale' },
  { id: 'frontiere', label: '🗺️ Frontière' },
  { id: 'monnaie', label: '🪙 Monnaie' },
  { id: 'population', label: '👥 Population' },
  { id: 'surface', label: '📐 Superficie' },
  { id: 'pib', label: '💰 PIB par habitant' },
  { id: 'lifeExpectancy', label: '🏥 Espérance de vie' },
  { id: 'hdi', label: '🌍 IDH' },
  { id: 'medianAge', label: '🎂 Âge médian' },
  { id: 'schoolingYears', label: '📚 Scolarisation' },
];

function openSettingsModal() {
  const currentDiffs = getCategoryDifficulties();
  renderSettingsSliders(currentDiffs);
  settingsModal.showModal();
}

function renderSettingsSliders(diffs) {
  settingsSlidersContainer.innerHTML = '';

  categoryDefs.forEach((cat) => {
    const row = document.createElement('div');
    row.className = 'setting-row';

    const val = diffs[cat.id] ?? 1;

    row.innerHTML = `
      <div class="setting-row-top">
        <span class="setting-cat-label">${cat.label}</span>
        <span class="setting-val-badge" id="badge-${cat.id}">${val} pt${val > 1 ? 's' : ''}</span>
      </div>
      <input
        type="range"
        class="setting-range"
        id="range-${cat.id}"
        min="1"
        max="20"
        value="${val}"
        aria-label="Poids de la catégorie ${cat.label}"
      />
    `;

    const input = row.querySelector(`#range-${cat.id}`);
    const badge = row.querySelector(`#badge-${cat.id}`);

    input.addEventListener('input', () => {
      const currentV = Number(input.value);
      badge.textContent = `${currentV} pt${currentV > 1 ? 's' : ''}`;
    });

    settingsSlidersContainer.appendChild(row);
  });
}

function saveAndCloseSettings() {
  const newValues = {};
  categoryDefs.forEach((cat) => {
    const input = document.getElementById(`range-${cat.id}`);
    if (input) {
      newValues[cat.id] = Number(input.value);
    }
  });

  saveCategoryDifficulties(newValues);
  settingsModal.close();

  if (currentMode === 'advanced' && advancedEngine && advancedEngine.currentQuestion) {
    renderQuestion();
  }
}

// Événements - Paramètres
settingsOpenBtn.addEventListener('click', openSettingsModal);
settingsCloseX.addEventListener('click', () => settingsModal.close());
settingsSaveBtn.addEventListener('click', saveAndCloseSettings);
settingsResetBtn.addEventListener('click', () => {
  const defaults = resetCategoryDifficulties();
  renderSettingsSliders(defaults);
});

// Événements - Switcher de Mode
modeClassicBtn.addEventListener('click', () => switchMode('classic'));
modeAdvancedBtn.addEventListener('click', () => switchMode('advanced'));

// Configuration classique
questionCountSelect.addEventListener('change', () => {
  if (currentMode === 'classic') startNewGame();
});

// Bouton rejouer
restartBtn.addEventListener('click', () => {
  endModal.close();
  startNewGame();
});

// Enregistrement du Service Worker PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        console.log('Service Worker actif :', registration.scope);
      })
      .catch((error) => {
        console.warn('Erreur Service Worker :', error);
      });
  });
}

// Démarrage initial en Mode Classique
startNewGame();
