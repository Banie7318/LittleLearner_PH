
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const defaults = {
  name: "Super Learner",
  totalStars: 0,
  sessions: 0,
  streak: 0,
  lastDay: "",
  todayStars: 0,
  dailyGoal: 15,
  voice: true,
  celebrate: true,
  skills: { english:0, filipino:0, math:0, story:0, thinking:0, review:0 }
};
let state = {...defaults, ...(JSON.parse(localStorage.getItem("littleLearnerPH"))||{})};
state.skills = {...defaults.skills, ...(state.skills||{})};
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
    {icon:"👧", title:"Pantig: BA + TA", say:"Ba. Ta. Bata.", prompt:"Ano ang mabubuo sa BA + TA?", choices:["BATA 👧","BOLA ⚽","PUSA 🐱","ISDA 🐟"], correct:0},
    {icon:"🏠", title:"Salitang BAHAY", say:"Ba-hay. Bahay.", prompt:"Alin ang BAHAY?", choices:["🏠 Bahay","🐶 Aso","🥭 Mangga","🚗 Kotse"], correct:0},
    {icon:"🐱", title:"PUSA", say:"Pu-sa. Pusa.", prompt:"Anong hayop ang PUSA?", choices:["🐱","🐶","🐟","🐦"], correct:0},
    {icon:"⚽", title:"Maikling Pangungusap", say:"May bola si Ana.", prompt:"Ano ang mayroon si Ana?", choices:["Bola ⚽","Aklat 📘","Isda 🐟","Payong ☂️"], correct:0}
  ],
  math: [
    {icon:"🍎 🍎 🍎", title:"Let’s Count!", say:"One, two, three apples.", prompt:"How many apples?", choices:["3","2","4","1"], correct:0},
    {icon:"⭐ ⭐ + ⭐", title:"Addition", say:"Two stars plus one star equals three stars.", prompt:"2 + 1 = ?", choices:["3","4","2","1"], correct:0},
    {icon:"🐤 🐤 🐤", title:"Take One Away", say:"Three birds. One flies away. Two are left.", prompt:"3 - 1 = ?", choices:["2","3","1","4"], correct:0},
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
    {icon:"🇵🇭", title:"Pantig Review", say:"Ma plus ma is mama.", prompt:"MA + MA = ?", choices:["MAMA","BATA","PUSA","BOLA"], correct:0},
    {icon:"🔢", title:"Math Review", say:"Four minus one is three.", prompt:"4 - 1 = ?", choices:["3","2","4","5"], correct:0}
  ]
};

function save(){ localStorage.setItem("littleLearnerPH", JSON.stringify(state)); updateHome(); }
function showView(id){ $$(".view").forEach(v=>v.classList.remove("active")); $(id).classList.add("active"); window.scrollTo(0,0); }
function todayKey(){ return new Date().toISOString().slice(0,10); }

function updateStreak(){
  const t = todayKey();
  if(state.lastDay === t) return;
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  state.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
  state.lastDay = t;
  state.todayStars = 0;
}

function updateHome(){
  updateStreak();
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

function speak(text){
  if(!state.voice || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = .78; u.pitch = 1.12;
  speechSynthesis.speak(u);
}
function celebrate(){
  if(!state.celebrate) return;
  const el = $("#celebration"); el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),800);
}

function startLesson(mode){
  currentMode = mode; lessonScore=0; qIndex=0;
  questions = [...lessonBanks[mode]].sort(()=>Math.random()-.5);
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
    $("#feedback").innerHTML="🎉 Great job! You got it!";
    speak("Great job! You got it!");
    celebrate();
  } else {
    $("#feedback").innerHTML=`🌟 Good try! The answer is <b>${q.choices[q.correct]}</b>.`;
    speak("Good try! Let us remember the correct answer.");
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
  speak(`Adventure complete. You earned ${lessonScore} stars. Great job!`);
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
  if(confirm("Reset all learning progress?")){
    state={...defaults,skills:{...defaults.skills}}; save(); updateHome();
  }
};

updateHome();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
