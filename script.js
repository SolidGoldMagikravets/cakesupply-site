import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const cakeModel = document.getElementById("cake-model");
const passwordGateCake = document.getElementById("password-gate-cake");
const landingCakeHero = document.getElementById("landing-cake-hero");
const guestCountInput = document.getElementById("guest-count");
const calculateButton = document.getElementById("calculate-btn");
const calculatorForm = document.querySelector(".calculator-search-row");
const calculatorUi = document.getElementById("calculator-ui");
const servingsSlider = document.getElementById("servings-slider");
const priceSlider = document.getElementById("price-slider");
const priceSliderValue = document.getElementById("price-slider-value");
const heroRecommendationMeta = document.getElementById("hero-recommendation-meta");
const heroRecommendationLabel = document.getElementById("hero-recommendation-label");
const heroCustomizeButton = document.getElementById("hero-customize-btn");
const landingPage = document.getElementById("landing-page");
const menuPage = document.getElementById("menu-page");
const menuGrid = document.getElementById("menu-grid");
const galleryPage = document.getElementById("gallery-page");
const displayCasePage = document.getElementById("display-case-page");
const displayCaseTitle = document.getElementById("display-case-page-title");
const displayCaseDailyCakes = document.getElementById("display-case-daily-cakes");
const displayCaseDailyInfo = document.getElementById("display-case-daily-info");
const recommendationsPage = document.getElementById("recommendations-page");
const recommendationsBackButton = document.getElementById("recommendations-back-btn");
const homePage = document.getElementById("home-page");
const siteLogo = document.getElementById("site-logo");
const menuTab = document.getElementById("menu-tab");
const gingerbreadTab = document.getElementById("gingerbread-tab");
const displayCaseTab = document.getElementById("display-case-tab");
const orderTab = document.getElementById("order-tab");
const howToOrderStage = document.querySelector(".how-to-order-stage");
const howToOrderSticky = document.querySelector(".how-to-order-sticky");
const howToOrderVisualStage = document.querySelector(".how-to-order-visual-stage");
const howToOrderStepNumber = document.getElementById("how-to-order-step-number");
const howToOrderStepTitle = document.getElementById("how-to-order-step-title");
const howToOrderStepCopy = document.getElementById("how-to-order-step-copy");
const howToOrderServingCount = document.getElementById("how-to-order-serving-count");
const howToOrderCake3D = document.getElementById("how-to-order-cake-3d");
const queryParams = new URLSearchParams(window.location.search);
const isDevMode = queryParams.get("dev") === "1";
const APP_STATE_KEY = "cake-supply-app-state";
const BUILDER_ORDER_SUMMARY_KEY = "cake-supply-builder-order-summary";
const ORDERS_API_URL = "http://localhost:3000/orders";
const LANDING_HERO_BASE_SCALE = 1.62;
const LANDING_HERO_FRAME_PADDING = 1.46;
const LIVE_PREVIEW_DEBOUNCE_MS = 180;
let activeHeroRecommendation = null;
const HERO_SHARED_TRANSITION_MS = 720;
let menuPreviewObserver = null;
let displayCaseMidnightTimer = null;
let howToOrderScrollTicking = false;
const HOW_TO_ORDER_CAKE_MIN_SCALE = 1.28;
const HOW_TO_ORDER_CAKE_MAX_SCALE = 2.16;
const HOW_TO_ORDER_CAKE_FINAL_CENTER_Y = 0.36;
const HOW_TO_ORDER_DELIVERY_RECEDES_Z = -0.18;
const HOW_TO_ORDER_DELIVERY_LIFT_Y = 0.08;
const HOW_TO_ORDER_FLAVOR_SEQUENCE = [
  { size: 6, flavorSlug: "blueberry-cheesecake" },
  { size: 8, flavorSlug: "raspberry-chocolate-mousse" },
  { size: 10, flavorSlug: "red-velvet" }
];
const HOW_TO_ORDER_DECOR_SEQUENCE = [10, 8, 6];
const HOW_TO_ORDER_WHITE_FROSTING_COLOR = "#fffdf4";
const HOW_TO_ORDER_OUTER_FROSTING_SCALE = 1.015;
const HOW_TO_ORDER_FROSTING_PHASE_END = 0.72;
const HOW_TO_ORDER_DECOR_APPEAR_START = 0.78;
const HOW_TO_ORDER_SHELL_BORDER_SCALE = 0.9;
const HOW_TO_ORDER_STAND_MODEL_SRC = "decoration/stand1.glb";
const HOW_TO_ORDER_STAND_SCALE = 0.075;
let howToOrderCakeScene = null;
let howToOrderCakeCamera = null;
let howToOrderCakeRenderer = null;
let howToOrderCakeGroup = null;
let howToOrderCakeStand = null;
let howToOrderCakeStandTopY = 0;
let howToOrderCakeEntries = [];
let howToOrderCakeStackHeight = 0;
let howToOrderCakeOnlyOffsetY = 0;
let howToOrderCakeDeliveryOffsetY = 0;
let howToOrderCakeOnlyPositionZ = 0;
let howToOrderCakeReady = false;
let howToOrderCakeProgress = 0;
let howToOrderFlavorProgress = 0;
let howToOrderDecorProgress = 0;
let howToOrderDeliveryProgress = 0;
let howToOrderStageHasRevealed = false;
let howToOrderStageRevealStarted = false;
let displayCasePreviewCleanups = [];
let selectedRecommendationBudget = null;
let recommendationBudgetWasManuallySelected = false;
let liveRecommendationFrame = null;

const CAKE_LIGHTING = {
  key: 2.65,
  fill: 0.72,
  rim: 1.1,
  ambient: 0.72
};

const OUTER_FROSTING_DECOR = "outerfrosting";
const STRIPED_OUTER_FROSTING_DECOR = "striped-outerfrosting";
const OMBRE_OUTER_FROSTING_DECOR = "ombre-outerfrosting";
const HORIZONTAL_COMB_OUTER_FROSTING_DECOR = "horizontal-comb-outerfrosting";
const VERTICAL_COMB_OUTER_FROSTING_DECOR = "vertical-comb-outerfrosting";
const RUSTIC_OUTER_FROSTING_DECOR = "rustic-outerfrosting";
const NAKED_OUTER_FROSTING_DECOR = "naked-outerfrosting";
const OUTER_FROSTING_FINISH_OPTIONS = [
  { value: OUTER_FROSTING_DECOR, label: "Smooth" },
  { value: STRIPED_OUTER_FROSTING_DECOR, label: "Striped" },
  { value: OMBRE_OUTER_FROSTING_DECOR, label: "Ombre" },
  { value: HORIZONTAL_COMB_OUTER_FROSTING_DECOR, label: "Horizontal Comb" },
  { value: VERTICAL_COMB_OUTER_FROSTING_DECOR, label: "Vertical Comb" },
  { value: RUSTIC_OUTER_FROSTING_DECOR, label: "Rustic" },
  { value: NAKED_OUTER_FROSTING_DECOR, label: "Naked" }
];
const SHELL_BORDER_DECOR = "shell-border";
const SWIRL_DECOR = "swirls";
const CHERRY_DECOR = "cherries";
const SWAG_DECOR = "swags";
const SHELL_SWAG_DECOR = "shell-swag";
const EDIBLE_IMAGE_DECOR = "edible-image";
const DECORATION_LAYER_TYPES = [SHELL_BORDER_DECOR, SWAG_DECOR, SHELL_SWAG_DECOR, SWIRL_DECOR, CHERRY_DECOR];
const SHELL_BORDER_EDGES = ["top", "bottom"];
const DEFAULT_OUTER_FROSTING_COLOR = "#fff7c7";
const DEFAULT_STRIPE_FROSTING_COLOR = "#f8c7d0";
const DEFAULT_SHELL_FROSTING_COLOR = "#fffdf4";
const CUPCAKE_LINER_COLOR = "#f8f3e8";
const CUPCAKE_MODEL_SRC = "models/cupcake_single.glb";
const SHELL_BORDER_MODEL_SRC = "decoration/shell_single1.glb";
const SWIRL_MODEL_SRC = "decoration/swirl1.glb";
const CHERRY_MODEL_SRC = "decoration/cherry1.glb";
const SWAG_MODEL_SRC = "decoration/swag1.glb";
const SWIRL_ALLOWED_COUNTS = [6, 8, 12];
const DEFAULT_SWIRL_COUNT = 8;
const SWAG_PIECES_PER_DRAPE = 13;
const SWAG_SURFACE_OFFSET = 0.006;
const SWAG_ANCHOR_HEIGHT_RATIO = 0.88;
const SWAG_DROP_HEIGHT_RATIO = 0.23;
const SWAG_CENTER_LIFT_HEIGHT_RATIO = 0.004;
const SWAG_HORIZONTAL_COMPRESSION = 0.9;
const SWAG_CURVE_ROTATION_STRENGTH = 0.48;
const SWAG_MIN_SCALE = 0.02;
const SWAG_MAX_SCALE = 0.13;
const SWAG_SHELL_TRIM_PIECES_PER_DRAPE = 9;
const SWAG_SHELL_TRIM_DROP_RATIO = 0.42;
const SWAG_SHELL_TRIM_Y_OFFSET_RATIO = 0.018;
const SWAG_SHELL_TRIM_RADIAL_OFFSET = 0.01;
const SWAG_SHELL_TRIM_MIN_SCALE = 0.022;
const SWAG_SHELL_TRIM_MAX_SCALE = 0.046;
const STRIPED_OUTER_FROSTING_STRIPE_COUNT = 7;
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
const DEFAULT_EDIBLE_IMAGE_SCALE = 1;
const DEFAULT_EDIBLE_IMAGE_RADIUS = 0.92;
const DEFAULT_EDIBLE_IMAGE_ROTATION = 0;
const DEFAULT_EDIBLE_IMAGE_POSITION = { x: 0, y: 0 };
const EDIBLE_IMAGE_TOP_OFFSET = 0.002;
const DEFAULT_OMBRE_FROSTING_COLOR = "#f8c7d0";
const OUTER_FROSTING_MESH_FINISHES = [
  OUTER_FROSTING_DECOR,
  STRIPED_OUTER_FROSTING_DECOR,
  OMBRE_OUTER_FROSTING_DECOR
];

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

const CUPCAKE_DOZEN_PRICE = 35;
const CUPCAKE_QUANTITY_STEP = 12;
const CUPCAKE_MAX_STANDALONE = 60;
const CUPCAKE_MAX_SUPPLEMENT = 36;

function getDefaultEdibleImageSettings() {
  return {
    edibleImage: false,
    edibleImageFileName: "",
    edibleImageNotes: "",
    edibleImageScale: DEFAULT_EDIBLE_IMAGE_SCALE,
    edibleImageRadius: DEFAULT_EDIBLE_IMAGE_RADIUS,
    edibleImageRotation: DEFAULT_EDIBLE_IMAGE_ROTATION,
    edibleImageX: DEFAULT_EDIBLE_IMAGE_POSITION.x,
    edibleImageY: DEFAULT_EDIBLE_IMAGE_POSITION.y,
    edibleImageDataUrl: ""
  };
}

const DISPLAY_CASE_CAKE_POOL = [
  {
    name: "Berry Parade",
    size: 8,
    flavor: "Vanilla",
    frosting: "Vanilla Buttercream",
    filling: "Strawberry Puree",
    finish: "Striped",
    outerFrosting: STRIPED_OUTER_FROSTING_DECOR,
    outerFrostingColor: "#fff7c7",
    outerFrostingStripeColor: "#f8c7d0",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SWIRL_DECOR,
    swirlCount: 8,
    cherries: true,
    decorations: "Swirls, cherries",
    price: 92
  },
  {
    name: "Blue Ribbon Vanilla",
    size: 6,
    flavor: "Vanilla",
    frosting: "Cream Cheese",
    filling: "Blueberry Puree",
    finish: "Smooth",
    outerFrosting: OUTER_FROSTING_DECOR,
    outerFrostingColor: "#b9c7f2",
    outerFrostingStripeColor: "",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SHELL_BORDER_DECOR,
    shellBorderEdge: "top",
    decorations: "Shell border",
    price: 68
  },
  {
    name: "Garden Party",
    size: 8,
    flavor: "Lemon",
    frosting: "Vanilla Buttercream",
    filling: "Lemon Curd",
    finish: "Striped",
    outerFrosting: STRIPED_OUTER_FROSTING_DECOR,
    outerFrostingColor: "#c9dfbd",
    outerFrostingStripeColor: "#fff7c7",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SWIRL_DECOR,
    swirlCount: 12,
    cherries: false,
    decorations: "Swirls",
    price: 96
  },
  {
    name: "Mocha Dot",
    size: 6,
    flavor: "Chocolate",
    frosting: "Coffee Buttercream",
    filling: "Dulce De Leche",
    finish: "Smooth",
    outerFrosting: OUTER_FROSTING_DECOR,
    outerFrostingColor: "#8b6659",
    outerFrostingStripeColor: "",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SWIRL_DECOR,
    swirlCount: 6,
    cherries: true,
    decorations: "Swirls, cherries",
    price: 74
  },
  {
    name: "Pink Confetti",
    size: 10,
    flavor: "Marble",
    frosting: "White Chocolate Ganache",
    filling: "Raspberry Puree",
    finish: "Striped",
    outerFrosting: STRIPED_OUTER_FROSTING_DECOR,
    outerFrostingColor: "#f8c7d0",
    outerFrostingStripeColor: "#b9c7f2",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SHELL_BORDER_DECOR,
    shellBorderEdge: "bottom",
    decorations: "Bottom shell border",
    price: 128
  },
  {
    name: "Coconut Cloud",
    size: 8,
    flavor: "Coconut",
    frosting: "Coconut Cream Buttercream",
    filling: "Vanilla Custard",
    finish: "Smooth",
    outerFrosting: OUTER_FROSTING_DECOR,
    outerFrostingColor: "#fff7c7",
    outerFrostingStripeColor: "",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SHELL_BORDER_DECOR,
    shellBorderEdge: "top",
    decorations: "Shell border",
    price: 88
  },
  {
    name: "Key Lime Picnic",
    size: 6,
    flavor: "Coconut",
    frosting: "White Chocolate Ganache",
    filling: "Key Lime Curd",
    finish: "Striped",
    outerFrosting: STRIPED_OUTER_FROSTING_DECOR,
    outerFrostingColor: "#c9dfbd",
    outerFrostingStripeColor: "#f8c7d0",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SWIRL_DECOR,
    swirlCount: 8,
    cherries: true,
    decorations: "Swirls, cherries",
    price: 78
  },
  {
    name: "Tuxedo Trim",
    size: 10,
    flavor: "Chocolate",
    frosting: "Chocolate Mousse",
    filling: "White Chocolate Ganache",
    finish: "Smooth",
    outerFrosting: OUTER_FROSTING_DECOR,
    outerFrostingColor: "#fffdf4",
    outerFrostingStripeColor: "",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SHELL_BORDER_DECOR,
    shellBorderEdge: "top",
    decorations: "Shell border",
    price: 122
  },
  {
    name: "Raspberry Skies",
    size: 8,
    flavor: "Vanilla",
    frosting: "Raspberry Buttercream",
    filling: "Passionfruit Curd",
    finish: "Striped",
    outerFrosting: STRIPED_OUTER_FROSTING_DECOR,
    outerFrostingColor: "#b9c7f2",
    outerFrostingStripeColor: "#fff7c7",
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    decor: SWIRL_DECOR,
    swirlCount: 8,
    cherries: false,
    decorations: "Swirls",
    price: 94
  }
];

function getSavedAppState() {
  try {
    const savedState = localStorage.getItem(APP_STATE_KEY);
    return savedState ? JSON.parse(savedState) : null;
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

function showHomePageView() {
  teardownMenuPreviewObserver();
  if (homePage) {
    homePage.hidden = false;
    homePage.style.display = "block";
  }
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
  if (recommendationsPage) recommendationsPage.style.display = "";
  document.body.classList.add("home-active");
  document.body.classList.remove("order-active");
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

function showLandingPageView({ force = false } = {}) {
  const customizerEl = document.getElementById("customizer");
  if (!force && document.body.classList.contains("customizer-active") && customizerEl?.style.display === "block") {
    return;
  }
  if (!force && document.body.classList.contains("results-active")) {
    return;
  }

  teardownMenuPreviewObserver();
  if (homePage) {
    homePage.style.display = "none";
    homePage.hidden = true;
  }
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
  document.body.classList.add("order-active");
  document.body.classList.remove("home-active");
  document.body.classList.remove("results-active");
  document.body.classList.remove("menu-active");
  document.body.classList.remove("gallery-active");
  document.body.classList.remove("display-case-active");
  document.body.classList.remove("customizer-active");
  document.body.classList.remove("results-transitioning");
  if (heroRecommendationMeta) {
    heroRecommendationMeta.setAttribute("aria-hidden", "true");
  }
  if (customizerEl) customizerEl.style.display = "none";
}

function showRecommendationsPageView() {
  teardownMenuPreviewObserver();
  if (homePage) {
    homePage.style.display = "none";
    homePage.hidden = true;
  }
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
  document.body.classList.remove("home-active");
  document.body.classList.remove("order-active");
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
  document.body.classList.remove("home-active");
  document.body.classList.remove("order-active");
  document.body.classList.add("customizer-active");
  if (homePage) {
    homePage.style.display = "none";
    homePage.hidden = true;
  }
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
  if (homePage) {
    homePage.style.display = "none";
    homePage.hidden = true;
  }
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
  document.body.classList.remove("home-active");
  document.body.classList.remove("order-active");
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
  if (homePage) {
    homePage.style.display = "none";
    homePage.hidden = true;
  }
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
  document.body.classList.remove("home-active");
  document.body.classList.remove("order-active");
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
  if (homePage) {
    homePage.style.display = "none";
    homePage.hidden = true;
  }
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
  document.body.classList.remove("home-active");
  document.body.classList.remove("order-active");
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
  showLandingPageView({ force: true });
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
    view: "order",
    recommendation: null,
    customizerState: null
  });
}

function openHomePage() {
  debouncedLandingHeroPreviewUpdate.cancel();
  if (guestCountInput) {
    guestCountInput.value = "";
  }
  activeHeroRecommendation = null;
  pendingLandingHeroTierSizes = null;
  landingHeroUsesBlankPreview = false;
  showHomePageView();
  setSavedAppState({
    guests: null,
    view: "home",
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

function openGingerbreadPage() {
  debouncedLandingHeroPreviewUpdate.cancel();
  showGalleryPageView();
  setSavedAppState({ view: "gingerbread" });
}

function openDisplayCasePage() {
  debouncedLandingHeroPreviewUpdate.cancel();
  showDisplayCasePageView();
  renderDisplayCasePage();
  setSavedAppState({ view: "display-case" });
}

function formatDisplayCaseDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function getDisplayCaseDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getDisplayCaseSeed(dateKey) {
  return [...dateKey].reduce((seed, char) => {
    return Math.imul(seed ^ char.charCodeAt(0), 2654435761) >>> 0;
  }, 0x5f3759df);
}

function createDisplayCaseRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailyDisplayCaseCakes(date = new Date()) {
  const random = createDisplayCaseRandom(getDisplayCaseSeed(getDisplayCaseDateKey(date)));
  const pool = DISPLAY_CASE_CAKE_POOL.map((cake) => ({ ...cake }));

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(random() * (i + 1));
    [pool[i], pool[swapIndex]] = [pool[swapIndex], pool[i]];
  }

  return pool.slice(0, 3);
}

function escapeDisplayCaseHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDisplayCaseMoney(value) {
  return Number(value || 0).toFixed(2).replace(/\.00$/, "");
}

function teardownDisplayCasePreviews() {
  displayCasePreviewCleanups.forEach((cleanup) => cleanup?.());
  displayCasePreviewCleanups = [];
}

function scheduleDisplayCaseMidnightUpdate() {
  if (displayCaseMidnightTimer) {
    window.clearTimeout(displayCaseMidnightTimer);
  }

  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 1, 0);
  displayCaseMidnightTimer = window.setTimeout(() => {
    if (displayCasePage && !displayCasePage.hidden) {
      renderDisplayCasePage();
    }
    scheduleDisplayCaseMidnightUpdate();
  }, Math.max(nextMidnight.getTime() - now.getTime(), 1000));
}

function renderDisplayCasePage(date = new Date()) {
  if (displayCaseTitle) {
    displayCaseTitle.textContent = formatDisplayCaseDate(date);
  }
  if (!displayCaseDailyCakes) return;

  teardownDisplayCasePreviews();
  const cakes = getDailyDisplayCaseCakes(date);
  displayCaseDailyCakes.innerHTML = cakes.map((cake, index) => `
    <div class="display-case-cake-card" data-display-case-index="${index}">
      <div class="display-case-cake-preview" aria-label="${escapeDisplayCaseHTML(cake.name)} preview"></div>
    </div>
  `).join("");

  if (displayCaseDailyInfo) {
    displayCaseDailyInfo.innerHTML = cakes.map((cake) => `
      <article class="display-case-cake-info">
        <h2>${escapeDisplayCaseHTML(cake.name)}</h2>
        <p>${escapeDisplayCaseHTML(cake.flavor)} cake</p>
        <p>${escapeDisplayCaseHTML(cake.frosting)}${cake.filling ? `, ${escapeDisplayCaseHTML(cake.filling)}` : ""}</p>
        <p>${escapeDisplayCaseHTML(cake.finish)} finish${cake.decorations ? `, ${escapeDisplayCaseHTML(cake.decorations)}` : ""}</p>
        <strong>$${formatDisplayCaseMoney(cake.price)}</strong>
      </article>
    `).join("");
  }

  cakes.forEach((cake, index) => {
    const preview = displayCaseDailyCakes.querySelector(`[data-display-case-index="${index}"] .display-case-cake-preview`);
    if (!preview) return;

    void initDisplayCaseCakePreview(preview, cake).then((cleanup) => {
      if (typeof cleanup === "function") {
        displayCasePreviewCleanups.push(cleanup);
      }
    }).catch((error) => {
      console.warn("Unable to render display case cake preview", error);
    });
  });

  scheduleDisplayCaseMidnightUpdate();
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

function getHeroPreviewTransitionSnapshot() {
  const element = getHeroPreviewElement();
  if (!element) return null;

  const elementRect = element.getBoundingClientRect();
  const fallbackRect = landingCakeHero?.getBoundingClientRect();
  const rect = elementRect.width && elementRect.height
    ? elementRect
    : fallbackRect?.width && fallbackRect?.height
      ? fallbackRect
      : elementRect;

  return { element, rect };
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
    document.body.classList.remove("recommendations-entering");
    onComplete?.();
    return;
  }

  const targetPreview = document.querySelector(
    `.recommendation-cake-3d[data-recommendation-name="${CSS.escape(recommendation.name)}"][data-recommendation-type="${CSS.escape(recommendation.type)}"]`
  );

  if (!targetPreview) {
    document.body.classList.remove("results-transitioning");
    document.body.classList.remove("recommendations-entering");
    onComplete?.();
    return;
  }

  const targetRect = targetPreview.getBoundingClientRect();
  if (!targetRect.width || !targetRect.height) {
    document.body.classList.remove("results-transitioning");
    document.body.classList.remove("recommendations-entering");
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
    document.body.classList.remove("recommendations-entering");
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
let passwordGateRenderer = null;
let passwordGateScene = null;
let passwordGateCamera = null;
let passwordGateGroup = null;
let passwordGateTierEntries = [];
let passwordGateAnimationFrame = null;
let passwordGateInterval = null;
let passwordGateResizeHandler = null;
let passwordGateVisibilityHandler = null;
let passwordGateLockObserver = null;
let passwordGateStepTimeouts = [];
let passwordGateSceneIndex = 0;
const PASSWORD_GATE_TIER_SIZES = [10, 8, 6];
const PASSWORD_GATE_FLAVOR_INTERVAL_MS = 3000;
const PASSWORD_GATE_SCENE_INTERVAL_MS = landingHeroScenes[0].length * PASSWORD_GATE_FLAVOR_INTERVAL_MS;
const PASSWORD_GATE_FRAME_PADDING = 1.78;

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

function clearPasswordGateStepTimeouts() {
  passwordGateStepTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  passwordGateStepTimeouts = [];
}

function getPasswordGateEntriesBox() {
  const boxes = passwordGateTierEntries
    .filter((entry) => entry.object)
    .map((entry) => new THREE.Box3().setFromObject(entry.object));

  if (!boxes.length) return null;
  return boxes.reduce((combinedBox, box) => combinedBox.union(box), boxes[0].clone());
}

function framePasswordGateCamera() {
  if (!passwordGateCamera || !passwordGateGroup) return;

  passwordGateGroup.position.set(0, 0, 0);
  passwordGateGroup.updateWorldMatrix(true, true);

  const box = getPasswordGateEntriesBox();
  if (!box || box.isEmpty()) return;

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  passwordGateGroup.position.sub(center);
  passwordGateGroup.updateWorldMatrix(true, true);

  const width = Math.max(size.x, 0.001);
  const height = Math.max(size.y, 0.001);
  const verticalFov = THREE.MathUtils.degToRad(passwordGateCamera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * passwordGateCamera.aspect);
  const distanceForHeight = height / (2 * Math.tan(verticalFov / 2));
  const distanceForWidth = width / (2 * Math.tan(horizontalFov / 2));
  const distance = Math.max(distanceForHeight, distanceForWidth) * PASSWORD_GATE_FRAME_PADDING;

  passwordGateCamera.position.set(0, 0, distance);
  passwordGateCamera.lookAt(0, 0, 0);
  passwordGateCamera.near = Math.max(distance / 100, 0.01);
  passwordGateCamera.far = Math.max(distance * 100, 100);
  passwordGateCamera.updateProjectionMatrix();
}

function getPasswordGateSceneCombo(sceneIndex, entryIndex) {
  const sceneConfig = landingHeroScenes[sceneIndex % landingHeroScenes.length];
  return sceneConfig[entryIndex % sceneConfig.length];
}

function getPasswordGateComboColors(combo) {
  return {
    cake: colorToThree(getFlavorColor(cakeColorMap, combo.cake, defaultTierColors.cake)),
    frosting: colorToThree(getFlavorColor(frostingColorMap, combo.frosting, defaultTierColors.frosting)),
    filling: combo.filling
      ? colorToThree(getFlavorColor(fillingColorMap, combo.filling, defaultTierColors.filling))
      : null
  };
}

function applyPasswordGateSceneImmediately(sceneIndex) {
  if (!passwordGateTierEntries.length) return;

  passwordGateTierEntries.forEach((entry, index) => {
    const colors = getPasswordGateComboColors(getPasswordGateSceneCombo(sceneIndex, index));
    entry.targetColors = colors;
    entry.currentColors = {
      cake: colors.cake.clone(),
      frosting: colors.frosting.clone(),
      filling: colors.filling ? colors.filling.clone() : null
    };

    updatePasswordGateTierMaterialColors(entry);
  });
}

function queuePasswordGateSceneTransition(sceneIndex) {
  if (!passwordGateTierEntries.length) return;

  clearPasswordGateStepTimeouts();

  passwordGateTierEntries.forEach((entry, index) => {
    const timeoutId = window.setTimeout(() => {
      entry.targetColors = getPasswordGateComboColors(getPasswordGateSceneCombo(sceneIndex, index));
    }, index * PASSWORD_GATE_FLAVOR_INTERVAL_MS);

    passwordGateStepTimeouts.push(timeoutId);
  });
}

function updatePasswordGateTierMaterialColors(entry) {
  if (!entry?.object) return;

  applyTierColorsToObject(entry.object, {
    flavor: "__landing__",
    frosting: "__landing__",
    filling: entry.targetColors?.filling ? "__landing__" : ""
  });

  entry.object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      const role = material.userData?.role;
      const current = entry.currentColors?.[role];

      if (role === "filling") {
        material.transparent = !current;
        material.opacity = current ? 1 : 0;
      }

      if (current && material.color) {
        material.color.copy(current);
      }
    });
  });
}

function updatePasswordGateTierColors() {
  passwordGateTierEntries.forEach((entry) => {
    if (!entry.targetColors || !entry.currentColors) return;

    Object.keys(entry.currentColors).forEach((role) => {
      const current = entry.currentColors[role];
      const target = entry.targetColors[role];

      if (!current || !target) return;
      current.lerp(target, 0.08);
    });

    updatePasswordGateTierMaterialColors(entry);
  });
}

function startPasswordGateSceneInterval() {
  if (passwordGateInterval || document.hidden) return;

  passwordGateInterval = window.setInterval(() => {
    passwordGateSceneIndex = (passwordGateSceneIndex + 1) % landingHeroScenes.length;
    queuePasswordGateSceneTransition(passwordGateSceneIndex);
  }, PASSWORD_GATE_SCENE_INTERVAL_MS);
}

function stopPasswordGateSceneInterval() {
  if (!passwordGateInterval) return;
  clearInterval(passwordGateInterval);
  passwordGateInterval = null;
}

function startPasswordGateAnimation() {
  if (passwordGateAnimationFrame || document.hidden) return;

  const animatePasswordGateCake = () => {
    passwordGateAnimationFrame = requestAnimationFrame(animatePasswordGateCake);

    if (!passwordGateRenderer || !passwordGateScene || !passwordGateCamera || !passwordGateGroup) return;

    updatePasswordGateTierColors();
    passwordGateRenderer.render(passwordGateScene, passwordGateCamera);
  };

  animatePasswordGateCake();
}

function stopPasswordGateAnimation() {
  if (!passwordGateAnimationFrame) return;
  cancelAnimationFrame(passwordGateAnimationFrame);
  passwordGateAnimationFrame = null;
}

function stopPasswordGateCake() {
  stopPasswordGateAnimation();
  stopPasswordGateSceneInterval();
  clearPasswordGateStepTimeouts();
}

async function initPasswordGateCake() {
  if (!passwordGateCake || !document.body.classList.contains("password-gate-locked")) return;

  stopPasswordGateCake();

  if (passwordGateResizeHandler) {
    window.removeEventListener("resize", passwordGateResizeHandler);
    passwordGateResizeHandler = null;
  }

  if (passwordGateVisibilityHandler) {
    document.removeEventListener("visibilitychange", passwordGateVisibilityHandler);
    passwordGateVisibilityHandler = null;
  }

  passwordGateCake.innerHTML = "";
  passwordGateTierEntries = [];
  passwordGateSceneIndex = 0;

  passwordGateScene = new THREE.Scene();
  passwordGateScene.background = null;

  const width = passwordGateCake.clientWidth || 520;
  const height = passwordGateCake.clientHeight || 520;

  passwordGateCamera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  passwordGateRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  passwordGateRenderer.setPixelRatio(window.devicePixelRatio);
  passwordGateRenderer.setClearColor(0xffffff, 0);
  passwordGateRenderer.setSize(width, height);
  passwordGateRenderer.domElement.style.pointerEvents = "none";
  passwordGateCake.appendChild(passwordGateRenderer.domElement);

  const keyLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.key);
  keyLight.position.set(3.5, 5.5, 4);
  passwordGateScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.fill);
  fillLight.position.set(-3.5, 3.5, 3);
  passwordGateScene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.rim);
  rimLight.position.set(0, 2.5, -4);
  passwordGateScene.add(rimLight);

  passwordGateScene.add(new THREE.AmbientLight(0xffffff, CAKE_LIGHTING.ambient));

  passwordGateGroup = new THREE.Group();
  passwordGateGroup.rotation.y = -0.22;
  passwordGateScene.add(passwordGateGroup);

  const localLoader = new GLTFLoader();
  let currentHeight = 0;

  for (const size of PASSWORD_GATE_TIER_SIZES) {
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
    passwordGateGroup.add(tier);

    passwordGateTierEntries.unshift({
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

  applyPasswordGateSceneImmediately(passwordGateSceneIndex);
  framePasswordGateCamera();
  passwordGateRenderer.render(passwordGateScene, passwordGateCamera);

  startPasswordGateSceneInterval();
  startPasswordGateAnimation();

  passwordGateResizeHandler = () => {
    if (!passwordGateCake || !passwordGateRenderer || !passwordGateCamera) return;

    const nextWidth = passwordGateCake.clientWidth || 520;
    const nextHeight = passwordGateCake.clientHeight || 520;
    passwordGateCamera.aspect = nextWidth / nextHeight;
    passwordGateCamera.updateProjectionMatrix();
    passwordGateRenderer.setSize(nextWidth, nextHeight);
    framePasswordGateCamera();
    passwordGateRenderer.render(passwordGateScene, passwordGateCamera);
  };

  passwordGateVisibilityHandler = () => {
    if (document.hidden) {
      stopPasswordGateCake();
      return;
    }

    startPasswordGateSceneInterval();
    startPasswordGateAnimation();
  };

  window.addEventListener("resize", passwordGateResizeHandler);
  document.addEventListener("visibilitychange", passwordGateVisibilityHandler);

  if (!passwordGateLockObserver) {
    passwordGateLockObserver = new MutationObserver(() => {
      if (document.body.classList.contains("password-gate-locked")) return;
      stopPasswordGateCake();
    });

    passwordGateLockObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
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

function getCustomizerParts(recommendation) {
  return getRecommendationParts(recommendation).flatMap((part) => {
    if (part.kind !== "cupcakes") return [part];

    const cupcakeCount = part.cupcakeCount || CUPCAKE_QUANTITY_STEP;
    const dozenCount = Math.max(1, Math.ceil(cupcakeCount / CUPCAKE_QUANTITY_STEP));

    return Array.from({ length: dozenCount }, (_, dozenIndex) => {
      const countForDozen = Math.min(
        CUPCAKE_QUANTITY_STEP,
        Math.max(cupcakeCount - dozenIndex * CUPCAKE_QUANTITY_STEP, 0)
      );

      return {
        ...part,
        cupcakeCount: countForDozen,
        cupcakeDozenIndex: dozenIndex,
        cupcakeDozenCount: dozenCount,
        label: getCupcakeDozenLabel(countForDozen)
      };
    });
  });
}

function getCupcakeDozenLabel(cupcakeCount = CUPCAKE_QUANTITY_STEP) {
  const dozenCount = Math.max(Math.ceil((cupcakeCount || CUPCAKE_QUANTITY_STEP) / CUPCAKE_QUANTITY_STEP), 1);
  return `${dozenCount} ${dozenCount === 1 ? "Dozen" : "Dozen"} Cupcakes`;
}

function getCupcakeBasePrice(cupcakeCount = CUPCAKE_QUANTITY_STEP) {
  const dozenCount = Math.max(Math.ceil((cupcakeCount || CUPCAKE_QUANTITY_STEP) / CUPCAKE_QUANTITY_STEP), 1);
  return dozenCount * CUPCAKE_DOZEN_PRICE;
}

function normalizeSingleDozenCupcakeSelections(selectionList = []) {
  return selectionList.flatMap((selection) => {
    if (!isCupcakeKind(selection.kind)) return [selection];

    const totalCupcakes = Math.max(Number(selection.cupcakeCount) || CUPCAKE_QUANTITY_STEP, CUPCAKE_QUANTITY_STEP);
    const dozenCount = Math.max(Math.ceil(totalCupcakes / CUPCAKE_QUANTITY_STEP), 1);

    return Array.from({ length: dozenCount }, (_, dozenIndex) => ({
      ...selection,
      label: "1 Dozen Cupcakes",
      cupcakeCount: CUPCAKE_QUANTITY_STEP,
      cupcakeDozenIndex: dozenIndex,
      cupcakeDozenCount: dozenCount
    }));
  });
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

  if (normalized.includes("liner")) return "liner";
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

      if (role === "liner" && clonedMaterial.color) {
        clonedMaterial.color.set(CUPCAKE_LINER_COLOR);
      }
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
      if (role === "liner") {
        if (material.color) material.color.set(CUPCAKE_LINER_COLOR);
        return;
      }
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

async function loadModelScene(src, localLoader = loader) {
  const loaderToUse = localLoader || new GLTFLoader();
  return new Promise((resolve, reject) => {
    loaderToUse.load(src, (gltf) => resolve(gltf.scene), undefined, reject);
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
  "red-velvet": { cake: "Red Velvet", frosting: "White Chocolate Ganache", filling: "" },
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

function initCupcakePreview3D(container, count) {
  container.innerHTML = "";

  const scene = new THREE.Scene();
  scene.background = null;

  const width = container.clientWidth || 248;
  const height = container.clientHeight || 122;
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const keyLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.key);
  keyLight.position.set(3, 4, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, CAKE_LIGHTING.fill);
  fillLight.position.set(-3, 2.5, 3);
  scene.add(fillLight);

  const ambient = new THREE.AmbientLight(0xffffff, CAKE_LIGHTING.ambient);
  scene.add(ambient);

  const group = new THREE.Group();
  scene.add(group);

  const totalCount = Math.min(count || CUPCAKE_QUANTITY_STEP, CUPCAKE_QUANTITY_STEP);
  const columns = 4;
  const rowsPerDozen = 3;
  const spacingX = 0.35;
  const spacingZ = 0.29;
  const loader = new GLTFLoader();

  loader.load(CUPCAKE_MODEL_SRC, (gltf) => {
    const template = gltf.scene;
    prepareTierMaterials(template);
    const bounds = normalizeCakeModelBounds(template);
    const scale = 0.28 / Math.max(bounds.width, bounds.depth, 0.001);

    for (let index = 0; index < totalCount; index += 1) {
      const cupcake = template.clone(true);
      cupcake.scale.setScalar(scale);
      cupcake.position.x = (index % columns - (columns - 1) / 2) * spacingX;
      cupcake.position.z = (Math.floor(index / columns) - (rowsPerDozen - 1) / 2) * spacingZ;
      group.add(cupcake);
    }

    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    group.position.x -= center.x;
    group.position.z -= center.z;
    group.rotation.x = 0.04;

    camera.position.set(0, 0.9, 2.2);
    camera.lookAt(0, 0.08, 0);
    renderer.render(scene, camera);
  }, undefined, () => {
    container.classList.add("is-unavailable");
  });
}

function createCupcakePreviewNode(count) {
  const cupcakePreview = document.createElement("div");
  cupcakePreview.className = "cupcake-preview";
  cupcakePreview.setAttribute("aria-label", `${count} cupcakes`);

  const visibleDozens = Math.min(
    Math.max(Math.ceil((count || CUPCAKE_QUANTITY_STEP) / CUPCAKE_QUANTITY_STEP), 1),
    3
  );
  const displayedCupcakeCount = visibleDozens * CUPCAKE_QUANTITY_STEP;
  const overflowCount = Math.max((count || 0) - displayedCupcakeCount, 0);
  const visualRow = document.createElement("div");
  visualRow.className = "cupcake-preview-visual-row";

  const shelfStack = document.createElement("div");
  shelfStack.className = "cupcake-preview-shelf-stack";
  shelfStack.style.setProperty("--dozen-count", visibleDozens);

  for (let dozenIndex = 0; dozenIndex < visibleDozens; dozenIndex += 1) {
    const shelf = document.createElement("div");
    shelf.className = "cupcake-preview-shelf";
    shelf.style.setProperty("--shelf-index", dozenIndex);

    const grid = document.createElement("div");
    grid.className = "cupcake-preview-grid";
    shelf.appendChild(grid);
    shelfStack.appendChild(shelf);

    requestAnimationFrame(() => initCupcakePreview3D(grid, CUPCAKE_QUANTITY_STEP));
  }

  visualRow.appendChild(shelfStack);

  if (overflowCount > 0) {
    const overflowBadge = document.createElement("div");
    overflowBadge.className = "cupcake-preview-overflow";
    overflowBadge.textContent = `+${overflowCount}`;
    visualRow.appendChild(overflowBadge);
  }

  cupcakePreview.appendChild(visualRow);
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

let scene, camera, renderer, loader, controls;
let cakeObjects = [];
let cakeSceneRoot = null;
let cakeAnimationFrame = null;
let edibleImageMesh = null;
let edibleImageTexture = null;
let edibleImageTextureKey = "";
let edibleImageSourceImage = null;
let edibleImageDragState = null;
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
let swagModelPromise = null;
let cameraViewGizmo = null;
let cameraViewButtons = [];
let activeCameraView = "front";
let customizerCameraTarget = new THREE.Vector3(0, 0.46, 0);
let customizerFrontCameraOffset = new THREE.Vector3(0, 0.32, 1.32);
let customizerCameraAnimation = null;
let finishedOrderSelectedGroupKey = "main";
let finishedOrderHitTargetLayer = null;

function isBackupKind(kind) {
  return kind === "backup" || kind === "extra-backup";
}

function isCupcakeKind(kind) {
  return kind === "cupcakes";
}

function isCupcakeStackSelected() {
  const selectedSelection = activeCustomizerTierIndex !== null
    ? customizerPreviewSelections[activeCustomizerTierIndex]
    : null;

  return activeCustomizerTierIndex !== null && isCupcakeKind(selectedSelection?.kind);
}

function getCupcakeStackMetrics(cupcakeEntries) {
  const stackBox = new THREE.Box3();
  cupcakeEntries.forEach((entry) => stackBox.expandByObject(entry.object));

  if (stackBox.isEmpty()) {
    return { centerX: 0, width: 0 };
  }

  const center = new THREE.Vector3();
  stackBox.getCenter(center);

  return {
    centerX: center.x,
    width: Math.max(stackBox.max.x - stackBox.min.x, 0)
  };
}

function getActiveCupcakeEntry() {
  if (activeCustomizerTierIndex === null) return null;
  return cakeObjects.find((entry) => {
    return isCupcakeKind(entry.kind) && entry.partIndex === activeCustomizerTierIndex;
  }) || null;
}

function getActiveCupcakeClusterIndex() {
  const activeCupcakeEntry = getActiveCupcakeEntry();
  return Number.isInteger(activeCupcakeEntry?.clusterIndex) ? activeCupcakeEntry.clusterIndex : null;
}

function getActiveCupcakeClusterOffset() {
  const activeCupcakeEntry = getActiveCupcakeEntry();
  return typeof activeCupcakeEntry?.clusterOffsetX === "number" ? activeCupcakeEntry.clusterOffsetX : 0;
}

function setFocusObject(activeObject = null) {
  void activeObject;
}

function syncFocusedSelectionFrame() {
  if (activeCustomizerTierIndex === null) {
    setFocusObject(null);
    return;
  }

  const activeEntry = cakeObjects.find((entry) => entry.partIndex === activeCustomizerTierIndex) || null;
  setFocusObject(activeEntry);
}

function syncBackupAnimationState() {
  if (!cakeObjects.length) return;

  const mainEntries = cakeObjects.filter((entry) => entry.kind === "main");
  const backupEntries = cakeObjects.filter((entry) => isBackupKind(entry.kind));
  const cupcakeEntries = cakeObjects.filter((entry) => isCupcakeKind(entry.kind));
  if (!mainEntries.length) return;

  if (!backupEntries.length && !cupcakeEntries.length) {
    mainEntries.forEach((entry) => {
      entry.centerX = entry.homeX ?? 0;
      entry.hiddenX = entry.homeX ?? 0;
      entry.currentX = entry.currentX ?? entry.homeX ?? 0;
      entry.targetX = entry.targetX ?? entry.homeX ?? 0;
      entry.currentZ = entry.currentZ ?? entry.homeZ ?? 0;
      entry.targetZ = entry.homeZ ?? 0;
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
    entry.currentZ = typeof entry.currentZ === "number" ? entry.currentZ : entry.homeZ ?? 0;
    entry.targetZ = entry.homeZ ?? 0;
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
    entry.currentZ = typeof entry.currentZ === "number" ? entry.currentZ : entry.homeZ ?? 0;
    entry.targetZ = entry.homeZ ?? 0;
  });

  const shouldShowCupcakeStack = isCupcakeStackSelected();
  const selectedCupcakeClusterIndex = getActiveCupcakeClusterIndex();
  const selectedCupcakeClusterOffset = getActiveCupcakeClusterOffset();
  const cupcakeHiddenOffset = Math.max(getCupcakeStackMetrics(cupcakeEntries).width + 1.4, 1.8);

  cupcakeEntries.forEach((entry) => {
    const clusterOffset = entry.clusterOffsetX || 0;
    const clusterSide = (entry.clusterIndex || 0) < (selectedCupcakeClusterIndex || 0) ? -1 : 1;
    entry.centerX = clusterOffset - selectedCupcakeClusterOffset;
    entry.hiddenX = clusterSide * cupcakeHiddenOffset;
    entry.targetX = shouldShowCupcakeStack && entry.clusterIndex === selectedCupcakeClusterIndex
      ? entry.centerX
      : entry.hiddenX;
    entry.currentX = typeof entry.currentX === "number" ? entry.currentX : entry.targetX;
    if (!shouldShowCupcakeStack) {
      entry.currentX = entry.hiddenX;
      entry.object.position.x = entry.currentX;
    }
    entry.currentZ = typeof entry.currentZ === "number" ? entry.currentZ : entry.homeZ ?? 0;
    entry.targetZ = entry.homeZ ?? 0;
  });
}

function frameCupcakeStackForEditing() {
  if (!camera || !cakeObjects.length) return;
  enforceCupcakeEditModelVisibility();

  const box = new THREE.Box3();
  cakeObjects.forEach((entry) => {
    if (isCupcakeKind(entry.kind)) {
      expandCupcakeTargetBox(box, entry);
    }
  });

  if (box.isEmpty()) return;

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const fov = THREE.MathUtils.degToRad(camera.fov || 45);
  const visibleHeight = Math.max(size.y + size.z * 0.32, 0.5);
  const fitHeightDistance = visibleHeight / (2 * Math.tan(fov / 2));
  const fitWidthDistance = size.x / (2 * Math.tan(fov / 2) * Math.max(camera.aspect || 1, 0.1));
  const distance = Math.max(fitHeightDistance, fitWidthDistance, 1.7) * 1.18;
  const endTarget = new THREE.Vector3(center.x, Math.max(center.y, 0.22), center.z + size.z * 0.06);
  const endPosition = endTarget.clone().add(new THREE.Vector3(0, Math.max(size.y * 0.85, 0.62), distance));

  customizerCameraAnimation = null;
  camera.position.copy(endPosition);
  camera.up.set(0, 1, 0);
  customizerCameraTarget.copy(endTarget);
  customizerFrontCameraOffset.copy(endPosition).sub(endTarget);
  setOrbitTarget(endTarget);
  activeCameraView = "front";
  syncCameraViewButtons();
}

function expandCupcakeTargetBox(box, entry) {
  if (!entry?.object?.visible) return;

  const targetOffset = getEntryTargetWorldOffset(entry);

  const entryBox = new THREE.Box3().setFromObject(entry.object);
  if (!entryBox.isEmpty()) {
    entryBox.translate(targetOffset);
    box.union(entryBox);
  }

  if (entry.cupcakeSwirlGroup?.visible) {
    const swirlBox = new THREE.Box3().setFromObject(entry.cupcakeSwirlGroup);
    if (!swirlBox.isEmpty()) {
      swirlBox.translate(targetOffset);
      box.union(swirlBox);
    }
  }
}

function getEntryTargetWorldOffset(entry) {
  const currentLocalPosition = entry.object.position.clone();
  const targetLocalPosition = new THREE.Vector3(
    entry.targetX ?? currentLocalPosition.x,
    entry.targetY ?? currentLocalPosition.y,
    entry.targetZ ?? currentLocalPosition.z
  );

  if (!entry.object.parent) {
    return targetLocalPosition.sub(currentLocalPosition);
  }

  entry.object.parent.updateWorldMatrix(true, false);
  const currentWorldPosition = currentLocalPosition.clone();
  const targetWorldPosition = targetLocalPosition.clone();
  entry.object.parent.localToWorld(currentWorldPosition);
  entry.object.parent.localToWorld(targetWorldPosition);
  return targetWorldPosition.sub(currentWorldPosition);
}

function getCupcakePreviewWindowItems() {
  const selectionIndex = activeCustomizerTierIndex;
  const selection = selectionIndex !== null ? customizerPreviewSelections[selectionIndex] : null;
  if (!isCupcakeKind(selection?.kind)) return [];

  return [{
    selection,
    selectionIndex,
    dozenIndex: selection.cupcakeDozenIndex || 0,
    dozenCount: 1
  }];
}

function renderCupcakePreviewWindows(isVisible = isCupcakeStackSelected()) {
  const stack = document.getElementById("cupcake-preview-window-stack");
  if (!stack) return;

  const items = getCupcakePreviewWindowItems();
  stack.innerHTML = "";
  stack.hidden = !isVisible;
  stack.style.setProperty("--preview-window-count", Math.max(items.length, 1));

  items.forEach((item) => {
    const isActiveWindow = item.selectionIndex === activeCustomizerTierIndex;
    const windowEl = document.createElement("button");
    windowEl.type = "button";
    windowEl.className = `cupcake-preview-window${isActiveWindow ? " is-active" : ""}`;
    windowEl.dataset.index = item.selectionIndex;
    windowEl.dataset.kind = "cupcakes";
    windowEl.setAttribute("aria-label", `Edit ${item.selection.label || "1 Dozen Cupcakes"}`);

    const viewport = document.createElement("span");
    viewport.className = "cupcake-preview-window-viewport";
    const label = document.createElement("span");
    label.className = "cupcake-preview-window-label";
    label.textContent = "1 Dozen Cupcakes";

    windowEl.appendChild(viewport);
    windowEl.appendChild(label);
    windowEl.addEventListener("click", () => {
      selectTier(item.selectionIndex);
      renderCupcakePreviewWindows(true);
    });
    stack.appendChild(windowEl);

    requestAnimationFrame(() => initCupcakePreview3D(viewport, CUPCAKE_QUANTITY_STEP));
  });
}

function syncCupcakePreviewWindowVisibility(isVisible = isCupcakeStackSelected()) {
  const stack = document.getElementById("cupcake-preview-window-stack");
  const builder = document.getElementById("cake-builder-3d");

  if (builder) {
    builder.classList.remove("is-cupcake-window-mode");
  }
  if (!stack) return;

  stack.hidden = true;
  stack.innerHTML = "";
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
  const isViewingCupcakes = isCupcakeStackSelected();

  if (view === "side") {
    return customizerFrontCameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  }

  if (view === "top") {
    return new THREE.Vector3(0, distance * (isViewingCupcakes ? 1.7 : 1), 0.001);
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

function shiftCustomizerCameraTarget(nextTarget) {
  if (!camera) return;

  const delta = nextTarget.clone().sub(customizerCameraTarget);
  if (delta.lengthSq() < 0.000001) return;

  customizerCameraAnimation = null;
  customizerCameraTarget.copy(nextTarget);
  camera.position.add(delta);
  setOrbitTarget(nextTarget);
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

function resizeCustomizerRenderer() {
  const container = document.getElementById("cake-builder-3d");
  if (!container || !renderer || !camera) return;

  const width = container.clientWidth || 420;
  const height = container.clientHeight || 520;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

async function initCakeBuilder3D(recommendation, builderParts = null, { showCameraGizmo = false } = {}) {
  const container = document.getElementById("cake-builder-3d");

  container.innerHTML = "";
  disposeEdibleImagePreview();
  cakeObjects = [];
  cameraViewGizmo = null;
  cameraViewButtons = [];
  finishedOrderHitTargetLayer = null;
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
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.target.copy(customizerCameraTarget);
  controls.update();

  if (showCameraGizmo) {
    attachCameraViewGizmo(container);
  }

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
  await syncEdibleImagePreview();
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
    .map((part, partIndex) => ({ part, partIndex: part.selectionIndex ?? partIndex }))
    .filter(({ part }) => part.kind === "main" && (part.size || part.sheetModelSrc))
    .sort((a, b) => b.part.size - a.part.size);
  const cupcakeParts = parts
    .map((part, partIndex) => ({ part, partIndex: part.selectionIndex ?? partIndex }))
    .filter(({ part }) => part.kind === "cupcakes");
  const totalCupcakeDozens = Math.max(cupcakeParts.reduce((total, { part }) => {
    return total + Math.max(Math.ceil((part.cupcakeCount || CUPCAKE_QUANTITY_STEP) / CUPCAKE_QUANTITY_STEP), 1);
  }, 0), 1);

  for (const { part, partIndex } of mainParts) {
    const gltf = await loadCakePartModel(loader, part);

    const tier = gltf.scene;
    applyCustomizerCakeDisplayScale(tier, part);

    tier.traverse((child) => {
      child.userData.partIndex = partIndex;
    });
    prepareTierMaterials(tier);
    applyTierColorsToObject(tier, customizerPreviewSelections[partIndex] || part);

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
      homeZ: tier.position.z,
      currentX: tier.position.x,
      currentZ: tier.position.z,
      targetX: tier.position.x,
      targetZ: tier.position.z
    });

    currentHeight += height;
  }

  for (const [partIndex, part] of parts.entries()) {
    if (part.kind !== "backup" || (!part.size && !part.sheetModelSrc)) continue;
    const selectionIndex = part.selectionIndex ?? partIndex;

    const gltf = await loadCakePartModel(loader, part);

    const backupTier = gltf.scene;
    applyCustomizerCakeDisplayScale(backupTier, part);

    backupTier.traverse((child) => {
      child.userData.partIndex = selectionIndex;
    });
    prepareTierMaterials(backupTier);
    applyTierColorsToObject(backupTier, customizerPreviewSelections[selectionIndex] || part);

    const { height: backupHeight, width: backupWidth } = normalizeCakeModelBounds(backupTier);
    const backupRadius = backupWidth / 2;

    const sideOffset = maxMainRadius + backupRadius + 0.08;
    backupTier.position.x += sideOffset;
    group.add(backupTier);

    cakeObjects.push({
      object: backupTier,
      partIndex: selectionIndex,
      kind: part.kind,
      size: part.size,
      stackY: 0,
      modelBaseY: backupTier.position.y,
      tierHeight: backupHeight,
      tierRadius: backupRadius,
      baseScale: backupTier.scale.x,
      homeX: sideOffset,
      homeZ: backupTier.position.z,
      currentX: sideOffset,
      currentZ: backupTier.position.z,
      targetX: sideOffset,
      targetZ: backupTier.position.z,
      hiddenX: sideOffset + backupWidth + 1.2
    });
  }

  for (const { part, partIndex } of cupcakeParts) {
    const cupcakeGroup = await buildCustomizerCupcakeGroup(part, partIndex);
    const cupcakeBox = new THREE.Box3().setFromObject(cupcakeGroup);
    const cupcakeWidth = Math.max(cupcakeBox.max.x - cupcakeBox.min.x, 0.4);
    const stackIndex = cupcakeParts.findIndex((cupcakePart) => cupcakePart.partIndex === partIndex);
    const dozensPerCluster = 4;
    const clusterIndex = Math.floor(stackIndex / dozensPerCluster);
    const clusterCount = Math.max(Math.ceil(totalCupcakeDozens / dozensPerCluster), 1);
    const indexInCluster = stackIndex % dozensPerCluster;
    const clusterSize = Math.min(dozensPerCluster, totalCupcakeDozens - clusterIndex * dozensPerCluster);
    const centeredStackIndex = indexInCluster - (clusterSize - 1) / 2;
    const centeredClusterIndex = clusterIndex - (clusterCount - 1) / 2;
    const sideOffset = mainParts.length ? maxMainRadius + 0.34 : 0;
    const clusterOffsetX = centeredClusterIndex * 1.08;
    const verticalOffset = -centeredStackIndex * 0.15;
    const depthOffset = mainParts.length ? 0.62 : 0;

    cupcakeGroup.position.x += sideOffset + clusterOffsetX;
    cupcakeGroup.position.y += verticalOffset;
    cupcakeGroup.position.z += depthOffset;
    group.add(cupcakeGroup);

    cakeObjects.push({
      object: cupcakeGroup,
      partIndex,
      kind: part.kind,
      cupcakeCount: part.cupcakeCount,
      cupcakeDozenIndex: stackIndex,
      cupcakeDozenCount: totalCupcakeDozens,
      clusterIndex,
      clusterOffsetX,
      stackY: verticalOffset,
      modelBaseY: cupcakeGroup.position.y,
      tierHeight: cupcakeBox.max.y - cupcakeBox.min.y,
      tierRadius: cupcakeWidth / 2,
      baseScale: cupcakeGroup.scale.x,
      homeX: sideOffset + clusterOffsetX,
      homeZ: depthOffset,
      currentX: sideOffset + clusterOffsetX,
      currentZ: depthOffset,
      targetX: sideOffset + clusterOffsetX,
      targetZ: depthOffset,
      centerX: sideOffset + clusterOffsetX,
      hiddenX: sideOffset + clusterOffsetX
    });
  }

  const frameBox = new THREE.Box3();
  const frameEntries = cakeObjects.filter((entry) => {
    if (mainParts.length) return entry.kind === "main";
    return entry.kind === "cupcakes";
  });
  frameEntries.forEach((entry) => {
    frameBox.expandByObject(entry.object);
  });

  if (frameEntries.length) {
    const center = new THREE.Vector3();
    frameBox.getCenter(center);

    group.position.x -= center.x;
    group.position.z -= center.z;
    group.position.y -= frameBox.min.y;
    group.position.y += 0.26;

    syncBackupAnimationState();
  }

  group.scale.setScalar(1.55);

  camera.position.set(0, 0.82, 2.18);
  camera.up.set(0, 1, 0);
  customizerCameraTarget.set(0, 0.46, 0);
  customizerFrontCameraOffset.copy(camera.position).sub(customizerCameraTarget);
  activeCameraView = "front";
  setOrbitTarget(customizerCameraTarget);
  syncCameraViewButtons();
}

async function buildCustomizerCupcakeGroup(part, partIndex) {
  const template = await loadModelScene(CUPCAKE_MODEL_SRC, loader);
  prepareTierMaterials(template);
  const bounds = normalizeCakeModelBounds(template);
  const baseFootprint = Math.max(bounds.width, bounds.depth, 0.001);
  const cupcakeScale = 0.07 / baseFootprint;
  const cupcakeHeight = bounds.height * cupcakeScale;
  const totalCount = Math.min(part.cupcakeCount || CUPCAKE_QUANTITY_STEP, CUPCAKE_QUANTITY_STEP * 3);
  const visibleDozens = Math.min(Math.max(Math.ceil(totalCount / CUPCAKE_QUANTITY_STEP), 1), 3);
  const columns = 4;
  const rowsPerDozen = 3;
  const spacingX = 0.1;
  const spacingZ = 0.095;
  const dozenSpacingZ = 0.38;
  const group = new THREE.Group();
  group.name = `cupcakes-${partIndex}`;
  group.userData.partIndex = partIndex;
  group.userData.kind = "cupcakes";
  group.userData.cupcakeAnchors = [];

  for (let dozenIndex = 0; dozenIndex < visibleDozens; dozenIndex += 1) {
    const countForDozen = Math.min(
      CUPCAKE_QUANTITY_STEP,
      Math.max(totalCount - dozenIndex * CUPCAKE_QUANTITY_STEP, 0)
    );
    const dozenOffsetZ = (dozenIndex - (visibleDozens - 1) / 2) * dozenSpacingZ;

    for (let index = 0; index < countForDozen; index += 1) {
      const cupcake = template.clone(true);
      prepareTierMaterials(cupcake);
      cupcake.scale.setScalar(cupcakeScale);
      cupcake.position.x = (index % columns - (columns - 1) / 2) * spacingX;
      cupcake.position.z = (Math.floor(index / columns) - (rowsPerDozen - 1) / 2) * spacingZ + dozenOffsetZ;
      cupcake.traverse((child) => {
        child.userData.partIndex = partIndex;
        child.userData.kind = "cupcakes";
      });
      group.userData.cupcakeAnchors.push({
        position: cupcake.position.clone(),
        height: cupcakeHeight,
        radius: 0.052
      });
      group.add(cupcake);
    }
  }

  const groupBox = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  groupBox.getCenter(center);
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= groupBox.min.y;

  return group;
}

function reflowCupcakeStackLayout({ selectedPartIndex = activeCustomizerTierIndex } = {}) {
  const cupcakeEntries = cakeObjects
    .filter((entry) => isCupcakeKind(entry.kind))
    .sort((a, b) => a.partIndex - b.partIndex);
  if (!cupcakeEntries.length) return;

  const mainEntries = cakeObjects.filter((entry) => entry.kind === "main");
  const maxMainRadius = mainEntries.reduce((maxRadius, entry) => {
    return Math.max(maxRadius, entry.tierRadius || 0);
  }, 0);
  const totalCupcakeDozens = cupcakeEntries.length;
  const dozensPerCluster = 4;
  const clusterCount = Math.max(Math.ceil(totalCupcakeDozens / dozensPerCluster), 1);
  const selectedEntry = cupcakeEntries.find((entry) => entry.partIndex === selectedPartIndex) || cupcakeEntries[0];
  const selectedStackIndex = cupcakeEntries.indexOf(selectedEntry);
  const selectedClusterIndex = selectedStackIndex === -1 ? 0 : Math.floor(selectedStackIndex / dozensPerCluster);
  const selectedCenteredClusterIndex = selectedClusterIndex - (clusterCount - 1) / 2;
  const selectedCupcakeClusterOffset = selectedCenteredClusterIndex * 1.08;
  const sideOffset = mainEntries.length ? maxMainRadius + 0.34 : 0;
  const depthOffset = mainEntries.length ? 0.62 : 0;

  cupcakeEntries.forEach((entry, stackIndex) => {
    const clusterIndex = Math.floor(stackIndex / dozensPerCluster);
    const indexInCluster = stackIndex % dozensPerCluster;
    const clusterSize = Math.min(dozensPerCluster, totalCupcakeDozens - clusterIndex * dozensPerCluster);
    const centeredStackIndex = indexInCluster - (clusterSize - 1) / 2;
    const centeredClusterIndex = clusterIndex - (clusterCount - 1) / 2;
    const clusterOffsetX = centeredClusterIndex * 1.08;
    const verticalOffset = -centeredStackIndex * 0.15;
    const baseY = typeof entry.cupcakeBaseY === "number"
      ? entry.cupcakeBaseY
      : (entry.modelBaseY ?? entry.object.position.y) - (entry.stackY || 0);
    const finalX = clusterOffsetX - selectedCupcakeClusterOffset;
    const finalY = baseY + verticalOffset;

    entry.cupcakeBaseY = baseY;
    entry.cupcakeDozenIndex = stackIndex;
    entry.cupcakeDozenCount = totalCupcakeDozens;
    entry.clusterIndex = clusterIndex;
    entry.clusterOffsetX = clusterOffsetX;
    entry.stackY = verticalOffset;
    entry.modelBaseY = finalY;
    entry.homeX = sideOffset + clusterOffsetX;
    entry.homeZ = depthOffset;
    entry.centerX = finalX;
    entry.targetX = finalX;
    entry.targetY = finalY;
    entry.targetZ = depthOffset;
  });
}

async function addCupcakeDozenObject(selection, selectionIndex) {
  if (!cakeSceneRoot || !loader) return null;

  const cupcakeGroup = await buildCustomizerCupcakeGroup(selection, selectionIndex);
  const cupcakeBox = new THREE.Box3().setFromObject(cupcakeGroup);
  const cupcakeWidth = Math.max(cupcakeBox.max.x - cupcakeBox.min.x, 0.4);
  cakeSceneRoot.add(cupcakeGroup);

  const entry = {
    object: cupcakeGroup,
    partIndex: selectionIndex,
    kind: "cupcakes",
    cupcakeCount: selection.cupcakeCount,
    cupcakeDozenIndex: 0,
    cupcakeDozenCount: 1,
    clusterIndex: 0,
    clusterOffsetX: 0,
    stackY: 0,
    cupcakeBaseY: cupcakeGroup.position.y,
    modelBaseY: cupcakeGroup.position.y,
    tierHeight: cupcakeBox.max.y - cupcakeBox.min.y,
    tierRadius: cupcakeWidth / 2,
    baseScale: cupcakeGroup.scale.x,
    homeX: cupcakeGroup.position.x,
    homeZ: cupcakeGroup.position.z,
    currentX: cupcakeGroup.position.x,
    currentY: cupcakeGroup.position.y,
    currentZ: cupcakeGroup.position.z,
    targetX: cupcakeGroup.position.x,
    targetY: cupcakeGroup.position.y,
    targetZ: cupcakeGroup.position.z,
    centerX: cupcakeGroup.position.x,
    hiddenX: cupcakeGroup.position.x
  };

  cakeObjects.push(entry);
  reflowCupcakeStackLayout({ selectedPartIndex: selectionIndex });
  cupcakeGroup.position.x = entry.targetX;
  cupcakeGroup.position.y = entry.targetY;
  cupcakeGroup.position.z = entry.targetZ;
  entry.currentX = entry.targetX;
  entry.currentY = entry.targetY;
  entry.currentZ = entry.targetZ;
  applyTierColorsToObject(cupcakeGroup, selection);
  await syncCupcakeFrostingForIndex(selectionIndex);
  return entry;
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
    homeZ: backupTier.position.z,
    centerX: 0,
    currentX: hiddenOffset,
    currentZ: backupTier.position.z,
    targetX: hiddenOffset,
    targetZ: backupTier.position.z,
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

    const lerpAmount = entry.animationLerp || 0.14;
    entry.currentX += (entry.targetX - entry.currentX) * lerpAmount;
    if (typeof entry.targetZ === "number") {
      entry.currentZ = typeof entry.currentZ === "number" ? entry.currentZ : entry.object.position.z;
      entry.currentZ += (entry.targetZ - entry.currentZ) * lerpAmount;
      entry.object.position.z = entry.currentZ;
    }
    if (typeof entry.targetY === "number") {
      entry.currentY = typeof entry.currentY === "number" ? entry.currentY : entry.object.position.y;
      entry.currentY += (entry.targetY - entry.currentY) * lerpAmount;
      entry.object.position.y = entry.currentY;
    }
    entry.object.position.x = entry.currentX;
    if (entry.outerFrostingObject) {
      positionOuterFrostingForEntry(entry);
    }
    if (entry.exitAfterAnimation && Math.abs(entry.targetX - entry.currentX) < 0.035) {
      entry.object.visible = false;
      entry.exitAfterAnimation = false;
      entry.animationLerp = null;
      if (entry.outerFrostingObject) entry.outerFrostingObject.visible = false;
      if (entry.decorGroup) entry.decorGroup.visible = false;
      if (entry.cupcakeSwirlGroup) entry.cupcakeSwirlGroup.visible = false;
    }
  });
  controls?.update();
  updateCameraViewGizmoOrientation();
  enforceCupcakeEditModelVisibility();
  renderer.render(scene, camera);
  if (typeof syncFinishedOrderHitTargets === "function") {
    syncFinishedOrderHitTargets();
  }
}

function snapCakeObjectsToTargets() {
  cakeObjects.forEach((entry) => {
    if (typeof entry.targetX === "number") {
      entry.currentX = entry.targetX;
      entry.object.position.x = entry.targetX;
    }

    if (typeof entry.targetZ === "number") {
      entry.currentZ = entry.targetZ;
      entry.object.position.z = entry.targetZ;
    }

    if (typeof entry.targetY === "number") {
      entry.currentY = entry.targetY;
      entry.object.position.y = entry.targetY;
    }

    if (entry.outerFrostingObject) {
      positionOuterFrostingForEntry(entry);
    }
    if (!entry.object.visible && entry.outerFrostingObject) {
      entry.outerFrostingObject.visible = false;
    }
    if (!entry.object.visible && entry.decorGroup) {
      entry.decorGroup.visible = false;
    }
    if (!entry.object.visible && entry.cupcakeSwirlGroup) {
      entry.cupcakeSwirlGroup.visible = false;
    }
  });
}

function applyAllCustomizerSelectionColors() {
  cakeObjects.forEach((entry) => {
    const selection = customizerPreviewSelections[entry.partIndex];
    if (!selection) return;

    applyTierColorsToObject(entry.object, selection);
    applyOuterFrostingFinish(entry.outerFrostingObject, selection);
  });
}

function getCupcakeAddAnimationState() {
  const visibleCupcakeEntries = cakeObjects.filter((entry) => {
    return isCupcakeKind(entry.kind) && entry.object.visible;
  });

  return {
    wasCupcakeView: isCupcakeStackSelected() || visibleCupcakeEntries.length > 0,
    previousCupcakeCount: cakeObjects.filter((entry) => isCupcakeKind(entry.kind)).length,
    previousCupcakePositions: new Map(
      cakeObjects
        .filter((entry) => isCupcakeKind(entry.kind))
        .map((entry) => [entry.partIndex, {
          x: entry.object.visible ? entry.object.position.x : (typeof entry.currentX === "number" ? entry.currentX : entry.object.position.x),
          y: entry.object.position.y,
          z: entry.object.position.z
        }])
    )
  };
}

function hideNonCupcakeEntriesForCupcakeEdit() {
  cakeObjects.forEach((entry) => {
    if (isCupcakeKind(entry.kind)) return;

    entry.object.visible = false;
    entry.exitAfterAnimation = false;
    entry.animationLerp = null;
    if (entry.outerFrostingObject) entry.outerFrostingObject.visible = false;
    if (entry.decorGroup) entry.decorGroup.visible = false;
    if (entry.cupcakeSwirlGroup) entry.cupcakeSwirlGroup.visible = false;
  });
}

function isCupcakeEditModeActive() {
  const layout = document.getElementById("customizer-layout");
  return Boolean(layout && !layout.classList.contains("is-fulfillment-step") && isCupcakeStackSelected());
}

function enforceCupcakeEditModelVisibility() {
  if (!isCupcakeEditModeActive()) return;

  cakeObjects.forEach((entry) => {
    const isCupcake = isCupcakeKind(entry.kind);
    entry.object.visible = isCupcake;
    if (entry.outerFrostingObject) {
      entry.outerFrostingObject.visible = isCupcake && !entry.peeking;
    }
    if (entry.decorGroup) {
      entry.decorGroup.visible = isCupcake && !entry.peeking;
    }
    if (entry.cupcakeSwirlGroup) {
      entry.cupcakeSwirlGroup.visible = isCupcake;
    }
  });
}

function prepareCupcakeAddAnimation(newCupcakeIndex, state) {
  const cupcakeEntries = cakeObjects.filter((entry) => isCupcakeKind(entry.kind));
  if (!cupcakeEntries.length) return;

  const hiddenRight = Math.max(getCupcakeStackMetrics(cupcakeEntries).width + 1.4, 1.8);

  cupcakeEntries.forEach((entry) => {
    const finalX = entry.targetX;
    const finalY = entry.object.position.y;
    const finalZ = entry.targetZ ?? entry.object.position.z;
    entry.targetY = finalY;

    if (entry.partIndex === newCupcakeIndex) {
      entry.currentX = hiddenRight;
      entry.currentY = finalY;
      entry.currentZ = finalZ;
      entry.object.position.x = hiddenRight;
      entry.object.position.y = finalY;
      entry.object.position.z = finalZ;
      return;
    }

    const previousPosition = state.previousCupcakePositions.get(entry.partIndex);
    if (previousPosition) {
      entry.currentX = state.wasCupcakeView ? finalX : hiddenRight;
      entry.currentY = previousPosition.y;
      entry.currentZ = finalZ;
      if (state.wasCupcakeView) {
        entry.centerX = finalX;
        entry.targetX = finalX;
      }
      entry.object.position.x = entry.currentX;
      entry.object.position.y = previousPosition.y;
      entry.object.position.z = finalZ;
    }
  });

  hideNonCupcakeEntriesForCupcakeEdit();
  enforceCupcakeEditModelVisibility();
}

function attachCakePicker() {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = null;
  const topPlane = new THREE.Plane();
  const topPoint = new THREE.Vector3();

  function setPointerFromEvent(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  }

  function updateEdibleImageDrag(event) {
    if (!edibleImageDragState) return false;
    const { entry, selection } = edibleImageDragState;
    setPointerFromEvent(event);
    entry.object.updateWorldMatrix(true, true);
    const topWorld = entry.object.localToWorld(new THREE.Vector3(0, getEdibleImageLocalTopY(entry) + EDIBLE_IMAGE_TOP_OFFSET, 0));
    topPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), topWorld);
    if (!raycaster.ray.intersectPlane(topPlane, topPoint)) return true;

    const localPoint = entry.object.worldToLocal(topPoint.clone());
    selection.edibleImageX = localPoint.x;
    selection.edibleImageY = localPoint.z;
    applyEdibleImageTransform(selection, entry);
    syncEdibleImageControls(activeTierIndex);
    persistCustomizerState();
    return true;
  }

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (edibleImageMesh?.visible) {
      setPointerFromEvent(event);
      const edibleIntersections = raycaster.intersectObject(edibleImageMesh, true);
      const entry = getTopMainCakeEntry();
      const selectionIndex = getEdibleImageSelectionIndex();
      const selection = selectionIndex !== null ? selections[selectionIndex] : null;
      if (edibleIntersections.length && entry && selection?.edibleImage) {
        edibleImageDragState = { entry, selection };
        renderer.domElement.setPointerCapture?.(event.pointerId);
        renderer.domElement.style.cursor = "grabbing";
        event.preventDefault();
        return;
      }
    }
    pointerDown = { x: event.clientX, y: event.clientY };
  });

  renderer.domElement.addEventListener("pointermove", (event) => {
    updateEdibleImageDrag(event);
  });

  renderer.domElement.addEventListener("pointerleave", () => {
    edibleImageDragState = null;
    pointerDown = null;
    if (renderer?.domElement) renderer.domElement.style.cursor = "pointer";
  });

  renderer.domElement.addEventListener("pointerup", (event) => {
    if (edibleImageDragState) {
      updateEdibleImageDrag(event);
      edibleImageDragState = null;
      renderer.domElement.releasePointerCapture?.(event.pointerId);
      renderer.domElement.style.cursor = "pointer";
      return;
    }
    if (!customizerTierSelect || !cakeObjects.length) return;
    const isFulfillmentStep = document.getElementById("customizer-layout")?.classList.contains("is-fulfillment-step");
    if (pointerDown) {
      const deltaX = event.clientX - pointerDown.x;
      const deltaY = event.clientY - pointerDown.y;
      pointerDown = null;
      if (Math.hypot(deltaX, deltaY) > 5) return;
    }

    setPointerFromEvent(event);

    const meshes = cakeObjects.flatMap(({ object, outerFrostingObject }) => {
      if (!object.visible) return [];
      const descendants = [];
      object.traverse((child) => {
        if (child.isMesh && child.visible) descendants.push(child);
      });
      outerFrostingObject?.traverse((child) => {
        if (child.isMesh && child.visible) descendants.push(child);
      });
      return descendants;
    });

    const intersects = raycaster.intersectObjects(meshes, true);
    if (!intersects.length) return;

    let clickedObject = intersects[0].object;

    while (clickedObject && clickedObject.userData.partIndex === undefined) {
      clickedObject = clickedObject.parent;
    }

    if (clickedObject?.userData.partIndex !== undefined) {
      if (isFulfillmentStep) {
        selectFinishedOrderPart(clickedObject.userData.partIndex);
      } else {
        customizerTierSelect(clickedObject.userData.partIndex);
      }
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

async function loadSwagModel(swagLoader = loader) {
  if (!swagModelPromise) {
    const loaderToUse = swagLoader || new GLTFLoader();
    swagModelPromise = new Promise((resolve, reject) => {
      loaderToUse.load(SWAG_MODEL_SRC, (gltf) => resolve(gltf.scene), undefined, reject);
    });
  }

  return swagModelPromise;
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

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * (radius + radialOffset);
    const z = Math.sin(angle) * (radius + radialOffset);
    const shell = template.clone(true);

    shell.position.set(x, y, z);
    shell.rotation.y = -angle + Math.PI / 2 + rotationOffset;
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

function getSwagCountForTier(entry) {
  const size = Number(entry?.size) || 8;
  if (size <= 6) return 4;
  if (size <= 8) return 6;
  if (size <= 10) return 8;
  return 12;
}

function getSwagScaleForTier(template, radius, swagCount) {
  const footprint = getShellBaseFootprint(template);
  const arcLength = (Math.PI * 2 * radius) / swagCount;
  const compressedArcLength = arcLength * SWAG_HORIZONTAL_COMPRESSION;
  const targetPieceWidth = (compressedArcLength / Math.max(SWAG_PIECES_PER_DRAPE - 1, 1)) * 1.55;
  const tangentScale = targetPieceWidth / footprint.tangent;
  const radialScale = (radius * 0.14) / footprint.radial;

  return Math.max(SWAG_MIN_SCALE, Math.min(tangentScale, radialScale, SWAG_MAX_SCALE));
}

function getSwagShellTrimScaleForTier(template, radius, swagCount) {
  const footprint = getShellBaseFootprint(template);
  const arcLength = (Math.PI * 2 * radius * SWAG_HORIZONTAL_COMPRESSION) / swagCount;
  const targetPieceWidth = (arcLength / Math.max(SWAG_SHELL_TRIM_PIECES_PER_DRAPE - 1, 1)) * 1.05;
  const tangentScale = targetPieceWidth / footprint.tangent;
  const radialScale = (radius * 0.055) / footprint.radial;

  return Math.max(SWAG_SHELL_TRIM_MIN_SCALE, Math.min(tangentScale, radialScale, SWAG_SHELL_TRIM_MAX_SCALE));
}

function getSwagSidewallQuaternion(outward) {
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(up, outward).normalize();
  const down = up.clone().negate();
  const basis = new THREE.Matrix4().makeBasis(tangent, outward, down);
  return new THREE.Quaternion().setFromRotationMatrix(basis);
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

function normalizeDecorationList(selection = {}) {
  const source = Array.isArray(selection.decorations) && selection.decorations.length
    ? selection.decorations
    : selection.decor
      ? [selection.decor]
      : [];
  const decorations = [...new Set(source)].filter((decor) => DECORATION_LAYER_TYPES.includes(decor));
  if (selection.cherries === true && !decorations.includes(CHERRY_DECOR)) {
    decorations.push(CHERRY_DECOR);
  }
  return DECORATION_LAYER_TYPES.filter((decorType) => decorations.includes(decorType));
}

function normalizeShellBorderEdges(selection = {}) {
  const source = Array.isArray(selection.shellBorderEdges) && selection.shellBorderEdges.length
    ? selection.shellBorderEdges
    : [selection.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE];
  const edges = [...new Set(source)].filter((edge) => SHELL_BORDER_EDGES.includes(edge));
  return edges.length ? edges : [SHELL_BORDER_DEFAULT_EDGE];
}

function isDecorationActive(selection, decorType) {
  return normalizeDecorationList(selection).includes(decorType);
}

function setDecorationActive(selection, decorType, isActive) {
  if (!selection || !DECORATION_LAYER_TYPES.includes(decorType)) return [];
  const decorations = normalizeDecorationList(selection);
  let nextDecorations = isActive
    ? [...new Set([...decorations, decorType])]
    : decorations.filter((decor) => decor !== decorType);

  if (decorType === SWIRL_DECOR && !isActive) {
    selection.cherries = false;
    nextDecorations = nextDecorations.filter((decor) => decor !== CHERRY_DECOR);
  }
  if (decorType === CHERRY_DECOR) {
    selection.cherries = isActive;
    if (isActive && !nextDecorations.includes(SWIRL_DECOR)) {
      nextDecorations.push(SWIRL_DECOR);
    }
  }

  nextDecorations = DECORATION_LAYER_TYPES.filter((decorType) => nextDecorations.includes(decorType));
  selection.decorations = nextDecorations;
  selection.decor = nextDecorations[0] || "";
  return nextDecorations;
}

function toggleDecoration(selection, decorType) {
  return setDecorationActive(selection, decorType, !isDecorationActive(selection, decorType));
}

function getDecorationLabel(decorType) {
  if (decorType === SHELL_BORDER_DECOR) return "Shell border";
  if (decorType === SWAG_DECOR) return "Swags";
  if (decorType === SHELL_SWAG_DECOR) return "Shell swag";
  if (decorType === SWIRL_DECOR) return "Swirls";
  if (decorType === CHERRY_DECOR) return "Cherries";
  return decorType;
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

function ensureDecorLayer(entry, layerName) {
  const decorGroup = ensureDecorGroup(entry);
  if (!decorGroup) return null;

  if (!entry.decorLayers) {
    entry.decorLayers = {};
  }
  if (!entry.decorLayers[layerName] || entry.decorLayers[layerName].parent !== decorGroup) {
    entry.decorLayers[layerName] = new THREE.Group();
    entry.decorLayers[layerName].name = `decorLayer-${layerName}-${entry.partIndex}`;
    entry.decorLayers[layerName].userData.isDecorLayer = true;
    entry.decorLayers[layerName].userData.decorLayer = layerName;
    entry.decorLayers[layerName].userData.partIndex = entry.partIndex;
    decorGroup.add(entry.decorLayers[layerName]);
  }

  return entry.decorLayers[layerName];
}

function disposeDecorMaterialOnly(root) {
  root?.traverse?.((child) => {
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => material.dispose?.());
  });
}

function clearDecorLayer(entry, layerName) {
  const layer = entry?.decorLayers?.[layerName];
  if (!layer) return;

  while (layer.children.length) {
    const child = layer.children[0];
    layer.remove(child);
    disposeDecorMaterialOnly(child);
  }
}

function clearDecorGroup(target) {
  const entry = target?.isGroup ? null : resolveCakeEntryForTier(target);
  const decorGroup = target?.isGroup ? target : entry?.decorGroup;
  if (!decorGroup) return;

  if (entry && edibleImageMesh && decorGroup.getObjectById(edibleImageMesh.id)) {
    disposeEdibleImagePreview();
  }

  while (decorGroup.children.length) {
    const child = decorGroup.children[0];
    decorGroup.remove(child);
    disposeDecorMaterialOnly(child);
  }

  if (entry) {
    entry.decorType = "";
    entry.decorLayers = {};
  }
}

async function addShellBorderToTier(tier, edges = null) {
  const entry = resolveCakeEntryForTier(tier);
  if (!entry?.size) return null;

  const syncId = (entry.shellBorderSyncId || 0) + 1;
  entry.shellBorderSyncId = syncId;
  clearDecorLayer(entry, SHELL_BORDER_DECOR);

  const template = await loadShellModel();
  if (entry.shellBorderSyncId !== syncId) return null;

  const decorLayer = ensureDecorLayer(entry, SHELL_BORDER_DECOR);
  clearDecorLayer(entry, SHELL_BORDER_DECOR);

  const radius = entry.tierRadius || 0.24;
  const selectedEdges = Array.isArray(edges)
    ? normalizeShellBorderEdges({ shellBorderEdges: edges })
    : normalizeShellBorderEdges(customizerPreviewSelections[entry.partIndex]);
  const selection = customizerPreviewSelections[entry.partIndex] || {};
  const shellBorderColor = selection.shellBorderColor || DEFAULT_SHELL_FROSTING_COLOR;
  const count = getShellCountForTier(entry, radius);
  const scale = getShellScaleForCount(template, radius, count);

  selectedEdges.forEach((shellEdge) => {
    const y = getTierLocalEdgeY(entry, shellEdge);
    const radialOffset = shellEdge === "bottom" ? 0.004 : 0.002;

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * (radius + radialOffset);
      const z = Math.sin(angle) * (radius + radialOffset);
      const shell = template.clone(true);

      shell.position.set(x, y, z);
      shell.rotation.y = -angle + Math.PI / 2;
      shell.scale.set(scale * SHELL_BORDER_OVERLAP, scale * 1.08, scale * 1.12);
      shell.userData.isShellBorder = true;
      shell.userData.shellBorderEdge = shellEdge;
      shell.userData.partIndex = entry.partIndex;
      shell.traverse((child) => {
        child.userData.partIndex = entry.partIndex;
        child.userData.isShellBorder = true;
        child.userData.shellBorderEdge = shellEdge;
      });

      applyShellBorderMaterial(shell, shellBorderColor);
      decorLayer.add(shell);
    }
  });

  entry.decorType = normalizeDecorationList(customizerPreviewSelections[entry.partIndex]).join(",");
  entry.shellBorderEdges = selectedEdges;
  entry.shellBorderEdge = selectedEdges[0] || SHELL_BORDER_DEFAULT_EDGE;
  return decorLayer;
}

async function addSwirlsToTier(tier, count = DEFAULT_SWIRL_COUNT) {
  const entry = resolveCakeEntryForTier(tier);
  if (!entry?.size) return null;

  const syncId = (entry.swirlSyncId || 0) + 1;
  entry.swirlSyncId = syncId;
  clearDecorLayer(entry, SWIRL_DECOR);

  const template = await loadSwirlModel();
  if (entry.swirlSyncId !== syncId) return null;

  const selection = customizerPreviewSelections[entry.partIndex];
  const swirlColor = selection?.swirlColor || DEFAULT_SHELL_FROSTING_COLOR;
  const decorLayer = ensureDecorLayer(entry, SWIRL_DECOR);
  clearDecorLayer(entry, SWIRL_DECOR);

  const radius = (entry.tierRadius || 0.24) + SWIRL_RADIUS_OFFSET;
  const y = getTierLocalEdgeY(entry, "top") + SWIRL_TOP_Y_OFFSET;
  const swirlCount = normalizeSwirlCount(count);
  const scale = getSwirlScaleForTier(template, radius, swirlCount);

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

    applyShellBorderMaterial(swirl, swirlColor);
    decorLayer.add(swirl);
  }

  entry.decorType = normalizeDecorationList(selection).join(",");
  entry.swirlCount = swirlCount;
  return decorLayer;
}

async function addCherriesToTier(tier, count = DEFAULT_SWIRL_COUNT) {
  const entry = resolveCakeEntryForTier(tier);
  if (!entry?.size) return null;

  const syncId = (entry.cherrySyncId || 0) + 1;
  entry.cherrySyncId = syncId;
  clearDecorLayer(entry, CHERRY_DECOR);

  const swirlTemplate = await loadSwirlModel();
  const cherryTemplate = await loadCherryModel();
  if (entry.cherrySyncId !== syncId) return null;

  const selection = customizerPreviewSelections[entry.partIndex];
  const decorLayer = ensureDecorLayer(entry, CHERRY_DECOR);
  clearDecorLayer(entry, CHERRY_DECOR);

  const radius = (entry.tierRadius || 0.24) + SWIRL_RADIUS_OFFSET;
  const y = getTierLocalEdgeY(entry, "top") + SWIRL_TOP_Y_OFFSET;
  const swirlCount = normalizeSwirlCount(count);
  const swirlScale = getSwirlScaleForTier(swirlTemplate, radius, swirlCount);
  const cherryScale = getCherryScaleForSwirl(cherryTemplate, swirlTemplate, swirlScale);

  for (let i = 0; i < swirlCount; i += 1) {
    const angle = (i / swirlCount) * Math.PI * 2;
    const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
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
    decorLayer.add(cherry);
  }

  entry.decorType = normalizeDecorationList(selection).join(",");
  entry.cherries = true;
  return decorLayer;
}

async function addSwagsToTier(tier) {
  const entry = resolveCakeEntryForTier(tier);
  if (!entry?.size) return null;

  const syncId = (entry.swagSyncId || 0) + 1;
  entry.swagSyncId = syncId;
  clearDecorLayer(entry, SWAG_DECOR);

  const template = await loadSwagModel();
  if (entry.swagSyncId !== syncId) return null;

  const decorLayer = ensureDecorLayer(entry, SWAG_DECOR);
  clearDecorLayer(entry, SWAG_DECOR);

  const radius = (entry.tierRadius || 0.24) + SWAG_SURFACE_OFFSET;
  const swagCount = getSwagCountForTier(entry);
  const segmentAngle = (Math.PI * 2) / swagCount;
  const baseY = getTierLocalEdgeY(entry, "bottom") - SHELL_BORDER_BOTTOM_Y_OFFSET;
  const tierHeight = entry.tierHeight || 0.24;
  const anchorY = baseY + tierHeight * SWAG_ANCHOR_HEIGHT_RATIO;
  const drop = Math.max(tierHeight * SWAG_DROP_HEIGHT_RATIO, 0.025);
  const scale = getSwagScaleForTier(template, radius, swagCount);
  const selection = customizerPreviewSelections[entry.partIndex] || {};
  const swagColor = selection.swagColor || DEFAULT_SHELL_FROSTING_COLOR;

  for (let swagIndex = 0; swagIndex < swagCount; swagIndex += 1) {
    const startAngle = (swagIndex / swagCount) * Math.PI * 2;
    const compressedStartAngle = startAngle + segmentAngle * ((1 - SWAG_HORIZONTAL_COMPRESSION) / 2);

    for (let pieceIndex = 0; pieceIndex < SWAG_PIECES_PER_DRAPE; pieceIndex += 1) {
      const t = SWAG_PIECES_PER_DRAPE === 1 ? 0.5 : pieceIndex / (SWAG_PIECES_PER_DRAPE - 1);
      const angle = compressedStartAngle + t * segmentAngle * SWAG_HORIZONTAL_COMPRESSION;
      const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const centerWeight = Math.sin(Math.PI * t);
      const centerCurve = Math.pow(centerWeight, 1.45);
      const y = anchorY - centerWeight * drop + centerCurve * tierHeight * SWAG_CENTER_LIFT_HEIGHT_RATIO;
      const pieceScale = scale * (0.58 + centerCurve * 0.54);
      const curveSlope = -Math.cos(Math.PI * t) * drop / Math.max(segmentAngle * radius * SWAG_HORIZONTAL_COMPRESSION, 0.001);
      const swag = template.clone(true);

      swag.position.set(outward.x * radius, y, outward.z * radius);
      swag.quaternion.copy(getSwagSidewallQuaternion(outward));
      swag.rotateY(Math.atan(curveSlope) * SWAG_CURVE_ROTATION_STRENGTH);
      swag.scale.set(pieceScale, pieceScale * (0.54 + centerCurve * 0.1), pieceScale);
      swag.userData.isSwagDecor = true;
      swag.userData.partIndex = entry.partIndex;
      swag.traverse((child) => {
        child.userData.partIndex = entry.partIndex;
        child.userData.isSwagDecor = true;
      });

      applyShellBorderMaterial(swag, swagColor);
      decorLayer.add(swag);
    }
  }

  entry.decorType = normalizeDecorationList(selection).join(",");
  entry.swagCount = swagCount;
  return decorLayer;
}

async function addShellSwagToTier(tier) {
  const entry = resolveCakeEntryForTier(tier);
  if (!entry?.size) return null;

  const syncId = (entry.shellSwagSyncId || 0) + 1;
  entry.shellSwagSyncId = syncId;
  clearDecorLayer(entry, SHELL_SWAG_DECOR);

  const shellTemplate = await loadShellModel();
  if (entry.shellSwagSyncId !== syncId) return null;

  const decorLayer = ensureDecorLayer(entry, SHELL_SWAG_DECOR);
  clearDecorLayer(entry, SHELL_SWAG_DECOR);

  const trimRadius = (entry.tierRadius || 0.24) + SWAG_SURFACE_OFFSET + SWAG_SHELL_TRIM_RADIAL_OFFSET;
  const swagCount = getSwagCountForTier(entry);
  const segmentAngle = (Math.PI * 2) / swagCount;
  const baseY = getTierLocalEdgeY(entry, "bottom") - SHELL_BORDER_BOTTOM_Y_OFFSET;
  const tierHeight = entry.tierHeight || 0.24;
  const anchorY = baseY + tierHeight * SWAG_ANCHOR_HEIGHT_RATIO;
  const fullDrop = Math.max(tierHeight * SWAG_DROP_HEIGHT_RATIO, 0.025);
  const trimDrop = fullDrop * SWAG_SHELL_TRIM_DROP_RATIO;
  const trimYOffset = tierHeight * SWAG_SHELL_TRIM_Y_OFFSET_RATIO;
  const trimScale = getSwagShellTrimScaleForTier(shellTemplate, trimRadius, swagCount);
  const selection = customizerPreviewSelections[entry.partIndex] || {};
  const shellSwagColor = selection.shellSwagColor || DEFAULT_SHELL_FROSTING_COLOR;

  for (let swagIndex = 0; swagIndex < swagCount; swagIndex += 1) {
    const startAngle = (swagIndex / swagCount) * Math.PI * 2;
    const compressedStartAngle = startAngle + segmentAngle * ((1 - SWAG_HORIZONTAL_COMPRESSION) / 2);

    for (let pieceIndex = 0; pieceIndex < SWAG_SHELL_TRIM_PIECES_PER_DRAPE; pieceIndex += 1) {
      const t = SWAG_SHELL_TRIM_PIECES_PER_DRAPE === 1 ? 0.5 : pieceIndex / (SWAG_SHELL_TRIM_PIECES_PER_DRAPE - 1);
      const angle = compressedStartAngle + t * segmentAngle * SWAG_HORIZONTAL_COMPRESSION;
      const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const centerWeight = Math.sin(Math.PI * t);
      const y = anchorY - centerWeight * trimDrop + trimYOffset;
      const curveSlope = -Math.cos(Math.PI * t) * trimDrop / Math.max(segmentAngle * trimRadius * SWAG_HORIZONTAL_COMPRESSION, 0.001);
      const shell = shellTemplate.clone(true);

      shell.position.set(outward.x * trimRadius, y, outward.z * trimRadius);
      shell.quaternion.copy(getSwagSidewallQuaternion(outward));
      shell.rotateY(Math.atan(curveSlope) * SWAG_CURVE_ROTATION_STRENGTH);
      shell.scale.set(trimScale * 1.08, trimScale * 0.82, trimScale);
      shell.userData.isShellSwagDecor = true;
      shell.userData.partIndex = entry.partIndex;
      shell.traverse((child) => {
        child.userData.partIndex = entry.partIndex;
        child.userData.isShellSwagDecor = true;
      });

      applyShellBorderMaterial(shell, shellSwagColor);
      decorLayer.add(shell);
    }
  }

  entry.decorType = normalizeDecorationList(selection).join(",");
  entry.shellSwagCount = swagCount;
  return decorLayer;
}

function clearCupcakeSwirls(entry) {
  if (!entry?.cupcakeSwirlGroup) return;

  entry.object.remove(entry.cupcakeSwirlGroup);
  disposeDecorMaterialOnly(entry.cupcakeSwirlGroup);
  entry.cupcakeSwirlGroup = null;
}

async function syncCupcakeFrostingForIndex(index) {
  const entry = cakeObjects.find((cakeObject) => cakeObject.partIndex === index);
  const selection = customizerPreviewSelections[index];
  if (!entry || entry.kind !== "cupcakes" || !selection) return;

  entry.cupcakeFrostingSyncId = (entry.cupcakeFrostingSyncId || 0) + 1;
  const syncId = entry.cupcakeFrostingSyncId;
  clearCupcakeSwirls(entry);

  if (!selection.frosting) return;

  const template = await loadSwirlModel();
  if (entry.cupcakeFrostingSyncId !== syncId) return;

  const swirlGroup = new THREE.Group();
  swirlGroup.name = `cupcakeSwirls-${index}`;
  swirlGroup.userData.partIndex = index;
  swirlGroup.userData.kind = "cupcakes";
  const swirlSize = getObjectSize(template);
  const swirlFootprint = Math.max(swirlSize.x, swirlSize.z, 0.001);
  const color = frostingColorMap[selection.frosting] || DEFAULT_SHELL_FROSTING_COLOR;

  (entry.object.userData.cupcakeAnchors || []).forEach((anchor, anchorIndex) => {
    const swirl = template.clone(true);
    const scale = Math.max(0.029, Math.min((anchor.radius * 1.1) / swirlFootprint, 0.086));

    swirl.position.set(
      anchor.position.x,
      anchor.position.y + anchor.height - 0.004,
      anchor.position.z
    );
    swirl.rotation.y = (anchorIndex % 4) * 0.35;
    swirl.scale.setScalar(scale);
    swirl.userData.isCupcakeFrosting = true;
    swirl.userData.partIndex = index;
    swirl.traverse((child) => {
      child.userData.partIndex = index;
      child.userData.kind = "cupcakes";
    });

    applyShellBorderMaterial(swirl, color);
    swirlGroup.add(swirl);
  });

  entry.object.add(swirlGroup);
  entry.cupcakeSwirlGroup = swirlGroup;
}

async function syncDecorForIndex(index) {
  const entry = cakeObjects.find((cakeObject) => cakeObject.partIndex === index);
  const selection = customizerPreviewSelections[index];
  if (!entry || !selection) return;

  const activeDecorations = normalizeDecorationList(selection);

  if (activeDecorations.includes(SHELL_BORDER_DECOR)) {
    await addShellBorderToTier(entry, normalizeShellBorderEdges(selection));
  } else {
    clearDecorLayer(entry, SHELL_BORDER_DECOR);
  }

  if (activeDecorations.includes(SWAG_DECOR)) {
    await addSwagsToTier(entry);
  } else {
    clearDecorLayer(entry, SWAG_DECOR);
  }

  if (activeDecorations.includes(SHELL_SWAG_DECOR)) {
    await addShellSwagToTier(entry);
  } else {
    clearDecorLayer(entry, SHELL_SWAG_DECOR);
  }

  if (activeDecorations.includes(SWIRL_DECOR)) {
    await addSwirlsToTier(entry, selection.swirlCount || DEFAULT_SWIRL_COUNT);
  } else {
    clearDecorLayer(entry, SWIRL_DECOR);
  }

  if (activeDecorations.includes(CHERRY_DECOR)) {
    await addCherriesToTier(entry, selection.swirlCount || DEFAULT_SWIRL_COUNT);
  } else {
    clearDecorLayer(entry, CHERRY_DECOR);
  }

  entry.decorType = activeDecorations.join(",");
}

async function toggleShellBorder(index = activeCustomizerTierIndex) {
  index = typeof index === "number" ? index : null;
  if (index === null || !customizerPreviewSelections[index]?.size) return;

  const selection = customizerPreviewSelections[index];
  selection.shellBorderEdge = selection.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE;
  selection.shellBorderEdges = normalizeShellBorderEdges(selection);
  toggleDecoration(selection, SHELL_BORDER_DECOR);
  await syncDecorForIndex(index);
}

async function toggleSwirls(index = activeCustomizerTierIndex) {
  index = typeof index === "number" ? index : null;
  if (index === null || !customizerPreviewSelections[index]?.size) return;

  const selection = customizerPreviewSelections[index];
  selection.swirlCount = normalizeSwirlCount(selection.swirlCount);
  toggleDecoration(selection, SWIRL_DECOR);
  await syncDecorForIndex(index);
}

async function updateSwirlDecor(index = activeCustomizerTierIndex) {
  index = typeof index === "number" ? index : null;
  if (index === null || !isDecorationActive(customizerPreviewSelections[index], SWIRL_DECOR)) return;

  customizerPreviewSelections[index].swirlCount = normalizeSwirlCount(customizerPreviewSelections[index].swirlCount);
  await syncDecorForIndex(index);
}

async function toggleCherries(index = activeCustomizerTierIndex) {
  index = typeof index === "number" ? index : null;
  if (index === null || !customizerPreviewSelections[index]?.size) return;

  const selection = customizerPreviewSelections[index];
  selection.swirlCount = normalizeSwirlCount(selection.swirlCount);
  setDecorationActive(selection, CHERRY_DECOR, !isDecorationActive(selection, CHERRY_DECOR));
  await syncDecorForIndex(index);
}

window.clearDecorGroup = clearDecorGroup;
window.addShellBorderToTier = addShellBorderToTier;
window.loadSwirlModel = loadSwirlModel;
window.loadCherryModel = loadCherryModel;
window.loadSwagModel = loadSwagModel;
window.addSwirlsToTier = addSwirlsToTier;
window.addCherriesToTier = addCherriesToTier;
window.addSwagsToTier = addSwagsToTier;
window.addShellSwagToTier = addShellSwagToTier;
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

function disposeStripeTexture(material) {
  if (material?.userData?.stripeTexture) {
    material.userData.stripeTexture.dispose();
    material.userData.stripeTexture = null;
  }
}

function getMeshLocalYBounds(mesh) {
  mesh.geometry?.computeBoundingBox?.();
  const box = mesh.geometry?.boundingBox;
  if (!box) {
    return { minY: 0, maxY: 1 };
  }
  if (!Number.isFinite(box.min.y) || !Number.isFinite(box.max.y) || box.max.y <= box.min.y) {
    return { minY: 0, maxY: 1 };
  }

  return { minY: box.min.y, maxY: box.max.y };
}

function clearStripedOuterFrostingMaterial(material, color = DEFAULT_OUTER_FROSTING_COLOR) {
  disposeStripeTexture(material);
  material.map = null;
  material.onBeforeCompile = () => {};
  material.customProgramCacheKey = () => "outer-frosting-smooth";
  material.userData.stripeUniforms = null;
  material.userData.ombreUniforms = null;
  if (material.color) material.color.set(color);
  material.needsUpdate = true;
}

function applyStripedOuterFrostingMaterial(material, {
  baseColor = DEFAULT_OUTER_FROSTING_COLOR,
  stripeColor = DEFAULT_STRIPE_FROSTING_COLOR,
  minY = 0,
  maxY = 1
} = {}) {
  disposeStripeTexture(material);
  material.map = null;
  if (material.color) material.color.set("#ffffff");

  const uniforms = material.userData.stripeUniforms || {
    stripeBaseColor: { value: new THREE.Color(baseColor) },
    stripeAltColor: { value: new THREE.Color(stripeColor) },
    stripeMinY: { value: minY },
    stripeMaxY: { value: maxY },
    stripeCount: { value: STRIPED_OUTER_FROSTING_STRIPE_COUNT }
  };

  uniforms.stripeBaseColor.value.set(baseColor);
  uniforms.stripeAltColor.value.set(stripeColor);
  uniforms.stripeMinY.value = minY;
  uniforms.stripeMaxY.value = maxY;
  uniforms.stripeCount.value = STRIPED_OUTER_FROSTING_STRIPE_COUNT;
  material.userData.stripeUniforms = uniforms;
  material.userData.ombreUniforms = null;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vStripeLocalY;
varying vec3 vStripeWorldNormal;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vStripeLocalY = transformed.y;
vStripeWorldNormal = normalize(mat3(modelMatrix) * normal);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 stripeBaseColor;
uniform vec3 stripeAltColor;
uniform float stripeMinY;
uniform float stripeMaxY;
uniform float stripeCount;
varying float vStripeLocalY;
varying vec3 vStripeWorldNormal;`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float stripeSpan = max(stripeMaxY - stripeMinY, 0.0001);
float topDown = clamp((stripeMaxY - vStripeLocalY) / stripeSpan, 0.0, 0.9999);
float stripeIndex = floor(topDown * stripeCount);
vec3 sideStripeColor = mod(stripeIndex, 2.0) < 1.0 ? stripeAltColor : stripeBaseColor;
float topCapMix = smoothstep(0.72, 0.92, normalize(vStripeWorldNormal).y);
diffuseColor.rgb = mix(sideStripeColor, stripeAltColor, topCapMix);`
      );
  };

  material.customProgramCacheKey = () => "outer-frosting-striped-seven-local-v1";
  material.needsUpdate = true;
}

function applyOmbreOuterFrostingMaterial(material, {
  baseColor = DEFAULT_OUTER_FROSTING_COLOR,
  ombreColor = DEFAULT_OMBRE_FROSTING_COLOR,
  minY = 0,
  maxY = 1
} = {}) {
  disposeStripeTexture(material);
  material.map = null;
  if (material.color) material.color.set("#ffffff");

  const uniforms = material.userData.ombreUniforms || {
    ombreBaseColor: { value: new THREE.Color(baseColor) },
    ombreAltColor: { value: new THREE.Color(ombreColor) },
    ombreMinY: { value: minY },
    ombreMaxY: { value: maxY }
  };

  uniforms.ombreBaseColor.value.set(baseColor);
  uniforms.ombreAltColor.value.set(ombreColor);
  uniforms.ombreMinY.value = minY;
  uniforms.ombreMaxY.value = maxY;
  material.userData.ombreUniforms = uniforms;
  material.userData.stripeUniforms = null;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vOmbreLocalY;
varying vec3 vOmbreWorldNormal;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vOmbreLocalY = transformed.y;
vOmbreWorldNormal = normalize(mat3(modelMatrix) * normal);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 ombreBaseColor;
uniform vec3 ombreAltColor;
uniform float ombreMinY;
uniform float ombreMaxY;
varying float vOmbreLocalY;
varying vec3 vOmbreWorldNormal;`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float ombreSpan = max(ombreMaxY - ombreMinY, 0.0001);
float ombreTopMix = smoothstep(0.0, 1.0, clamp((vOmbreLocalY - ombreMinY) / ombreSpan, 0.0, 1.0));
float topCapMix = smoothstep(0.72, 0.92, normalize(vOmbreWorldNormal).y);
diffuseColor.rgb = mix(mix(ombreAltColor, ombreBaseColor, ombreTopMix), ombreBaseColor, topCapMix);`
      );
  };

  material.customProgramCacheKey = () => "outer-frosting-ombre-local-v2";
  material.needsUpdate = true;
}

function applyOuterFrostingFinish(object, selection = {}) {
  if (!object) return;

  const baseColor = selection.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR;
  const stripeColor = selection.outerFrostingStripeColor || DEFAULT_STRIPE_FROSTING_COLOR;
  const ombreColor = selection.outerFrostingOmbreColor || DEFAULT_OMBRE_FROSTING_COLOR;
  const isStriped = selection.outerFrosting === STRIPED_OUTER_FROSTING_DECOR;
  const isOmbre = selection.outerFrosting === OMBRE_OUTER_FROSTING_DECOR;

  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const { minY, maxY } = getMeshLocalYBounds(child);

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (isStriped) {
        applyStripedOuterFrostingMaterial(material, { baseColor, stripeColor, minY, maxY });
      } else if (isOmbre) {
        applyOmbreOuterFrostingMaterial(material, { baseColor, ombreColor, minY, maxY });
      } else {
        clearStripedOuterFrostingMaterial(material, baseColor);
      }
      material.roughness = 0.38;
      material.metalness = 0;
      material.needsUpdate = true;
    });
  });
}

function getOuterFrostingLabel(value) {
  const finishOption = OUTER_FROSTING_FINISH_OPTIONS.find((option) => option.value === value);
  if (finishOption) return finishOption.label;
  return value || "";
}

function isOuterFrostingFinish(value) {
  return OUTER_FROSTING_FINISH_OPTIONS.some((option) => option.value === value);
}

async function addDisplayCaseDecor(group, entry, cake, localLoader) {
  if (cake.decor === SHELL_BORDER_DECOR) {
    const edge = cake.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE;
    const count = getShellCountForTier(entry, entry.tierRadius);
    const y = edge === "bottom"
      ? SHELL_BORDER_BOTTOM_Y_OFFSET
      : entry.tierHeight + SHELL_BORDER_TOP_Y_OFFSET;
    const border = await createShellBorder(entry.tierRadius, y, count, {
      shellLoader: localLoader,
      color: DEFAULT_SHELL_FROSTING_COLOR
    });
    group.add(border);
    return;
  }

  if (cake.decor !== SWIRL_DECOR) return;

  const swirlTemplate = await loadSwirlModel(localLoader);
  const cherryTemplate = cake.cherries ? await loadCherryModel(localLoader) : null;
  const swirlCount = normalizeSwirlCount(cake.swirlCount);
  const radius = entry.tierRadius + SWIRL_RADIUS_OFFSET;
  const y = entry.tierHeight + SHELL_BORDER_TOP_Y_OFFSET + SWIRL_TOP_Y_OFFSET;
  const scale = getSwirlScaleForTier(swirlTemplate, radius, swirlCount);
  const cherryScale = cherryTemplate ? getCherryScaleForSwirl(cherryTemplate, swirlTemplate, scale) : 1;

  for (let i = 0; i < swirlCount; i += 1) {
    const angle = (i / swirlCount) * Math.PI * 2;
    const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const swirl = swirlTemplate.clone(true);

    swirl.position.set(outward.x * radius, y, outward.z * radius);
    swirl.lookAt(outward.x * (radius + 1), y, outward.z * (radius + 1));
    swirl.rotateY(Math.PI);
    swirl.scale.setScalar(scale);
    applyShellBorderMaterial(swirl);
    group.add(swirl);

    if (cherryTemplate) {
      const cherryRadius = radius + CHERRY_RADIUS_OFFSET;
      const cherry = cherryTemplate.clone(true);
      cherry.position.set(
        outward.x * cherryRadius,
        y + CHERRY_TOP_Y_OFFSET,
        outward.z * cherryRadius
      );
      cherry.lookAt(outward.x * (cherryRadius + 1), y + CHERRY_TOP_Y_OFFSET, outward.z * (cherryRadius + 1));
      cherry.rotateY(Math.PI);
      cherry.scale.setScalar(cherryScale);
      prepareDecorModelMaterials(cherry);
      group.add(cherry);
    }
  }
}

async function initDisplayCaseCakePreview(container, cake) {
  if (!container) return null;

  container.innerHTML = "";
  const localLoader = new GLTFLoader();
  const localScene = new THREE.Scene();
  localScene.background = null;

  const width = container.clientWidth || 160;
  const height = container.clientHeight || 122;
  const localCamera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
  localCamera.position.set(0, 0.36, 1.42);
  localCamera.lookAt(0, 0.18, 0);

  const localRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  localRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  localRenderer.setSize(width, height);
  container.appendChild(localRenderer.domElement);

  localScene.add(new THREE.AmbientLight(0xffffff, 0.78));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(2.8, 4, 3);
  localScene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
  fillLight.position.set(-2.5, 2.2, 2.4);
  localScene.add(fillLight);

  const group = new THREE.Group();
  localScene.add(group);

  const tierGltf = await loadCakePartModel(localLoader, { size: cake.size, kind: "main" });
  const tier = tierGltf.scene;
  prepareTierMaterials(tier);
  applyTierColorsToObject(tier, cake);
  const { height: tierHeight, width: tierWidth } = normalizeCakeModelBounds(tier);
  group.add(tier);

  const outerSrc = getOuterFrostingModelSrc(cake.size);
  if (outerSrc) {
    const outer = await loadModelScene(outerSrc, localLoader);
    prepareTierMaterials(outer);
    normalizeCakeModelBounds(outer);
    group.add(outer);
    applyOuterFrostingFinish(outer, cake);
  }

  const entry = {
    object: tier,
    tierHeight,
    tierRadius: tierWidth / 2,
    size: cake.size,
    partIndex: 0
  };
  await addDisplayCaseDecor(group, entry, cake, localLoader);

  const bounds = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  bounds.getCenter(center);
  bounds.getSize(size);
  group.position.sub(center);
  group.position.y += (bounds.max.y - bounds.min.y) * 0.18;
  const previewScale = Math.min(3.25, 0.86 / Math.max(size.x, size.y, size.z, 0.001));
  group.scale.setScalar(previewScale);
  group.rotation.y = -0.22;

  let disposed = false;
  function renderPreview() {
    if (disposed) return;
    group.rotation.y += 0.0005;
    localRenderer.render(localScene, localCamera);
    requestAnimationFrame(renderPreview);
  }
  renderPreview();

  return () => {
    disposed = true;
    localRenderer.dispose();
    disposeMenuPreviewObject(group);
    container.innerHTML = "";
  };
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
    (entry.currentZ ?? entry.homeZ ?? 0) + offset.z
  );
}

async function syncOuterFrostingForIndex(index) {
  const entry = cakeObjects.find((cakeObject) => cakeObject.partIndex === index);
  const selection = customizerPreviewSelections[index];
  if (!entry || !selection) return;

  const shouldShowOuterFrosting = OUTER_FROSTING_MESH_FINISHES.includes(selection.outerFrosting) && entry.size;
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
    entry.outerFrostingType = selection.outerFrosting;
  }

  positionOuterFrostingForEntry(entry);
  entry.outerFrostingType = selection.outerFrosting;
  applyOuterFrostingFinish(entry.outerFrostingObject, selection);
  entry.outerFrostingObject.visible = !entry.peeking;
  syncPeekToggleForIndex(index);
}

function disposeEdibleImagePreview() {
  if (edibleImageMesh?.parent) {
    edibleImageMesh.parent.remove(edibleImageMesh);
  }
  if (edibleImageMesh) {
    edibleImageMesh.geometry?.dispose?.();
    if (edibleImageMesh.material?.map) edibleImageMesh.material.map.dispose();
    edibleImageMesh.material?.dispose?.();
  }
  edibleImageMesh = null;
  edibleImageTexture = null;
  edibleImageTextureKey = "";
  edibleImageSourceImage = null;
  edibleImageDragState = null;
}

function loadEdibleImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function createCircularEdibleImageTexture(selection) {
  const src = selection?.edibleImageDataUrl || "";
  if (!src) return null;

  if (!edibleImageSourceImage || edibleImageSourceImage.userDataSrc !== src) {
    edibleImageSourceImage = await loadEdibleImageElement(src);
    edibleImageSourceImage.userDataSrc = src;
  }

  const canvasSize = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const scale = Math.max(0.05, Number(selection.edibleImageScale) || DEFAULT_EDIBLE_IMAGE_SCALE);
  const imageRadius = Math.max(0.05, Math.min(Number(selection.edibleImageRadius) || DEFAULT_EDIBLE_IMAGE_RADIUS, DEFAULT_EDIBLE_IMAGE_RADIUS));
  const rotation = THREE.MathUtils.degToRad(Number(selection.edibleImageRotation) || 0);
  const image = edibleImageSourceImage;
  const imageCoverScale = Math.max(canvasSize / image.width, canvasSize / image.height) * scale;
  const imageWidth = image.width * imageCoverScale;
  const imageHeight = image.height * imageCoverScale;
  const maskRadius = (canvasSize / 2) * imageRadius;

  context.clearRect(0, 0, canvasSize, canvasSize);
  context.save();
  context.beginPath();
  context.arc(canvasSize / 2, canvasSize / 2, maskRadius, 0, Math.PI * 2);
  context.clip();
  context.translate(canvasSize / 2, canvasSize / 2);
  context.rotate(rotation);
  context.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function getTopMainTierIndex(selectionList = customizerPreviewSelections) {
  let topIndex = null;
  let topSize = Infinity;

  selectionList.forEach((selection, index) => {
    if (selection?.kind !== "main" || !selection.size) return;
    const size = Number(selection.size);
    if (size < topSize) {
      topSize = size;
      topIndex = index;
    }
  });

  return topIndex;
}

function getTopMainCakeEntry() {
  const topIndex = getTopMainTierIndex(customizerPreviewSelections);
  return topIndex === null ? null : cakeObjects.find((entry) => entry.partIndex === topIndex && entry.kind === "main") || null;
}

function getEdibleImageSelectionIndex() {
  return getTopMainTierIndex(customizerPreviewSelections);
}

function clearEdibleImageSettings(selection) {
  if (!selection) return;
  Object.assign(selection, getDefaultEdibleImageSettings());
}

function enforceTopTierEdibleImageOnly() {
  const topIndex = getTopMainTierIndex(customizerPreviewSelections);
  customizerPreviewSelections.forEach((selection, index) => {
    if (index !== topIndex && selection?.edibleImage) {
      clearEdibleImageSettings(selection);
    }
  });
}

function clampEdibleImagePosition(selection, entry) {
  if (!selection || !entry) return;

  const radius = Math.max(entry.tierRadius || 0.1, 0.1);
  const imageRadius = Math.max(0.05, Math.min(Number(selection.edibleImageRadius) || DEFAULT_EDIBLE_IMAGE_RADIUS, DEFAULT_EDIBLE_IMAGE_RADIUS));
  const imageTopRadius = radius * imageRadius;
  const safeRadius = Math.max(radius - imageTopRadius, 0);
  const x = Number(selection.edibleImageX) || 0;
  const y = Number(selection.edibleImageY) || 0;
  const distance = Math.hypot(x, y);

  if (distance > safeRadius) {
    const ratio = safeRadius / distance;
    selection.edibleImageX = x * ratio;
    selection.edibleImageY = y * ratio;
  }
}

function getEdibleImageLocalTopY(entry) {
  if (!entry?.object) return entry?.tierHeight || 0.1;

  const previewParent = edibleImageMesh?.parent || null;
  const previewIndex = previewParent ? previewParent.children.indexOf(edibleImageMesh) : -1;
  if (previewParent) previewParent.remove(edibleImageMesh);

  entry.object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(entry.object);

  if (previewParent && edibleImageMesh) {
    if (previewIndex >= 0 && previewIndex < previewParent.children.length) {
      previewParent.children.splice(previewIndex, 0, edibleImageMesh);
      edibleImageMesh.parent = previewParent;
    } else {
      previewParent.add(edibleImageMesh);
    }
    previewParent.updateWorldMatrix(true, true);
  }

  if (box.isEmpty()) {
    return entry.tierHeight || 0.1;
  }

  const localPoint = entry.object.worldToLocal(new THREE.Vector3(0, box.max.y, 0));
  return localPoint.y;
}

function applyEdibleImageTransform(selection, entry) {
  if (!edibleImageMesh || !selection || !entry) return;

  clampEdibleImagePosition(selection, entry);
  const radius = entry.tierRadius || 0.24;
  const diameter = radius * 2;
  const topY = getEdibleImageLocalTopY(entry);

  edibleImageMesh.scale.set(diameter, diameter, 1);
  edibleImageMesh.position.set(
    Number(selection.edibleImageX) || 0,
    topY + EDIBLE_IMAGE_TOP_OFFSET,
    Number(selection.edibleImageY) || 0
  );
  edibleImageMesh.rotation.set(-Math.PI / 2, 0, 0);
}

function clearEdibleImageUpload(selection) {
  if (!selection) return;
  selection.edibleImage = false;
  selection.edibleImageFileName = "";
  selection.edibleImageDataUrl = "";
  selection.edibleImageScale = DEFAULT_EDIBLE_IMAGE_SCALE;
  selection.edibleImageRadius = DEFAULT_EDIBLE_IMAGE_RADIUS;
  selection.edibleImageRotation = DEFAULT_EDIBLE_IMAGE_ROTATION;
  selection.edibleImageX = DEFAULT_EDIBLE_IMAGE_POSITION.x;
  selection.edibleImageY = DEFAULT_EDIBLE_IMAGE_POSITION.y;
}

async function syncEdibleImagePreview() {
  if (!cakeSceneRoot) return;
  enforceTopTierEdibleImageOnly();

  const topIndex = getEdibleImageSelectionIndex();
  const selection = topIndex !== null ? customizerPreviewSelections[topIndex] : null;
  const entry = getTopMainCakeEntry();
  if (!selection?.edibleImage || !selection.edibleImageDataUrl || !entry) {
    disposeEdibleImagePreview();
    return;
  }

  const nextTextureKey = [
    selection.edibleImageDataUrl,
    Number(selection.edibleImageRadius) || DEFAULT_EDIBLE_IMAGE_RADIUS,
    Number(selection.edibleImageScale) || DEFAULT_EDIBLE_IMAGE_SCALE,
    Number(selection.edibleImageRotation) || DEFAULT_EDIBLE_IMAGE_ROTATION
  ].join("|");

  if (!edibleImageTexture || edibleImageTextureKey !== nextTextureKey) {
    const nextTexture = await createCircularEdibleImageTexture(selection);
    if (!nextTexture) return;
    if (edibleImageTexture) edibleImageTexture.dispose();
    edibleImageTexture = nextTexture;
    edibleImageTextureKey = nextTextureKey;
  }

  if (!edibleImageMesh) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: edibleImageTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    });
    edibleImageMesh = new THREE.Mesh(geometry, material);
    edibleImageMesh.name = "edibleImagePreview";
    edibleImageMesh.renderOrder = 100;
    edibleImageMesh.userData.isEdibleImage = true;
  }

  const edibleImageLayer = ensureDecorLayer(entry, EDIBLE_IMAGE_DECOR);
  if (edibleImageMesh.parent !== edibleImageLayer) {
    edibleImageMesh.parent?.remove(edibleImageMesh);
    edibleImageLayer?.add(edibleImageMesh);
  }

  if (edibleImageMesh.material.map !== edibleImageTexture) {
    edibleImageMesh.material.map = edibleImageTexture;
    edibleImageMesh.material.needsUpdate = true;
  }

  applyEdibleImageTransform(selection, entry);
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
  const cupcakeStackInView = isCupcakeStackSelected();
  const selectedCupcakeClusterIndex = getActiveCupcakeClusterIndex();
  const selectedCupcakeClusterOffset = getActiveCupcakeClusterOffset();
  const cupcakeHiddenOffset = Math.max(getCupcakeStackMetrics(cakeObjects.filter((entry) => isCupcakeKind(entry.kind))).width + 1.4, 1.8);
  shiftCustomizerCameraTarget(new THREE.Vector3(0, cupcakeStackInView ? 0.34 : 0.46, cupcakeStackInView ? 0.24 : 0));

  cakeObjects.forEach((entry) => {
    const { object, partIndex: objectPartIndex, kind } = entry;
    const isActive = partIndex !== null && objectPartIndex === partIndex;
    const selection = customizerPreviewSelections[objectPartIndex] || {};
    entry.targetZ = entry.homeZ ?? 0;

    if (isBackupKind(kind)) {
      object.visible = backupInView && visibleBackupTierIndex === objectPartIndex;
      entry.targetX = visibleBackupTierIndex === objectPartIndex ? entry.centerX : entry.hiddenX;
    } else if (isCupcakeKind(kind)) {
      object.visible = cupcakeStackInView;
      const clusterOffset = entry.clusterOffsetX || 0;
      const clusterSide = (entry.clusterIndex || 0) < (selectedCupcakeClusterIndex || 0) ? -1 : 1;
      entry.centerX = clusterOffset - selectedCupcakeClusterOffset;
      entry.hiddenX = clusterSide * cupcakeHiddenOffset;
      entry.targetX = cupcakeStackInView
        ? entry.centerX
        : entry.hiddenX;
    } else {
      object.visible = !backupInView && !cupcakeStackInView;
      entry.targetX = backupInView || cupcakeStackInView
        ? entry.hiddenX
        : entry.centerX ?? entry.homeX;
    }

    applyTierColorsToObject(object, selection);
    applyOuterFrostingFinish(entry.outerFrostingObject, selection);
    if (entry.outerFrostingObject) {
      entry.outerFrostingObject.visible = object.visible && !entry.peeking;
    }
    if (entry.decorGroup) {
      entry.decorGroup.visible = object.visible && !entry.peeking;
    }
    if (entry.cupcakeSwirlGroup) {
      entry.cupcakeSwirlGroup.visible = object.visible;
    }

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

  setFocusObject(partIndex !== null
    ? cakeObjects.find((entry) => entry.partIndex === partIndex) || null
    : null);

  if (cupcakeStackInView) {
    enforceCupcakeEditModelVisibility();
    syncCupcakePreviewWindowVisibility(true);
  } else {
    syncCupcakePreviewWindowVisibility(false);
  }

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

function initializeCakeFlow(guests, restoredState = null, options = {}) {
  if (!Number.isFinite(guests) || guests <= 0) return;

  const previewRecommendation = getNearestPreviewRecommendationForGuests(guests);
  const heroSnapshot = getHeroPreviewTransitionSnapshot();

  const shouldAnimateRecommendationEntry = !restoredState && !options.liveUpdate;
  if (shouldAnimateRecommendationEntry) {
    document.body.classList.add("recommendations-entering");
  }
  showRecommendationsPageView();

  if (guestCountInput) {
    guestCountInput.value = guests;
  }

const flavorPrices = window.CakeSupplyPricing?.flavorPrices || {
  "Vanilla": 0,
  "Chocolate": 8,
  "Red Velvet": 10,
  "Lemon": 8
};

const fillingPrices = window.CakeSupplyPricing?.fillingPrices || {
  "Vanilla Buttercream": 0,
  "Chocolate Ganache": 5,
  "Raspberry": 5,
  "Strawberry": 3,
  "Lemon Curd": 7,
  "Cream Cheese": 8
};

const frostingPrices = window.CakeSupplyPricing?.frostingPrices || {
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

const baseCakePrices = window.CakeSupplyPricing?.baseCakePrices || {
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

function getCupcakeSupplementScore(gap, cupcakeCount) {
  const overage = cupcakeCount - gap;
  const smallGapCredit = gap <= 12 ? -6 : 0;
  return overage + 2 + smallGapCredit;
}

function getTieredDisplayScoreAdjustment(tierOption, guests) {
  const tierCount = tierOption.tiers.length;
  const smallestTier = Math.min(...tierOption.tiers);
  let score = 0;

  if (guests < 60 && tierCount > 2) score += 2;
  if (guests > 40 && smallestTier < 8 && smallestTier !== 6) score += 10;
  if (tierOption.tiers.includes(6)) score -= 3;
  if (tierCount === 3) score -= 2;

  return score;
}

function buildCupcakeRecommendations(guests) {
  const cupcakeRecommendations = [];

  tieredOptions.forEach((tierOption) => {
    if (tierOption.servings >= guests) return;

    const gap = guests - tierOption.servings;
    const cupcakeCount = getCupcakeQuantityForServings(gap, CUPCAKE_MAX_SUPPLEMENT);
    if (!cupcakeCount) return;

    let score = getCupcakeSupplementScore(gap, cupcakeCount);
    score += getTieredDisplayScoreAdjustment(tierOption, guests);

    cupcakeRecommendations.push({
      name: `${getTieredRecommendationName(tierOption.tiers)} + ${cupcakeCount} Cupcakes`,
      servings: tierOption.servings + cupcakeCount,
      type: "tiered-cupcakes",
      supplementalStrategy: "cupcakes",
      tierSizes: tierOption.tiers.slice(),
      cupcakeCount,
      score
    });
  });

  return cupcakeRecommendations;
}

function getBasePrice(recommendation) {
  if (recommendation.type === "cupcakes") {
    return getCupcakeBasePrice(recommendation.cupcakeCount);
  }

  if (recommendation.type === "single-cupcakes") {
    return (tierBasePrices[recommendation.roundSize] || 0) + getCupcakeBasePrice(recommendation.cupcakeCount);
  }

  if (recommendation.type === "tiered-cupcakes") {
    const sizes = recommendation.tierSizes || (recommendation.name.match(/\d+/g) || []).map(Number).slice(0, -1);
    const tierPrice = sizes.reduce((total, size) => total + (tierBasePrices[size] || 0), 0);
    return tierPrice + getCupcakeBasePrice(recommendation.cupcakeCount);
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

function getRecommendationPriceRange(recommendationList) {
  const prices = recommendationList
    .map((recommendation) => getBasePrice(recommendation))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (!prices.length) return { min: 0, max: 0 };

  return {
    min: Math.floor(Math.min(...prices) / 5) * 5,
    max: Math.ceil(Math.max(...prices) / 5) * 5
  };
}

function getRecommendationMedianPrice(recommendationList, priceRange) {
  const prices = recommendationList
    .map((recommendation) => getBasePrice(recommendation))
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);

  if (!prices.length) {
    return (priceRange.min + priceRange.max) / 2;
  }

  const middleIndex = Math.floor(prices.length / 2);
  const median = prices.length % 2
    ? prices[middleIndex]
    : (prices[middleIndex - 1] + prices[middleIndex]) / 2;

  return Math.round(median / 5) * 5;
}

function syncRecommendationControls(guests, priceRange, fallbackBudget) {
  const clampedGuests = Math.min(250, Math.max(10, Math.round(guests)));

  if (guestCountInput && guestCountInput.value !== String(clampedGuests)) {
    guestCountInput.value = clampedGuests;
  }

  if (servingsSlider && servingsSlider.value !== String(clampedGuests)) {
    servingsSlider.value = clampedGuests;
  }

  if (!priceSlider || !priceSliderValue) return;

  priceSlider.min = priceRange.min;
  priceSlider.max = priceRange.max;

  if (!recommendationBudgetWasManuallySelected || !Number.isFinite(selectedRecommendationBudget)) {
    selectedRecommendationBudget = fallbackBudget;
  }

  selectedRecommendationBudget = Math.min(
    priceRange.max,
    Math.max(priceRange.min, Math.round(selectedRecommendationBudget / 5) * 5)
  );

  priceSlider.value = selectedRecommendationBudget;
  priceSliderValue.textContent = formatPrice(selectedRecommendationBudget);
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

let recommendations = [];

// TIERED CAKES
for (let i = 0; i < tieredOptions.length; i++) {
  let tier = tieredOptions[i];

  if (tier.servings < guests) continue;

  let score = tier.servings - guests;
  score += getTieredDisplayScoreAdjustment(tier, guests);

  let tierNames = tier.tiers
    .slice()
    .sort((a, b) => a - b)
    .map(size => `${size}"`)
    .join(' + ');

  recommendations.push({
    name: `${tierNames} tiered cake`,
    servings: tier.servings,
    type: "tiered",
    supplementalStrategy: "none",
    score
  });
}
// TIERED + ROUND BACKUP
for (let i = 0; i < tieredOptions.length; i++) {
  let tier = tieredOptions[i];
  let tierCount = tier.tiers.length;
  let smallestTier = Math.min(...tier.tiers);

  if (tier.servings >= guests) continue;

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
score += getTieredDisplayScoreAdjustment(tier, guests);

// discourage tiered + backup for small events
if (guests <= 35) {
  score += 20;
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
  supplementalStrategy: "backup",
  tierSizes: tier.tiers.slice(),
  backupSize: backupCake.size,
  score: score
});
}
}

recommendations.push(...buildCupcakeRecommendations(guests));

// SORT BEST TO WORST
recommendations.sort((a, b) => a.score - b.score);

const recommendationPriceRange = getRecommendationPriceRange(recommendations);
const defaultBudget = getRecommendationMedianPrice(recommendations, recommendationPriceRange);
syncRecommendationControls(guests, recommendationPriceRange, defaultBudget);

if (Number.isFinite(selectedRecommendationBudget)) {
  recommendations.forEach((recommendation) => {
    const budgetDistance = Math.abs(getBasePrice(recommendation) - selectedRecommendationBudget);
    recommendation.score += budgetDistance / 5;
  });

  recommendations.sort((a, b) => a.score - b.score);
}

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

const restoredRecommendation = getSavedRecommendationMatch();
const restoredCustomizerView = restoredState?.customizerState?.currentView || restoredState?.view;
if (restoredRecommendation && restoredCustomizerView === "customizer") {
  document.body.classList.remove("recommendations-entering");
  showCustomizer(restoredRecommendation, restoredState.customizerState, false);
  return;
}

if (restoredRecommendation && restoredCustomizerView === "summary") {
  document.body.classList.remove("recommendations-entering");
  showCustomizer(restoredRecommendation, restoredState.customizerState, true);
  return;
}

if (restoredRecommendation && restoredCustomizerView === "fulfillment") {
  document.body.classList.remove("recommendations-entering");
  showCustomizer(restoredRecommendation, restoredState.customizerState, false, true);
  return;
}

if (restoredRecommendation && restoredCustomizerView === "decor") {
  document.body.classList.remove("recommendations-entering");
  showCustomizer(restoredRecommendation, restoredState.customizerState, false, false, true);
  return;
}

if (shouldAnimateRecommendationEntry) {
  requestAnimationFrame(() => {
    animateHeroPreviewIntoRecommendation(heroSnapshot, animationTargetRecommendation);
  });
} else {
  document.body.classList.remove("recommendations-entering");
}

function showCustomizer(recommendation, restoredCustomizerState = null, openSummaryOnLoad = false, openFulfillmentOnLoad = false, openDecorOnLoad = false) {
  showCustomizerPageView();
  document.getElementById("customizer").style.display = "block";
  let currentCustomizerView = openSummaryOnLoad
    ? "summary"
    : openFulfillmentOnLoad
      ? "fulfillment"
      : openDecorOnLoad
        ? "decor"
        : "customizer";

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
      <div id="cupcake-preview-window-stack" class="cupcake-preview-window-stack" hidden></div>
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
    <button id="extra-backup-toggle" type="button" class="extra-backup-toggle accordion-header" aria-expanded="false">Add Extra Servings</button>
    <div id="extra-backup-content" class="extra-backup-content accordion-content">
      <div class="extra-backup-shell">
        <div class="extra-backup-stage">
          <div class="extra-backup-size-list">
            <p class="extra-backup-helper">Choose an add-on if you want a little more cake on hand.</p>
            <div class="extra-backup-size-buttons">
              <button type="button" class="extra-backup-size-btn extra-cupcake-size-btn" data-cupcakes="12" aria-label="Add 1 dozen cupcakes, adds 12 servings">
                <span class="extra-backup-size-copy">
                  <span class="extra-backup-size-name extra-cupcake-size-name">1 Dozen Cupcakes</span>
                  <span class="extra-backup-size-servings">Adds 12 servings</span>
                  <span class="extra-backup-size-price">$${formatMoney(CUPCAKE_DOZEN_PRICE)}</span>
                </span>
                <span class="extra-backup-cupcake-preview" data-extra-cupcake-preview aria-hidden="true"></span>
                <span class="extra-backup-add-label">Add</span>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="6" aria-label='Add 6 inch round cake, adds 10 servings'>
                <span class="extra-backup-size-copy">
                  <span class="extra-backup-size-name">6" Round</span>
                  <span class="extra-backup-size-servings">Adds 10 servings</span>
                  <span class="extra-backup-size-price">$${formatMoney(baseCakePrices['6" cake'] || 0)}</span>
                </span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-6"
                  src="models/tier_6.glb"
                  alt='6 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
                <span class="extra-backup-add-label">Add</span>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="8" aria-label='Add 8 inch round cake, adds 18 servings'>
                <span class="extra-backup-size-copy">
                  <span class="extra-backup-size-name">8" Round</span>
                  <span class="extra-backup-size-servings">Adds 18 servings</span>
                  <span class="extra-backup-size-price">$${formatMoney(baseCakePrices['8" cake'] || 0)}</span>
                </span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-8"
                  src="models/tier_8.glb"
                  alt='8 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
                <span class="extra-backup-add-label">Add</span>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="10" aria-label='Add 10 inch round cake, adds 32 servings'>
                <span class="extra-backup-size-copy">
                  <span class="extra-backup-size-name">10" Round</span>
                  <span class="extra-backup-size-servings">Adds 32 servings</span>
                  <span class="extra-backup-size-price">$${formatMoney(baseCakePrices['10" cake'] || 0)}</span>
                </span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-10"
                  src="models/tier_10.glb"
                  alt='10 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
                <span class="extra-backup-add-label">Add</span>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="12" aria-label='Add 12 inch round cake, adds 47 servings'>
                <span class="extra-backup-size-copy">
                  <span class="extra-backup-size-name">12" Round</span>
                  <span class="extra-backup-size-servings">Adds 47 servings</span>
                  <span class="extra-backup-size-price">$${formatMoney(baseCakePrices['12" cake'] || 0)}</span>
                </span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-12"
                  src="models/tier_12.glb"
                  alt='12 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
                <span class="extra-backup-add-label">Add</span>
              </button>
              <button type="button" class="extra-backup-size-btn" data-size="14" aria-label='Add 14 inch round cake, adds 70 servings'>
                <span class="extra-backup-size-copy">
                  <span class="extra-backup-size-name">14" Round</span>
                  <span class="extra-backup-size-servings">Adds 70 servings</span>
                  <span class="extra-backup-size-price">$${formatMoney(baseCakePrices['14" cake'] || 0)}</span>
                </span>
                <model-viewer
                  class="extra-backup-size-visual extra-backup-size-visual-14"
                  src="models/tier_14.glb"
                  alt='14 inch cake tier'
                  camera-controls
                  disable-zoom
                  interaction-prompt="none"
                  aria-hidden="true">
                </model-viewer>
                <span class="extra-backup-add-label">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>

  <div class="customizer-panel" id="decor-panel" hidden>
    <div id="decor-content" class="decor-screen-content">
      <div class="decor-main-section accordion-section expanded" data-accordion-section="decor">
        <button id="decor-toggle" type="button" class="decor-toggle accordion-header" aria-expanded="true">Decoration</button>
        <div class="decor-content accordion-content">
          <div class="decor-shell">
            <div class="decor-stage">
              <div class="decor-control-stack">
                <section class="decor-control-group">
                  <div class="decor-finish-row">
                    <label class="decor-field-label" for="outer-frosting-select">Finish</label>
                    <div class="decor-select-color-row">
                      <select id="outer-frosting-select" class="decor-select">
                        <option value="">None</option>
                        ${OUTER_FROSTING_FINISH_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
                      </select>
                      <div class="decor-color-picker" data-color-picker="outer">
                        <button id="outer-frosting-color-preview" type="button" class="decor-color-preview" aria-label="Outer frosting color" aria-expanded="false"></button>
                        <div id="outer-frosting-color-menu" class="decor-color-popup" hidden>
                          <div class="decor-color-popup-swatches" aria-label="Outer frosting color">
                            <button type="button" class="decor-color-swatch is-selected" data-decor-color="#fff7c7" style="--swatch-color: #fff7c7;" aria-label="Vanilla outer frosting"></button>
                            <button type="button" class="decor-color-swatch" data-decor-color="#f8c7d0" style="--swatch-color: #f8c7d0;" aria-label="Pink outer frosting"></button>
                            <button type="button" class="decor-color-swatch" data-decor-color="#b9c7f2" style="--swatch-color: #b9c7f2;" aria-label="Blue outer frosting"></button>
                            <button type="button" class="decor-color-swatch" data-decor-color="#c9dfbd" style="--swatch-color: #c9dfbd;" aria-label="Green outer frosting"></button>
                            <button type="button" class="decor-color-swatch" data-decor-color="#8b6659" style="--swatch-color: #8b6659;" aria-label="Chocolate outer frosting"></button>
                            <label class="decor-color-custom-swatch" aria-label="Custom outer frosting color">
                              <span aria-hidden="true">+</span>
                              <input id="outer-frosting-color" class="decor-color-input" type="color" value="${DEFAULT_OUTER_FROSTING_COLOR}" aria-label="Custom outer frosting color">
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div id="stripe-color-field" class="stripe-color-field" hidden>
                    <div class="decor-select-color-row">
                      <div id="secondary-finish-color-label" class="decor-field-label">Stripe Color</div>
                      <div class="decor-color-picker" data-color-picker="stripe">
                        <button id="outer-frosting-stripe-color-preview" type="button" class="decor-color-preview" aria-label="Stripe color" aria-expanded="false"></button>
                        <div id="outer-frosting-stripe-color-menu" class="decor-color-popup" hidden>
                          <div class="decor-color-popup-swatches" aria-label="Stripe color">
                            <button type="button" class="decor-color-swatch stripe-color-swatch is-selected" data-stripe-color="#fff7c7" style="--swatch-color: #fff7c7;" aria-label="Vanilla stripe color"></button>
                            <button type="button" class="decor-color-swatch stripe-color-swatch" data-stripe-color="#f8c7d0" style="--swatch-color: #f8c7d0;" aria-label="Pink stripe color"></button>
                            <button type="button" class="decor-color-swatch stripe-color-swatch" data-stripe-color="#b9c7f2" style="--swatch-color: #b9c7f2;" aria-label="Blue stripe color"></button>
                            <button type="button" class="decor-color-swatch stripe-color-swatch" data-stripe-color="#c9dfbd" style="--swatch-color: #c9dfbd;" aria-label="Green stripe color"></button>
                            <button type="button" class="decor-color-swatch stripe-color-swatch" data-stripe-color="#8b6659" style="--swatch-color: #8b6659;" aria-label="Chocolate stripe color"></button>
                            <label class="decor-color-custom-swatch" aria-label="Custom stripe color">
                              <span aria-hidden="true">+</span>
                              <input id="outer-frosting-stripe-color" class="decor-color-input stripe-color-input" type="color" value="${DEFAULT_STRIPE_FROSTING_COLOR}" aria-label="Custom stripe color">
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="decor-control-group">
                  <div class="decor-option-buttons" role="group" aria-label="Decorations">
                    <div class="decor-option-row">
                      <button id="shell-border-btn" type="button" class="decor-option-btn" data-decor="${SHELL_BORDER_DECOR}" aria-pressed="false">Shell Border</button>
                      <div class="decor-color-picker decor-option-color-picker" data-color-picker="shell-border">
                        <button id="shell-border-color-preview" type="button" class="decor-color-preview decor-option-color-preview" aria-label="Shell Border color" aria-expanded="false" hidden></button>
                        <div id="shell-border-color-menu" class="decor-color-popup" hidden>
                          <div class="decor-color-popup-swatches" aria-label="Shell Border color">
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_BORDER_DECOR}" data-decoration-color="#fffdf4" style="--swatch-color: #fffdf4;" aria-label="White shell border color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_BORDER_DECOR}" data-decoration-color="#fff7c7" style="--swatch-color: #fff7c7;" aria-label="Vanilla shell border color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_BORDER_DECOR}" data-decoration-color="#f8c7d0" style="--swatch-color: #f8c7d0;" aria-label="Pink shell border color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_BORDER_DECOR}" data-decoration-color="#b9c7f2" style="--swatch-color: #b9c7f2;" aria-label="Blue shell border color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_BORDER_DECOR}" data-decoration-color="#c9dfbd" style="--swatch-color: #c9dfbd;" aria-label="Green shell border color"></button>
                            <label class="decor-color-custom-swatch" aria-label="Custom shell border color">
                              <span aria-hidden="true">+</span>
                              <input id="shell-border-color-input" class="decor-color-input decoration-color-input" data-decoration-color-target="${SHELL_BORDER_DECOR}" type="color" value="${DEFAULT_SHELL_FROSTING_COLOR}" aria-label="Custom shell border color">
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="decor-option-row">
                      <button id="swirls-btn" type="button" class="decor-option-btn" data-decor="${SWIRL_DECOR}" aria-pressed="false">Swirls</button>
                      <div class="decor-color-picker decor-option-color-picker" data-color-picker="swirls">
                        <button id="swirls-color-preview" type="button" class="decor-color-preview decor-option-color-preview" aria-label="Swirls color" aria-expanded="false" hidden></button>
                        <div id="swirls-color-menu" class="decor-color-popup" hidden>
                          <div class="decor-color-popup-swatches" aria-label="Swirls color">
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWIRL_DECOR}" data-decoration-color="#fffdf4" style="--swatch-color: #fffdf4;" aria-label="White swirls color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWIRL_DECOR}" data-decoration-color="#fff7c7" style="--swatch-color: #fff7c7;" aria-label="Vanilla swirls color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWIRL_DECOR}" data-decoration-color="#f8c7d0" style="--swatch-color: #f8c7d0;" aria-label="Pink swirls color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWIRL_DECOR}" data-decoration-color="#b9c7f2" style="--swatch-color: #b9c7f2;" aria-label="Blue swirls color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWIRL_DECOR}" data-decoration-color="#c9dfbd" style="--swatch-color: #c9dfbd;" aria-label="Green swirls color"></button>
                            <label class="decor-color-custom-swatch" aria-label="Custom swirls color">
                              <span aria-hidden="true">+</span>
                              <input id="swirls-color-input" class="decor-color-input decoration-color-input" data-decoration-color-target="${SWIRL_DECOR}" type="color" value="${DEFAULT_SHELL_FROSTING_COLOR}" aria-label="Custom swirls color">
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="decor-option-row">
                      <button id="swags-btn" type="button" class="decor-option-btn" data-decor="${SWAG_DECOR}" aria-pressed="false">Swags</button>
                      <div class="decor-color-picker decor-option-color-picker" data-color-picker="swags">
                        <button id="swags-color-preview" type="button" class="decor-color-preview decor-option-color-preview" aria-label="Swags color" aria-expanded="false" hidden></button>
                        <div id="swags-color-menu" class="decor-color-popup" hidden>
                          <div class="decor-color-popup-swatches" aria-label="Swags color">
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWAG_DECOR}" data-decoration-color="#fffdf4" style="--swatch-color: #fffdf4;" aria-label="White swags color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWAG_DECOR}" data-decoration-color="#fff7c7" style="--swatch-color: #fff7c7;" aria-label="Vanilla swags color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWAG_DECOR}" data-decoration-color="#f8c7d0" style="--swatch-color: #f8c7d0;" aria-label="Pink swags color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWAG_DECOR}" data-decoration-color="#b9c7f2" style="--swatch-color: #b9c7f2;" aria-label="Blue swags color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SWAG_DECOR}" data-decoration-color="#c9dfbd" style="--swatch-color: #c9dfbd;" aria-label="Green swags color"></button>
                            <label class="decor-color-custom-swatch" aria-label="Custom swags color">
                              <span aria-hidden="true">+</span>
                              <input id="swags-color-input" class="decor-color-input decoration-color-input" data-decoration-color-target="${SWAG_DECOR}" type="color" value="${DEFAULT_SHELL_FROSTING_COLOR}" aria-label="Custom swags color">
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="decor-option-row">
                      <button id="shell-swag-btn" type="button" class="decor-option-btn" data-decor="${SHELL_SWAG_DECOR}" aria-pressed="false">Shell Swag</button>
                      <div class="decor-color-picker decor-option-color-picker" data-color-picker="shell-swag">
                        <button id="shell-swag-color-preview" type="button" class="decor-color-preview decor-option-color-preview" aria-label="Shell Swag color" aria-expanded="false" hidden></button>
                        <div id="shell-swag-color-menu" class="decor-color-popup" hidden>
                          <div class="decor-color-popup-swatches" aria-label="Shell Swag color">
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_SWAG_DECOR}" data-decoration-color="#fffdf4" style="--swatch-color: #fffdf4;" aria-label="White shell swag color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_SWAG_DECOR}" data-decoration-color="#fff7c7" style="--swatch-color: #fff7c7;" aria-label="Vanilla shell swag color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_SWAG_DECOR}" data-decoration-color="#f8c7d0" style="--swatch-color: #f8c7d0;" aria-label="Pink shell swag color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_SWAG_DECOR}" data-decoration-color="#b9c7f2" style="--swatch-color: #b9c7f2;" aria-label="Blue shell swag color"></button>
                            <button type="button" class="decor-color-swatch decoration-color-swatch" data-decoration-color-target="${SHELL_SWAG_DECOR}" data-decoration-color="#c9dfbd" style="--swatch-color: #c9dfbd;" aria-label="Green shell swag color"></button>
                            <label class="decor-color-custom-swatch" aria-label="Custom shell swag color">
                              <span aria-hidden="true">+</span>
                              <input id="shell-swag-color-input" class="decor-color-input decoration-color-input" data-decoration-color-target="${SHELL_SWAG_DECOR}" type="color" value="${DEFAULT_SHELL_FROSTING_COLOR}" aria-label="Custom shell swag color">
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="decor-option-row">
                      <button id="cherries-btn" type="button" class="decor-option-btn cherry-option-btn" aria-pressed="false">Cherries</button>
                    </div>
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

      <div id="featured-designs-drawer" class="featured-designs-drawer bottom-decor-drawer accordion-section" data-accordion-section="featured-designs">
        <button id="featured-designs-toggle" type="button" class="featured-designs-toggle accordion-header" aria-expanded="false">Featured Designs</button>
        <div id="featured-designs-content" class="featured-designs-content accordion-content">
          <div class="featured-designs-shell"></div>
        </div>
      </div>

      <div id="edible-image-drawer" class="edible-image-drawer bottom-decor-drawer accordion-section" data-accordion-section="edible-image">
        <button id="edible-image-toggle" type="button" class="edible-image-toggle accordion-header" aria-expanded="false">Edible Image</button>
        <div id="edible-image-content" class="edible-image-content accordion-content">
          <div class="edible-image-shell">
            <label class="edible-image-field">
              <span class="decor-field-label">Image file</span>
              <span class="edible-image-file-row">
                <input id="edible-image-file" class="edible-image-input" type="file" accept="image/*">
                <button id="edible-image-clear" class="edible-image-clear-btn" type="button" aria-label="Remove edible image" hidden>Delete</button>
              </span>
              <span id="edible-image-file-name" class="edible-image-file-name" hidden></span>
            </label>
            <div id="edible-image-transform-controls" class="edible-image-transform-controls" hidden>
              <div class="edible-image-range-field">
                <span class="edible-image-range-head">
                  <span class="decor-field-label">Radius</span>
                  <button id="edible-image-radius-reset" class="edible-image-reset-btn" type="button">Reset</button>
                </span>
                <input id="edible-image-radius" class="edible-image-range" type="range" min="0.2" max="0.92" step="0.005" value="0.92">
              </div>
              <div class="edible-image-range-field">
                <span class="edible-image-range-head">
                  <span class="decor-field-label">Scale</span>
                  <button id="edible-image-scale-reset" class="edible-image-reset-btn" type="button">Reset</button>
                </span>
                <input id="edible-image-scale" class="edible-image-range" type="range" min="0.1" max="3" step="0.005" value="1">
              </div>
              <div class="edible-image-range-field">
                <span class="edible-image-range-head">
                  <span class="decor-field-label">Rotation</span>
                  <button id="edible-image-rotation-reset" class="edible-image-reset-btn" type="button">Reset</button>
                </span>
                <input id="edible-image-rotation" class="edible-image-range" type="range" min="-720" max="720" step="0.5" value="0">
              </div>
              <p class="edible-image-help">Radius sets the cake-top circle. Scale zooms the image inside it.</p>
            </div>
            <label class="edible-image-field">
              <span class="decor-field-label">Notes</span>
              <textarea id="edible-image-notes" class="edible-image-textarea" rows="3" placeholder="Describe placement, size, or image details"></textarea>
            </label>
          </div>
        </div>
      </div>
    </div>
    <div id="fulfillment-panel-content" class="fulfillment-panel-content" hidden></div>
  </div>

  <button id="order-summary-btn" class="order-summary-btn" type="button">Decorate Cake</button>
  <button id="decor-order-summary-btn" class="order-summary-btn decor-order-summary-btn" type="button" hidden>Order Summary</button>
</div>

  </div>
`;

document.getElementById("back-btn").addEventListener("click", () => {
  if (document.getElementById("customizer-layout")?.classList.contains("is-fulfillment-step")) {
    setCustomizerStep("decor");
    return;
  }

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


const parts = getCustomizerParts(recommendation);

const orderSections = document.getElementById("order-sections");
let requiredDate = restoredCustomizerState?.requiredDate || "";
let fulfillmentCalendarMonth = getFulfillmentCalendarMonth(requiredDate);
let requiredTime = restoredCustomizerState?.requiredTime || "";
let fulfillmentMethod = restoredCustomizerState?.fulfillmentMethod === "delivery" ? "delivery" : "pickup";
let fulfillmentLocation = restoredCustomizerState?.fulfillmentLocation || "";
let fulfillmentPanelStep = "schedule";
let customerName = restoredCustomizerState?.customerName || "";
let customerEmail = restoredCustomizerState?.customerEmail || "";
let customerPhone = restoredCustomizerState?.customerPhone || "";

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
const outerFrostingColorPreview = document.getElementById("outer-frosting-color-preview");
const outerFrostingColorMenu = document.getElementById("outer-frosting-color-menu");
const outerFrostingColorInput = document.getElementById("outer-frosting-color");
const stripeColorField = document.getElementById("stripe-color-field");
const secondaryFinishColorLabel = document.getElementById("secondary-finish-color-label");
const outerFrostingStripeColorPreview = document.getElementById("outer-frosting-stripe-color-preview");
const outerFrostingStripeColorMenu = document.getElementById("outer-frosting-stripe-color-menu");
const outerFrostingStripeColorInput = document.getElementById("outer-frosting-stripe-color");
const decorColorSwatches = document.querySelectorAll(".decor-color-swatch[data-decor-color]");
const stripeColorSwatches = document.querySelectorAll(".stripe-color-swatch");
const decorationColorSwatches = document.querySelectorAll(".decoration-color-swatch");
const decorationColorInputs = document.querySelectorAll(".decoration-color-input");
const shellBorderColorPreview = document.getElementById("shell-border-color-preview");
const shellBorderColorMenu = document.getElementById("shell-border-color-menu");
const shellBorderColorInput = document.getElementById("shell-border-color-input");
const swirlsColorPreview = document.getElementById("swirls-color-preview");
const swirlsColorMenu = document.getElementById("swirls-color-menu");
const swirlsColorInput = document.getElementById("swirls-color-input");
const swagsColorPreview = document.getElementById("swags-color-preview");
const swagsColorMenu = document.getElementById("swags-color-menu");
const swagsColorInput = document.getElementById("swags-color-input");
const shellSwagColorPreview = document.getElementById("shell-swag-color-preview");
const shellSwagColorMenu = document.getElementById("shell-swag-color-menu");
const shellSwagColorInput = document.getElementById("shell-swag-color-input");
const shellBorderEdgeButtons = document.querySelectorAll(".shell-border-edge-btn");
const shellBorderPlacementGroup = document.querySelector(".shell-border-placement-group");
const swirlQuantityControls = document.querySelector(".swirl-quantity-controls");
const swirlQuantityGroup = document.querySelector(".swirl-quantity-group");
const swirlQuantityButtons = document.querySelectorAll(".swirl-quantity-btn");
const edibleImageToggle = document.getElementById("edible-image-toggle");
const featuredDesignsToggle = document.getElementById("featured-designs-toggle");
const edibleImageFileInput = document.getElementById("edible-image-file");
const edibleImageClearButton = document.getElementById("edible-image-clear");
const edibleImageFileNameLabel = document.getElementById("edible-image-file-name");
const edibleImageNotesInput = document.getElementById("edible-image-notes");
const edibleImageTransformControls = document.getElementById("edible-image-transform-controls");
const edibleImageRadiusInput = document.getElementById("edible-image-radius");
const edibleImageScaleInput = document.getElementById("edible-image-scale");
const edibleImageRotationInput = document.getElementById("edible-image-rotation");
const edibleImageRadiusResetButton = document.getElementById("edible-image-radius-reset");
const edibleImageScaleResetButton = document.getElementById("edible-image-scale-reset");
const edibleImageRotationResetButton = document.getElementById("edible-image-rotation-reset");
const extraBackupToggle = document.getElementById("extra-backup-toggle");
const extraBackupContent = document.getElementById("extra-backup-content");
const extraBackupSizeButtons = document.querySelectorAll(".extra-backup-size-btn");
const extraBackupSizeVisuals = document.querySelectorAll(".extra-backup-size-visual");

decorContent.hidden = false;
extraBackupContent.hidden = false;
extraBackupSizeVisuals.forEach(applyBlankTierColorsToModelViewer);
document.querySelectorAll("[data-extra-cupcake-preview]").forEach((preview) => {
  requestAnimationFrame(() => initCupcakePreview3D(preview, CUPCAKE_QUANTITY_STEP));
});

const selections = normalizeSingleDozenCupcakeSelections(Array.isArray(restoredCustomizerState?.selections) && restoredCustomizerState.selections.length
  ? restoredCustomizerState.selections.map((selection) => ({
      label: selection.label,
      size: selection.size,
      cupcakeCount: selection.cupcakeCount,
      cupcakeDozenIndex: selection.cupcakeDozenIndex,
      cupcakeDozenCount: selection.cupcakeDozenCount,
      extraCupcakes: selection.extraCupcakes === true,
      kind: selection.kind,
      flavor: selection.flavor || "",
      frosting: selection.frosting || "",
      filling: selection.filling || "",
      signature: selection.signature || "",
      decor: selection.decor || "",
      decorations: normalizeDecorationList(selection),
      shellBorderEdge: selection.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE,
      shellBorderEdges: normalizeShellBorderEdges(selection),
      shellBorderColor: selection.shellBorderColor || DEFAULT_SHELL_FROSTING_COLOR,
      swirlCount: normalizeSwirlCount(selection.swirlCount),
      swirlColor: selection.swirlColor || DEFAULT_SHELL_FROSTING_COLOR,
      swagColor: selection.swagColor || DEFAULT_SHELL_FROSTING_COLOR,
      shellSwagColor: selection.shellSwagColor || DEFAULT_SHELL_FROSTING_COLOR,
      cherries: selection.cherries === true,
      outerFrosting: selection.outerFrosting || "",
      outerFrostingColor: selection.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR,
      outerFrostingStripeColor: selection.outerFrostingStripeColor || DEFAULT_STRIPE_FROSTING_COLOR,
      outerFrostingOmbreColor: selection.outerFrostingOmbreColor || DEFAULT_OMBRE_FROSTING_COLOR,
      edibleImage: selection.edibleImage === true,
      edibleImageFileName: selection.edibleImageFileName || "",
      edibleImageNotes: selection.edibleImageNotes || "",
      edibleImageScale: Number.isFinite(Number(selection.edibleImageScale)) ? Number(selection.edibleImageScale) : DEFAULT_EDIBLE_IMAGE_SCALE,
      edibleImageRadius: Number.isFinite(Number(selection.edibleImageRadius)) ? Number(selection.edibleImageRadius) : DEFAULT_EDIBLE_IMAGE_RADIUS,
      edibleImageRotation: Number.isFinite(Number(selection.edibleImageRotation)) ? Number(selection.edibleImageRotation) : DEFAULT_EDIBLE_IMAGE_ROTATION,
      edibleImageX: Number.isFinite(Number(selection.edibleImageX)) ? Number(selection.edibleImageX) : DEFAULT_EDIBLE_IMAGE_POSITION.x,
      edibleImageY: Number.isFinite(Number(selection.edibleImageY)) ? Number(selection.edibleImageY) : DEFAULT_EDIBLE_IMAGE_POSITION.y,
      edibleImageDataUrl: selection.edibleImageDataUrl || ""
    }))
  : parts.map(part => ({
      label: part.label,
      size: part.size,
      cupcakeCount: part.cupcakeCount,
      cupcakeDozenIndex: part.cupcakeDozenIndex,
      cupcakeDozenCount: part.cupcakeDozenCount,
      extraCupcakes: part.extraCupcakes === true,
      kind: part.kind,
      flavor: "",
      frosting: "",
      filling: "",
      signature: "",
      decor: "",
      decorations: [],
      shellBorderEdge: SHELL_BORDER_DEFAULT_EDGE,
      shellBorderEdges: [SHELL_BORDER_DEFAULT_EDGE],
      shellBorderColor: DEFAULT_SHELL_FROSTING_COLOR,
      swirlCount: DEFAULT_SWIRL_COUNT,
      swirlColor: DEFAULT_SHELL_FROSTING_COLOR,
      swagColor: DEFAULT_SHELL_FROSTING_COLOR,
      shellSwagColor: DEFAULT_SHELL_FROSTING_COLOR,
      cherries: false,
      outerFrosting: "",
      outerFrostingColor: DEFAULT_OUTER_FROSTING_COLOR,
      outerFrostingStripeColor: DEFAULT_STRIPE_FROSTING_COLOR,
      outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
      ...getDefaultEdibleImageSettings()
    })));

if (activeTierIndex !== null && !selections[activeTierIndex]) {
  activeTierIndex = selections.length ? 0 : null;
}

customizerPreviewSelections = selections;

function getBaseCustomizerSelections(selectionList = selections) {
  return selectionList.filter((selection) => selection.kind !== "extra-backup");
}

function getExtraBackupSelections(selectionList = selections) {
  return selectionList.filter((selection) => selection.kind === "extra-backup");
}

function getCurrentBuilderParts() {
  return selections.flatMap((selection, selectionIndex) => {
    if (selection.kind === "extra-backup") return [];

    const matchingOriginalPart = parts.find((part) => {
      return part.kind === selection.kind
        && part.label === selection.label
        && (part.size || null) === (selection.size || null);
    });

    return [{
      ...(matchingOriginalPart || {}),
      selectionIndex,
      kind: selection.kind,
      size: selection.size,
      cupcakeCount: selection.cupcakeCount,
      cupcakeDozenIndex: selection.cupcakeDozenIndex,
      cupcakeDozenCount: selection.cupcakeDozenCount,
      extraCupcakes: selection.extraCupcakes === true,
      label: selection.label
    }];
  });
}

function persistCustomizerState(view = currentCustomizerView) {
  currentCustomizerView = view;
  setSavedAppState(getRecommendationStatePayload(recommendation, {
    currentView: view,
    activeTierIndex,
    requiredDate,
    requiredTime,
    fulfillmentMethod,
    fulfillmentLocation,
    customerName,
    customerEmail,
    customerPhone,
    selections: selections.map((selection) => ({
      label: selection.label,
      size: selection.size,
      cupcakeCount: selection.cupcakeCount,
      cupcakeDozenIndex: selection.cupcakeDozenIndex,
      cupcakeDozenCount: selection.cupcakeDozenCount,
      extraCupcakes: selection.extraCupcakes === true,
      kind: selection.kind,
      flavor: selection.flavor || "",
      frosting: selection.frosting || "",
      filling: selection.filling || "",
      signature: selection.signature || "",
      decor: selection.decor || "",
      decorations: normalizeDecorationList(selection),
      shellBorderEdge: selection.shellBorderEdge || SHELL_BORDER_DEFAULT_EDGE,
      shellBorderEdges: normalizeShellBorderEdges(selection),
      shellBorderColor: selection.shellBorderColor || DEFAULT_SHELL_FROSTING_COLOR,
      swirlCount: normalizeSwirlCount(selection.swirlCount),
      swirlColor: selection.swirlColor || DEFAULT_SHELL_FROSTING_COLOR,
      swagColor: selection.swagColor || DEFAULT_SHELL_FROSTING_COLOR,
      shellSwagColor: selection.shellSwagColor || DEFAULT_SHELL_FROSTING_COLOR,
      cherries: selection.cherries === true,
      outerFrosting: selection.outerFrosting || "",
      outerFrostingColor: selection.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR,
      outerFrostingStripeColor: selection.outerFrostingStripeColor || DEFAULT_STRIPE_FROSTING_COLOR,
      outerFrostingOmbreColor: selection.outerFrostingOmbreColor || DEFAULT_OMBRE_FROSTING_COLOR,
      edibleImage: selection.edibleImage === true,
      edibleImageFileName: selection.edibleImageFileName || "",
      edibleImageNotes: selection.edibleImageNotes || "",
      edibleImageScale: Number.isFinite(Number(selection.edibleImageScale)) ? Number(selection.edibleImageScale) : DEFAULT_EDIBLE_IMAGE_SCALE,
      edibleImageRadius: Number.isFinite(Number(selection.edibleImageRadius)) ? Number(selection.edibleImageRadius) : DEFAULT_EDIBLE_IMAGE_RADIUS,
      edibleImageRotation: Number.isFinite(Number(selection.edibleImageRotation)) ? Number(selection.edibleImageRotation) : DEFAULT_EDIBLE_IMAGE_ROTATION,
      edibleImageX: Number.isFinite(Number(selection.edibleImageX)) ? Number(selection.edibleImageX) : DEFAULT_EDIBLE_IMAGE_POSITION.x,
      edibleImageY: Number.isFinite(Number(selection.edibleImageY)) ? Number(selection.edibleImageY) : DEFAULT_EDIBLE_IMAGE_POSITION.y,
      edibleImageDataUrl: selection.edibleImageDataUrl || ""
    }))
  }, view));
}

function setCustomizerStep(step = "flavor") {
  const isDecorStep = step === "decor";
  const isFulfillmentStep = step === "fulfillment";
  currentCustomizerView = isFulfillmentStep ? "fulfillment" : isDecorStep ? "decor" : "customizer";
  const layout = document.getElementById("customizer-layout");
  const decorScreen = document.getElementById("decor-content");
  const fulfillmentScreen = document.getElementById("fulfillment-panel-content");
  const decorPanelTitle = document.getElementById("decor-toggle");

  if (flavorPanel) {
    flavorPanel.hidden = isDecorStep || isFulfillmentStep;
  }
  if (decorPanel) {
    decorPanel.hidden = !(isDecorStep || isFulfillmentStep);
  }
  if (decorScreen) {
    decorScreen.hidden = isFulfillmentStep;
  }
  if (fulfillmentScreen) {
    fulfillmentScreen.hidden = !isFulfillmentStep;
  }
  layout?.classList.toggle("is-fulfillment-step", isFulfillmentStep);
  if (orderSummaryBtn) {
    orderSummaryBtn.hidden = isDecorStep || isFulfillmentStep;
  }
  if (decorOrderSummaryBtn) {
    decorOrderSummaryBtn.hidden = !isDecorStep || isFulfillmentStep;
  }
  if (decorPanelTitle) {
    decorPanelTitle.textContent = isFulfillmentStep ? "" : "Decoration";
  }
  if (controls) {
    controls.enabled = !isFulfillmentStep;
  }
  if (renderer?.domElement) {
    renderer.domElement.style.cursor = "pointer";
  }

  if (isDecorStep) {
    fulfillmentPanelStep = "schedule";
    setAccordionSection("decor");
    syncDecorButtons(activeTierIndex);
  } else if (isFulfillmentStep) {
    fulfillmentPanelStep = "schedule";
    renderFulfillmentPanel();
    showFinishedOrderModel();
    requestAnimationFrame(() => {
      resizeCustomizerRenderer();
      frameFinishedOrderModel();
    });
    setTimeout(() => {
      resizeCustomizerRenderer();
      frameFinishedOrderModel();
    }, 480);
  } else {
    requestAnimationFrame(resizeCustomizerRenderer);
    setAccordionSection("flavor");
    if (activeTierIndex !== null) {
      selectTier(activeTierIndex);
    }
  }

  persistCustomizerState(isFulfillmentStep ? "fulfillment" : isDecorStep ? "decor" : "customizer");
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
    return getCupcakeBasePrice(selection.cupcakeCount);
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

function getStructuredPriceFields(selectionList, options = {}) {
  const basePrice = getSelectionsBaseTotal(selectionList);
  const upcharges = selectionList.reduce((summary, selection) => {
    const extras = getSelectionExtras(selection);
    summary.flavorUpcharges += extras.flavor;
    summary.fillingUpcharges += extras.filling;
    summary.decorUpcharges += extras.frosting + extras.decor;
    return summary;
  }, {
    flavorUpcharges: 0,
    fillingUpcharges: 0,
    decorUpcharges: 0
  });
  const deliveryFee = Number(options.deliveryFee || 0);
  const discount = Number(options.discount || 0);
  const depositPaid = Number(options.depositPaid || 0);
  const totalPrice = Math.max(
    basePrice +
    upcharges.flavorUpcharges +
    upcharges.fillingUpcharges +
    upcharges.decorUpcharges +
    deliveryFee -
    discount,
    0
  );
  const balanceDue = Math.max(totalPrice - depositPaid, 0);

  return {
    basePrice,
    flavorUpcharges: upcharges.flavorUpcharges,
    fillingUpcharges: upcharges.fillingUpcharges,
    decorUpcharges: upcharges.decorUpcharges,
    deliveryFee,
    discount,
    depositPaid,
    balanceDue,
    totalPrice
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

function buildOrderFromCustomizer() {
  enforceTopTierEdibleImageOnly();
  const summarySelections = selections.map((selection) => ({ ...selection }));
  const prices = getStructuredPriceFields(summarySelections);
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
    : "";
  const orderedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(now);
  const fulfillmentLabel = fulfillmentMethod === "delivery" ? "Delivery" : "Pickup";
  const submittedCustomerName = customerName.trim() || "Customer Name";
  const submittedCustomerEmail = customerEmail.trim();
  const submittedCustomerPhone = customerPhone.trim() || "(000-000-0000)";
  const primarySelection = summarySelections[0] || {};
  const orderItems = summarySelections.map((selection) => {
    const extras = getSelectionExtras(selection);
    const basePrice = getSelectionBasePrice(selection);
    const totalPrice = basePrice + extras.flavor + extras.frosting + extras.filling + extras.decor;

    return {
      quantity: "1",
      label: selection.label || "",
      description: selection.label || "",
      cupcakeDozenIndex: selection.cupcakeDozenIndex,
      cupcakeDozenCount: selection.cupcakeDozenCount,
      flavor: selection.flavor || "",
      frosting: selection.frosting || "",
      filling: selection.filling || "",
      signature: selection.signature || "",
      decor: selection.decor || "",
      decorations: normalizeDecorationList(selection),
      shellBorderEdge: selection.shellBorderEdge || "",
      shellBorderEdges: normalizeShellBorderEdges(selection),
      shellBorderColor: selection.shellBorderColor || DEFAULT_SHELL_FROSTING_COLOR,
      swirlCount: selection.swirlCount || 0,
      swirlColor: selection.swirlColor || DEFAULT_SHELL_FROSTING_COLOR,
      swagColor: selection.swagColor || DEFAULT_SHELL_FROSTING_COLOR,
      shellSwagColor: selection.shellSwagColor || DEFAULT_SHELL_FROSTING_COLOR,
      cherries: selection.cherries === true,
      outerFrosting: selection.outerFrosting || "",
      outerFrostingColor: selection.outerFrostingColor || "",
      outerFrostingStripeColor: selection.outerFrostingStripeColor || "",
      outerFrostingOmbreColor: selection.outerFrostingOmbreColor || "",
      edibleImage: selection.edibleImage === true,
      edibleImageFileName: selection.edibleImageFileName || "",
      edibleImageNotes: selection.edibleImageNotes || "",
      edibleImageScale: selection.edibleImageScale || DEFAULT_EDIBLE_IMAGE_SCALE,
      edibleImageRadius: selection.edibleImageRadius || DEFAULT_EDIBLE_IMAGE_RADIUS,
      edibleImageRotation: selection.edibleImageRotation || DEFAULT_EDIBLE_IMAGE_ROTATION,
      edibleImageX: selection.edibleImageX || 0,
      edibleImageY: selection.edibleImageY || 0,
      basePrice,
      flavorUpcharges: extras.flavor,
      fillingUpcharges: extras.filling,
      decorUpcharges: extras.frosting + extras.decor,
      totalPrice
    };
  });
  const tierSizes = summarySelections
    .map((selection) => selection.size)
    .filter((size) => Number.isFinite(Number(size)));
  const backupCakes = summarySelections
    .filter((selection) => selection.kind === "backup" || selection.kind === "extra-backup")
    .map((selection) => ({ ...selection }));
  const decorNotes = summarySelections
    .map((selection) => {
      const parts = [];
      const activeDecorations = normalizeDecorationList(selection);
      if (activeDecorations.length) parts.push(`decorations: ${activeDecorations.map(getDecorationLabel).join(", ")}`);
      if (activeDecorations.includes(SHELL_BORDER_DECOR)) {
        parts.push(`shell border: ${normalizeShellBorderEdges(selection).join(" + ")}`);
        parts.push(`shell border color: ${selection.shellBorderColor || DEFAULT_SHELL_FROSTING_COLOR}`);
      }
      if (activeDecorations.includes(SWIRL_DECOR) && selection.swirlCount) {
        parts.push(`swirls: ${selection.swirlCount}`);
        parts.push(`swirl color: ${selection.swirlColor || DEFAULT_SHELL_FROSTING_COLOR}`);
      }
      if (activeDecorations.includes(CHERRY_DECOR)) parts.push("cherries");
      if (activeDecorations.includes(SWAG_DECOR)) {
        parts.push(`swag color: ${selection.swagColor || DEFAULT_SHELL_FROSTING_COLOR}`);
      }
      if (activeDecorations.includes(SHELL_SWAG_DECOR)) {
        parts.push(`shell swag color: ${selection.shellSwagColor || DEFAULT_SHELL_FROSTING_COLOR}`);
      }
      if (selection.outerFrosting) parts.push(`outer frosting: ${getOuterFrostingLabel(selection.outerFrosting)}`);
      if (selection.outerFrostingColor) parts.push(`outer color: ${selection.outerFrostingColor}`);
      if (selection.outerFrosting === STRIPED_OUTER_FROSTING_DECOR && selection.outerFrostingStripeColor) {
        parts.push(`stripe color: ${selection.outerFrostingStripeColor}`);
      }
      if (selection.outerFrosting === OMBRE_OUTER_FROSTING_DECOR && selection.outerFrostingOmbreColor) {
        parts.push(`ombre color: ${selection.outerFrostingOmbreColor}`);
      }
      if (selection.edibleImage) {
        parts.push("edible image");
        if (selection.edibleImageFileName) parts.push(`image file: ${selection.edibleImageFileName}`);
        parts.push(`image radius: ${selection.edibleImageRadius || DEFAULT_EDIBLE_IMAGE_RADIUS}`);
        parts.push(`image scale: ${selection.edibleImageScale || DEFAULT_EDIBLE_IMAGE_SCALE}`);
        parts.push(`image rotation: ${selection.edibleImageRotation || DEFAULT_EDIBLE_IMAGE_ROTATION}`);
        parts.push(`image position: ${selection.edibleImageX || 0}, ${selection.edibleImageY || 0}`);
        if (selection.edibleImageNotes) parts.push(`image notes: ${selection.edibleImageNotes}`);
      }
      return parts.filter(Boolean).join(", ");
    })
    .filter(Boolean)
    .join(" | ");
  const orderNumber = `#WEB-${Date.now()}`;

  return {
    orderName: recommendation?.name || "Builder Order",
    orderNumber,
    customerName: submittedCustomerName,
    customerEmail: submittedCustomerEmail,
    customerPhone: submittedCustomerPhone,
    eventDate: requiredDate || "",
    eventDisplay: [promiseDate, promiseTime].filter(Boolean).join(" @ "),
    pickupDelivery: [fulfillmentLabel, promiseTime].filter(Boolean).join(", "),
    fulfillment: fulfillmentLabel,
    dateOrdered: orderedDate,
    takenBy: "Cakesupply",
    status: "inquiry",
    paymentStatus: "Unpaid",
    addressLine: fulfillmentMethod === "delivery" ? fulfillmentLocation : "",
    addressCity: fulfillmentMethod === "delivery" ? "City, State, Zip" : "",
    quantity: "1",
    cakeDetails: recommendation?.name || primarySelection.label || "",
    flavor: summarySelections.map((selection) => selection.flavor).filter(Boolean).join(", "),
    frosting: summarySelections.map((selection) => selection.frosting).filter(Boolean).join(", "),
    filling: summarySelections.map((selection) => selection.filling).filter(Boolean).join(", "),
    decor: summarySelections.flatMap((selection) => normalizeDecorationList(selection)).map(getDecorationLabel).filter(Boolean).join(", "),
    notes: decorNotes,
    guestCount: Number(guestCountInput?.value || 0),
    servings: recommendation?.servings || summarySelections.reduce((total, selection) => total + getSelectionServings(selection), 0),
    recommendation: recommendation ? { ...recommendation } : null,
    tierSizes,
    backupCakes,
    ...prices,
    price: prices.basePrice,
    lineTotal: prices.totalPrice,
    amountPaid: prices.depositPaid,
    total: prices.totalPrice,
    deliveryCharge: prices.deliveryFee,
    selections: summarySelections,
    orderItems,
    source: "customer-customizer",
    submittedAt: new Date().toISOString()
  };
}

function buildCurrentBuilderOrderSummary() {
  return buildOrderFromCustomizer();
}

async function submitOrderRequest(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const order = buildOrderFromCustomizer();
  const submitButton = document.getElementById("submit-order-request-btn");
  const message = document.getElementById("order-submit-message");
  const submitPanel = document.querySelector(".order-submit-panel");

  if (submitButton) submitButton.disabled = true;
  if (message) {
    message.textContent = "Submitting order request...";
    message.className = "order-submit-message";
  }

  try {
    const response = await fetch(ORDERS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    if (!response.ok) throw new Error("Unable to save order");

    const result = await response.json();
    renderOrderSubmissionSuccess(result, order, submitPanel);
    launchOrderConfetti();
  } catch (error) {
    console.error("Unable to submit order request", error);
    if (message) {
      message.textContent = "Unable to submit. Please make sure the backend is running.";
      message.className = "order-submit-message is-error";
    }
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function getSubmittedOrderNumber(result = {}, fallbackOrder = {}) {
  return result.orderNumber || result.orderId || fallbackOrder.orderNumber || fallbackOrder.orderId || "";
}

function formatSubmittedOrderNumber(orderNumber) {
  const label = String(orderNumber || "").trim();
  if (!label) return "#pending";
  return label.startsWith("#") ? label : `#${label}`;
}

function renderOrderSubmissionSuccess(result, fallbackOrder, submitPanel) {
  if (!submitPanel) return;

  const orderNumber = formatSubmittedOrderNumber(getSubmittedOrderNumber(result, fallbackOrder));
  submitPanel.classList.add("is-submitted");
  submitPanel.innerHTML = `
    <div class="order-success-state" role="status" aria-live="polite">
      <p class="order-success-title">Order Request Submitted</p>
      <p class="order-success-number">Order ${escapeSummaryHTML(orderNumber)}</p>
      <p class="order-success-note">We'll review your request and contact you shortly.</p>
      <button class="order-home-btn" id="order-back-home-btn" type="button">Back to Home</button>
    </div>
  `;

  submitPanel.querySelector("#order-back-home-btn")?.addEventListener("click", () => {
    returnToLandingPage();
  });
}

function launchOrderConfetti() {
  const existingConfetti = document.querySelector(".order-confetti");
  existingConfetti?.remove();

  const confetti = document.createElement("div");
  confetti.className = "order-confetti";
  confetti.setAttribute("aria-hidden", "true");

  const colors = ["#f6b7c1", "#f7d56f", "#7fb7e8", "#8bd3a7", "#f2a65a"];
  for (let index = 0; index < 34; index += 1) {
    const piece = document.createElement("span");
    piece.className = "order-confetti-piece";
    piece.style.setProperty("--x", `${8 + Math.random() * 84}vw`);
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 170}px`);
    piece.style.setProperty("--delay", `${Math.random() * 0.28}s`);
    piece.style.setProperty("--duration", `${0.9 + Math.random() * 0.55}s`);
    piece.style.setProperty("--spin", `${180 + Math.random() * 540}deg`);
    piece.style.background = colors[index % colors.length];
    confetti.appendChild(piece);
  }

  document.body.appendChild(confetti);
  window.setTimeout(() => {
    confetti.remove();
  }, 1800);
}

function persistCurrentBuilderOrderSummary() {
  try {
    localStorage.setItem(BUILDER_ORDER_SUMMARY_KEY, JSON.stringify(buildCurrentBuilderOrderSummary()));
  } catch (error) {
    console.warn("Unable to save builder order summary", error);
  }
}

window.CakeSupplyBuilder = {
  buildOrderFromCustomizer,
  getCurrentOrderSummary: buildCurrentBuilderOrderSummary,
  persistCurrentOrderSummary: persistCurrentBuilderOrderSummary,
  submitOrderRequest
};

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

function escapeSummaryHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getLocalDateValue(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function parseLocalDateValue(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }

  return date;
}

function getFulfillmentCalendarMonth(value = requiredDate) {
  const selectedDate = parseLocalDateValue(value);
  const baseDate = selectedDate || new Date();
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
}

function addCalendarMonths(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function formatFulfillmentCalendarMonth(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatFulfillmentTimeLabel(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(`2000-01-01T${value}`));
}

function renderFulfillmentTimeOptions() {
  const options = ['<option value="">Select time</option>'];
  const startMinutes = 10 * 60;
  const endMinutes = 17 * 60;

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 15) {
    const hours = Math.floor(minutes / 60);
    const minuteValue = minutes % 60;
    const value = `${String(hours).padStart(2, "0")}:${String(minuteValue).padStart(2, "0")}`;
    options.push(`<option value="${value}"${requiredTime === value ? " selected" : ""}>${formatFulfillmentTimeLabel(value)}</option>`);
  }

  return options.join("");
}

function renderFulfillmentDateCalendar() {
  const today = new Date();
  const todayValue = getLocalDateValue(today);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStart = fulfillmentCalendarMonth || getFulfillmentCalendarMonth();
  const selectedValue = requiredDate || "";
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const leadingBlankDays = monthStart.getDay();
  const canGoPrevious = monthStart.getTime() > currentMonthStart.getTime();
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const cells = [];

  for (let index = 0; index < leadingBlankDays; index += 1) {
    cells.push('<span class="fulfillment-calendar-empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const cellValue = getLocalDateValue(cellDate);
    const isPastDate = cellValue < todayValue;
    const isSelected = cellValue === selectedValue;
    const isToday = cellValue === todayValue;
    cells.push(`
      <button type="button" class="fulfillment-calendar-day${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}" data-date="${cellValue}" ${isPastDate ? "disabled" : ""} aria-pressed="${isSelected ? "true" : "false"}" aria-label="${new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(cellDate)}">
        ${day}
      </button>
    `);
  }

  return `
    <div class="fulfillment-calendar" aria-label="Calendar">
      <div class="fulfillment-calendar-head">
        <button type="button" class="fulfillment-calendar-nav" data-calendar-shift="-1" ${canGoPrevious ? "" : "disabled"} aria-label="Previous month">&lt;</button>
        <strong>${formatFulfillmentCalendarMonth(monthStart)}</strong>
        <button type="button" class="fulfillment-calendar-nav" data-calendar-shift="1" aria-label="Next month">&gt;</button>
      </div>
      <div class="fulfillment-calendar-weekdays" aria-hidden="true">
        ${weekdays.map((weekday) => `<span>${weekday}</span>`).join("")}
      </div>
      <div class="fulfillment-calendar-grid">
        ${cells.join("")}
      </div>
    </div>
  `;
}

function getDecorSummaryText(selection) {
  const details = [];
  const activeDecorations = normalizeDecorationList(selection);
  activeDecorations.forEach((decorType) => {
    details.push(getDecorationLabel(decorType));
  });
  if (activeDecorations.includes(SHELL_BORDER_DECOR)) {
    details.push(`Shell border: ${normalizeShellBorderEdges(selection).join(" + ")}`);
    details.push(`Shell border color: ${selection.shellBorderColor || DEFAULT_SHELL_FROSTING_COLOR}`);
  }
  if (activeDecorations.includes(SWIRL_DECOR) && selection.swirlCount) {
    details.push(`Swirls: ${normalizeSwirlCount(selection.swirlCount)}`);
    details.push(`Swirl color: ${selection.swirlColor || DEFAULT_SHELL_FROSTING_COLOR}`);
  }
  if (activeDecorations.includes(CHERRY_DECOR)) {
    details.push("Cherries");
  }
  if (activeDecorations.includes(SWAG_DECOR)) {
    details.push(`Swag color: ${selection.swagColor || DEFAULT_SHELL_FROSTING_COLOR}`);
  }
  if (activeDecorations.includes(SHELL_SWAG_DECOR)) {
    details.push(`Shell swag color: ${selection.shellSwagColor || DEFAULT_SHELL_FROSTING_COLOR}`);
  }
  if (selection.outerFrosting) {
    details.push(`Outer frosting: ${getOuterFrostingLabel(selection.outerFrosting)}`);
  }
  if (selection.outerFrosting && selection.outerFrostingColor) {
    details.push(`Color: ${selection.outerFrostingColor}`);
  }
  if (selection.outerFrosting === STRIPED_OUTER_FROSTING_DECOR && selection.outerFrostingStripeColor) {
    details.push(`Stripe color: ${selection.outerFrostingStripeColor}`);
  }
  if (selection.outerFrosting === OMBRE_OUTER_FROSTING_DECOR && selection.outerFrostingOmbreColor) {
    details.push(`Ombre color: ${selection.outerFrostingOmbreColor}`);
  }
  if (selection.edibleImage) {
    details.push("Edible image");
    if (selection.edibleImageFileName) {
      details.push(`File: ${selection.edibleImageFileName}`);
    }
    details.push(`Radius: ${selection.edibleImageRadius || DEFAULT_EDIBLE_IMAGE_RADIUS}`);
    details.push(`Scale: ${selection.edibleImageScale || DEFAULT_EDIBLE_IMAGE_SCALE}`);
    details.push(`Rotation: ${selection.edibleImageRotation || DEFAULT_EDIBLE_IMAGE_ROTATION}`);
    details.push(`Position: ${selection.edibleImageX || 0}, ${selection.edibleImageY || 0}`);
    if (selection.edibleImageNotes) {
      details.push(`Notes: ${selection.edibleImageNotes}`);
    }
  }
  return details.join(", ");
}

function renderFulfillmentPanel() {
  const panel = document.getElementById("fulfillment-panel-content");
  if (!panel) return;

  if (fulfillmentMethod !== "delivery") {
    fulfillmentMethod = "pickup";
  }

  const isContactStep = fulfillmentPanelStep === "contact";
  const isScheduleStep = !isContactStep;

  panel.innerHTML = `
    <div class="fulfillment-panel-shell${isScheduleStep ? " is-schedule-step" : isContactStep ? " is-contact-step" : " is-method-step"}">
      ${!isContactStep ? `
      <div class="fulfillment-options inline-fulfillment-options" role="radiogroup" aria-label="Pickup or delivery">
        <label class="fulfillment-option${fulfillmentMethod === "delivery" ? " is-selected" : ""}">
          <input type="radio" name="panel-fulfillment-method" value="delivery" ${fulfillmentMethod === "delivery" ? "checked" : ""}>
          <span class="fulfillment-radio" aria-hidden="true"></span>
          <span class="fulfillment-option-label">Delivery</span>
        </label>
        <label class="fulfillment-option${fulfillmentMethod === "pickup" ? " is-selected" : ""}">
          <input type="radio" name="panel-fulfillment-method" value="pickup" ${fulfillmentMethod === "pickup" ? "checked" : ""}>
          <span class="fulfillment-radio" aria-hidden="true"></span>
          <span class="fulfillment-option-label">Pickup</span>
        </label>
      </div>
      ` : ""}

      ${!isContactStep ? `
      <div class="fulfillment-date-field inline-delivery-location${fulfillmentMethod === "delivery" ? " is-visible" : ""}">
        <label class="fulfillment-date-label" for="panel-fulfillment-location">Delivery location</label>
        <input type="text" id="panel-fulfillment-location" class="fulfillment-date-input" value="${escapeSummaryHTML(fulfillmentLocation)}" placeholder="Enter address or location">
      </div>
      ` : ""}

      ${isScheduleStep ? `
      <div class="fulfillment-panel-grid">
        <div class="fulfillment-date-field fulfillment-calendar-field is-visible">
          <input type="date" id="panel-required-date" class="fulfillment-date-input fulfillment-date-native" value="${requiredDate}" min="${getLocalDateValue(new Date())}" tabindex="-1" aria-hidden="true">
          ${renderFulfillmentDateCalendar()}
        </div>
        <label class="fulfillment-date-field is-visible">
          <select id="panel-required-time" class="fulfillment-date-input fulfillment-time-select" aria-label="Time">
            ${renderFulfillmentTimeOptions()}
          </select>
        </label>
      </div>
      ` : ""}

      ${isContactStep ? `
      <div class="fulfillment-contact-grid">
        <label class="fulfillment-contact-field">
          <span class="fulfillment-date-label">Name</span>
          <input type="text" id="panel-customer-name" class="fulfillment-date-input" value="${escapeSummaryHTML(customerName)}" placeholder="Your name" autocomplete="name" required>
        </label>
        <label class="fulfillment-contact-field">
          <span class="fulfillment-date-label">Email</span>
          <input type="email" id="panel-customer-email" class="fulfillment-date-input" value="${escapeSummaryHTML(customerEmail)}" placeholder="you@example.com" autocomplete="email" required>
        </label>
        <label class="fulfillment-contact-field">
          <span class="fulfillment-date-label">Phone</span>
          <input type="tel" id="panel-customer-phone" class="fulfillment-date-input" value="${escapeSummaryHTML(customerPhone)}" placeholder="(555) 555-5555" autocomplete="tel" required>
        </label>
      </div>
      ` : ""}

      <div class="fulfillment-actions inline-fulfillment-actions">
        <button type="button" class="fulfillment-primary-btn" id="${isContactStep ? "fulfillment-review-order" : "fulfillment-contact-step"}">${isContactStep ? "Review Order" : "Contact Info"}</button>
      </div>
    </div>
  `;

  const optionButtons = panel.querySelectorAll(".fulfillment-option");
  const optionInputs = panel.querySelectorAll('input[name="panel-fulfillment-method"]');
  const locationField = panel.querySelector(".inline-delivery-location");
  const locationInput = panel.querySelector("#panel-fulfillment-location");
  const dateInput = panel.querySelector("#panel-required-date");
  const timeInput = panel.querySelector("#panel-required-time");
  const calendar = panel.querySelector(".fulfillment-calendar");
  const customerNameInput = panel.querySelector("#panel-customer-name");
  const customerEmailInput = panel.querySelector("#panel-customer-email");
  const customerPhoneInput = panel.querySelector("#panel-customer-phone");

  const syncSelection = () => {
    optionButtons.forEach((button) => {
      const input = button.querySelector('input[name="panel-fulfillment-method"]');
      const isSelected = input?.value === fulfillmentMethod;
      button.classList.toggle("is-selected", Boolean(isSelected));
      if (input) input.checked = Boolean(isSelected);
    });
    locationField?.classList.toggle("is-visible", fulfillmentMethod === "delivery");
  };

  optionInputs.forEach((input) => {
    input.addEventListener("change", () => {
      fulfillmentMethod = input.value === "delivery" ? "delivery" : "pickup";
      syncSelection();
      persistCustomizerState("fulfillment");
    });
  });

  locationInput?.addEventListener("input", () => {
    fulfillmentLocation = locationInput.value || "";
    persistCustomizerState("fulfillment");
  });

  dateInput?.addEventListener("change", () => {
    requiredDate = dateInput.value || "";
    fulfillmentCalendarMonth = getFulfillmentCalendarMonth(requiredDate);
    persistCustomizerState("fulfillment");
  });

  calendar?.querySelectorAll(".fulfillment-calendar-nav").forEach((button) => {
    button.addEventListener("click", () => {
      fulfillmentCalendarMonth = addCalendarMonths(fulfillmentCalendarMonth || getFulfillmentCalendarMonth(), Number(button.dataset.calendarShift) || 0);
      renderFulfillmentPanel();
    });
  });

  calendar?.querySelectorAll(".fulfillment-calendar-day").forEach((button) => {
    button.addEventListener("click", () => {
      requiredDate = button.dataset.date || "";
      if (dateInput) dateInput.value = requiredDate;
      fulfillmentCalendarMonth = getFulfillmentCalendarMonth(requiredDate);
      persistCustomizerState("fulfillment");
      renderFulfillmentPanel();
    });
  });

  timeInput?.addEventListener("change", () => {
    requiredTime = timeInput.value || "";
    persistCustomizerState("fulfillment");
  });

  customerNameInput?.addEventListener("input", () => {
    customerName = customerNameInput.value || "";
    persistCustomizerState("fulfillment");
  });

  customerEmailInput?.addEventListener("input", () => {
    customerEmail = customerEmailInput.value || "";
    persistCustomizerState("fulfillment");
  });

  customerPhoneInput?.addEventListener("input", () => {
    customerPhone = customerPhoneInput.value || "";
    persistCustomizerState("fulfillment");
  });

  panel.querySelector("#fulfillment-contact-step")?.addEventListener("click", () => {
    if (fulfillmentMethod === "delivery" && !locationInput?.value.trim()) {
      locationInput?.focus();
      return;
    }
    if (!requiredDate) {
      const focusTarget = calendar?.querySelector(".fulfillment-calendar-day:not(:disabled)");
      focusTarget?.focus();
      return;
    }
    if (!timeInput?.value) {
      timeInput?.focus();
      timeInput?.showPicker?.();
      return;
    }

    fulfillmentLocation = locationInput?.value || "";
    requiredDate = requiredDate || dateInput?.value || "";
    requiredTime = timeInput.value || "";
    persistCustomizerState("fulfillment");
    fulfillmentPanelStep = "contact";
    renderFulfillmentPanel();
  });

  panel.querySelector("#fulfillment-review-order")?.addEventListener("click", () => {
    if (!customerNameInput?.value.trim()) {
      customerNameInput?.focus();
      return;
    }
    if (!customerEmailInput?.value.trim() || !customerEmailInput.checkValidity()) {
      customerEmailInput?.focus();
      return;
    }
    if (!customerPhoneInput?.value.trim()) {
      customerPhoneInput?.focus();
      return;
    }

    customerName = customerNameInput.value || "";
    customerEmail = customerEmailInput.value || "";
    customerPhone = customerPhoneInput.value || "";
    persistCustomizerState("fulfillment");
    renderOrderSummaryPage();
  });
}

async function initCustomerSummaryPreview() {
  const preview = document.getElementById("cake-builder-3d");
  if (!preview) return;

  customizerTierSelect = (index) => selectFinishedOrderPart(index);
  activeCustomizerTierIndex = null;
  visibleBackupTierIndex = null;
  customizerPreviewSelections = selections;

  await initCakeBuilder3D(recommendation, getCurrentBuilderParts(), { showCameraGizmo: false });

  for (let index = 0; index < selections.length; index += 1) {
    if (selections[index]?.kind === "extra-backup") {
      await addExtraBackupCakeObject(selections[index], index);
    }
  }

  await Promise.all(selections.map((_, index) => syncOuterFrostingForIndex(index)));
  await Promise.all(selections.map((_, index) => syncCupcakeFrostingForIndex(index)));
  await Promise.all(selections.map((_, index) => syncDecorForIndex(index)));
  showFinishedOrderModel();
}

function renderOrderSummaryPage() {
  currentCustomizerView = "summary";
  persistCustomizerState("summary");

  if (customizerKeyHandler) {
    document.removeEventListener("keydown", customizerKeyHandler);
    customizerKeyHandler = null;
  }

  const summarySelections = selections.map((selection) => ({ ...selection }));
  const existingPreview = document.getElementById("cake-builder-3d");
  persistCurrentBuilderOrderSummary();
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
  const structuredPrices = getStructuredPriceFields(summarySelections);
  const subtotal = structuredPrices.totalPrice;
  const taxRate = 0.0725;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const fulfillmentLabel = fulfillmentMethod === "delivery" ? "Delivery" : "Pickup";
  const fulfillmentLocationText = fulfillmentMethod === "delivery" && fulfillmentLocation ? fulfillmentLocation : "";
  const customerContactLines = [
    customerName.trim(),
    customerEmail.trim(),
    customerPhone.trim()
  ].filter(Boolean);
  const requestDetails = [
    `${fulfillmentLabel}${promiseTime ? ` at ${promiseTime}` : ""}`,
    promiseDate
  ].filter(Boolean).join(" - ");

  customizer.innerHTML = `
    <div class="summary-page customer-review-page">
      <div class="customer-review-topbar">
        <button class="back-btn summary-back-trigger" type="button">&larr; Back</button>
      </div>

      <div class="customer-review-layout">
        <div class="customer-review-preview" aria-label="3D cake preview">
          <div id="cake-builder-3d"></div>
        </div>

        <div class="customer-review-info">
          <p class="customer-review-kicker">Order request</p>
          <h2>${escapeSummaryHTML(recommendation?.name || "Custom cake")}</h2>
          <p class="customer-review-request">${escapeSummaryHTML(requestDetails)}</p>
          ${fulfillmentLocationText ? `<p class="customer-review-location">${escapeSummaryHTML(fulfillmentLocationText)}</p>` : ""}
          ${customerContactLines.length ? `<p class="customer-review-contact">${escapeSummaryHTML(customerContactLines.join(" | "))}</p>` : ""}

          <div class="customer-review-meta">
            <div><span>Servings</span><strong>${escapeSummaryHTML(recommendation?.servings || summarySelections.reduce((totalServings, selection) => totalServings + getSelectionServings(selection), 0))}</strong></div>
            <div><span>Status</span><strong>Inquiry</strong></div>
            <div><span>Payment</span><strong>Unpaid</strong></div>
          </div>

          <div class="customer-review-section">
            <h3>Cake details</h3>
            <div class="customer-review-items">
              ${summarySelections.map((selection) => {
                const basePrice = getSelectionBasePrice(selection);
                const extras = getSelectionExtras(selection);
                const rowTotal = basePrice + extras.flavor + extras.frosting + extras.filling + extras.decor;
                const decorText = getDecorSummaryText(selection);

                return `
                  <div class="customer-review-item">
                    <div class="customer-review-item-head">
                      <span>${escapeSummaryHTML(selection.label || "Cake")}</span>
                      <strong>$${formatMoney(rowTotal)}</strong>
                    </div>
                    ${selection.signature ? `<p>Signature: ${escapeSummaryHTML(getSelectionDisplayName(selection))}</p>` : ""}
                    ${selection.flavor ? `<p>Flavor: ${escapeSummaryHTML(selection.flavor)}</p>` : ""}
                    ${selection.frosting ? `<p>Frosting: ${escapeSummaryHTML(selection.frosting)}</p>` : ""}
                    ${selection.filling ? `<p>Filling: ${escapeSummaryHTML(selection.filling)}</p>` : ""}
                    ${decorText ? `<p>Decor: ${escapeSummaryHTML(decorText)}</p>` : ""}
                    <p>Base: $${formatMoney(basePrice)}</p>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="customer-review-section customer-review-pricing">
            <h3>Price</h3>
            <div><span>Subtotal</span><strong>$${formatMoney(subtotal)}</strong></div>
            <div><span>Tax</span><strong>$${formatMoney(tax)}</strong></div>
            <div><span>Estimated total</span><strong>$${formatMoney(total)}</strong></div>
            <div><span>Deposit paid</span><strong>$0.00</strong></div>
            <div><span>Balance due</span><strong>$${formatMoney(total)}</strong></div>
          </div>

          <div class="order-submit-panel">
            <button class="order-submit-btn" id="submit-order-request-btn" type="button">Submit Order Request</button>
            <div class="order-submit-message" id="order-submit-message" role="status" aria-live="polite"></div>
          </div>
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

  customizer.querySelector("#submit-order-request-btn")?.addEventListener("click", submitOrderRequest);
  const nextPreview = customizer.querySelector(".customer-review-preview #cake-builder-3d");
  if (existingPreview && nextPreview && renderer && camera && scene) {
    existingPreview.querySelector(".camera-view-gizmo")?.remove();
    cameraViewGizmo = null;
    cameraViewButtons = [];
    nextPreview.replaceWith(existingPreview);
    requestAnimationFrame(() => {
      resizeCustomizerRenderer();
      showFinishedOrderModel({ snap: true });
      syncFinishedOrderHitTargets();
    });
  } else {
    void initCustomerSummaryPreview();
  }
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
  return Boolean(selection?.size && OUTER_FROSTING_MESH_FINISHES.includes(selection.outerFrosting));
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

function scrollTierRowIntoView(index, block = "center") {
  if (index === null) return;

  const row = getTierRow(index);
  if (!row) return;
  const scroller = orderSections;
  if (!scroller) return;

  const scrollerRect = scroller.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();
  const rowTop = rowRect.top - scrollerRect.top + scroller.scrollTop;
  const centeredTop = rowTop - (scroller.clientHeight - row.offsetHeight) / 2;
  const nearestTop = rowRect.top < scrollerRect.top
    ? rowTop
    : rowTop - scroller.clientHeight + row.offsetHeight;
  const nextTop = block === "nearest" && rowRect.top >= scrollerRect.top && rowRect.bottom <= scrollerRect.bottom
    ? scroller.scrollTop
    : block === "nearest"
      ? nearestTop
      : centeredTop;

  scroller.scrollTo({
    top: Math.max(0, nextTop),
    behavior: "smooth"
  });
}

function setAccordionSection(sectionName = "flavor") {
  const flavorPanel = document.getElementById("flavor-panel");
  const decorPanel = document.getElementById("decor-panel");
  if (!flavorPanel && !decorPanel) return;

  const activeSection = sectionName || null;

  [flavorPanel, decorPanel].filter(Boolean).forEach((panel) => {
    panel.querySelectorAll(".accordion-section").forEach((section) => {
      const isExpanded = section.dataset.accordionSection === activeSection;
      section.classList.toggle("expanded", isExpanded);
      section.querySelector(".accordion-header")?.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    });

    panel.dataset.activeAccordion = activeSection || "";
  });
}

function getDecorTargetIndex() {
  if (activeTierIndex !== null) return activeTierIndex;
  return selections.length ? 0 : null;
}

function closeDecorColorPopups(except = null) {
  [
    { menu: outerFrostingColorMenu, button: outerFrostingColorPreview, key: "outer" },
    { menu: outerFrostingStripeColorMenu, button: outerFrostingStripeColorPreview, key: "stripe" },
    { menu: shellBorderColorMenu, button: shellBorderColorPreview, key: SHELL_BORDER_DECOR },
    { menu: swirlsColorMenu, button: swirlsColorPreview, key: SWIRL_DECOR },
    { menu: swagsColorMenu, button: swagsColorPreview, key: SWAG_DECOR },
    { menu: shellSwagColorMenu, button: shellSwagColorPreview, key: SHELL_SWAG_DECOR }
  ].forEach(({ menu, button, key }) => {
    const shouldStayOpen = except === key;
    if (menu) menu.hidden = !shouldStayOpen;
    if (button) {
      button.classList.toggle("is-open", shouldStayOpen);
      button.setAttribute("aria-expanded", shouldStayOpen ? "true" : "false");
    }
  });
}

function toggleDecorColorPopup(key) {
  const menu = key === "stripe"
    ? outerFrostingStripeColorMenu
    : key === SHELL_BORDER_DECOR
      ? shellBorderColorMenu
      : key === SWIRL_DECOR
        ? swirlsColorMenu
        : key === SWAG_DECOR
          ? swagsColorMenu
          : key === SHELL_SWAG_DECOR
            ? shellSwagColorMenu
            : outerFrostingColorMenu;
  closeDecorColorPopups(menu?.hidden ? key : null);
}

function applyOuterFrostingColorSelection(targetIndex, colorValue) {
  if (targetIndex === null || !selections[targetIndex]?.size) return;

  if (!isOuterFrostingFinish(selections[targetIndex].outerFrosting)) {
    selections[targetIndex].outerFrosting = OUTER_FROSTING_DECOR;
  }
  selections[targetIndex].outerFrostingColor = colorValue || DEFAULT_OUTER_FROSTING_COLOR;

  syncDecorButtons(targetIndex);
  void syncOuterFrostingForIndex(targetIndex);
  void syncDecorForIndex(targetIndex);
  syncPeekToggleForIndex(targetIndex);
  persistCustomizerState();
}

function applySecondaryFinishColorSelection(targetIndex, colorValue) {
  if (targetIndex === null || !selections[targetIndex]?.size) return;

  const selection = selections[targetIndex];
  const isOmbre = selection.outerFrosting === OMBRE_OUTER_FROSTING_DECOR;
  if (isOmbre) {
    selection.outerFrostingOmbreColor = colorValue || DEFAULT_OMBRE_FROSTING_COLOR;
  } else {
    selection.outerFrosting = STRIPED_OUTER_FROSTING_DECOR;
    selection.outerFrostingStripeColor = colorValue || DEFAULT_STRIPE_FROSTING_COLOR;
  }
  if (!selection.outerFrostingColor) {
    selection.outerFrostingColor = DEFAULT_OUTER_FROSTING_COLOR;
  }

  syncDecorButtons(targetIndex);
  void syncOuterFrostingForIndex(targetIndex);
  void syncDecorForIndex(targetIndex);
  syncPeekToggleForIndex(targetIndex);
  persistCustomizerState();
}

function getDecorationColor(selection, decorType) {
  if (decorType === SHELL_BORDER_DECOR) {
    return selection?.shellBorderColor || DEFAULT_SHELL_FROSTING_COLOR;
  }
  if (decorType === SWIRL_DECOR) {
    return selection?.swirlColor || DEFAULT_SHELL_FROSTING_COLOR;
  }
  if (decorType === SHELL_SWAG_DECOR) {
    return selection?.shellSwagColor || DEFAULT_SHELL_FROSTING_COLOR;
  }
  if (decorType === SWAG_DECOR) {
    return selection?.swagColor || DEFAULT_SHELL_FROSTING_COLOR;
  }
  return DEFAULT_SHELL_FROSTING_COLOR;
}

function applyDecorationColorSelection(targetIndex, decorType, colorValue) {
  if (targetIndex === null || !selections[targetIndex]?.size) return;

  if (decorType === SHELL_SWAG_DECOR) {
    selections[targetIndex].shellSwagColor = colorValue || DEFAULT_SHELL_FROSTING_COLOR;
  } else if (decorType === SWAG_DECOR) {
    selections[targetIndex].swagColor = colorValue || DEFAULT_SHELL_FROSTING_COLOR;
  } else if (decorType === SHELL_BORDER_DECOR) {
    selections[targetIndex].shellBorderColor = colorValue || DEFAULT_SHELL_FROSTING_COLOR;
  } else if (decorType === SWIRL_DECOR) {
    selections[targetIndex].swirlColor = colorValue || DEFAULT_SHELL_FROSTING_COLOR;
  } else {
    return;
  }

  syncDecorButtons(targetIndex);
  void syncDecorForIndex(targetIndex);
  syncPeekToggleForIndex(targetIndex);
  persistCustomizerState();
}

function syncEdibleImageControls(index) {
  const edibleIndex = getEdibleImageSelectionIndex();
  const selection = edibleIndex !== null ? selections[edibleIndex] : null;
  const isEnabled = Boolean(selection?.size);
  const hasImageFile = Boolean(selection?.edibleImage && selection.edibleImageDataUrl);

  if (edibleImageFileInput) {
    edibleImageFileInput.disabled = !isEnabled;
  }
  if (edibleImageClearButton) {
    edibleImageClearButton.hidden = !hasImageFile;
    edibleImageClearButton.disabled = !hasImageFile;
  }
  if (edibleImageFileNameLabel) {
    edibleImageFileNameLabel.hidden = !hasImageFile;
    edibleImageFileNameLabel.textContent = hasImageFile ? selection.edibleImageFileName || "Uploaded image" : "";
  }
  if (edibleImageNotesInput) {
    edibleImageNotesInput.value = selection?.edibleImageNotes || "";
    edibleImageNotesInput.disabled = !isEnabled;
  }
  if (edibleImageTransformControls) {
    edibleImageTransformControls.hidden = !(isEnabled && hasImageFile);
  }
  if (edibleImageRadiusInput) {
    edibleImageRadiusInput.value = String(selection?.edibleImageRadius || DEFAULT_EDIBLE_IMAGE_RADIUS);
    edibleImageRadiusInput.disabled = !isEnabled || !hasImageFile;
  }
  if (edibleImageScaleInput) {
    edibleImageScaleInput.value = String(selection?.edibleImageScale || DEFAULT_EDIBLE_IMAGE_SCALE);
    edibleImageScaleInput.disabled = !isEnabled || !hasImageFile;
  }
  if (edibleImageRotationInput) {
    edibleImageRotationInput.value = String(selection?.edibleImageRotation || DEFAULT_EDIBLE_IMAGE_ROTATION);
    edibleImageRotationInput.disabled = !isEnabled || !hasImageFile;
  }
  if (edibleImageRadiusResetButton) {
    edibleImageRadiusResetButton.disabled = !isEnabled || !hasImageFile;
  }
  if (edibleImageScaleResetButton) {
    edibleImageScaleResetButton.disabled = !isEnabled || !hasImageFile;
  }
  if (edibleImageRotationResetButton) {
    edibleImageRotationResetButton.disabled = !isEnabled || !hasImageFile;
  }
}

function syncDecorButtons(index) {
  const selection = index !== null ? selections[index] : null;
  const activeDecorations = normalizeDecorationList(selection || {});

  decorOptionButtons.forEach((button) => {
    const isSelected = activeDecorations.includes(button.dataset.decor);
    button.classList.toggle("is-selected", !!isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.disabled = !selection?.size;
  });

  if (outerFrostingSelect) {
    outerFrostingSelect.value = selection?.outerFrosting || "";
    outerFrostingSelect.disabled = !selection?.size;
  }

  const color = selection?.outerFrostingColor || DEFAULT_OUTER_FROSTING_COLOR;
  if (outerFrostingColorPreview) {
    outerFrostingColorPreview.style.setProperty("--preview-color", color);
    outerFrostingColorPreview.disabled = !selection?.size;
  }
  if (outerFrostingColorInput) {
    outerFrostingColorInput.value = color;
    outerFrostingColorInput.disabled = !selection?.size;
  }

  const isStripedOuterFrosting = selection?.outerFrosting === STRIPED_OUTER_FROSTING_DECOR;
  const isOmbreOuterFrosting = selection?.outerFrosting === OMBRE_OUTER_FROSTING_DECOR;
  const hasSecondaryFinishColor = isStripedOuterFrosting || isOmbreOuterFrosting;
  const secondaryFinishColor = isOmbreOuterFrosting
    ? selection?.outerFrostingOmbreColor || DEFAULT_OMBRE_FROSTING_COLOR
    : selection?.outerFrostingStripeColor || DEFAULT_STRIPE_FROSTING_COLOR;
  if (stripeColorField) {
    stripeColorField.hidden = !hasSecondaryFinishColor;
  }
  if (secondaryFinishColorLabel) {
    secondaryFinishColorLabel.textContent = isOmbreOuterFrosting ? "Ombre Color" : "Stripe Color";
  }
  if (outerFrostingStripeColorPreview) {
    outerFrostingStripeColorPreview.style.setProperty("--preview-color", secondaryFinishColor);
    outerFrostingStripeColorPreview.disabled = !selection?.size || !hasSecondaryFinishColor;
    outerFrostingStripeColorPreview.setAttribute("aria-label", isOmbreOuterFrosting ? "Ombre color" : "Stripe color");
  }
  if (outerFrostingStripeColorInput) {
    outerFrostingStripeColorInput.value = secondaryFinishColor;
    outerFrostingStripeColorInput.disabled = !selection?.size || !hasSecondaryFinishColor;
    outerFrostingStripeColorInput.setAttribute("aria-label", isOmbreOuterFrosting ? "Custom ombre color" : "Custom stripe color");
  }
  if (!hasSecondaryFinishColor && outerFrostingStripeColorMenu && !outerFrostingStripeColorMenu.hidden) {
    closeDecorColorPopups();
  }

  decorColorSwatches.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.decorColor?.toLowerCase() === color.toLowerCase());
    button.disabled = !selection?.size;
  });

  stripeColorSwatches.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.stripeColor?.toLowerCase() === secondaryFinishColor.toLowerCase());
    button.disabled = !selection?.size || !hasSecondaryFinishColor;
  });

  const isShellBorderSelected = activeDecorations.includes(SHELL_BORDER_DECOR);
  if (shellBorderPlacementGroup) {
    shellBorderPlacementGroup.hidden = !isShellBorderSelected;
  }
  const shellBorderColor = getDecorationColor(selection, SHELL_BORDER_DECOR);
  if (shellBorderColorPreview) {
    shellBorderColorPreview.hidden = !isShellBorderSelected;
    shellBorderColorPreview.disabled = !selection?.size || !isShellBorderSelected;
    shellBorderColorPreview.style.setProperty("--preview-color", shellBorderColor);
  }
  if (shellBorderColorInput) {
    shellBorderColorInput.value = shellBorderColor;
    shellBorderColorInput.disabled = !selection?.size || !isShellBorderSelected;
  }

  const shellEdges = normalizeShellBorderEdges(selection || {});
  shellBorderEdgeButtons.forEach((button) => {
    const isSelected = shellEdges.includes(button.dataset.shellEdge);
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.disabled = !selection?.size || !isShellBorderSelected;
  });

  const isSwagsSelected = activeDecorations.includes(SWAG_DECOR);
  const isShellSwagSelected = activeDecorations.includes(SHELL_SWAG_DECOR);
  const swagColor = getDecorationColor(selection, SWAG_DECOR);
  const shellSwagColor = getDecorationColor(selection, SHELL_SWAG_DECOR);
  if (swagsColorPreview) {
    swagsColorPreview.hidden = !isSwagsSelected;
    swagsColorPreview.disabled = !selection?.size || !isSwagsSelected;
    swagsColorPreview.style.setProperty("--preview-color", swagColor);
  }
  if (shellSwagColorPreview) {
    shellSwagColorPreview.hidden = !isShellSwagSelected;
    shellSwagColorPreview.disabled = !selection?.size || !isShellSwagSelected;
    shellSwagColorPreview.style.setProperty("--preview-color", shellSwagColor);
  }
  if (swagsColorInput) {
    swagsColorInput.value = swagColor;
    swagsColorInput.disabled = !selection?.size || !isSwagsSelected;
  }
  if (shellSwagColorInput) {
    shellSwagColorInput.value = shellSwagColor;
    shellSwagColorInput.disabled = !selection?.size || !isShellSwagSelected;
  }
  decorationColorSwatches.forEach((button) => {
    const decorType = button.dataset.decorationColorTarget;
    const targetColor = getDecorationColor(selection, decorType);
    const isSelectedDecor = activeDecorations.includes(decorType);
    button.classList.toggle("is-selected", button.dataset.decorationColor?.toLowerCase() === targetColor.toLowerCase());
    button.disabled = !selection?.size || !isSelectedDecor;
  });
  if (!isSwagsSelected && swagsColorMenu && !swagsColorMenu.hidden) {
    closeDecorColorPopups();
  }
  if (!isShellSwagSelected && shellSwagColorMenu && !shellSwagColorMenu.hidden) {
    closeDecorColorPopups();
  }
  if (!isShellBorderSelected && shellBorderColorMenu && !shellBorderColorMenu.hidden) {
    closeDecorColorPopups();
  }

  const isSwirlsSelected = activeDecorations.includes(SWIRL_DECOR);
  const swirlColor = getDecorationColor(selection, SWIRL_DECOR);
  if (swirlsColorPreview) {
    swirlsColorPreview.hidden = !isSwirlsSelected;
    swirlsColorPreview.disabled = !selection?.size || !isSwirlsSelected;
    swirlsColorPreview.style.setProperty("--preview-color", swirlColor);
  }
  if (swirlsColorInput) {
    swirlsColorInput.value = swirlColor;
    swirlsColorInput.disabled = !selection?.size || !isSwirlsSelected;
  }
  if (!isSwirlsSelected && swirlsColorMenu && !swirlsColorMenu.hidden) {
    closeDecorColorPopups();
  }
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

  syncEdibleImageControls(index);
}

syncTierRowStates = function () {
  orderSections.querySelectorAll(".tier-summary").forEach((row) => {
    row.classList.remove("active-tier-row", "visible-tier-row");
  });

  if (activeTierIndex !== null) {
    getTierRow(activeTierIndex)?.classList.add("active-tier-row");
  }
};

function getFinishedOrderGroupKeyForPart(partIndex) {
  const selection = partIndex !== null ? customizerPreviewSelections[partIndex] : null;
  if (!selection || selection.kind === "main") return "main";
  return `part-${partIndex}`;
}

function getFinishedOrderCarouselGroups() {
  const groups = [];
  const mainEntries = cakeObjects.filter((entry) => entry.kind === "main");

  if (mainEntries.length) {
    groups.push({
      key: "main",
      entries: mainEntries,
      partIndex: mainEntries[0].partIndex
    });
  }

  customizerPreviewSelections.forEach((selection, index) => {
    if (!selection || selection.kind === "main") return;

    const entries = cakeObjects.filter((entry) => entry.partIndex === index);
    if (!entries.length) return;

    groups.push({
      key: `part-${index}`,
      entries,
      partIndex: index
    });
  });

  return groups;
}

function getFinishedOrderSelectedGroupIndex(groups) {
  const selectedKey = finishedOrderSelectedGroupKey || getFinishedOrderGroupKeyForPart(activeCustomizerTierIndex);
  const selectedIndex = groups.findIndex((group) => group.key === selectedKey);
  return selectedIndex === -1 ? 0 : selectedIndex;
}

function applyFinishedOrderCarouselLayout({ snap = false } = {}) {
  const groups = getFinishedOrderCarouselGroups();
  if (!groups.length) return;

  const selectedGroupIndex = getFinishedOrderSelectedGroupIndex(groups);
  const radiusX = groups.length > 2 ? 0.58 : 0.42;
  const radiusZ = groups.length > 2 ? 0.34 : 0.28;

  groups.forEach((group, groupIndex) => {
    const wrappedOffset = ((groupIndex - selectedGroupIndex + groups.length / 2) % groups.length) - groups.length / 2;
    const angle = groups.length === 1 ? 0 : (wrappedOffset / Math.max(groups.length, 3)) * Math.PI * 2;
    const x = Math.sin(angle) * radiusX;
    const z = Math.cos(angle) * radiusZ - 0.04;
    const isSelected = groupIndex === selectedGroupIndex;

    group.entries.forEach((entry) => {
      entry.object.visible = true;
      entry.targetX = x;
      entry.targetZ = z;

      if (snap) {
        entry.currentX = x;
        entry.currentZ = z;
        entry.object.position.x = x;
        entry.object.position.z = z;
      }

      if (entry.outerFrostingObject) {
        entry.outerFrostingObject.visible = !entry.peeking;
        positionOuterFrostingForEntry(entry);
      }

      entry.object.traverse((child) => {
        if (!child.isMesh || !child.material || !("emissive" in child.material)) return;
        child.material.emissive.setHex(isSelected ? 0xf3e1bb : 0x000000);
        child.material.emissiveIntensity = isSelected ? 0.08 : 0;
      });
    });
  });

  syncFinishedOrderHitTargets();
}

function selectFinishedOrderPart(partIndex, { snap = false, scroll = true, persistView = true } = {}) {
  const groups = getFinishedOrderCarouselGroups();
  if (!groups.length) return;

  const nextGroupKey = getFinishedOrderGroupKeyForPart(partIndex);
  const nextGroup = groups.find((group) => group.key === nextGroupKey) || groups[0];
  finishedOrderSelectedGroupKey = nextGroup.key;
  activeTierIndex = partIndex ?? nextGroup.partIndex ?? null;
  activeCustomizerTierIndex = activeTierIndex;
  visibleBackupTierIndex = null;

  setFocusObject(null);
  applyFinishedOrderCarouselLayout({ snap });
  syncTierRowStates();
  syncPeekToggles();
  if (scroll) scrollTierRowIntoView(activeTierIndex);
  if (persistView) {
    persistCustomizerState(document.querySelector(".customer-review-page") ? "summary" : "fulfillment");
  }
}

function showFinishedOrderModel({ snap = false, selectedPartIndex = activeTierIndex } = {}) {
  visibleBackupTierIndex = null;
  setFocusObject(null);

  const hasMainCake = cakeObjects.some((entry) => entry.kind === "main");
  const fallbackPartIndex = hasMainCake
    ? cakeObjects.find((entry) => entry.kind === "main")?.partIndex ?? activeTierIndex
    : activeTierIndex ?? cakeObjects[0]?.partIndex ?? null;
  const nextSelectedPartIndex = selectedPartIndex ?? fallbackPartIndex;

  selectFinishedOrderPart(nextSelectedPartIndex, { snap, scroll: false, persistView: false });

  frameFinishedOrderModel();
  syncTierRowStates();
}

function ensureFinishedOrderHitTargetLayer() {
  const container = document.getElementById("cake-builder-3d");
  if (!container) return null;

  if (!finishedOrderHitTargetLayer || finishedOrderHitTargetLayer.parentElement !== container) {
    finishedOrderHitTargetLayer?.remove();
    finishedOrderHitTargetLayer = document.createElement("div");
    finishedOrderHitTargetLayer.className = "finished-order-hit-layer";
    container.appendChild(finishedOrderHitTargetLayer);
  }

  return finishedOrderHitTargetLayer;
}

function syncFinishedOrderHitTargets() {
  if (!camera || !renderer) return;

  const isFinishedOrderView = document.getElementById("customizer-layout")?.classList.contains("is-fulfillment-step")
    || document.querySelector(".customer-review-page");
  if (!isFinishedOrderView) {
    finishedOrderHitTargetLayer?.remove();
    finishedOrderHitTargetLayer = null;
    return;
  }

  const layer = ensureFinishedOrderHitTargetLayer();
  const groups = getFinishedOrderCarouselGroups();
  if (!layer || !groups.length) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const liveKeys = new Set();

  groups.forEach((group) => {
    const box = new THREE.Box3();
    group.entries.forEach((entry) => {
      if (entry.object.visible) box.expandByObject(entry.object);
      if (entry.outerFrostingObject?.visible) box.expandByObject(entry.outerFrostingObject);
    });
    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    center.project(camera);

    const x = rect.left - layerRect.left + ((center.x + 1) / 2) * rect.width;
    const y = rect.top - layerRect.top + ((1 - center.y) / 2) * rect.height;
    const hitSize = Math.max(96, Math.min(190, Math.max(size.x, size.y, size.z) * 230));
    const key = group.key;
    liveKeys.add(key);

    let target = layer.querySelector(`[data-finished-order-target="${CSS.escape(key)}"]`);
    if (!target) {
      target = document.createElement("button");
      target.type = "button";
      target.className = "finished-order-hit-target";
      target.dataset.finishedOrderTarget = key;
      target.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectFinishedOrderPart(group.partIndex);
      });
      layer.appendChild(target);
    }

    target.setAttribute("aria-label", `Select ${customizerPreviewSelections[group.partIndex]?.label || "main cake"}`);
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    target.style.width = `${hitSize}px`;
    target.style.height = `${hitSize}px`;
  });

  layer.querySelectorAll(".finished-order-hit-target").forEach((target) => {
    if (!liveKeys.has(target.dataset.finishedOrderTarget)) {
      target.remove();
    }
  });
}

function expandFinishedOrderTargetBox(box, entry) {
  if (!entry?.object?.visible) return;

  const entryBox = new THREE.Box3().setFromObject(entry.object);
  if (entryBox.isEmpty()) return;

  const targetOffset = new THREE.Vector3(
    (entry.targetX ?? entry.object.position.x) - entry.object.position.x,
    0,
    (entry.targetZ ?? entry.object.position.z) - entry.object.position.z
  );
  entryBox.translate(targetOffset);
  box.union(entryBox);

  if (entry.outerFrostingObject?.visible) {
    const outerBox = new THREE.Box3().setFromObject(entry.outerFrostingObject);
    if (!outerBox.isEmpty()) {
      outerBox.translate(targetOffset);
      box.union(outerBox);
    }
  }
}

function frameFinishedOrderModel() {
  if (!camera || !cakeObjects.length) return;

  const groups = getFinishedOrderCarouselGroups();
  const selectedGroup = groups[getFinishedOrderSelectedGroupIndex(groups)] || groups[0] || null;
  const box = new THREE.Box3();
  cakeObjects.forEach((entry) => expandFinishedOrderTargetBox(box, entry));

  if (box.isEmpty()) return;

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  const selectedBox = new THREE.Box3();

  box.getCenter(center);
  box.getSize(size);
  selectedGroup?.entries.forEach((entry) => expandFinishedOrderTargetBox(selectedBox, entry));

  const selectedCenter = new THREE.Vector3();
  const selectedSize = new THREE.Vector3();
  if (!selectedBox.isEmpty()) {
    selectedBox.getCenter(selectedCenter);
    selectedBox.getSize(selectedSize);
  } else {
    selectedCenter.copy(center);
    selectedSize.copy(size);
  }

  const maxSize = Math.max(size.x, size.y, size.z, 0.4);
  const fov = THREE.MathUtils.degToRad(camera.fov || 45);
  const distance = Math.max((maxSize / (2 * Math.tan(fov / 2))) * 1.44, 1.75);
  const selectedTargetX = selectedGroup?.entries.find((entry) => typeof entry.targetX === "number")?.targetX;
  const selectedTargetZ = selectedGroup?.entries.find((entry) => typeof entry.targetZ === "number")?.targetZ;
  const endTarget = new THREE.Vector3(
    selectedTargetX ?? selectedCenter.x,
    selectedCenter.y + selectedSize.y * 0.12,
    selectedTargetZ ?? selectedCenter.z
  );

  const endPosition = endTarget.clone().add(new THREE.Vector3(0, Math.max(size.y * 0.36, 0.32), distance));

  customizerCameraAnimation = {
    startTime: performance.now(),
    duration: 620,
    startPosition: camera.position.clone(),
    endPosition,
    startUp: camera.up.clone(),
    endUp: new THREE.Vector3(0, 1, 0),
    startTarget: controls ? controls.target.clone() : customizerCameraTarget.clone(),
    endTarget
  };

  customizerCameraTarget.copy(endTarget);
  customizerFrontCameraOffset.copy(endPosition).sub(endTarget);
  activeCameraView = "front";
  syncCameraViewButtons();
}

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
      entry.cupcakeSwirlGroup?.traverse((child) => {
        child.userData.partIndex = entry.partIndex;
      });
      if (entry.object?.userData) {
        entry.object.userData.partIndex = entry.partIndex;
      }
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

  let addOnSection = null;
  let addOnList = null;

  if (selections.some((selection) => selection.kind !== "main")) {
    addOnSection = document.createElement("div");
    addOnSection.className = "order-section order-add-ons-section";
    addOnList = document.createElement("div");
    addOnList.className = "backup-list add-on-list";
    addOnSection.appendChild(addOnList);
    orderSections.appendChild(addOnSection);
  }

  selections.forEach((selection, index) => {
    const tierRow = document.createElement("div");
    tierRow.className = "tier-summary";
    tierRow.dataset.index = index;
    tierRow.dataset.kind = selection.kind;
    tierRow.tabIndex = 0;
    tierRow.setAttribute("role", "button");
    tierRow.setAttribute("aria-label", `Edit ${selection.label}`);
    tierRow.addEventListener("click", () => {
      selectTier(index);
    });
    tierRow.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectTier(index);
    });
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
      removeButton.setAttribute("aria-label", selection.kind === "cupcakes" ? "Remove cupcakes" : isBackupKind(selection.kind) ? "Remove backup cake" : "Remove tier");
      removeButton.textContent = "x";
      tierRow.querySelector(".tier-row-actions")?.appendChild(removeButton);
    }

    if (selection.kind !== "main") {
      addOnList?.appendChild(tierRow);
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
  const baseLabel = selections[index].kind === "cupcakes"
    ? getCupcakeDozenLabel(selections[index].cupcakeCount)
    : selections[index].label;
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
  if (isBackupPart(index)) return true;
  if (selection.kind === "cupcakes") return true;
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
  void syncCupcakeFrostingForIndex(index);
  void syncOuterFrostingForIndex(index);
  void syncDecorForIndex(index);
}

function selectTier(index) {
  activeTierIndex = index;
  activeCustomizerTierIndex = index;
  syncTierRowStates?.();
  syncCupcakePreviewWindowVisibility?.(index !== null && isCupcakeKind(selections[index]?.kind));

  setActiveCakeTier(index);
  syncCupcakePreviewWindowVisibility?.(index !== null && isCupcakeKind(selections[index]?.kind));
  syncFocusedSelectionFrame();
  requestAnimationFrame(syncFocusedSelectionFrame);
  syncTierRowStates?.();
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

async function rebuildCustomizerScene(nextActiveIndex = activeTierIndex, { snap = true } = {}) {
  await initCakeBuilder3D(recommendation, getCurrentBuilderParts(), { showCameraGizmo: true });
  applyAllCustomizerSelectionColors();

  for (let index = 0; index < selections.length; index += 1) {
    if (selections[index]?.kind === "extra-backup") {
      await addExtraBackupCakeObject(selections[index], index);
    }
  }

  applyAllCustomizerSelectionColors();

  await Promise.all(selections.map((_, index) => syncOuterFrostingForIndex(index)));
  await Promise.all(selections.map((_, index) => syncCupcakeFrostingForIndex(index)));
  await Promise.all(selections.map((_, index) => syncDecorForIndex(index)));

  if (nextActiveIndex !== null && selections[nextActiveIndex]) {
    selectTier(nextActiveIndex);
  } else {
    selectTier(selections.length ? selections.length - 1 : null);
  }

  if (snap) {
    snapCakeObjectsToTargets();
  }
  if (isCupcakeKind(selections[activeTierIndex]?.kind)) {
    frameCupcakeStackForEditing();
  }
}

const restoredTierIndex = Number.isInteger(restoredCustomizerState?.activeTierIndex)
  && restoredCustomizerState.activeTierIndex >= 0
  && restoredCustomizerState.activeTierIndex < selections.length
    ? restoredCustomizerState.activeTierIndex
    : (selections.length > 0 ? 0 : null);

setTimeout(async () => {
  try {
    await rebuildCustomizerScene(restoredTierIndex);
    updatePrice();
  } catch (error) {
    console.warn("Unable to finish restoring customizer scene", error);
  } finally {
    if (openSummaryOnLoad) {
      renderOrderSummaryPage();
    } else if (openFulfillmentOnLoad) {
      setCustomizerStep("fulfillment");
    } else if (openDecorOnLoad) {
      setCustomizerStep("decor");
    } else {
      persistCustomizerState();
    }
  }
}, 0);

decorToggle?.addEventListener("click", () => {
  setAccordionSection("decor");
});

edibleImageToggle?.addEventListener("click", () => {
  const isOpen = edibleImageToggle.getAttribute("aria-expanded") === "true";
  const nextSection = isOpen ? "decor" : "edible-image";
  setAccordionSection(nextSection);
  if (nextSection === "edible-image") {
    snapCustomizerCameraToView("top");
  }
});

featuredDesignsToggle?.addEventListener("click", () => {
  const isOpen = featuredDesignsToggle.getAttribute("aria-expanded") === "true";
  setAccordionSection(isOpen ? "decor" : "featured-designs");
});

flavorToggle.addEventListener("click", () => {
  setAccordionSection("flavor");
});

edibleImageClearButton?.addEventListener("click", () => {
  const edibleIndex = getEdibleImageSelectionIndex();
  if (edibleIndex === null || !selections[edibleIndex]?.size) return;

  clearEdibleImageUpload(selections[edibleIndex]);
  if (edibleImageFileInput) edibleImageFileInput.value = "";
  disposeEdibleImagePreview();
  syncEdibleImageControls(activeTierIndex);
  syncDecorButtons(activeTierIndex);
  persistCustomizerState();
});

edibleImageFileInput?.addEventListener("change", () => {
  const edibleIndex = getEdibleImageSelectionIndex();
  if (edibleIndex === null || !selections[edibleIndex]?.size) return;

  const file = edibleImageFileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    selections[edibleIndex].edibleImage = true;
    selections[edibleIndex].edibleImageFileName = file.name || "";
    selections[edibleIndex].edibleImageDataUrl = String(reader.result || "");
    selections[edibleIndex].edibleImageScale = DEFAULT_EDIBLE_IMAGE_SCALE;
    selections[edibleIndex].edibleImageRadius = DEFAULT_EDIBLE_IMAGE_RADIUS;
    selections[edibleIndex].edibleImageRotation = DEFAULT_EDIBLE_IMAGE_ROTATION;
    selections[edibleIndex].edibleImageX = selections[edibleIndex].edibleImageX || 0;
    selections[edibleIndex].edibleImageY = selections[edibleIndex].edibleImageY || 0;
    syncEdibleImageControls(activeTierIndex);
    syncDecorButtons(activeTierIndex);
    void syncEdibleImagePreview();
    snapCustomizerCameraToView("top");
    persistCustomizerState();
  });
  reader.readAsDataURL(file);
});

edibleImageNotesInput?.addEventListener("input", () => {
  const edibleIndex = getEdibleImageSelectionIndex();
  if (edibleIndex === null || !selections[edibleIndex]?.size) return;

  selections[edibleIndex].edibleImageNotes = edibleImageNotesInput.value || "";
  syncDecorButtons(activeTierIndex);
  persistCustomizerState();
});

function setEdibleImageTransformValue(field, value) {
  const edibleIndex = getEdibleImageSelectionIndex();
  const entry = getTopMainCakeEntry();
  if (edibleIndex === null || !entry || !selections[edibleIndex]?.edibleImageDataUrl) return;

  selections[edibleIndex][field] = value;
  selections[edibleIndex].edibleImage = true;
  void syncEdibleImagePreview();
  syncEdibleImageControls(activeTierIndex);
  syncDecorButtons(activeTierIndex);
  persistCustomizerState();
}

edibleImageRadiusInput?.addEventListener("input", () => {
  setEdibleImageTransformValue("edibleImageRadius", Number(edibleImageRadiusInput.value) || DEFAULT_EDIBLE_IMAGE_RADIUS);
});

edibleImageScaleInput?.addEventListener("input", () => {
  setEdibleImageTransformValue("edibleImageScale", Number(edibleImageScaleInput.value) || DEFAULT_EDIBLE_IMAGE_SCALE);
});

edibleImageRotationInput?.addEventListener("input", () => {
  setEdibleImageTransformValue("edibleImageRotation", Number(edibleImageRotationInput.value) || DEFAULT_EDIBLE_IMAGE_ROTATION);
});

edibleImageRadiusResetButton?.addEventListener("click", () => {
  setEdibleImageTransformValue("edibleImageRadius", DEFAULT_EDIBLE_IMAGE_RADIUS);
});

edibleImageScaleResetButton?.addEventListener("click", () => {
  setEdibleImageTransformValue("edibleImageScale", DEFAULT_EDIBLE_IMAGE_SCALE);
});

edibleImageRotationResetButton?.addEventListener("click", () => {
  setEdibleImageTransformValue("edibleImageRotation", DEFAULT_EDIBLE_IMAGE_ROTATION);
});

decorOptionButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (activeTierIndex === null) return;

    if (button.dataset.decor === SHELL_BORDER_DECOR) {
      await toggleShellBorder(activeTierIndex);
    } else if (button.dataset.decor === SWIRL_DECOR) {
      await toggleSwirls(activeTierIndex);
    } else {
      toggleDecoration(selections[activeTierIndex], button.dataset.decor || "");
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
    setDecorationActive(selections[activeTierIndex], SWIRL_DECOR, true);

    await updateSwirlDecor(activeTierIndex);
    syncDecorButtons(activeTierIndex);
    persistCustomizerState();
  });
});

shellBorderEdgeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (activeTierIndex === null || !selections[activeTierIndex]?.size) return;

    const selection = selections[activeTierIndex];
    const shellEdge = button.dataset.shellEdge || SHELL_BORDER_DEFAULT_EDGE;
    const currentEdges = normalizeShellBorderEdges(selection);
    const nextEdges = currentEdges.includes(shellEdge)
      ? currentEdges.filter((edge) => edge !== shellEdge)
      : [...currentEdges, shellEdge];

    selection.shellBorderEdges = nextEdges.length ? nextEdges : [shellEdge];
    selection.shellBorderEdge = selection.shellBorderEdges[0] || SHELL_BORDER_DEFAULT_EDGE;
    setDecorationActive(selection, SHELL_BORDER_DECOR, true);

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
  if (outerFrostingSelect.value === STRIPED_OUTER_FROSTING_DECOR && !selections[targetIndex].outerFrostingStripeColor) {
    selections[targetIndex].outerFrostingStripeColor = DEFAULT_STRIPE_FROSTING_COLOR;
  }
  if (outerFrostingSelect.value === OMBRE_OUTER_FROSTING_DECOR && !selections[targetIndex].outerFrostingOmbreColor) {
    selections[targetIndex].outerFrostingOmbreColor = DEFAULT_OMBRE_FROSTING_COLOR;
  }

  syncDecorButtons(targetIndex);
  void syncOuterFrostingForIndex(targetIndex);
  void syncDecorForIndex(targetIndex);
  syncPeekToggleForIndex(targetIndex);
  persistCustomizerState();
});

outerFrostingColorPreview?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (outerFrostingColorPreview.disabled) return;
  toggleDecorColorPopup("outer");
});

outerFrostingStripeColorPreview?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (outerFrostingStripeColorPreview.disabled) return;
  toggleDecorColorPopup("stripe");
});

shellBorderColorPreview?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (shellBorderColorPreview.disabled) return;
  toggleDecorColorPopup(SHELL_BORDER_DECOR);
});

swirlsColorPreview?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (swirlsColorPreview.disabled) return;
  toggleDecorColorPopup(SWIRL_DECOR);
});

swagsColorPreview?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (swagsColorPreview.disabled) return;
  toggleDecorColorPopup(SWAG_DECOR);
});

shellSwagColorPreview?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (shellSwagColorPreview.disabled) return;
  toggleDecorColorPopup(SHELL_SWAG_DECOR);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest?.(".decor-color-picker")) {
    closeDecorColorPopups();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDecorColorPopups();
  }
});

decorColorSwatches.forEach((button) => {
  button.addEventListener("click", () => {
    const targetIndex = getDecorTargetIndex();
    applyOuterFrostingColorSelection(targetIndex, button.dataset.decorColor || DEFAULT_OUTER_FROSTING_COLOR);
    closeDecorColorPopups();
  });
});

outerFrostingColorInput?.addEventListener("input", () => {
  const targetIndex = getDecorTargetIndex();
  applyOuterFrostingColorSelection(targetIndex, outerFrostingColorInput.value || DEFAULT_OUTER_FROSTING_COLOR);
});

decorationColorSwatches.forEach((button) => {
  button.addEventListener("click", () => {
    const targetIndex = getDecorTargetIndex();
    applyDecorationColorSelection(
      targetIndex,
      button.dataset.decorationColorTarget,
      button.dataset.decorationColor || DEFAULT_SHELL_FROSTING_COLOR
    );
    closeDecorColorPopups();
  });
});

decorationColorInputs.forEach((input) => {
  input.addEventListener("input", () => {
    const targetIndex = getDecorTargetIndex();
    applyDecorationColorSelection(
      targetIndex,
      input.dataset.decorationColorTarget,
      input.value || DEFAULT_SHELL_FROSTING_COLOR
    );
  });
});

stripeColorSwatches.forEach((button) => {
  button.addEventListener("click", () => {
    const targetIndex = getDecorTargetIndex();
    applySecondaryFinishColorSelection(targetIndex, button.dataset.stripeColor || DEFAULT_STRIPE_FROSTING_COLOR);
    closeDecorColorPopups();
  });
});

outerFrostingStripeColorInput?.addEventListener("input", () => {
  const targetIndex = getDecorTargetIndex();
  applySecondaryFinishColorSelection(targetIndex, outerFrostingStripeColorInput.value || DEFAULT_STRIPE_FROSTING_COLOR);
});

extraBackupToggle.addEventListener("click", () => {
  const isOpen = extraBackupToggle.getAttribute("aria-expanded") === "true";
  setAccordionSection(isOpen ? "flavor" : "backup");
});

extraBackupSizeButtons.forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const selectedCupcakeCount = Number(button.dataset.cupcakes);
    if (selectedCupcakeCount) {
      const cupcakeAddAnimationState = getCupcakeAddAnimationState();
      const newCupcakeSelection = {
        label: "1 Dozen Cupcakes",
        size: null,
        cupcakeCount: CUPCAKE_QUANTITY_STEP,
        cupcakeDozenIndex: 0,
        cupcakeDozenCount: 1,
        extraCupcakes: true,
        kind: "cupcakes",
        flavor: "",
        frosting: "",
        filling: "",
        signature: "",
        decor: "",
        decorations: [],
        shellBorderEdge: SHELL_BORDER_DEFAULT_EDGE,
        shellBorderEdges: [SHELL_BORDER_DEFAULT_EDGE],
        shellBorderColor: DEFAULT_SHELL_FROSTING_COLOR,
        swirlCount: DEFAULT_SWIRL_COUNT,
        swirlColor: DEFAULT_SHELL_FROSTING_COLOR,
        swagColor: DEFAULT_SHELL_FROSTING_COLOR,
        shellSwagColor: DEFAULT_SHELL_FROSTING_COLOR,
        cherries: false,
        outerFrosting: "",
        outerFrostingColor: DEFAULT_OUTER_FROSTING_COLOR,
        outerFrostingStripeColor: DEFAULT_STRIPE_FROSTING_COLOR,
        outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
        ...getDefaultEdibleImageSettings()
      };

      selections.push(newCupcakeSelection);
      const newCupcakeIndex = selections.length - 1;
      activeTierIndex = newCupcakeIndex;
      activeCustomizerTierIndex = newCupcakeIndex;
      customizerPreviewSelections = selections;
      persistCustomizerState();
      renderOrderRows();
      syncTierRowStates();
      setAccordionSection("flavor");
      requestAnimationFrame(() => scrollTierRowIntoView(newCupcakeIndex));
      if (cakeSceneRoot && loader) {
        await addCupcakeDozenObject(newCupcakeSelection, newCupcakeIndex);
      } else {
        await rebuildCustomizerScene(newCupcakeIndex, { snap: false });
      }
      prepareCupcakeAddAnimation(newCupcakeIndex, cupcakeAddAnimationState);
      selectTier(newCupcakeIndex);
      frameCupcakeStackForEditing();
      updatePrice();
      setAccordionSection("flavor");
      scrollTierRowIntoView(newCupcakeIndex);
      requestAnimationFrame(() => {
        scrollTierRowIntoView(newCupcakeIndex);
        signatureSelect?.focus();
      });
      persistCustomizerState();
      return;
    }

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
    decorations: [],
    shellBorderEdge: SHELL_BORDER_DEFAULT_EDGE,
    shellBorderEdges: [SHELL_BORDER_DEFAULT_EDGE],
    shellBorderColor: DEFAULT_SHELL_FROSTING_COLOR,
    swirlCount: DEFAULT_SWIRL_COUNT,
    swirlColor: DEFAULT_SHELL_FROSTING_COLOR,
    swagColor: DEFAULT_SHELL_FROSTING_COLOR,
    shellSwagColor: DEFAULT_SHELL_FROSTING_COLOR,
    cherries: false,
    outerFrosting: "",
    outerFrostingColor: DEFAULT_OUTER_FROSTING_COLOR,
    outerFrostingStripeColor: DEFAULT_STRIPE_FROSTING_COLOR,
    outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR,
    ...getDefaultEdibleImageSettings()
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
  setCustomizerStep("fulfillment");
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

function getClampedRecommendationGuests(value) {
  const parsedGuests = parseGuestCountValue(value);
  if (!parsedGuests) return null;
  return Math.min(250, Math.max(10, parsedGuests));
}

function scheduleLiveRecommendationUpdate() {
  if (!document.body.classList.contains("results-active")) return;

  const guests = getClampedRecommendationGuests(guestCountInput?.value ?? "");
  if (!guests) return;

  if (liveRecommendationFrame) {
    cancelAnimationFrame(liveRecommendationFrame);
  }

  liveRecommendationFrame = requestAnimationFrame(() => {
    liveRecommendationFrame = null;
    initializeCakeFlow(guests, null, { liveUpdate: true });
  });
}

const debouncedLandingHeroPreviewUpdate = debounce(updateLandingHeroPreviewFromInput, LIVE_PREVIEW_DEBOUNCE_MS);

guestCountInput?.addEventListener("input", () => {
  const guests = getClampedRecommendationGuests(guestCountInput.value);
  if (guests && servingsSlider && servingsSlider.value !== String(guests)) {
    servingsSlider.value = guests;
  }

  if (document.body.classList.contains("results-active")) {
    scheduleLiveRecommendationUpdate();
    return;
  }

  debouncedLandingHeroPreviewUpdate();
});

servingsSlider?.addEventListener("input", () => {
  if (guestCountInput) {
    guestCountInput.value = servingsSlider.value;
  }

  if (document.body.classList.contains("results-active")) {
    scheduleLiveRecommendationUpdate();
    return;
  }

  debouncedLandingHeroPreviewUpdate();
});

priceSlider?.addEventListener("input", () => {
  recommendationBudgetWasManuallySelected = true;
  selectedRecommendationBudget = Number(priceSlider.value);

  if (priceSliderValue) {
    priceSliderValue.textContent = formatPrice(selectedRecommendationBudget);
  }

  scheduleLiveRecommendationUpdate();
});

const HOW_TO_ORDER_STEPS = [
  {
    title: "Cake Size",
    copy: "How many people are you serving?",
  },
  {
    title: "Flavor",
    copy: "Move through flavor, filling, and frosting choices.",
  },
  {
    title: "Decorate",
    copy: "Layer in color, piping, and finishing details.",
  },
  {
    title: "Delivery",
    copy: "Review the completed cake and prepare the order details.",
  },
];

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function setHowToOrderTierOpacity(object, opacity) {
  object.visible = opacity > 0.01;

  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = opacity < 0.999;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.92;
    });
  });
}

function renderHowToOrderCakeScene() {
  if (!howToOrderCakeRenderer || !howToOrderCakeScene || !howToOrderCakeCamera) return;
  howToOrderCakeRenderer.render(howToOrderCakeScene, howToOrderCakeCamera);
}

function resizeHowToOrderCakeScene() {
  if (!howToOrderCake3D || !howToOrderCakeRenderer || !howToOrderCakeCamera) return;

  const width = howToOrderCake3D.clientWidth || 520;
  const height = howToOrderCake3D.clientHeight || 360;
  howToOrderCakeCamera.aspect = width / height;
  howToOrderCakeCamera.updateProjectionMatrix();
  howToOrderCakeRenderer.setSize(width, height);
  renderHowToOrderCakeScene();
}

function getHowToOrderTierBounds(object) {
  const box = new THREE.Box3().setFromObject(object);

  return {
    minY: box.min.y,
    maxY: box.max.y,
    height: box.max.y - box.min.y
  };
}

function getHowToOrderFinalCenteredOffset() {
  return howToOrderCakeOnlyOffsetY;
}

function getHowToOrderCenteredOffsetForBounds(bounds, scale = HOW_TO_ORDER_CAKE_MAX_SCALE) {
  if (!bounds || bounds.isEmpty()) return 0;

  return HOW_TO_ORDER_CAKE_FINAL_CENTER_Y - ((bounds.min.y + bounds.max.y) / 2) * scale;
}

function getHowToOrderFlavorColorSet(flavorSlug) {
  const selection = menuSignatureFlavors[flavorSlug] || {};
  const colors = getTierColorSelections({
    flavor: selection.cake,
    frosting: selection.frosting,
    filling: selection.filling
  });

  return {
    cake: colorToThree(colors.cake),
    frosting: colorToThree(colors.frosting),
    filling: colors.filling ? colorToThree(colors.filling) : null
  };
}

function getHowToOrderMaterialStates(object) {
  const states = [];

  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      const role = material.userData?.role;
      if (!role || role === "liner" || !material.color) return;

      states.push({
        material,
        role,
        baseColor: material.color.clone(),
        baseOpacity: material.opacity ?? 1
      });
    });
  });

  return states;
}

function applyHowToOrderTierFlavorProgress(entry, progress) {
  if (!entry.materialStates?.length || !entry.flavorColors) return;

  const easedProgress = progress * progress * (3 - 2 * progress);
  const revealOpacity = entry.revealOpacity ?? 1;

  entry.materialStates.forEach((state) => {
    const targetColor = entry.flavorColors[state.role];
    const targetOpacity = state.role === "filling" && !targetColor ? 0 : 1;
    const flavorOpacity = lerp(state.baseOpacity, targetOpacity, easedProgress);

    state.material.transparent = revealOpacity < 0.999 || flavorOpacity < 0.999;
    state.material.opacity = flavorOpacity * revealOpacity;
    state.material.depthWrite = state.material.opacity > 0.92;
    state.material.needsUpdate = true;

    if (targetColor) {
      state.material.color.copy(state.baseColor).lerp(targetColor, easedProgress);
    }
  });
}

function applyHowToOrderFlavorProgress(progress) {
  howToOrderFlavorProgress = clamp01(progress);
  if (!howToOrderCakeReady || !howToOrderCakeEntries.length) return;

  HOW_TO_ORDER_FLAVOR_SEQUENCE.forEach((flavorStep, index) => {
    const entry = howToOrderCakeEntries.find((tierEntry) => tierEntry.size === flavorStep.size);
    if (!entry) return;

    const tierProgress = clamp01((howToOrderFlavorProgress * HOW_TO_ORDER_FLAVOR_SEQUENCE.length) - index);
    applyHowToOrderTierFlavorProgress(entry, tierProgress);
  });

  renderHowToOrderCakeScene();
}

function setHowToOrderOuterFrostingOpacity(object, opacity) {
  if (!object) return;

  object.visible = opacity > 0.01;
  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = opacity < 0.999;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.92;
      material.needsUpdate = true;
    });
  });
}

function getHowToOrderTierLocalEdgeY(entry, edge = SHELL_BORDER_DEFAULT_EDGE) {
  entry.object.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(entry.object);
  const worldY = edge === "bottom" ? box.min.y : box.max.y;
  const localPoint = entry.object.worldToLocal(new THREE.Vector3(0, worldY, 0));

  return localPoint.y + (edge === "bottom" ? SHELL_BORDER_BOTTOM_Y_OFFSET : SHELL_BORDER_TOP_Y_OFFSET);
}

function setHowToOrderDecorObjectOpacity(object, opacity) {
  if (!object) return;

  object.visible = opacity > 0.01;
  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = opacity < 0.999;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.92;
      material.needsUpdate = true;
    });
  });
}

async function addHowToOrderShellBorder(entry, template) {
  const radius = entry.tierRadius || 0.24;
  const count = getShellCountForTier(entry, radius);
  const scale = getShellScaleForCount(template, radius, count);
  const y = getHowToOrderTierLocalEdgeY(entry, "top");
  const radialOffset = 0.002;

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const shell = template.clone(true);

    shell.position.set(
      Math.cos(angle) * (radius + radialOffset),
      y,
      Math.sin(angle) * (radius + radialOffset)
    );
    shell.rotation.y = -angle + Math.PI / 2;
    shell.scale.set(
      scale * SHELL_BORDER_OVERLAP * HOW_TO_ORDER_SHELL_BORDER_SCALE,
      scale * 1.08 * HOW_TO_ORDER_SHELL_BORDER_SCALE,
      scale * 1.12 * HOW_TO_ORDER_SHELL_BORDER_SCALE
    );
    shell.userData.isHowToOrderDecor = true;
    applyShellBorderMaterial(shell, DEFAULT_SHELL_FROSTING_COLOR);
    entry.decorObject.add(shell);
  }
}

async function addHowToOrderSwags(entry, template) {
  const radius = (entry.tierRadius || 0.24) + SWAG_SURFACE_OFFSET;
  const swagCount = getSwagCountForTier(entry);
  const segmentAngle = (Math.PI * 2) / swagCount;
  const baseY = getHowToOrderTierLocalEdgeY(entry, "bottom") - SHELL_BORDER_BOTTOM_Y_OFFSET;
  const tierHeight = entry.tierHeight || entry.height || 0.24;
  const anchorY = baseY + tierHeight * SWAG_ANCHOR_HEIGHT_RATIO;
  const drop = Math.max(tierHeight * SWAG_DROP_HEIGHT_RATIO, 0.025);
  const scale = getSwagScaleForTier(template, radius, swagCount);

  for (let swagIndex = 0; swagIndex < swagCount; swagIndex += 1) {
    const startAngle = (swagIndex / swagCount) * Math.PI * 2;
    const compressedStartAngle = startAngle + segmentAngle * ((1 - SWAG_HORIZONTAL_COMPRESSION) / 2);

    for (let pieceIndex = 0; pieceIndex < SWAG_PIECES_PER_DRAPE; pieceIndex += 1) {
      const t = SWAG_PIECES_PER_DRAPE === 1 ? 0.5 : pieceIndex / (SWAG_PIECES_PER_DRAPE - 1);
      const angle = compressedStartAngle + t * segmentAngle * SWAG_HORIZONTAL_COMPRESSION;
      const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const centerWeight = Math.sin(Math.PI * t);
      const centerCurve = Math.pow(centerWeight, 1.45);
      const y = anchorY - centerWeight * drop + centerCurve * tierHeight * SWAG_CENTER_LIFT_HEIGHT_RATIO;
      const pieceScale = scale * (0.58 + centerCurve * 0.54);
      const curveSlope = -Math.cos(Math.PI * t) * drop / Math.max(segmentAngle * radius * SWAG_HORIZONTAL_COMPRESSION, 0.001);
      const swag = template.clone(true);

      swag.position.set(outward.x * radius, y, outward.z * radius);
      swag.quaternion.copy(getSwagSidewallQuaternion(outward));
      swag.rotateY(Math.atan(curveSlope) * SWAG_CURVE_ROTATION_STRENGTH);
      swag.scale.set(pieceScale, pieceScale * (0.54 + centerCurve * 0.1), pieceScale);
      swag.userData.isHowToOrderDecor = true;
      applyShellBorderMaterial(swag, DEFAULT_SHELL_FROSTING_COLOR);
      entry.decorObject.add(swag);
    }
  }
}

async function addHowToOrderDecorToEntry(entry, localLoader) {
  entry.decorObject = new THREE.Group();
  entry.decorObject.name = `howToOrderDecor-${entry.size}`;
  entry.object.add(entry.decorObject);

  const [swagTemplate, shellTemplate] = await Promise.all([
    loadSwagModel(localLoader),
    loadShellModel(localLoader)
  ]);

  await addHowToOrderSwags(entry, swagTemplate);
  await addHowToOrderShellBorder(entry, shellTemplate);
  setHowToOrderDecorObjectOpacity(entry.decorObject, 0);
  entry.decorObject.scale.setScalar(0.96);
}

async function addHowToOrderStand(localLoader) {
  const stand = await loadModelScene(HOW_TO_ORDER_STAND_MODEL_SRC, localLoader);

  prepareDecorModelMaterials(stand);
  normalizeCakeModelBounds(stand);
  const standBounds = getHowToOrderTierBounds(stand);
  howToOrderCakeStandTopY = standBounds.maxY;
  stand.scale.setScalar(HOW_TO_ORDER_STAND_SCALE);
  stand.position.y = -howToOrderCakeStandTopY * HOW_TO_ORDER_STAND_SCALE;
  stand.name = "howToOrderStand";
  setHowToOrderDecorObjectOpacity(stand, 0);

  howToOrderCakeGroup.add(stand);
  howToOrderCakeStand = stand;
}

function applyHowToOrderDecorProgress(progress) {
  howToOrderDecorProgress = clamp01(progress);
  if (!howToOrderCakeReady || !howToOrderCakeEntries.length) return;

  const frostingProgress = clamp01(howToOrderDecorProgress / HOW_TO_ORDER_FROSTING_PHASE_END);
  const accentProgress = clamp01(
    (howToOrderDecorProgress - HOW_TO_ORDER_DECOR_APPEAR_START) / (1 - HOW_TO_ORDER_DECOR_APPEAR_START)
  );
  const easedAccentProgress = accentProgress * accentProgress * (3 - 2 * accentProgress);

  HOW_TO_ORDER_DECOR_SEQUENCE.forEach((size, index) => {
    const entry = howToOrderCakeEntries.find((tierEntry) => tierEntry.size === size);
    if (!entry?.outerFrostingObject) return;

    const tierProgress = clamp01((frostingProgress * HOW_TO_ORDER_DECOR_SEQUENCE.length) - index);
    const easedProgress = tierProgress * tierProgress * (3 - 2 * tierProgress);
    setHowToOrderOuterFrostingOpacity(entry.outerFrostingObject, easedProgress * (entry.revealOpacity ?? 1));

    if (entry.decorObject) {
      setHowToOrderDecorObjectOpacity(entry.decorObject, easedAccentProgress * (entry.revealOpacity ?? 1));
      entry.decorObject.scale.setScalar(lerp(0.96, 1, easedAccentProgress));
    }
  });

  renderHowToOrderCakeScene();
}

function applyHowToOrderDeliveryProgress(progress) {
  howToOrderDeliveryProgress = clamp01(progress);
  if (!howToOrderCakeReady || !howToOrderCakeGroup) return;

  const easedProgress = howToOrderDeliveryProgress * howToOrderDeliveryProgress * (3 - 2 * howToOrderDeliveryProgress);

  howToOrderCakeGroup.position.y = lerp(
    howToOrderCakeOnlyOffsetY,
    howToOrderCakeDeliveryOffsetY || howToOrderCakeOnlyOffsetY,
    easedProgress
  );
  howToOrderCakeGroup.position.z = howToOrderCakeOnlyPositionZ + HOW_TO_ORDER_DELIVERY_RECEDES_Z * easedProgress;

  if (howToOrderCakeStand) {
    const standScale = HOW_TO_ORDER_STAND_SCALE * lerp(0.98, 1, easedProgress);
    setHowToOrderDecorObjectOpacity(howToOrderCakeStand, easedProgress);
    howToOrderCakeStand.scale.setScalar(standScale);
    howToOrderCakeStand.position.y = -howToOrderCakeStandTopY * standScale;
  }

  renderHowToOrderCakeScene();
}

function updateHowToOrderStageReveal(stageRect, stickyTop) {
  if (!howToOrderSticky || howToOrderStageHasRevealed || howToOrderStageRevealStarted) return;
  if (stageRect.top > window.innerHeight - stickyTop) return;

  howToOrderStageRevealStarted = true;
  howToOrderSticky.classList.add("is-revealing");

  const finishReveal = () => {
    howToOrderStageHasRevealed = true;
    howToOrderSticky.classList.remove("is-revealing");
    howToOrderSticky.classList.add("is-revealed");
  };

  howToOrderSticky.addEventListener("transitionend", finishReveal, { once: true });
  window.setTimeout(finishReveal, 1100);
}

function applyHowToOrderCakeSizeProgress(progress) {
  howToOrderCakeProgress = clamp01(progress);
  if (!howToOrderCakeReady || !howToOrderCakeGroup || !howToOrderCakeEntries.length) return;

  const twoTierProgress = clamp01((howToOrderCakeProgress - 0.33) / 0.33);
  const threeTierProgress = clamp01((howToOrderCakeProgress - 0.66) / 0.34);
  const groupScale = lerp(HOW_TO_ORDER_CAKE_MIN_SCALE, HOW_TO_ORDER_CAKE_MAX_SCALE, howToOrderCakeProgress);
  let stackTopY = 0;

  howToOrderCakeEntries.forEach((entry, index) => {
    const visibleProgress = index === 0 ? 1 : index === 1 ? twoTierProgress : threeTierProgress;

    entry.revealOpacity = visibleProgress;
    entry.object.position.y = entry.basePositionY + stackTopY - entry.minY;
    entry.object.scale.setScalar(1);
    setHowToOrderTierOpacity(entry.object, visibleProgress);
    if (entry.outerFrostingObject) {
      entry.outerFrostingObject.position.y = entry.outerFrostingBasePositionY + stackTopY - entry.outerFrostingMinY;
      entry.outerFrostingObject.scale.setScalar(HOW_TO_ORDER_OUTER_FROSTING_SCALE);
    }
    stackTopY += entry.height;
  });

  howToOrderCakeGroup.scale.setScalar(groupScale);
  howToOrderCakeGroup.position.y = getHowToOrderFinalCenteredOffset();
  howToOrderCakeGroup.rotation.y = THREE.MathUtils.degToRad(lerp(-8, 8, howToOrderCakeProgress));
  renderHowToOrderCakeScene();
}

async function initHowToOrderCakeScene() {
  if (!howToOrderCake3D || howToOrderCakeRenderer) return;

  const width = howToOrderCake3D.clientWidth || 520;
  const height = howToOrderCake3D.clientHeight || 360;
  howToOrderCakeScene = new THREE.Scene();
  howToOrderCakeScene.background = null;
  howToOrderCakeCamera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  howToOrderCakeCamera.position.set(0, 0.72, 2.45);
  howToOrderCakeCamera.lookAt(0, 0.36, 0);

  howToOrderCakeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  howToOrderCakeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  howToOrderCakeRenderer.setSize(width, height);
  howToOrderCake3D.innerHTML = "";
  howToOrderCake3D.appendChild(howToOrderCakeRenderer.domElement);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(-2.5, 3.5, 3);
  howToOrderCakeScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.35);
  fillLight.position.set(2.2, 1.8, 2.8);
  howToOrderCakeScene.add(fillLight);

  const ambient = new THREE.HemisphereLight(0xffffff, 0xe8dccd, 1.55);
  howToOrderCakeScene.add(ambient);

  howToOrderCakeGroup = new THREE.Group();
  howToOrderCakeScene.add(howToOrderCakeGroup);

  const localLoader = new GLTFLoader();
  const tierSizes = [10, 8, 6];

  for (const size of tierSizes) {
    const gltf = await new Promise((resolve, reject) => {
      localLoader.load(`models/tier_${size}.glb`, resolve, undefined, reject);
    });

    const tier = gltf.scene;
    prepareTierMaterials(tier);
    applyTierColorsToObject(tier);
    const normalizedTierBounds = normalizeCakeModelBounds(tier);
    const tierBounds = getHowToOrderTierBounds(tier);
    howToOrderCakeGroup.add(tier);
    const entry = {
      size,
      object: tier,
      tierHeight: normalizedTierBounds.height,
      tierRadius: normalizedTierBounds.width / 2,
      basePositionY: tier.position.y,
      minY: tierBounds.minY,
      maxY: tierBounds.maxY,
      height: tierBounds.height,
      materialStates: getHowToOrderMaterialStates(tier),
      flavorColors: getHowToOrderFlavorColorSet(
        HOW_TO_ORDER_FLAVOR_SEQUENCE.find((flavorStep) => flavorStep.size === size)?.flavorSlug
      ),
      revealOpacity: 0
    };

    const outerFrostingSrc = getOuterFrostingModelSrc(size);
    if (outerFrostingSrc) {
      const outerFrosting = await loadModelScene(outerFrostingSrc, localLoader);
      prepareTierMaterials(outerFrosting);
      normalizeCakeModelBounds(outerFrosting);
      applyOuterFrostingFinish(outerFrosting, {
        outerFrosting: OUTER_FROSTING_DECOR,
        outerFrostingColor: HOW_TO_ORDER_WHITE_FROSTING_COLOR,
        outerFrostingStripeColor: DEFAULT_STRIPE_FROSTING_COLOR,
        outerFrostingOmbreColor: DEFAULT_OMBRE_FROSTING_COLOR
      });
      const outerFrostingBounds = getHowToOrderTierBounds(outerFrosting);
      entry.outerFrostingObject = outerFrosting;
      entry.outerFrostingBasePositionY = outerFrosting.position.y;
      entry.outerFrostingMinY = outerFrostingBounds.minY;
      entry.outerFrostingHeight = outerFrostingBounds.height;
      setHowToOrderOuterFrostingOpacity(outerFrosting, 0);
      howToOrderCakeGroup.add(outerFrosting);
    }

    howToOrderCakeEntries.push(entry);
  }

  const box = new THREE.Box3();
  howToOrderCakeEntries.forEach((entry) => {
    box.expandByObject(entry.object);
  });
  const center = new THREE.Vector3();
  box.getCenter(center);
  howToOrderCakeGroup.position.x -= center.x;
  howToOrderCakeGroup.position.z -= center.z;
  howToOrderCakeOnlyPositionZ = howToOrderCakeGroup.position.z;
  howToOrderCakeStackHeight = howToOrderCakeEntries.reduce((total, entry) => total + entry.height, 0);
  howToOrderCakeOnlyOffsetY = HOW_TO_ORDER_CAKE_FINAL_CENTER_Y - (howToOrderCakeStackHeight * HOW_TO_ORDER_CAKE_MAX_SCALE) / 2;

  await Promise.all(howToOrderCakeEntries.map((entry) => addHowToOrderDecorToEntry(entry, localLoader)));
  await addHowToOrderStand(localLoader);

  const deliveryBox = new THREE.Box3();
  howToOrderCakeEntries.forEach((entry) => {
    deliveryBox.expandByObject(entry.object);
    if (entry.outerFrostingObject) {
      deliveryBox.expandByObject(entry.outerFrostingObject);
    }
  });
  if (howToOrderCakeStand) {
    deliveryBox.expandByObject(howToOrderCakeStand);
  }
  howToOrderCakeDeliveryOffsetY = getHowToOrderCenteredOffsetForBounds(deliveryBox) + HOW_TO_ORDER_DELIVERY_LIFT_Y;

  howToOrderCakeReady = true;
  applyHowToOrderCakeSizeProgress(howToOrderCakeProgress);
  applyHowToOrderFlavorProgress(howToOrderFlavorProgress);
  applyHowToOrderDecorProgress(howToOrderDecorProgress);
  applyHowToOrderDeliveryProgress(howToOrderDeliveryProgress);
}

function updateHowToOrderScrollytelling() {
  howToOrderScrollTicking = false;

  if (!howToOrderStage || !howToOrderSticky || !howToOrderVisualStage) {
    return;
  }

  const stageRect = howToOrderStage.getBoundingClientRect();
  const stickyTop = Number.parseFloat(window.getComputedStyle(howToOrderSticky).top) || 0;
  updateHowToOrderStageReveal(stageRect, stickyTop);

  const scrollableDistance = Math.max(howToOrderStage.offsetHeight - howToOrderSticky.offsetHeight, 1);
  const overallProgress = clamp01((stickyTop - stageRect.top) / scrollableDistance);
  const rawStepProgress = overallProgress * HOW_TO_ORDER_STEPS.length;
  const activeStepIndex = Math.min(Math.floor(rawStepProgress), HOW_TO_ORDER_STEPS.length - 1);
  const activeStepProgress = clamp01(rawStepProgress - activeStepIndex);
  const stepProgressValues = HOW_TO_ORDER_STEPS.map((_, index) => {
    if (index < activeStepIndex) return 1;
    if (index > activeStepIndex) return 0;
    return activeStepProgress;
  });
  const activeStep = HOW_TO_ORDER_STEPS[activeStepIndex];
  const cakeSizeProgress = stepProgressValues[0] ?? 0;
  const servingCount = Math.round(lerp(12, 108, cakeSizeProgress));
  const accentOpacity = 0;
  const deliveryOffset = "0px";

  howToOrderVisualStage.dataset.activeStep = String(activeStepIndex);
  howToOrderVisualStage.style.setProperty("--scrolly-step-progress", activeStepProgress.toFixed(4));
  howToOrderVisualStage.style.setProperty("--scrolly-accent-opacity", accentOpacity.toFixed(4));
  howToOrderVisualStage.style.setProperty("--scrolly-delivery-offset", deliveryOffset);
  applyHowToOrderCakeSizeProgress(cakeSizeProgress);
  applyHowToOrderFlavorProgress(stepProgressValues[1] ?? 0);
  applyHowToOrderDecorProgress(stepProgressValues[2] ?? 0);
  applyHowToOrderDeliveryProgress(stepProgressValues[3] ?? 0);

  if (howToOrderStepNumber) {
    howToOrderStepNumber.textContent = String(activeStepIndex + 1).padStart(2, "0");
  }

  if (howToOrderStepTitle) {
    howToOrderStepTitle.textContent = activeStep.title;
  }

  if (howToOrderStepCopy) {
    howToOrderStepCopy.textContent = activeStep.copy;
  }

  if (howToOrderServingCount) {
    howToOrderServingCount.textContent = servingCount >= 100 ? "100+ servings" : `${servingCount} servings`;
  }

  window.howToOrderStepProgress = stepProgressValues;
}

function scheduleHowToOrderScrollytellingUpdate() {
  if (howToOrderScrollTicking) {
    return;
  }

  howToOrderScrollTicking = true;
  requestAnimationFrame(updateHowToOrderScrollytelling);
}

function initHowToOrderScrollytelling() {
  if (!howToOrderStage || !howToOrderSticky || !howToOrderVisualStage) {
    return;
  }

  updateHowToOrderScrollytelling();
  void initHowToOrderCakeScene();
  window.addEventListener("scroll", scheduleHowToOrderScrollytellingUpdate, { passive: true });
  window.addEventListener("resize", () => {
    resizeHowToOrderCakeScene();
    scheduleHowToOrderScrollytellingUpdate();
  });
}

calculatorForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  debouncedLandingHeroPreviewUpdate.cancel();
  const guests = getClampedRecommendationGuests(guestCountInput?.value ?? "");
  initializeCakeFlow(guests);
});

recommendationsBackButton?.addEventListener("click", () => {
  returnToLandingPage();
});

menuTab?.addEventListener("click", () => {
  openMenuPage();
});

gingerbreadTab?.addEventListener("click", () => {
  openGingerbreadPage();
});

displayCaseTab?.addEventListener("click", () => {
  openDisplayCasePage();
});

orderTab?.addEventListener("click", () => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  returnToLandingPage();
  requestAnimationFrame(() => {
    guestCountInput?.focus();
  });
});

const savedAppState = getSavedAppState();
if (savedAppState?.guests && ["customizer", "decor", "summary", "fulfillment"].includes(savedAppState.view)) {
  initializeCakeFlow(Number(savedAppState.guests), savedAppState);
} else if (savedAppState?.view === "display-case") {
  openDisplayCasePage();
} else if (savedAppState?.view === "menu") {
  openMenuPage();
} else if (savedAppState?.view === "gingerbread") {
  openGingerbreadPage();
} else if (!document.body.classList.contains("customizer-active")) {
  showHomePageView();
}

siteLogo?.addEventListener("click", () => {
  openHomePage();
});

function createAsciiBirthdayCandle(mount, options = {}) {
  if (!mount) return null;

  const {
    scale = 1,
    frameDurations = [92, 128, 86, 154, 112, 176, 104]
  } = options;
  const bodyPattern = [
    "   :0101#:   ",
    "   :1010@:   ",
    "   :0;,.#:   ",
    "   :,..+@:   ",
    "   :..,1#:   ",
    "   :.,10@:   ",
    "   :,101#:   ",
    "   :1010@:   ",
    "   :0101#:   ",
    "   :1010@:   ",
    "   :01;,#:   ",
    "   :1:,.@:   ",
    "   :0,..#:   ",
    "   :,..+@:   ",
    "   :..,1#:   ",
    "   :.,10@:   ",
    "   :,101#:   ",
    "   :1010@:   ",
    "   :0101#:   ",
    "   :1010@:   "
  ];
  const flameFrames = [
    [
      "      '      ",
      "      .      ",
      "     ,0      ",
      "     :1+     ",
      "    .0#1     ",
      "    ,+%10    ",
      "   .0%#10.   ",
      "  .:+%#10,.  ",
      "  ,0+%#10:   ",
      "  :0+%#10;   ",
      "  `:+%#1;'   ",
      "   `:010'    ",
      "     `+'     ",
      "      ||     "
    ],
    [
      "       '     ",
      "       1     ",
      "      .0     ",
      "     .+1     ",
      "     :0#1    ",
      "    .+%10    ",
      "   .0%#10,   ",
      "  .:1%#10:.  ",
      "  ,0+%#10;   ",
      "  :0+%#1:    ",
      "  `:+%#1'    ",
      "   `:010'    ",
      "     `+'     ",
      "      ||     "
    ],
    [
      "     '       ",
      "     1.      ",
      "     0:      ",
      "    .1+      ",
      "    0#1.     ",
      "   .1%+0     ",
      "  .0#%+1.    ",
      "  ,1#%+0:.   ",
      "  :1#%+01,   ",
      "  :0#%+10;   ",
      "  `;%#10'    ",
      "   `:101'    ",
      "     `+'     ",
      "      ||     "
    ],
    [
      "      .      ",
      "      '      ",
      "     .0      ",
      "     :1+     ",
      "    .0#1     ",
      "    :+%10    ",
      "   ,1%#10    ",
      "  .:0%#10,.  ",
      "  ,0+%#10:   ",
      "  ;0+%#10:   ",
      "  `:+%#1;'   ",
      "   `:010'    ",
      "     `+'     ",
      "      ||     "
    ],
    [
      "       `     ",
      "       1     ",
      "      .0     ",
      "      1+:    ",
      "     .1#0    ",
      "    .01%+    ",
      "   .01#%0.   ",
      "  .:01#%+,.  ",
      "  :01#%+0,   ",
      "  ;01#%+0:   ",
      "  `;1#%+:'   ",
      "   `010:'    ",
      "     `+'     ",
      "      ||     "
    ],
    [
      "     .       ",
      "     '1      ",
      "      0      ",
      "     :1+     ",
      "    .0#1     ",
      "   .1%+0     ",
      "   0#%+10.   ",
      "  :1#%+01,   ",
      "  :0#%+10.   ",
      "  ;0#%+10:   ",
      "  `;%#10'    ",
      "   `:101'    ",
      "     `+'     ",
      "      ||     "
    ],
    [
      "      `      ",
      "      1      ",
      "      0.     ",
      "     101     ",
      "    .1+0     ",
      "    10#%     ",
      "   .10#%1    ",
      "  .:10#%1.   ",
      "  ,10#%+0:   ",
      "  :10#%+0;   ",
      "  `:0#%+;'   ",
      "   `1010'    ",
      "     `+'     ",
      "      ||     "
    ]
  ];
  const pre = document.createElement("pre");
  let tick = 0;
  let timeoutId = null;

  mount.style.setProperty("--ascii-candle-scale", String(scale));
  mount.textContent = "";
  mount.appendChild(pre);

  const render = () => {
    const flame = flameFrames[tick % flameFrames.length];

    pre.textContent = [...flame, ...bodyPattern].join("\n");
    tick += 1;
  };
  const start = () => {
    if (timeoutId || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scheduleNextFrame = () => {
      render();
      timeoutId = window.setTimeout(
        scheduleNextFrame,
        frameDurations[tick % frameDurations.length]
      );
    };

    timeoutId = window.setTimeout(scheduleNextFrame, frameDurations[0]);
  };
  const stop = () => {
    if (!timeoutId) return;
    window.clearTimeout(timeoutId);
    timeoutId = null;
  };

  render();
  start();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  return {
    render,
    start,
    stop,
    setScale(nextScale) {
      mount.style.setProperty("--ascii-candle-scale", String(nextScale));
    }
  };
}

createAsciiBirthdayCandle(document.getElementById("vote-barn-candle"), {
  scale: 1
});
document.querySelectorAll(".home-hero-candle").forEach((candle, index) => {
  createAsciiBirthdayCandle(candle, {
    scale: index === 1 ? 0.94 : 0.86,
    frameDurations: index === 1 ? [190, 245, 168, 280, 214, 310] : [205, 260, 182, 296, 228, 330]
  });
});

void initPasswordGateCake();
initLandingHero();
initHowToOrderScrollytelling();

function printConsoleCakeSupplyEasterEgg() {
  console.log(`        i  i  i
        |  |  |
      __|__|__|__
     |~~~~~~~~~~~|
     |           |
   __|___________|__
  |~~~~~~~~~~~~~~~~~|
  |                 |
  |_________________|`);
  console.log(
    "%cCAKE SUPPLY",
    "font-family: Georgia, 'Times New Roman', serif; font-size: 22px; letter-spacing: 0.22em;"
  );
  console.log(
    "%cyou found the crumbs.",
    "font-size: 11px; font-style: italic;"
  );
}

printConsoleCakeSupplyEasterEgg();
