const cards = document.querySelectorAll(".card");
const lists = document.querySelectorAll(".list");

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    loadState();    // Restore positions from localStorage
    
    // Initial count for all lists on load
    lists.forEach(list => updateListCount(list));
});

// --- EVENT LISTENERS ---
for (const card of cards) {
    card.addEventListener("dragstart", dragStart);
    card.addEventListener("dragend", dragEnd);
}

for (const list of lists) {
    list.addEventListener("dragover", dragOver);
    list.addEventListener("dragenter", dragEnter);
    list.addEventListener("dragleave", dragLeave);
    list.addEventListener("drop", dragDrop);
}

// --- CORE FUNCTIONS ---
function dragStart(e) {
    // Informs drop location about the moved element
    e.dataTransfer.setData("text/plain", this.id);
}

function dragEnd() {
    const toast = document.getElementById("toast");

    toast.innerHTML = "✔️ Project successfully moved."
    toast.classList.remove("toast-hidden");
    toast.classList.add("toast-show");

    setTimeout(() => { 
        toast.classList.remove("toast-show");
        toast.classList.add("toast-hidden");    
    }, 3000);
}

function dragOver(e) {
    // Important, as by default, browsers don't allow you to drop elements onto other elements.
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.classList.add("over");
}

function dragLeave() {
    this.classList.remove("over");
}

function dragDrop(e) {
    const id = e.dataTransfer.getData("text/plain");
    const card = document.getElementById(id);

    // 1. Identify the source list BEFORE moving the card
    const sourceList = card.closest(".list");

    // 2. Append the card to the targer's specific container by its class
    const cardContainer = this.querySelector('.card-content');
    if (cardContainer) {
        cardContainer.appendChild(card);
    }

    // 3. Update counts for both the source and the target lists
    updateListCount(sourceList);    // The list it left
    updateListCount(this);          // The list it entered

    // Save the new layout to localStorage
    saveState();

    this.classList.remove("over");
}

// --- UTILITY & PERSISTENCE ---
function updateListCount(listElement) {
    if (!listElement) return;

    const countSpan = listElement.querySelector(".list-count span");
    const cardCount = listElement.querySelectorAll(".card").length;

    if (countSpan) {
        countSpan.textContent = cardCount;
    }
}

function saveState() {
    const state = {};

    // Loop through all cards and record which list container they are in
    document.querySelectorAll(".card").forEach(card => {
        const listId = card.closest(".list").id; 
        state[card.id] = listId;
    });
    localStorage.setItem("kanbanState", JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem("kanbanState");
    if (!savedState) return;

    const state = JSON.parse(savedState);
    
    // Iterate through the saved IDs and move elements back to their containers
    for (const [cardId, listId] of Object.entries(state)) {
        const card = document.getElementById(cardId);
        const list = document.getElementById(listId);
        
        if (card && list) {
            const container = list.querySelector(".card-content");
            if (container) container.appendChild(card);
        }
    }
}