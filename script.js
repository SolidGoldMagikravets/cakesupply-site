document.getElementById("calculate-btn").addEventListener("click", function() {
  let guests = parseInt(document.getElementById("guest-count").value);


  let cakeOptions = [
  { name: '6" cake', servings: 10, type: 'round', size: 6 },
  { name: '8" cake', servings: 18, type: 'round', size: 8 },
  { name: '10" cake', servings: 32, type: 'round', size: 10 },
  { name: '12" cake', servings: 47, type: 'round', size: 12 },
  { name: '14" cake', servings: 70, type: 'round', size: 14 },

  { name: '1/4 sheet cake', servings: 24, type: 'sheet' },
  { name: '1/2 sheet cake', servings: 36, type: 'sheet' },
  { name: 'full sheet cake', servings: 72, type: 'sheet' }
];

let tieredOptions = [
  { tiers: [6, 8], servings: 28 },
  { tiers: [8, 10], servings: 50 },
  { tiers: [6, 8, 10], servings: 60 },
  { tiers: [10, 12], servings: 79 },
  { tiers: [8, 10, 12], servings: 97 },
  { tiers: [6, 8, 10, 12], servings: 107 },
  { tiers: [10, 12, 14], servings: 149 },
  { tiers: [8, 10, 12, 14], servings: 167 },
  { tiers: [6, 8, 10, 12, 14], servings: 177}
];

const flavorPrices = {
  "Vanilla": 0,
  "Chocolate": 8,
  "Red Velvet": 12,
  "Lemon": 10
};

const fillingPrices = {
  "Vanilla Buttercream": 0,
  "Chocolate Ganache": 10,
  "Raspberry": 12,
  "Strawberry": 10,
  "Lemon Curd": 12,
  "Cream Cheese": 8
};

const baseCakePrices = {
  '6" cake': 55,
  '8" cake': 75,
  '10" cake': 110,
  '12" cake': 145,
  '14" cake': 190,

  '1/4 sheet cake': 85,
  '1/2 sheet cake': 130,
  'full sheet cake': 220
};

const tierBasePrices = {
  6: 55,
  8: 75,
  10: 110,
  12: 145,
  14: 190
};

function getBasePrice(recommendation) {
  if (recommendation.type === "single" || recommendation.type === "single-sheet") {
    return baseCakePrices[recommendation.name] || 0;
  }

  if (recommendation.type === "tiered") {
    const sizes = recommendation.name.match(/\d+/g).map(Number);
    return sizes.reduce((total, size) => total + (tierBasePrices[size] || 0), 0);
  }

  if (recommendation.type === "tiered-round-backup") {
    const sizes = recommendation.name.match(/\d+/g).map(Number);
    const backupSize = sizes[sizes.length - 1];
    const tierSizes = sizes.slice(0, -1);

    const tierPrice = tierSizes.reduce((total, size) => total + (tierBasePrices[size] || 0), 0);
    const backupPrice = baseCakePrices[`${backupSize}" cake`] || 0;

    return tierPrice + backupPrice;
  }

  if (recommendation.type === "sheet-combo") {
    const roundMatch = recommendation.name.match(/\d+/);
    const roundSize = roundMatch ? parseInt(roundMatch[0]) : null;

    let sheetName = "";
    if (recommendation.name.includes("1/4")) sheetName = "1/4 sheet cake";
    else if (recommendation.name.includes("1/2")) sheetName = "1/2 sheet cake";
    else sheetName = "full sheet cake";

    const roundPrice = roundSize ? (baseCakePrices[`${roundSize}" cake`] || 0) : 0;
    const sheetPrice = baseCakePrices[sheetName] || 0;

    return roundPrice + sheetPrice;
  }

  return 0;
}

function calculateCustomizationPrice(selections) {
  let total = 0;

  selections.forEach(selection => {
    total += flavorPrices[selection.flavor] || 0;
    total += fillingPrices[selection.filling] || 0;
  });

  return total;
}

function buildOrderSummaryText(recommendation, selections, totalPrice) {
  let lines = [];
  lines.push(`Cake Order Summary`);
  lines.push(``);
  lines.push(`Cake Option: ${recommendation.name}`);
  lines.push(`Servings: ${recommendation.servings}`);
  lines.push(``);

  selections.forEach((selection, index) => {
    lines.push(
      `${selection.label}: Flavor - ${selection.flavor || "-"}, Filling - ${selection.filling || "-"}`
    );
  });

  lines.push(``);
  lines.push(`Total Price: $${totalPrice}`);

  return lines.join("\n");
}

let recommendations = [];

// SINGLE CAKES
for (let i = 0; i < cakeOptions.length; i++) {
  let cake = cakeOptions[i];

  if (cake.type !== "round") continue;
  if (cake.servings < guests) continue;

  let excess = cake.servings - guests;

  recommendations.push({
  name: cake.name,
  servings: cake.servings,
  type: "single",
  score: excess - 7
});
}

// SINGLE SHEET CAKES
for (let i = 0; i < cakeOptions.length; i++) {
  let cake = cakeOptions[i];

  if (cake.type !== "sheet") continue;
  if (cake.servings < guests) continue;

  let excess = cake.servings - guests;

  recommendations.push({
    name: cake.name,
    servings: cake.servings,
    type: "single-sheet",
    score: excess + 5
  });
}

// TIERED CAKES
for (let i = 0; i < tieredOptions.length; i++) {
  let tier = tieredOptions[i];

  if (tier.servings < guests) continue;

  let excess = tier.servings - guests;
  let tierCount = tier.tiers.length;
  let smallestTier = Math.min(...tier.tiers);

  if (guests < 60 && tierCount > 2) {
    excess += 2;
  }

  if (guests > 40 && smallestTier < 8) {
  if (smallestTier === 6) {
    excess += 0;
  } else {
    excess += 10;
  }
}

  let tierNames = tier.tiers
    .slice()
    .sort((a, b) => a - b)
    .map(size => `${size}"`)
    .join(' + ');

  recommendations.push({
    name: `${tierNames} tiered cake`,
    servings: tier.servings,
    type: "tiered",
    score: excess
  });
}
// TIERED + ROUND BACKUP
for (let i = 0; i < tieredOptions.length; i++) {
  let tier = tieredOptions[i];
  let tierCount = tier.tiers.length;
  let smallestTier = Math.min(...tier.tiers);

  // keep your aesthetic rules
  if (guests < 60 && tierCount > 2) continue;
  if (guests > 40 && smallestTier < 8 && smallestTier !== 6) continue;

  for (let j = 0; j < cakeOptions.length; j++) {
  let backupCake = cakeOptions[j];

  if (backupCake.type !== "round") continue;

  let totalServings = tier.servings + backupCake.servings;
  if (totalServings < guests) continue;

  let excess = totalServings - guests;
let score = excess;

// discourage tiered + backup for small events
if (guests <= 35) {
  score += 20;
}

// prefer a 6" top tier
if (tier.tiers.includes(6)) {
  score -= 3;
}

// prefer fuller / taller display cakes
if (tierCount === 3) {
  score -= 2;
}

// prefer smaller kitchen backup cakes
if (backupCake.size <= 8) {
  score -= 2;
} else if (backupCake.size >= 12) {
  score += 2;
}

let tierNames = tier.tiers
  .slice()
  .sort((a, b) => a - b)
  .map(size => `${size}"`)
  .join(' + ');

recommendations.push({
  name: `${tierNames} tiered cake + ${backupCake.name}`,
  servings: totalServings,
  type: "tiered-round-backup",
  score: score
});
}
}
// ROUND + SHEET COMBINATIONS
for (let i = 0; i < cakeOptions.length; i++) {
  let cakeA = cakeOptions[i];
  if (cakeA.type !== "round") continue;

  // bigger events should not feature tiny main cakes
  if (guests > 50 && cakeA.size < 10) continue;
  if (guests > 70 && cakeA.size < 12) continue;

  for (let j = 0; j < cakeOptions.length; j++) {
    let cakeB = cakeOptions[j];
    if (cakeB.type !== "sheet") continue;

    let totalServings = cakeA.servings + cakeB.servings;
    if (totalServings < guests) continue;

    let excess = totalServings - guests;

    recommendations.push({
      name: `${cakeA.name} + ${cakeB.name}`,
      servings: totalServings,
      type: "sheet-combo",
      score: excess + 35
    });
  }
}

// SORT BEST TO WORST
recommendations.sort((a, b) => a.score - b.score);

// REMOVE DUPLICATES
let uniqueRecommendations = [];
let seenKeys = [];
let seenTypes = [];

for (let i = 0; i < recommendations.length; i++) {
  let rec = recommendations[i];
  let key = rec.name;

  if (rec.type === "tiered") {
    key = rec.name
      .replace(" tiered cake", "")
      .replace(/"/g, "")
      .split(" + ")
      .map(Number)
      .sort((a, b) => a - b)
      .join("-");
  } else if (rec.type === "tiered-round-backup") {
    key = rec.name
      .replace(" tiered cake + ", " + ")
      .replace(/"/g, "")
      .split(" + ")
      .map(part => parseInt(part))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b)
      .join("-");
  }

  if (seenKeys.includes(key)) continue;

  // allow only one of each type in the first pass
  if (seenTypes.includes(rec.type) && uniqueRecommendations.length < 3) continue;

  uniqueRecommendations.push(rec);
  seenKeys.push(key);
  seenTypes.push(rec.type);

  if (uniqueRecommendations.length === 3) break;
}

// VISUAL
let visualsContainer = document.getElementById("cake-visuals");
visualsContainer.innerHTML = "";

let topVisuals = uniqueRecommendations.slice(0, 3);

topVisuals.forEach((recommendation, index) => {
  let card = document.createElement("div");
  card.classList.add("visual-card");

  let label = document.createElement("div");
  label.classList.add("visual-label");

  label.innerHTML = `
  <strong>Option ${index + 1}</strong>
  <div class="servings">Serves ${recommendation.servings}</div>
  <div class="cake-name">${recommendation.name}</div>
`;

  card.appendChild(label);

  // TIERED CAKES
  if (recommendation.type === "tiered") {
    let matchedTier = tieredOptions.find(option => {
      let optionName = option.tiers
        .slice()
        .sort((a, b) => a - b)
        .map(size => `${size}"`)
        .join(' + ') + " tiered cake";

      return optionName === recommendation.name;
    });

    if (matchedTier) {
      let tieredVisual = document.createElement("div");
      tieredVisual.classList.add("tiered-visual");

      let tiers = matchedTier.tiers.slice().sort((a, b) => a - b);

      tiers.forEach((size, index) => {
        let tierDiv = document.createElement("div");
tierDiv.classList.add("tier");
tierDiv.style.setProperty("--i", index);
tierDiv.style.width = size * 20 + "px";

// filling stripe
let fillingTop = document.createElement("div");
fillingTop.classList.add("filling-line", "filling-top");

let fillingBottom = document.createElement("div");
fillingBottom.classList.add("filling-line", "filling-bottom");

let tierLabel = document.createElement("span");
tierLabel.textContent = `${size}"`;

tierDiv.appendChild(fillingTop);
tierDiv.appendChild(fillingBottom);
tierDiv.appendChild(tierLabel);

        tieredVisual.appendChild(tierDiv);
      });

      card.appendChild(tieredVisual);
    }
  }


  // SINGLE CAKES
  else if (recommendation.type === "single") {
    let singleVisual = document.createElement("div");
    singleVisual.classList.add("single-visual");

    let sizeMatch = recommendation.name.match(/\d+/);
    if (sizeMatch) {
      let size = parseInt(sizeMatch[0]);

      let tierDiv = document.createElement("div");
tierDiv.classList.add("tier");
tierDiv.style.width = size * 20 + "px";

// filling stripe
let fillingTop = document.createElement("div");
fillingTop.classList.add("filling-line", "filling-top");

let fillingBottom = document.createElement("div");
fillingBottom.classList.add("filling-line", "filling-bottom");

let tierLabel = document.createElement("span");
tierLabel.textContent = `${size}"`;

tierDiv.appendChild(fillingTop);
tierDiv.appendChild(fillingBottom);
tierDiv.appendChild(tierLabel);

      singleVisual.appendChild(tierDiv);
    }

    card.appendChild(singleVisual);
  }
  // TIERED + ROUND
  else if (recommendation.type === "tiered-round-backup") {
    let comboVisual = document.createElement("div");
    comboVisual.classList.add("combo-visual");

    let tieredPart = document.createElement("div");
    tieredPart.classList.add("tiered-visual");

    let allSizes = recommendation.name.match(/\d+/g).map(Number);
    let tierCount = recommendation.name.includes('tiered cake +') ? allSizes.length - 1 : allSizes.length;

  let tierSizes = allSizes.slice(0, tierCount).sort((a, b) => a - b);
  let backupSize = allSizes[allSizes.length - 1];

  tierSizes.forEach((size, index) => {
  let tierDiv = document.createElement("div");
  tierDiv.classList.add("tier");
  tierDiv.style.setProperty("--i", index);
  tierDiv.style.width = size * 20 + "px";

// filling stripe
let fillingTop = document.createElement("div");
fillingTop.classList.add("filling-line", "filling-top");

let fillingBottom = document.createElement("div");
fillingBottom.classList.add("filling-line", "filling-bottom");

let tierLabel = document.createElement("span");
tierLabel.textContent = `${size}"`;

tierDiv.appendChild(fillingTop);
tierDiv.appendChild(fillingBottom);
tierDiv.appendChild(tierLabel);
    tieredPart.appendChild(tierDiv);
  });

let backupDiv = document.createElement("div");
backupDiv.classList.add("tier");
backupDiv.style.width = backupSize * 20 + "px";

// filling stripe
let fillingTop = document.createElement("div");
fillingTop.classList.add("filling-line", "filling-top");

let fillingBottom = document.createElement("div");
fillingBottom.classList.add("filling-line", "filling-bottom");

let backupLabel = document.createElement("span");
backupLabel.textContent = `${backupSize}"`;

backupDiv.appendChild(fillingTop);
backupDiv.appendChild(fillingBottom);
backupDiv.appendChild(backupLabel);

  comboVisual.appendChild(tieredPart);
  comboVisual.appendChild(backupDiv);

  card.appendChild(comboVisual);
}
  // ROUND + SHEET COMBOS
  else if (recommendation.type === "sheet-combo") {
    let comboVisual = document.createElement("div");
    comboVisual.classList.add("combo-visual");

    let roundMatch = recommendation.name.match(/\d+/);
    if (roundMatch) {
      let roundSize = parseInt(roundMatch[0]);

      let roundDiv = document.createElement("div");
      roundDiv.classList.add("tier");
      roundDiv.style.width = roundSize * 20 + "px";
      roundDiv.textContent = `${roundSize}"`;

      comboVisual.appendChild(roundDiv);
    }

    let sheetDiv = document.createElement("div");
    sheetDiv.classList.add("sheet");
    sheetDiv.textContent = "sheet";

    if (recommendation.name.includes("1/4")) {
      sheetDiv.style.width = "120px";
    } else if (recommendation.name.includes("1/2")) {
      sheetDiv.style.width = "160px";
    } else {
      sheetDiv.style.width = "220px";
    }

    comboVisual.appendChild(sheetDiv);
    card.appendChild(comboVisual);
  }

  visualsContainer.appendChild(card);

//Customize Button
  let customizeBtn = document.createElement("button");
customizeBtn.textContent = "Customize";
customizeBtn.classList.add("customize-btn");

customizeBtn.addEventListener("click", () => {
  let visualHTML = "";

  if (card.querySelector(".combo-visual")) {
  visualHTML = card.querySelector(".combo-visual").outerHTML;
} else if (card.querySelector(".tiered-visual")) {
  visualHTML = card.querySelector(".tiered-visual").outerHTML;
} else if (card.querySelector(".single-visual")) {
  visualHTML = card.querySelector(".single-visual").outerHTML;
}

  showCustomizer(recommendation, visualHTML);
});

card.appendChild(customizeBtn);
});

function showCustomizer(recommendation, visualHTML) {
  document.getElementById("calculator-ui").style.display = "none";
  document.getElementById("cake-visuals").style.display = "none";
  document.getElementById("customizer").style.display = "block";

  const customizer = document.getElementById("customizer");

  customizer.innerHTML = `
  <div id="customizer-layout">

    <div id="customizer-left-wrap">
  <button id="back-btn" class="back-btn">&larr; Back</button>

  <div id="customizer-left" class="customizer-panel">
    <h3>Order</h3>
    <div id="order-summary">
  <div id="order-sections"></div>
  <p><strong>Total Servings: ${recommendation.servings}</strong></p>
  <p><strong>Base Price: $<span id="price-total">${getBasePrice(recommendation)}</span></strong></p>
</div>
  </div>
</div>

    <div id="customizer-center">
      <div id="customizer-visual">${visualHTML}</div>
    </div>

    <div id="customizer-right">
      <div class="customizer-panel">
        <h3>Customize Tier</h3>

        <label for="tier-flavor">Flavor</label>
        <select id="tier-flavor">
          <option value="">Select flavor</option>
          <option>Vanilla</option>
          <option>Chocolate</option>
          <option>Red Velvet</option>
          <option>Lemon</option>
        </select>

        <label for="filling">Filling</label>
        <select id="filling">
          <option value="">Select filling</option>
          <option>Vanilla Buttercream</option>
          <option>Chocolate Ganache</option>
          <option>Raspberry</option>
          <option>Strawberry</option>
          <option>Lemon Curd</option>
          <option>Cream Cheese</option>
        </select>
      </div>
    </div>

  </div>
`;

document.getElementById("back-btn").addEventListener("click", goBack);

const fillingSelect = document.getElementById("filling");
const tierLabels = document.querySelectorAll("#customizer-visual .tiered-visual .tier span");
const orderSections = document.getElementById("order-sections");

// create ONE section (tiered cake)
const section = document.createElement("div");

const isCombo = recommendation.type === "tiered-round-backup"; // 👈 ADD THIS

section.classList.add("order-section");

section.innerHTML = `
  <div class="flavor-list"></div>
`;

orderSections.appendChild(section);

let backupSection = null;

if (isCombo) {
  backupSection = document.createElement("div");
  backupSection.classList.add("order-section");

  backupSection.innerHTML = `
    <div class="backup-list"></div>
  `;

  orderSections.appendChild(backupSection);
}

if (isCombo && backupSection) {
  const backupList = backupSection.querySelector(".backup-list");

  const sizes = recommendation.name.match(/\d+/g).map(Number);

  const backupSize = sizes[sizes.length - 1];

 const backupRow = document.createElement("div");
backupRow.classList.add("tier-summary");
backupRow.dataset.index = tierLabels.length;

backupRow.innerHTML = `
  <p><strong data-type=" - backup">${backupSize}"</strong></p>
  <p>Flavor: <span class="backup-flavor-value">-</span></p>
  <p>Filling: <span class="backup-filling-value">-</span></p>
`;

backupRow.addEventListener("click", () => tierDivs[tierLabels.length].click());

backupList.appendChild(backupRow);
}

const flavorListContainer = section.querySelector(".flavor-list");

tierLabels.forEach((label, index) => {
  const tierRow = document.createElement("div");
  tierRow.classList.add("tier-summary");
  tierRow.dataset.index = index;

  tierRow.innerHTML = `
    <p><strong data-type=" - tier">${label.textContent}</strong></p>
    <p>Flavor: <span class="tier-flavor-value">-</span></p>
    <p>Filling: <span class="tier-filling-value">-</span></p>
  `;

  tierRow.addEventListener("click", () => tierDivs[index].click());

  flavorListContainer.appendChild(tierRow);
});

const tierDivs = document.querySelectorAll("#customizer-visual .tier, #customizer-visual .combo-visual > .tier");
const flavorLines = document.querySelectorAll(".tier-flavor-value");
const backupFlavorLine = document.querySelector(".backup-flavor-value");
const fillingLines = document.querySelectorAll(".tier-filling-value");
const backupFillingLine = document.querySelector(".backup-filling-value");
const tierRows = document.querySelectorAll(".tier-summary");

let activeTierIndex = null;

const priceTotal = document.getElementById("price-total");

const selections = Array.from(tierRows).map(row => {
  const label = row.querySelector("strong").textContent.trim();
  return {
    label,
    flavor: "",
    filling: ""
  };
});

function updatePrice() {
  const base = getBasePrice(recommendation);
  const extras = calculateCustomizationPrice(selections);
  priceTotal.textContent = base + extras;
}

tierDivs.forEach((tier, index) => {
  tier.addEventListener("click", () => {
    activeTierIndex = index;

    tierDivs.forEach(t => t.classList.remove("active-tier"));
    tier.classList.add("active-tier");

    tierRows.forEach(row => row.classList.remove("active-tier-row"));

    const activeRow = document.querySelector(`.tier-summary[data-index="${index}"]`);
    if (activeRow) activeRow.classList.add("active-tier-row");

    const isBackupCake =
      isCombo && tier.parentElement.classList.contains("combo-visual");

    if (isBackupCake) {
      tierFlavorSelect.value = selections[index].flavor || "";
        fillingSelect.value = selections[index].filling || "";
    } else {
      tierFlavorSelect.value = selections[index].flavor || "";
        fillingSelect.value = selections[index].filling || "";
    }
  });
});

if (tierDivs.length > 0) {
  tierDivs[0].click();
}

const tierFlavorSelect = document.getElementById("tier-flavor");

tierFlavorSelect.addEventListener("change", function () {

  if (activeTierIndex === null) return;

  const selectedIndex = activeTierIndex;

  let color = "#f3ecd1";

  if (this.value === "Chocolate") color = "#996b5e";
  if (this.value === "Red Velvet") color = "#ad0b16";
  if (this.value === "Lemon") color = "#FCEB8C";

  tierDivs[selectedIndex].style.setProperty("--cake-color", color);
  tierDivs[selectedIndex].style.setProperty("--cake-border", "rgba(0,0,0,0.15)");

const price = flavorPrices[this.value] || 0;

const label = this.value
  ? price > 0
    ? `${this.value} <span class="price-inline">+$${price}</span>`
    : this.value
  : "-";

if (isCombo && tierDivs[selectedIndex].parentElement.classList.contains("combo-visual")) {  
  backupFlavorLine.innerHTML = label;
  selections[selectedIndex].flavor = this.value || "";
} else {
  flavorLines[selectedIndex].innerHTML = label;
  selections[selectedIndex].flavor = this.value || "";
}

updatePrice();
});


fillingSelect.addEventListener("change", function () {
  if (activeTierIndex === null) return;

const price = fillingPrices[this.value] || 0;

const label = this.value
  ? price > 0
    ? `${this.value} <span class="price-inline">+$${price}</span>`
    : this.value
  : "-";

if (isCombo && tierDivs[activeTierIndex].parentElement.classList.contains("combo-visual")) {    
  backupFillingLine.innerHTML = label;
  selections[activeTierIndex].filling = this.value || "";
} else {
  fillingLines[activeTierIndex].innerHTML = label;
  selections[activeTierIndex].filling = this.value || "";
}

updatePrice();

  let fillingColor = "#fffaf0"; // default

  if (this.value === "Chocolate Ganache") fillingColor = "#5a3a2e";
  if (this.value === "Raspberry") fillingColor = "#d85c7a";
  if (this.value === "Strawberry") fillingColor = "#f29cab";
  if (this.value === "Lemon Curd") fillingColor = "#f7db4f";
  if (this.value === "Cream Cheese") fillingColor = "#f4f1e8";
  if (this.value === "Vanilla Buttercream") fillingColor = "#fff6d9";

  const fillingParts = tierDivs[activeTierIndex].querySelectorAll(".filling-line");
  fillingParts.forEach(part => {
    part.style.background = fillingColor;
  });
});

}

function goBack() {
  document.getElementById("calculator-ui").style.display = "block";
  document.getElementById("cake-visuals").style.display = "flex";
  document.getElementById("customizer").style.display = "none";
}
});