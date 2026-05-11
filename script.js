import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const cakeModel = document.getElementById("cake-model");
const landingCakeHero = document.getElementById("landing-cake-hero");
const guestCountInput = document.getElementById("guest-count");
const calculateButton = document.getElementById("calculate-btn");
const calculatorForm = document.querySelector(".calculator-search-row");
const calculatorUi = document.getElementById("calculator-ui");
const heroRecommendationMeta = document.getElementById("hero-recommendation-meta");
const heroRecommendationLabel = document.getElementById("hero-recommendation-label");
const heroCustomizeButton = document.getElementById("hero-customize-btn");
const landingPage = document.getElementById("landing-page");
const menuPage = document.getElementById("menu-page");
const menuGrid = document.getElementById("menu-grid");
const galleryPage = document.getElementById("gallery-page");
const displayCasePage = document.getElementById("display-case-page");
const recommendationsPage = document.getElementById("recommendations-page");
const recommendationsBackButton = document.getElementById("recommendations-back-btn");
const siteLogo = document.getElementById("site-logo");
const menuTab = document.getElementById("menu-tab");
const galleryTab = document.getElementById("gallery-tab");
const displayCaseTab = document.getElementById("display-case-tab");
const orderTab = document.getElementById("order-tab");
const queryParams = new URLSearchParams(window.location.search);
const isDevMode = queryParams.get("dev") === "1";
const APP_STATE_KEY = "cake-supply-app-state";
const LANDING_HERO_BASE_SCALE = 1.62;
const LANDING_HERO_FRAME_PADDING = 1.46;
const LIVE_PREVIEW_DEBOUNCE_MS = 180;
let activeHeroRecommendation = null;
const HERO_SHARED_TRANSITION_MS = 720;
let menuPreviewObserver = null;

const CAKE_LIGHTING = {
  key: 2.65,
  fill: 0.72,
  rim: 1.1,
  ambient: 0.72
};

const OUTER_FROSTING_DECOR = "outerfrosting";
const SHELL_BORDER_DECOR = "shell-border";
const SWIRL_DECOR = "swirls";
const DEFAULT_OUTER_FROSTING_COLOR = "#fff7c7";
const DEFAULT_SHELL_FROSTING_COLOR = "#fffdf4";
const SHELL_BORDER_MODEL_SRC = "decoration/shell_single1.glb";
const SWIRL_MODEL_SRC = "decoration/swirl1.glb";
const CHERRY_MODEL_SRC = "decoration/cherry1.glb";
const SWIRL_ALLOWED_COUNTS = [6, 8, 12];
const DEFAULT_SWIRL_COUNT = 8;
const SWIRL_TOP_Y_OFFSET = 0.025;
const SWIRL_RADIUS_OFFSET = -0.026;
const CHERRY_TOP_Y_OFFSET = 0.028;
const CHERRY_RADIUS_OFFSET = 0;
const SHELL_BORDER_MIN_SCALE = 0.08;
const SHELL_BORDER_MAX_COUNT = 32;
const SHELL_BORDER_OVERLAP = 1.12;
const SHELL_BORDER_DEFAULT_EDGE = "top";
const SHELL_BORDER_TOP_Y_OFFSET = -0.018;
const SHELL_BORDER_BOTTOM_Y_OFFSET = -0.006;

const cakeOptions = [
  { name: '6" cake', servings: 10, type: 'round', size: 6 },
  { name: '8" cake', servings: 18, type: 'round', size: 8 },
  { name: '10" cake', servings: 32, type: 'round', size: 10 },
  { name: '12" cake', servings: 47, type: 'round', size: 12 },
  { name: '14" cake', servings: 70, type: 'round', size: 14 },
  { name: '1/4 sheet cake', servings: 24, type: 'sheet' },
  { name: '1/2 sheet cake', servings: 36, type: 'sheet' },
  { name: 'full sheet cake', servings: 72, type: 'sheet' }
];

const tieredOptions = [
  { tiers: [6, 8], servings: 28 },
  { tiers: [8, 10], servings: 50 },
  { tiers: [6, 8, 10], servings: 60 },
  { tiers: [10, 12], servings: 79 },
  { tiers: [8, 10, 12], servings: 97 },
  { tiers: [6, 8, 10, 12], servings: 107 },
  { tiers: [10, 12, 14], servings: 149 },
  { tiers: [8, 10, 12, 14], servings: 167 },
  { tiers: [6, 8, 10, 12, 14], servings: 177 }
];

const CUPCAKE_PRICE = 3;
const CUPCAKE_QUANTITY_STEP = 12;
const CUPCAKE_MAX_STANDALONE = 60;
const CUPCAKE_MAX_SUPPLEMENT = 36;

function getSavedAppState() {
  clearSavedAppState();
  return null;
}

function setSavedAppState(state) {
  void state;
}

function clearSavedAppState() {
  try {
    localStorage.removeItem(APP_STATE_KEY);
  } catch (error) {
    console.warn("Unable to clear saved app state", error);
  }
}

function showLandingPageView() {
  teardownMenuPreviewObserver();
  if (landingPage) landingPage.style.display = "block";
  if (menuPage) {
    menuPage.style.display = "none";
    menuPage.hidden = true;
  }
  if (galleryPage) {
    galleryPage.style.display = "none";
    galleryPage.hidden = true;
  }
  if (displayCasePage) {
    displayCasePage.style.display = "none";
    displayCasePage.hidden = true;
  }
  if (recommendationsPage) recommendationsPage.style.display = "";
  document.body.classList.remove("results-active");
  document.body.classList.remove("menu-active");
  document.body.classList.remove("gallery-active");
  document.body.classList.remove("display-case-active");
  document.body.classList.remove("customizer-active");
  document.body.classList.remove("results-transitioning");
  if (heroRecommendationMeta) {
    heroRecommendationMeta.setAttribute("aria-hidden", "true");
  }
  const customizerEl = document.getElementById("customizer");
  if (customizerEl) customizerEl.style.display = "none";
}

function showRecommendationsPageView() {
  teardownMenuPreviewObserver();
  if (landingPage) landingPage.style.display = "block";
  if (menuPage) {
    menuPage.style.display = "none";
    menuPage.hidden = true;
  }
  if (galleryPage) {
    galleryPage.style.display = "none";
    galleryPage.hidden = true;
  }
  if (displayCasePage) {
    displayCasePage.style.display = "none";
    displayCasePage.hidden = true;
  }
  if (recommendationsPage) recommendationsPage.style.display = "";
  document.body.classList.add("results-active");
  document.body.classList.remove("menu-active");
  document.body.classList.remove("gallery-active");
  document.body.classList.remove("display-case-active");
  document.body.classList.remove("customizer-active");
  if (heroRecommendationMeta) {
    heroRecommendationMeta.setAttribute("aria-hidden", "false");
  }
  const customizerEl = document.getElementById("customizer");
  if (customizerEl) customizerEl.style.display = "none";
}

function showCustomizerPageView() {
  teardownMenuPreviewObserver();
  document.body.classList.remove("results-active");
  document.body.classList.remove("menu-active");
  document.body.classList.remove("gallery-active");
  document.body.classList.add("customizer-active");
  if (landingPage) landingPage.style.display = "none";
  if (menuPage) {
    menuPage.style.display = "none";
    menuPage.hidden = true;
  }
  if (galleryPage) {
    galleryPage.style.display = "none";
    galleryPage.hidden = true;
  }
  if (displayCasePage) {
    displayCasePage.style.display = "none";
    displayCasePage.hidden = true;
  }
  document.body.classList.remove("display-case-active");
  const customizerEl = document.getElementById("customizer");
  if (customizerEl) customizerEl.style.display = "block";
}

function showMenuPageView() {
  if (landingPage) landingPage.style.display = "none";
  if (menuPage) {
    menuPage.hidden = false;
    menuPage.style.display = "block";
  }
  if (galleryPage) {
    galleryPage.style.display = "none";
    galleryPage.hidden = true;
  }
  if (displayCasePage) {
    displayCasePage.style.display = "none";
    displayCasePage.hidden = true;
  }
  if (recommendationsPage) recommendationsPage.style.display = "";
  document.body.classList.remove("results-active");
  document.body.classList.remove("customizer-active");
  document.body.classList.remove("results-transitioning");
  document.body.classList.remove("gallery-active");
  document.body.classList.remove("display-case-active");
  document.body.classList.add("menu-active");
  const customizerEl = document.getElementById("customizer");
  if (customizerEl) customizerEl.style.display = "none";
}

function showGalleryPageView() {
  teardownMenuPreviewObserver();
  if (landingPage) landingPage.style.display = "none";
  if (menuPage) {
    menuPage.style.display = "none";
    menuPage.hidden = true;
  }
  if (galleryPage) {
    galleryPage.hidden = false;
    galleryPage.style.display = "block";
  }
  if (displayCasePage) {
    displayCasePage.style.display = "none";
    displayCasePage.hidden = true;
  }
  if (recommendationsPage) recommendationsPage.style.display = "";
  document.body.classList.remove("results-active");
  document.body.classList.remove("customizer-active");
  document.body.classList.remove("menu-active");
  document.body.classList.remove("display-case-active");
  document.body.classList.remove("results-transitioning");
  document.body.classList.add("gallery-active");
  const customizerEl = document.getElementById("customizer");
  if (customizerEl) customizerEl.style.display = "none";
}

function showDisplayCasePageView() {
  teardownMenuPreviewObserver();
  if (landingPage) landingPage.style.display = "none";
  if (menuPage) {
    menuPage.style.display = "none";
    menuPage.hidden = true;
  }
  if (galleryPage) {
    galleryPage.style.display = "none";
    galleryPage.hidden = true;
  }
  if (displayCasePage) {
    displayCasePage.hidden = false;
    displayCasePage.style.display = "block";
  }
  if (recommendationsPage) recommendationsPage.style.display = "";
  document.body.classList.remove("results-active");
  document.body.classList.remove("customizer-active");
  document.body.classList.remove("menu-active");
  document.body.classList.remove("gallery-active");
  document.body.classList.remove("results-transitioning");
  document.body.classList.add("display-case-active");
  const customizerEl = document.getElementById("customizer");
  if (customizerEl) customizerEl.style.display = "none";
}

function returnToLandingPage() {
  debouncedLandingHeroPreviewUpdate.cancel();
  if (guestCountInput) {
    guestCountInput.value = "";
  }
  activeHeroRecommendation = null;
  pendingLandingHeroTierSizes = null;
  landingHeroUsesBlankPreview = false;
  showLandingPageView();
  requestAnimationFrame(() => {
    void initLandingHero().then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          recenterLandingHeroGroup();
        });
      });

      window.setTimeout(() => {
        recenterLandingHeroGroup();
      }, 460);
    });
  });
  setSavedAppState({
    guests: null,
    view: "landing",
    recommendation: null,
    customizerState: null
  });
}

function openMenuPage() {
  debouncedLandingHeroPreviewUpdate.cancel();
  showMenuPageView();
  renderMenuPage();
  setSavedAppState({ view: "menu" });
}

function openGalleryPage() {
  debouncedLandingHeroPreviewUpdate.cancel();
  showGalleryPageView();
  setSavedAppState({ view: "gallery" });
}

function openDisplayCasePage() {
  debouncedLandingHeroPreviewUpdate.cancel();
  showDisplayCasePageView();
  setSavedAppState({ view: "display-case" });
}

function isSameRecommendation(left, right) {
  return Boolean(left && right && left.name === right.name && left.type === right.type);
}

function renderHeroRecommendationCard(recommendation, getBasePrice) {
  if (!heroRecommendationLabel || !heroCustomizeButton || !heroRecommendationMeta) return;

  if (!recommendation) {
    heroRecommendationLabel.innerHTML = "";
    heroRecommendationMeta.setAttribute("aria-hidden", "true");
    heroCustomizeButton.onclick = null;
    return;
  }

  heroRecommendationLabel.innerHTML = `
    <div class="recommendation-option-number">1</div>
    <div class="servings">Serves ${recommendation.servings}</div>
    <div class="recommendation-price-text">${formatPrice(getBasePrice(recommendation))}</div>
  `;

  heroRecommendationMeta.setAttribute("aria-hidden", document.body.classList.contains("results-active") ? "false" : "true");
  heroCustomizeButton.onclick = () => {
    showCustomizer(recommendation);
  };
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function getHeroPreviewElement() {
  return landingCakeHero?.querySelector("canvas") || landingCakeHero || null;
}

function getNearestPreviewRecommendationForGuests(guests) {
  return activeHeroRecommendation || getNearestTieredPreviewRecommendation(guests);
}

function isRecommendationMatch(left, right) {
  return Boolean(left && right && left.name === right.name && left.type === right.type);
}

function createHeroPreviewTransitionClone(sourceElement, sourceRect) {
  const floatingClone = document.createElement("div");
  floatingClone.classList.add("hero-shared-transition-clone");
  floatingClone.style.position = "fixed";
  floatingClone.style.left = `${sourceRect.left}px`;
  floatingClone.style.top = `${sourceRect.top}px`;
  floatingClone.style.width = `${sourceRect.width}px`;
  floatingClone.style.height = `${sourceRect.height}px`;
  floatingClone.style.pointerEvents = "none";
  floatingClone.style.zIndex = "40";
  floatingClone.style.transformOrigin = "top left";
  floatingClone.style.willChange = "transform, opacity";
  floatingClone.style.opacity = "1";

  if (sourceElement instanceof HTMLCanvasElement) {
    const canvasClone = document.createElement("canvas");
    canvasClone.width = sourceElement.width;
    canvasClone.height = sourceElement.height;
    canvasClone.style.width = "100%";
    canvasClone.style.height = "100%";

    const context = canvasClone.getContext("2d");
    if (context) {
      context.drawImage(sourceElement, 0, 0);
    }

    floatingClone.appendChild(canvasClone);
  } else {
    const nodeClone = sourceElement.cloneNode(true);
    if (nodeClone instanceof HTMLElement) {
      nodeClone.style.width = "100%";
      nodeClone.style.height = "100%";
    }
    floatingClone.appendChild(nodeClone);
  }

  return floatingClone;
}

function animateHeroPreviewIntoRecommendation(heroSnapshot, recommendation, onComplete) {
  const sourceElement = heroSnapshot?.element;
  const sourceRect = heroSnapshot?.rect;

  if (!sourceElement || !sourceRect || !recommendation || prefersReducedMotion()) {
    document.body.classList.remove("results-transitioning");
    onComplete?.();
    return;
  }

  const targetPreview = document.querySelector(
    `.recommendation-cake-3d[data-recommendation-name="${CSS.escape(recommendation.name)}"][data-recommendation-type="${CSS.escape(recommendation.type)}"]`
  );

  if (!targetPreview) {
    document.body.classList.remove("results-transitioning");
    onComplete?.();
    return;
  }

  const targetRect = targetPreview.getBoundingClientRect();
  if (!targetRect.width || !targetRect.height) {
    document.body.classList.remove("results-transitioning");
    onComplete?.();
    return;
  }

  document.body.classList.add("results-transitioning");

  const floatingClone = createHeroPreviewTransitionClone(sourceElement, sourceRect);
  const deltaX = targetRect.left - sourceRect.left;
  const deltaY = targetRect.top - sourceRect.top;
  const scaleX = targetRect.width / sourceRect.width;
  const scaleY = targetRect.height / sourceRect.height;

  targetPreview.style.opacity = "0";
  targetPreview.style.visibility = "hidden";
  document.body.appendChild(floatingClone);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      floatingClone.style.transition = `transform ${HERO_SHARED_TRANSITION_MS}ms cubic-bezier(0.19, 0.9, 0.22, 1), opacity ${HERO_SHARED_TRANSITION_MS}ms ease-out`;
      floatingClone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
      floatingClone.style.opacity = "0.96";
    });
  });

  window.setTimeout(() => {
    floatingClone.remove();
    targetPreview.style.opacity = "";
    targetPreview.style.visibility = "";
    document.body.classList.remove("results-transitioning");
    onComplete?.();
  }, HERO_SHARED_TRANSITION_MS + 40);
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
  "Red Velvet": "#8B0000",
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
  "Cinnamon Sugar Ganache": "#9E6A46",
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

const SHEET_MODEL_SCALE = 0.004;
const RECOMMENDATION_SHEET_MODEL_SCALE = 0.024;
const CUSTOMIZER_SHEET_DISPLAY_SCALE = 1.6;

const landingHeroScenes = [
  [
    { cake: "Vanilla", frosting: "Vanilla Buttercream", filling: "Strawberry Puree" },
    { cake: "Chocolate", frosting: "Chocolate Mousse", filling: "Raspberry Puree" },
    { cake: "Vanilla", frosting: "Cream Cheese", filling: "Blueberry Puree" },
    { cake: "Marble", frosting: "White Chocolate Ganache", filling: "Orange Marmalade" },
    { cake: "Vanilla", frosting: "Strawberry Cream Cheese", filling: "Passionfruit Curd" }
  ],
  [
    { cake: "Chocolate", frosting: "Chocolate Buttercream", filling: "Chocolate Mousse" },
    { cake: "Vanilla", frosting: "White Chocolate Ganache", filling: "Raspberry Puree" },
    { cake: "Lemon", frosting: "Cream Cheese", filling: "Lemon Curd" },
    { cake: "Spice", frosting: "Cinnamon Honey Buttercream", filling: "Cinnamon Sugar Ganache" },
    { cake: "Vanilla", frosting: "Raspberry Buttercream", filling: "Mixed Berry Jam" }
  ],
  [
    { cake: "Coconut", frosting: "Coconut Cream Buttercream", filling: "Vanilla Custard" },
    { cake: "Vanilla", frosting: "Strawberry Cream Cheese", filling: "Strawberry Puree" },
    { cake: "Chocolate", frosting: "Coffee Buttercream", filling: "Dulce De Leche" },
    { cake: "Lemon", frosting: "Vanilla Buttercream", filling: "Key Lime Curd" },
    { cake: "Marble", frosting: "White Chocolate Ganache", filling: "Blackberry Puree" }
  ],
  [
    { cake: "Vanilla", frosting: "Cream Cheese", filling: "Orange Marmalade" },
    { cake: "Chocolate", frosting: "Oreo Buttercream", filling: "Chocolate Mousse" },
    { cake: "Spice", frosting: "Cinnamon Honey Buttercream", filling: "Apple Pie Filling" },
    { cake: "Vanilla", frosting: "Vanilla Buttercream", filling: "Blueberry Puree" },
    { cake: "Chocolate", frosting: "Raspberry Buttercream", filling: "Raspberry Puree" }
  ]
];

let landingHeroInterval = null;
let landingHeroAnimationFrame = null;
let landingHeroRenderer = null;
let landingHeroScene = null;
let landingHeroCamera = null;
let landingHeroGroup = null;
let landingHeroTierEntries = [];
let landingHeroResizeHandler = null;
let landingHeroStepTimeouts = [];
let pendingLandingHeroTierSizes = null;
let landingHeroFrameBox = null;
let landingHeroSceneIndex = 0;
let landingHeroUsesBlankPreview = false;

function debounce(callback, wait) {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      callback(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (!timeoutId) return;
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  return debounced;
}

function parseGuestCountValue(rawValue) {
  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return null;
  return parsedValue;
}

function scoreTieredOptionForGuests(tierOption, guests) {
  let excess = tierOption.servings - guests;
  const tierCount = tierOption.tiers.length;
  const smallestTier = Math.min(...tierOption.tiers);

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

  return excess;
}

function getNearestTieredPreviewRecommendation(guests) {
  if (!Number.isFinite(guests) || guests <= 0) return null;

  const viableTieredOptions = tieredOptions.filter((tierOption) => tierOption.servings >= guests);
  const candidateOptions = viableTieredOptions.length ? viableTieredOptions : tieredOptions;

  const bestTierOption = candidateOptions.reduce((bestOption, tierOption) => {
    const score = viableTieredOptions.length
      ? scoreTieredOptionForGuests(tierOption, guests)
      : Math.abs(tierOption.servings - guests);

    if (!bestOption || score < bestOption.score) {
      return { tierOption, score };
    }

    return bestOption;
  }, null)?.tierOption;

  if (!bestTierOption) return null;

  return {
    name: `${bestTierOption.tiers.slice().sort((a, b) => a - b).map((size) => `${size}"`).join(' + ')} tiered cake`,
    servings: bestTierOption.servings,
    type: "tiered",
    tiers: bestTierOption.tiers.slice().sort((a, b) => a - b)
  };
}

function getFlavorColor(map, key, fallback) {
  return map[key] || fallback;
}

function colorToThree(hex) {
  return new THREE.Color(hex || "#ffffff");
}

function setLandingHeroTierTargets(sceneIndex) {
  if (!landingHeroTierEntries.length) return;

  const sceneConfig = landingHeroScenes[sceneIndex % landingHeroScenes.length];

  landingHeroTierEntries.forEach((entry, index) => {
    const combo = sceneConfig[index];
    if (!combo) return;

    entry.targetColors = {
      cake: colorToThree(getFlavorColor(cakeColorMap, combo.cake, defaultTierColors.cake)),
      frosting: colorToThree(getFlavorColor(frostingColorMap, combo.frosting, defaultTierColors.frosting)),
      filling: combo.filling
        ? colorToThree(getFlavorColor(fillingColorMap, combo.filling, defaultTierColors.filling))
        : null
    };
  });
}

function applyLandingHeroSceneImmediately(sceneIndex) {
  if (!landingHeroTierEntries.length) return;

  const sceneConfig = landingHeroScenes[sceneIndex % landingHeroScenes.length];

  landingHeroTierEntries.forEach((entry, index) => {
    const combo = sceneConfig[index];
    if (!combo) return;

    const colors = {
      cake: colorToThree(getFlavorColor(cakeColorMap, combo.cake, defaultTierColors.cake)),
      frosting: colorToThree(getFlavorColor(frostingColorMap, combo.frosting, defaultTierColors.frosting)),
      filling: combo.filling
        ? colorToThree(getFlavorColor(fillingColorMap, combo.filling, defaultTierColors.filling))
        : null
    };

    entry.targetColors = colors;
    entry.currentColors = {
      cake: colors.cake.clone(),
      frosting: colors.frosting.clone(),
      filling: colors.filling ? colors.filling.clone() : null
    };

    entry.object.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        const role = material.userData?.role;
        const color = entry.currentColors[role];

        if (role === "filling") {
          material.transparent = !color;
          material.opacity = color ? 1 : 0;
        }

        if (color && material.color) {
          material.color.copy(color);
        }
      });
    });
  });
}

function clearLandingHeroStepTimeouts() {
  landingHeroStepTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  landingHeroStepTimeouts = [];
}

function getVisibleLandingHeroBox() {
  const visibleEntries = landingHeroTierEntries
    .filter((entry) => entry.object.visible)
    .slice()
    .sort((a, b) => b.size - a.size);

  if (!visibleEntries.length) return null;

  const visibleBoxes = visibleEntries.map((entry) => new THREE.Box3().setFromObject(entry.object));
  return visibleBoxes.reduce((combinedBox, box) => combinedBox.union(box), visibleBoxes[0].clone());
}

function getLandingHeroEntriesBox(entries = landingHeroTierEntries) {
  const boxes = entries
    .filter((entry) => entry.object)
    .map((entry) => new THREE.Box3().setFromObject(entry.object));

  if (!boxes.length) return null;
  return boxes.reduce((combinedBox, box) => combinedBox.union(box), boxes[0].clone());
}

function frameLandingHeroCamera(box = getVisibleLandingHeroBox()) {
  if (!landingHeroCamera || !box || box.isEmpty()) return;

  const size = new THREE.Vector3();
  box.getSize(size);

  const width = Math.max(size.x, 0.001);
  const height = Math.max(size.y, 0.001);
  const verticalFov = THREE.MathUtils.degToRad(landingHeroCamera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * landingHeroCamera.aspect);
  const distanceForHeight = height / (2 * Math.tan(verticalFov / 2));
  const distanceForWidth = width / (2 * Math.tan(horizontalFov / 2));
  const distance = Math.max(distanceForHeight, distanceForWidth) * LANDING_HERO_FRAME_PADDING;

  landingHeroCamera.position.set(0, 0, distance);
  landingHeroCamera.lookAt(0, 0, 0);
  landingHeroCamera.near = Math.max(distance / 100, 0.01);
  landingHeroCamera.far = Math.max(distance * 100, 100);
  landingHeroCamera.updateProjectionMatrix();
}

function getLandingHeroTargetMetrics() {
  if (!landingHeroGroup || !landingHeroCamera || !landingCakeHero || !calculatorUi) return;

  const heroRect = landingCakeHero.getBoundingClientRect();
  const calculatorRect = calculatorUi.getBoundingClientRect();
  if (!heroRect.height || !calculatorRect.height) return;

  const targetPixelX = (calculatorRect.left - heroRect.left) + (calculatorRect.width / 2);
  const targetPixelY = (calculatorRect.top - heroRect.top) + (calculatorRect.height / 2);
  const ndc = new THREE.Vector2(
    (targetPixelX / heroRect.width) * 2 - 1,
    -((targetPixelY / heroRect.height) * 2 - 1)
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, landingHeroCamera);

  // Intersect the ray with the hero's center plane so the cake center can lock to the field center.
  const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const targetPoint = new THREE.Vector3();
  const didIntersect = raycaster.ray.intersectPlane(targetPlane, targetPoint);

  return didIntersect ? { heroRect, targetPixelY, targetPoint } : null;
}

function recenterLandingHeroGroup() {
  if (!landingHeroGroup || !landingHeroTierEntries.length) return;

  landingHeroGroup.position.set(0, 0, 0);
  landingHeroGroup.scale.setScalar(LANDING_HERO_BASE_SCALE);
  landingHeroGroup.updateWorldMatrix(true, true);

  const heroBox = getVisibleLandingHeroBox();
  if (!heroBox) return;

  const heroCenter = new THREE.Vector3();
  heroBox.getCenter(heroCenter);

  landingHeroGroup.position.x -= heroCenter.x;
  landingHeroGroup.position.y -= heroCenter.y;
  landingHeroGroup.position.z -= heroCenter.z;
  landingHeroGroup.updateWorldMatrix(true, true);
  frameLandingHeroCamera(landingHeroFrameBox || heroBox);

  const targetMetrics = getLandingHeroTargetMetrics();
  if (targetMetrics) {
    landingHeroGroup.position.y += targetMetrics.targetPoint.y;
    landingHeroGroup.updateWorldMatrix(true, true);
  }
}

function scheduleLandingHeroRecenters() {
  requestAnimationFrame(() => {
    recenterLandingHeroGroup();
    requestAnimationFrame(recenterLandingHeroGroup);
  });

  window.setTimeout(recenterLandingHeroGroup, 250);
  window.setTimeout(recenterLandingHeroGroup, 700);
}

function setLandingHeroTierConfiguration(activeTierSizes = null) {
  if (!landingHeroGroup || !landingHeroTierEntries.length) return;

  const activeSizes = activeTierSizes ? new Set(activeTierSizes) : null;

  landingHeroTierEntries.forEach((entry) => {
    entry.object.visible = !activeSizes || activeSizes.has(entry.size);
  });

  const visibleEntries = landingHeroTierEntries
    .filter((entry) => entry.object.visible)
    .slice()
    .sort((a, b) => b.size - a.size);

  let currentHeight = 0;
  visibleEntries.forEach((entry) => {
    entry.object.position.set(0, currentHeight, 0);
    currentHeight += entry.tierHeight;
  });

  recenterLandingHeroGroup();
}

function queueLandingHeroSceneTransition(sceneIndex) {
  if (!landingHeroTierEntries.length) return;

  const sceneConfig = landingHeroScenes[sceneIndex % landingHeroScenes.length];

  clearLandingHeroStepTimeouts();

  landingHeroTierEntries.forEach((entry, index) => {
    const combo = sceneConfig[index];
    if (!combo) return;

    const timeoutId = window.setTimeout(() => {
      entry.targetColors = {
        cake: colorToThree(getFlavorColor(cakeColorMap, combo.cake, defaultTierColors.cake)),
        frosting: colorToThree(getFlavorColor(frostingColorMap, combo.frosting, defaultTierColors.frosting)),
        filling: combo.filling
          ? colorToThree(getFlavorColor(fillingColorMap, combo.filling, defaultTierColors.filling))
          : null
      };
    }, index * 7000);

    landingHeroStepTimeouts.push(timeoutId);
  });
}

function applyLandingHeroBlankPreviewColors() {
  if (!landingHeroTierEntries.length) return;

  clearLandingHeroStepTimeouts();

  landingHeroTierEntries.forEach((entry) => {
    const colors = {
      cake: colorToThree(defaultTierColors.cake),
      frosting: colorToThree(defaultTierColors.frosting),
      filling: null
    };

    entry.targetColors = colors;
    entry.currentColors = {
      cake: colors.cake.clone(),
      frosting: colors.frosting.clone(),
      filling: null
    };

    applyTierColorsToObject(entry.object, {
      flavor: "",
      frosting: "",
      filling: ""
    });

    entry.object.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        const role = material.userData?.role;

        if (role === "filling") {
          material.transparent = true;
          material.opacity = 0;
          return;
        }

        const current = entry.currentColors[role];
        if (current && material.color) {
          material.color.copy(current);
        }
      });
    });
  });
}

function syncLandingHeroPreviewMode(useBlankPreview) {
  if (!landingHeroTierEntries.length) return;
  if (landingHeroUsesBlankPreview === useBlankPreview) return;

  landingHeroUsesBlankPreview = useBlankPreview;

  if (useBlankPreview) {
    applyLandingHeroBlankPreviewColors();
    return;
  }

  applyLandingHeroSceneImmediately(landingHeroSceneIndex);
  queueLandingHeroSceneTransition(landingHeroSceneIndex);
}

function updateLandingHeroTierColors() {
  if (landingHeroUsesBlankPreview) return;

  landingHeroTierEntries.forEach((entry) => {
    const { object, currentColors, targetColors } = entry;
    if (!object || !targetColors) return;

    Object.keys(currentColors).forEach((role) => {
      const current = currentColors[role];
      const target = targetColors[role];

      if (!current || !target) return;
      current.lerp(target, 0.08);
    });

    applyTierColorsToObject(object, {
      flavor: "__landing__",
      frosting: "__landing__",
      filling: targetColors.filling ? "__landing__" : ""
    });

    object.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        const role = material.userData?.role;
        const current = currentColors[role];

        if (role === "filling") {
          material.transparent = !current;
          material.opacity = current ? 1 : 0;
        }

        if (current && material.color) {
          material.color.copy(current);
        }
      });
    });
  });
}

async function initLandingHero() {
  if (!landingCakeHero) return;

  if (landingHeroInterval) {
    clearInterval(landingHeroInterval);
    landingHeroInterval = null;
  }

  clearLandingHeroStepTimeouts();

  if (landingHeroAnimationFrame) {
    cancelAnimationFrame(landingHeroAnimationFrame);
    landingHeroAnimationFrame = null;
  }

  if (landingHeroResizeHandler) {
    window.removeEventListener("resize", landingHeroResizeHandler);
    landingHeroResizeHandler = null;
  }

  landingCakeHero.innerHTML = "";
  landingHeroTierEntries = [];
  landingHeroFrameBox = null;

  landingHeroScene = new THREE.Scene();
  landingHeroScene.background = null;

  const width = landingCakeHero.clientWidth || 620;
  const height = landingCakeHero.clientHeight || 520;

  landingHeroCamera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  landingHeroCamera.position.set(0, 0.92, 2.62);
  landingHeroCamera.lookAt(0, 0.72, 0);

  landingHeroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  landingHeroRenderer.setPixelRatio(window.devicePixelRatio);
  landingHeroRenderer.setSize(width, height);
  landingCakeHero.appendChild(landingHeroRenderer.domElement);

  const keyLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.key);
  keyLight.position.set(3.5, 5.5, 4);
  landingHeroScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.fill);
  fillLight.position.set(-3.5, 3.5, 3);
  landingHeroScene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.rim);
  rimLight.position.set(0, 2.5, -4);
  landingHeroScene.add(rimLight);

  landingHeroScene.add(new THREE.AmbientLight(0xffffff, CAKE_LIGHTING.ambient));

  landingHeroGroup = new THREE.Group();
  landingHeroScene.add(landingHeroGroup);

  const localLoader = new GLTFLoader();
  const tierSizes = [14, 12, 10, 8, 6];
  let currentHeight = 0;

  for (const size of tierSizes) {
    const gltf = await new Promise((resolve, reject) => {
      localLoader.load(`models/tier_${size}.glb`, resolve, undefined, reject);
    });

    const tierModel = gltf.scene;
    prepareTierMaterials(tierModel);

    const box = new THREE.Box3().setFromObject(tierModel);
    const tierHeight = box.max.y - box.min.y;
    const tierCenterX = (box.min.x + box.max.x) / 2;
    const tierCenterZ = (box.min.z + box.max.z) / 2;

    tierModel.position.set(-tierCenterX, -box.min.y, -tierCenterZ);

    const tier = new THREE.Group();
    tier.add(tierModel);

    tier.position.set(0, currentHeight, 0);
    landingHeroGroup.add(tier);

    landingHeroTierEntries.unshift({
      size,
      tierHeight,
      object: tier,
      currentColors: {
        cake: colorToThree(defaultTierColors.cake),
        frosting: colorToThree(defaultTierColors.frosting),
        filling: colorToThree(defaultTierColors.filling)
      },
      targetColors: {
        cake: colorToThree(defaultTierColors.cake),
        frosting: colorToThree(defaultTierColors.frosting),
        filling: colorToThree(defaultTierColors.filling)
      }
    });

    currentHeight += tierHeight;
  }

  landingHeroGroup.position.set(0, 0, 0);
  landingHeroGroup.scale.setScalar(LANDING_HERO_BASE_SCALE);
  landingHeroGroup.updateWorldMatrix(true, true);
  landingHeroFrameBox = getLandingHeroEntriesBox();

  landingHeroSceneIndex = 0;
  landingHeroUsesBlankPreview = false;
  applyLandingHeroSceneImmediately(landingHeroSceneIndex);
  setLandingHeroTierConfiguration(pendingLandingHeroTierSizes);

  landingHeroInterval = window.setInterval(() => {
    if (landingHeroUsesBlankPreview) return;
    landingHeroSceneIndex = (landingHeroSceneIndex + 1) % landingHeroScenes.length;
    queueLandingHeroSceneTransition(landingHeroSceneIndex);
  }, landingHeroTierEntries.length * 7000);

  const animateLandingHero = () => {
    landingHeroAnimationFrame = requestAnimationFrame(animateLandingHero);

    updateLandingHeroTierColors();
    landingHeroRenderer.render(landingHeroScene, landingHeroCamera);
  };

  animateLandingHero();

  landingHeroResizeHandler = () => {
    if (!landingCakeHero || !landingHeroRenderer || !landingHeroCamera) return;
    const nextWidth = landingCakeHero.clientWidth || 560;
    const nextHeight = landingCakeHero.clientHeight || 430;
    landingHeroCamera.aspect = nextWidth / nextHeight;
    landingHeroCamera.updateProjectionMatrix();
    landingHeroRenderer.setSize(nextWidth, nextHeight);
    recenterLandingHeroGroup();
  };

  window.addEventListener("resize", landingHeroResizeHandler);

  scheduleLandingHeroRecenters();
}

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

  if (recommendation.type === "cupcakes") {
    return [
      {
        kind: "cupcakes",
        cupcakeCount: recommendation.cupcakeCount || sizes[0],
        label: `${recommendation.cupcakeCount || sizes[0]} Cupcakes`
      }
    ];
  }

  if (recommendation.type === "single-cupcakes") {
    const roundSize = recommendation.roundSize || sizes[0];
    const cupcakeCount = recommendation.cupcakeCount || sizes[sizes.length - 1];

    return [
      {
        kind: "main",
        size: roundSize,
        label: `${roundSize}" Round`
      },
      {
        kind: "cupcakes",
        cupcakeCount,
        label: `${cupcakeCount} Cupcakes`
      }
    ];
  }

  if (recommendation.type === "tiered-cupcakes") {
    const cupcakeCount = recommendation.cupcakeCount || sizes[sizes.length - 1];
    const tierSizes = recommendation.tierSizes || sizes.slice(0, -1);

    return [
      ...tierSizes.map(size => ({
        kind: "main",
        size,
        label: `${size}" Round`
      })),
      {
        kind: "cupcakes",
        cupcakeCount,
        label: `${cupcakeCount} Cupcakes`
      }
    ];
  }

  if (recommendation.type === "single-sheet") {
    return [
      {
        kind: "main",
        sheetModelSrc: getSheetCakeModelSrc(recommendation.name),
        label: getSheetCakeLabel(recommendation.name)
      }
    ];
  }

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
        sheetModelSrc: getSheetCakeModelSrc(recommendation.name),
        label: `${getSheetCakeLabel(recommendation.name)} Backup`
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

function getSheetCakeModelSrc(recommendationName) {
  if (recommendationName.includes("1/4")) return "models/sheet_9x13.glb";
  if (recommendationName.includes("1/2")) return "models/sheet_12x18.glb";
  return "models/sheet_18x26.glb";
}

function normalizeCakePartScale(object, part = {}) {
  if (part.sheetModelSrc) {
    object.scale.setScalar(part.sheetScale || SHEET_MODEL_SCALE);
  }
}

function applyCustomizerCakeDisplayScale(object, part = {}) {
  if (part.sheetModelSrc) {
    object.scale.multiplyScalar(CUSTOMIZER_SHEET_DISPLAY_SCALE);
  }
}

function normalizeCakeModelBounds(object) {
  const box = new THREE.Box3().setFromObject(object);
  const centerX = (box.min.x + box.max.x) / 2;
  const centerZ = (box.min.z + box.max.z) / 2;

  object.position.x -= centerX;
  object.position.y -= box.min.y;
  object.position.z -= centerZ;

  return {
    height: box.max.y - box.min.y,
    width: box.max.x - box.min.x,
    depth: box.max.z - box.min.z
  };
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
      const role = getMaterialRole(clonedMaterial.name);

      clonedMaterial.roughness = role === "cake" ? 0.54 : (clonedMaterial.roughness ?? 0.48);
      clonedMaterial.metalness = 0.0;
      clonedMaterial.envMapIntensity = role === "frosting" ? 0.55 : 0.35;
      clonedMaterial.userData = {
        ...clonedMaterial.userData,
        role
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
    if (child.userData?.isDecorMesh) return;

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

function hexToModelViewerFactor(hex) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  const int = Number.parseInt(value, 16);
  return [
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
    1
  ];
}

function applyBlankTierColorsToModelViewer(viewer) {
  const applyColors = () => {
    const materials = viewer.model?.materials || [];
    materials.forEach((material) => {
      const role = getMaterialRole(material.name || "");
      if (!role) return;

      if (role === "filling") {
        material.pbrMetallicRoughness?.setBaseColorFactor([1, 1, 1, 0]);
        material.setAlphaMode?.("BLEND");
        return;
      }

      const hex = defaultTierColors[role];
      if (hex) {
        material.pbrMetallicRoughness?.setBaseColorFactor(hexToModelViewerFactor(hex));
      }
    });
  };

  if (viewer.model) {
    applyColors();
  } else {
    viewer.addEventListener("load", applyColors, { once: true });
  }
}

async function loadCakePartModel(localLoader, part) {
  const src = part.sheetModelSrc || `models/tier_${part.size}.glb`;
  return new Promise((resolve, reject) => {
    localLoader.load(src, (gltf) => {
      normalizeCakePartScale(gltf.scene, part);
      resolve(gltf);
    }, undefined, reject);
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

function formatSignatureFlavorName(slug = "") {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const menuSignatureFlavors = {
  "original-vanilla": { cake: "Vanilla", frosting: "Vanilla Buttercream", filling: "Vanilla Custard" },
  "passionberry": { cake: "Vanilla", frosting: "Raspberry Buttercream", filling: "Passionfruit Curd" },
  "blueberry-cheesecake": { cake: "Vanilla", frosting: "Cream Cheese", filling: "Blueberry Puree" },
  "cinnamon-roll": { cake: "Vanilla", frosting: "Cream Cheese", filling: "Cinnamon Sugar Ganache" },
  "london-fog": { cake: "Vanilla", frosting: "Cream Cheese", filling: "Orange Marmalade" },
  "strawberry-shortcake": { cake: "Vanilla", frosting: "Cream Cheese", filling: "Strawberry Puree" },
  "strawberry-key-lime": { cake: "Vanilla", frosting: "Strawberry Cream Cheese", filling: "Key Lime Curd" },
  "white-chocolate-raspberry": { cake: "Vanilla", frosting: "White Chocolate Ganache", filling: "Raspberry Puree" },
  "pancake": { cake: "Vanilla", frosting: "White Chocolate Ganache", filling: "Vanilla Custard" },
  "zebra": { cake: "Marble", frosting: "Raspberry Buttercream", filling: "Blackberry Puree" },
  "red-velvet": { cake: "Marble", frosting: "White Chocolate Ganache", filling: "" },
  "original-chocolate": { cake: "Chocolate", frosting: "Chocolate Mousse", filling: "" },
  "tuxedo": { cake: "Chocolate", frosting: "Chocolate Mousse", filling: "White Chocolate Ganache" },
  "raspberry-chocolate-mousse": { cake: "Chocolate", frosting: "Chocolate Mousse", filling: "Raspberry Puree" },
  "cookies-and-cream": { cake: "Chocolate", frosting: "Oreo Buttercream", filling: "" },
  "black-forrest": { cake: "Chocolate", frosting: "Chocolate Buttercream", filling: "Mixed Berry Jam" },
  "mocha": { cake: "Chocolate", frosting: "Coffee Buttercream", filling: "Dulce De Leche" },
  "lemon-blueberry": { cake: "Lemon", frosting: "Lemon Buttercream", filling: "Blueberry Puree" },
  "carrot": { cake: "Spice", frosting: "Cream Cheese", filling: "" },
  "apple-cider": { cake: "Spice", frosting: "Cinnamon Honey Buttercream", filling: "Apple Pie Filling" },
  "horchata": { cake: "Spice", frosting: "Horchata Buttercream", filling: "Dulce De Leche" },
  "cranberry-orange": { cake: "Spice", frosting: "Cranberry Buttercream", filling: "Orange Marmalade" },
  "coconut-cream": { cake: "Coconut", frosting: "Coconut Cream Buttercream", filling: "Vanilla Custard" },
  "key-lime-coconut": { cake: "Coconut", frosting: "White Chocolate Ganache", filling: "Key Lime Curd" },
  "almond-joy": { cake: "Almond", frosting: "Coconut Cream Buttercream", filling: "Chocolate Mousse" },
  "bee-sting": { cake: "Almond", frosting: "Cinnamon Honey Buttercream", filling: "Vanilla Custard" }
};

const menuSignatureFlavorOrder = [
  "original-vanilla",
  "blueberry-cheesecake",
  "cinnamon-roll",
  "london-fog",
  "pancake",
  "passionberry",
  "strawberry-key-lime",
  "strawberry-shortcake",
  "white-chocolate-raspberry",
  "original-chocolate",
  "black-forrest",
  "cookies-and-cream",
  "mocha",
  "raspberry-chocolate-mousse",
  "red-velvet",
  "tuxedo",
  "zebra",
  "almond-joy",
  "coconut-cream",
  "cranberry-orange",
  "key-lime-coconut",
  "lemon-blueberry",
  "apple-cider",
  "bee-sting",
  "carrot",
  "horchata"
];

function getMenuFlavorCards() {
  return menuSignatureFlavorOrder
    .filter((slug) => menuSignatureFlavors[slug])
    .map((slug) => ({
      slug,
      name: formatSignatureFlavorName(slug),
      selection: menuSignatureFlavors[slug]
    }));
}

function buildMenuFlavorCake3D(scene, selection) {
  return buildRecommendationCake3D(scene, [10]).then((group) => {
    applyTierColorsToObject(group, selection);
    return group;
  });
}

function disposeMenuPreviewObject(root) {
  root?.traverse?.((child) => {
    if (child.geometry) {
      child.geometry.dispose?.();
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => material.dispose?.());
  });
}

function initMenuFlavorCake3D(container, selection) {
  container.innerHTML = "";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f8f8);

  const width = container.clientWidth || 320;
  const height = container.clientHeight || 270;
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.key);
  light.position.set(3, 5, 3);
  scene.add(light);

  const fillLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.fill);
  fillLight.position.set(-3, 3, 3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.rim);
  rimLight.position.set(0, 2.4, -3.4);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0xffffff, CAKE_LIGHTING.ambient);
  scene.add(ambient);

  let animationFrameId = null;
  let isDisposed = false;
  let cakeGroup = null;

  buildMenuFlavorCake3D(scene, selection).then((group) => {
    if (isDisposed) {
      disposeMenuPreviewObject(group);
      return;
    }

    cakeGroup = group;
    group.scale.setScalar(1.52);
    camera.position.set(0, 0.78, 1.78);
    camera.lookAt(0, 0.46, 0);
  });

  function animateCard() {
    if (isDisposed) return;
    animationFrameId = requestAnimationFrame(animateCard);
    renderer.render(scene, camera);
  }

  animateCard();

  return () => {
    isDisposed = true;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    if (cakeGroup) {
      disposeMenuPreviewObject(cakeGroup);
    }
    renderer.dispose();
    container.innerHTML = "";
  };
}

function teardownMenuPreviewObserver() {
  if (menuPreviewObserver) {
    menuPreviewObserver.disconnect();
    menuPreviewObserver = null;
  }

  if (!menuGrid) return;

  menuGrid.querySelectorAll(".menu-flavor-preview").forEach((preview) => {
    if (typeof preview._menuPreviewCleanup === "function") {
      preview._menuPreviewCleanup();
      preview._menuPreviewCleanup = null;
    }
  });
}

function setupMenuPreviewObserver() {
  if (!menuGrid) return;

  teardownMenuPreviewObserver();

  menuPreviewObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const preview = entry.target;
      const flavorSlug = preview.dataset.flavorSlug;
      const selection = flavorSlug ? menuSignatureFlavors[flavorSlug] : null;

      if (!selection) return;

      if (entry.isIntersecting) {
        if (!preview._menuPreviewCleanup) {
          preview._menuPreviewCleanup = initMenuFlavorCake3D(preview, selection);
        }
      } else if (preview._menuPreviewCleanup) {
        preview._menuPreviewCleanup();
        preview._menuPreviewCleanup = null;
      }
    });
  }, {
    rootMargin: "240px 0px"
  });

  menuGrid.querySelectorAll(".menu-flavor-preview").forEach((preview) => {
    menuPreviewObserver.observe(preview);
  });
}

function createMenuBlankCakePreview(cake) {
  const viewer = document.createElement("model-viewer");
  viewer.className = "menu-blank-cake-preview";
  viewer.src = cake.type === "sheet" ? getSheetCakeModelSrc(cake.name) : `models/tier_${cake.size}.glb`;
  viewer.alt = `${cake.name} preview`;
  viewer.setAttribute("camera-orbit", "0deg 72deg 2.2m");
  viewer.setAttribute("field-of-view", "28deg");
  viewer.setAttribute("interaction-prompt", "none");
  viewer.setAttribute("disable-zoom", "");
  viewer.setAttribute("disable-pan", "");
  viewer.setAttribute("aria-hidden", "true");
  applyBlankTierColorsToModelViewer(viewer);
  return viewer;
}

function createMenuTierStackPreview(sizes) {
  const preview = document.createElement("div");
  preview.className = "menu-tier-cake-preview recommendation-cake-3d";
  preview.setAttribute("aria-hidden", "true");
  return preview;
}

function renderMenuPage() {
  if (!menuGrid) return;

  if (menuGrid.dataset.rendered === "true") {
    setupMenuPreviewObserver();
    return;
  }

  menuGrid.innerHTML = "";

  const menuTabs = document.createElement("div");
  menuTabs.className = "menu-section-tabs";
  menuTabs.setAttribute("role", "tablist");
  menuTabs.setAttribute("aria-label", "Menu sections");
  menuTabs.innerHTML = `
    <button type="button" id="menu-page-title" class="menu-section-tab is-active" data-menu-tab="flavor" role="tab" aria-selected="true" aria-controls="menu-panel-flavor">Flavor</button>
    <button type="button" id="menu-tab-size" class="menu-section-tab" data-menu-tab="size" role="tab" aria-selected="false" aria-controls="menu-panel-size">Size</button>
    <button type="button" id="menu-tab-tier" class="menu-section-tab" data-menu-tab="tier" role="tab" aria-selected="false" aria-controls="menu-panel-tier">Tier</button>
  `;
  menuGrid.appendChild(menuTabs);

  const content = document.createElement("div");
  content.className = "menu-section-content";

  const flavorSection = document.createElement("section");
  flavorSection.id = "menu-panel-flavor";
  flavorSection.className = "menu-section menu-section-flavor is-active";
  flavorSection.dataset.menuPanel = "flavor";
  flavorSection.setAttribute("role", "tabpanel");
  flavorSection.setAttribute("aria-labelledby", "menu-page-title");
  const flavorGrid = document.createElement("div");
  flavorGrid.className = "menu-flavor-grid";

  getMenuFlavorCards().forEach((flavor) => {
    const card = document.createElement("article");
    card.className = "menu-flavor-card";

    const text = document.createElement("div");
    text.className = "menu-flavor-copy";
    text.innerHTML = `
      <h2 class="menu-flavor-name">${flavor.name}</h2>
      <p class="menu-flavor-combo">${flavor.selection.cake} Cake</p>
      <p class="menu-flavor-combo">${flavor.selection.frosting}${flavor.selection.filling ? `, ${flavor.selection.filling}` : ""}</p>
    `;

    const preview = document.createElement("div");
    preview.className = "menu-flavor-preview recommendation-cake-3d";
    preview.setAttribute("aria-hidden", "true");
    preview.dataset.flavorSlug = flavor.slug;

    card.appendChild(text);
    card.appendChild(preview);
    flavorGrid.appendChild(card);
  });

  flavorSection.appendChild(flavorGrid);
  content.appendChild(flavorSection);

  const sizeSection = document.createElement("section");
  sizeSection.id = "menu-panel-size";
  sizeSection.className = "menu-section menu-section-size";
  sizeSection.dataset.menuPanel = "size";
  sizeSection.setAttribute("role", "tabpanel");
  sizeSection.setAttribute("aria-labelledby", "menu-tab-size");
  sizeSection.hidden = true;

  const sizeGrid = document.createElement("div");
  sizeGrid.className = "menu-option-grid menu-size-grid";

  cakeOptions.forEach((cake) => {
    const isSheet = cake.type === "sheet";
    const option = document.createElement("article");
    option.className = "menu-option-card";
    const preview = createMenuBlankCakePreview(cake);
    option.innerHTML = `
      <div class="menu-option-copy">
        <h3 class="menu-option-name">${isSheet ? cake.name.replace(" cake", "") : `${cake.size}" Round`}</h3>
        <p class="menu-option-meta">Serves ${cake.servings}</p>
      </div>
    `;
    option.prepend(preview);
    sizeGrid.appendChild(option);
  });

  sizeSection.appendChild(sizeGrid);
  content.appendChild(sizeSection);

  const tierSection = document.createElement("section");
  tierSection.id = "menu-panel-tier";
  tierSection.className = "menu-section menu-section-tier";
  tierSection.dataset.menuPanel = "tier";
  tierSection.setAttribute("role", "tabpanel");
  tierSection.setAttribute("aria-labelledby", "menu-tab-tier");
  tierSection.hidden = true;

  const tierGrid = document.createElement("div");
  tierGrid.className = "menu-option-grid menu-tier-grid";

  tieredOptions.forEach((tierOption) => {
    const sizes = tierOption.tiers.slice().sort((a, b) => a - b);
    const recommendation = {
      name: `${sizes.map((size) => `${size}"`).join(" + ")} tiered cake`,
      type: "tiered",
      servings: tierOption.servings
    };
    const option = document.createElement("article");
    option.className = "menu-option-card menu-tier-option-card";
    const preview = createMenuTierStackPreview(sizes);
    option.innerHTML = `
      <div class="menu-option-copy">
        <h3 class="menu-option-name">${sizes.length}-Tier</h3>
        <p class="menu-option-meta">${sizes.map((size) => `${size}"`).join(" / ")}</p>
        <p class="menu-option-meta">Serves ${tierOption.servings}</p>
      </div>
    `;
    option.prepend(preview);
    tierGrid.appendChild(option);
    initRecommendationCake3D(preview, recommendation);
  });

  tierSection.appendChild(tierGrid);
  content.appendChild(tierSection);
  menuGrid.appendChild(content);

  const setActiveMenuSection = (sectionName) => {
    menuTabs.querySelectorAll(".menu-section-tab").forEach((button) => {
      const isActive = button.dataset.menuTab === sectionName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    content.querySelectorAll(".menu-section").forEach((section) => {
      const isActive = section.dataset.menuPanel === sectionName;
      section.classList.toggle("is-active", isActive);
      section.hidden = !isActive;
    });
  };

  menuTabs.querySelectorAll(".menu-section-tab").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveMenuSection(button.dataset.menuTab || "flavor");
    });
  });

  menuGrid.dataset.rendered = "true";
  setupMenuPreviewObserver();
}

function formatRecommendationDisplayName(recommendation) {
  const name = recommendation?.name || "";
  const sizes = (name.match(/\d+/g) || []).map(Number);

  if (recommendation?.type === "cupcakes") {
    return `${recommendation.cupcakeCount || sizes[0] || 0} Cupcakes`;
  }

  if (recommendation?.type === "single-cupcakes") {
    const roundSize = recommendation.roundSize || sizes[0];
    const cupcakeCount = recommendation.cupcakeCount || sizes[sizes.length - 1];
    return `${roundSize}" Round + ${cupcakeCount} Cupcakes`;
  }

  if (recommendation?.type === "tiered-cupcakes") {
    const cupcakeCount = recommendation.cupcakeCount || sizes[sizes.length - 1];
    const tierSizes = (recommendation.tierSizes || sizes.slice(0, -1)).slice().sort((a, b) => a - b);
    return `${tierSizes.map((size) => `${size}`).join(" + ")}" Tiered + ${cupcakeCount} Cupcakes`;
  }

  if (recommendation?.type === "tiered") {
    return `${sizes.sort((a, b) => a - b).map((size) => `${size}`).join(" + ")}" Tiered`;
  }

  if (recommendation?.type === "tiered-round-backup") {
    const tierSizes = sizes.slice(0, -1).sort((a, b) => a - b);
    const backupSize = sizes[sizes.length - 1];
    return `${tierSizes.map((size) => `${size}`).join(" + ")}" Tiered, ${backupSize}" Backup`;
  }

  return name.replace(/\b([a-z])/g, (match) => match.toUpperCase());
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

function createCupcakePreviewNode(count) {
  const cupcakePreview = document.createElement("div");
  cupcakePreview.className = "cupcake-preview";
  cupcakePreview.setAttribute("aria-label", `${count} cupcakes`);

  const grid = document.createElement("div");
  grid.className = "cupcake-preview-grid";
  const visibleCount = Math.min(count || CUPCAKE_QUANTITY_STEP, CUPCAKE_QUANTITY_STEP);

  for (let i = 0; i < visibleCount; i++) {
    const cupcake = document.createElement("span");
    cupcake.className = "cupcake-preview-cupcake";
    cupcake.innerHTML = `
      <span class="cupcake-preview-frosting"></span>
      <span class="cupcake-preview-liner"></span>
    `;
    grid.appendChild(cupcake);
  }

  const label = document.createElement("div");
  label.className = "cupcake-preview-label";
  label.textContent = `${count} Cupcakes`;

  cupcakePreview.appendChild(grid);
  cupcakePreview.appendChild(label);
  return cupcakePreview;
}

function getRecommendationCardSections(recommendation) {
  const sizes = (recommendation.name.match(/\d+/g) || []).map(Number);

  if (recommendation.type === "cupcakes") {
    return [
      {
        title: "Cupcakes",
        detail: `${recommendation.cupcakeCount || sizes[0]}`,
        visualType: "cupcakes",
        cupcakeCount: recommendation.cupcakeCount || sizes[0]
      }
    ];
  }

  if (recommendation.type === "single-cupcakes") {
    const roundSize = recommendation.roundSize || sizes[0];
    const cupcakeCount = recommendation.cupcakeCount || sizes[sizes.length - 1];
    return [
      {
        title: "Round Cake",
        detail: `${roundSize}"`,
        visualType: "3d",
        recommendation: {
          name: `${roundSize}" cake`,
          type: "single",
          servings: recommendation.servings - cupcakeCount
        }
      },
      {
        title: "Cupcakes",
        detail: `${cupcakeCount}`,
        visualType: "cupcakes",
        compact: true,
        cupcakeCount
      }
    ];
  }

  if (recommendation.type === "tiered-cupcakes") {
    const cupcakeCount = recommendation.cupcakeCount || sizes[sizes.length - 1];
    const tierSizes = (recommendation.tierSizes || sizes.slice(0, -1)).slice().sort((a, b) => a - b);
    return [
      {
        title: "Tiered Cake",
        detail: getTierDisplayText(tierSizes),
        visualType: "3d",
        recommendation: {
          name: `${getTierDisplayText(tierSizes)} tiered cake`,
          type: "tiered",
          servings: recommendation.servings - cupcakeCount
        }
      },
      {
        title: "Cupcakes",
        detail: `${cupcakeCount}`,
        visualType: "cupcakes",
        compact: true,
        cupcakeCount
      }
    ];
  }

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
        visualType: "3d",
        compact: true,
        recommendation: {
          name: recommendation.name,
          type: "single-sheet",
          servings: recommendation.servings
        }
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
        visualType: "3d",
        compact: true,
        recommendation: {
          name: recommendation.name,
          type: "single-sheet",
          servings: recommendation.servings
        }
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
      if (section.visualType === "cupcakes") {
        visual.appendChild(createCupcakePreviewNode(section.cupcakeCount));
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
  sheetPreview.className = "sheet-combo-round-preview";

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

  initRecommendationCake3D(sheetPreview, {
    name: recommendation.name,
    type: "single-sheet",
    servings: recommendation.servings
  });
}

let scene, camera, renderer, loader, controls;
let cakeObjects = [];
let cakeSceneRoot = null;
let cakeAnimationFrame = null;
let customizerTierSelect = null;
let customizerPreviewSelections = [];
let activeCustomizerTierIndex = null;
let visibleBackupTierIndex = null;
let syncTierRowStates = () => {};
let syncPeekToggleForIndex = () => {};
let customizerKeyHandler = null;
const shellBorderModelCache = new Map();
let swirlModelPromise = null;
let cherryModelPromise = null;
let cameraViewGizmo = null;
let cameraViewButtons = [];
let activeCameraView = "front";
let customizerCameraTarget = new THREE.Vector3(0, 0.46, 0);
let customizerFrontCameraOffset = new THREE.Vector3(0, 0.32, 1.32);
let customizerCameraAnimation = null;

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

function getCameraViewGizmoHTML() {
  return `
    <div class="camera-view-gizmo" aria-label="Camera views" role="group">
      <div class="camera-axis-gizmo">
        <span class="camera-axis-line camera-axis-line-x" data-axis-line="x"></span>
        <span class="camera-axis-line camera-axis-line-y" data-axis-line="y"></span>
        <span class="camera-axis-line camera-axis-line-z" data-axis-line="z"></span>
        <span class="camera-axis-origin" aria-hidden="true"></span>
        <button type="button" class="camera-axis-node camera-axis-node-x" data-axis-node="x" data-camera-view="side" aria-label="Side view" aria-pressed="false">X</button>
        <button type="button" class="camera-axis-node camera-axis-node-y is-active" data-axis-node="y" data-camera-view="front" aria-label="Front view" aria-pressed="true">Y</button>
        <button type="button" class="camera-axis-node camera-axis-node-z" data-axis-node="z" data-camera-view="top" aria-label="Top view" aria-pressed="false">Z</button>
        <button type="button" class="camera-axis-ring camera-axis-ring-x" data-axis-ring="x" data-camera-view="side" aria-label="Opposite side view"></button>
        <button type="button" class="camera-axis-ring camera-axis-ring-y" data-axis-ring="y" data-camera-view="front" aria-label="Opposite front view"></button>
        <button type="button" class="camera-axis-ring camera-axis-ring-z" data-axis-ring="z" data-camera-view="top" aria-label="Opposite top view"></button>
      </div>
    </div>
  `;
}

function getCameraGizmoAxisVectors() {
  const front = customizerFrontCameraOffset.clone();
  front.y = 0;
  front.normalize();

  const side = getCameraViewOffset("side");
  side.y = 0;
  side.normalize();

  return {
    x: side,
    y: front,
    z: new THREE.Vector3(0, 1, 0)
  };
}

function getCameraViewOffset(view) {
  const distance = Math.max(customizerFrontCameraOffset.length(), 0.1);

  if (view === "side") {
    return customizerFrontCameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  }

  if (view === "top") {
    return new THREE.Vector3(0, distance, 0.001);
  }

  return customizerFrontCameraOffset.clone();
}

function syncCameraViewButtons(view = activeCameraView) {
  if (cameraViewGizmo) {
    cameraViewGizmo.dataset.activeView = view;
  }

  cameraViewButtons.forEach((button) => {
    const isActive = button.dataset.cameraView === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function updateCameraViewGizmoOrientation() {
  if (!cameraViewGizmo || !camera) return;

  const center = 42;
  const radius = 29;
  const inverseCameraRotation = camera.quaternion.clone().invert();
  const axes = getCameraGizmoAxisVectors();

  Object.entries(axes).forEach(([axis, worldVector]) => {
    const cameraVector = worldVector.clone().applyQuaternion(inverseCameraRotation).normalize();
    const node = cameraViewGizmo.querySelector(`[data-axis-node="${axis}"]`);
    const ring = cameraViewGizmo.querySelector(`[data-axis-ring="${axis}"]`);
    const line = cameraViewGizmo.querySelector(`[data-axis-line="${axis}"]`);
    if (!node || !ring || !line) return;

    const axisX = center + cameraVector.x * radius;
    const axisY = center - cameraVector.y * radius;
    const ringX = center - cameraVector.x * radius;
    const ringY = center + cameraVector.y * radius;
    const lineLength = Math.max(9, Math.hypot(axisX - center, axisY - center) - 8);
    const lineAngle = Math.atan2(axisY - center, axisX - center);
    const depth = Math.round((cameraVector.z + 1) * 50);

    node.style.left = `${axisX}px`;
    node.style.top = `${axisY}px`;
    node.style.zIndex = String(20 + depth);
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    ring.style.zIndex = String(10 + (100 - depth));
    line.style.width = `${lineLength}px`;
    line.style.transform = `rotate(${lineAngle}rad)`;
    line.style.zIndex = String(5 + depth);
    line.style.opacity = String(0.42 + Math.max(cameraVector.z, 0) * 0.22);
  });
}

function setOrbitTarget(target) {
  customizerCameraTarget.copy(target);
  if (controls) {
    controls.target.copy(target);
    controls.update();
  } else if (camera) {
    camera.lookAt(target);
  }
}

function snapCustomizerCameraToView(view = "front") {
  if (!camera) return;

  activeCameraView = view;
  syncCameraViewButtons(view);

  const target = customizerCameraTarget.clone();
  const endPosition = target.clone().add(getCameraViewOffset(view));
  const endUp = view === "top"
    ? new THREE.Vector3(0, 0, -1)
    : new THREE.Vector3(0, 1, 0);

  customizerCameraAnimation = {
    startTime: performance.now(),
    duration: 520,
    startPosition: camera.position.clone(),
    endPosition,
    startUp: camera.up.clone(),
    endUp,
    startTarget: controls ? controls.target.clone() : target.clone(),
    endTarget: target
  };
}

function updateCustomizerCameraAnimation() {
  if (!customizerCameraAnimation || !camera) return;

  const elapsed = performance.now() - customizerCameraAnimation.startTime;
  const rawProgress = Math.min(elapsed / customizerCameraAnimation.duration, 1);
  const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

  camera.position.lerpVectors(
    customizerCameraAnimation.startPosition,
    customizerCameraAnimation.endPosition,
    easedProgress
  );
  camera.up.lerpVectors(
    customizerCameraAnimation.startUp,
    customizerCameraAnimation.endUp,
    easedProgress
  ).normalize();

  const target = new THREE.Vector3().lerpVectors(
    customizerCameraAnimation.startTarget,
    customizerCameraAnimation.endTarget,
    easedProgress
  );
  setOrbitTarget(target);

  if (rawProgress >= 1) {
    customizerCameraAnimation = null;
    setOrbitTarget(customizerCameraTarget);
  }
}

function attachCameraViewGizmo(container) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = getCameraViewGizmoHTML();
  const gizmo = wrapper.firstElementChild;
  cameraViewGizmo = gizmo;
  container.appendChild(gizmo);

  cameraViewButtons = Array.from(gizmo.querySelectorAll("[data-camera-view]"));
  cameraViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      snapCustomizerCameraToView(button.dataset.cameraView || "front");
    });
  });

  syncCameraViewButtons();
  updateCameraViewGizmoOrientation();
}

async function initCakeBuilder3D(recommendation, builderParts = null) {
  const container = document.getElementById("cake-builder-3d");

  container.innerHTML = "";
  cakeObjects = [];
  cameraViewGizmo = null;
  cameraViewButtons = [];
  customizerCameraAnimation = null;
  if (cakeAnimationFrame) {
    cancelAnimationFrame(cakeAnimationFrame);
    cakeAnimationFrame = null;
  }
  if (controls) {
    controls.dispose();
    controls = null;
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

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.target.copy(customizerCameraTarget);
  controls.update();

  attachCameraViewGizmo(container);

  loader = new GLTFLoader();

  const light = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.key);
  light.position.set(3, 5, 4);
  scene.add(light);

  const fillLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.fill);
  fillLight.position.set(-3, 3, 4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.rim);
  rimLight.position.set(0, 2.4, -3.6);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0xffffff, CAKE_LIGHTING.ambient);
  scene.add(ambient);

  const parts = builderParts || getRecommendationParts(recommendation);
  await buildCake3D(parts);
  attachCakePicker();

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
    .filter(({ part }) => part.kind === "main" && (part.size || part.sheetModelSrc))
    .sort((a, b) => b.part.size - a.part.size);

  for (const { part, partIndex } of mainParts) {
    const gltf = await loadCakePartModel(loader, part);

    const tier = gltf.scene;
    applyCustomizerCakeDisplayScale(tier, part);

    tier.traverse((child) => {
      child.userData.partIndex = partIndex;
    });
    prepareTierMaterials(tier);
    applyTierColorsToObject(tier);

    const { height, width } = normalizeCakeModelBounds(tier);

    tier.position.y += currentHeight;
    group.add(tier);

    const radius = width / 2;
    if (radius > maxMainRadius) maxMainRadius = radius;

    cakeObjects.push({
      object: tier,
      partIndex,
      kind: part.kind,
      size: part.size,
      stackY: currentHeight,
      modelBaseY: tier.position.y - currentHeight,
      tierHeight: height,
      tierRadius: radius,
      baseScale: tier.scale.x,
      homeX: tier.position.x,
      currentX: tier.position.x,
      targetX: tier.position.x
    });

    currentHeight += height;
  }

  for (const [partIndex, part] of parts.entries()) {
    if (part.kind !== "backup" || (!part.size && !part.sheetModelSrc)) continue;

    const gltf = await loadCakePartModel(loader, part);

    const backupTier = gltf.scene;
    applyCustomizerCakeDisplayScale(backupTier, part);

    backupTier.traverse((child) => {
      child.userData.partIndex = partIndex;
    });
    prepareTierMaterials(backupTier);
    applyTierColorsToObject(backupTier);

    const { height: backupHeight, width: backupWidth } = normalizeCakeModelBounds(backupTier);
    const backupRadius = backupWidth / 2;

    const sideOffset = maxMainRadius + backupRadius + 0.08;
    backupTier.position.x += sideOffset;
    group.add(backupTier);

    cakeObjects.push({
      object: backupTier,
      partIndex,
      kind: part.kind,
      size: part.size,
      stackY: 0,
      modelBaseY: backupTier.position.y,
      tierHeight: backupHeight,
      tierRadius: backupRadius,
      baseScale: backupTier.scale.x,
      homeX: sideOffset,
      currentX: sideOffset,
      targetX: sideOffset,
      hiddenX: sideOffset + backupWidth + 1.2
    });
  }

  const mainBox = new THREE.Box3();
  const mainEntries = cakeObjects.filter((entry) => entry.kind === "main");
  mainEntries.forEach((entry) => {
    mainBox.expandByObject(entry.object);
  });

  if (mainEntries.length) {
    const center = new THREE.Vector3();
    mainBox.getCenter(center);

    group.position.x -= center.x;
    group.position.z -= center.z;
    group.position.y -= mainBox.min.y;
    group.position.y += 0.26;

    syncBackupAnimationState();
  }

  group.scale.setScalar(1.55);

  camera.position.set(0, 0.78, 1.78);
  camera.up.set(0, 1, 0);
  customizerCameraTarget.set(0, 0.46, 0);
  customizerFrontCameraOffset.copy(camera.position).sub(customizerCameraTarget);
  activeCameraView = "front";
  setOrbitTarget(customizerCameraTarget);
  syncCameraViewButtons();
}

async function addExtraBackupCakeObject(selection, selectionIndex) {
  if (!selection?.size || !cakeSceneRoot || !loader) return null;

  const gltf = await loadCakePartModel(loader, selection);

  const backupTier = gltf.scene;
  applyCustomizerCakeDisplayScale(backupTier, selection);

  backupTier.traverse((child) => {
    child.userData.partIndex = selectionIndex;
  });
  prepareTierMaterials(backupTier);
  applyTierColorsToObject(backupTier, selection);
  const { height: backupHeight, width: normalizedBackupWidth } = normalizeCakeModelBounds(backupTier);

  const mainEntries = cakeObjects.filter((entry) => entry.kind === "main");
  const mainBox = new THREE.Box3();
  mainEntries.forEach((entry) => mainBox.expandByObject(entry.object));
  const mainWidth = mainBox.max.x - mainBox.min.x;

  const backupBox = new THREE.Box3().setFromObject(backupTier);
  const backupWidth = backupBox.max.x - backupBox.min.x;
  const sideOffset = mainWidth / 2 + backupWidth / 2 + 0.08;
  const hiddenOffset = sideOffset + backupWidth + 1.2;

  backupTier.position.x += hiddenOffset;
  cakeSceneRoot.add(backupTier);

  const entry = {
    object: backupTier,
    partIndex: selectionIndex,
    kind: "extra-backup",
    size: selection.size,
    stackY: 0,
    modelBaseY: backupTier.position.y,
    tierHeight: backupHeight,
    tierRadius: normalizedBackupWidth / 2,
    baseScale: backupTier.scale.x,
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
  updateCustomizerCameraAnimation();
  cakeObjects.forEach((entry) => {
    if (typeof entry.currentX !== "number" || typeof entry.targetX !== "number") return;

    entry.currentX += (entry.targetX - entry.currentX) * 0.14;
    entry.object.position.x = entry.currentX;
    if (entry.outerFrostingObject) {
      const offset = entry.outerFrostingOffset || { x: 0 };
      entry.outerFrostingObject.position.x = entry.currentX + offset.x;
    }
  });
  controls?.update();
  updateCameraViewGizmoOrientation();
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

    const meshes = cakeObjects.flatMap(({ object, outerFrostingObject }) => {
      const descendants = [];
      object.traverse((child) => {
        if (child.isMesh) descendants.push(child);
      });
      outerFrostingObject?.traverse((child) => {
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

function getOuterFrostingModelSrc(size) {
  return size ? `decoration/outerfrosting_${size}.glb` : null;
}

async function loadShellBorderTemplate(src = SHELL_BORDER_MODEL_SRC, shellLoader = loader) {
  if (shellBorderModelCache.has(src)) {
    return shellBorderModelCache.get(src);
  }

  const loaderToUse = shellLoader || new GLTFLoader();
  const modelPromise = new Promise((resolve, reject) => {
    loaderToUse.load(src, (gltf) => resolve(gltf.scene), undefined, reject);
  });

  shellBorderModelCache.set(src, modelPromise);
  return modelPromise;
}

async function loadShellModel(shellLoader = loader) {
  return loadShellBorderTemplate(SHELL_BORDER_MODEL_SRC, shellLoader);
}

async function loadSwirlModel(swirlLoader = loader) {
  if (!swirlModelPromise) {
    const loaderToUse = swirlLoader || new GLTFLoader();
    swirlModelPromise = new Promise((resolve, reject) => {
      loaderToUse.load(SWIRL_MODEL_SRC, (gltf) => resolve(gltf.scene), undefined, reject);
    });
  }

  return swirlModelPromise;
}

async function loadCherryModel(cherryLoader = loader) {
  if (!cherryModelPromise) {
    const loaderToUse = cherryLoader || new GLTFLoader();
    cherryModelPromise = new Promise((resolve, reject) => {
      loaderToUse.load(CHERRY_MODEL_SRC, (gltf) => resolve(gltf.scene), undefined, reject);
    });
  }

  return cherryModelPromise;
}

function applyShellBorderMaterial(object, color = DEFAULT_SHELL_FROSTING_COLOR) {
  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : [child.material.clone()];

    child.castShadow = true;
    child.receiveShadow = true;
    child.userData.isDecorMesh = true;
    child.material = Array.isArray(child.material) ? materials : materials[0];

    materials.forEach((material) => {
      material.userData = {
        ...material.userData,
        role: null
      };
      if (material.color) {
        material.color.set(color);
      }
      material.roughness = 0.46;
      material.metalness = 0;
    });
  });
}

function prepareDecorModelMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : [child.material.clone()];

    child.castShadow = true;
    child.receiveShadow = true;
    child.userData.isDecorMesh = true;
    child.material = Array.isArray(child.material) ? materials : materials[0];
  });
}

async function createShellBorder(radius, y, count, options = {}) {
  const {
    src = SHELL_BORDER_MODEL_SRC,
    scale = null,
    overlap = SHELL_BORDER_OVERLAP,
    radialOffset = 0,
    rotationOffset = 0,
    color = DEFAULT_SHELL_FROSTING_COLOR,
    shellLoader = loader
  } = options;

  const template = await loadShellBorderTemplate(src, shellLoader);
  const shellScale = scale ?? getShellScaleForCount(template, radius, count, overlap);
  const border = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const shell = template.clone(true);

    shell.position.set(
      outward.x * (radius + radialOffset),
      y,
      outward.z * (radius + radialOffset)
    );

    const rotationMatrix = new THREE.Matrix4().makeBasis(tangent, up, outward);
    shell.setRotationFromMatrix(rotationMatrix);
    shell.rotateY(rotationOffset);
    shell.scale.set(shellScale * overlap, shellScale * 1.08, shellScale * 1.12);

    applyShellBorderMaterial(shell, color);
    border.add(shell);
  }

  border.userData.isShellBorder = true;
  return border;
}

window.createShellBorder = createShellBorder;
window.loadShellModel = loadShellModel;

function getShellBaseFootprint(template) {
  const box = new THREE.Box3().setFromObject(template);
  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    tangent: Math.max(size.x, 0.001),
    radial: Math.max(size.z, 0.001)
  };
}

function getShellCountForTier(entry, radius) {
  const size = Number(entry?.size) || 8;
  const sizeBasedCount = Math.round(size * 2.15);
  const circumferenceCount = Math.round((Math.PI * 2 * radius) / 0.12);
  return Math.max(14, Math.min(SHELL_BORDER_MAX_COUNT, Math.max(sizeBasedCount, circumferenceCount)));
}

function getShellScaleForCount(template, radius, count, overlap = SHELL_BORDER_OVERLAP) {
  const footprint = getShellBaseFootprint(template);
  const arcLength = (Math.PI * 2 * radius) / count;
  const targetWidth = arcLength * overlap;

  return Math.max(targetWidth / footprint.tangent, SHELL_BORDER_MIN_SCALE);
}

function getSwirlScaleForTier(template, radius, count) {
  const footprint = getShellBaseFootprint(template);
  const arcLength = (Math.PI * 2 * radius) / count;
  const tangentScale = (arcLength * 0.42) / footprint.tangent;
  const radialScale = (radius * 0.18) / footprint.radial;

  return Math.max(0.035, Math.min(tangentScale, radialScale, 0.16));
}

function getObjectSize(template) {
  const box = new THREE.Box3().setFromObject(template);
  const size = new THREE.Vector3();
  box.getSize(size);
  return size;
}

function getCherryScaleForSwirl(cherryTemplate, swirlTemplate, swirlScale) {
  const cherrySize = getObjectSize(cherryTemplate);
  const swirlSize = getObjectSize(swirlTemplate);
  const cherryFootprint = Math.max(cherrySize.x, cherrySize.z, 0.001);
  const swirlFootprint = Math.max(swirlSize.x, swirlSize.z, 0.001) * swirlScale;
  const targetFootprint = swirlFootprint * 0.34;

  return Math.max(0.012, Math.min(targetFootprint / cherryFootprint, 0.08));
}

function normalizeSwirlCount(count) {
  const numericCount = Number(count);
  return SWIRL_ALLOWED_COUNTS.includes(numericCount) ? numericCount : DEFAULT_SWIRL_COUNT;
}

function getTierLocalEdgeY(entry, edge = SHELL_BORDER_DEFAULT_EDGE) {
  entry.object.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(entry.object);
  const worldY = edge === "bottom" ? box.min.y : box.max.y;
  const localPoint = entry.object.worldToLocal(new THREE.Vector3(0, worldY, 0));

  return localPoint.y + (edge === "bottom" ? SHELL_BORDER_BOTTOM_Y_OFFSET : SHELL_BORDER_TOP_Y_OFFSET);
}

function resolveCakeEntryForTier(tier) {
  if (!tier) return null;
  if (cakeObjects.includes(tier)) return tier;
  return cakeObjects.find((entry) => entry.object === tier || entry.partIndex === tier.userData?.partIndex) || null;
}

function ensureDecorGroup(entry) {
  if (!entry) return null;

  if (!entry.decorGroup) {
    entry.decorGroup = new THREE.Group();
    entry.decorGroup.name = `decorGroup-${entry.partIndex}`;
    entry.decorGroup.userData.isDecorGroup = true;
    entry.decorGroup.userData.partIndex = entry.partIndex;
    entry.object.add(entry.decorGroup);
  }

  return entry.decorGroup;
}

function disposeDecorMaterialOnly(root) {
  root?.traverse?.((child) => {
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => material.dispose?.());
  });
}

function clearDecorGroup(target) {
  const entry = target?.isGroup ? null : resolveCakeEntryForTier(target);
  const decorGroup = target?.isGroup ? target : entry?.decorGroup;
  if (!decorGroup) return;

  while (decorGroup.children.length) {
    const child = decorGroup.children[0];
    decorGroup.remove(child);
    disposeDecorMaterialOnly(child);
  }

  if (entry) {
    entry.decorType = "";
  }
}

async function addShellBorderToTier(tier, edge = null) {
  const entry = resolveCakeEntryForTier(tier);
  if (!entry?.size) return null;

  const syncId = (entry.decorSyncId || 0) + 1;
  entry.decorSyncId = syncId;
  clearDecorGroup(entry);

  const template = await loadShellModel();
  if (entry.decorSyncId !== syncId) return null;

  const decorGroup = ensureDecorGroup(entry);
  clearDecorGroup(decorGroup);

  const radius = entry.tierRadius || 0.24;
  const shellEdge = edge || customizerPreviewSelections[entry.partIndex]?.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE;
  const y = getTierLocalEdgeY(entry, shellEdge);
  const count = getShellCountForTier(entry, radius);
  const scale = getShellScaleForCount(template, radius, count);
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const shell = template.clone(true);

    shell.position.set(outward.x * radius, y, outward.z * radius);

    const rotationMatrix = new THREE.Matrix4().makeBasis(tangent, up, outward);
    shell.setRotationFromMatrix(rotationMatrix);
    shell.scale.set(scale * SHELL_BORDER_OVERLAP, scale * 1.08, scale * 1.12);
    shell.userData.isShellBorder = true;
    shell.userData.partIndex = entry.partIndex;

    applyShellBorderMaterial(shell);
    decorGroup.add(shell);
  }

  entry.decorType = SHELL_BORDER_DECOR;
  entry.shellBorderEdge = shellEdge;
  return decorGroup;
}

async function addSwirlsToTier(tier, count = DEFAULT_SWIRL_COUNT) {
  const entry = resolveCakeEntryForTier(tier);
  if (!entry?.size) return null;

  const syncId = (entry.decorSyncId || 0) + 1;
  entry.decorSyncId = syncId;
  clearDecorGroup(entry);

  const template = await loadSwirlModel();
  if (entry.decorSyncId !== syncId) return null;

  const selection = customizerPreviewSelections[entry.partIndex];
  const shouldAddCherries = selection?.cherries === true;
  const cherryTemplate = shouldAddCherries ? await loadCherryModel() : null;
  if (entry.decorSyncId !== syncId) return null;

  const decorGroup = ensureDecorGroup(entry);
  clearDecorGroup(decorGroup);

  const radius = (entry.tierRadius || 0.24) + SWIRL_RADIUS_OFFSET;
  const y = getTierLocalEdgeY(entry, "top") + SWIRL_TOP_Y_OFFSET;
  const swirlCount = normalizeSwirlCount(count);
  const scale = getSwirlScaleForTier(template, radius, swirlCount);
  const cherryScale = cherryTemplate ? getCherryScaleForSwirl(cherryTemplate, template, scale) : 1;

  for (let i = 0; i < swirlCount; i += 1) {
    const angle = (i / swirlCount) * Math.PI * 2;
    const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const swirl = template.clone(true);

    swirl.position.set(outward.x * radius, y, outward.z * radius);
    swirl.lookAt(outward.x * (radius + 1), y, outward.z * (radius + 1));
    swirl.rotateY(Math.PI);
    swirl.scale.setScalar(scale);
    swirl.userData.isSwirlDecor = true;
    swirl.userData.partIndex = entry.partIndex;

    applyShellBorderMaterial(swirl);
    decorGroup.add(swirl);

    if (cherryTemplate) {
      const cherry = cherryTemplate.clone(true);
      const cherryRadius = radius + CHERRY_RADIUS_OFFSET;

      cherry.position.set(
        outward.x * cherryRadius,
        y + CHERRY_TOP_Y_OFFSET,
        outward.z * cherryRadius
      );
      cherry.lookAt(outward.x * (cherryRadius + 1), y + CHERRY_TOP_Y_OFFSET, outward.z * (cherryRadius + 1));
      cherry.rotateY(Math.PI);
      cherry.scale.setScalar(cherryScale);
      cherry.userData.isCherryDecor = true;
      cherry.userData.partIndex = entry.partIndex;

      prepareDecorModelMaterials(cherry);
      decorGroup.add(cherry);
    }
  }

  entry.decorType = SWIRL_DECOR;
  entry.swirlCount = swirlCount;
  entry.cherries = shouldAddCherries;
  return decorGroup;
}

async function syncDecorForIndex(index) {
  const entry = cakeObjects.find((cakeObject) => cakeObject.partIndex === index);
  const selection = customizerPreviewSelections[index];
  if (!entry || !selection) return;

  if (selection.decor === SHELL_BORDER_DECOR) {
    await addShellBorderToTier(entry, selection.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE);
    return;
  }

  if (selection.decor === SWIRL_DECOR) {
    await addSwirlsToTier(entry, selection.swirlCount || DEFAULT_SWIRL_COUNT);
    return;
  }

  entry.decorSyncId = (entry.decorSyncId || 0) + 1;
  clearDecorGroup(entry);
}

async function toggleShellBorder(index = activeCustomizerTierIndex) {
  index = typeof index === "number" ? index : null;
  if (index === null || !customizerPreviewSelections[index]?.size) return;

  const selection = customizerPreviewSelections[index];
  selection.shellBorderEdge = selection.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE;
  selection.decor = selection.decor === SHELL_BORDER_DECOR ? "" : SHELL_BORDER_DECOR;
  await syncDecorForIndex(index);
}

async function toggleSwirls(index = activeCustomizerTierIndex) {
  index = typeof index === "number" ? index : null;
  if (index === null || !customizerPreviewSelections[index]?.size) return;

  const selection = customizerPreviewSelections[index];
  selection.swirlCount = normalizeSwirlCount(selection.swirlCount);
  selection.decor = selection.decor === SWIRL_DECOR ? "" : SWIRL_DECOR;
  await syncDecorForIndex(index);
}

async function updateSwirlDecor(index = activeCustomizerTierIndex) {
  index = typeof index === "number" ? index : null;
  if (index === null || customizerPreviewSelections[index]?.decor !== SWIRL_DECOR) return;

  customizerPreviewSelections[index].swirlCount = normalizeSwirlCount(customizerPreviewSelections[index].swirlCount);
  await syncDecorForIndex(index);
}

async function toggleCherries(index = activeCustomizerTierIndex) {
  index = typeof index === "number" ? index : null;
  if (index === null || !customizerPreviewSelections[index]?.size) return;

  const selection = customizerPreviewSelections[index];
  selection.swirlCount = normalizeSwirlCount(selection.swirlCount);
  selection.decor = SWIRL_DECOR;
  selection.cherries = !selection.cherries;
  await syncDecorForIndex(index);
}

window.clearDecorGroup = clearDecorGroup;
window.addShellBorderToTier = addShellBorderToTier;
window.loadSwirlModel = loadSwirlModel;
window.loadCherryModel = loadCherryModel;
window.addSwirlsToTier = addSwirlsToTier;
window.updateSwirlDecor = updateSwirlDecor;
window.toggleShellBorder = toggleShellBorder;
window.toggleSwirls = toggleSwirls;
window.toggleCherries = toggleCherries;

function applyOuterFrostingColor(object, color = DEFAULT_OUTER_FROSTING_COLOR) {
  if (!object) return;

  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material.color) {
        material.color.set(color);
      }
      material.roughness = 0.38;
      material.metalness = 0;
    });
  });
}

function removeOuterFrostingForEntry(entry) {
  if (!entry?.outerFrostingObject) return;

  cakeSceneRoot?.remove(entry.outerFrostingObject);
  disposeMenuPreviewObject(entry.outerFrostingObject);
  entry.outerFrostingObject = null;
  entry.outerFrostingType = "";
  entry.outerFrostingOffset = null;
  entry.peeking = false;
}

function positionOuterFrostingForEntry(entry) {
  if (!entry?.outerFrostingObject) return;

  const offset = entry.outerFrostingOffset || { x: 0, y: 0, z: 0 };
  entry.outerFrostingObject.position.set(
    (entry.currentX ?? entry.homeX ?? 0) + offset.x,
    (entry.stackY ?? 0) + offset.y,
    offset.z
  );
}

async function syncOuterFrostingForIndex(index) {
  const entry = cakeObjects.find((cakeObject) => cakeObject.partIndex === index);
  const selection = customizerPreviewSelections[index];
  if (!entry || !selection) return;

  const shouldShowOuterFrosting = selection.outerFrosting === OUTER_FROSTING_DECOR && entry.size;
  if (!shouldShowOuterFrosting) {
    entry.peeking = false;
    removeOuterFrostingForEntry(entry);
    syncPeekToggleForIndex(index);
    return;
  }

  if (!entry.outerFrostingObject) {
    const src = getOuterFrostingModelSrc(entry.size);
    if (!src || !loader || !cakeSceneRoot) return;

    const gltf = await new Promise((resolve, reject) => {
      loader.load(src, resolve, undefined, reject);
    });

    const outerFrosting = gltf.scene;
    prepareTierMaterials(outerFrosting);
    normalizeCakeModelBounds(outerFrosting);
    entry.outerFrostingOffset = outerFrosting.position.clone();
    outerFrosting.traverse((child) => {
      child.userData.partIndex = index;
    });

    positionOuterFrostingForEntry(entry);
    cakeSceneRoot.add(outerFrosting);
    entry.outerFrostingObject = outerFrosting;
    entry.outerFrostingType = OUTER_FROSTING_DECOR;
  }

  positionOuterFrostingForEntry(entry);
  applyOuterFrostingColor(entry.outerFrostingObject, selection.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR);
  entry.outerFrostingObject.visible = !entry.peeking;
  syncPeekToggleForIndex(index);
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
    applyOuterFrostingColor(entry.outerFrostingObject, selection.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR);

    object.scale.setScalar(entry.baseScale ?? 1);

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

  const light = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.key);
  light.position.set(3, 5, 3);
  scene.add(light);

  const fillLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.fill);
  fillLight.position.set(-3, 3, 3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.rim);
  rimLight.position.set(0, 2.4, -3.4);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0xffffff, CAKE_LIGHTING.ambient);
  scene.add(ambient);

  if (recommendation.type === "single-sheet") {
    buildRecommendationCake3D(scene, [], null, getSheetCakeModelSrc(recommendation.name)).then((group) => {
      group.scale.setScalar(1.34);
      camera.position.set(0, 0.54, 2.45);
      camera.lookAt(0, 0.18, 0);
    });

    function animateCard() {
      requestAnimationFrame(animateCard);
      renderer.render(scene, camera);
    }

    animateCard();
    return;
  }

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

  function animateCard() {
    requestAnimationFrame(animateCard);
    renderer.render(scene, camera);
  }

  animateCard();
}

async function buildRecommendationCake3D(scene, mainSizes, backupSize = null, singleSheetModelSrc = null) {
  const localLoader = new GLTFLoader();

  const group = new THREE.Group();
  scene.add(group);

  if (singleSheetModelSrc) {
    const gltf = await new Promise((resolve, reject) => {
      localLoader.load(singleSheetModelSrc, (loadedGltf) => {
        normalizeCakePartScale(loadedGltf.scene, {
          sheetModelSrc: singleSheetModelSrc,
          sheetScale: RECOMMENDATION_SHEET_MODEL_SCALE
        });
        resolve(loadedGltf);
      }, undefined, reject);
    });

    const sheetCake = gltf.scene;
    prepareTierMaterials(sheetCake);
    applyTierColorsToObject(sheetCake);
    group.add(sheetCake);

    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box.getCenter(center);

    group.position.x -= center.x;
    group.position.z -= center.z;
    group.position.y -= box.min.y;
    group.position.y += 0.16;

    return group;
  }

  let currentHeight = 0;
  let maxMainRadius = 0;

  for (let sizeValue of mainSizes) {
    const gltf = await new Promise((resolve, reject) => {
      localLoader.load(`models/tier_${sizeValue}.glb`, resolve, undefined, reject);
    });

    const tier = gltf.scene;
    prepareTierMaterials(tier);
    applyTierColorsToObject(tier);

    const { height, width } = normalizeCakeModelBounds(tier);

    const radius = width / 2;
    if (radius > maxMainRadius) maxMainRadius = radius;

    tier.position.y += currentHeight;
    group.add(tier);

    currentHeight += height;
  }

  if (backupSize) {
    const backupGltf = await new Promise((resolve, reject) => {
      localLoader.load(`models/tier_${backupSize}.glb`, resolve, undefined, reject);
    });

    const backupTier = backupGltf.scene;
    prepareTierMaterials(backupTier);
    applyTierColorsToObject(backupTier);

    const { width: backupWidth } = normalizeCakeModelBounds(backupTier);
    const backupRadius = backupWidth / 2;

    const sideOffset = maxMainRadius + backupRadius + 0.06;
    backupTier.position.x += sideOffset;
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

  const previewRecommendation = getNearestPreviewRecommendationForGuests(guests);
  const heroPreviewElement = getHeroPreviewElement();
  const heroSnapshot = heroPreviewElement ? {
    element: heroPreviewElement,
    rect: heroPreviewElement.getBoundingClientRect()
  } : null;

  showRecommendationsPageView();

  if (guestCountInput) {
    guestCountInput.value = guests;
  }

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
    filling: "Cinnamon Sugar Ganache"
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

const signatureFlavorOrder = [
  "original-vanilla",
  "blueberry-cheesecake",
  "cinnamon-roll",
  "london-fog",
  "pancake",
  "passionberry",
  "strawberry-key-lime",
  "strawberry-shortcake",
  "white-chocolate-raspberry",
  "original-chocolate",
  "black-forrest",
  "cookies-and-cream",
  "mocha",
  "raspberry-chocolate-mousse",
  "red-velvet",
  "tuxedo",
  "zebra",
  "almond-joy",
  "coconut-cream",
  "cranberry-orange",
  "key-lime-coconut",
  "lemon-blueberry",
  "apple-cider",
  "bee-sting",
  "carrot",
  "horchata"
];

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

function getCupcakeQuantityForServings(servings, maxQuantity = Infinity) {
  if (!Number.isFinite(servings) || servings <= 0) return null;

  const quantity = Math.ceil(servings / CUPCAKE_QUANTITY_STEP) * CUPCAKE_QUANTITY_STEP;
  return quantity <= maxQuantity ? quantity : null;
}

function getTieredRecommendationName(tierSizes) {
  return `${tierSizes.slice().sort((a, b) => a - b).map((size) => `${size}"`).join(" + ")} tiered cake`;
}

function getRecommendationCakeServings(recommendation) {
  if (recommendation.type === "cupcakes") return 0;
  return Math.max((recommendation.servings || 0) - (recommendation.cupcakeCount || 0), 0);
}

function getCupcakeSupplementScore(gap, cupcakeCount) {
  const overage = cupcakeCount - gap;
  const smallGapCredit = gap <= 12 ? -6 : 0;
  return overage + 2 + smallGapCredit;
}

function buildCupcakeRecommendations(guests) {
  const cupcakeRecommendations = [];
  const standaloneCupcakes = getCupcakeQuantityForServings(guests, CUPCAKE_MAX_STANDALONE);

  if (standaloneCupcakes) {
    cupcakeRecommendations.push({
      name: `${standaloneCupcakes} Cupcakes`,
      servings: standaloneCupcakes,
      type: "cupcakes",
      cupcakeCount: standaloneCupcakes,
      score: (standaloneCupcakes - guests) + 8
    });
  }

  cakeOptions.forEach((cake) => {
    if (cake.type !== "round") return;
    if (cake.servings >= guests) return;

    const gap = guests - cake.servings;
    const cupcakeCount = getCupcakeQuantityForServings(gap, CUPCAKE_MAX_SUPPLEMENT);
    if (!cupcakeCount) return;

    const totalServings = cake.servings + cupcakeCount;
    const undersizedMainPenalty = guests > 40 && cake.size < 10 ? 8 : 0;

    cupcakeRecommendations.push({
      name: `${cake.size}" Round + ${cupcakeCount} Cupcakes`,
      servings: totalServings,
      type: "single-cupcakes",
      roundSize: cake.size,
      cupcakeCount,
      score: getCupcakeSupplementScore(gap, cupcakeCount) + undersizedMainPenalty
    });
  });

  tieredOptions.forEach((tierOption) => {
    if (tierOption.servings >= guests) return;

    const gap = guests - tierOption.servings;
    const cupcakeCount = getCupcakeQuantityForServings(gap, CUPCAKE_MAX_SUPPLEMENT);
    if (!cupcakeCount) return;

    const tierCount = tierOption.tiers.length;
    const smallestTier = Math.min(...tierOption.tiers);
    let score = getCupcakeSupplementScore(gap, cupcakeCount);

    if (guests < 60 && tierCount > 2) score += 2;
    if (guests > 40 && smallestTier < 8 && smallestTier !== 6) score += 10;
    if (tierOption.tiers.includes(6)) score -= 3;
    if (tierCount === 3) score -= 2;

    cupcakeRecommendations.push({
      name: `${getTieredRecommendationName(tierOption.tiers)} + ${cupcakeCount} Cupcakes`,
      servings: tierOption.servings + cupcakeCount,
      type: "tiered-cupcakes",
      tierSizes: tierOption.tiers.slice(),
      cupcakeCount,
      score
    });
  });

  return cupcakeRecommendations;
}

function getBasePrice(recommendation) {
  if (recommendation.type === "cupcakes") {
    return (recommendation.cupcakeCount || 0) * CUPCAKE_PRICE;
  }

  if (recommendation.type === "single-cupcakes") {
    return (tierBasePrices[recommendation.roundSize] || 0) + ((recommendation.cupcakeCount || 0) * CUPCAKE_PRICE);
  }

  if (recommendation.type === "tiered-cupcakes") {
    const sizes = recommendation.tierSizes || (recommendation.name.match(/\d+/g) || []).map(Number).slice(0, -1);
    const tierPrice = sizes.reduce((total, size) => total + (tierBasePrices[size] || 0), 0);
    return tierPrice + ((recommendation.cupcakeCount || 0) * CUPCAKE_PRICE);
  }

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

recommendations.push(...buildCupcakeRecommendations(guests));

// SORT BEST TO WORST
recommendations.sort((a, b) => a.score - b.score);

// REMOVE DUPLICATES
let uniqueRecommendations = [];
let seenKeys = [];
let seenTypes = [];

function getRecommendationUniqueKey(recommendation) {
  if (recommendation.type === "cupcakes") {
    return `cupcakes-${recommendation.cupcakeCount || recommendation.servings || recommendation.name}`;
  }

  if (recommendation.type === "single-cupcakes") {
    return `single-cupcakes-${recommendation.roundSize}-${recommendation.cupcakeCount}`;
  }

  if (recommendation.type === "tiered-cupcakes") {
    const tierSizes = (recommendation.tierSizes || (recommendation.name.match(/\d+/g) || []).map(Number).slice(0, -1))
      .slice()
      .sort((a, b) => a - b)
      .join("-");
    return `tiered-cupcakes-${tierSizes}-${recommendation.cupcakeCount}`;
  }

  if (recommendation.type === "tiered") {
    return recommendation.name
      .replace(" tiered cake", "")
      .replace(/"/g, "")
      .split(" + ")
      .map(Number)
      .sort((a, b) => a - b)
      .join("-");
  }

  if (recommendation.type === "tiered-round-backup") {
    return recommendation.name
      .replace(" tiered cake + ", " + ")
      .replace(/"/g, "")
      .split(" + ")
      .map(part => parseInt(part))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b)
      .join("-");
  }

  return recommendation.name;
}

for (let i = 0; i < recommendations.length; i++) {
  let rec = recommendations[i];
  let key = getRecommendationUniqueKey(rec);

  if (seenKeys.includes(key)) continue;

  // allow only one of each type in the first pass
  if (seenTypes.includes(rec.type) && uniqueRecommendations.length < 3) continue;

  uniqueRecommendations.push(rec);
  seenKeys.push(key);
  seenTypes.push(rec.type);

  if (uniqueRecommendations.length === 3) break;
}

for (let i = 0; i < recommendations.length && uniqueRecommendations.length < 6; i++) {
  let rec = recommendations[i];
  let key = getRecommendationUniqueKey(rec);

  if (seenKeys.includes(key)) continue;

  uniqueRecommendations.push(rec);
  seenKeys.push(key);
}

function getRecommendationStatePayload(activeRecommendation = null, customizerState = null, view = "recommendations") {
  return {
    guests,
    view,
    recommendation: activeRecommendation ? {
      name: activeRecommendation.name,
      type: activeRecommendation.type,
      servings: activeRecommendation.servings,
      roundSize: activeRecommendation.roundSize,
      tierSizes: activeRecommendation.tierSizes,
      cupcakeCount: activeRecommendation.cupcakeCount
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

renderHeroRecommendationCard(null, getBasePrice);

let topVisuals = uniqueRecommendations.slice(0, 3);
let recommendationVisuals = uniqueRecommendations.slice(0, 6);

recommendationVisuals.forEach((recommendation, index) => {
  let card = document.createElement("div");
  card.classList.add("visual-card");

  let label = document.createElement("div");
  label.classList.add("visual-label");

  label.innerHTML = `
    <div class="recommendation-servings-text">Serves ${recommendation.servings}</div>
    <div class="recommendation-price-text">${formatPrice(getBasePrice(recommendation))}</div>
    <div class="recommendation-description-text">${formatRecommendationDisplayName(recommendation)}</div>
  `;

  card.appendChild(label);

  const preview3D = document.createElement("div");
preview3D.classList.add("recommendation-cake-3d");
preview3D.dataset.recommendationName = recommendation.name;
preview3D.dataset.recommendationType = recommendation.type;



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

const animationTargetRecommendation = topVisuals.find((recommendation) => {
  return isRecommendationMatch(recommendation, previewRecommendation);
}) || topVisuals.find((recommendation) => recommendation.type === "tiered") || topVisuals[0] || null;

requestAnimationFrame(() => {
  animateHeroPreviewIntoRecommendation(heroSnapshot, animationTargetRecommendation);
});

function showCustomizer(recommendation, restoredCustomizerState = null, openSummaryOnLoad = false) {
  showCustomizerPageView();
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
  <div class="accordion-section flavor-accordion-section expanded" data-accordion-section="flavor">
    <button id="flavor-toggle" type="button" class="flavor-toggle accordion-header" aria-expanded="true">
      <span>Flavor</span>
    </button>

    <div class="flavor-controls accordion-content">
      <div class="flavor-card">
        <label class="flavor-field-label" for="signature-flavor">Signature Flavor</label>
<select id="signature-flavor" class="flavor-select signature-flavor-select">
  <option value="">Signature Flavor</option>

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

    <div class="build-your-own-divider" aria-hidden="true">
      <span></span>
      <p>or build your own</p>
      <span></span>
    </div>

    <label class="flavor-field-label" for="tier-flavor">Cake</label>
    <select id="tier-flavor" class="flavor-select">
      <option value="">Cake</option>
      <option>Almond</option>
      <option>Chocolate</option>
      <option>Coconut</option>
      <option>Lemon</option>
      <option>Marble</option>
      <option>Spice</option>
      <option>Vanilla</option>
    </select>

    <label class="flavor-field-label" for="tier-frosting">Frosting</label>
    <select id="tier-frosting" class="flavor-select">
  <option value="">Frosting</option>
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

    <label class="flavor-field-label" for="filling">Filling</label>
<select id="filling" class="flavor-select">
  <option value="">Filling</option>
  <option>Apple Pie Filling</option>
  <option>Blackberry Puree</option>
  <option>Blueberry Puree</option>
  <option>Chocolate Mousse</option>
  <option>Cinnamon Sugar Ganache</option>
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

  <div id="extra-backup-drawer" class="extra-backup-drawer accordion-section" data-accordion-section="backup">
    <button id="extra-backup-toggle" type="button" class="extra-backup-toggle accordion-header" aria-expanded="false">Not Enough Cake?</button>
    <div id="extra-backup-content" class="extra-backup-content accordion-content">
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

  <div class="customizer-panel" id="decor-panel" hidden>
    <div class="decor-panel-header">
      <h3>Decoration</h3>
    </div>
    <div id="decor-content" class="decor-content decor-screen-content">
      <div class="decor-shell">
        <div class="decor-stage">
          <div class="decor-control-stack">
            <section class="decor-control-group">
              <label class="decor-field-label" for="outer-frosting-select">Finish</label>
              <select id="outer-frosting-select" class="decor-select">
                <option value="">No outer layer</option>
                <option value="${OUTER_FROSTING_DECOR}">Smooth outer layer</option>
              </select>
              <div class="decor-color-row" aria-label="Outer frosting color">
                <button type="button" class="decor-color-swatch is-selected" data-decor-color="#fff7c7" style="--swatch-color: #fff7c7;" aria-label="Vanilla outer frosting"></button>
                <button type="button" class="decor-color-swatch" data-decor-color="#f8c7d0" style="--swatch-color: #f8c7d0;" aria-label="Pink outer frosting"></button>
                <button type="button" class="decor-color-swatch" data-decor-color="#b9c7f2" style="--swatch-color: #b9c7f2;" aria-label="Blue outer frosting"></button>
                <button type="button" class="decor-color-swatch" data-decor-color="#c9dfbd" style="--swatch-color: #c9dfbd;" aria-label="Green outer frosting"></button>
                <button type="button" class="decor-color-swatch" data-decor-color="#8b6659" style="--swatch-color: #8b6659;" aria-label="Chocolate outer frosting"></button>
                <label class="decor-custom-color-label" for="outer-frosting-color">Custom</label>
                <input id="outer-frosting-color" class="decor-color-input" type="color" value="${DEFAULT_OUTER_FROSTING_COLOR}" aria-label="Custom outer frosting color">
              </div>
            </section>

            <section class="decor-control-group">
              <div class="decor-field-label">Decorations</div>
              <div class="decor-option-buttons" role="group" aria-label="Decorations">
                <button id="shell-border-btn" type="button" class="decor-option-btn" data-decor="${SHELL_BORDER_DECOR}" aria-pressed="false">Shell Border</button>
                <button id="swirls-btn" type="button" class="decor-option-btn" data-decor="${SWIRL_DECOR}" aria-pressed="false">Swirls</button>
                <button id="cherries-btn" type="button" class="decor-option-btn cherry-option-btn" aria-pressed="false">Cherries</button>
              </div>
            </section>

            <section class="decor-control-group shell-border-placement-group" hidden>
              <div class="decor-field-label">Placement</div>
              <div class="shell-border-edge-controls" role="group" aria-label="Shell border edge">
                <button type="button" class="shell-border-edge-btn is-selected" data-shell-edge="top" aria-pressed="true">Top edge</button>
                <button type="button" class="shell-border-edge-btn" data-shell-edge="bottom" aria-pressed="false">Bottom edge</button>
              </div>
            </section>

            <section class="decor-control-group swirl-quantity-group" hidden>
              <div class="decor-field-label">Quantity</div>
              <div class="swirl-quantity-controls" role="group" aria-label="Swirl quantity">
                <button type="button" class="swirl-quantity-btn" data-swirl-count="6" aria-pressed="false">6</button>
                <button type="button" class="swirl-quantity-btn is-selected" data-swirl-count="8" aria-pressed="true">8</button>
                <button type="button" class="swirl-quantity-btn" data-swirl-count="12" aria-pressed="false">12</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>

  <button id="order-summary-btn" class="order-summary-btn" type="button">Decorate Cake</button>
  <button id="decor-order-summary-btn" class="order-summary-btn decor-order-summary-btn" type="button" hidden>Order Summary</button>
</div>

  </div>
`;

document.getElementById("back-btn").addEventListener("click", () => {
  if (decorPanel && !decorPanel.hidden) {
    setCustomizerStep("flavor");
    return;
  }

  goBack();
});

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

const orderSections = document.getElementById("order-sections");
let requiredDate = restoredCustomizerState?.requiredDate || "";
let requiredTime = restoredCustomizerState?.requiredTime || "";
let fulfillmentMethod = restoredCustomizerState?.fulfillmentMethod === "delivery" ? "delivery" : "pickup";
let fulfillmentLocation = restoredCustomizerState?.fulfillmentLocation || "";

let activeTierIndex = Number.isInteger(restoredCustomizerState?.activeTierIndex)
  ? restoredCustomizerState.activeTierIndex
  : null;

const priceTotal = document.getElementById("price-total");
const servingsTotal = document.getElementById("servings-total");
const orderSummaryBtn = document.getElementById("order-summary-btn");
const decorOrderSummaryBtn = document.getElementById("decor-order-summary-btn");
const flavorPanel = document.getElementById("flavor-panel");
const decorPanel = document.getElementById("decor-panel");
const flavorToggle = document.getElementById("flavor-toggle");
const decorToggle = document.getElementById("decor-toggle");
const decorContent = document.getElementById("decor-content");
const decorOptionButtons = document.querySelectorAll(".decor-option-btn[data-decor]");
const cherryOptionButton = document.getElementById("cherries-btn");
const outerFrostingSelect = document.getElementById("outer-frosting-select");
const outerFrostingColorInput = document.getElementById("outer-frosting-color");
const decorColorSwatches = document.querySelectorAll(".decor-color-swatch");
const shellBorderEdgeButtons = document.querySelectorAll(".shell-border-edge-btn");
const shellBorderPlacementGroup = document.querySelector(".shell-border-placement-group");
const swirlQuantityControls = document.querySelector(".swirl-quantity-controls");
const swirlQuantityGroup = document.querySelector(".swirl-quantity-group");
const swirlQuantityButtons = document.querySelectorAll(".swirl-quantity-btn");
const extraBackupToggle = document.getElementById("extra-backup-toggle");
const extraBackupContent = document.getElementById("extra-backup-content");
const extraBackupSizeButtons = document.querySelectorAll(".extra-backup-size-btn");
const extraBackupSizeVisuals = document.querySelectorAll(".extra-backup-size-visual");

decorContent.hidden = false;
extraBackupContent.hidden = false;
extraBackupSizeVisuals.forEach(applyBlankTierColorsToModelViewer);

const selections = Array.isArray(restoredCustomizerState?.selections) && restoredCustomizerState.selections.length
  ? restoredCustomizerState.selections.map((selection) => ({
      label: selection.label,
      size: selection.size,
      cupcakeCount: selection.cupcakeCount,
      kind: selection.kind,
      flavor: selection.flavor || "",
      frosting: selection.frosting || "",
      filling: selection.filling || "",
      signature: selection.signature || "",
      decor: selection.decor || "",
      shellBorderEdge: selection.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE,
      swirlCount: normalizeSwirlCount(selection.swirlCount),
      cherries: selection.cherries === true,
      outerFrosting: selection.outerFrosting || "",
      outerFrostingColor: selection.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR
    }))
  : parts.map(part => ({
      label: part.label,
      size: part.size,
      cupcakeCount: part.cupcakeCount,
      kind: part.kind,
      flavor: "",
      frosting: "",
      filling: "",
      signature: "",
      decor: "",
      shellBorderEdge: SHELL_BORDER_DEFAULT_EDGE,
      swirlCount: DEFAULT_SWIRL_COUNT,
      cherries: false,
      outerFrosting: "",
      outerFrostingColor: DEFAULT_OUTER_FROSTING_COLOR
    }));

customizerPreviewSelections = selections;

function getBaseCustomizerSelections(selectionList = selections) {
  return selectionList.filter((selection) => selection.kind !== "extra-backup");
}

function getExtraBackupSelections(selectionList = selections) {
  return selectionList.filter((selection) => selection.kind === "extra-backup");
}

function getCurrentBuilderParts() {
  return getBaseCustomizerSelections().map((selection) => {
    const matchingOriginalPart = parts.find((part) => {
      return part.kind === selection.kind
        && part.label === selection.label
        && (part.size || null) === (selection.size || null);
    });

    return {
      ...(matchingOriginalPart || {}),
      kind: selection.kind,
      size: selection.size,
      cupcakeCount: selection.cupcakeCount,
      label: selection.label
    };
  });
}

function persistCustomizerState(view = "customizer") {
  setSavedAppState(getRecommendationStatePayload(recommendation, {
    activeTierIndex,
    requiredDate,
    requiredTime,
    fulfillmentMethod,
    fulfillmentLocation,
    selections: selections.map((selection) => ({
      label: selection.label,
      size: selection.size,
      cupcakeCount: selection.cupcakeCount,
      kind: selection.kind,
      flavor: selection.flavor || "",
      frosting: selection.frosting || "",
      filling: selection.filling || "",
      signature: selection.signature || "",
      decor: selection.decor || "",
      shellBorderEdge: selection.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE,
      swirlCount: normalizeSwirlCount(selection.swirlCount),
      cherries: selection.cherries === true,
      outerFrosting: selection.outerFrosting || "",
      outerFrostingColor: selection.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR
    }))
  }, view));
}

function setCustomizerStep(step = "flavor") {
  const isDecorStep = step === "decor";

  if (flavorPanel) {
    flavorPanel.hidden = isDecorStep;
  }
  if (decorPanel) {
    decorPanel.hidden = !isDecorStep;
  }
  if (orderSummaryBtn) {
    orderSummaryBtn.hidden = isDecorStep;
  }
  if (decorOrderSummaryBtn) {
    decorOrderSummaryBtn.hidden = !isDecorStep;
  }

  if (isDecorStep) {
    syncDecorButtons(activeTierIndex);
  } else {
    setAccordionSection("flavor");
    if (activeTierIndex !== null) {
      selectTier(activeTierIndex);
    }
  }

  persistCustomizerState(isDecorStep ? "decor" : "customizer");
}

window.setCustomizerStep = setCustomizerStep;

function getRoundCakeOption(size) {
  return cakeOptions.find((cake) => cake.type === "round" && cake.size === size);
}

function formatMoney(value) {
  return Number(value).toFixed(2);
}

function getSelectionBasePrice(selection) {
  if (!selection) return 0;

  if (selection.kind === "cupcakes") {
    return (selection.cupcakeCount || 0) * CUPCAKE_PRICE;
  }

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

function getSelectionServings(selection) {
  if (!selection) return 0;

  if (selection.kind === "cupcakes") {
    return selection.cupcakeCount || 0;
  }

  if (selection.size) {
    return getRoundCakeOption(selection.size)?.servings || 0;
  }

  if (selection.label?.includes("1/4")) return cakeOptions.find((cake) => cake.name === "1/4 sheet cake")?.servings || 0;
  if (selection.label?.includes("1/2")) return cakeOptions.find((cake) => cake.name === "1/2 sheet cake")?.servings || 0;
  if (selection.label?.toLowerCase().includes("sheet")) return cakeOptions.find((cake) => cake.name === "full sheet cake")?.servings || 0;

  return 0;
}

function getSelectionsBaseTotal(selectionList) {
  return selectionList.reduce((total, selection) => total + getSelectionBasePrice(selection), 0);
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
  const requiredDateValue = requiredDate ? new Date(`${requiredDate}T12:00:00`) : now;
  const promiseDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(requiredDateValue);
  const promiseTime = requiredTime
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(`2000-01-01T${requiredTime}`))
    : new Intl.DateTimeFormat("en-US", {
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
  const subtotal = getSelectionsBaseTotal(summarySelections) + calculateCustomizationPrice(summarySelections);
  const taxRate = 0.0725;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const fulfillmentLabel = fulfillmentMethod === "delivery" ? "Delivery" : "Pickup";
  const fulfillmentWindowLabel = fulfillmentMethod === "delivery" ? "Delivery window" : "Pickup window";
  const fulfillmentLocationText = fulfillmentMethod === "delivery" && fulfillmentLocation
    ? fulfillmentLocation
    : "Road St.";

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
              <div class="summary-customer-window">${fulfillmentWindowLabel}: XX:XX</div>
            </div>
          </div>

          <div class="summary-sheet-meta">
            <div class="summary-sheet-promise">${promiseDate} @ ${promiseTime}</div>
            <div class="summary-sheet-status">${fulfillmentLabel}</div>
            <div class="summary-sheet-submeta">Date Ordered: ${orderedDate}</div>
            <div class="summary-sheet-submeta">Taken By: Cakesupply</div>
            <div class="summary-sheet-submeta">Status: Open, Unpaid</div>
          </div>
        </div>

        <div class="summary-sheet-contact-row">
          <div class="summary-sheet-contact-left"></div>
          <div class="summary-sheet-contact-right">
            <div>Customer name</div>
            <div>${fulfillmentLocationText}</div>
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
              if (selection.outerFrosting) detailRows.push(`<div class="summary-detail-row"><span>Outer frosting layer</span><span></span></div>`);
              if (selection.decor) detailRows.push(`<div class="summary-detail-row"><span>Decoration: ${selection.decor.charAt(0).toUpperCase() + selection.decor.slice(1)}</span><span></span></div>`);
              if (selection.decor === SWIRL_DECOR && selection.cherries) detailRows.push(`<div class="summary-detail-row"><span>Cherries: ${normalizeSwirlCount(selection.swirlCount)}</span><span></span></div>`);

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
        requiredDate,
        requiredTime,
        fulfillmentMethod,
        fulfillmentLocation,
        selections
      });
    });
  });
}

function renderRequiredDateOverlay() {
  const existingOverlay = document.getElementById("required-date-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "required-date-overlay";
  overlay.className = "fulfillment-overlay";
  overlay.innerHTML = `
    <div class="fulfillment-dialog required-date-dialog" role="dialog" aria-modal="true" aria-labelledby="required-date-title">
      <div class="fulfillment-dialog-inner">
        <p id="required-date-title" class="fulfillment-title">Date required</p>
        <div class="required-date-field">
          <label class="fulfillment-date-label" for="required-date-input">Select date</label>
          <input
            type="date"
            id="required-date-input"
            class="fulfillment-date-input"
            value="${requiredDate}"
            min="${new Date().toISOString().split("T")[0]}">
        </div>
        <div class="fulfillment-actions">
          <button type="button" class="fulfillment-secondary-btn">Cancel</button>
          <button type="button" class="fulfillment-primary-btn">Continue</button>
        </div>
      </div>
    </div>
  `;

  customizer.appendChild(overlay);

  const dateInput = overlay.querySelector("#required-date-input");
  const cancelButton = overlay.querySelector(".fulfillment-secondary-btn");
  const continueButton = overlay.querySelector(".fulfillment-primary-btn");

  dateInput?.addEventListener("change", () => {
    requiredDate = dateInput.value || "";
    persistCustomizerState();
  });

  cancelButton?.addEventListener("click", () => {
    overlay.remove();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });

  continueButton?.addEventListener("click", () => {
    if (!dateInput?.value) {
      dateInput?.focus();
      dateInput?.showPicker?.();
      return;
    }

    requiredDate = dateInput.value || "";
    persistCustomizerState();
    overlay.remove();
    renderRequiredTimeOverlay();
  });
}

function renderRequiredTimeOverlay() {
  const existingOverlay = document.getElementById("required-time-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "required-time-overlay";
  overlay.className = "fulfillment-overlay";
  overlay.innerHTML = `
    <div class="fulfillment-dialog required-time-dialog" role="dialog" aria-modal="true" aria-labelledby="required-time-title">
      <div class="fulfillment-dialog-inner">
        <p id="required-time-title" class="fulfillment-title">Time required</p>
        <div class="required-date-field">
          <label class="fulfillment-date-label" for="required-time-input">Select time</label>
          <input
            type="time"
            id="required-time-input"
            class="fulfillment-date-input"
            value="${requiredTime}">
        </div>
        <div class="fulfillment-actions">
          <button type="button" class="fulfillment-secondary-btn">Cancel</button>
          <button type="button" class="fulfillment-primary-btn">Continue</button>
        </div>
      </div>
    </div>
  `;

  customizer.appendChild(overlay);

  const timeInput = overlay.querySelector("#required-time-input");
  const cancelButton = overlay.querySelector(".fulfillment-secondary-btn");
  const continueButton = overlay.querySelector(".fulfillment-primary-btn");

  timeInput?.addEventListener("change", () => {
    requiredTime = timeInput.value || "";
    persistCustomizerState();
  });

  cancelButton?.addEventListener("click", () => {
    overlay.remove();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });

  continueButton?.addEventListener("click", () => {
    if (!timeInput?.value) {
      timeInput?.focus();
      timeInput?.showPicker?.();
      return;
    }

    requiredTime = timeInput.value || "";
    persistCustomizerState();
    overlay.remove();
    renderOrderSummaryPage();
  });
}

function renderFulfillmentOverlay() {
  const existingOverlay = document.getElementById("fulfillment-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  if (fulfillmentMethod !== "delivery") {
    fulfillmentMethod = "pickup";
  }

  const overlay = document.createElement("div");
  overlay.id = "fulfillment-overlay";
  overlay.className = "fulfillment-overlay";
  overlay.innerHTML = `
    <div class="fulfillment-dialog" role="dialog" aria-modal="true" aria-labelledby="fulfillment-title">
      <div class="fulfillment-dialog-inner">
        <div class="fulfillment-body">
          <div class="fulfillment-options" role="radiogroup" aria-label="Pickup or delivery">
            <label class="fulfillment-option${fulfillmentMethod === "pickup" ? " is-selected" : ""}">
              <input type="radio" name="fulfillment-method" value="pickup" ${fulfillmentMethod === "pickup" ? "checked" : ""}>
              <span class="fulfillment-radio"></span>
              <span class="fulfillment-option-label">Pickup</span>
            </label>
          <label class="fulfillment-option${fulfillmentMethod === "delivery" ? " is-selected" : ""}">
            <input type="radio" name="fulfillment-method" value="delivery" ${fulfillmentMethod === "delivery" ? "checked" : ""}>
            <span class="fulfillment-radio"></span>
            <span class="fulfillment-option-label">Delivery</span>
          </label>
        </div>
        <div class="fulfillment-date-field${fulfillmentMethod === "delivery" ? " is-visible" : ""}">
            <label class="fulfillment-date-label" for="fulfillment-location">Delivery location</label>
            <input type="text" id="fulfillment-location" class="fulfillment-date-input" value="${fulfillmentLocation}" placeholder="Enter address or location">
          </div>
        </div>
        <div class="fulfillment-actions">
          <button type="button" class="fulfillment-secondary-btn">Cancel</button>
          <button type="button" class="fulfillment-primary-btn">Continue</button>
        </div>
      </div>
    </div>
  `;

  customizer.appendChild(overlay);

  const optionButtons = overlay.querySelectorAll(".fulfillment-option");
  const optionInputs = overlay.querySelectorAll('input[name="fulfillment-method"]');
  const dateField = overlay.querySelector(".fulfillment-date-field");
  const locationInput = overlay.querySelector(".fulfillment-date-input");
  const cancelButton = overlay.querySelector(".fulfillment-secondary-btn");
  const continueButton = overlay.querySelector(".fulfillment-primary-btn");

  const syncSelection = () => {
    optionButtons.forEach((button) => {
      const input = button.querySelector('input[name="fulfillment-method"]');
      const isSelected = input?.value === fulfillmentMethod;
      button.classList.toggle("is-selected", Boolean(isSelected));
      if (input) {
        input.checked = Boolean(isSelected);
      }
    });

    if (dateField) {
      dateField.classList.toggle("is-visible", fulfillmentMethod === "delivery");
    }
  };

  optionInputs.forEach((input) => {
    input.addEventListener("change", () => {
      fulfillmentMethod = input.value === "delivery" ? "delivery" : "pickup";
      syncSelection();
      persistCustomizerState();
    });
  });

  locationInput?.addEventListener("input", () => {
    fulfillmentLocation = locationInput.value || "";
    persistCustomizerState();
  });

  cancelButton?.addEventListener("click", () => {
    overlay.remove();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });

  continueButton?.addEventListener("click", () => {
    if (fulfillmentMethod === "delivery" && !locationInput?.value.trim()) {
      locationInput?.focus();
      return;
    }

    fulfillmentLocation = locationInput?.value || "";
    persistCustomizerState();
    overlay.remove();
    renderRequiredDateOverlay();
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

function getCakeEntryByIndex(index) {
  return cakeObjects.find((entry) => entry.partIndex === index) || null;
}

function shouldShowPeekToggle(index) {
  const selection = selections[index];
  return Boolean(selection?.size && selection.outerFrosting === OUTER_FROSTING_DECOR);
}

syncPeekToggleForIndex = function (index) {
  const row = getTierRow(index);
  const button = row?.querySelector(".peek-toggle");
  if (!button) return;

  const entry = getCakeEntryByIndex(index);
  const isVisible = shouldShowPeekToggle(index);
  const isPeeking = Boolean(entry?.peeking);

  button.hidden = !isVisible;
  button.classList.toggle("is-peeking", isPeeking);
  button.setAttribute("aria-pressed", isPeeking ? "true" : "false");
  button.setAttribute("aria-label", isPeeking ? "Restore outer frosting" : "Peek inside tier");
  row?.classList.toggle("is-peeking", isPeeking);
};

function syncPeekToggles() {
  selections.forEach((_, index) => syncPeekToggleForIndex(index));
}

function setTierPeeking(index, isPeeking) {
  const entry = getCakeEntryByIndex(index);
  if (!entry) return;

  entry.peeking = Boolean(isPeeking);
  if (entry.outerFrostingObject) {
    entry.outerFrostingObject.visible = !entry.peeking;
  }
  if (entry.decorGroup) {
    entry.decorGroup.visible = !entry.peeking;
  }

  syncPeekToggleForIndex(index);
}

function toggleTierPeeking(index) {
  const entry = getCakeEntryByIndex(index);
  if (!entry || !shouldShowPeekToggle(index)) return;

  setTierPeeking(index, !entry.peeking);
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
  setAccordionSection("flavor");
}

function setFlavorCardExpanded(isExpanded) {
  setAccordionSection(isExpanded ? "flavor" : null);
}

function setAccordionSection(sectionName = "flavor") {
  const flavorPanel = document.getElementById("flavor-panel");
  if (!flavorPanel) return;

  const activeSection = sectionName || null;

  flavorPanel.querySelectorAll(".accordion-section").forEach((section) => {
    const isExpanded = section.dataset.accordionSection === activeSection;
    section.classList.toggle("expanded", isExpanded);
    section.querySelector(".accordion-header")?.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  });

  flavorPanel.dataset.activeAccordion = activeSection || "";
}

function getDecorTargetIndex() {
  if (activeTierIndex !== null) return activeTierIndex;
  return selections.length ? 0 : null;
}

function syncDecorButtons(index) {
  decorOptionButtons.forEach((button) => {
    const isSelected = index !== null && selections[index]?.decor === button.dataset.decor;
    button.classList.toggle("is-selected", !!isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.disabled = !selections[index]?.size;
  });

  const selection = index !== null ? selections[index] : null;
  if (outerFrostingSelect) {
    outerFrostingSelect.value = selection?.outerFrosting || "";
    outerFrostingSelect.disabled = !selection?.size;
  }

  const color = selection?.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR;
  if (outerFrostingColorInput) {
    outerFrostingColorInput.value = color;
    outerFrostingColorInput.disabled = !selection?.size;
  }

  decorColorSwatches.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.decorColor?.toLowerCase() === color.toLowerCase());
    button.disabled = !selection?.size;
  });

  const isShellBorderSelected = selection?.decor === SHELL_BORDER_DECOR;
  if (shellBorderPlacementGroup) {
    shellBorderPlacementGroup.hidden = !isShellBorderSelected;
  }

  const shellEdge = selection?.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE;
  shellBorderEdgeButtons.forEach((button) => {
    const isSelected = button.dataset.shellEdge === shellEdge;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.disabled = !selection?.size || !isShellBorderSelected;
  });

  const isSwirlsSelected = selection?.decor === SWIRL_DECOR;
  const hasCherries = isSwirlsSelected && selection?.cherries === true;
  if (cherryOptionButton) {
    cherryOptionButton.classList.toggle("is-selected", !!hasCherries);
    cherryOptionButton.setAttribute("aria-pressed", hasCherries ? "true" : "false");
    cherryOptionButton.disabled = !selection?.size;
  }

  if (swirlQuantityGroup) {
    swirlQuantityGroup.hidden = !isSwirlsSelected;
  }

  if (swirlQuantityControls) {
    swirlQuantityControls.hidden = !isSwirlsSelected;
  }

  const swirlCount = normalizeSwirlCount(selection?.swirlCount);
  swirlQuantityButtons.forEach((button) => {
    const isSelected = Number(button.dataset.swirlCount) === swirlCount;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.disabled = !selection?.size || !isSwirlsSelected;
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

function reindexCakeObjectsAfterSelectionRemoval(selectionIndex) {
  cakeObjects.forEach((entry) => {
    if (entry.partIndex > selectionIndex) {
      entry.partIndex -= 1;
      entry.decorGroup?.userData && (entry.decorGroup.userData.partIndex = entry.partIndex);
      entry.object.traverse((child) => {
        child.userData.partIndex = entry.partIndex;
      });
      entry.decorGroup?.traverse((child) => {
        child.userData.partIndex = entry.partIndex;
      });
      entry.outerFrostingObject?.traverse((child) => {
        child.userData.partIndex = entry.partIndex;
      });
    }
  });
}

function reflowMainCakeStack() {
  let currentHeight = 0;

  cakeObjects
    .filter((entry) => entry.kind === "main")
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .forEach((entry) => {
      const modelBaseY = typeof entry.modelBaseY === "number"
        ? entry.modelBaseY
        : entry.object.position.y - (entry.stackY || 0);

      entry.modelBaseY = modelBaseY;
      entry.stackY = currentHeight;
      entry.object.position.y = modelBaseY + currentHeight;
      positionOuterFrostingForEntry(entry);
      currentHeight += entry.tierHeight || 0;
    });
}

function recenterCustomizerCameraOnCake() {
  if (!camera) return;

  const mainEntries = cakeObjects.filter((entry) => entry.kind === "main");
  if (!mainEntries.length) return;

  const box = new THREE.Box3();
  mainEntries.forEach((entry) => box.expandByObject(entry.object));
  if (box.isEmpty()) return;

  const center = new THREE.Vector3();
  box.getCenter(center);

  const nextTarget = new THREE.Vector3(0, center.y, 0);
  const delta = nextTarget.clone().sub(customizerCameraTarget);
  if (delta.lengthSq() < 0.000001) return;

  customizerCameraAnimation = null;
  customizerCameraTarget.copy(nextTarget);
  camera.position.add(delta);
  setOrbitTarget(nextTarget);
}

function removeCustomizerSelection(selectionIndex) {
  if (!selections[selectionIndex] || !shouldShowTierRemoveButton(selectionIndex)) return;

  const objectIndex = cakeObjects.findIndex((entry) => entry.partIndex === selectionIndex);
  if (objectIndex !== -1) {
    const [entry] = cakeObjects.splice(objectIndex, 1);
    clearDecorGroup(entry);
    removeOuterFrostingForEntry(entry);
    cakeSceneRoot?.remove(entry.object);
    disposeMenuPreviewObject(entry.object);
  }

  selections.splice(selectionIndex, 1);
  reindexCakeObjectsAfterSelectionRemoval(selectionIndex);
  reflowMainCakeStack();

  if (visibleBackupTierIndex !== null) {
    if (visibleBackupTierIndex === selectionIndex) {
      visibleBackupTierIndex = null;
    } else if (visibleBackupTierIndex > selectionIndex) {
      visibleBackupTierIndex -= 1;
    }
  }

  customizerPreviewSelections = selections;
  syncBackupAnimationState();
  recenterCustomizerCameraOnCake();
  renderOrderRows();
  updatePrice();
  persistCustomizerState();

  if (!selections.length) {
    selectTier(null);
    return;
  }

  if (activeTierIndex === selectionIndex) {
    selectTier(Math.min(selectionIndex, selections.length - 1));
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

  orderSections.querySelectorAll(".peek-toggle").forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleTierPeeking(Number(button.dataset.index));
    };
  });

  orderSections.querySelectorAll(".tier-remove-btn").forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeCustomizerSelection(Number(button.dataset.index));
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
    const showPeekToggle = shouldShowPeekToggle(index);

    tierRow.innerHTML = `
      <div class="tier-row-actions">
        <button type="button" class="peek-toggle" data-index="${index}" aria-pressed="false" aria-label="Peek inside tier" ${showPeekToggle ? "" : "hidden"}>
          <svg class="peek-icon peek-icon-open" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path class="peek-eye-shape" d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z"></path>
            <circle class="peek-eye-pupil-cutout" cx="12" cy="12" r="3"></circle>
          </svg>
          <svg class="peek-icon peek-icon-closed" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 13.5c1.6 2 3.5 3 6 3s4.4-1 6-3"></path>
          </svg>
        </button>
      </div>
      <p><strong><span class="tier-title">${selection.label}</span></strong></p>
      <div class="tier-details">
        <p>Cake: <span data-field="flavor">-</span></p>
        <p>Frosting: <span data-field="frosting">-</span></p>
        <p>Filling: <span data-field="filling">-</span></p>
      </div>
    `;

    if (shouldShowTierRemoveButton(index)) {
      tierRow.classList.add("extra-backup-item");
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "tier-remove-btn";
      removeButton.dataset.index = index;
      removeButton.setAttribute("aria-label", selection.kind === "extra-backup" ? "Remove backup cake" : "Remove tier");
      removeButton.textContent = "x";
      tierRow.querySelector(".tier-row-actions")?.appendChild(removeButton);
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
  syncPeekToggles();

  if (activeTierIndex !== null && getTierRow(activeTierIndex)) {
    getTierRow(activeTierIndex).classList.add("active-tier-row");
  }
}

function updatePrice() {
  const baseSelections = getBaseCustomizerSelections();
  const base = getSelectionsBaseTotal(baseSelections);
  const extras = calculateCustomizationPrice(selections);
  const extraBackupSelections = getExtraBackupSelections();
  const backupPriceTotal = extraBackupSelections.reduce((total, backup) => {
    return total + (baseCakePrices[`${backup.size}" cake`] || 0);
  }, 0);
  const backupServingsTotal = extraBackupSelections.reduce((total, backup) => {
    const cake = getRoundCakeOption(backup.size);
    return total + (cake?.servings || 0);
  }, 0);

  priceTotal.textContent = base + extras + backupPriceTotal;
  servingsTotal.textContent = baseSelections.reduce((total, selection) => {
    return total + getSelectionServings(selection);
  }, 0) + backupServingsTotal;
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

function shouldShowTierRemoveButton(index) {
  const selection = selections[index];
  if (!selection) return false;
  if (selection.kind === "extra-backup") return true;
  if (selection.kind !== "main") return false;

  const mainIndexes = selections
    .map((item, itemIndex) => item.kind === "main" ? itemIndex : null)
    .filter((itemIndex) => itemIndex !== null);

  return mainIndexes.length > 1
    && (index === mainIndexes[0] || index === mainIndexes[mainIndexes.length - 1]);
}

function refreshTierPreview(index) {
  const tierObject = cakeObjects.find(({ partIndex }) => partIndex === index);
  if (!tierObject) return;

  applyTierColorsToObject(tierObject.object, selections[index]);
  void syncOuterFrostingForIndex(index);
  void syncDecorForIndex(index);
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
  syncPeekToggles();
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
    const currentIndex = activeTierIndex ?? (direction === 1 ? -1 : 0);
    const nextIndex = ((currentIndex + direction) % selections.length + selections.length) % selections.length;

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
  await initCakeBuilder3D(recommendation, getCurrentBuilderParts());

  for (let index = 0; index < selections.length; index += 1) {
    if (selections[index]?.kind === "extra-backup") {
      await addExtraBackupCakeObject(selections[index], index);
    }
  }

  await Promise.all(selections.map((_, index) => syncOuterFrostingForIndex(index)));
  await Promise.all(selections.map((_, index) => syncDecorForIndex(index)));

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

decorToggle?.addEventListener("click", () => {
  setAccordionSection("decor");
});

flavorToggle.addEventListener("click", () => {
  setAccordionSection("flavor");
});

decorOptionButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (activeTierIndex === null) return;

    if (button.dataset.decor === SHELL_BORDER_DECOR) {
      await toggleShellBorder(activeTierIndex);
    } else if (button.dataset.decor === SWIRL_DECOR) {
      await toggleSwirls(activeTierIndex);
    } else {
      selections[activeTierIndex].decor = button.dataset.decor || "";
      await syncDecorForIndex(activeTierIndex);
    }

    syncDecorButtons(activeTierIndex);
    persistCustomizerState();
  });
});

cherryOptionButton?.addEventListener("click", async () => {
  if (activeTierIndex === null) return;

  await toggleCherries(activeTierIndex);
  syncDecorButtons(activeTierIndex);
  persistCustomizerState();
});

swirlQuantityButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (activeTierIndex === null || !selections[activeTierIndex]?.size) return;

    selections[activeTierIndex].swirlCount = normalizeSwirlCount(button.dataset.swirlCount);
    if (selections[activeTierIndex].decor !== SWIRL_DECOR) {
      selections[activeTierIndex].decor = SWIRL_DECOR;
    }

    await updateSwirlDecor(activeTierIndex);
    syncDecorButtons(activeTierIndex);
    persistCustomizerState();
  });
});

shellBorderEdgeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (activeTierIndex === null || !selections[activeTierIndex]?.size) return;

    selections[activeTierIndex].shellBorderEdge = button.dataset.shellEdge || SHELL_BORDER_DEFAULT_EDGE;
    if (selections[activeTierIndex].decor !== SHELL_BORDER_DECOR) {
      selections[activeTierIndex].decor = SHELL_BORDER_DECOR;
    }

    await syncDecorForIndex(activeTierIndex);
    syncDecorButtons(activeTierIndex);
    persistCustomizerState();
  });
});

outerFrostingSelect?.addEventListener("change", () => {
  const targetIndex = getDecorTargetIndex();
  if (targetIndex === null) return;

  selections[targetIndex].outerFrosting = outerFrostingSelect.value;
  if (outerFrostingSelect.value && !selections[targetIndex].outerFrostingColor) {
    selections[targetIndex].outerFrostingColor = DEFAULT_OUTER_FROSTING_COLOR;
  }

  syncDecorButtons(targetIndex);
  void syncOuterFrostingForIndex(targetIndex);
  void syncDecorForIndex(targetIndex);
  syncPeekToggleForIndex(targetIndex);
  persistCustomizerState();
});

decorColorSwatches.forEach((button) => {
  button.addEventListener("click", () => {
    const targetIndex = getDecorTargetIndex();
    if (targetIndex === null) return;

    selections[targetIndex].outerFrosting = OUTER_FROSTING_DECOR;
    selections[targetIndex].outerFrostingColor = button.dataset.decorColor || DEFAULT_OUTER_FROSTING_COLOR;

    syncDecorButtons(targetIndex);
    void syncOuterFrostingForIndex(targetIndex);
    void syncDecorForIndex(targetIndex);
    syncPeekToggleForIndex(targetIndex);
    persistCustomizerState();
  });
});

outerFrostingColorInput?.addEventListener("input", () => {
  const targetIndex = getDecorTargetIndex();
  if (targetIndex === null) return;

  selections[targetIndex].outerFrosting = OUTER_FROSTING_DECOR;
  selections[targetIndex].outerFrostingColor = outerFrostingColorInput.value || DEFAULT_OUTER_FROSTING_COLOR;

  syncDecorButtons(targetIndex);
  void syncOuterFrostingForIndex(targetIndex);
  void syncDecorForIndex(targetIndex);
  syncPeekToggleForIndex(targetIndex);
  persistCustomizerState();
});

extraBackupToggle.addEventListener("click", () => {
  const isOpen = extraBackupToggle.getAttribute("aria-expanded") === "true";
  setAccordionSection(isOpen ? "flavor" : "backup");
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
    signature: "",
    decor: "",
    shellBorderEdge: SHELL_BORDER_DEFAULT_EDGE,
    swirlCount: DEFAULT_SWIRL_COUNT,
    cherries: false,
    outerFrosting: "",
    outerFrostingColor: DEFAULT_OUTER_FROSTING_COLOR
  };

  selections.push(newSelection);

  const newIndex = selections.length - 1;
  renderOrderRows();
  await addExtraBackupCakeObject(newSelection, newIndex);
  updatePrice();
  selectTier(newIndex);

  setAccordionSection("flavor");
  persistCustomizerState();
  });
});

orderSummaryBtn?.addEventListener("click", () => {
  setCustomizerStep("decor");
});

decorOrderSummaryBtn?.addEventListener("click", () => {
  renderFulfillmentOverlay();
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

  showRecommendationsPageView();
  persistRecommendationState();
}
}

function updateLandingHeroPreviewFromInput() {
  const guests = parseGuestCountValue(guestCountInput?.value ?? "");
  const recommendation = getNearestTieredPreviewRecommendation(guests);

  activeHeroRecommendation = recommendation;
  pendingLandingHeroTierSizes = recommendation?.tiers || null;
  syncLandingHeroPreviewMode(Boolean(recommendation));
  setLandingHeroTierConfiguration(pendingLandingHeroTierSizes);
}

const debouncedLandingHeroPreviewUpdate = debounce(updateLandingHeroPreviewFromInput, LIVE_PREVIEW_DEBOUNCE_MS);

guestCountInput?.addEventListener("input", () => {
  debouncedLandingHeroPreviewUpdate();
});

calculatorForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  debouncedLandingHeroPreviewUpdate.cancel();
  const guests = parseGuestCountValue(guestCountInput?.value ?? "");
  initializeCakeFlow(guests);
});

recommendationsBackButton?.addEventListener("click", () => {
  returnToLandingPage();
});

menuTab?.addEventListener("click", () => {
  openMenuPage();
});

galleryTab?.addEventListener("click", () => {
  openGalleryPage();
});

displayCaseTab?.addEventListener("click", () => {
  openDisplayCasePage();
});

orderTab?.addEventListener("click", () => {
  returnToLandingPage();
  requestAnimationFrame(() => {
    guestCountInput?.focus();
  });
});

clearSavedAppState();
showLandingPageView();

siteLogo?.addEventListener("click", () => {
  returnToLandingPage();
});

initLandingHero();
