import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const cakeModel = document.getElementById("cake-model");
const guestCountInput = document.getElementById("guest-count");
const calculateButton = document.getElementById("calculate-btn");
const queryParams = new URLSearchParams(window.location.search);
const isDevMode = queryParams.get("dev") === "1";
const APP_STATE_KEY = "cake-supply-app-state";

function getSavedAppState() {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Unable to read saved app state", error);
    return null;
  }
}

function setSavedAppState(state) {
  try {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save app state", error);
  }
}

function clearSavedAppState() {
  try {
    localStorage.removeItem(APP_STATE_KEY);
  } catch (error) {
    console.warn("Unable to clear saved app state", error);
  }
}

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

const cakeColorMap = {
  "Almond": "#F3E0C2",
  "Chocolate": "#724F44",
  "Coconut": "#FFF6E8",
  "Lemon": "#FFF0A6",
  "Marble": "#D7B79A",
  "Spice": "#C9915F",
  "Vanilla": "#FFF1CB"
};

const frostingColorMap = {
  "Chocolate Buttercream": "#7C4C3A",
  "Chocolate Mousse": "#8A5A48",
  "Cinnamon Honey Buttercream": "#D5B078",
  "Coconut Cream Buttercream": "#FFF7EE",
  "Coffee Buttercream": "#A57A5A",
  "Cranberry Buttercream": "#C65A67",
  "Cream Cheese": "#F8F1E5",
  "Horchata Buttercream": "#EBD9B7",
  "Lemon Buttercream": "#FFF3A8",
  "Oreo Buttercream": "#D9D1C9",
  "Raspberry Buttercream": "#E8A3B4",
  "Strawberry Cream Cheese": "#F5C2CB",
  "Vanilla Buttercream": "#FFF9E8",
  "White Chocolate Ganache": "#F8E7C8"
};

const fillingColorMap = {
  "Apple Pie Filling": "#C07B45",
  "Blackberry Puree": "#5A355C",
  "Blueberry Puree": "#6A74B8",
  "Chocolate Mousse": "#6F4939",
  "Cinnamon Brown Butter Ganache": "#9E6A46",
  "Dulce De Leche": "#B9784B",
  "Key Lime Curd": "#DCEB90",
  "Lemon Curd": "#F6D857",
  "Mixed Berry Jam": "#8B3450",
  "Orange Marmalade": "#F0A04B",
  "Passionfruit Curd": "#F3C75D",
  "Raspberry Puree": "#B33A54",
  "Strawberry Puree": "#E46F7D",
  "Vanilla Custard": "#F8E6A5",
  "White Chocolate Ganache": "#F4DFBB"
};

const defaultTierColors = {
  cake: "#DCCB83",
  frosting: "#F4E7B6",
  filling: "#8A2E34"
};

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
        size: roundSize,
        label: `Sheet Backup (*)`
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

function addSymbolicSheetBadge(container, className = "") {
  const badge = document.createElement("div");
  badge.className = `symbolic-sheet-badge ${className}`.trim();
  badge.textContent = "*";
  container.appendChild(badge);
}

function getMaterialRole(materialName = "") {
  const normalized = materialName.toLowerCase();

  if (normalized.includes("filling")) return "filling";
  if (normalized.includes("frosting")) return "frosting";
  if (normalized.includes("cake")) return "cake";

  return null;
}

function prepareTierMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    child.material = materials.map((material) => {
      const clonedMaterial = material.clone();
      clonedMaterial.roughness = 0.6;
      clonedMaterial.metalness = 0.0;
      clonedMaterial.userData = {
        ...clonedMaterial.userData,
        role: getMaterialRole(clonedMaterial.name)
      };
      return clonedMaterial;
    });

    if (child.material.length === 1) {
      child.material = child.material[0];
    }
  });
}

function getTierColorSelections(selection = {}) {
  return {
    cake: cakeColorMap[selection.flavor] || defaultTierColors.cake,
    frosting: frostingColorMap[selection.frosting] || defaultTierColors.frosting,
    filling: selection.filling ? (fillingColorMap[selection.filling] || defaultTierColors.filling) : null
  };
}

function applyTierColorsToObject(object, selection = {}) {
  const colors = getTierColorSelections(selection);

  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    materials.forEach((material) => {
      const role = material.userData?.role;
      const hex = role ? colors[role] : null;

      if (role === "filling") {
        material.transparent = !hex;
        material.opacity = hex ? 1 : 0;
      }

      if (hex && material.color) {
        material.color.set(hex);
      }
    });
  });
}

function getSheetCakeLabel(recommendationName) {
  if (recommendationName.includes("1/4")) return "1/4 Sheet";
  if (recommendationName.includes("1/2")) return "1/2 Sheet";
  return "Full Sheet";
}

function formatPrice(amount) {
  return `$${amount}`;
}

function getTierDisplayText(sizes) {
  return sizes
    .slice()
    .sort((a, b) => a - b)
    .map(size => `${size}"`)
    .join(" + ");
}

function createSheetCakePreviewNode(labelText, className = "") {
  const sheetPreview = document.createElement("div");
  sheetPreview.className = `sheet-cake-preview ${className}`.trim();
  sheetPreview.setAttribute("aria-label", `${labelText} cake`);
  sheetPreview.innerHTML = `
    <div class="sheet-cake-top"></div>
    <div class="sheet-cake-side"></div>
    <div class="sheet-cake-filling"></div>
    <div class="sheet-cake-label">${labelText}</div>
  `;

  return sheetPreview;
}

function getRecommendationCardSections(recommendation) {
  const sizes = (recommendation.name.match(/\d+/g) || []).map(Number);

  if (recommendation.type === "single") {
    const size = sizes[0];
    return [
      {
        title: "Round Cake",
        detail: `${size}"`,
        visualType: "3d",
        recommendation: {
          name: `${size}" cake`,
          type: "single",
          servings: recommendation.servings
        }
      }
    ];
  }

  if (recommendation.type === "single-sheet") {
    return [
      {
        title: "Sheet Cake",
        detail: getSheetCakeLabel(recommendation.name),
        visualType: "sheet"
      }
    ];
  }

  if (recommendation.type === "tiered") {
    return [
      {
        title: "Tiered Cake",
        detail: getTierDisplayText(sizes),
        visualType: "3d",
        recommendation: {
          name: `${getTierDisplayText(sizes)} tiered cake`,
          type: "tiered",
          servings: recommendation.servings
        }
      }
    ];
  }

  if (recommendation.type === "tiered-round-backup") {
    const tierSizes = sizes.slice(0, -1);
    const backupSize = sizes[sizes.length - 1];

    return [
      {
        title: "Tiered Cake",
        detail: getTierDisplayText(tierSizes),
        visualType: "3d",
        recommendation: {
          name: `${getTierDisplayText(tierSizes)} tiered cake`,
          type: "tiered",
          servings: recommendation.servings
        }
      },
      {
        title: "Backup Cake",
        detail: `${backupSize}"`,
        visualType: "3d",
        compact: true,
        recommendation: {
          name: `${backupSize}" cake`,
          type: "single",
          servings: recommendation.servings
        }
      }
    ];
  }

  if (recommendation.type === "sheet-combo") {
    const roundSize = sizes[0];

    return [
      {
        title: "Round Cake",
        detail: `${roundSize}"`,
        visualType: "3d",
        recommendation: {
          name: `${roundSize}" cake`,
          type: "single",
          servings: recommendation.servings
        }
      },
      {
        title: "Sheet Cake",
        detail: getSheetCakeLabel(recommendation.name),
        visualType: "sheet",
        compact: true
      }
    ];
  }

  return [];
}

function buildRecommendationVisualLayout(container, recommendation) {
  container.innerHTML = "";

  const sections = getRecommendationCardSections(recommendation);
  const stack = document.createElement("div");
  stack.className = "recommendation-visual-stack";
  const renderQueue = [];

  sections.forEach((section) => {
    const sectionWrap = document.createElement("div");
    sectionWrap.className = `recommendation-visual-section${section.compact ? " recommendation-visual-section-compact" : ""}`;

    const label = document.createElement("div");
    label.className = "recommendation-part-label";
    label.textContent = `${section.detail} ${section.title}`;

    const visual = document.createElement("div");
    visual.className = `recommendation-part-preview${section.compact ? " recommendation-part-preview-compact" : ""}`;

    sectionWrap.appendChild(label);
    sectionWrap.appendChild(visual);
    stack.appendChild(sectionWrap);

    renderQueue.push(() => {
      if (section.visualType === "sheet") {
        visual.appendChild(createSheetCakePreviewNode(section.detail, "sheet-cake-preview-inline"));
      } else if (section.recommendation) {
        initRecommendationCake3D(visual, section.recommendation);
      }
    });
  });

  container.appendChild(stack);

  requestAnimationFrame(() => {
    renderQueue.forEach(render => render());
  });
}

function initSheetComboPreview(container, recommendation) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "sheet-combo-preview";

  const roundPreview = document.createElement("div");
  roundPreview.className = "sheet-combo-round-preview";

  const sheetPreview = document.createElement("div");
  sheetPreview.className = "sheet-cake-preview";
  sheetPreview.setAttribute("aria-label", `${getSheetCakeLabel(recommendation.name)} cake`);
  sheetPreview.innerHTML = `
    <div class="sheet-cake-top"></div>
    <div class="sheet-cake-side"></div>
    <div class="sheet-cake-filling"></div>
    <div class="sheet-cake-label">${getSheetCakeLabel(recommendation.name)}</div>
  `;

  wrapper.appendChild(roundPreview);
  wrapper.appendChild(sheetPreview);
  container.appendChild(wrapper);

  const roundSizeMatch = recommendation.name.match(/\d+/);
  const roundSize = roundSizeMatch ? parseInt(roundSizeMatch[0], 10) : 10;

  initRecommendationCake3D(roundPreview, {
    name: `${roundSize}" cake`,
    type: "single",
    servings: recommendation.servings
  });
}

let scene, camera, renderer, loader;
let cakeObjects = [];
let cakeSceneRoot = null;
let cakeAnimationFrame = null;
let customizerTierSelect = null;
let customizerPreviewSelections = [];
let activeCustomizerTierIndex = null;
let visibleBackupTierIndex = null;
let syncTierRowStates = () => {};
let customizerKeyHandler = null;

function isBackupKind(kind) {
  return kind === "backup" || kind === "extra-backup";
}

function syncBackupAnimationState() {
  if (!cakeObjects.length) return;

  const mainEntries = cakeObjects.filter((entry) => entry.kind === "main");
  const backupEntries = cakeObjects.filter((entry) => isBackupKind(entry.kind));
  if (!mainEntries.length) return;

  if (!backupEntries.length) {
    mainEntries.forEach((entry) => {
      entry.centerX = entry.homeX ?? 0;
      entry.hiddenX = entry.homeX ?? 0;
      entry.currentX = entry.currentX ?? entry.homeX ?? 0;
      entry.targetX = entry.targetX ?? entry.homeX ?? 0;
    });
    return;
  }

  const mainBox = new THREE.Box3();
  mainEntries.forEach((entry) => mainBox.expandByObject(entry.object));
  const mainWidth = Math.max(mainBox.max.x - mainBox.min.x, 0);
  const mainHiddenX = -(mainWidth + 1.2);

  mainEntries.forEach((entry) => {
    entry.centerX = entry.homeX ?? 0;
    entry.hiddenX = mainHiddenX;
    entry.currentX = typeof entry.currentX === "number" ? entry.currentX : entry.homeX ?? 0;
    entry.targetX = typeof entry.targetX === "number" ? entry.targetX : entry.homeX ?? 0;
  });

  backupEntries.forEach((entry) => {
    const backupBox = new THREE.Box3().setFromObject(entry.object);
    const backupWidth = Math.max(backupBox.max.x - backupBox.min.x, 0);
    const hiddenOffset = (entry.homeX ?? 0) + backupWidth + 1.2;

    entry.centerX = 0;
    entry.hiddenX = hiddenOffset;

    const selectedKind = activeCustomizerTierIndex !== null
      ? customizerPreviewSelections[activeCustomizerTierIndex]?.kind
      : null;
    const shouldBeCentered = activeCustomizerTierIndex !== null
      && isBackupKind(selectedKind)
      && entry.partIndex === activeCustomizerTierIndex;

    entry.targetX = shouldBeCentered ? entry.centerX : entry.hiddenX;
    entry.currentX = shouldBeCentered
      ? (typeof entry.currentX === "number" ? entry.currentX : entry.centerX)
      : entry.hiddenX;
    entry.object.position.x = entry.currentX;
  });
}

async function initCakeBuilder3D(recommendation) {
  const container = document.getElementById("cake-builder-3d");

  container.innerHTML = "";
  cakeObjects = [];
  if (cakeAnimationFrame) {
    cancelAnimationFrame(cakeAnimationFrame);
    cakeAnimationFrame = null;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f8f8);

  const width = container.clientWidth || 420;
  const height = container.clientHeight || 520;

  camera = new THREE.PerspectiveCamera(
    45,
    width / height,
    0.1,
    100
  );

  camera.position.set(0, 0.6, 2.2);
  camera.lookAt(0, 0.4, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cursor = "pointer";

  loader = new GLTFLoader();

  const light = new THREE.DirectionalLight(0xffffff, 2.3);
  light.position.set(3, 5, 4);
  scene.add(light);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.25);
  fillLight.position.set(-3, 3, 4);
  scene.add(fillLight);

  const ambient = new THREE.AmbientLight(0xffffff, 1.55);
  scene.add(ambient);

  const parts = getRecommendationParts(recommendation);
  await buildCake3D(parts);
  attachCakePicker();

  if (recommendation.type === "sheet-combo") {
    addSymbolicSheetBadge(container, "customizer-sheet-badge");
  }

  animate();
}

async function buildCake3D(parts) {
  if (cakeSceneRoot) {
    scene.remove(cakeSceneRoot);
  }

  const group = new THREE.Group();
  scene.add(group);
  cakeSceneRoot = group;

  let currentHeight = 0;
  let maxMainRadius = 0;

  const mainParts = parts
    .map((part, partIndex) => ({ part, partIndex }))
    .filter(({ part }) => part.kind === "main" && part.size)
    .sort((a, b) => b.part.size - a.part.size);

  for (const { part, partIndex } of mainParts) {

    const gltf = await new Promise((resolve) => {
      loader.load(`models/tier_${part.size}.glb`, resolve);
    });

    const tier = gltf.scene;

    tier.traverse((child) => {
      child.userData.partIndex = partIndex;
    });
    prepareTierMaterials(tier);
    applyTierColorsToObject(tier);

    const box = new THREE.Box3().setFromObject(tier);
    const height = box.max.y - box.min.y;
    const width = box.max.x - box.min.x;

    tier.position.y = currentHeight;
    group.add(tier);

    const radius = width / 2;
    if (radius > maxMainRadius) maxMainRadius = radius;

    cakeObjects.push({
      object: tier,
      partIndex,
      kind: part.kind,
      homeX: tier.position.x,
      currentX: tier.position.x,
      targetX: tier.position.x
    });

    currentHeight += height;
  }

  for (const [partIndex, part] of parts.entries()) {
    if (part.kind !== "backup" || !part.size) continue;

    const gltf = await new Promise((resolve) => {
      loader.load(`models/tier_${part.size}.glb`, resolve);
    });

    const backupTier = gltf.scene;

    backupTier.traverse((child) => {
      child.userData.partIndex = partIndex;
    });
    prepareTierMaterials(backupTier);
    applyTierColorsToObject(backupTier);

    const backupBox = new THREE.Box3().setFromObject(backupTier);
    const backupWidth = backupBox.max.x - backupBox.min.x;
    const backupRadius = backupWidth / 2;

    const sideOffset = maxMainRadius + backupRadius + 0.08;
    backupTier.position.set(sideOffset, 0, 0);
    group.add(backupTier);

    cakeObjects.push({
      object: backupTier,
      partIndex,
      kind: part.kind,
      homeX: sideOffset,
      currentX: sideOffset,
      targetX: sideOffset,
      hiddenX: sideOffset + backupWidth + 1.2
    });
  }

  const mainBox = new THREE.Box3();
  cakeObjects
    .filter((entry) => entry.kind === "main")
    .forEach((entry) => {
      mainBox.expandByObject(entry.object);
    });

  const center = new THREE.Vector3();
  mainBox.getCenter(center);

  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= mainBox.min.y;
  group.position.y += 0.42;

  syncBackupAnimationState();

  group.scale.setScalar(1.55);

  camera.position.set(0, 0.78, 1.78);
  camera.lookAt(0, 0.46, 0);
}

async function addExtraBackupCakeObject(selection, selectionIndex) {
  if (!selection?.size || !cakeSceneRoot || !loader) return null;

  const gltf = await new Promise((resolve) => {
    loader.load(`models/tier_${selection.size}.glb`, resolve);
  });

  const backupTier = gltf.scene;

  backupTier.traverse((child) => {
    child.userData.partIndex = selectionIndex;
  });
  prepareTierMaterials(backupTier);
  applyTierColorsToObject(backupTier, selection);

  const mainEntries = cakeObjects.filter((entry) => entry.kind === "main");
  const mainBox = new THREE.Box3();
  mainEntries.forEach((entry) => mainBox.expandByObject(entry.object));
  const mainWidth = mainBox.max.x - mainBox.min.x;

  const backupBox = new THREE.Box3().setFromObject(backupTier);
  const backupWidth = backupBox.max.x - backupBox.min.x;
  const sideOffset = mainWidth / 2 + backupWidth / 2 + 0.08;
  const hiddenOffset = sideOffset + backupWidth + 1.2;

  backupTier.position.set(hiddenOffset, 0, 0);
  cakeSceneRoot.add(backupTier);

  const entry = {
    object: backupTier,
    partIndex: selectionIndex,
    kind: "extra-backup",
    homeX: sideOffset,
    centerX: 0,
    currentX: hiddenOffset,
    targetX: hiddenOffset,
    hiddenX: hiddenOffset
  };

  cakeObjects.push(entry);
  syncBackupAnimationState();
  return entry;
}

function animate() {
  cakeAnimationFrame = requestAnimationFrame(animate);
  cakeObjects.forEach((entry) => {
    if (typeof entry.currentX !== "number" || typeof entry.targetX !== "number") return;

    entry.currentX += (entry.targetX - entry.currentX) * 0.14;
    entry.object.position.x = entry.currentX;
  });
  renderer.render(scene, camera);
}

function attachCakePicker() {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (!customizerTierSelect || !cakeObjects.length) return;

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const meshes = cakeObjects.flatMap(({ object }) => {
      const descendants = [];
      object.traverse((child) => {
        if (child.isMesh) descendants.push(child);
      });
      return descendants;
    });

    const intersects = raycaster.intersectObjects(meshes, false);
    if (!intersects.length) {
      customizerTierSelect(null);
      return;
    }

    let clickedObject = intersects[0].object;

    while (clickedObject && clickedObject.userData.partIndex === undefined) {
      clickedObject = clickedObject.parent;
    }

    if (clickedObject?.userData.partIndex !== undefined) {
      customizerTierSelect(clickedObject.userData.partIndex);
    }
  });
}

function setActiveCakeTier(partIndex) {
  activeCustomizerTierIndex = partIndex;

  if (partIndex !== null) {
    const selectedSelection = customizerPreviewSelections[partIndex];
    visibleBackupTierIndex = selectedSelection && isBackupKind(selectedSelection.kind)
      ? partIndex
      : null;
  }

  const visibleBackupKind = visibleBackupTierIndex !== null
    ? customizerPreviewSelections[visibleBackupTierIndex]?.kind
    : null;
  const backupInView = visibleBackupTierIndex !== null && isBackupKind(visibleBackupKind);

  cakeObjects.forEach((entry) => {
    const { object, partIndex: objectPartIndex, kind } = entry;
    const isActive = partIndex !== null && objectPartIndex === partIndex;
    const selection = customizerPreviewSelections[objectPartIndex] || {};

    if (isBackupKind(kind)) {
      object.visible = true;
      entry.targetX = visibleBackupTierIndex === objectPartIndex ? entry.centerX : entry.hiddenX;
    } else {
      entry.targetX = backupInView
        ? entry.hiddenX
        : entry.centerX ?? entry.homeX;
    }

    applyTierColorsToObject(object, selection);

    object.scale.setScalar(1);

    object.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (!("emissive" in child.material)) return;

      const isVisibleBackup = visibleBackupTierIndex !== null
        && objectPartIndex === visibleBackupTierIndex
        && !isActive;

      child.material.emissive.setHex(
        isActive ? 0xf3e1bb : isVisibleBackup ? 0xefe3ca : 0x000000
      );
      child.material.emissiveIntensity = isActive ? 0.11 : isVisibleBackup ? 0.03 : 0;
    });
  });

  syncTierRowStates();
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
  } else if (recommendation.type === "sheet-combo") {
    backupSize = allSizes[0];
  }

  buildRecommendationCake3D(scene, mainSizes, backupSize).then((group) => {
    // Match the customizer's more front-facing feel while keeping one
    // consistent recommendation scale that does not crop taller stacks.
    group.scale.setScalar(1.56);

    camera.position.set(0, 0.78, 1.78);
    camera.lookAt(0, 0.46, 0);
  });

  if (recommendation.type === "sheet-combo") {
    addSymbolicSheetBadge(container, "recommendation-sheet-badge");
  }

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
  group.position.y += 0.16;

  return group;
}

function initializeCakeFlow(guests, restoredState = null) {
  if (!Number.isFinite(guests) || guests <= 0) return;

  if (guestCountInput) {
    guestCountInput.value = guests;
  }


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

function getRecommendationStatePayload(activeRecommendation = null, customizerState = null, view = "recommendations") {
  return {
    guests,
    view,
    recommendation: activeRecommendation ? {
      name: activeRecommendation.name,
      type: activeRecommendation.type,
      servings: activeRecommendation.servings
    } : null,
    customizerState
  };
}

function persistRecommendationState() {
  setSavedAppState(getRecommendationStatePayload(null, null, "recommendations"));
}

function getSavedRecommendationMatch() {
  const savedRecommendation = restoredState?.recommendation;
  if (!savedRecommendation) return null;

  return uniqueRecommendations.find((recommendation) => {
    return recommendation.name === savedRecommendation.name
      && recommendation.type === savedRecommendation.type;
  }) || null;
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
    <div class="recommendation-option-number">${index + 1}</div>
    <div class="servings">Serves ${recommendation.servings}</div>
    <div class="recommendation-price-text">${formatPrice(getBasePrice(recommendation))}</div>
  `;

  card.appendChild(label);

  const preview3D = document.createElement("div");
preview3D.classList.add("recommendation-cake-3d");



card.appendChild(preview3D);

  buildRecommendationVisualLayout(preview3D, recommendation);

  let customizeBtn = document.createElement("button");
  customizeBtn.textContent = "Customize";
  customizeBtn.classList.add("customize-btn");

  customizeBtn.addEventListener("click", () => {
    showCustomizer(recommendation);
  });

  card.appendChild(customizeBtn);
  visualsContainer.appendChild(card);
});

persistRecommendationState();

const restoredRecommendation = getSavedRecommendationMatch();
if ((isDevMode || restoredState?.view === "customizer" || restoredState?.view === "summary") && (restoredRecommendation || topVisuals[0])) {
  showCustomizer(
    restoredRecommendation || topVisuals[0],
    restoredState?.customizerState || null,
    restoredState?.view === "summary"
  );
}

function showCustomizer(recommendation, restoredCustomizerState = null, openSummaryOnLoad = false) {
  const cakeModelWrap = cakeModel?.closest(".cake-3d-wrap");
  if (cakeModelWrap) {
    cakeModelWrap.style.display = "none";
  }

  document.getElementById("calculator-ui").style.display = "none";
  document.getElementById("cake-visuals").style.display = "none";
  document.getElementById("customizer").style.display = "block";

  const customizer = document.getElementById("customizer");
  const visualHTML = getCustomizerVisualHTML(recommendation);

  customizer.innerHTML = `
  <div id="customizer-layout">

    <div id="customizer-left-wrap">
  <button id="back-btn" class="back-btn">&larr; Back</button>

  <div id="customizer-left" class="customizer-panel">
    <h3>Order</h3>
    <div id="order-summary">
  <div id="order-sections"></div>
  <div id="additional-backups-list"></div>
  <div id="order-summary-footer">
  <p><strong>Total Servings: <span id="servings-total">${recommendation.servings}</span></strong></p>
  <p><strong>Base Price: $<span id="price-total">${getBasePrice(recommendation)}</span></strong></p>
  </div>
</div>
  </div>
</div>

    <div id="customizer-center">
      <div id="cake-builder-3d"></div>
    </div>

    <div id="customizer-right">
  <div class="customizer-panel" id="flavor-panel">
    <h3>Flavor</h3>

    <div class="flavor-controls">
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

  <div id="decor-drawer" class="decor-drawer">
    <button id="decor-toggle" type="button" class="decor-toggle">Decor</button>
    <div id="decor-content" class="decor-content">
      <div class="decor-shell">
        <div class="decor-stage">
          <div class="decor-option-buttons">
            <button type="button" class="decor-option-btn" data-decor="none">None</button>
            <button type="button" class="decor-option-btn" data-decor="pearls">Pearls</button>
            <button type="button" class="decor-option-btn" data-decor="ruffles">Ruffles</button>
            <button type="button" class="decor-option-btn" data-decor="bows">Bows</button>
            <button type="button" class="decor-option-btn" data-decor="flowers">Flowers</button>
            <button type="button" class="decor-option-btn" data-decor="fruit">Fruit</button>
            <button type="button" class="decor-option-btn" data-decor="writing">Writing</button>
            <button type="button" class="decor-option-btn" data-decor="minimal">Minimal</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="extra-backup-drawer" class="extra-backup-drawer">
    <button id="extra-backup-toggle" type="button" class="extra-backup-toggle">Not Enough Cake?</button>
    <div id="extra-backup-content" class="extra-backup-content">
      <div class="extra-backup-shell">
        <div class="extra-backup-stage">
          <div class="extra-backup-size-list">
            <div class="extra-backup-size-buttons">
              <button type="button" class="extra-backup-size-btn" data-size="6" aria-label='6 inch backup cake'>
                <span class="extra-backup-size-name">6"</span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-6"
                  src="models/tier_6.glb"
                  alt='6 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="8" aria-label='8 inch backup cake'>
                <span class="extra-backup-size-name">8"</span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-8"
                  src="models/tier_8.glb"
                  alt='8 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="10" aria-label='10 inch backup cake'>
                <span class="extra-backup-size-name">10"</span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-10"
                  src="models/tier_10.glb"
                  alt='10 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="12" aria-label='12 inch backup cake'>
                <span class="extra-backup-size-name">12"</span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-12"
                  src="models/tier_12.glb"
                  alt='12 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="14" aria-label='14 inch backup cake'>
                <span class="extra-backup-size-name">14"</span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-14"
                  src="models/tier_14.glb"
                  alt='14 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>

  <button id="order-summary-btn" class="order-summary-btn" type="button">Order Summary</button>
</div>

  </div>
`;

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


const parts = getRecommendationParts(recommendation);
const basePartCount = parts.length;

const orderSections = document.getElementById("order-sections");

let activeTierIndex = Number.isInteger(restoredCustomizerState?.activeTierIndex)
  ? restoredCustomizerState.activeTierIndex
  : null;

const priceTotal = document.getElementById("price-total");
const servingsTotal = document.getElementById("servings-total");
const orderSummaryBtn = document.getElementById("order-summary-btn");
const decorToggle = document.getElementById("decor-toggle");
const decorContent = document.getElementById("decor-content");
const decorOptionButtons = document.querySelectorAll(".decor-option-btn");
const extraBackupToggle = document.getElementById("extra-backup-toggle");
const extraBackupContent = document.getElementById("extra-backup-content");
const extraBackupSizeButtons = document.querySelectorAll(".extra-backup-size-btn");

decorContent.hidden = false;
extraBackupContent.hidden = false;

const selections = Array.isArray(restoredCustomizerState?.selections) && restoredCustomizerState.selections.length
  ? restoredCustomizerState.selections.map((selection) => ({
      label: selection.label,
      size: selection.size,
      kind: selection.kind,
      flavor: selection.flavor || "",
      frosting: selection.frosting || "",
      filling: selection.filling || "",
      signature: selection.signature || "",
      decor: selection.decor || ""
    }))
  : parts.map(part => ({
      label: part.label,
      size: part.size,
      kind: part.kind,
      flavor: "",
      frosting: "",
      filling: "",
      signature: "",
      decor: ""
    }));

customizerPreviewSelections = selections;

function persistCustomizerState(view = "customizer") {
  setSavedAppState(getRecommendationStatePayload(recommendation, {
    activeTierIndex,
    selections: selections.map((selection) => ({
      label: selection.label,
      size: selection.size,
      kind: selection.kind,
      flavor: selection.flavor || "",
      frosting: selection.frosting || "",
      filling: selection.filling || "",
      signature: selection.signature || "",
      decor: selection.decor || ""
    }))
  }, view));
}

function getRoundCakeOption(size) {
  return cakeOptions.find((cake) => cake.type === "round" && cake.size === size);
}

function formatMoney(value) {
  return Number(value).toFixed(2);
}

function getSelectionBasePrice(selection) {
  if (!selection) return 0;

  if (selection.kind === "main" || selection.kind === "backup" || selection.kind === "extra-backup") {
    if (selection.label.includes("Sheet Backup")) {
      if (recommendation.name.includes("1/4")) return baseCakePrices["1/4 sheet cake"] || 0;
      if (recommendation.name.includes("1/2")) return baseCakePrices["1/2 sheet cake"] || 0;
      return baseCakePrices["full sheet cake"] || 0;
    }

    return baseCakePrices[`${selection.size}" cake`] || 0;
  }

  return 0;
}

function getSelectionExtras(selection) {
  return {
    flavor: flavorPrices[selection.flavor] || 0,
    frosting: frostingPrices[selection.frosting] || 0,
    filling: fillingPrices[selection.filling] || 0,
    decor: 0
  };
}

function getSelectionDisplayName(selection) {
  if (selection.signature) {
    return selection.signature
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return selection.label;
}

function renderOrderSummaryPage() {
  persistCustomizerState("summary");

  if (customizerKeyHandler) {
    document.removeEventListener("keydown", customizerKeyHandler);
    customizerKeyHandler = null;
  }

  const summarySelections = selections.map((selection) => ({ ...selection }));
  const now = new Date();
  const promiseDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(now);
  const promiseTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(now);
  const orderedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(now);
  const printedStamp = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit"
  }).format(now);
  const subtotal = getBasePrice(recommendation)
    + calculateCustomizationPrice(summarySelections)
    + summarySelections.slice(basePartCount).reduce((total, backup) => {
      return total + (baseCakePrices[`${backup.size}" cake`] || 0);
    }, 0);
  const taxRate = 0.0725;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  customizer.innerHTML = `
    <div class="summary-page">
      <div class="summary-header-row">
        <div class="summary-actions">
          <button type="button" class="summary-action-btn">Add Notes</button>
          <button class="back-btn summary-back-trigger" type="button">&larr; Back</button>
        </div>
      </div>

      <div class="summary-panel">
        <div class="summary-sheet-header">
          <div class="summary-sheet-brand">
            <div class="summary-sheet-brandline">
              <div class="summary-brand-name">CAKE SUPPLY</div>
            </div>
            <div class="summary-customer-block">
              <div class="summary-customer-name">Customer Name</div>
              <div class="summary-customer-phone">(000-000-0000)</div>
              <div class="summary-customer-order">Order #000X</div>
              <div class="summary-customer-window">Delivery window: XX:XX</div>
            </div>
          </div>

          <div class="summary-sheet-meta">
            <div class="summary-sheet-promise">${promiseDate} @ ${promiseTime}</div>
            <div class="summary-sheet-status">Pickup</div>
            <div class="summary-sheet-submeta">Date Ordered: ${orderedDate}</div>
            <div class="summary-sheet-submeta">Taken By: Cakesupply</div>
            <div class="summary-sheet-submeta">Status: Open, Unpaid</div>
          </div>
        </div>

        <div class="summary-sheet-contact-row">
          <div class="summary-sheet-contact-left"></div>
          <div class="summary-sheet-contact-right">
            <div>Customer name</div>
            <div>Road St.</div>
            <div>City, State, Zip</div>
            <div>(000-000-0000)</div>
          </div>
        </div>

        <div class="summary-order-block">
          <div class="summary-table-head">
            <span>Quantity</span>
            <span>Description</span>
            <span>Price</span>
            <span>Total</span>
          </div>
          <div class="summary-items">
            ${summarySelections.map((selection) => {
              const basePrice = getSelectionBasePrice(selection);
              const extras = getSelectionExtras(selection);
              const rowTotal = basePrice + extras.flavor + extras.frosting + extras.filling + extras.decor;

              const detailRows = [];
              if (selection.signature) detailRows.push(`<div class="summary-detail-row summary-signature-row"><span>Signature Flavor: ${getSelectionDisplayName(selection)}</span><span></span></div>`);
              if (selection.flavor) detailRows.push(`<div class="summary-detail-row"><span>Flavor: ${selection.flavor}${extras.flavor > 0 ? ` (${formatMoney(extras.flavor)})` : ""}</span><span>${extras.flavor > 0 ? formatMoney(extras.flavor) : ""}</span></div>`);
              if (selection.filling) detailRows.push(`<div class="summary-detail-row"><span>Filling: ${selection.filling}${extras.filling > 0 ? ` (${formatMoney(extras.filling)})` : ""}</span><span>${extras.filling > 0 ? formatMoney(extras.filling) : ""}</span></div>`);
              if (selection.frosting) detailRows.push(`<div class="summary-detail-row"><span>Icing: ${selection.frosting}</span><span>${extras.frosting > 0 ? formatMoney(extras.frosting) : ""}</span></div>`);
              if (selection.decor) detailRows.push(`<div class="summary-detail-row"><span>Decoration: ${selection.decor.charAt(0).toUpperCase() + selection.decor.slice(1)}</span><span></span></div>`);

              return `
                <div class="summary-item-card">
                  <div class="summary-item-head">
                    <div class="summary-item-qty">1 Each</div>
                    <div class="summary-item-description">
                      <div class="summary-item-name">${selection.label}</div>
                      <div class="summary-item-details">
                        ${detailRows.join("")}
                      </div>
                    </div>
                    <div class="summary-item-price">${formatMoney(basePrice)}</div>
                    <div class="summary-item-total">${formatMoney(rowTotal)}</div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="summary-totals">
          <div class="summary-policy">* 4 Days Advance Notice Is Required For Any Changes Or Cancellations To An Existing Order.</div>
          <div class="summary-total-row"><span>Discount</span><span>0.00</span></div>
          <div class="summary-total-row"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
          <div class="summary-total-row"><span>Tax</span><span>${formatMoney(tax)}</span></div>
          <div class="summary-total-row"><span>Delivery Charge</span><span>0.00</span></div>
          <div class="summary-total-row summary-total-strong"><span>Total</span><span>${formatMoney(total)}</span></div>
          <div class="summary-total-row summary-total-strong"><span>Amount paid:</span><span>0.00</span></div>
          <div class="summary-total-row summary-total-strong"><span>Balance due:</span><span>${formatMoney(total)}</span></div>
        </div>

        <div class="summary-sheet-footer">
          <span>Cake Customer</span>
          <span>Date Required: ${promiseDate} @ ${promiseTime}</span>
          <span>Printed ${printedStamp}</span>
        </div>
      </div>
    </div>
  `;

  customizer.querySelectorAll(".summary-back-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      showCustomizer(recommendation, {
        activeTierIndex,
        selections
      });
    });
  });
}

function getTierRow(index) {
  return orderSections.querySelector(`.tier-summary[data-index="${index}"]`);
}

function getTierTitleEl(index) {
  return getTierRow(index)?.querySelector(".tier-title") || null;
}

function getTierValueEl(index, field) {
  return getTierRow(index)?.querySelector(`[data-field="${field}"]`) || null;
}

function scrollTierRowIntoView(index) {
  if (index === null) return;

  const row = getTierRow(index);
  if (!row) return;

  row.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "nearest"
  });
}

function closeDrawerMenus() {
  const flavorPanel = document.getElementById("flavor-panel");
  decorToggle.classList.remove("is-open");
  extraBackupToggle.classList.remove("is-open");
  flavorPanel?.classList.remove("decor-drawer-open", "backup-drawer-open", "has-open-drawer");
}

function setDrawerState(drawerName, isOpen) {
  const flavorPanel = document.getElementById("flavor-panel");
  if (!flavorPanel) return;

  const openDecor = drawerName === "decor" ? isOpen : false;
  const openBackup = drawerName === "backup" ? isOpen : false;

  decorToggle.classList.toggle("is-open", openDecor);
  extraBackupToggle.classList.toggle("is-open", openBackup);
  flavorPanel.classList.toggle("decor-drawer-open", openDecor);
  flavorPanel.classList.toggle("backup-drawer-open", openBackup);
  flavorPanel.classList.toggle("has-open-drawer", openDecor || openBackup);
}

function syncDecorButtons(index) {
  decorOptionButtons.forEach((button) => {
    const isSelected = index !== null && selections[index]?.decor === button.dataset.decor;
    button.classList.toggle("is-selected", !!isSelected);
  });
}

syncTierRowStates = function () {
  orderSections.querySelectorAll(".tier-summary").forEach((row) => {
    row.classList.remove("active-tier-row", "visible-tier-row");
  });

  if (activeTierIndex !== null) {
    getTierRow(activeTierIndex)?.classList.add("active-tier-row");
  }
};

function removeExtraBackupCake(selectionIndex) {
  if (!selections[selectionIndex] || selections[selectionIndex].kind !== "extra-backup") return;

  const objectIndex = cakeObjects.findIndex((entry) => entry.partIndex === selectionIndex);
  if (objectIndex !== -1) {
    const [entry] = cakeObjects.splice(objectIndex, 1);
    cakeSceneRoot?.remove(entry.object);
  }

  selections.splice(selectionIndex, 1);

  cakeObjects.forEach((entry) => {
    if (entry.partIndex > selectionIndex) {
      entry.partIndex -= 1;
      entry.object.traverse((child) => {
        child.userData.partIndex = entry.partIndex;
      });
    }
  });

  if (visibleBackupTierIndex !== null) {
    if (visibleBackupTierIndex === selectionIndex) {
      visibleBackupTierIndex = null;
    } else if (visibleBackupTierIndex > selectionIndex) {
      visibleBackupTierIndex -= 1;
    }
  }

  customizerPreviewSelections = selections;
  syncBackupAnimationState();
  renderOrderRows();
  updatePrice();
  persistCustomizerState();

  if (!selections.length) {
    selectTier(null);
    return;
  }

  if (activeTierIndex === selectionIndex) {
    activeTierIndex = null;
    setActiveCakeTier(null);
    tierFlavorSelect.value = "";
    frostingSelect.value = "";
    fillingSelect.value = "";
    signatureSelect.value = "";
    syncDecorButtons(null);
    return;
  }

  if (activeTierIndex !== null && activeTierIndex > selectionIndex) {
    selectTier(activeTierIndex - 1);
    return;
  }

  setActiveCakeTier(activeTierIndex);
}

function attachTierRowHandlers() {
  orderSections.querySelectorAll(".tier-summary").forEach((row) => {
    row.onclick = () => {
      selectTier(Number(row.dataset.index));
    };
  });

  orderSections.querySelectorAll(".tier-remove-btn").forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeExtraBackupCake(Number(button.dataset.index));
    };
  });
}

function renderOrderRows() {
  orderSections.innerHTML = "";

  const mainSection = document.createElement("div");
  mainSection.className = "order-section";
  const mainList = document.createElement("div");
  mainList.className = "flavor-list";
  mainSection.appendChild(mainList);
  orderSections.appendChild(mainSection);

  let backupSection = null;
  let backupList = null;

  if (selections.some((selection) => selection.kind === "backup" || selection.kind === "extra-backup")) {
    backupSection = document.createElement("div");
    backupSection.className = "order-section";
    backupList = document.createElement("div");
    backupList.className = "backup-list";
    backupSection.appendChild(backupList);
    orderSections.appendChild(backupSection);
  }

  selections.forEach((selection, index) => {
    const tierRow = document.createElement("div");
    tierRow.className = "tier-summary";
    tierRow.dataset.index = index;
    tierRow.dataset.kind = selection.kind;
    if (selection.size) tierRow.dataset.size = selection.size;

    tierRow.innerHTML = `
      <p><strong><span class="tier-title">${selection.label}</span></strong></p>
      <div class="tier-details">
        <p>Cake: <span data-field="flavor">-</span></p>
        <p>Frosting: <span data-field="frosting">-</span></p>
        <p>Filling: <span data-field="filling">-</span></p>
      </div>
    `;

    if (selection.kind === "extra-backup") {
      tierRow.classList.add("extra-backup-item");
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "tier-remove-btn";
      removeButton.dataset.index = index;
      removeButton.textContent = "Delete";
      tierRow.appendChild(removeButton);
    }

    if (selection.kind === "backup" || selection.kind === "extra-backup") {
      backupList?.appendChild(tierRow);
    } else {
      mainList.appendChild(tierRow);
    }

    updateTierTitle(index);
    getTierValueEl(index, "flavor").innerHTML = selection.flavor || "-";
    getTierValueEl(index, "frosting").innerHTML = selection.frosting || "-";
    getTierValueEl(index, "filling").innerHTML = selection.filling || "-";
  });

  attachTierRowHandlers();

  if (activeTierIndex !== null && getTierRow(activeTierIndex)) {
    getTierRow(activeTierIndex).classList.add("active-tier-row");
  }
}

function updatePrice() {
  const base = getBasePrice(recommendation);
  const extras = calculateCustomizationPrice(selections);
  const extraBackupSelections = selections.slice(basePartCount);
  const backupPriceTotal = extraBackupSelections.reduce((total, backup) => {
    return total + (baseCakePrices[`${backup.size}" cake`] || 0);
  }, 0);
  const backupServingsTotal = extraBackupSelections.reduce((total, backup) => {
    const cake = getRoundCakeOption(backup.size);
    return total + (cake?.servings || 0);
  }, 0);

  priceTotal.textContent = base + extras + backupPriceTotal;
  servingsTotal.textContent = recommendation.servings + backupServingsTotal;
  persistCustomizerState();
}

function updateTierTitle(index) {
  const baseLabel = selections[index].label;
  const titleEl = getTierTitleEl(index);

  if (!titleEl) return;

  if (selections[index].signature) {
    const prettyName = selections[index].signature
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    titleEl.innerHTML = `${baseLabel}<span class="signature-name">${prettyName}</span>`;
  } else {
    titleEl.textContent = baseLabel;
  }
}

function isBackupPart(index) {
  return selections[index]?.kind === "backup" || selections[index]?.kind === "extra-backup";
}

function refreshTierPreview(index) {
  const tierObject = cakeObjects.find(({ partIndex }) => partIndex === index);
  if (!tierObject) return;

  applyTierColorsToObject(tierObject.object, selections[index]);
}

function selectTier(index) {
  activeTierIndex = index;

  setActiveCakeTier(index);
  scrollTierRowIntoView(index);

  if (index === null) {
    tierFlavorSelect.value = "";
    frostingSelect.value = "";
    fillingSelect.value = "";
    signatureSelect.value = "";
    syncDecorButtons(null);
    persistCustomizerState();
    return;
  }

  tierFlavorSelect.value = selections[index].flavor || "";
  frostingSelect.value = selections[index].frosting || "";
  fillingSelect.value = selections[index].filling || "";
  signatureSelect.value = selections[index].signature || "";
  syncDecorButtons(index);
  persistCustomizerState();
}

function installCustomizerKeyboardNav() {
  if (customizerKeyHandler) {
    document.removeEventListener("keydown", customizerKeyHandler);
  }

  customizerKeyHandler = (event) => {
    if (document.getElementById("customizer")?.style.display === "none") return;

    const tagName = event.target?.tagName;
    if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || event.target?.isContentEditable) {
      return;
    }

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    if (!selections.length) return;

    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const currentIndex = activeTierIndex ?? (direction === 1 ? -1 : selections.length);
    const nextIndex = Math.max(0, Math.min(selections.length - 1, currentIndex + direction));

    if (nextIndex !== activeTierIndex) {
      selectTier(nextIndex);
    }
  };

  document.addEventListener("keydown", customizerKeyHandler);
}

customizerTierSelect = selectTier;
installCustomizerKeyboardNav();

renderOrderRows();

const restoredTierIndex = Number.isInteger(restoredCustomizerState?.activeTierIndex)
  && restoredCustomizerState.activeTierIndex >= 0
  && restoredCustomizerState.activeTierIndex < selections.length
    ? restoredCustomizerState.activeTierIndex
    : (selections.length > 0 ? 0 : null);

setTimeout(async () => {
  await initCakeBuilder3D(recommendation);

  for (let index = basePartCount; index < selections.length; index += 1) {
    if (selections[index]?.kind === "extra-backup") {
      await addExtraBackupCakeObject(selections[index], index);
    }
  }

  if (restoredTierIndex !== null) {
    selectTier(restoredTierIndex);
  } else {
    selectTier(null);
  }

  updatePrice();
  persistCustomizerState(openSummaryOnLoad ? "summary" : "customizer");

  if (openSummaryOnLoad) {
    renderOrderSummaryPage();
  }
}, 0);

decorToggle.addEventListener("click", () => {
  const flavorPanel = document.getElementById("flavor-panel");
  const isOpen = flavorPanel?.classList.contains("decor-drawer-open");
  setDrawerState("decor", !isOpen);
});

decorOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (activeTierIndex === null) return;
    selections[activeTierIndex].decor = button.dataset.decor || "";
    syncDecorButtons(activeTierIndex);
    closeDrawerMenus();
    persistCustomizerState();
  });
});

extraBackupToggle.addEventListener("click", () => {
  const flavorPanel = document.getElementById("flavor-panel");
  const isOpen = flavorPanel?.classList.contains("backup-drawer-open");
  setDrawerState("backup", !isOpen);
});

extraBackupSizeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
  const selectedExtraBackupSize = Number(button.dataset.size);
  const cake = getRoundCakeOption(selectedExtraBackupSize);
  if (!cake) return;

  const newSelection = {
    label: `${selectedExtraBackupSize}" Backup`,
    size: selectedExtraBackupSize,
    kind: "extra-backup",
    flavor: "",
    frosting: "",
    filling: "",
    signature: ""
  };

  selections.push(newSelection);

  const newIndex = selections.length - 1;
  renderOrderRows();
  await addExtraBackupCakeObject(newSelection, newIndex);
  updatePrice();
  selectTier(newIndex);

  closeDrawerMenus();
  persistCustomizerState();
  });
});

orderSummaryBtn?.addEventListener("click", () => {
  renderOrderSummaryPage();
});

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

if (isBackupPart(selectedIndex)) {
  selections[selectedIndex].flavor = this.value || "";
} else {
  selections[selectedIndex].flavor = this.value || "";
}

getTierValueEl(selectedIndex, "flavor").innerHTML = label;

refreshTierPreview(selectedIndex);
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

  if (isBackupPart(activeTierIndex)) {
    selections[activeTierIndex].frosting = this.value || "";
  } else {
    selections[activeTierIndex].frosting = this.value || "";
  }

  getTierValueEl(activeTierIndex, "frosting").innerHTML = label;

  refreshTierPreview(activeTierIndex);
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

if (isBackupPart(activeTierIndex)) {
  selections[activeTierIndex].filling = this.value || "";
} else {
  selections[activeTierIndex].filling = this.value || "";
}

getTierValueEl(activeTierIndex, "filling").innerHTML = label;
refreshTierPreview(activeTierIndex);
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
  if (customizerKeyHandler) {
    document.removeEventListener("keydown", customizerKeyHandler);
    customizerKeyHandler = null;
  }

  const cakeModelWrap = cakeModel?.closest(".cake-3d-wrap");
  if (cakeModelWrap) {
    cakeModelWrap.style.display = "block";
  }

  document.getElementById("calculator-ui").style.display = "block";
  document.getElementById("cake-visuals").style.display = "flex";
  document.getElementById("customizer").style.display = "none";
  persistRecommendationState();
}
}

calculateButton?.addEventListener("click", () => {
  const guests = parseInt(guestCountInput?.value, 10);
  initializeCakeFlow(guests);
});

const restoredState = getSavedAppState();

if (restoredState?.guests && (isDevMode || (restoredState.view && restoredState.view !== "landing"))) {
  initializeCakeFlow(restoredState.guests, restoredState);
} else if (isDevMode) {
  const fallbackGuests = Number.parseInt(guestCountInput?.value, 10) || 50;
  initializeCakeFlow(fallbackGuests);
}
