// script.js (Local Storage version)

// HTML elements
const totalAmountEl = document.getElementById('total-amount');
const tableBodyEl = document.getElementById('transaction-table-body');
const noteInput = document.getElementById('note-input');
const amountInput = document.getElementById('amount-input');
const incomeBtn = document.getElementById('income-btn');
const outgoingBtn = document.getElementById('outgoing-btn');
const loanCheckbox = document.getElementById('loan-checkbox');
const dueDateInput = document.getElementById('due-date');

// Modal elements
const noteModal = document.getElementById("note-modal");
const modalNoteText = document.getElementById("modal-note-text");
const closeBtn = document.querySelector(".close-btn");

// Track total
let currentTotal = 0;

// --- Local Storage Helpers ---
function saveTransactions(transactions) {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function loadTransactionsFromStorage() {
  return JSON.parse(localStorage.getItem("transactions")) || [];
}

// --- Functions ---

// Load transactions
function loadTransactions() {
  let transactions = loadTransactionsFromStorage();

  // Sort newest first
  transactions.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  tableBodyEl.innerHTML = '';
  currentTotal = 0;

  transactions.forEach(tx => {
    const amount = parseFloat(tx.amount) || 0;
    const isLoan = String(tx.isLoan).toLowerCase() === "true";
    const paid = parseFloat(tx.paidAmount) || 0;

    addTransactionToDOM(
      tx.datetime,
      tx.note,
      amount,
      isLoan,
      tx.dueDate,
      paid
    );

    // ✅ Total calculation
    if (isLoan) {
      if (amount > 0) {
        currentTotal += (amount - paid);
      } else {
        currentTotal += (amount + paid);
      }
    } else {
      currentTotal += amount;
    }
  });

  updateTotal(currentTotal);

  // Update targets if defined
  if (typeof updateAllProgressBars === "function") {
    updateAllProgressBars(currentTotal);
  }
}

// Add transaction row
function addTransactionToDOM(datetime, note, amount, isLoan = false, dueDate = "", paidAmount = 0) {
  const isIncome = amount >= 0;
  const row = document.createElement('tr');

  const shortNote = note && note.length > 20 ? note.substring(0, 20) + "..." : note;
  const loanActive = isLoan === true || isLoan === "true";

  let loanHTML = "";
  if (loanActive) {
    const totalLoan = Math.abs(parseFloat(amount));
    const paid = parseFloat(paidAmount) || 0;
    const remaining = totalLoan - paid;
    const progress = Math.min((paid / totalLoan) * 100, 100);

    loanHTML = `
      <div class="loan-progress-container">
        <div class="loan-progress" style="width: ${progress}%"></div>
      </div>
      <div class="payment-details">
        Paid: ${paid.toFixed(2)} /= | Remaining: ${remaining.toFixed(2)} /=
      </div>
      <div class="loan-due-date">
        Due Date: ${dueDate || "Not set"}
      </div>
    `;
  }

  row.innerHTML = `
    <td colspan="4">
      <div class="swipe-container" data-datetime="${datetime}">
        <div class="swipe-content">
          <div class="tx-date">${datetime ? datetime.split(", ")[0] : ""}<br><small>${datetime ? datetime.split(", ")[1] : ""}</small></div>
          <div class="tx-note">
            <span class="note-cell" data-note="${note}">
              ${shortNote}
              ${loanActive ? ' <i class="fa-solid fa-bell loan-bell" data-datetime="'+datetime+'"></i>' : ""}
            </span>
            ${loanHTML}
          </div>
          <div class="tx-amount ${isIncome ? 'amount-income' : 'amount-outgoing'}">
            ${parseFloat(amount).toFixed(2)} /=
          </div>
        </div>
        <button class="swipe-delete-btn" data-datetime="${datetime}">Delete</button>
      </div>
    </td>
  `;

  tableBodyEl.appendChild(row);
}

// Update total amount
function updateTotal(total) {
  currentTotal = total;
  totalAmountEl.textContent = `${currentTotal.toFixed(2)} /=`;
  totalAmountEl.style.color = currentTotal >= 0 ? "#28a745" : "#dc3545";
}

// Add new transaction
function handleAddTransaction(type) {
  const note = noteInput.value.trim();
  const amount = amountInput.value.trim();
  const isLoan = loanCheckbox.checked ? "true" : "false";  
  const dueDate = isLoan === "true" ? dueDateInput.value : "";

  if (note === "" || amount === "") {
    alert("Please enter both a note and an amount.");
    return;
  }

  if (isLoan === "true" && dueDate === "") {
    alert("Please select a due date for the loan.");
    return;
  }

  const numericAmount = type === "outgoing" 
    ? -Math.abs(parseFloat(amount)) 
    : Math.abs(parseFloat(amount));

  const now = new Date();
  const datetime = now.toLocaleString();

  const newTx = {
    datetime,
    note,
    amount: numericAmount,
    type,
    isLoan,
    dueDate,
    paidAmount: 0
  };

  let transactions = loadTransactionsFromStorage();
  transactions.push(newTx);
  saveTransactions(transactions);

  addTransactionToDOM(datetime, note, numericAmount, loanCheckbox.checked, dueDate, 0);
  updateTotal(currentTotal + numericAmount);

  if (typeof updateAllProgressBars === "function") {
    updateAllProgressBars(currentTotal);
  }

  // Reset inputs
  noteInput.value = "";
  amountInput.value = "";
  loanCheckbox.checked = false;
  dueDateInput.value = "";
  dueDateInput.disabled = true;
}

// --- Delete Transaction ---
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("swipe-delete-btn")) {
    const datetime = e.target.dataset.datetime;

    if (confirm("Are you sure you want to delete this transaction?")) {
      let transactions = loadTransactionsFromStorage();
      const tx = transactions.find(t => t.datetime === datetime);

      if (!tx) return;

      // Adjust total before deleting
      if (tx.isLoan === "true" || tx.isLoan === true) {
        if (tx.amount > 0) {
          currentTotal -= (tx.amount - (tx.paidAmount || 0));
        } else {
          currentTotal -= (tx.amount + (tx.paidAmount || 0));
        }
      } else {
        currentTotal -= tx.amount;
      }

      // Remove from array
      transactions = transactions.filter(t => t.datetime !== datetime);
      saveTransactions(transactions);

      // Update UI
      updateTotal(currentTotal);
      if (typeof updateAllProgressBars === "function") {
        updateAllProgressBars(currentTotal);
      }
      loadTransactions();
    }
  }
});

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", loadTransactions);
incomeBtn.addEventListener("click", () => handleAddTransaction("income"));
outgoingBtn.addEventListener("click", () => handleAddTransaction("outgoing"));
loanCheckbox.addEventListener("change", () => {
  dueDateInput.disabled = !loanCheckbox.checked;
});

// --- Modal Logic ---
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("note-cell")) {
    const fullNote = e.target.dataset.note || "";
    modalNoteText.textContent = fullNote;
    noteModal.style.display = "block";
  }
});

closeBtn.addEventListener("click", () => {
  noteModal.style.display = "none";
});
window.addEventListener("click", (e) => {
  if (e.target === noteModal) {
    noteModal.style.display = "none";
  }
});

// --- Loan Repayment ---
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("loan-bell")) {
    const datetime = e.target.dataset.datetime;
    const paidInput = prompt("Enter amount paid:");
    if (!paidInput || isNaN(paidInput)) return;

    const paidValue = parseFloat(paidInput);

    let transactions = loadTransactionsFromStorage();
    const idx = transactions.findIndex(tx => tx.datetime === datetime);
    if (idx === -1) return alert("Loan not found!");

    transactions[idx].paidAmount = (parseFloat(transactions[idx].paidAmount) || 0) + paidValue;
    saveTransactions(transactions);

    if (parseFloat(transactions[idx].amount) > 0) {
      updateTotal(currentTotal - paidValue);
    } else {
      updateTotal(currentTotal + paidValue);
    }

    if (typeof updateAllProgressBars === "function") {
      updateAllProgressBars(currentTotal);
    }

    loadTransactions(); // refresh table
  }
});

// --- Export Data ---
document.getElementById("export-btn").addEventListener("click", () => {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  const targets = JSON.parse(localStorage.getItem("targets")) || [];

  const data = { transactions, targets };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

  saveAs(blob, "funds-tracker-backup.json"); // FileSaver.js handles compatibility
});


// --- Import Data ---
document.getElementById("import-btn").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.transactions) {
        localStorage.setItem("transactions", JSON.stringify(data.transactions));
      }
      if (data.targets) {
        localStorage.setItem("targets", JSON.stringify(data.targets));
      }

      alert("Data imported successfully! Refreshing...");
      location.reload();
    } catch (err) {
      alert("❌ Invalid JSON file");
    }
  };
  reader.readAsText(file);
});

// --- Reset Data ---
document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
    localStorage.removeItem("transactions");
    localStorage.removeItem("targets");
    alert("All data has been reset.");
    location.reload();
  }
});

// --- Swipe to delete logic ---
let startX = 0;
let currentSwipe = null;

document.addEventListener("touchstart", (e) => {
  if (e.target.closest(".swipe-container")) {
    startX = e.touches[0].clientX;
    currentSwipe = e.target.closest(".swipe-container");
  }
});

document.addEventListener("touchmove", (e) => {
  if (!currentSwipe) return;
  const diffX = e.touches[0].clientX - startX;
  if (diffX < -50) {
    currentSwipe.classList.add("open"); // reveal delete
  } else if (diffX > 50) {
    currentSwipe.classList.remove("open"); // close swipe
  }
});

document.addEventListener("touchend", () => {
  currentSwipe = null;
});

// --- About Modal Logic (fixed IDs) ---
const helpBtn = document.getElementById("help-btn");
const aboutModal = document.getElementById("about-modal");
const aboutCloseBtn = aboutModal.querySelector(".close-btn");

helpBtn.addEventListener("click", () => {
  aboutModal.style.display = "block";
});

aboutCloseBtn.addEventListener("click", () => {
  aboutModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === aboutModal) {
    aboutModal.style.display = "none";
  }
});

