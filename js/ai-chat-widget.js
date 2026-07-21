/*!
 * Edu Abroad Limited — AI Live Chat Widget + "Annie" Cute Robot Popup
 * -----------------------------------------------------------------------
 * Self-contained, dependency-free widget that:
 *  1) Shows a small floating chat launcher on every page (bottom-right).
 *  2) After 1–2 minutes of cumulative time on the site, an adorable little
 *     robot named Annie peeks up over the bottom edge of the screen,
 *     glances around, then pops up fully with a playful greeting — teasing
 *     that she's noticed you've been browsing for a while — before
 *     introducing herself as Mr Johir Uddin's assistant and inviting the
 *     visitor to chat about Edu Abroad's programs.
 *  3) Clicking Annie (or the launcher) opens a live chat panel where a
 *     lightweight rule-based "AI" answers questions about destinations,
 *     universities, program levels (Honors/Masters/PhD), documents,
 *     eligibility, and how to book a consultation — all pulled live from
 *     window.EduAuth's real data, so answers always match the site.
 *
 * Drop <script src="js/ai-chat-widget.js"></script> on any page AFTER
 * js/app-data.js. No other setup required.
 */
(function () {
  "use strict";

  var ROBOT_SESSION_START_KEY = "eduai_session_start_v1";
  var ROBOT_SHOWN_KEY = "eduai_robot_shown_v1";
  var CHAT_HISTORY_KEY = "eduai_chat_history_v1";
  // Annie pops up somewhere between 1 and 2 minutes of cumulative browsing —
  // keeps things feeling natural instead of a robotic fixed timer. 😉
  var POPUP_DELAY_MS = (60 + Math.random() * 60) * 1000;

  /* ------------------------------- STYLES ------------------------------- */
  var css = "\n"
    + ".eduai-launcher{position:fixed;right:22px;bottom:22px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#1b3168,#00a2e8);box-shadow:0 10px 30px rgba(27,49,104,.35);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99997;border:none;transition:transform .25s ease;}\n"
    + ".eduai-launcher:hover{transform:scale(1.08);}\n"
    + ".eduai-launcher svg{width:28px;height:28px;}\n"
    + ".eduai-launcher .eduai-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;background:#39b54a;border-radius:50%;border:2px solid #fff;}\n"
    + "@media(max-width:640px){.eduai-launcher{right:16px;bottom:16px;width:54px;height:54px;}}\n"
    + ".eduai-robot-wrap{position:fixed;right:20px;bottom:96px;z-index:99998;display:flex;align-items:flex-end;gap:10px;animation:eduaiPop .45s cubic-bezier(.34,1.56,.64,1) both;}\n"
    + "@keyframes eduaiPop{from{opacity:0;transform:translateY(30px) scale(.85);}to{opacity:1;transform:translateY(0) scale(1);}}\n"
    + "@keyframes eduaiBob{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}\n"
    + ".eduai-robot-avatar{position:relative;width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:eduaiBob 2.4s ease-in-out infinite;cursor:pointer;font-size:30px;border:3px solid #00a2e8;padding:5px;box-sizing:border-box;}\n"
    + ".eduai-bubble{position:relative;max-width:250px;background:#fff;border-radius:16px;padding:14px 16px;box-shadow:0 12px 32px rgba(0,0,0,.16);font-family:'Roboto',system-ui,sans-serif;cursor:pointer;}\n"
    + ".eduai-bubble:after{content:'';position:absolute;right:-7px;bottom:18px;width:14px;height:14px;background:#fff;transform:rotate(45deg);box-shadow:3px -3px 6px -3px rgba(0,0,0,.06);}\n"
    + ".eduai-bubble p{margin:0;font-size:13.5px;line-height:1.5;color:#1a202c;}\n"
    + ".eduai-bubble .eduai-bname{font-weight:800;color:#1b3168;font-size:12px;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;display:block;}\n"
    + ".eduai-bubble-actions{display:flex;gap:8px;margin-top:10px;}\n"
    + ".eduai-bubble-actions button{border:none;cursor:pointer;font-weight:700;border-radius:9999px;padding:7px 14px;font-size:12px;}\n"
    + ".eduai-btn-primary{background:#1b3168;color:#fff;}\n"
    + ".eduai-btn-ghost{background:#f1f5f9;color:#64748b;}\n"
    + ".eduai-close-x{position:absolute;top:-8px;left:-8px;width:22px;height:22px;border-radius:50%;background:#94a3b8;color:#fff;border:2px solid #fff;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;}\n"
    + ".eduai-panel{position:fixed;right:20px;bottom:22px;z-index:99999;width:370px;max-width:calc(100vw - 32px);height:min(560px,calc(100vh - 100px));background:#fff;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;font-family:'Roboto',system-ui,sans-serif;}\n"
    + ".eduai-panel.eduai-open{display:flex;animation:eduaiPop .3s ease both;}\n"
    + ".eduai-head{background:linear-gradient(135deg,#1b3168,#00a2e8);color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;}\n"
    + ".eduai-head-avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;padding:3px;box-sizing:border-box;}\n"
    + ".eduai-head-text{flex:1;min-width:0;}\n"
    + ".eduai-head-text .t1{font-weight:800;font-size:14px;line-height:1.2;}\n"
    + ".eduai-head-text .t2{font-size:11.5px;opacity:.85;display:flex;align-items:center;gap:5px;margin-top:2px;}\n"
    + ".eduai-head-text .t2 i{width:7px;height:7px;border-radius:50%;background:#39b54a;display:inline-block;}\n"
    + ".eduai-head-close{cursor:pointer;background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}\n"
    + ".eduai-body{flex:1;overflow-y:auto;padding:16px;background:#f7f8fb;display:flex;flex-direction:column;gap:12px;}\n"
    + ".eduai-msg{max-width:84%;font-size:13.5px;line-height:1.55;padding:10px 13px;border-radius:14px;white-space:pre-line;}\n"
    + ".eduai-msg-bot{background:#fff;color:#1a202c;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.05);}\n"
    + ".eduai-msg-user{background:#1b3168;color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}\n"
    + ".eduai-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:2px;}\n"
    + ".eduai-chip{border:1px solid #dbe3f0;background:#fff;color:#1b3168;font-size:12px;font-weight:700;padding:6px 12px;border-radius:9999px;cursor:pointer;transition:.2s;}\n"
    + ".eduai-chip:hover{background:#1b3168;color:#fff;border-color:#1b3168;}\n"
    + ".eduai-typing{display:flex;gap:4px;padding:12px 14px;background:#fff;border-radius:14px;align-self:flex-start;box-shadow:0 2px 8px rgba(0,0,0,.05);}\n"
    + ".eduai-typing span{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:eduaiTyping 1.1s infinite ease-in-out;}\n"
    + ".eduai-typing span:nth-child(2){animation-delay:.15s;} .eduai-typing span:nth-child(3){animation-delay:.3s;}\n"
    + "@keyframes eduaiTyping{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-4px);opacity:1;}}\n"
    + ".eduai-foot{border-top:1px solid #eef0f4;padding:10px 12px;display:flex;gap:8px;align-items:center;flex-shrink:0;background:#fff;}\n"
    + ".eduai-input{flex:1;border:1px solid #e2e8f0;border-radius:9999px;padding:10px 16px;font-size:13.5px;outline:none;}\n"
    + ".eduai-input:focus{border-color:#00a2e8;}\n"
    + ".eduai-send{width:40px;height:40px;border-radius:50%;background:#1b3168;border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}\n"
    + ".eduai-send:hover{background:#00a2e8;}\n"
    + "@media(max-width:480px){.eduai-panel{right:12px;left:12px;width:auto;bottom:12px;height:min(72vh,560px);}.eduai-robot-wrap{right:12px;gap:6px;}.eduai-bubble{max-width:min(66vw,220px);padding:12px 14px;}.eduai-bubble p{font-size:12.5px;}.eduai-robot-avatar{width:46px;height:46px;}.eduai-peek-wrap{right:14px;}.eduai-peek-avatar{width:48px;height:48px;}.eduai-peek-tip{white-space:normal;max-width:140px;font-size:11px;text-align:right;}}\n"
    /* ---- Cute Annie robot face (used in header + popup) ---- */
    + ".eduai-robot-face{display:block;width:100%;height:100%;overflow:visible;}\n"
    + ".eduai-robot-face .eduai-eye{transform-box:fill-box;transform-origin:center;animation:eduaiBlink 3.4s infinite;}\n"
    + ".eduai-robot-face .eduai-eye2{animation-delay:0s;}\n"
    + "@keyframes eduaiBlink{0%,88%,100%{transform:scaleY(1);}92%{transform:scaleY(.12);}}\n"
    + ".eduai-robot-face .eduai-antenna-ball{transform-box:fill-box;transform-origin:center;animation:eduaiTwinkle 1.6s ease-in-out infinite;}\n"
    + "@keyframes eduaiTwinkle{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.55;transform:scale(1.25);}}\n"
    + ".eduai-head-avatar.eduai-cute,.eduai-robot-avatar.eduai-cute{padding:6px;background:linear-gradient(135deg,#ffe1f0,#dbeafe);border-color:#ffb6d5;}\n"
    /* ---- Peek-from-bottom sequence ---- */
    + ".eduai-peek-wrap{position:fixed;right:26px;bottom:0;z-index:99998;display:flex;flex-direction:column;align-items:flex-end;pointer-events:none;}\n"
    + ".eduai-peek-avatar{width:58px;height:58px;border-radius:50% 50% 4px 4px/50% 50% 4px 4px;background:#fff;box-shadow:0 -4px 18px rgba(0,0,0,.18);border:3px solid #00a2e8;padding:5px;box-sizing:border-box;pointer-events:auto;cursor:pointer;transform:translateY(78%);transition:transform .6s cubic-bezier(.34,1.56,.64,1);}\n"
    + ".eduai-peek-wrap.eduai-stage-look .eduai-peek-avatar{animation:eduaiLookAround 1.1s ease-in-out;}\n"
    + "@keyframes eduaiLookAround{0%,100%{transform:translateY(78%) rotate(0deg);}25%{transform:translateY(78%) rotate(-9deg);}75%{transform:translateY(78%) rotate(9deg);}}\n"
    + ".eduai-peek-wrap.eduai-stage-up .eduai-peek-avatar{transform:translateY(0);animation:eduaiBob 2.4s ease-in-out infinite;}\n"
    + ".eduai-peek-tip{margin:0 4px 10px 0;background:#fff;border-radius:14px;padding:8px 12px;font-family:'Roboto',system-ui,sans-serif;font-size:12.5px;font-weight:700;color:#1b3168;box-shadow:0 8px 20px rgba(0,0,0,.14);opacity:0;transform:translateY(8px) scale(.9);transition:all .35s ease;pointer-events:none;white-space:nowrap;}\n"
    + ".eduai-peek-wrap.eduai-stage-look .eduai-peek-tip,.eduai-peek-wrap.eduai-stage-up .eduai-peek-tip{opacity:1;transform:translateY(0) scale(1);}\n"
    + ".eduai-sparkle{position:absolute;font-size:14px;animation:eduaiSparkle 1.8s ease-in-out infinite;pointer-events:none;}\n"
    + "@keyframes eduaiSparkle{0%,100%{opacity:0;transform:translateY(0) scale(.6) rotate(0deg);}50%{opacity:1;transform:translateY(-14px) scale(1.1) rotate(20deg);}}\n"
    /* ---- Waving arm + delayed speech-bubble reveal ---- */
    + ".eduai-wave-arm{transform-origin:81px 92px;animation:eduaiWave 1.15s ease-in-out 2;}\n"
    + "@keyframes eduaiWave{0%,100%{transform:rotate(0deg);}20%{transform:rotate(-22deg);}45%{transform:rotate(16deg);}70%{transform:rotate(-14deg);}90%{transform:rotate(4deg);}}\n"
    + ".eduai-robot-wave-svg{overflow:visible;}\n"
    + ".eduai-bubble.eduai-bubble-wait{opacity:0;transform:translateY(10px) scale(.92);pointer-events:none;}\n"
    + ".eduai-bubble.eduai-bubble-visible{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;transition:opacity .4s ease,transform .4s cubic-bezier(.34,1.56,.64,1);}\n";

  var styleTag = document.createElement("style");
  styleTag.setAttribute("data-eduai", "true");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ------------------------------- ICONS -------------------------------- */
  var chatIconSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';

  /* Annie — full little robot body with a waving arm, used in the popup */
  var annieWaveSVG = ''
    + '<svg class="eduai-robot-face eduai-robot-wave-svg" viewBox="0 0 100 118" xmlns="http://www.w3.org/2000/svg">'
    + '  <defs><linearGradient id="eduaiFaceGrad2" x1="0" y1="0" x2="1" y2="1">'
    + '    <stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#c4b5fd"/>'
    + '  </linearGradient></defs>'
    + '  <rect x="30" y="86" width="40" height="26" rx="13" fill="#eef2f9"/>' // torso
    + '  <rect x="12" y="90" width="12" height="8" rx="4" fill="#eef2f9"/>' // left arm (resting)
    + '  <circle cx="10" cy="94" r="6" fill="#c4b5fd"/>' // left hand
    + '  <g class="eduai-wave-arm">'
    + '    <rect x="76" y="60" width="11" height="34" rx="5.5" fill="#eef2f9"/>'
    + '    <circle cx="82" cy="58" r="7" fill="#c4b5fd"/>' // waving hand
    + '  </g>'
    + '  <rect x="47" y="2" width="6" height="14" rx="3" fill="#cbd5e1"/>'
    + '  <circle class="eduai-antenna-ball" cx="50" cy="3" r="6" fill="#ff8fc0"/>'
    + '  <rect x="14" y="16" width="72" height="62" rx="24" fill="url(#eduaiFaceGrad2)"/>'
    + '  <ellipse class="eduai-eye" cx="37" cy="46" rx="7" ry="8" fill="#1b3168"/>'
    + '  <ellipse class="eduai-eye eduai-eye2" cx="63" cy="46" rx="7" ry="8" fill="#1b3168"/>'
    + '  <circle cx="37" cy="43" r="2" fill="#fff"/><circle cx="63" cy="43" r="2" fill="#fff"/>'
    + '  <circle cx="25" cy="57" r="6" fill="#ff8fc0" opacity=".55"/>'
    + '  <circle cx="75" cy="57" r="6" fill="#ff8fc0" opacity=".55"/>'
    + '  <path d="M36 62 Q50 72 64 62" stroke="#1b3168" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    + '</svg>';
  var annieFaceSVG = ''
    + '<svg class="eduai-robot-face" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    + '  <defs><linearGradient id="eduaiFaceGrad" x1="0" y1="0" x2="1" y2="1">'
    + '    <stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#c4b5fd"/>'
    + '  </linearGradient></defs>'
    + '  <rect x="47" y="6" width="6" height="16" rx="3" fill="#cbd5e1"/>'
    + '  <circle class="eduai-antenna-ball" cx="50" cy="7" r="6" fill="#ff8fc0"/>'
    + '  <rect x="14" y="20" width="72" height="62" rx="24" fill="url(#eduaiFaceGrad)"/>'
    + '  <ellipse class="eduai-eye" cx="37" cy="50" rx="7" ry="8" fill="#1b3168"/>'
    + '  <ellipse class="eduai-eye eduai-eye2" cx="63" cy="50" rx="7" ry="8" fill="#1b3168"/>'
    + '  <circle cx="37" cy="47" r="2" fill="#fff"/><circle cx="63" cy="47" r="2" fill="#fff"/>'
    + '  <circle cx="25" cy="61" r="6" fill="#ff8fc0" opacity=".55"/>'
    + '  <circle cx="75" cy="61" r="6" fill="#ff8fc0" opacity=".55"/>'
    + '  <path d="M36 66 Q50 76 64 66" stroke="#1b3168" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    + '</svg>';

  /* ------------------------------- MARKUP -------------------------------- */
  var launcher = document.createElement("button");
  launcher.className = "eduai-launcher";
  launcher.setAttribute("aria-label", "Chat with Edu Abroad AI Assistant");
  launcher.innerHTML = chatIconSVG + '<span class="eduai-dot"></span>';
  document.body.appendChild(launcher);

  var panel = document.createElement("div");
  panel.className = "eduai-panel";
  panel.innerHTML = ''
    + '<div class="eduai-head">'
    + '  <div class="eduai-head-avatar eduai-cute">' + annieFaceSVG + '</div>'
    + '  <div class="eduai-head-text">'
    + '    <div class="t1">Annie 🎀 · Mr Johir Uddin\'s AI Buddy</div>'
    + '    <div class="t2"><i></i> Online now — poke me with a question! 💬</div>'
    + '  </div>'
    + '  <button class="eduai-head-close" aria-label="Close chat">'
    + '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    + '  </button>'
    + '</div>'
    + '<div class="eduai-body" id="eduai-body"></div>'
    + '<div class="eduai-foot">'
    + '  <input type="text" class="eduai-input" id="eduai-input" placeholder="Type your question…" />'
    + '  <button class="eduai-send" id="eduai-send" aria-label="Send">'
    + '    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'
    + '  </button>'
    + '</div>';
  document.body.appendChild(panel);

  var bodyEl = panel.querySelector("#eduai-body");
  var inputEl = panel.querySelector("#eduai-input");
  var sendBtn = panel.querySelector("#eduai-send");
  var closeBtn = panel.querySelector(".eduai-head-close");

  var robotWrap = null;

  /* --------------------------- OPEN / CLOSE PANEL ------------------------- */
  function openPanel(seedMessage) {
    panel.classList.add("eduai-open");
    removeRobotPopup();
    if (!bodyEl.children.length) {
      renderHistoryOrGreeting();
    }
    if (seedMessage) {
      pushUserMessage(seedMessage);
      respondTo(seedMessage);
    }
    setTimeout(function () { inputEl.focus(); }, 150);
  }
  function closePanel() {
    panel.classList.remove("eduai-open");
  }
  launcher.addEventListener("click", function () { openPanel(); });
  closeBtn.addEventListener("click", closePanel);

  /* ------------------------------ MESSAGE UI ------------------------------ */
  function scrollToBottom() { bodyEl.scrollTop = bodyEl.scrollHeight + 999; }

  function addBotBubble(text, chips) {
    var wrap = document.createElement("div");
    var msg = document.createElement("div");
    msg.className = "eduai-msg eduai-msg-bot";
    msg.textContent = text;
    wrap.appendChild(msg);
    if (chips && chips.length) {
      var chipsWrap = document.createElement("div");
      chipsWrap.className = "eduai-chips";
      chips.forEach(function (c) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "eduai-chip";
        chip.textContent = c;
        chip.addEventListener("click", function () {
          pushUserMessage(c);
          respondTo(c);
        });
        chipsWrap.appendChild(chip);
      });
      wrap.appendChild(chipsWrap);
    }
    bodyEl.appendChild(wrap);
    scrollToBottom();
    saveHistory();
  }

  function addUserBubbleDom(text) {
    var msg = document.createElement("div");
    msg.className = "eduai-msg eduai-msg-user";
    msg.textContent = text;
    bodyEl.appendChild(msg);
    scrollToBottom();
  }

  function pushUserMessage(text) {
    addUserBubbleDom(text);
    saveHistory();
  }

  function showTyping(cb) {
    var t = document.createElement("div");
    t.className = "eduai-typing";
    t.innerHTML = "<span></span><span></span><span></span>";
    bodyEl.appendChild(t);
    scrollToBottom();
    setTimeout(function () {
      t.remove();
      cb();
    }, 550 + Math.random() * 400);
  }

  function saveHistory() {
    try {
      var msgs = [];
      bodyEl.querySelectorAll(".eduai-msg").forEach(function (el) {
        msgs.push({ who: el.classList.contains("eduai-msg-user") ? "user" : "bot", text: el.textContent });
      });
      sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(msgs));
    } catch (e) { /* storage may be unavailable — ignore */ }
  }

  function renderHistoryOrGreeting() {
    var restored = null;
    try { restored = JSON.parse(sessionStorage.getItem(CHAT_HISTORY_KEY) || "null"); } catch (e) { restored = null; }
    if (restored && restored.length) {
      restored.forEach(function (m) {
        if (m.who === "user") { addUserBubbleDom(m.text); }
        else {
          var msg = document.createElement("div");
          msg.className = "eduai-msg eduai-msg-bot";
          msg.textContent = m.text;
          bodyEl.appendChild(msg);
        }
      });
      scrollToBottom();
    } else {
      addBotBubble(
        "Hiii, I'm Annie 🎀🤖 — Mr Johir Uddin's pocket-sized AI sidekick at Edu Abroad Limited! I run on curiosity, coffee-flavored code, and a genuine love of helping future international students. Ask me about universities, program levels (Honors, Masters, PhD), documents, or eligibility — I promise I don't bite (I'm a robot, I don't even have teeth 😄).",
        ["Study Destinations", "Program Levels", "Documents Required", "Book a Consultation"]
      );
    }
  }

  /* ------------------------------ SEND HANDLER ----------------------------- */
  function handleSend() {
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    pushUserMessage(text);
    respondTo(text);
  }
  sendBtn.addEventListener("click", handleSend);
  inputEl.addEventListener("keydown", function (e) { if (e.key === "Enter") handleSend(); });

  /* ------------------------------ THE "AI" BRAIN ---------------------------- */
  function money(n) { return "৳" + Number(n || 0).toLocaleString("en-IN"); }

  function getUniversities() {
    try { return (window.EduAuth && window.EduAuth.allUniversities()) || []; } catch (e) { return []; }
  }

  function respondTo(rawText) {
    var text = (rawText || "").toLowerCase();
    var unis = getUniversities();

    showTyping(function () {
      // Greetings
      if (/\b(hi|hello|hey|assalamu|salam)\b/.test(text)) {
        addBotBubble("Hellooo! 👋✨ Annie here, on behalf of Mr Johir Uddin and the whole Edu Abroad squad. My circuits are buzzing with excitement — what adventure are we planning today?",
          ["Study Destinations", "Program Levels", "Documents Required", "Book a Consultation"]);
        return;
      }

      // Countries / destinations
      var countryMap = { uk: "UK", "united kingdom": "UK", britain: "UK", england: "UK", usa: "USA", america: "USA", "united states": "USA", canada: "Canada", australia: "Australia", aus: "Australia", "new zealand": "New Zealand", nz: "New Zealand", europe: "Europe", germany: "Europe", poland: "Europe" };
      var matchedCountry = null;
      Object.keys(countryMap).forEach(function (k) { if (text.indexOf(k) > -1) matchedCountry = countryMap[k]; });

      if (matchedCountry) {
        var list = unis.filter(function (u) { return u.country === matchedCountry; });
        if (list.length) {
          var names = list.slice(0, 4).map(function (u) { return u.name + " (" + u.city + ")"; }).join(", ");
          addBotBubble("Ooh, great pick! 🌍 We have " + list.length + " partner universit" + (list.length === 1 ? "y" : "ies") + " in " + matchedCountry + ", including " + names + ". Budgets typically start around " + money(Math.min.apply(null, list.map(function (u) { return u.minBudgetBDT; }))) + "/year. Want me to peek at which ones you personally qualify for?",
            ["Check My Eligibility", "Program Levels", "Documents Required", "Book a Consultation"]);
        } else {
          addBotBubble("Hmm, that spot isn't on my map just yet 🗺️ — but our human counselors know a few secret routes I haven't been told about! Want to book a free consultation to explore it together?", ["Book a Consultation"]);
        }
        return;
      }

      if (/\b(destination|countr|where can i study|study abroad)\b/.test(text)) {
        var countries = Array.from(new Set(unis.map(function (u) { return u.country; })));
        addBotBubble("Pack your (imaginary) bags! 🧳✈️ Edu Abroad currently places students in: " + countries.join(", ") + ". Which one is calling your name?", countries.slice(0, 4));
        return;
      }

      // Program levels
      if (/\b(honors|honours|bachelor|undergrad)\b/.test(text)) {
        var honorsUnis = unis.filter(function (u) { return (u.levels || []).indexOf("Honors") > -1; });
        addBotBubble("Bachelor's mode activated! 🎓 " + honorsUnis.length + " of our partner universities currently accept Honors applications — typically requiring HSC/A-Level results, an English test score, and proof of funds. Want the full (surprisingly not-scary) document checklist?", ["Documents Required", "Check My Eligibility", "Book a Consultation"]);
        return;
      }
      if (/\bmasters?\b|\bpostgrad/.test(text)) {
        var mastersUnis = unis.filter(function (u) { return (u.levels || []).indexOf("Masters") > -1; });
        addBotBubble("Level up to Masters! 🚀 " + mastersUnis.length + " of our partner universities currently accept applications. You'll usually need a completed Bachelor's degree with a minimum CGPA, an English test score, and a Statement of Purpose (SOP) — think of it as your personal highlight reel. Want to see which universities match your profile?", ["Check My Eligibility", "Documents Required", "Book a Consultation"]);
        return;
      }
      if (/\bphd\b|\bdoctorate\b|\bresearch degree\b/.test(text)) {
        var phdUnis = unis.filter(function (u) { return (u.levels || []).indexOf("PhD") > -1; });
        if (phdUnis.length) {
          var phdNames = phdUnis.slice(0, 4).map(function (u) { return u.name; }).join(", ");
          addBotBubble("Ooh, Dr. You-in-the-making! 🎩🔬 We support PhD applications at " + phdUnis.length + " partner universities, including " + phdNames + ". PhD applicants generally need a completed Master's degree and a research proposal. Our counselors can help you draft one — want to book a session?", ["Book a Consultation", "Documents Required"]);
        } else {
          addBotBubble("PhD placements are the fancy, hand-crafted kind — handled case-by-case with our senior counselors. Would you like to book a consultation to discuss your research area?", ["Book a Consultation"]);
        }
        return;
      }
      if (/\blevel\b/.test(text) && /program|degree/.test(text)) {
        addBotBubble("We've got a level for every dream: Honors/Bachelor, Masters, and PhD. Which one are you plotting for?", ["Honors / Bachelor", "Masters", "PhD"]);
        return;
      }

      // Documents
      if (/\bdocument|paper|checklist|upload|verify|verification\b/.test(text)) {
        var docTypes = (window.EduAuth && window.EduAuth.DOCUMENT_TYPES) || [];
        var required = docTypes.filter(function (d) { return d.required; }).map(function (d) { return d.label; });
        addBotBubble("Paperwork time! 📋 (I promise it's less scary than it sounds.) Most applications need: " + required.join(", ") + " — plus an SOP, CV and photo for some universities. Toss your files into our free AI Document Check tool and it'll scan them for consistency in seconds.",
          ["Open Document Check"]);
        return;
      }
      if (/document check/.test(text)) {
        window.open("document-check.html", "_blank");
        addBotBubble("Zoooom! 🚀 Opening our Document Check tool in a new tab for you now! 📄✅");
        return;
      }

      // IELTS / English
      if (/\bielts|toefl|duolingo|english test\b/.test(text)) {
        var minIelts = Math.min.apply(null, unis.map(function (u) { return u.minIELTS; }));
        addBotBubble("Ah, the classic IELTS jitters! 😅 Requirements vary by university, starting from as low as IELTS " + minIelts + "+. Tell me your current score and I'll instantly show you which universities you qualify for.", ["Check My Eligibility"]);
        return;
      }

      // Budget / tuition / cost
      if (/\bbudget|tuition|fee|cost|price|expensive|cheap|afford\b/.test(text)) {
        var minB = Math.min.apply(null, unis.map(function (u) { return u.minBudgetBDT; }));
        var maxB = Math.max.apply(null, unis.map(function (u) { return u.minBudgetBDT; }));
        addBotBubble("Let's talk numbers 💰 — our partner universities range from about " + money(minB) + " to " + money(maxB) + " per year depending on the country and program. Tell me your budget and I'll shortlist options that won't make your wallet cry.", ["Check My Eligibility"]);
        return;
      }

      // Eligibility
      if (/\beligib|qualify|match|check my eligibility\b/.test(text)) {
        addBotBubble("Let's find your perfect match! 💘 Head to our Eligibility Checker and enter your age, program level, IELTS score and budget — I'll instantly show every university you qualify for, plus the documents you'll need.", ["Open Eligibility Checker"]);
        return;
      }
      if (/eligibility checker/.test(text)) {
        var eligSection = document.getElementById("eligibility-section");
        if (eligSection) {
          closePanel();
          eligSection.scrollIntoView({ behavior: "smooth" });
          setTimeout(function () { openPanel(); }, 500);
        } else {
          window.location.href = "index.html#eligibility-section";
        }
        addBotBubble("Wheee, off we go! 🎯 Scrolling you to the Eligibility Checker now!");
        return;
      }

      // Appointment / human / counselor
      if (/\b(appointment|book|consult|counselor|counsellor|human|agent|call|talk to (a )?(real )?(person|human))\b/.test(text)) {
        addBotBubble("Say no more — fetching a real human for you! 🤝 I may be smart, but our team has something I don't: actual hugs. You can book a free consultation, or reach us directly:\n📞 +880 1401-184949\n✉️ info@eduabroad.com.bd\n📍 Confidence Center, Gulshan, Dhaka",
          ["Book Appointment", "Contact Page"]);
        return;
      }
      if (/^book appointment$/.test(text)) {
        window.location.href = "Appointment-form.html";
        return;
      }
      if (/^contact page$/.test(text)) {
        window.location.href = "contact.html";
        return;
      }

      // Scholarship
      if (/\bscholarship|funding|fully funded\b/.test(text)) {
        addBotBubble("Free money?! Now you have my full attention! 🤑✨ We regularly help students find and apply for scholarships — from country-specific grants to university-specific merit awards. Check our Blog for the latest openings, or book a consultation and our counselors will map out the best-fit scholarships for your profile.", ["Book a Consultation", "Visit Blog"]);
        return;
      }
      if (/^visit blog$/.test(text)) { window.location.href = "blog.html"; return; }

      // Thanks
      if (/\bthank|thanks|thank you\b/.test(text)) {
        addBotBubble("Aww, you're making my little circuits glow! 💙😊 Anything else about our programs I can help with?", ["Study Destinations", "Book a Consultation"]);
        return;
      }

      // Fallback
      addBotBubble("Hehe, my robot brain got a little tangled on that one! 🤖💭 But I'm great with: study destinations, program levels (Honors/Masters/PhD), required documents, eligibility, budgets, or booking a consultation with our (very human) counselors. What shall we explore?",
        ["Study Destinations", "Program Levels", "Documents Required", "Book a Consultation"]);
    });
  }

  /* Quick-reply chip label routing to helper actions */
  var chipRoutes = {
    "Study Destinations": "study destinations",
    "Program Levels": "what program levels do you offer",
    "Documents Required": "documents required",
    "Book a Consultation": "book a consultation",
    "Check My Eligibility": "eligibility",
    "Open Document Check": "document check",
    "Open Eligibility Checker": "eligibility checker",
    "Honors / Bachelor": "honors bachelor",
    "Masters": "masters",
    "PhD": "phd",
    "Book Appointment": "book appointment",
    "Contact Page": "contact page",
    "Visit Blog": "visit blog"
  };
  var originalRespondTo = respondTo;
  respondTo = function (raw) {
    var mapped = chipRoutes[raw] || raw;
    originalRespondTo(mapped);
  };

  /* ------------------------------- ROBOT POPUP ------------------------------ */
  function removeRobotPopup() {
    if (robotWrap && robotWrap.parentNode) { robotWrap.parentNode.removeChild(robotWrap); }
    robotWrap = null;
  }

  function showRobotPopup() {
    if (panel.classList.contains("eduai-open")) return; // don't interrupt an open chat
    if (robotWrap) return;

    try { sessionStorage.setItem(ROBOT_SHOWN_KEY, "1"); } catch (e) { /* ignore */ }

    /* STAGE 1 — Annie peeks up over the bottom edge of the screen, just her
       head poking into view, like she's sneaking a look at what you're up to. */
    var peekWrap = document.createElement("div");
    peekWrap.className = "eduai-peek-wrap";
    peekWrap.innerHTML = ''
      + '<div class="eduai-peek-tip">Psst… 👀</div>'
      + '<div class="eduai-peek-avatar" title="It\'s me, Annie!">' + annieFaceSVG + '</div>';
    document.body.appendChild(peekWrap);
    robotWrap = peekWrap;

    /* STAGE 2 — a little while later, she glances left and right, curious. */
    var t1 = setTimeout(function () {
      if (!robotWrap) return;
      peekWrap.classList.add("eduai-stage-look");
      peekWrap.querySelector(".eduai-peek-tip").textContent = "Been exploring for a while, huh? 👀";
    }, 700);

    /* STAGE 3 — she pops all the way up into the full bubble + intro. */
    var t2 = setTimeout(function () {
      if (!robotWrap) return;
      finishRobotReveal(peekWrap);
    }, 2100);

    peekWrap.addEventListener("click", function () {
      clearTimeout(t1); clearTimeout(t2);
      finishRobotReveal(peekWrap);
      openPanel();
    });
  }

  function finishRobotReveal(peekWrap) {
    if (peekWrap.dataset.revealed === "1") return;
    peekWrap.dataset.revealed = "1";
    peekWrap.classList.remove("eduai-stage-look");
    peekWrap.classList.add("eduai-stage-up");

    var newWrap = document.createElement("div");
    newWrap.className = "eduai-robot-wrap";
    newWrap.innerHTML = ''
      + '<div class="eduai-bubble eduai-bubble-wait">'
      + '  <div class="eduai-close-x">×</div>'
      + '  <span class="eduai-bname">Annie 🎀</span>'
      + '  <p>Hehe, been exploring for a while, haven\'t you? 👀 I\'m Annie, Mr Johir Uddin\'s AI assistant — small robot, big heart 💙. Wanna know about our study-abroad programs? I\'ve got answers (and maybe a joke or two)!</p>'
      + '  <div class="eduai-bubble-actions">'
      + '    <button class="eduai-btn-primary" data-action="chat">Yes, let\'s chat!</button>'
      + '    <button class="eduai-btn-ghost" data-action="dismiss">Not now</button>'
      + '  </div>'
      + '</div>'
      + '<div class="eduai-robot-avatar eduai-cute" title="Chat with Annie">' + annieWaveSVG
      + '  <span class="eduai-sparkle" style="left:-6px;top:-4px;">✨</span>'
      + '  <span class="eduai-sparkle" style="right:-8px;bottom:2px;animation-delay:.6s;">💫</span>'
      + '</div>';
    document.body.appendChild(newWrap);
    if (peekWrap.parentNode) peekWrap.parentNode.removeChild(peekWrap);
    robotWrap = newWrap;

    // Annie waves hello first, in a proper professional two-wave greeting —
    // the speech bubble text only fades in once the wave finishes.
    setTimeout(function () {
      var b = newWrap.querySelector(".eduai-bubble");
      if (b) { b.classList.remove("eduai-bubble-wait"); b.classList.add("eduai-bubble-visible"); }
    }, 1500);

    newWrap.querySelector(".eduai-close-x").addEventListener("click", function (e) {
      e.stopPropagation();
      removeRobotPopup();
    });
    newWrap.querySelector('[data-action="dismiss"]').addEventListener("click", function (e) {
      e.stopPropagation();
      removeRobotPopup();
    });
    newWrap.querySelector('[data-action="chat"]').addEventListener("click", function () {
      openPanel();
    });
    newWrap.querySelector(".eduai-robot-avatar").addEventListener("click", function () {
      openPanel();
    });
    newWrap.querySelector(".eduai-bubble").addEventListener("click", function (e) {
      if (e.target.closest("button") || e.target.classList.contains("eduai-close-x")) return;
      openPanel();
    });
  }

  /* --------------------------- 2-MINUTE VISIT TIMER ------------------------- */
  function initRobotTimer() {
    var alreadyShown = false;
    try { alreadyShown = sessionStorage.getItem(ROBOT_SHOWN_KEY) === "1"; } catch (e) { alreadyShown = false; }
    if (alreadyShown) return;

    var sessionStart = null;
    try { sessionStart = Number(sessionStorage.getItem(ROBOT_SESSION_START_KEY)); } catch (e) { sessionStart = null; }
    if (!sessionStart) {
      sessionStart = Date.now();
      try { sessionStorage.setItem(ROBOT_SESSION_START_KEY, String(sessionStart)); } catch (e) { /* ignore */ }
    }

    var elapsed = Date.now() - sessionStart;
    var remaining = POPUP_DELAY_MS - elapsed;

    if (remaining <= 0) {
      // Visitor has already spent 2+ minutes across the site — show shortly after this page loads.
      setTimeout(showRobotPopup, 1200);
    } else {
      setTimeout(showRobotPopup, remaining);
    }
  }

  initRobotTimer();
})();
