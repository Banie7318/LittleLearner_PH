/* =========================================================
   LITTLE LEARNER PH — MAIN APP FILE
   =========================================================

   ⭐ EDIT HERE FIRST ⭐

   This file now contains:
   1. Firebase configuration
   2. Main learner defaults
   3. Firebase Authentication + Firestore sync
   4. All learning lessons and app logic

   For most future edits, start in this file.
   ========================================================= */

/* =========================================================
   1) FIREBASE CONFIGURATION
   Already filled with your Little Learner PH Firebase project.
   measurementId is retained, but Analytics is NOT initialized
   in this child-focused app.
   ========================================================= */
const APP_CONFIG = {
  appName: "Little Learner PH",

  firebase: {
    apiKey: "AIzaSyAxNfqsnCCq7g4Zl0e36rC8C0hUwdQkUEk",
    authDomain: "little-learner-ph.firebaseapp.com",
    projectId: "little-learner-ph",
    storageBucket: "little-learner-ph.firebasestorage.app",
    messagingSenderId: "675974715658",
    appId: "1:675974715658:web:9f4d9a06faa64bba5a02f3",
    measurementId: "G-MB8TWGSTEP"
  },

  learnerDefaults: {
    name: "Super Learner",
    totalStars: 0,
    sessions: 0,
    streak: 0,
    lastDay: "",
    todayStars: 0,
    dailyGoal: 15,
    voice: true,
    celebrate: true,
    updatedAt: 0,
    skills: {
      english: 0,
      filipino: 0,
      math: 0,
      story: 0,
      thinking: 0,
      review: 0
    }
  }
};

const STORAGE_KEY = "littleLearnerPH";
const defaults = JSON.parse(JSON.stringify(APP_CONFIG.learnerDefaults));

let state = {
  ...defaults,
  ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {})
};
state.skills = {
  ...defaults.skills,
  ...(state.skills || {})
};

/* =========================================================
   2) FIREBASE CLOUD SYNC
   ========================================================= */
const FIREBASE_SDK_VERSION = "12.18.0";
let cloud = {
  ready: false,
  user: null,
  db: null,
  doc: null,
  getDoc: null,
  setDoc: null,
  serverTimestamp: null
};
let cloudSaveTimer = null;

function setCloudUI(status, message = ""){
  const badge = document.querySelector("#cloudStatus");
  const stateText = document.querySelector("#cloudStateText");
  const detail = document.querySelector("#cloudDetail");

  const labels = {
    local: "☁️ Local",
    connecting: "☁️ Connecting",
    online: "☁️ Synced",
    offline: "📴 Offline",
    error: "⚠️ Cloud"
  };

  if (badge){
    badge.textContent = labels[status] || "☁️ Local";
    badge.className = `cloud-status ${status}`;
    badge.title = message || labels[status] || "";
  }

  if (stateText){
    stateText.textContent = {
      local: "Local-only mode",
      connecting: "Connecting to Firebase…",
      online: "Firebase backup active",
      offline: "Offline mode active",
      error: "Cloud connection needs attention"
    }[status] || "Storage status";
  }

  if (detail && message) detail.textContent = message;
}

function cloudDocRef(){
  if (!cloud.ready || !cloud.user || !cloud.db || !cloud.doc) return null;
  return cloud.doc(cloud.db, "users", cloud.user.uid, "learning", "state");
}

async function pullCloudState(){
  const ref = cloudDocRef();
  if (!ref) return null;

  try{
    const snap = await cloud.getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }catch(error){
    console.warn("Cloud pull failed:", error);
    setCloudUI(navigator.onLine ? "error" : "offline",
      navigator.onLine ? "Could not read the cloud backup." : "Offline. Lessons still save on this iPad.");
    return null;
  }
}

async function pushCloudState(){
  const ref = cloudDocRef();
  if (!ref) return false;

  try{
    const payload = JSON.parse(JSON.stringify(state));
    payload.updatedAt = Number(payload.updatedAt || Date.now());
    payload.serverUpdatedAt = cloud.serverTimestamp();

    await cloud.setDoc(ref, payload, { merge: true });

    setCloudUI(
      navigator.onLine ? "online" : "offline",
      navigator.onLine
        ? "Progress is backed up to Firebase."
        : "Saved locally. Firestore can synchronize after internet returns."
    );
    return true;
  }catch(error){
    console.warn("Cloud save failed:", error);
    setCloudUI(
      navigator.onLine ? "error" : "offline",
      navigator.onLine
        ? "Cloud backup failed, but progress is still saved on this iPad."
        : "Offline. Progress is safely saved on this iPad."
    );
    return false;
  }
}

function scheduleCloudSave(){
  if (!cloud.ready) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => pushCloudState(), 600);
}

async function mergeCloudAndLocal(){
  const remote = await pullCloudState();

  if (!remote){
    await pushCloudState();
    return;
  }

  const localUpdated = Number(state.updatedAt || 0);
  const cloudUpdated = Number(remote.updatedAt || 0);

  if (cloudUpdated > localUpdated){
    state = {
      ...defaults,
      ...remote,
      skills: {
        ...defaults.skills,
        ...(remote.skills || {})
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateHome();
    setCloudUI("online", "Newer progress was restored from Firebase.");
  }else{
    await pushCloudState();
  }
}

async function syncNow(){
  if (!cloud.ready){
    setCloudUI(navigator.onLine ? "connecting" : "offline",
      navigator.onLine ? "Firebase is still connecting…" : "Connect to the internet to sync.");
    return;
  }

  setCloudUI("connecting", "Synchronizing progress…");
  await mergeCloudAndLocal();
}

async function initFirebaseCloud(){
  if (!navigator.onLine){
    setCloudUI("offline", "Offline. The app is using local iPad storage.");
  }else{
    setCloudUI("connecting", "Signing in securely…");
  }

  try{
    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

    const [appMod, authMod, firestoreMod] = await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-auth.js`),
      import(`${base}/firebase-firestore.js`)
    ]);

    const app = appMod.initializeApp(APP_CONFIG.firebase);

    const auth = authMod.getAuth(app);
    await authMod.setPersistence(auth, authMod.browserLocalPersistence);

    const db = firestoreMod.initializeFirestore(app, {
      localCache: firestoreMod.persistentLocalCache({
        tabManager: firestoreMod.persistentSingleTabManager()
      })
    });

    cloud.db = db;
    cloud.doc = firestoreMod.doc;
    cloud.getDoc = firestoreMod.getDoc;
    cloud.setDoc = firestoreMod.setDoc;
    cloud.serverTimestamp = firestoreMod.serverTimestamp;

    authMod.onAuthStateChanged(auth, async user => {
      if (!user) return;
      cloud.user = user;
      cloud.ready = true;

      setCloudUI(
        navigator.onLine ? "online" : "offline",
        navigator.onLine ? "Firebase connected." : "Offline. Cloud will resume when internet returns."
      );

      await mergeCloudAndLocal();
    });

    if (!auth.currentUser){
      await authMod.signInAnonymously(auth);
    }
  }catch(error){
    console.error("Firebase initialization failed:", error);
    cloud.ready = false;
    setCloudUI(
      navigator.onLine ? "error" : "offline",
      "Firebase could not start. Local learning remains fully available."
    );
  }
}

window.addEventListener("online", async () => {
  if (cloud.ready){
    setCloudUI("connecting", "Back online. Synchronizing…");
    await mergeCloudAndLocal();
  }else{
    initFirebaseCloud();
  }
});

window.addEventListener("offline", () => {
  setCloudUI("offline", "Offline. Progress continues to save on this iPad.");
});

/* =========================================================
   3) LEARNING APP
   ========================================================= */


const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* defaults/state are defined in the EDIT HERE section above */
let currentMode = "english";
let lessonScore = 0;
let qIndex = 0;
let questions = [];

const lessonBanks = {
  english: [
    {icon:"🍎", title:"Letter A", say:"A says ah, like apple.", prompt:"Which word starts with A?", choices:["Apple 🍎","Ball ⚽","Cat 🐱","Dog 🐶"], correct:0},
    {icon:"🐱", title:"C-A-T", say:"C, A, T. Cat.", prompt:"What word is C - A - T?", choices:["Cat 🐱","Sun ☀️","Hat 🎩","Dog 🐶"], correct:0},
    {icon:"☀️", title:"Sight Word", say:"The word is see.", prompt:"Choose the word SEE.", choices:["SEE","SIT","SUN","SAD"], correct:0},
    {icon:"🐶", title:"Simple Sentence", say:"The dog can run.", prompt:"Who can run?", choices:["Dog 🐶","Fish 🐟","Tree 🌳","Book 📘"], correct:0}
  ],
  filipino: [
    // =====================================================
    // ANTAS 1 — MGA PATINIG: A E I O U
    // =====================================================
    {icon:"🅰️", title:"Patinig A", say:"A. A tulad ng Araw.", prompt:"Alin ang letrang A?", choices:["A","E","I","O"], correct:0},
    {icon:"🥚", title:"Patinig E", say:"E. E tulad ng Egg o itlog. Sabihin natin: E.", prompt:"Alin ang letrang E?", choices:["E","A","I","U"], correct:0},
    {icon:"🐟", title:"Patinig I", say:"I. I tulad ng Isda.", prompt:"Anong patinig ang simula ng ISDA?", choices:["I","A","O","U"], correct:0},
    {icon:"⭕", title:"Patinig O", say:"O. Bilog ang hugis ng O.", prompt:"Alin ang letrang O?", choices:["O","A","E","U"], correct:0},
    {icon:"🍇", title:"Patinig U", say:"U. Sabihin natin: U.", prompt:"Alin ang letrang U?", choices:["U","A","E","I"], correct:0},

    // =====================================================
    // ANTAS 2 — BA BE BI BO BU
    // =====================================================
    {icon:"👄", title:"Pantig BA", say:"B plus A is BA. BA.", prompt:"B + A = ?", choices:["BA","BE","BI","BO"], correct:0},
    {icon:"👄", title:"Pantig BE", say:"B plus E is BE. BE.", prompt:"B + E = ?", choices:["BE","BA","BI","BU"], correct:0},
    {icon:"👄", title:"Pantig BI", say:"B plus I is BI. BI.", prompt:"B + I = ?", choices:["BI","BA","BO","BU"], correct:0},
    {icon:"👄", title:"Pantig BO", say:"B plus O is BO. BO.", prompt:"B + O = ?", choices:["BO","BI","BA","BE"], correct:0},
    {icon:"👄", title:"Pantig BU", say:"B plus U is BU. BU.", prompt:"B + U = ?", choices:["BU","BO","BE","BI"], correct:0},

    // =====================================================
    // ANTAS 3 — IBA PANG PANTIG FAMILIES
    // =====================================================
    {icon:"👩", title:"MA-ME-MI-MO-MU", say:"MA, ME, MI, MO, MU.", prompt:"M + A = ?", choices:["MA","ME","MI","MO"], correct:0},
    {icon:"🐱", title:"PA-PE-PI-PO-PU", say:"PA, PE, PI, PO, PU.", prompt:"P + U = ?", choices:["PU","PA","PI","PO"], correct:0},
    {icon:"☀️", title:"SA-SE-SI-SO-SU", say:"SA, SE, SI, SO, SU.", prompt:"S + A = ?", choices:["SA","SE","SI","SU"], correct:0},
    {icon:"✋", title:"KA-KE-KI-KO-KU", say:"KA, KE, KI, KO, KU.", prompt:"K + O = ?", choices:["KO","KA","KI","KU"], correct:0},
    {icon:"🍭", title:"LA-LE-LI-LO-LU", say:"LA, LE, LI, LO, LU.", prompt:"L + A = ?", choices:["LA","LE","LI","LO"], correct:0},
    {icon:"👃", title:"NA-NE-NI-NO-NU", say:"NA, NE, NI, NO, NU.", prompt:"N + I = ?", choices:["NI","NA","NO","NU"], correct:0},
    {icon:"👦", title:"TA-TE-TI-TO-TU", say:"TA, TE, TI, TO, TU.", prompt:"T + A = ?", choices:["TA","TE","TI","TO"], correct:0},

    // =====================================================
    // ANTAS 4 — PAGBUO NG SALITA
    // =====================================================
    {icon:"👧", title:"BA + TA = BATA", say:"BA. TA. Kapag pinagsama: BATA.", prompt:"Ano ang mabubuo sa BA + TA?", choices:["BATA 👧","BOLA ⚽","PUSA 🐱","ISDA 🐟"], correct:0},
    {icon:"⚽", title:"BO + LA = BOLA", say:"BO. LA. Kapag pinagsama: BOLA.", prompt:"Ano ang mabubuo sa BO + LA?", choices:["BOLA ⚽","BATA 👧","MATA 👁️","PUSA 🐱"], correct:0},
    {icon:"👁️", title:"MA + TA = MATA", say:"MA. TA. Kapag pinagsama: MATA.", prompt:"Ano ang mabubuo sa MA + TA?", choices:["MATA 👁️","BOLA ⚽","PUSA 🐱","ISDA 🐟"], correct:0},
    {icon:"🐱", title:"PU + SA = PUSA", say:"PU. SA. Kapag pinagsama: PUSA.", prompt:"Ano ang mabubuo sa PU + SA?", choices:["PUSA 🐱","BATA 👧","BOLA ⚽","MATA 👁️"], correct:0},
    {icon:"🐟", title:"IS + DA = ISDA", say:"IS. DA. Kapag pinagsama: ISDA.", prompt:"Ano ang mabubuo sa IS + DA?", choices:["ISDA 🐟","PUSA 🐱","BOLA ⚽","BATA 👧"], correct:0},
    {icon:"👩", title:"NA + NAY = NANAY", say:"NA. NAY. Kapag pinagsama: NANAY.", prompt:"Ano ang mabubuo sa NA + NAY?", choices:["NANAY 👩","TATAY 👨","BATA 👧","BOLA ⚽"], correct:0},
    {icon:"👨", title:"TA + TAY = TATAY", say:"TA. TAY. Kapag pinagsama: TATAY.", prompt:"Ano ang mabubuo sa TA + TAY?", choices:["TATAY 👨","NANAY 👩","MATA 👁️","PUSA 🐱"], correct:0},

    // =====================================================
    // ANTAS 5 — MAIKLING PAGBASA
    // =====================================================
    {icon:"🏠", title:"Salitang BAHAY", say:"BA-HAY. BAHAY.", prompt:"Alin ang BAHAY?", choices:["🏠 Bahay","🐶 Aso","🥭 Mangga","🚗 Kotse"], correct:0},
    {icon:"⚽", title:"Maikling Pangungusap", say:"May bola si Ana.", prompt:"Ano ang mayroon si Ana?", choices:["Bola ⚽","Aklat 📘","Isda 🐟","Payong ☂️"], correct:0}
  ],
  math: [
    // COUNTING
    {icon:"🍎 🍎 🍎", title:"Let’s Count!", say:"One, two, three apples.", prompt:"How many apples?", choices:["3","2","4","1"], correct:0},

    // ADDITION
    {icon:"⭐ ⭐ + ⭐", title:"Addition", say:"Two stars plus one star equals three stars.", prompt:"2 + 1 = ?", choices:["3","4","2","1"], correct:0},
    {icon:"🍓 🍓 + 🍓 🍓", title:"Add Them Together", say:"Two strawberries plus two strawberries equals four.", prompt:"2 + 2 = ?", choices:["4","3","5","2"], correct:0},

    // SUBTRACTION
    {icon:"🐤 🐤 🐤", title:"Take One Away", say:"Three birds. One flies away. Two are left.", prompt:"3 - 1 = ?", choices:["2","3","1","4"], correct:0},
    {icon:"🍪 🍪 🍪 🍪 🍪", title:"Subtraction", say:"There are five cookies. We take away two. Three cookies are left.", prompt:"5 - 2 = ?", choices:["3","2","4","1"], correct:0},

    // SIMPLE DIVISION / EQUAL SHARING
    {icon:"🍪🍪🍪🍪  →  👧 👦", title:"Share Equally", say:"Four cookies are shared equally by two children. Each child gets two cookies.", prompt:"4 cookies ÷ 2 children = how many for each child?", choices:["2","4","1","3"], correct:0},
    {icon:"🍎🍎🍎🍎🍎🍎  →  👧 👦", title:"Equal Sharing", say:"Six apples are shared equally by two children. Each child gets three apples.", prompt:"6 ÷ 2 = ?", choices:["3","2","4","6"], correct:0},

    // GREATER THAN / LESS THAN / EQUAL TO
    {icon:"🍎 🍎     vs     🍎 🍎 🍎 🍎", title:"Which Has More?", say:"Two apples are less than four apples.", prompt:"Which number is greater?", choices:["4","2","They are equal","0"], correct:0},
    {icon:"⭐⭐⭐⭐⭐     vs     ⭐⭐⭐", title:"Greater Than", say:"Five is greater than three.", prompt:"Choose the correct sign: 5 __ 3", choices:[">","<","=","+"], correct:0},
    {icon:"🐟🐟     vs     🐟🐟🐟", title:"Less Than", say:"Two is less than three.", prompt:"Choose the correct sign: 2 __ 3", choices:["<",">","=","−"], correct:0},
    {icon:"🍊🍊🍊     vs     🍊🍊🍊", title:"Equal To", say:"Three oranges are equal to three oranges.", prompt:"Choose the correct sign: 3 __ 3", choices:["=",">","<","+"], correct:0},

    // SHAPES
    {icon:"🔺", title:"Shapes", say:"This is a triangle.", prompt:"What shape is this?", choices:["Triangle","Circle","Square","Heart"], correct:0}
  ],
  story: [
    {icon:"🐰🍎", title:"Bunny’s Apple", say:"Bunny has one apple. Mama gives Bunny one more apple. Bunny is happy.", prompt:"How many apples does Bunny have now?", choices:["2","1","3","0"], correct:0},
    {icon:"🌧️☂️", title:"Rainy Day", say:"Mia sees rain outside. She gets her umbrella. Mia stays dry.", prompt:"What did Mia use?", choices:["Umbrella ☂️","Ball ⚽","Book 📘","Spoon 🥄"], correct:0},
    {icon:"🐶🏠", title:"Bantay Goes Home", say:"Bantay plays outside. It gets dark. Bantay walks back home.", prompt:"Where did Bantay go?", choices:["Home 🏠","School 🏫","Sea 🌊","Moon 🌙"], correct:0}
  ],
  thinking: [
    {icon:"🔴 🔵 🔴 🔵 ?", title:"What Comes Next?", say:"Red, blue, red, blue. What comes next?", prompt:"Choose the next color.", choices:["🔴 Red","🟢 Green","🟡 Yellow","🟣 Purple"], correct:0},
    {icon:"🐱 🐶 🐟 🚗", title:"Odd One Out", say:"Cat, dog and fish are animals. A car is not an animal.", prompt:"Which one is NOT an animal?", choices:["🚗 Car","🐱 Cat","🐶 Dog","🐟 Fish"], correct:0},
    {icon:"🌧️", title:"Everyday Thinking", say:"When it rains, we use an umbrella.", prompt:"What should we use when it rains?", choices:["☂️ Umbrella","🧸 Teddy","⚽ Ball","🧢 Cap"], correct:0}
  ],
  review: [
    {icon:"🔤", title:"Quick Mix", say:"Let us review.", prompt:"Which one starts with M?", choices:["Moon 🌙","Cat 🐱","Dog 🐶","Sun ☀️"], correct:0},
    {icon:"🇵🇭", title:"Patinig Review", say:"A, E, I, O, U are patinig.", prompt:"Alin ang patinig?", choices:["A","B","K","M"], correct:0},
    {icon:"🇵🇭", title:"Pantig Review", say:"BA plus TA is BATA.", prompt:"BA + TA = ?", choices:["BATA","BOLA","PUSA","MATA"], correct:0},
    {icon:"🔢", title:"Math Review", say:"Four minus one is three.", prompt:"4 - 1 = ?", choices:["3","2","4","5"], correct:0},
    {icon:"⭐⭐⭐⭐  vs  ⭐⭐", title:"Compare Numbers", say:"Four is greater than two.", prompt:"Choose the correct sign: 4 __ 2", choices:[">","<","=","+"], correct:0}
  ]
};

function save({ cloud = true } = {}){
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateHome();
  if (cloud) scheduleCloudSave();
}
function showView(id){ $$(".view").forEach(v=>v.classList.remove("active")); $(id).classList.add("active"); window.scrollTo(0,0); }
function dayKey(date = new Date()){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function todayKey(){ return dayKey(new Date()); }

function updateStreak(){
  const t = todayKey();
  if(state.lastDay === t) return;
  const yesterday = dayKey(new Date(Date.now()-86400000));
  state.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
  state.lastDay = t;
  state.todayStars = 0;
}

function updateHome(){
  updateStreak();
  $("#heroGreeting").textContent = `Hello, ${state.name || "Super Learner"}! 👋`;
  $("#starText").textContent = `${state.todayStars} stars earned`;
  const filled = Math.min(5, state.todayStars);
  $("#starDisplay").textContent = "★ ".repeat(filled) + "☆ ".repeat(5-filled);
  $("#totalStars").textContent = state.totalStars;
  $("#sessionsDone").textContent = state.sessions;
  $("#streak").textContent = state.streak;
  $("#learnerName").value = state.name || "";
  $("#dailyGoal").value = String(state.dailyGoal || 15);
  $("#voiceToggle").checked = state.voice !== false;
  $("#celebrateToggle").checked = state.celebrate !== false;
  $("#skillProgress").innerHTML = Object.entries(state.skills).map(([k,v]) => `
    <div class="skill-row">
      <div style="display:flex;justify-content:space-between"><b>${labelSkill(k)}</b><span>${Math.min(v,100)}%</span></div>
      <div class="bar"><div class="fill" style="width:${Math.min(v,100)}%"></div></div>
    </div>`).join("");
}
function labelSkill(k){ return ({english:"English Reading",filipino:"Filipino Reading",math:"Math",story:"Comprehension",thinking:"Thinking Skills",review:"Review"})[k]||k; }

/* =========================================================
   LANGUAGE-AWARE VOICE SYSTEM
   Filipino Reading → Filipino/Tagalog voice when available
   English/Math/Story/Thinking → English voice when available
   ========================================================= */

let availableVoices = [];

function refreshVoices(){
  if(!("speechSynthesis" in window)) return;
  availableVoices = speechSynthesis.getVoices() || [];
}

refreshVoices();

if("speechSynthesis" in window){
  speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
  // Safari/iPad sometimes loads the voice list shortly after page load.
  setTimeout(refreshVoices, 300);
  setTimeout(refreshVoices, 1200);
}

function normalizeLang(lang = ""){
  return lang.toLowerCase().replace("_","-");
}

function chooseVoice(language){
  refreshVoices();
  if(!availableVoices.length) return null;

  const wanted = language === "filipino"
    ? ["fil-ph","tl-ph","fil","tl"]
    : ["en-us","en-gb","en-au","en"];

  // 1. Prefer an exact locale match.
  for(const code of wanted){
    const exact = availableVoices.find(v => normalizeLang(v.lang) === code);
    if(exact) return exact;
  }

  // 2. Then prefer any voice in the requested language family.
  for(const code of wanted){
    const family = code.split("-")[0];
    const match = availableVoices.find(v => normalizeLang(v.lang).startsWith(family));
    if(match) return match;
  }

  return null;
}

function activeSpeechLanguage(){
  // Filipino Reading should sound Filipino/Tagalog.
  if(currentMode === "filipino") return "filipino";

  // Other current learning areas are primarily English.
  return "english";
}

function speak(text, languageOverride = null){
  if(!state.voice || !("speechSynthesis" in window)) return;

  const language = languageOverride || activeSpeechLanguage();
  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = chooseVoice(language);

  speechSynthesis.cancel();

  if(language === "filipino"){
    // "fil-PH" is the modern Filipino locale. Some systems expose "tl-PH".
    utterance.lang = selectedVoice?.lang || "fil-PH";
    utterance.rate = 0.74;
    utterance.pitch = 1.04;
  }else{
    utterance.lang = selectedVoice?.lang || "en-US";
    utterance.rate = 0.78;
    utterance.pitch = 1.06;
  }

  if(selectedVoice){
    utterance.voice = selectedVoice;
  }

  speechSynthesis.speak(utterance);
}
function celebrate(){
  if(!state.celebrate) return;
  const el = $("#celebration"); el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),800);
}

function startLesson(mode){
  currentMode = mode; lessonScore=0; qIndex=0;
  questions = [...lessonBanks[mode]].sort(()=>Math.random()-.5);

  // Keep kindergarten math sessions short while varying the skills practiced.
  if(mode === "math"){
    questions = questions.slice(0, 6);
  }

  // Filipino has a larger progressive bank: patinig → pantig → salita.
  // Keep each session short and child-friendly.
  if(mode === "filipino"){
    questions = questions.slice(0, 7);
  }

  showView("#lessonView");
  renderQuestion();
}

function renderQuestion(){
  $("#lessonStars").textContent = `⭐ ${lessonScore}`;
  if(qIndex >= questions.length){ finishLesson(); return; }
  const q = questions[qIndex];
  $("#lessonStage").innerHTML = `
    <div class="pill">${labelSkill(currentMode)}</div>
    <div class="big-symbol">${q.icon}</div>
    <h2>${q.title}</h2>
    <p class="prompt">${q.prompt}</p>
    <button class="listen-btn" id="listenNow">🔊 Listen</button>
    <div class="answer-grid">
      ${q.choices.map((c,i)=>`<button class="answer" data-i="${i}">${c}</button>`).join("")}
    </div>
    <div class="feedback" id="feedback"></div>
  `;
  $("#listenNow").onclick=()=>speak(q.say + " " + q.prompt);
  $$(".answer").forEach(b=>b.onclick=()=>checkAnswer(Number(b.dataset.i)));
  setTimeout(()=>speak(q.say + " " + q.prompt),350);
}

function checkAnswer(i){
  const q=questions[qIndex];
  $$(".answer").forEach(b=>b.disabled=true);
  if(i===q.correct){
    lessonScore++; state.totalStars++; state.todayStars++;
    state.skills[currentMode] = Math.min(100,(state.skills[currentMode]||0)+4);

    if(currentMode === "filipino"){
      $("#feedback").innerHTML="🎉 Magaling! Tama ang sagot mo!";
      speak("Magaling! Tama ang sagot mo!", "filipino");
    }else{
      $("#feedback").innerHTML="🎉 Great job! You got it!";
      speak("Great job! You got it!", "english");
    }
    celebrate();
  } else {
    if(currentMode === "filipino"){
      $("#feedback").innerHTML=`🌟 Magandang subok! Ang tamang sagot ay <b>${q.choices[q.correct]}</b>.`;
      speak("Magandang subok! Subukan nating tandaan ang tamang sagot.", "filipino");
    }else{
      $("#feedback").innerHTML=`🌟 Good try! The answer is <b>${q.choices[q.correct]}</b>.`;
      speak("Good try! Let us remember the correct answer.", "english");
    }
  }
  save();
  const btn=document.createElement("button");
  btn.className="primary next-btn"; btn.textContent="Next ➜";
  btn.onclick=()=>{qIndex++;renderQuestion()};
  $("#feedback").appendChild(document.createElement("br")); $("#feedback").appendChild(btn);
}

function finishLesson(){
  state.sessions++;
  state.skills[currentMode]=Math.min(100,(state.skills[currentMode]||0)+3);
  save();
  const max=questions.length;
  $("#lessonStage").innerHTML=`
    <div class="big-symbol">🏆</div>
    <h2>Adventure Complete!</h2>
    <p class="prompt">You earned <b>${lessonScore} out of ${max} stars</b>! ⭐</p>
    <p>${lessonScore===max ? "Amazing work! 🌈" : "Wonderful effort! Practice makes us stronger. 💪"}</p>
    <button id="againBtn" class="primary big">Play Again 🎮</button>
    <button id="homeAfterBtn" class="secondary" style="margin-top:10px">Go Home</button>
  `;
  celebrate();
  if(currentMode === "filipino"){
    speak(`Tapos na ang ating gawain. Nakakuha ka ng ${lessonScore} na bituin. Magaling!`, "filipino");
  }else{
    speak(`Adventure complete. You earned ${lessonScore} stars. Great job!`, "english");
  }
  $("#againBtn").onclick=()=>startLesson(currentMode);
  $("#homeAfterBtn").onclick=()=>showView("#homeView");
}

function startDaily(){
  const sequence=["english","filipino","math","story","thinking"];
  const pick=sequence[Math.floor(Math.random()*sequence.length)];
  startLesson(pick);
}

$("#startDailyBtn").onclick=startDaily;
$$(".lesson-card").forEach(b=>b.onclick=()=>startLesson(b.dataset.mode));
$("#backBtn").onclick=()=>showView("#homeView");
$("#parentBtn").onclick=()=>{updateHome();showView("#parentView")};
$("#parentBackBtn").onclick=()=>showView("#homeView");
$("#saveProfile").onclick=()=>{
  state.name=$("#learnerName").value.trim()||"Super Learner";
  state.dailyGoal=Number($("#dailyGoal").value);
  save(); alert("Profile saved! ⭐");
};
$("#voiceToggle").onchange=e=>{state.voice=e.target.checked;save()};
$("#celebrateToggle").onchange=e=>{state.celebrate=e.target.checked;save()};
$("#resetProgress").onclick=()=>{
  if(confirm("Reset all learning progress on this iPad and the connected cloud profile?")){
    state={...defaults,skills:{...defaults.skills},updatedAt:Date.now()};
    save();
    updateHome();
  }
};

$("#syncNowBtn").onclick = async () => {
  await syncNow();
};

updateHome();
setCloudUI("connecting","Checking Firebase connection…");
initFirebaseCloud();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
