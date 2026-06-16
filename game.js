(function () {
  "use strict";

  // --- Spaced repetition (Leitner) settings ---------------------------------
  // Each item lives in a "box" (0 = struggling, higher = well known).
  // BOX_INTERVAL[box] = how many rounds before that item is due to show again.
  // Wrong -> box 0 (comes back almost immediately). Right -> box+1 (pushed out).
  var BOX_INTERVAL = [1, 3, 6, 11, 18, 28];
  var MAX_BOX = BOX_INTERVAL.length - 1;
  var STORE_PREFIX = "cuint0:";

  var state = {
    mode: "Medical",
    round: 0,
    total: 0,
    correct: 0,
    incorrect: 0,
    score: 0,
    deck: [],          // [{item, box, due}]
    current: null,     // current item
    currentEntry: null,
    locked: false
  };

  var el = {
    icon: document.getElementById("icon"),
    choices: document.getElementById("choices"),
    feedback: document.getElementById("feedback"),
    total: document.getElementById("total"),
    correct: document.getElementById("correct"),
    incorrect: document.getElementById("incorrect"),
    score: document.getElementById("score"),
    reset: document.getElementById("reset"),
    modes: document.getElementById("modes")
  };

  function pool() {
    return ITEMS.filter(function (it) { return it.group === state.mode; });
  }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sample(arr, n, exclude) {
    var out = [];
    var bag = shuffle(arr);
    for (var i = 0; i < bag.length && out.length < n; i++) {
      if (bag[i] !== exclude && out.indexOf(bag[i]) === -1) out.push(bag[i]);
    }
    return out;
  }

  // --- persistence ----------------------------------------------------------
  function save() {
    try {
      var data = {
        round: state.round,
        total: state.total,
        correct: state.correct,
        incorrect: state.incorrect,
        score: state.score,
        boxes: {}
      };
      state.deck.forEach(function (e) {
        data.boxes[e.item.name] = { box: e.box, due: e.due };
      });
      localStorage.setItem(STORE_PREFIX + state.mode, JSON.stringify(data));
    } catch (e) { /* storage unavailable; ignore */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_PREFIX + state.mode);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // --- deck building --------------------------------------------------------
  function buildDeck(saved) {
    var boxes = (saved && saved.boxes) || {};
    state.deck = pool().map(function (it) {
      var s = boxes[it.name];
      return { item: it, box: s ? s.box : 0, due: s ? s.due : 0 };
    });
    state.round = (saved && saved.round) || 0;
    state.total = (saved && saved.total) || 0;
    state.correct = (saved && saved.correct) || 0;
    state.incorrect = (saved && saved.incorrect) || 0;
    state.score = (saved && saved.score) || 0;
  }

  // Pick the most "overdue" item (smallest due), least-known first, random tie.
  function pickEntry() {
    var prev = state.currentEntry;
    var cand = state.deck.filter(function (e) { return e !== prev; });
    cand.sort(function (a, b) {
      return (a.due - b.due) || (a.box - b.box) || (Math.random() - 0.5);
    });
    return cand[0];
  }

  function schedule(entry, correct) {
    if (correct) {
      entry.box = Math.min(entry.box + 1, MAX_BOX);
    } else {
      entry.box = 0;
    }
    // jitter (0..1) so items don't lock into a fixed cadence
    entry.due = state.round + BOX_INTERVAL[entry.box] + Math.floor(Math.random() * 2);
  }

  // --- round flow -----------------------------------------------------------
  function nextRound() {
    state.locked = false;
    el.feedback.textContent = " ";
    el.feedback.className = "feedback";

    state.round++;
    var entry = pickEntry();
    state.currentEntry = entry;
    state.current = entry.item;
    var answer = entry.item;

    var distractors = sample(pool(), 2, answer);
    var options = shuffle([answer].concat(distractors));

    el.icon.src = answer.file;
    el.icon.alt = answer.name;

    el.choices.innerHTML = "";
    options.forEach(function (opt) {
      var b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = opt.name;
      b.addEventListener("click", function () { guess(opt, b); });
      el.choices.appendChild(b);
    });
  }

  function guess(opt, btn) {
    if (state.locked) return;
    state.locked = true;

    var isCorrect = opt === state.current;
    state.total++;
    if (isCorrect) {
      state.correct++;
      state.score++;
      el.feedback.textContent = "Correct! · Верно!";
      el.feedback.className = "feedback ok";
    } else {
      state.incorrect++;
      state.score--;
      el.feedback.textContent = "Wrong: " + state.current.name + " · Неверно";
      el.feedback.className = "feedback bad";
    }

    schedule(state.currentEntry, isCorrect);

    var buttons = el.choices.querySelectorAll(".choice");
    buttons.forEach(function (b) {
      b.disabled = true;
      if (b.textContent === state.current.name) b.classList.add("correct");
      else if (b === btn) b.classList.add("wrong");
    });

    render();
    save();
    setTimeout(nextRound, isCorrect ? 650 : 1200);
  }

  function render() {
    el.total.textContent = state.total;
    el.correct.textContent = state.correct;
    el.incorrect.textContent = state.incorrect;
    el.score.textContent = state.score;
  }

  // load saved progress for the current mode (or start fresh)
  function loadMode() {
    state.currentEntry = null;
    state.current = null;
    buildDeck(load());
    render();
    nextRound();
  }

  // wipe progress for the current mode
  function reset() {
    try { localStorage.removeItem(STORE_PREFIX + state.mode); } catch (e) {}
    state.currentEntry = null;
    state.current = null;
    buildDeck(null);
    render();
    nextRound();
  }

  el.reset.addEventListener("click", reset);

  el.modes.addEventListener("click", function (e) {
    var btn = e.target.closest(".mode");
    if (!btn || btn.getAttribute("data-mode") === state.mode) return;
    state.mode = btn.getAttribute("data-mode");
    el.modes.querySelectorAll(".mode").forEach(function (m) {
      m.classList.toggle("active", m === btn);
    });
    loadMode();
  });

  // init
  el.modes.querySelector('[data-mode="Medical"]').classList.add("active");
  loadMode();
})();
