/* ============================================================
 Nadav Levy — Portfolio v1
 ============================================================ */
(function () {
"use strict";

 const $ = (sel, ctx = document) => ctx.querySelector(sel);
 const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
 const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

 /* ---------- intro loading screen ---------- */
 const LOADER_MIN_MS = 3200;
 const LOADER_MAX_MS = 5200;

 const finishIntro = () => {
 document.body.classList.remove("is-loading");
 document.body.classList.add("is-ready");
 const loader = $("#loader");
 if (loader) loader.classList.add("is-hidden");
 };

 const skipIntro = () => finishIntro();

 if (prefersReducedMotion) {
 skipIntro();
 } else {
 const loaderVideo = $("#loaderVideo");
 const startedAt = performance.now();
 let finished = false;

 const maybeFinish = () => {
 if (finished) return;
 if (performance.now() - startedAt < LOADER_MIN_MS) return;
 finished = true;
 finishIntro();
 };

 if (!loaderVideo) {
 skipIntro();
 } else {
 loaderVideo.addEventListener("ended", maybeFinish);
 loaderVideo.addEventListener("error", skipIntro);

 const playPromise = loaderVideo.play();
 if (playPromise && typeof playPromise.catch === "function") {
 playPromise.catch(skipIntro);
 }

 setTimeout(maybeFinish, LOADER_MAX_MS);
 }
 }

 /* ---------- impact bar infinite scroll ---------- */
 const impactTrack = $("#impactTrack");
 const impactSet = $("#impactSet");
 const impactSection = $(".impact");
 if (impactTrack && impactSet && impactSection) {
 if (prefersReducedMotion) {
 impactSection.classList.add("impact--static");
 } else {
 const clone = impactSet.cloneNode(true);
 clone.setAttribute("aria-hidden", "true");
 impactTrack.appendChild(clone);
 impactTrack.classList.add("is-animated");
 const statCount = impactSet.querySelectorAll(".impact__stat").length;
 impactTrack.style.setProperty("--impact-speed", `${Math.max(18, statCount * 7)}s`);
 }
 }

 /* ---------- current year in footer ---------- */
 const yearEl = $("#year");
 if (yearEl) yearEl.textContent = new Date().getFullYear();

 /* ---------- dock: condense on scroll down, expand on scroll up ---------- */
 const dock = $("#nav");
 let lastY = window.scrollY;
 let ticking = false;
 window.addEventListener("scroll", () => {
 if (ticking) return;
 ticking = true;
 requestAnimationFrame(() => {
 const y = window.scrollY;
 const delta = y - lastY;
 if (y < 40) dock.classList.remove("is-condensed");
 else if (delta > 4) dock.classList.add("is-condensed");
 else if (delta < -4) dock.classList.remove("is-condensed");
 lastY = y;
 ticking = false;
 });
 }, { passive: true });

 /* ---------- active dock link via IntersectionObserver ---------- */
 const sections = $$("section[id]");
 const linkFor = (id) => $(`.nav__link[data-nav="${id}"]`);
 const setActive = (id) => {
 $$(".nav__link").forEach((l) => l.classList.remove("is-active"));
 const link = linkFor(id);
 if (link) link.classList.add("is-active");
 };

 if ("IntersectionObserver" in window) {
 const navObserver = new IntersectionObserver(
 (entries) => {
 // pick the most-visible intersecting section
 let best = null;
 entries.forEach((e) => {
 if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
 });
 if (best) setActive(best.target.id);
 },
 { rootMargin:"-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
 );
 sections.forEach((s) => navObserver.observe(s));
 }

 /* ---------- scroll reveal ---------- */
 const revealEls = $$(".reveal");
 if (prefersReducedMotion || !("IntersectionObserver" in window)) {
 revealEls.forEach((el) => el.classList.add("in-view"));
 } else {
 const revealObserver = new IntersectionObserver(
 (entries, obs) => {
 entries.forEach((e) => {
 if (e.isIntersecting) {
 e.target.classList.add("in-view");
 obs.unobserve(e.target);
 }
 });
 },
 { rootMargin:"0px 0px -10% 0px", threshold: 0.12 }
 );
 revealEls.forEach((el) => revealObserver.observe(el));
 }

 /* ---------- project filtering ---------- */
 const filters = $$(".filter");
 const projects = $$(".project");
 const emptyMsg = $("#projectsEmpty");

 filters.forEach((btn) => {
 btn.addEventListener("click", () => {
 filters.forEach((b) => b.classList.remove("is-active"));
 btn.classList.add("is-active");
 const f = btn.dataset.filter;
 let visible = 0;
 projects.forEach((p) => {
 const match = f === "all" || (p.dataset.tags || "").split(" ").includes(f);
 p.style.display = match ?"" :"none";
 if (match) visible++;
 });
 if (emptyMsg) emptyMsg.hidden = visible !== 0;
 });
 });

 /* ---------- contact form (Formspree) ---------- */
 // 👉 Set this to your Formspree endpoint, e.g. "https://formspree.io/f/abcdwxyz".
 // Until it's set, the form falls back to opening the user's email client.
 const FORMSPREE_ENDPOINT = "https://formspree.io/f/xnjygkya";
 const CONTACT_EMAIL = "nadavile415@gmail.com";

 const form = $("#contactForm");
 const note = $("#contactNote");
 if (form) {
 const submitBtn = form.querySelector('button[type="submit"]');
 const setNote = (msg, isError) => {
 note.hidden = false;
 note.classList.toggle("is-error", !!isError);
 note.textContent = msg;
 };

 form.addEventListener("submit", async (e) => {
 e.preventDefault();
 const name = $("#cf-name").value.trim();
 const email = $("#cf-email").value.trim();
 const message = $("#cf-message").value.trim();
 const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

 if (!name || !validEmail || !message) {
 setNote("> please fill in every field with a valid email.", true);
 return;
 }

 // Fallback if no endpoint configured yet: open the user's mail client.
 if (/REPLACE_WITH/.test(FORMSPREE_ENDPOINT)) {
 const subject = encodeURIComponent(`Portfolio message from ${name}`);
 const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
 window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
 setNote(`> opening your email app to reach ${CONTACT_EMAIL}…`, false);
 return;
 }

 const original = submitBtn.textContent;
 submitBtn.disabled = true;
 submitBtn.textContent = "Sending…";
 setNote("", false);
 note.hidden = true;

 try {
 const res = await fetch(FORMSPREE_ENDPOINT, {
 method: "POST",
 headers: { Accept: "application/json" },
 body: new FormData(form),
 });
 if (!res.ok) throw new Error("send-failed");
 setNote(`> thanks, ${name.split(" ")[0]}! your message is on its way. I'll get back to you soon.`, false);
 form.reset();
 } catch (err) {
 setNote(`> something went wrong — email me directly at ${CONTACT_EMAIL}.`, true);
 } finally {
 submitBtn.disabled = false;
 submitBtn.textContent = original;
 }
 });
 }

 /* ============================================================
 AI CHAT WIDGET
 ============================================================ */
 const fab = $("#chatFab");
 const panel = $("#chatPanel");
 const closeBtn = $("#chatClose");
 const log = $("#chatLog");
 const chatForm = $("#chatForm");
 const chatInput = $("#chatInput");
 const suggest = $("#chatSuggest");
 let greeted = false;
 let lastIntent = null;
 let pendingOffer = null;

 const CHAT_STARTERS = [
 { label: "30-sec recruiter brief", q: "Give me a 30 second recruiter brief on Nadav" },
 { label: "Top projects", q: "What are your best projects?" },
 { label: "Why PM?", q: "Why CS to PM?" },
 { label: "Leadership", q: "What did you do in the army?" },
 ];

 const DEFAULT_SUGGEST = [
 { label: "WhatsApp savings", q: "What did you save Bites on WhatsApp?" },
 { label: "Why PM?", q: "Why CS to PM?" },
 { label: "Contact", q: "How can I contact you?" },
 { label: "Resume", q: "Where is your resume?" },
 ];

 const norm = (s) => s.toLowerCase().replace(/[^a-z0-9֐-׿\s]/g, "").replace(/\s+/g, " ").trim();
 const stem = (w) => w.replace(/(ing|ed|es|s)$/,"");

 const KB = [
 {
 id:"recruiter",
 label:"recruiter brief",
 keys: { strong: ["recruiter brief","30 second","30 sec","should we hire","hiring manager","interview him","pitch me"], weak: ["recruiter","interview","candidate","hire"] },
 reply:"**30-second brief:** Nadav is a CSM at Bites who ships product from the customer seat — WhatsApp ops that save thousands/year, a forms + e-sign tool, and this AI-powered portfolio. IDF Sergeant Major + Scouts instructor before tech. Studying Comm/Marketing at Reichman. Targeting PM roles where user empathy meets execution.",
 more:"Why him over a typical APM? He already runs discovery → prototype → ship loops with real enterprise users (Unilever, Amazon). Less theory, more shipped tools.",
 suggest: ["Why CS to PM?", "WhatsApp impact", "Download resume"],
 actions: [{ label: "See projects", scroll: "#projects" }, { label: "Email Nadav", href: "mailto:nadavile415@gmail.com" }],
 },
 {
 id:"whypm",
 label:"why PM",
 keys: { strong: ["why pm","why product","cs to pm","csm to pm","why product manager","moving to pm"], weak: ["pm role","product role","career goal","aspiring"] },
 reply:"Nadav wants PM because he already runs the loop — daily user research from CS, AI-powered prototyping, and shipped tools like WhatsApp fallbacks and Bites Forms. CS gave empathy; building gave execution.",
 more:"Recruiter angle: he's not escaping CS — he's graduating from it. Few candidates ship production tools while managing enterprise accounts.",
 suggest: ["Top projects", "WhatsApp savings", "Recruiter brief"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"skills",
 label:"skills",
 keys: { strong: ["skill","stack","tooling","tech stack","good at","capabilities"], weak: ["tool","tech","work with","expert","know"] },
 reply:"Four lanes: **Product** (discovery, roadmapping, CS), **AI** (Claude, ChatGPT, prompt engineering), **Design** (Figma, Midjourney, rapid UI), **Code** (vibe coding, HTML/CSS/JS, React basics).",
 more:"The connective tissue is speed — AI at every step so one person covers research → design → build.",
 suggest: ["AI workflow", "Top projects", "This website"],
 actions: [{ label: "Skills section", scroll: "#skills" }],
 },
 {
 id:"projects",
 label:"projects",
 keys: { strong: ["project","portfolio","built","shipped","showcase","what has he built","what did he build","best project"], weak: ["work","build","made","creation"] },
 reply:"**1) WhatsApp at Scale** — templates + smart fallbacks → thousands saved/year + higher delivery rate. **2) Bites Forms** — forms + e-sign in one flow. **3) This site** — vibe-coded with AI + live GitHub. **4) Art & Vision** — AI-designed infographic.",
 more:"Pattern: spot real customer pain → prototype fast → ship → iterate. A CSM who builds, not just escalates.",
 suggest: ["WhatsApp impact", "Bites Forms", "Why PM?"],
 actions: [{ label: "Open projects", scroll: "#projects" }],
 },
 {
 id:"whatsapp",
 label:"the WhatsApp project",
 keys: { strong: ["whatsapp","messaging","fallback","thousands","save money","saved money","cost saving","delivery rate","receiving rate","whatsapp impact","whatsapp savings"], weak: ["message","template","templates","scale","cost","costs"] },
 reply:"Built **WhatsApp messaging at Bites** — reusable templates + fallback logic that routes around failed deliveries. Result: **thousands saved per year** and a **higher message-receiving rate**.",
 more:"Classic Nadav: expensive operational problem → smarter system → measurable ROI from a CS seat.",
 suggest: ["Top projects", "Why PM?", "Recruiter brief"],
 actions: [{ label: "See projects", scroll: "#projects" }],
 },
 {
 id:"bitesforms",
 label:"Bites Forms",
 keys: { strong: ["bites forms","forms","docusign","signature","e-sign","esign"], weak: ["form","sign","document","contract"] },
 reply:"**Bites Forms** merges **Google Forms + DocuSign** — collect responses and capture legally-binding signatures in one flow. Born from watching clients juggle two tools.",
 more:"Product instinct from CS: saw the workaround customers invented and shipped the real solution.",
 suggest: ["Top projects", "WhatsApp savings"],
 actions: [{ label: "See projects", scroll: "#projects" }],
 },
 {
 id:"thissite",
 label:"this website",
 keys: { strong: ["this website","this site","this portfolio","vibe code","vibe coding","vibe coded"], weak: ["site","website","portfolio site","claude code"] },
 reply:"This site — vibe-coded with AI, no framework. Liquid-glass nav, live GitHub feed, scrolling impact bar, and me. Proof that one person + AI can ship a real product.",
 more:"Built by describing intent to AI and iterating — the workflow Nadav uses for everything.",
 suggest: ["AI workflow", "GitHub activity"],
 actions: [{ label: "GitHub section", scroll: "#github" }],
 },
 {
 id:"sushi",
 label:"his Art & Vision work",
 keys: { strong: ["sushi","infographic","infografic","art","vision"], weak: ["graphic","visual","poster","illustration","creative"] },
 reply:"**Art & Vision** — AI-designed visuals like a sushi infographic. Click the image in Projects to see it full-size.",
 more:"Shows design taste beyond product work: fast from idea to polished, shareable visual.",
 suggest: ["Top projects", "Design skills"],
 actions: [{ label: "See infographic", scroll: "#projects" }],
 },
 {
 id:"contact",
 label:"contact",
 keys: { strong: ["contact","email","reach","hire","get in touch","hiring","recruit"], weak: ["talk","available","message","connect","dm"] },
 reply:"Email **nadavile415@gmail.com** (fastest). Also: contact form on this page, LinkedIn, or GitHub @nadavl-dev.",
 more:"Recruiters: resume download is in the hero and Contact section.",
 suggest: ["Recruiter brief", "Resume", "Why PM?"],
 actions: [{ label: "Contact section", scroll: "#contact" }, { label: "Email now", href: "mailto:nadavile415@gmail.com" }],
 },
 {
 id:"experience",
 label:"experience",
 keys: { strong: ["experience","bites","career","customer success","csm"], weak: ["job","company","role","cs","success","current"] },
 reply:"**CSM at Bites** (2022 → now) — enterprise training platform for frontline teams. Owns onboarding → adoption → renewal. Clients include Unilever & Amazon.",
 more:"Operates like a PM: customer pain becomes product feedback, and he prototypes fixes with AI instead of waiting on roadmap.",
 suggest: ["Top projects", "Why PM?", "Leadership"],
 actions: [{ label: "Work history", scroll: "#experience" }],
 },
 {
 id:"army",
 label:"military service",
 keys: { strong: ["army","idf","military","sergeant","artillery","combat","service","soldier","leadership"], weak: ["commander","medical","unit","war"] },
 reply:"**IDF Artillery** (2019–2021), **Sergeant Major** — combat commander + head of unit medical staff. High-pressure ops, full ownership.",
 more:"Calm under pressure, decisions with incomplete info, responsibility for people — same muscles he uses with enterprise customers.",
 suggest: ["Scouts volunteering", "Recruiter brief", "Why PM?"],
 actions: [{ label: "Education & service", scroll: "#education" }],
 },
 {
 id:"scouts",
 label:"volunteering",
 keys: { strong: ["scout","volunteer","tzofim","youth","instructor"], weak: ["movement","mentor","teach","guide"] },
 reply:"**Hebrew Scouts** (2015–2018), 2 years as **Head Instructor** — programs for 20–30 youth. Where his leadership started.",
 more:"Planning, conflict resolution, mentorship — same skills he uses with customers today.",
 suggest: ["Army service", "About Nadav"],
 actions: [{ label: "Education & service", scroll: "#education" }],
 },
 {
 id:"education",
 label:"education",
 keys: { strong: ["education","university","reichman","degree","study","studies","student"], weak: ["school","ba","communication","marketing","academic"] },
 reply:"**B.A. Communication + Marketing** at Reichman University (2023–2026), while working full-time at Bites.",
 more:"Academic frameworks for comms and consumer behavior, applied immediately to real product work.",
 suggest: ["Experience at Bites", "About Nadav"],
 actions: [{ label: "Education section", scroll: "#education" }],
 },
 {
 id:"github",
 label:"GitHub",
 keys: { strong: ["github","git","repo","contribution","commit"], weak: ["code","coding","open source"] },
 reply:"**@nadavl-dev** on GitHub — the section on this page pulls live contribution data and top languages.",
 more:"Most building is AI-assisted vibe coding — this portfolio included.",
 suggest: ["This website", "AI workflow"],
 actions: [{ label: "GitHub section", scroll: "#github" }, { label: "Open GitHub", href: "https://github.com/nadavl-dev" }],
 },
 {
 id:"ai",
 label:"AI",
 keys: { strong: ["ai","claude","chatgpt","prompt","llm","gpt","artificial","ai workflow"], weak: ["machine learning","automation","model"] },
 reply:"AI is how Nadav works end-to-end: Claude/ChatGPT for thinking, prompt engineering for reliable output, AI for design exploration and vibe coding.",
 more:"The skill isn't chatting — it's chaining AI through research → design → build → test so ideas ship in days.",
 suggest: ["This website", "Top projects"],
 },
 {
 id:"design",
 label:"design",
 keys: { strong: ["design","figma","midjourney","ui","ux"], weak: ["visual","prototype","mockup","interface"] },
 reply:"Design *with* AI — Figma for flows, Midjourney for concepts, fast prototypes to test before committing. Clean, minimal taste (this site).",
 more:"Design as a thinking tool, not decoration.",
 suggest: ["Art & Vision", "This website"],
 actions: [{ label: "Projects", scroll: "#projects" }],
 },
 {
 id:"product",
 label:"product",
 keys: { strong: ["product","pm","roadmap","product manager"], weak: ["manager","strategy","prioritize","discovery"] },
 reply:"Product mindset: find the real problem, prioritize, prototype, ship. CS keeps him grounded in actual user pain — not theory.",
 more:"CS is his unfair advantage as a product thinker.",
 suggest: ["Why PM?", "Top projects"],
 },
 {
 id:"resume",
 label:"resume",
 keys: { strong: ["resume","cv","download resume"], weak: ["download","pdf"] },
 reply:"Download from the **Download Resume** button in the hero or Contact section — same PDF you'd get from Nadav directly.",
 more:"CSM at Bites · IDF Sergeant Major · Reichman B.A. in progress · ships product from a CS seat.",
 suggest: ["Recruiter brief", "Contact"],
 actions: [{ label: "Get resume", href: "/resume.pdf" }, { label: "Contact", scroll: "#contact" }],
 },
 {
 id:"location",
 label:"location",
 keys: { strong: ["where","location","based","israel","live"], weak: ["city","country","from","relocate"] },
 reply:"Based in **Israel** — Reichman University in Herzliya, Bites during the week.",
 more:"Works with international enterprise customers daily.",
 },
 {
 id:"greeting",
 label:"hello",
 keys: { strong: ["hello","hi","hey","shalom","howdy"], weak: ["yo","sup","morning","evening"] },
 reply:"Hey! I'm Nadav's AI — I know his projects, path to PM, leadership story, and how to reach him. Pick a suggestion below or ask anything.",
 suggest: ["Recruiter brief", "Top projects", "Why PM?", "WhatsApp savings"],
 },
 {
 id:"about",
 label:"about Nadav",
 keys: { strong: ["who is","about nadav","tell me about","introduce","bio"], weak: ["who","nadav","yourself","summary"] },
 reply:"**Nadav Levy** — CSM at Bites who builds like a PM. Ships tools from customer insight. IDF Sergeant Major, Scouts Head Instructor, Reichman student. Product · AI · Design generalist.",
 more:"Ask about any chapter — Bites, army, projects, or why PM.",
 suggest: ["Recruiter brief", "Top projects", "Leadership"],
 actions: [{ label: "About section", scroll: "#about" }],
 },
 {
 id:"thanks",
 label:"thanks",
 keys: { strong: ["thank","thanks","toda","appreciate"], weak: ["cool","awesome","great","nice"] },
 reply:"Anytime! Want to keep going?",
 suggest: ["Contact", "Recruiter brief", "Top projects"],
 },
 {
 id:"yes",
 label:"follow-up yes",
 keys: { strong: ["yes","yeah","yep","sure","ok","okay","please","go ahead"], weak: ["yup","do it"] },
 reply:"",
 },
 {
 id:"no",
 label:"follow-up no",
 keys: { strong: ["no","nope","nah","not now"], weak: [] },
 reply:"No problem — ask about anything else or jump to a section on the site.",
 suggest: ["Top projects", "Contact", "Why PM?"],
 },
 ];

 const editDist = (a, b) => {
 if (Math.abs(a.length - b.length) > 2) return 3;
 const m = a.length, n = b.length;
 let prev = Array.from({ length: n + 1 }, (_, i) => i);
 for (let i = 1; i <= m; i++) {
 const cur = [i];
 let rowMin = i;
 for (let j = 1; j <= n; j++) {
 cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
 rowMin = Math.min(rowMin, cur[j]);
 }
 if (rowMin > 2) return 3;
 prev = cur;
 }
 return prev[n];
 };

 const keyHit = (text, words, key) => {
 if (key.includes(" ")) return text.includes(key) ? 1 : 0;
 if (words.includes(key)) return 1;
 const sk = stem(key);
 let fuzzy = 0;
 for (const w of words) {
 if (stem(w) === sk) return 1;
 if (key.length >= 4 && w.length >= 4 && editDist(w, key) <= (key.length >= 7 ? 2 : 1)) fuzzy = 0.6;
 }
 return fuzzy;
 };

 const scoreIntent = (intent, text, words) => {
 let score = 0;
 intent.keys.strong.forEach((k) => { score += 3 * keyHit(text, words, k); });
 intent.keys.weak.forEach((k) => { score += 1 * keyHit(text, words, k); });
 return score;
 };

 const FOLLOWUPS = ["more","tell me more","go on","expand","elaborate","why","how come","really","interesting","and"];

 const findIntent = (id) => KB.find((i) => i.id === id);

 const getReply = (text) => {
 const t = norm(text);
 const words = t.split(" ");

 if (pendingOffer && ["yes","yeah","yep","sure","ok","okay","please","yup"].some((w) => t === w || t.startsWith(w + " "))) {
 const offered = findIntent(pendingOffer);
 pendingOffer = null;
 if (offered) {
 lastIntent = offered.id;
 return { text: offered.reply, intent: offered, suggest: offered.suggest, actions: offered.actions };
 }
 }

 if (lastIntent && words.length <= 4 && FOLLOWUPS.some((f) => t === f || t.startsWith(f + " ") || t.endsWith(" " + f))) {
 const intent = findIntent(lastIntent);
 if (intent && intent.more) {
 lastIntent = null;
 return { text: intent.more, intent, suggest: intent.suggest, actions: intent.actions };
 }
 }

 if (t === "yes" || t === "yeah" || t === "sure") {
 const yesIntent = findIntent("yes");
 if (yesIntent) { /* handled above via pendingOffer */ }
 }

 const ranked = KB.map((i) => ({ i, s: scoreIntent(i, t, words) }))
 .filter((r) => r.s > 0 && r.i.id !== "yes")
 .sort((a, b) => b.s - a.s);

 if (ranked.length) {
 const best = ranked[0];
 lastIntent = best.i.id;
 let replyText = best.i.reply;
 pendingOffer = null;
 const second = ranked[1];
 if (second && second.s >= 3 && second.i.id !== best.i.id && !["greeting","thanks","no"].includes(second.i.id)) {
 replyText += `\n\nWant to hear about **${second.i.label}** too?`;
 pendingOffer = second.i.id;
 }
 return {
 text: replyText,
 intent: best.i,
 suggest: best.i.suggest || DEFAULT_SUGGEST.map((s) => s.q),
 actions: best.i.actions,
 };
 }

 lastIntent = null;
 pendingOffer = null;
 return {
 text: "I'm not sure on that one. Try asking about **projects**, **WhatsApp savings**, **why PM**, **leadership**, or **how to contact** Nadav.",
 suggest: ["Recruiter brief", "Top projects", "Why PM?", "Contact"],
 actions: [{ label: "Contact Nadav", scroll: "#contact" }],
 };
 };

 const fmt = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

 const BOT_AVATAR = "bot-avatar.png";
 const BOT_FALLBACK = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 40 40%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23eeeeee%27/%3E%3Ccircle cx=%2720%27 cy=%2716%27 r=%276.5%27 fill=%27%23999999%27/%3E%3Cpath d=%27M7 37c1-7 6-11 13-11s12 4 13 11z%27 fill=%27%23999999%27/%3E%3C/svg%3E";
 const avatarHTML = `<img class="msg-avatar" src="${BOT_AVATAR}" alt="" onerror="this.onerror=null;this.src='${BOT_FALLBACK}'">`;

 const scrollToSection = (sel) => {
 const el = document.querySelector(sel);
 if (!el) return;
 closeChat();
 setTimeout(() => el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" }), 220);
 };

 const setSuggestions = (items) => {
 if (!suggest) return;
 const list = (items || DEFAULT_SUGGEST).slice(0, 4);
 suggest.innerHTML = list.map((item) => {
 const label = typeof item === "string" ? item : item.label;
 const q = typeof item === "string" ? item : item.q;
 return `<button type="button" data-q="${q.replace(/"/g, "&quot;")}">${label}</button>`;
 }).join("");
 };

 const addMsg = (text, who) => {
 if (who === "user") {
 const el = document.createElement("div");
 el.className = "msg msg--user";
 el.innerHTML = fmt(text);
 log.appendChild(el);
 log.scrollTop = log.scrollHeight;
 return el;
 }
 const row = document.createElement("div");
 row.className = "msg-row";
 row.innerHTML = `${avatarHTML}<div class="msg msg--bot">${fmt(text)}</div>`;
 log.appendChild(row);
 log.scrollTop = log.scrollHeight;
 return row;
 };

 const addBotReply = (payload) => {
 const row = document.createElement("div");
 row.className = "msg-row msg-row--rich";
 let actionsHTML = "";
 if (payload.actions && payload.actions.length) {
 actionsHTML = `<div class="msg-actions">${payload.actions.map((a) => {
 if (a.scroll) return `<button type="button" class="msg-action" data-scroll="${a.scroll}">${a.label}</button>`;
 if (a.href) return `<a class="msg-action" href="${a.href}" ${a.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}${a.href.endsWith(".pdf") ? " download" : ""}>${a.label}</a>`;
 if (a.q) return `<button type="button" class="msg-action" data-q="${a.q.replace(/"/g, "&quot;")}">${a.label}</button>`;
 return "";
 }).join("")}</div>`;
 }
 row.innerHTML = `${avatarHTML}<div class="msg msg--bot">${fmt(payload.text)}${actionsHTML}</div>`;
 log.appendChild(row);
 log.scrollTop = log.scrollHeight;
 if (payload.suggest) setSuggestions(payload.suggest.map((q) => ({ label: q.replace(/\?$/, "").slice(0, 22), q })));
 return row;
 };

 const showTyping = () => {
 const row = document.createElement("div");
 row.className = "msg-row";
 row.innerHTML = `${avatarHTML}<div class="typing"><span></span><span></span><span></span></div>`;
 log.appendChild(row);
 log.scrollTop = log.scrollHeight;
 return row;
 };

 const showWelcome = () => {
 const wrap = document.createElement("div");
 wrap.className = "chat-welcome";
 wrap.innerHTML = `
 <p class="chat-welcome__title">Hey — I'm Nadav's AI.</p>
 <p class="chat-welcome__sub">I know his story, projects, and path to PM. Start here:</p>
 <div class="chat-welcome__grid">
 ${CHAT_STARTERS.map((s) => `<button type="button" class="chat-starter" data-q="${s.q.replace(/"/g, "&quot;")}"><span>${s.label}</span></button>`).join("")}
 </div>`;
 log.appendChild(wrap);
 setSuggestions(DEFAULT_SUGGEST);
 };

 const botRespond = (userText) => {
 const typing = showTyping();
 const delay = prefersReducedMotion ? 200 : 550 + Math.min(userText.length * 14, 600);
 setTimeout(() => {
 typing.remove();
 const welcome = log.querySelector(".chat-welcome");
 if (welcome) welcome.remove();
 addBotReply(getReply(userText));
 }, delay);
 };

 const openChat = () => {
 panel.classList.add("is-open");
 panel.setAttribute("aria-hidden", "false");
 fab.classList.add("is-open");
 fab.setAttribute("aria-expanded", "true");
 if (!greeted) {
 greeted = true;
 showWelcome();
 }
 setTimeout(() => chatInput.focus(), 300);
 };

 const closeChat = () => {
 panel.classList.remove("is-open");
 panel.setAttribute("aria-hidden", "true");
 fab.classList.remove("is-open");
 fab.setAttribute("aria-expanded", "false");
 };

 const toggleChat = () => (panel.classList.contains("is-open") ? closeChat() : openChat());

 fab.addEventListener("click", toggleChat);
 closeBtn.addEventListener("click", closeChat);
 document.addEventListener("keydown", (e) => {
 if (e.key === "Escape" && panel.classList.contains("is-open")) closeChat();
 });

 const send = (text) => {
 const msg = text.trim();
 if (!msg) return;
 addMsg(msg, "user");
 chatInput.value = "";
 botRespond(msg);
 };

 chatForm.addEventListener("submit", (e) => {
 e.preventDefault();
 send(chatInput.value);
 });

 log.addEventListener("click", (e) => {
 const qBtn = e.target.closest("[data-q]");
 if (qBtn) send(qBtn.dataset.q);
 const scrollBtn = e.target.closest("[data-scroll]");
 if (scrollBtn) scrollToSection(scrollBtn.dataset.scroll);
 });

 suggest.addEventListener("click", (e) => {
 const btn = e.target.closest("button[data-q]");
 if (btn) {
 if (!panel.classList.contains("is-open")) openChat();
 send(btn.dataset.q);
 }
 });

 setSuggestions(DEFAULT_SUGGEST);

 /* ============================================================
 GITHUB ACTIVITY (live, no token required)
 ============================================================ */
 // Set your GitHub username here to switch from demo data to live data:
 const GH_USER ="nadavl-dev";

 const ghGraph = $("#ghGraph");
 if (ghGraph) {
 const ghTotal = $("#ghTotal");
 const ghYears = $("#ghYears");
 const ghLangs = $("#ghLangs");
 const ghMsg = $("#ghMsg");
 const ghHandle = $("#ghHandle");
 const yearLabels = [$("#ghYearLabel"), $("#ghYearLabel2")].filter(Boolean);
 const isPlaceholder = !GH_USER || /REPLACE_WITH/.test(GH_USER);

 const setLabels = (y) => yearLabels.forEach((el) => (el.textContent = y));

 const ghMonths = $("#ghMonths");
 const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

 const renderMonths = (days, offset) => {
 if (!ghMonths) return;
 ghMonths.innerHTML ="";
 let lastMonth = -1;
 days.forEach((d, i) => {
 const month = new Date(d.date +"T00:00:00Z").getUTCMonth();
 const col = Math.floor((offset + i) / 7);
 const dayOfWeek = (offset + i) % 7;
 // place a label the first time we hit a new month, at the top of its column
 if (month !== lastMonth && dayOfWeek === 0) {
 const label = document.createElement("span");
 label.className ="gh__month";
 label.textContent = MONTHS[month];
 label.style.gridColumn = `${col + 1}`;
 ghMonths.appendChild(label);
 lastMonth = month;
 } else if (month !== lastMonth && lastMonth === -1) {
 const label = document.createElement("span");
 label.className ="gh__month";
 label.textContent = MONTHS[month];
 label.style.gridColumn = `${col + 1}`;
 ghMonths.appendChild(label);
 lastMonth = month;
 }
 });
 };

 const renderGraph = (days) => {
 ghGraph.innerHTML ="";
 if (!days.length) return;
 const offset = new Date(days[0].date +"T00:00:00Z").getUTCDay();
 renderMonths(days, offset);
 for (let i = 0; i < offset; i++) {
 const e = document.createElement("span");
 e.className ="gh__cell gh__cell--empty";
 ghGraph.appendChild(e);
 }
 days.forEach((d) => {
 const c = document.createElement("span");
 c.className ="gh__cell";
 c.dataset.l = d.level;
 c.title = `${d.count} contribution${d.count === 1 ?"" :"s"} on ${d.date}`;
 ghGraph.appendChild(c);
 });
 };

 // official GitHub (linguist) language colors
 const LANG_COLORS = {
 TypeScript:"#3178c6", JavaScript:"#f1e05a", Python:"#3572A5", HTML:"#e34c26",
 CSS:"#563d7c", SCSS:"#c6538c", Java:"#b07219","C#":"#178600","C++":"#f34b7d",
 C:"#555555", Go:"#00ADD8", Rust:"#dea584", Ruby:"#701516", PHP:"#4F5D95",
 Swift:"#F05138", Kotlin:"#A97BFF", Dart:"#00B4AB", Shell:"#89e051", Vue:"#41b883",
 Svelte:"#ff3e00", Astro:"#ff5a03","Jupyter Notebook":"#DA5B0B", Lua:"#000080",
"Objective-C":"#438eff", Elixir:"#6e4a7e", Haskell:"#5e5086", Solidity:"#AA6746"
 };

 const renderLangs = (langs) => {
 ghLangs.innerHTML ="";
 langs.forEach(([name, n]) => {
 const color = LANG_COLORS[name] ||"#8b949e";
 const chip = document.createElement("span");
 chip.className ="gh__lang";
 chip.innerHTML = `<span class="gh__lang-dot" style="background:${color}"></span>${name} <span class="gh__lang-n">(${n})</span>`;
 ghLangs.appendChild(chip);
 });
 };

 // deterministic PRNG (mulberry32) so the graph is stable across reloads
 const rng = (seed) => () => {
 seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
 let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
 t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
 return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 };

 // how busy each year looks: 0 = empty, 1 = full
 const YEAR_INTENSITY = { 2026: 1, 2025: 0.22, 2024: 0 };

 // organic-looking contribution data for a given year
 const genData = (year) => {
 const rand = rng(year * 7919);
 const scale = YEAR_INTENSITY[year] != null ? YEAR_INTENSITY[year] : 1;
 const out = [];
 const start = Date.UTC(year, 0, 1);
 const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
 const now = new Date();
 const isCurrentYear = year === now.getUTCFullYear();
 const todayIdx = isCurrentYear
 ? Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 86400000)
 : daysInYear - 1;

 for (let i = 0; i < daysInYear; i++) {
 const date = new Date(start + i * 86400000);
 const dow = date.getUTCDay();
 let level = 0;
 if (scale > 0 && i <= todayIdx) {
 // base momentum waves through the year + a recent ramp-up
 const wave = (Math.sin(i / 26) + 1) / 2; // slow seasonal swell
 const ramp = isCurrentYear ? (i / Math.max(1, todayIdx)) * 0.4 : 0;
 let intensity = (wave * 0.7 + ramp + rand() * 0.5) * scale;
 if (dow === 0 || dow === 6) intensity -= 0.45 * scale; // quieter weekends
 if (rand() < 0.16) intensity = 0; // occasional off days
 if (rand() < 0.06 * scale) intensity += 0.8; // occasional crunch days
 level = Math.max(0, Math.min(4, Math.round(intensity * 3)));
 }
 const count = level === 0 ? 0 : level * 2 + Math.floor(rand() * 4);
 out.push({ date: date.toISOString().slice(0, 10), count, level });
 }
 return out;
 };

 const LANGS_BY_YEAR = {
 2026: [["TypeScript", 9], ["Python", 6], ["JavaScript", 5], ["HTML", 4], ["CSS", 3]],
 2025: [["JavaScript", 7], ["Python", 5], ["TypeScript", 4], ["CSS", 3], ["HTML", 2]],
 2024: [["Python", 6], ["JavaScript", 5], ["HTML", 3], ["CSS", 2], ["Shell", 1]],
 };

 const loadFake = (year) => {
 const y = Number(year);
 const days = genData(y);
 renderGraph(days);
 ghTotal.textContent = days.reduce((s, d) => s + d.count, 0).toLocaleString();
 renderLangs(LANGS_BY_YEAR[y] || LANGS_BY_YEAR[2026]);
 ghHandle.textContent = `github.com/${GH_USER}`;
 ghHandle.href = `https://github.com/${GH_USER}`;
 ghMsg.hidden = true;
 };

 const loadLive = async (year) => {
 const y = String(year);
 ghMsg.hidden = true;
 ghHandle.textContent = `github.com/${GH_USER}`;
 ghHandle.href = `https://github.com/${GH_USER}`;

 try {
 const [contribRes, reposRes] = await Promise.all([
 fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=${y}`),
 fetch(`https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=100`)
 ]);
 if (!contribRes.ok) throw new Error("contrib-failed");
 const contrib = await contribRes.json();
 const days = (contrib.contributions || []).map((d) => ({
 date: d.date,
 count: d.count,
 level: d.level
 }));
 renderGraph(days);
 const total = contrib.total?.[y] ?? days.reduce((s, d) => s + d.count, 0);
 ghTotal.textContent = Number(total).toLocaleString();

 if (reposRes.ok) {
 const repos = await reposRes.json();
 const langCounts = {};
 repos.forEach((repo) => {
 if (!repo.language || repo.fork) return;
 langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
 });
 const langs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
 renderLangs(langs.length ? langs : [["CSS", 1]]);
 } else {
 renderLangs([["CSS", 1], ["JavaScript", 1]]);
 }
 } catch (err) {
 ghMsg.hidden = false;
 ghMsg.textContent = "Couldn't load live GitHub data — showing cached snapshot.";
 loadFake(year);
 }
 };

 const load = (year) => {
 setLabels(year);
 if (isPlaceholder) loadFake(year);
 else loadLive(year);
 };

 ghYears.addEventListener("click", (e) => {
 const btn = e.target.closest(".gh__year");
 if (!btn) return;
 $$(".gh__year", ghYears).forEach((b) => b.classList.remove("is-active"));
 btn.classList.add("is-active");
 load(btn.dataset.year);
 });

 load("2026");
 }
})();
