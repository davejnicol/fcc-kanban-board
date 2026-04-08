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
            <button class="btn edit-btn" onclick="editCard('${card.id}')" title="Edit">
                <svg xmlns="http://w3.org" width="16" height="16" viewBox="0 0 528.899 528.899" fill="currentColor">
                    <g>
                        <path d="M328.883,89.125l107.59,107.589l-272.34,272.34L56.604,361.465L328.883,89.125z M518.113,63.177l-47.981-47.981
                        c-18.543-18.543-48.653-18.543-67.259,0l-45.961,45.961l107.59,107.59l53.611-53.611
                        C532.495,100.753,532.495,77.559,518.113,63.177z M0.3,512.69c-1.958,8.812,5.998,16.708,14.811,14.565l119.891-29.069
                        L27.473,390.597L0.3,512.69z"></path>
                    </g>
                </svg>
            </button>
            <button class="btn delete-btn" onclick="deleteCard('${card.id}')" title="Delete">
                <svg xmlns="http://w3.org" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6H21M5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6"></path>
                    <path d="M14 11V17"></path>
                    <path d="M10 11V17"></path>
                </svg>
            </button>
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
                    <button class="btn edit-btn" onclick="editCard('${card.id}')">
                        <svg xmlns="http://w3.org" width="18" height="18" viewBox="0 0 528.899 528.899" fill="currentColor">
                            <g>
                                <path d="M328.883,89.125l107.59,107.589l-272.34,272.34L56.604,361.465L328.883,89.125z M518.113,63.177l-47.981-47.981
                                c-18.543-18.543-48.653-18.543-67.259,0l-45.961,45.961l107.59,107.59l53.611-53.611
                                C532.495,100.753,532.495,77.559,518.113,63.177z M0.3,512.69c-1.958,8.812,5.998,16.708,14.811,14.565l119.891-29.069
                                L27.473,390.597L0.3,512.69z"></path>
                            </g>
                        </svg>
                    </button>
                    <button class="btn delete-btn" onclick="deleteCard('${card.id}')">
                        <svg xmlns="http://w3.org" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6H21M5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6"></path>
                            <path d="M14 11V17"></path>
                            <path d="M10 11V17"></path>
                        </svg>
                    </button>
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