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
    }, 2000);
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

// --- FUNCTIONALITY TO ADD, EDIT & DELETE PROJECTS ---
function addNewProject(listId) {
    // 1. Target the specific "New" list
    const list = document.getElementById("list-new");
    if (!list) {
        console.error("Could not find the 'New' list. Check your HTML ID.");
        return;
    }

    const container = list.querySelector('.card-content');
    
    // 2. Prompt for project name
    const projectName = prompt("Enter project name:");
    if (!projectName || projectName.trim() === "") return; // Exit if user cancels

    // 3. Create the card element
    const card = document.createElement('div');
    card.classList.add('card');
    
    // Generate a unique ID using the current timestamp
    card.id = "card-" + Date.now(); 
    card.draggable = true;
    
    // Create a wrapper for the text so we can edit it easily
    card.innerHTML = `
        <span class="card-text">${projectName}</span>
        <div class="card-controls">
            <button class="btn edit-btn" onclick="editCard('${card.id}')">✏️</button>
            <button class="btn delete-btn" onclick="deleteCard('${card.id}')">🗑️</button>
        </div>
    `;

    // 4. Attach the drag event listeners to the NEW card
    card.addEventListener("dragstart", dragStart);
    card.addEventListener("dragend", dragEnd);

    // 5. Append to the list and update UI
    container.appendChild(card);
    updateListCount(list);
    saveState();    // Ensure the new card is remembered!
}

function deleteCard(cardId) {
    const card = document.getElementById(cardId);
    const list = card.closest(".list");
    
    if (confirm("Are you sure you want to delete this project?")) {
        card.remove();
        updateListCount(list);
        saveState();    // Remove from localStorage
    }
}

function editCard(cardId) {
    const card = document.getElementById(cardId);
    const textSpan = card.querySelector(".card-text");
    const currentText = textSpan.innerText;
    
    const newText = prompt("Edit project name:", currentText);
    
    if (newText && newText.trim() !== "") {
        textSpan.innerText = newText;
        saveState();    // Update text in localStorage
    }
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
        const textElement = card.querySelector(".card-text");
        
        // Only save if the textElement exists
        if (textElement) {
            state[card.id] = {
                listId: card.closest(".list").id,
                text: textElement.innerText
            };
        } else {
            console.warn(`Card ${card.id} is missing the .card-text span!`);
        }
    });
    localStorage.setItem("kanbanState", JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem("kanbanState");
    if (!savedState) {
        // Even if empty, update counts to show "0"
        lists.forEach(list => updateListCount(list));
        return;
    }

    const state = JSON.parse(savedState);
    
    // Iterate through the saved IDs and move elements back to their containers
    for (const [cardId, data] of Object.entries(state)) {
        const list = document.getElementById(data.listId);

        if (list) {
            const container = list.querySelector(".card-content");
            const card = document.createElement('div');
            card.classList.add('card');
            card.id = cardId;
            card.draggable = true;
            
            card.innerHTML = `
                <span class="card-text">${data.text}</span>
                <div class="card-controls">
                    <button class="btn edit-btn" onclick="editCard('${card.id}')">✏️</button>
                    <button class="btn delete-btn" onclick="deleteCard('${card.id}')">🗑️</button>
                </div>
            `;

            card.addEventListener("dragstart", dragStart);
            card.addEventListener("dragend", dragEnd);
            container.appendChild(card);
        }
    }

    // Refresh all counts after rebuilding the board
    lists.forEach(list => updateListCount(list));
}