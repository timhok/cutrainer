(function () {
  "use strict";

  var state = {
    mode: "Medical",
    total: 0,
    correct: 0,
    incorrect: 0,
    score: 0,
    current: null,
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

  function nextRound() {
    state.locked = false;
    el.feedback.textContent = " ";
    el.feedback.className = "feedback";

    var p = pool();
    var prev = state.current;
    var answer = p[Math.floor(Math.random() * p.length)];
    // avoid showing the same item two rounds in a row
    while (p.length > 1 && answer === prev) {
      answer = p[Math.floor(Math.random() * p.length)];
    }
    state.current = answer;

    var distractors = sample(p, 2, answer);
    var options = shuffle([answer].concat(distractors));

    el.icon.src = answer.file;
    el.icon.alt = answer.name;

    el.choices.innerHTML = "";
    options.forEach(function (opt) {
      var b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = opt.name;
      b.addEventListener("click", function () { guess(opt, b, options); });
      el.choices.appendChild(b);
    });
  }

  function guess(opt, btn, options) {
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

    var buttons = el.choices.querySelectorAll(".choice");
    buttons.forEach(function (b) {
      b.disabled = true;
      if (b.textContent === state.current.name) b.classList.add("correct");
      else if (b === btn) b.classList.add("wrong");
    });

    render();
    setTimeout(nextRound, isCorrect ? 650 : 1200);
  }

  function render() {
    el.total.textContent = state.total;
    el.correct.textContent = state.correct;
    el.incorrect.textContent = state.incorrect;
    el.score.textContent = state.score;
  }

  function reset() {
    state.total = state.correct = state.incorrect = state.score = 0;
    render();
    nextRound();
  }

  el.reset.addEventListener("click", reset);

  el.modes.addEventListener("click", function (e) {
    var btn = e.target.closest(".mode");
    if (!btn) return;
    state.mode = btn.getAttribute("data-mode");
    var all = el.modes.querySelectorAll(".mode");
    all.forEach(function (m) { m.classList.toggle("active", m === btn); });
    reset();
  });

  // init
  el.modes.querySelector('[data-mode="Medical"]').classList.add("active");
  render();
  nextRound();
})();
