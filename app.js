"use strict";

// EDIT ME: which app key this app attributes on the consent screen.
// Create your own at https://enter.pollinations.ai/keys -> "Create New App Key".
// It is publishable by design, like an OAuth client_id, so it is safe here.
const CLIENT_ID = "pk_bE5A9uWPv1IpL5a0";
const GEN = "https://gen.pollinations.ai";
const STORE = { token: "jev_lab_token", expires: "jev_lab_expires", device: "jev_lab_device" };

const $ = (id) => document.getElementById(id);

// --- Scenarios ---------------------------------------------------------------
// Every scenario is phrased so one request can ask all three Jev primitives:
// a choice (act or not), a score (how acceptable acting is) and a noul
// (whether acting saves net lives).
function leverState(saved, dies) {
  return (
    "A runaway trolley is heading toward " +
    numPhrase(saved) +
    " people tied to the track" +
    (saved === 1 ? "" : "s") +
    ". You can pull a lever to divert it onto a side track where " +
    numPhrase(dies) +
    (dies === 1 ? " person is tied" : " people are tied") +
    ". Nothing else is at risk and no other option exists."
  );
}

function numPhrase(n) {
  const words = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 10: "ten", 100: "a hundred" };
  return words[n] || String(n);
}

const LEVER_FAMILY = [1, 2, 3, 4, 5, 10, 100];

function leverScenario(saved, dies) {
  return {
    id: "lever-" + saved + "-" + dies,
    tally: numPhrase(saved) + " vs " + numPhrase(dies),
    name: saved === 5 && dies === 1 ? "The classic" : numPhrase(saved) + " on one track",
    hint: saved > dies ? "Pull and fewer die" : saved === dies ? "Even trade" : "Pull and more die",
    action: "pulling",
    state: leverState(saved, dies),
    verdictQ: "Should you pull the lever?",
    pull: "Pull the lever: the trolley diverts, " + numPhrase(saved) + " are saved and " + numPhrase(dies) + " dies",
    stay: "Do nothing: the trolley keeps going, " + numPhrase(saved) + " die and " + numPhrase(dies) + " survives",
    noulQ: "Does pulling the lever save more lives than it costs?",
    noulTrue: "Pulling saves a net number of lives",
    noulFalse: "Pulling costs a net number of lives",
  };
}

const SCENARIOS = [
  leverScenario(5, 1),
  leverScenario(1, 1),
  leverScenario(100, 1),
  {
    id: "loop",
    tally: "the loop",
    name: "The loop track",
    hint: "The one person stops it this time",
    action: "pulling",
    state:
      "A runaway trolley is heading toward five people tied to the track. You can pull a lever to divert it onto a looped side track. One person is tied to that loop; the trolley will kill them and then come to a stop. If you pull, the five are saved and the one dies. If you do nothing, the five die and the one survives.",
    verdictQ: "Should you pull the lever onto the loop track?",
    pull: "Pull the lever: the one person on the loop stops the trolley and the five are saved",
    stay: "Do nothing: the trolley keeps going and the five die",
    noulQ: "Does pulling the lever save more lives than it costs?",
    noulTrue: "Pulling saves a net number of lives",
    noulFalse: "Pulling costs a net number of lives",
  },
  {
    id: "bystander",
    tally: "the bridge",
    name: "The bystander",
    hint: "No lever — you are the instrument",
    action: "pushing",
    state:
      "A runaway trolley is heading toward five people tied to the track. You are standing on a bridge above with a large stranger. Pushing that one stranger off the bridge onto the track would stop the trolley and save the five, but the stranger would die. No one else is close enough to push.",
    verdictQ: "Should you push the stranger off the bridge?",
    pull: "Push the stranger: the trolley stops and the five are saved, the stranger dies",
    stay: "Do nothing: the trolley keeps going and the five die",
    noulQ: "Does pushing the stranger save more lives than it costs?",
    noulTrue: "Pushing saves a net number of lives",
    noulFalse: "Pushing costs a net number of lives",
  },
  {
    id: "transplant",
    tally: "the surgeon",
    name: "The transplant",
    hint: "One patient becomes five donors",
    action: "operating",
    state:
      "Five patients will die today without transplants. Each needs a different organ. One healthy patient in your hospital is a match for all five. Harvesting that patient's organs would save the five but kill the healthy patient. No other donors will arrive in time.",
    verdictQ: "Should the surgeon harvest the healthy patient's organs?",
    pull: "Operate: harvest the healthy patient's organs and save the five",
    stay: "Do not operate: the healthy patient lives and the five die",
    noulQ: "Does harvesting the organs save more lives than it costs?",
    noulTrue: "Operating saves a net number of lives",
    noulFalse: "Operating costs a net number of lives",
  },
  {
    id: "driver",
    tally: "the driver",
    name: "The driver's dilemma",
    hint: "Your passenger is on the other track",
    action: "braking",
    state:
      "You are driving a trolley whose brakes have failed. Straight ahead five workers are tied to the track. Swerving onto the side track would kill the single worker there, but you have been told that track is where your own passenger has stepped off to check something. Swerving kills your passenger; staying the course kills the five workers.",
    verdictQ: "Should you swerve onto the side track?",
    pull: "Swerve: your passenger dies and the five workers are saved",
    stay: "Stay the course: the five workers die and your passenger survives",
    noulQ: "Does swerving save more lives than it costs?",
    noulTrue: "Swerving saves a net number of lives",
    noulFalse: "Swerving costs a net number of lives",
  },
];

const SCORE_LEVELS = ["Clearly wrong", "Somewhat wrong", "Genuinely ambiguous", "Somewhat right", "Clearly right"];

// --- BYOP device flow ---------------------------------------------------------
function hasToken() {
  const value = sessionStorage.getItem(STORE.token);
  if (!value) return false;
  const expires = Number(sessionStorage.getItem(STORE.expires)) || 0;
  if (expires && Date.now() > expires) {
    signOut();
    return false;
  }
  return true;
}

function signOut() {
  sessionStorage.removeItem(STORE.token);
  sessionStorage.removeItem(STORE.expires);
  sessionStorage.removeItem(STORE.device);
  syncAccountUi();
}

function syncAccountUi() {
  const signedIn = hasToken();
  $("signOutBtn").classList.toggle("hidden", !signedIn);
  $("accountLabel").classList.toggle("hidden", !signedIn);
  if (signedIn) $("accountLabel").textContent = "Signed in — paying with your own Pollen";
}

function setError(id, message) {
  const el = $(id);
  el.textContent = message || "";
  el.classList.toggle("hidden", !message);
}

async function requestDeviceCode() {
  const res = await fetch(GEN.replace("gen.", "enter.") + "/api/device/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error("Could not start sign-in (" + res.status + ").");
  if (!data.device_code) throw new Error("Pollinations returned no device code.");
  sessionStorage.setItem(STORE.device, data.device_code);
  return data;
}

async function pollForToken(deviceCode, intervalSeconds) {
  let interval = (intervalSeconds || 5) * 1000;
  const deadline = Date.now() + 30 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const res = await fetch(GEN.replace("gen.", "enter.") + "/api/device/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_code: deviceCode, client_id: CLIENT_ID }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.access_token) {
      sessionStorage.setItem(STORE.token, data.access_token);
      const lifetime = Number(data.expires_in) || 7 * 24 * 3600;
      sessionStorage.setItem(STORE.expires, String(Date.now() + lifetime * 1000));
      sessionStorage.removeItem(STORE.device);
      return data.access_token;
    }
    const error = data && data.error;
    if (error === "authorization_pending") continue;
    if (error === "slow_down") {
      interval += 5000;
      continue;
    }
    if (error === "expired_token") throw new Error("That code expired. Start sign-in again.");
    if (error === "access_denied") throw new Error("Authorisation was declined.");
    throw new Error("Sign-in failed: " + (error || "unexpected reply") + ".");
  }
  throw new Error("Timed out waiting for approval.");
}

async function startSignIn() {
  setError("signInError", "");
  const btn = $("startBtn");
  btn.disabled = true;
  try {
    const code = await requestDeviceCode();
    $("deviceLink").href = code.verification_uri_complete;
    $("deviceLink").textContent = code.verification_uri_complete;
    $("deviceStep").classList.remove("hidden");
    $("deviceStatus").textContent = "Waiting for approval...";
    window.open(code.verification_uri_complete, "_blank", "noopener");
    await pollForToken(code.device_code, code.interval);
    enterApp();
  } catch (err) {
    setError("signInError", err.message);
    $("deviceStep").classList.add("hidden");
  } finally {
    btn.disabled = false;
  }
}

// --- Jev ----------------------------------------------------------------------
function authHeaders() {
  return { Authorization: "Bearer " + sessionStorage.getItem(STORE.token) };
}

function questionsFor(scenario) {
  return {
    verdict: {
      type: "choice",
      instructions: scenario.verdictQ,
      criteria: { pull: scenario.pull, stay: scenario.stay },
    },
    acceptable: {
      type: "score",
      instructions: "How morally acceptable is " + scenario.action + "?",
      criteria: SCORE_LEVELS,
    },
    net: {
      type: "noul",
      instructions: scenario.noulQ,
      criteria: { "true": scenario.noulTrue, "false": scenario.noulFalse },
    },
  };
}

async function askJev(scenario) {
  const res = await fetch(GEN + "/alpha/decisions", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ state: scenario.state, model: "jev", questions: questionsFor(scenario) }),
  });
  const data = await res.json().catch(() => null);
  if (res.status === 402) {
    throw new Error("Jev runs on Paid Pollen — top up at enter.pollinations.ai and try again.");
  }
  if (res.status === 429) {
    throw new Error("Jev is rate limited for a moment. Try again shortly.");
  }
  if (!res.ok || !data || !data.answers) {
    throw new Error("Jev did not answer (" + res.status + ").");
  }
  return data.answers;
}

// --- Rendering ----------------------------------------------------------------
function renderResults(scenario, answers, userVote) {
  const v = answers.verdict;
  const pullP = (v.probabilities && v.probabilities.pull) || 0;
  const stayP = (v.probabilities && v.probabilities.stay) || 0;
  const pulled = v.choice === "pull";

  const badge = $("verdictBadge");
  badge.textContent = pulled ? "PULL" : "STAY";
  badge.classList.toggle("stay", !pulled);
  $("verdictProb").textContent = Math.round((pulled ? pullP : stayP) * 100) + "% for " + v.choice;
  $("verdictConfidence").textContent = "confidence " + Math.round((v.confidence || 0) * 100) + "%";
  $("actionWord").textContent = scenario.action;

  const bars = $("verdictBars");
  bars.innerHTML = "";
  for (const [label, pct, isStay] of [["pull", pullP, false], ["stay", stayP, true]]) {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML =
      '<span class="lbl">' + label + '</span>' +
      '<div class="bar"><div class="fill' + (isStay ? " stay" : "") + '" style="width:' + pct * 100 + '%"></div></div>' +
      '<span class="pct">' + Math.round(pct * 100) + "%</span>";
    bars.appendChild(row);
  }

  const agree = $("agreementLine");
  if (userVote) {
    const same = (userVote === "pull") === pulled;
    agree.textContent = same
      ? "You and Jev agree — you would " + userVote + ", and so does Jev."
      : "You and Jev disagree — you would " + userVote + ", Jev says " + v.choice + " with " + Math.round((pulled ? pullP : stayP) * 100) + "% probability.";
    agree.classList.toggle("disagree", !same);
    agree.classList.remove("hidden");
  } else {
    agree.classList.add("hidden");
  }

  const s = answers.acceptable;
  const rungs = $("scoreRungs");
  rungs.innerHTML = "";
  const probs = s.probabilities || {};
  for (let i = 0; i < SCORE_LEVELS.length; i++) {
    const p = probs[String(i)] || 0;
    const rung = document.createElement("div");
    rung.className = "rung";
    rung.innerHTML =
      '<span class="pct">' + Math.round(p * 100) + "%</span>" +
      '<div class="col" style="height:100%"><div class="fillbar" style="height:' + Math.max(4, p * 100) + '%"></div></div>' +
      '<span class="lbl">' + SCORE_LEVELS[i] + "</span>";
    rungs.appendChild(rung);
  }
  $("scoreValue").textContent =
    "probability-weighted score " + (s.score != null ? s.score.toFixed(2) : "?") + " across the five rungs (confidence " + Math.round((s.confidence || 0) * 100) + "%)";

  const n = answers.net.noul || 0;
  $("noulFill").style.width = n * 100 + "%";
  $("noulLine").textContent =
    "Jev gives P(" + scenario.action + " saves net lives) = " + Math.round(n * 100) + "%";

  $("results").dataset.summary =
    "Jev Trolley Lab — " + scenario.name + "\n" +
    scenario.state + "\n\n" +
    "Your verdict: " + (userVote || "(not given)") + "\n" +
    "Jev: " + v.choice.toUpperCase() + " (" + Math.round((pulled ? pullP : stayP) * 100) + "%, confidence " + Math.round((v.confidence || 0) * 100) + "%)\n" +
    "Probabilities: pull " + Math.round(pullP * 100) + "%, stay " + Math.round(stayP * 100) + "%\n" +
    "Moral acceptability: " + (s.score != null ? s.score.toFixed(2) : "?") + "/4 — " + SCORE_LEVELS[Math.min(4, Math.round(s.score || 0))] + "\n" +
    "P(net lives saved) = " + Math.round(n * 100) + "%\n" +
    "Powered by Jev (typesafe/jev-1.13) on Pollinations";

  $("results").classList.remove("hidden");
}

// --- The moral curve ------------------------------------------------------------
function renderChart(points) {
  const svg = $("chart");
  svg.innerHTML = "";
  const W = 640, H = 300, padL = 46, padB = 42, padT = 18, padR = 16;
  const iw = W - padL - padR, ih = H - padT - padB;
  const ns = "http://www.w3.org/2000/svg";

  function el(name, attrs, text) {
    const e = document.createElementNS(ns, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    svg.appendChild(e);
    return e;
  }

  el("line", { x1: padL, y1: padT, x2: padL, y2: padT + ih, stroke: "#cbd5e1", "stroke-width": 1 });
  el("line", { x1: padL, y1: padT + ih, x2: padL + iw, y2: padT + ih, stroke: "#cbd5e1", "stroke-width": 1 });

  for (const g of [0, 0.5, 1]) {
    const y = padT + ih - g * ih;
    el("line", { x1: padL, y1: y, x2: padL + iw, y2: y, stroke: "#eef2f7", "stroke-width": 1 });
    el("text", { x: padL - 8, y: y + 4, "text-anchor": "end", "font-size": 11, fill: "#64748b" }, Math.round(g * 100) + "%");
  }
  el("text", { x: 12, y: padT + ih / 2, "font-size": 11, fill: "#64748b", transform: "rotate(-90 12 " + (padT + ih / 2) + ")", "text-anchor": "middle" }, "P(pull)");

  const step = points.length > 1 ? iw / (points.length - 1) : 0;
  let d = "";
  points.forEach((pt, i) => {
    const x = padL + i * step;
    const y = padT + ih - pt.pPull * ih;
    d += (i === 0 ? "M" : "L") + x + " " + y + " ";
    el("circle", { cx: x, cy: y, r: 4.5, fill: "#d97706" });
    el("text", { x: x, y: H - 24, "text-anchor": "middle", "font-size": 11, fill: "#64748b" }, pt.label);
    el("text", { x: x, y: y - 10, "text-anchor": "middle", "font-size": 11, fill: "#92400e" }, Math.round(pt.pPull * 100) + "%");
  });
  el("path", { d: d.trim(), fill: "none", stroke: "#d97706", "stroke-width": 2 });
  el("text", { x: padL + iw / 2, y: H - 6, "text-anchor": "middle", "font-size": 11.5, fill: "#64748b" }, "lives saved on the side track");
  $("chartWrap").classList.remove("hidden");
}

async function runGauntlet() {
  const btn = $("gauntletBtn");
  const status = $("gauntletStatus");
  btn.disabled = true;
  const points = [];
  try {
    for (let i = 0; i < LEVER_FAMILY.length; i++) {
      const saved = LEVER_FAMILY[i];
      status.textContent = "running " + (i + 1) + "/" + LEVER_FAMILY.length + " — " + numPhrase(saved) + " vs one…";
      const answers = await askJev(leverScenario(saved, 1));
      points.push({
        label: saved + ":1",
        pPull: (answers.verdict.probabilities && answers.verdict.probabilities.pull) || 0,
        choice: answers.verdict.choice,
        confidence: answers.verdict.confidence,
      });
    }
    status.textContent = "";
    renderChart(points);
    window.gauntletPoints = points;
  } catch (err) {
    setError("appError", err.message);
  } finally {
    btn.disabled = false;
  }
}

// --- Wiring --------------------------------------------------------------------
let current = SCENARIOS[0];
let userVote = null;
let demoMode = false;

function selectScenario(s) {
  current = s;
  userVote = null;
  document.querySelectorAll(".scenario").forEach((b) =>
    b.classList.toggle("selected", b.dataset.id === s.id),
  );
  $("scenarioState").textContent = s.state;
  $("yourVoteLine").classList.add("hidden");
  $("votePull").classList.remove("chosen");
  $("voteStay").classList.remove("chosen");
  $("results").classList.add("hidden");
  setError("appError", "");
}

function vote(choice) {
  userVote = choice;
  $("votePull").classList.toggle("chosen", choice === "pull");
  $("voteStay").classList.toggle("chosen", choice === "stay");
  const line = $("yourVoteLine");
  line.textContent = choice === "pull" ? "You would pull. Now ask Jev." : "You would do nothing. Now ask Jev.";
  line.classList.remove("hidden");
}

async function ask() {
  setError("appError", "");
  const btn = $("askBtn");
  btn.disabled = true;
  btn.textContent = "Jev is deciding…";
  try {
    const answers = await askJev(current);
    renderResults(current, answers, userVote);
  } catch (err) {
    setError("appError", err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Ask Jev";
  }
}

function enterApp() {
  syncAccountUi();
  $("screenSignIn").classList.add("hidden");
  $("screenApp").classList.remove("hidden");
}

async function enterDemo() {
  // The preview loads committed answers, so it never calls the API and spends
  // nothing. It shows the classic scenario plus the full moral curve.
  demoMode = true;
  enterApp();
  $("accountLabel").textContent = "Preview — sign in to run Jev yourself";
  $("accountLabel").classList.remove("hidden");
  $("askBtn").disabled = true;
  $("gauntletBtn").disabled = true;
  $("gauntletStatus").textContent = "Preview shows a committed run; sign in to run your own.";
  try {
    const res = await fetch("demo-results.json");
    const demo = await res.json();
    const classic = SCENARIOS.find((s) => s.id === demo.scenarioId) || SCENARIOS[0];
    selectScenario(classic);
    renderResults(classic, demo.answers, null);
    $("yourVoteLine").classList.add("hidden");
    if (demo.gauntlet && demo.gauntlet.length) {
      renderChart(demo.gauntlet);
    }
  } catch (err) {
    setError("appError", "Preview could not load (" + err.message + ").");
  }
}

function init() {
  const list = $("scenarioList");
  for (const s of SCENARIOS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "scenario";
    b.dataset.id = s.id;
    b.innerHTML =
      '<span class="tally">' + s.tally + '</span>' +
      '<span class="name">' + s.name + "</span>" +
      '<span class="hint">' + s.hint + "</span>";
    b.addEventListener("click", () => selectScenario(s));
    list.appendChild(b);
  }
  selectScenario(SCENARIOS[0]);

  $("startBtn").addEventListener("click", startSignIn);
  $("signOutBtn").addEventListener("click", () => {
    signOut();
    $("screenApp").classList.add("hidden");
    $("screenSignIn").classList.remove("hidden");
  });
  $("votePull").addEventListener("click", () => vote("pull"));
  $("voteStay").addEventListener("click", () => vote("stay"));
  $("askBtn").addEventListener("click", ask);
  $("gauntletBtn").addEventListener("click", runGauntlet);
  $("copyBtn").addEventListener("click", async () => {
    const text = $("results").dataset.summary || "";
    try {
      await navigator.clipboard.writeText(text);
      $("copyBtn").textContent = "Copied";
      setTimeout(() => ($("copyBtn").textContent = "Copy the result"), 1500);
    } catch {
      setError("appError", "Clipboard unavailable in this browser.");
    }
  });

  syncAccountUi();

  if (new URLSearchParams(location.search).get("demo") === "1") {
    enterDemo();
    return;
  }

  if (hasToken()) enterApp();
}

init();
