// Variabili globali
let allCards = [];              // Array dei dati delle flashcard
let currentBatchIndex = 0;      // Indice del batch per lazy loading
const BATCH_SIZE = 20;          // Numero di flashcard da caricare per volta
let showOnlyDifficult = false;  // Stato per mostrare solo le carte difficili
let difficultCards = new Set(); // Set degli ID contrassegnati come "difficili"

// Carica lo stato "difficili" da localStorage (se presente)
const savedDifficult = localStorage.getItem('difficultCards');
if (savedDifficult) {
  difficultCards = new Set(JSON.parse(savedDifficult));
}

// Riferimenti agli elementi del DOM
const container = document.getElementById("cardsContainer");
const sentinel = document.getElementById("sentinel");
const shuffleBtn = document.getElementById("shuffleBtn");
const toggleDifficultBtn = document.getElementById("toggleDifficultBtn");
const loadingMessage = document.getElementById("loadingMessage");

/**
 * Carica il file JSON contenente i dati delle flashcard
 */
fetch('cards.json')
  .then(response => response.json())
  .then(data => {
    console.log("Dati flashcard caricati:", data.cards);
    allCards = data.cards;
    shuffleArray(allCards);
    loadNextBatch();
    setupIntersectionObserver();
  })
  .catch(err => {
    console.error("Errore nel caricamento di cards.json:", err);
    loadingMessage.textContent = "Errore nel caricamento dei dati.";
  });

/**
 * Shuffle: algoritmo Fisher-Yates
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Carica il prossimo batch di flashcard nel DOM
 */
function loadNextBatch() {
  const sourceArray = showOnlyDifficult 
    ? allCards.filter(card => difficultCards.has(card.id))
    : allCards;

  if (currentBatchIndex >= sourceArray.length) {
    loadingMessage.textContent = "Hai caricato tutte le carte!";
    console.log("Checkpoint: tutte le carte sono state caricate.");
    return;
  } else {
    loadingMessage.textContent = "Caricamento in corso...";
  }

  let loaded = 0;
  const fragment = document.createDocumentFragment();

  while (currentBatchIndex < sourceArray.length && loaded < BATCH_SIZE) {
    const cardData = sourceArray[currentBatchIndex];
    const cardElement = createCardElement(cardData);
    fragment.appendChild(cardElement);
    currentBatchIndex++;
    loaded++;
  }

  container.appendChild(fragment);
  
  if (currentBatchIndex >= sourceArray.length) {
    loadingMessage.textContent = "Tutte le carte sono state caricate.";
    console.log("Checkpoint: batch finale caricato.");
  } else {
    loadingMessage.textContent = "";
  }
}

/**
 * Crea un elemento "card"
 */
function createCardElement(cardData) {
  console.log("Creazione card per:", cardData);
  
  const card = document.createElement("div");
  card.classList.add("card");
  
  const img = document.createElement("img");
  img.src = cardData.imageUrl;
  img.alt = cardData.folderName;
  
  // Log sul caricamento dell'immagine
  img.addEventListener("load", () => {
    console.log("Immagine caricata:", cardData.imageUrl);
  });
  img.addEventListener("error", () => {
    console.error("Errore nel caricamento dell'immagine:", cardData.imageUrl);
  });
  
  const folderNameDiv = document.createElement("div");
  folderNameDiv.classList.add("folder-name");
  folderNameDiv.textContent = cardData.folderName;
  
  const starIcon = document.createElement("span");
  starIcon.classList.add("difficult-icon");
  starIcon.innerHTML = "&#9733;";
  if (difficultCards.has(cardData.id)) {
    starIcon.classList.add("marked");
  }
  
  card.appendChild(img);
  card.appendChild(folderNameDiv);
  card.appendChild(starIcon);
  
  card.addEventListener("click", (e) => {
    if (e.target === starIcon) return;
    card.classList.toggle("show-name");
    console.log("Toggle nome per la card:", cardData.folderName);
  });
  
  starIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDifficult(cardData.id, starIcon);
    console.log("Toggle difficile per la card:", cardData.folderName);
  });
  
  return card;
}

/**
 * Aggiorna il set "difficili" e salva in localStorage
 */
function toggleDifficult(cardId, iconElement) {
  if (difficultCards.has(cardId)) {
    difficultCards.delete(cardId);
    iconElement.classList.remove("marked");
  } else {
    difficultCards.add(cardId);
    iconElement.classList.add("marked");
  }
  localStorage.setItem('difficultCards', JSON.stringify(Array.from(difficultCards)));
  console.log("Stato difficili aggiornato:", Array.from(difficultCards));
}

/**
 * Configura l'Intersection Observer per il lazy loading
 * La sentinella è ora un elemento esterno (id="sentinel")
 */
function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      console.log("Sentinella visibile, caricamento nuovo batch...");
      loadNextBatch();
    }
  }, {
    root: null,
    rootMargin: "300px", // carica le card quando la sentinella è entro 300px dal viewport
    threshold: 0
  });
  
  observer.observe(sentinel);
}

/**
 * Eventi per i pulsanti "Rimescola" e "Mostra solo carte difficili"
 */
shuffleBtn.addEventListener('click', () => {
  if (showOnlyDifficult) {
    const diffArray = allCards.filter(card => difficultCards.has(card.id));
    shuffleArray(diffArray);
    container.innerHTML = "";
    currentBatchIndex = 0;
    const nonDiffArray = allCards.filter(card => !difficultCards.has(card.id));
    allCards = diffArray.concat(nonDiffArray);
    console.log("Carte difficili mescolate:", diffArray);
    loadNextBatch();
  } else {
    shuffleArray(allCards);
    container.innerHTML = "";
    currentBatchIndex = 0;
    console.log("Tutte le carte mescolate.");
    loadNextBatch();
  }
});

toggleDifficultBtn.addEventListener('click', () => {
  showOnlyDifficult = !showOnlyDifficult;
  toggleDifficultBtn.textContent = showOnlyDifficult
    ? "Mostra tutte le carte"
    : "Mostra solo carte difficili";
  currentBatchIndex = 0;
  container.innerHTML = "";
  console.log("Modalità solo difficili:", showOnlyDifficult);
  loadNextBatch();
});

