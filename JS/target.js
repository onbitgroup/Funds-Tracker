// target.js (Local Storage version)

// Elements
const targetListEl = document.getElementById("target-list");
const targetInputEl = document.getElementById("target-input");
const setTargetBtn = document.getElementById("set-target-btn");

// --- Local Storage Helpers ---
function saveTargets(targets) {
  localStorage.setItem("targets", JSON.stringify(targets));
}

function loadTargetsFromStorage() {
  return JSON.parse(localStorage.getItem("targets")) || [];
}

// Load all targets
function loadTargetGoals() {
  const targets = loadTargetsFromStorage();
  targetListEl.innerHTML = "";

  if (targets.length > 0) {
    targets.forEach(target => renderTarget(target));
  } else {
    targetListEl.innerHTML = `<p>No targets set yet. Add one below 👇</p>`;
  }

  if (typeof currentTotal !== "undefined") {
    updateAllProgressBars(currentTotal);
  }
}

// Render target
function renderTarget(target) {
  const wrapper = document.createElement("div");
  wrapper.className = "target-item";
  wrapper.dataset.id = target.id;

  wrapper.innerHTML = `
    <div class="target-header">
      <span><strong>${target.name}</strong> — ${parseFloat(target.amount).toLocaleString()} /=</span>
      <button class="remove-target-btn" data-id="${target.id}">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
    <div class="progress-container">
      <div class="progress-bar" id="progress-${target.id}" style="width:0%"></div>
    </div>
    <div class="progress-text" id="progress-text-${target.id}"></div>
  `;

  targetListEl.appendChild(wrapper);
}

// Add new target
function setTargetGoal() {
  const newTarget = parseFloat(targetInputEl.value);
  const productName = prompt("Enter product name for this target:");

  if (!newTarget || newTarget <= 0 || !productName) {
    return alert("Please enter a valid product name and amount.");
  }

  const newTargetObj = {
    id: Date.now(),
    name: productName,
    amount: newTarget
  };

  let targets = loadTargetsFromStorage();
  targets.push(newTargetObj);
  saveTargets(targets);

  renderTarget(newTargetObj);
  updateProgressBar(newTargetObj, currentTotal);

  targetInputEl.value = "";
}

// Remove target
function removeTargetGoal(targetId) {
  if (!confirm("Are you sure you want to remove this target?")) return;

  let targets = loadTargetsFromStorage();
  targets = targets.filter(t => t.id != targetId);
  saveTargets(targets);

  const el = document.querySelector(`.target-item[data-id="${targetId}"]`);
  if (el) el.remove();
}

// Update one target
function updateProgressBar(target, total) {
  const goal = parseFloat(target.amount);
  const percentage = Math.min((total / goal) * 100, 100);
  const remaining = goal - total > 0 ? goal - total : 0;

  const progressEl = document.getElementById(`progress-${target.id}`);
  const progressTextEl = document.getElementById(`progress-text-${target.id}`);
  const targetBox = document.querySelector(`.target-item[data-id="${target.id}"]`);

  if (progressEl && progressTextEl) {
    progressEl.style.width = `${percentage}%`;
    progressTextEl.innerHTML = `
      ${percentage.toFixed(1)}% achieved (${total.toFixed(2)} /= of ${goal.toLocaleString()} /=)
      <br>
      <span class="remaining-text">Remaining: ${remaining.toFixed(2)} /=</span>
    `;

    // ✅ Turn box green if completed
    if (percentage >= 100) {
      targetBox.classList.add("target-complete");
    } else {
      targetBox.classList.remove("target-complete");
    }
  }
}

// Update all targets
function updateAllProgressBars(total) {
  const targets = loadTargetsFromStorage();
  targets.forEach(target => updateProgressBar(target, total));
}

// --- Event Listeners ---
setTargetBtn.addEventListener("click", setTargetGoal);

// ✅ Fix: use closest() so clicks on <i> inside the button still work
document.addEventListener("click", (e) => {
  const removeBtn = e.target.closest(".remove-target-btn");
  if (removeBtn) {
    const targetId = removeBtn.dataset.id;
    removeTargetGoal(targetId);
  }
});

document.addEventListener("DOMContentLoaded", loadTargetGoals);

// Dropdown toggle
const toggleTargetsBtn = document.getElementById("toggle-targets");
const targetsSection = document.getElementById("targets-section");

toggleTargetsBtn.addEventListener("click", () => {
  toggleTargetsBtn.classList.toggle("active");
  targetsSection.classList.toggle("open");
});
