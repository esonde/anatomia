// Variabili globali
let allCards = [];              // Array di oggetti contenenti { id, imageUrl, folderName }
// Esempio statico di dati: in un'app reale potresti caricarli da un JSON o API
// Per test puoi usarli in questo modo oppure sostituirli con una richiesta AJAX
allCards = [
  { id: '1', imageUrl: 'images/flashcard1.jpg', folderName: 'Flashcard 1' },
  { id: '2', imageUrl: 'images/flashcard2.jpg', folderName: 'Flashcard 2' },
  { id: '3', imageUrl: 'images/flashcard3.jpg', folderName: 'Flashcard 3' },
  // Aggiungi altri oggetti se necessario
];

let currentBatchIndex = 0;      // Indice per il lazy loading
const BATCH_SIZE = 2;           // Numero di carte da caricare per volta (modifica a piacere)
let showOnlyDifficult = false;  // Stato per mostrare solo le carte difficili
let difficultCards = new Set(); // Set degli ID contrassegnati come "difficili"

// Carica lo stato "difficili" da localStorage (se presente)
const savedDifficult = localStorage.getItem('difficultCards');
if (savedDifficult) {
  difficultCards = new Set(JSON.parse(savedDifficult));
}

// Riferimenti agli elementi del DOM
const container = document.getElementById("cardsContainer");
const shuffleBtn = document.getElementById("shuffleBtn");
const toggleDifficultBtn = document.getElementById("toggleDifficultBtn");
const loadingMessage = document.getElementById("loadingMessage");

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
  // Filtra l'array se bisogna mostrare solo le "difficili"
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
 * Crea un elemento "card" e aggiunge i log per il caricamento dell'immagine
 */
function createCardElement(cardData) {
  console.log("Creazione card per:", cardData);
  
  const card = document.createElement("div");
  card.classList.add("card");
  
  const img = document.createElement("img");
  img.src = cardData.imageUrl;
  img.alt = cardData.folderName;
  
  // Log: conferma che l'immagine sia stata caricata o segnala errori
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
  
  // Evento: toggle per mostrare/nascondere il nome della flashcard
  card.addEventListener("click", (e) => {
    if (e.target === starIcon) return;
    card.classList.toggle("show-name");
    console.log("Toggle nome per la card:", cardData.folderName);
  });
  
  // Evento: toggle per "difficile" sulla stella
  starIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDifficult(cardData.id, starIcon);
    console.log("Toggle difficile per la card:", cardData.folderName);
  });
  
  return card;
}

/**
 * Aggiorna il set "difficili" e salva il nuovo stato nel localStorage
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
 */
function setupIntersectionObserver() {
  const sentinel = document.createElement('div');
  sentinel.style.height = "1px";
  container.appendChild(sentinel);

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      console.log("Sentinella visibile, caricamento nuovo batch...");
      loadNextBatch();
    }
  }, {
    root: null,
    rootMargin: "200px",
    threshold: 0
  });

  observer.observe(sentinel);
}

/**
 * Eventi per i pulsanti di rimescolamento e filtro
 */
shuffleBtn.addEventListener('click', () => {
  if (showOnlyDifficult) {
    const diffArray = allCards.filter(card => difficultCards.has(card.id));
    shuffleArray(diffArray);
    container.innerHTML = "";
    currentBatchIndex = 0;
    const nonDiffArray = allCards.filter(card => !difficultCards.has(card.id));
    allCards = diffArray.concat(nonDiffArray);
    console.log("Carte difficili mescolate.", diffArray);
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

// Se il sito deve caricare i dati da una fonte esterna (es. JSON o API), qui va aggiunto il codice per la richiesta AJAX.
// In questo esempio usiamo dati statici definiti all'inizio.

