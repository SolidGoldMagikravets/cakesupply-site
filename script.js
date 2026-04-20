import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const cakeModel = document.getElementById("cake-model");

let cake3DMaterials = {
  cake: null,
  frosting: null,
  filling: null
};

if (cakeModel) {
  cakeModel.addEventListener("load", () => {
    console.log("3D cake loaded!");

    console.log("Materials:");
    cakeModel.model.materials.forEach((mat, index) => {
      console.log(index, mat.name);

      if (mat.name === "cake_mat") cake3DMaterials.cake = mat;
      if (mat.name === "frosting_mat") cake3DMaterials.frosting = mat;
      if (mat.name === "filling_mat") cake3DMaterials.filling = mat;
    });

    if (cake3DMaterials.frosting) {
      cake3DMaterials.frosting.pbrMetallicRoughness.setBaseColorFactor([1, 0.6, 0.7, 1]);
    }
  });
}

const modelMap = {};

function getCustomizerVisualHTML(recommendation) {
  const modelSrc = modelMap[recommendation.name];

  // TIERED + ROUND BACKUP
  if (recommendation.type === "tiered-round-backup") {
    let allSizes = recommendation.name.match(/\d+/g).map(Number);
    let tierSizes = allSizes.slice(0, -1).sort((a, b) => a - b);
    let backupSize = allSizes[allSizes.length - 1];

    let tieredName = `${tierSizes.map(size => `${size}"`).join(' + ')} tiered cake`;
    let backupName = `${backupSize}" cake`;

    let tieredSrc = modelMap[tieredName];
    let backupSrc = modelMap[backupName];

    let html = `<div class="combo-visual combo-3d">`;

    if (tieredSrc) {
      html += `
        <model-viewer
          class="option-cake-3d main-cake-3d"
          src="${tieredSrc}"
          alt="${tieredName}"
          camera-controls
          auto-rotate
          disable-zoom>
        </model-viewer>
      `;
    }

    if (backupSrc) {
      html += `
        <model-viewer
          class="option-cake-3d backup-cake-3d"
          src="${backupSrc}"
          alt="${backupName}"
          camera-controls
          auto-rotate
          disable-zoom>
        </model-viewer>
      `;
    }

    html += `</div>`;
    return html;
  }

  // single or tiered model
  if (modelSrc) {
    return `
      <model-viewer
        class="option-cake-3d"
        src="${modelSrc}"
        alt="${recommendation.name}"
        camera-controls
        auto-rotate
        disable-zoom>
      </model-viewer>
    `;
  }

  return `<div class="single-visual"><div class="tier">Preview unavailable</div></div>`;
}

function getRecommendationParts(recommendation) {
  const sizes = (recommendation.name.match(/\d+/g) || []).map(Number);

  if (recommendation.type === "single") {
    return [
      {
        kind: "main",
        size: sizes[0],
        label: `${sizes[0]}" Round`
      }
    ];
  }

  if (recommendation.type === "tiered") {
    return sizes.map(size => ({
      kind: "main",
      size,
      label: `${size}" Round`
    }));
  }

  if (recommendation.type === "tiered-round-backup") {
    const tierSizes = sizes.slice(0, -1);
    const backupSize = sizes[sizes.length - 1];

    return [
      ...tierSizes.map(size => ({
        kind: "main",
        size,
        label: `${size}" Round`
      })),
      {
        kind: "backup",
        size: backupSize,
        label: `${backupSize}" Backup`
      }
    ];
  }

  if (recommendation.type === "sheet-combo") {
    const roundSize = sizes[0];

    return [
      {
        kind: "main",
        size: roundSize,
        label: `${roundSize}" Round`
      },
      {
        kind: "backup",
        size: null,
        label: "Sheet Backup"
      }
    ];
  }

  return [];
}

function makeOptionModelViewer(src, altText) {
  const viewer = document.createElement("model-viewer");
  viewer.classList.add("option-cake-3d");
  viewer.setAttribute("src", src);
  viewer.setAttribute("alt", altText);
  viewer.setAttribute("camera-controls", "");
  viewer.setAttribute("auto-rotate", "");
  viewer.setAttribute("disable-zoom", "");
  return viewer;
}

let scene, camera, renderer, loader;
let cakeObjects = [];

function initCakeBuilder3D(recommendation) {
  const container = document.getElementById("cake-builder-3d");

  container.innerHTML = "";

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f8f8);

  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / 400,
    0.1,
    100
  );

  camera.position.set(0, 0.6, 2.2);
  camera.lookAt(0, 0.4, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, 400);
  container.appendChild(renderer.domElement);

  loader = new GLTFLoader();

  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(3, 5, 3);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambient);

  const sizes = getRecommendationSizes(recommendation);

  buildCake3D(sizes);

  animate();
}

function getRecommendationSizes(recommendation) {
  return (recommendation.name.match(/\d+/g) || [])
    .map(Number)
    .sort((a, b) => b - a);
}

async function buildCake3D(sizes) {
  let currentHeight = 0;

  for (let size of sizes) {
    const gltf = await new Promise((resolve) => {
      loader.load(`models/tier_${size}.glb`, resolve);
    });

    const tier = gltf.scene;

    const box = new THREE.Box3().setFromObject(tier);
    const height = box.max.y - box.min.y;

    tier.position.y = currentHeight;

    scene.add(tier);
    cakeObjects.push(tier);

    currentHeight += height;
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function initRecommendationCake3D(container, recommendation) {
  container.innerHTML = "";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f8f8);

  const width = container.clientWidth || 340;
const height = container.clientHeight || 400;

const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 2.2);
  light.position.set(3, 5, 3);
  scene.add(light);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.1);
  fillLight.position.set(-3, 3, 3);
  scene.add(fillLight);

  const ambient = new THREE.AmbientLight(0xffffff, 1.35);
  scene.add(ambient);

  const allSizes = (recommendation.name.match(/\d+/g) || []).map(Number);

  let mainSizes = allSizes.slice().sort((a, b) => b - a);
  let backupSize = null;

  if (recommendation.type === "tiered-round-backup") {
    mainSizes = allSizes.slice(0, -1).sort((a, b) => b - a);
    backupSize = allSizes[allSizes.length - 1];
  }

  buildRecommendationCake3D(scene, mainSizes, backupSize).then((group) => {
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const padding = 1.24;

    const fov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = width / height;

    const fitHeightDistance = (size.y * padding) / (2 * Math.tan(fov / 2));

    const fitWidthDistance =
      (size.x * padding) / (2 * Math.tan(fov / 2) * aspect);

    const distance = Math.max(fitHeightDistance, fitWidthDistance, 1.2);

    camera.position.set(center.x, center.y + size.y * 0.16, center.z + distance);
    camera.lookAt(center.x, center.y - size.y * 0.02, center.z);
  });

  function animateCard() {
    requestAnimationFrame(animateCard);
    renderer.render(scene, camera);
  }

  animateCard();
}

async function buildRecommendationCake3D(scene, mainSizes, backupSize = null) {
  const localLoader = new GLTFLoader();

  const group = new THREE.Group();
  scene.add(group);

  let currentHeight = 0;
  let maxMainRadius = 0;

  for (let sizeValue of mainSizes) {
    const gltf = await new Promise((resolve, reject) => {
      localLoader.load(`models/tier_${sizeValue}.glb`, resolve, undefined, reject);
    });

    const tier = gltf.scene;

    tier.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.roughness = 0.6;
        child.material.metalness = 0.0;
      }
    });

    const box = new THREE.Box3().setFromObject(tier);
    const height = box.max.y - box.min.y;
    const width = box.max.x - box.min.x;

    const radius = width / 2;
    if (radius > maxMainRadius) maxMainRadius = radius;

    tier.position.set(0, currentHeight, 0);
    group.add(tier);

    currentHeight += height;
  }

  if (backupSize) {
    const backupGltf = await new Promise((resolve, reject) => {
      localLoader.load(`models/tier_${backupSize}.glb`, resolve, undefined, reject);
    });

    const backupTier = backupGltf.scene;

    backupTier.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.roughness = 0.6;
        child.material.metalness = 0.0;
      }
    });

    const backupBox = new THREE.Box3().setFromObject(backupTier);
    const backupWidth = backupBox.max.x - backupBox.min.x;
    const backupRadius = backupWidth / 2;

    const sideOffset = maxMainRadius + backupRadius + 0.06;
    backupTier.position.set(sideOffset, 0, 0);
    group.add(backupTier);
  }

  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);

  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;

  return group;
}

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
  "Red Velvet": 10,
  "Lemon": 8
};

const fillingPrices = {
  "Vanilla Buttercream": 0,
  "Chocolate Ganache": 5,
  "Raspberry": 5,
  "Strawberry": 3,
  "Lemon Curd": 7,
  "Cream Cheese": 8
};

const frostingPrices = {
  "Vanilla Buttercream": 0,
  "Strawberry Cream Cheese": 0,
  "Chocolate Buttercream": 0,
  "Cream Cheese": 5
};

const signatureFlavors = {
  "original-vanilla": {
    cake: "Vanilla",
    frosting: "Vanilla Buttercream",
    filling: "Vanilla Custard"
  },
  "passionberry": {
    cake: "Vanilla",
    frosting: "Raspberry Buttercream",
    filling: "Passionfruit Curd"
  },
  "blueberry-cheesecake": {
    cake: "Vanilla",
    frosting: "Cream Cheese",
    filling: "Blueberry Puree"
  },
  "cinnamon-roll": {
    cake: "Vanilla",
    frosting: "Cream Cheese",
    filling: "Cinnamon Brown Butter Ganache"
  },
  "london-fog": {
    cake: "Vanilla",
    frosting: "Cream Cheese",
    filling: "Orange Marmalade"
  },
  "strawberry-shortcake": {
    cake: "Vanilla",
    frosting: "Cream Cheese",
    filling: "Strawberry Puree"
  },
  "strawberry-key-lime": {
    cake: "Vanilla",
    frosting: "Strawberry Cream Cheese",
    filling: "Key Lime Curd"
  },
  "white-chocolate-raspberry": {
    cake: "Vanilla",
    frosting: "White Chocolate Ganache",
    filling: "Raspberry Puree"
  },
  "pancake": {
    cake: "Vanilla",
    frosting: "White Chocolate Ganache",
    filling: "Vanilla Custard"
  },

  "zebra": {
    cake: "Marble",
    frosting: "Raspberry Buttercream",
    filling: "Blackberry Puree"
  },
  "red-velvet": {
    cake: "Marble",
    frosting: "White Chocolate Ganache",
    filling: ""
  },

  "original-chocolate": {
    cake: "Chocolate",
    frosting: "Chocolate Mousse",
    filling: ""
  },
  "tuxedo": {
    cake: "Chocolate",
    frosting: "Chocolate Mousse",
    filling: "White Chocolate Ganache"
  },
  "raspberry-chocolate-mousse": {
    cake: "Chocolate",
    frosting: "Chocolate Mousse",
    filling: "Raspberry Puree"
  },
  "cookies-and-cream": {
    cake: "Chocolate",
    frosting: "Oreo Buttercream",
    filling: ""
  },
  "black-forrest": {
    cake: "Chocolate",
    frosting: "Chocolate Buttercream",
    filling: "Mixed Berry Jam"
  },
  "mocha": {
    cake: "Chocolate",
    frosting: "Coffee Buttercream",
    filling: "Dulce De Leche"
  },

  "lemon-blueberry": {
    cake: "Lemon",
    frosting: "Lemon Buttercream",
    filling: "Blueberry Puree"
  },

  "carrot": {
    cake: "Spice",
    frosting: "Cream Cheese",
    filling: ""
  },
  "apple-cider": {
    cake: "Spice",
    frosting: "Cinnamon Honey Buttercream",
    filling: "Apple Pie Filling"
  },
  "horchata": {
    cake: "Spice",
    frosting: "Horchata Buttercream",
    filling: "Dulce De Leche"
  },
  "cranberry-orange": {
    cake: "Spice",
    frosting: "Cranberry Buttercream",
    filling: "Orange Marmalade"
  },

  "coconut-cream": {
    cake: "Coconut",
    frosting: "Coconut Cream Buttercream",
    filling: "Vanilla Custard"
  },
  "key-lime-coconut": {
    cake: "Coconut",
    frosting: "White Chocolate Ganache",
    filling: "Key Lime Curd"
  },

  "almond-joy": {
    cake: "Almond",
    frosting: "Coconut Cream Buttercream",
    filling: "Chocolate Mousse"
  },
  "bee-sting": {
    cake: "Almond",
    frosting: "Cinnamon Honey Buttercream",
    filling: "Vanilla Custard"
  }
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
    total += frostingPrices[selection.frosting] || 0;
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

  const preview3D = document.createElement("div");
preview3D.classList.add("recommendation-cake-3d");

if (recommendation.type === "tiered-round-backup") {
  preview3D.classList.add("recommendation-cake-3d-wide");
}

card.appendChild(preview3D);

  initRecommendationCake3D(preview3D, recommendation);

  let customizeBtn = document.createElement("button");
  customizeBtn.textContent = "Customize";
  customizeBtn.classList.add("customize-btn");

  customizeBtn.addEventListener("click", () => {
    showCustomizer(recommendation);
  });

  card.appendChild(customizeBtn);
  visualsContainer.appendChild(card);
});

function showCustomizer(recommendation) {
  document.getElementById("calculator-ui").style.display = "none";
  document.getElementById("cake-visuals").style.display = "none";
  document.getElementById("customizer").style.display = "block";

  const customizer = document.getElementById("customizer");
  const visualHTML = getCustomizerVisualHTML(recommendation);

console.log("recommendation:", recommendation);
console.log("visualHTML:", visualHTML);

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
      <div id="cake-builder-3d"></div>
    </div>

    <div id="customizer-right">
  <div class="customizer-panel">
    <h3>Customize Tier</h3>

    <label for="signature-flavor">Signature Flavor</label>
<select id="signature-flavor">
  <option value="">Select signature flavor</option>

  <optgroup label="Vanilla-Base">
  <option value="original-vanilla">Original Vanilla</option>
  <option value="blueberry-cheesecake">Blueberry Cheesecake</option>
  <option value="cinnamon-roll">Cinnamon Roll</option>
  <option value="london-fog">London Fog</option>
  <option value="pancake">Pancake</option>
  <option value="passionberry">PassionBerry</option>
  <option value="strawberry-key-lime">Strawberry Key Lime</option>
  <option value="strawberry-shortcake">Strawberry Shortcake</option>
  <option value="white-chocolate-raspberry">White Chocolate Raspberry</option>
</optgroup>

  <optgroup label="Chocolate-Base">
  <option value="original-chocolate">Original Chocolate</option>
  <option value="black-forrest">Black Forrest</option>
  <option value="cookies-and-cream">Cookies and Cream</option>
  <option value="mocha">Mocha</option>
  <option value="raspberry-chocolate-mousse">Raspberry Chocolate Mousse</option>
  <option value="red-velvet">Red Velvet</option>
  <option value="tuxedo">Tuxedo</option>
  <option value="zebra">Zebra</option>
</optgroup>

  <optgroup label="Fruit">
  <option value="almond-joy">Almond Joy</option>
  <option value="coconut-cream">Coconut Cream</option>
  <option value="cranberry-orange">Cranberry Orange</option>
  <option value="key-lime-coconut">Key Lime Coconut</option>
  <option value="lemon-blueberry">Lemon Blueberry</option>
</optgroup>

  <optgroup label="Spice">
  <option value="apple-cider">Apple Cider</option>
  <option value="bee-sting">Bee Sting</option>
  <option value="carrot">Carrot</option>
  <option value="horchata">Horchata</option>
</optgroup>
</select>

    <p class="or-divider">OR</p>

    <label for="tier-flavor">Choose Cake</label>
    <select id="tier-flavor">
      <option value="">Select cake</option>
      <option>Almond</option>
      <option>Chocolate</option>
      <option>Coconut</option>
      <option>Lemon</option>
      <option>Marble</option>
      <option>Spice</option>
      <option>Vanilla</option>
    </select>

    <label for="tier-frosting">Choose Frosting</label>
    <select id="tier-frosting">
  <option value="">Select frosting</option>
  <option>Chocolate Buttercream</option>
  <option>Chocolate Mousse</option>
  <option>Cinnamon Honey Buttercream</option>
  <option>Coconut Cream Buttercream</option>
  <option>Coffee Buttercream</option>
  <option>Cranberry Buttercream</option>
  <option>Cream Cheese</option>
  <option>Horchata Buttercream</option>
  <option>Lemon Buttercream</option>
  <option>Oreo Buttercream</option>
  <option>Raspberry Buttercream</option>
  <option>Strawberry Cream Cheese</option>
  <option>Vanilla Buttercream</option>
  <option>White Chocolate Ganache</option>
</select>

    <label for="filling">Choose Filling</label>
    <select id="filling">
  <option value="">Select filling</option>
  <option>Apple Pie Filling</option>
  <option>Blackberry Puree</option>
  <option>Blueberry Puree</option>
  <option>Chocolate Mousse</option>
  <option>Cinnamon Brown Butter Ganache</option>
  <option>Dulce De Leche</option>
  <option>Key Lime Curd</option>
  <option>Lemon Curd</option>
  <option>Mixed Berry Jam</option>
  <option>Orange Marmalade</option>
  <option>Passionfruit Curd</option>
  <option>Raspberry Puree</option>
  <option>Strawberry Puree</option>
  <option>Vanilla Custard</option>
  <option>White Chocolate Ganache</option>
</select>
  </div>
</div>

  </div>
`;

setTimeout(() => {
  initCakeBuilder3D(recommendation);
}, 0);

document.getElementById("back-btn").addEventListener("click", goBack);

const signatureSelect = document.getElementById("signature-flavor");
const tierFlavorSelect = document.getElementById("tier-flavor");
const frostingSelect = document.getElementById("tier-frosting");
const fillingSelect = document.getElementById("filling");

let applyingSignaturePreset = false;

function clearSignatureForActiveTier() {
  if (activeTierIndex === null) return;
  if (applyingSignaturePreset) return;

  selections[activeTierIndex].signature = "";
  signatureSelect.value = "";

  updateTierTitle(activeTierIndex);
}

signatureSelect.addEventListener("change", function () {
  if (activeTierIndex === null) return;

  const preset = signatureFlavors[this.value];

  if (!preset) {
    selections[activeTierIndex].signature = "";
    updateTierTitle(activeTierIndex);
    return;
}

  selections[activeTierIndex].signature = this.value;
  updateTierTitle(activeTierIndex);

  applyingSignaturePreset = true;

  tierFlavorSelect.value = preset.cake;
  frostingSelect.value = preset.frosting;
  fillingSelect.value = preset.filling;

  tierFlavorSelect.dispatchEvent(new Event("change"));
  frostingSelect.dispatchEvent(new Event("change"));
  fillingSelect.dispatchEvent(new Event("change"));

  applyingSignaturePreset = false;
});

const isCombo = recommendation.type === "tiered-round-backup";
const parts = getRecommendationParts(recommendation);

const orderSections = document.getElementById("order-sections");

// main tiers section
const section = document.createElement("div");

section.classList.add("order-section");
section.innerHTML = `<div class="flavor-list"></div>`;
orderSections.appendChild(section);

const flavorListContainer = section.querySelector(".flavor-list");

// optional backup section
let backupSection = null;
let backupList = null;

if (parts.some(part => part.kind === "backup")) {
  backupSection = document.createElement("div");
  backupSection.classList.add("order-section");
  backupSection.innerHTML = `<div class="backup-list"></div>`;
  orderSections.appendChild(backupSection);
  backupList = backupSection.querySelector(".backup-list");
}

parts.forEach((part, index) => {
  const tierRow = document.createElement("div");
  tierRow.classList.add("tier-summary");
  tierRow.dataset.index = index;
  tierRow.dataset.kind = part.kind;
  if (part.size) tierRow.dataset.size = part.size;

  tierRow.innerHTML = `
    <p><strong><span class="tier-title">${part.label}</span></strong></p>
    <div class="tier-details">
      <p>Cake: <span class="${part.kind === "backup" ? "backup-flavor-value" : "tier-flavor-value"}">-</span></p>
      <p>Frosting: <span class="${part.kind === "backup" ? "backup-frosting-value" : "tier-frosting-value"}">-</span></p>
      <p>Filling: <span class="${part.kind === "backup" ? "backup-filling-value" : "tier-filling-value"}">-</span></p>
    </div>
  `;

  if (part.kind === "backup" && backupList) {
    backupList.appendChild(tierRow);
  } else {
    flavorListContainer.appendChild(tierRow);
  }
});



const flavorLines = document.querySelectorAll(".tier-flavor-value");
const backupFlavorLine = document.querySelector(".backup-flavor-value");

const fillingLines = document.querySelectorAll(".tier-filling-value");
const backupFillingLine = document.querySelector(".backup-filling-value");

const frostingLines = document.querySelectorAll(".tier-frosting-value");
const backupFrostingLine = document.querySelector(".backup-frosting-value");

const tierRows = document.querySelectorAll(".tier-summary");
const tierTitles = document.querySelectorAll(".tier-title");

let activeTierIndex = null;

const priceTotal = document.getElementById("price-total");

const selections = parts.map(part => ({
  label: part.label,
  size: part.size,
  kind: part.kind,
  flavor: "",
  frosting: "",
  filling: "",
  signature: ""
}));

function updatePrice() {
  const base = getBasePrice(recommendation);
  const extras = calculateCustomizationPrice(selections);
  priceTotal.textContent = base + extras;
}

function updateTierTitle(index) {
  const baseLabel = selections[index].label;
  const titleEl = tierTitles[index];

  if (!titleEl) return;

  if (selections[index].signature) {
    const prettyName = selections[index].signature
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    titleEl.innerHTML = `${baseLabel} <span class="signature-name">- ${prettyName}</span>`;
  } else {
    titleEl.textContent = baseLabel;
  }
}

tierRows.forEach((row, index) => {
  row.addEventListener("click", () => {
    activeTierIndex = index;

    tierRows.forEach(r => r.classList.remove("active-tier-row"));
    row.classList.add("active-tier-row");

    tierFlavorSelect.value = selections[index].flavor || "";
    frostingSelect.value = selections[index].frosting || "";
    fillingSelect.value = selections[index].filling || "";
    signatureSelect.value = selections[index].signature || "";
  });
});

if (tierRows.length > 0) {
  tierRows[0].click();
}

tierFlavorSelect.addEventListener("change", function () {

  if (activeTierIndex === null) return;

  clearSignatureForActiveTier();

  const selectedIndex = activeTierIndex;

  let color = "#f3ecd1";

  if (this.value === "Chocolate") color = "#996b5e";
  if (this.value === "Red Velvet") color = "#ad0b16";
  if (this.value === "Lemon") color = "#FCEB8C";



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

frostingSelect.addEventListener("change", function () {
  if (activeTierIndex === null) return;

  clearSignatureForActiveTier();

  const price = frostingPrices[this.value] || 0;

  const label = this.value
    ? price > 0
      ? `${this.value} <span class="price-inline">+$${price}</span>`
      : this.value
    : "-";

  if (isCombo && tierDivs[activeTierIndex].parentElement.classList.contains("combo-visual")) {
    if (backupFrostingLine) backupFrostingLine.innerHTML = label;
    selections[activeTierIndex].frosting = this.value || "";
  } else {
    frostingLines[activeTierIndex].innerHTML = label;
    selections[activeTierIndex].frosting = this.value || "";
  }

  updatePrice();
});

fillingSelect.addEventListener("change", function () {
  if (activeTierIndex === null) return;

  clearSignatureForActiveTier();

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

 
});

}

function goBack() {
  document.getElementById("calculator-ui").style.display = "block";
  document.getElementById("cake-visuals").style.display = "flex";
  document.getElementById("customizer").style.display = "none";
}
});