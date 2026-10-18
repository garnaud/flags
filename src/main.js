import { countries } from './data/countries.js';
import {
  getRandomQuestions,
  QuizEngine,
  getTopStreaks,
  LiveStreakTracker,
} from './quiz.js';

// Éléments du DOM
const questionCountSelect = document.getElementById('question-count-select');
const headerTopStreaksList = document.getElementById('header-top-streaks-list');
const flagImg = document.getElementById('flag-img');
const optionsContainer = document.getElementById('options-container');
const questionProgress = document.getElementById('question-progress');
const currentScore = document.getElementById('current-score');
const currentStreakEl = document.getElementById('current-streak');
const progressBar = document.getElementById('progress-bar');
const endModal = document.getElementById('end-modal');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const finalScore = document.getElementById('final-score');
const modalBestStreak = document.getElementById('modal-best-streak');
const newRecordBadge = document.getElementById('new-record-badge');
const modalPodiumList = document.getElementById('modal-podium-list');
const restartBtn = document.getElementById('restart-btn');

let engine;
const streakTracker = new LiveStreakTracker();

/**
 * Met à jour le bandeau Top 3 dans l'en-tête (en direct ou avec la base enregistrée).
 *
 * @param {number[]} [customStreaks] - Liste optionnelle de séries (live)
 * @param {number|null} [liveRank] - Rang de la série en cours pour surbrillance
 */
function updateHeaderTopStreaks(customStreaks, liveRank = null) {
  const topStreaks = customStreaks || getTopStreaks();
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
 * Lance une nouvelle partie en fonction du nombre de questions sélectionné.
 */
function startNewGame() {
  const selectedCount = questionCountSelect.value;
  const questions = getRandomQuestions(countries, selectedCount);

  if (!engine) {
    engine = new QuizEngine(questions);
  } else {
    engine.reset(questions);
  }

  streakTracker.resetBaseline();
  updateHeaderTopStreaks();
  renderQuestion();
}

/**
 * Met à jour l'affichage avec la question courante du quiz.
 */
function renderQuestion() {
  if (engine.isGameOver) {
    showEndModal();
    return;
  }

  const currentQ = engine.getCurrentQuestion();
  const currentIndex = engine.currentQuestionIndex;
  const total = engine.totalQuestions;

  // Mise à jour des compteurs et de la barre de progression
  questionProgress.textContent = `${currentIndex + 1} / ${total}`;
  currentScore.textContent = `${engine.score}`;
  currentStreakEl.textContent = `🔥 ${engine.currentStreak}`;
  const progressPercent = Math.round((currentIndex / total) * 100);
  progressBar.style.width = `${progressPercent}%`;

  // Mise à jour du drapeau avec fondu visuel
  flagImg.classList.add('loading');
  flagImg.src = `https://flagcdn.com/w320/${currentQ.country.code.toLowerCase()}.png`;
  flagImg.alt = `Drapeau à identifier - Question ${currentIndex + 1}`;
  flagImg.onload = () => flagImg.classList.remove('loading');

  // Génération des 4 boutons d'options
  optionsContainer.innerHTML = '';
  currentQ.options.forEach((optionName) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.textContent = optionName;
    btn.setAttribute('aria-label', `Choisir ${optionName}`);

    btn.addEventListener('click', () => handleOptionClick(optionName, btn));
    optionsContainer.appendChild(btn);
  });
}

/**
 * Gère le clic de l'utilisateur sur une option de réponse.
 *
 * @param {string} selectedOption - Option cliquée
 * @param {HTMLButtonElement} clickedButton - Bouton déclencheur
 */
function handleOptionClick(selectedOption, clickedButton) {
  const currentQ = engine.getCurrentQuestion();
  const isCorrect = selectedOption === currentQ.correctAnswer;

  // Désactiver tous les boutons pour empêcher le spam
  const buttons = optionsContainer.querySelectorAll('.option-btn');
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (!isCorrect && btn.textContent === currentQ.correctAnswer) {
      btn.classList.add('revealed');
    }
  });

  // Appliquer le retour visuel
  if (isCorrect) {
    clickedButton.classList.add('correct');
  } else {
    clickedButton.classList.add('wrong');
  }

  // Enregistrer la réponse dans le moteur de quiz
  const result = engine.answer(selectedOption);

  if (isCorrect) {
    // Mise à jour EN DIRECT du Top 3
    const liveUpdate = streakTracker.update(result.currentStreak);

    if (liveUpdate.isLiveInTop3) {
      currentStreakEl.textContent = `🔥 ${result.currentStreak} (#${liveUpdate.rank})`;
      updateHeaderTopStreaks(liveUpdate.topStreaks, liveUpdate.rank);
    } else {
      currentStreakEl.textContent = `🔥 ${result.currentStreak}`;
    }
  } else {
    // Série brisée : verrouiller la baseline et rafraîchir le bandeau
    streakTracker.onStreakEnd();
    updateHeaderTopStreaks();
    currentStreakEl.textContent = '🔥 0';
  }

  // Pause visuelle avant de continuer
  setTimeout(() => {
    if (engine.isGameOver) {
      progressBar.style.width = '100%';
      currentScore.textContent = `${engine.score}`;
      currentStreakEl.textContent = `🔥 ${engine.currentStreak}`;
      showEndModal();
    } else {
      renderQuestion();
    }
  }, 850);
}

/**
 * Affiche la boîte modale de fin de partie avec le récapitulatif et le Top 3 des séries.
 */
function showEndModal() {
  const score = engine.score;
  const total = engine.totalQuestions;
  const percentage = Math.round((score / total) * 100);
  const bestStreak = engine.maxStreak;

  // Clôturer la série en cours
  streakTracker.onStreakEnd();
  const topStreaks = getTopStreaks();

  finalScore.textContent = `${score} / ${total} (${percentage}%)`;
  modalBestStreak.textContent = `🔥 ${bestStreak}`;

  // Déterminer si la meilleure série de la partie figure dans le Top 3 final
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

  // Rendu du podium
  renderPodium(topStreaks, isInTop3 ? rank + 1 : null);

  // Message d'appréciation
  if (percentage === 100) {
    modalIcon.textContent = '🏆';
    modalTitle.textContent = 'Grand Chelem !';
    modalMessage.textContent = 'Score parfait, vous êtes un maître mondial de la géographie !';
  } else if (percentage >= 70) {
    modalIcon.textContent = '🌟';
    modalTitle.textContent = 'Excellent travail !';
    modalMessage.textContent = 'Impressionnante culture géographique.';
  } else if (percentage >= 50) {
    modalIcon.textContent = '👍';
    modalTitle.textContent = 'Bien joué !';
    modalMessage.textContent = 'Une belle partie ! Rejouez pour battre votre série.';
  } else {
    modalIcon.textContent = '🎯';
    modalTitle.textContent = 'Continuez l\'entraînement !';
    modalMessage.textContent = 'Chaque partie vous rend plus fort sur les drapeaux.';
  }

  updateHeaderTopStreaks();
  endModal.showModal();
}

/**
 * Rendu visuel des 3 places du podium.
 *
 * @param {number[]} topStreaks
 * @param {number|null} highlightedRank
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

// Changement de la taille de liste de questions
questionCountSelect.addEventListener('change', () => {
  startNewGame();
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

// Démarrage initial
startNewGame();
