/* ============================================================
 Nadav Levy — Portfolio v1
 ============================================================ */
(function () {
"use strict";

 const $ = (sel, ctx = document) => ctx.querySelector(sel);
 const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
 const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
 AI CHAT WIDGET (keyword demo)
 ============================================================ */
 const fab = $("#chatFab");
 const panel = $("#chatPanel");
 const closeBtn = $("#chatClose");
 const log = $("#chatLog");
 const chatForm = $("#chatForm");
 const chatInput = $("#chatInput");
 const suggest = $("#chatSuggest");
 let greeted = false;

 /* --- knowledge base: each intent has weighted keys, a reply, and a deeper"more" --- */
 const KB = [
 {
 id:"skills",
 label:"skills",
 keys: { strong: ["skill","stack","tooling","tech stack","good at","capabilities"], weak: ["tool","tech","work with","expert","know"] },
 reply:"Nadav works across four areas: **Product** (thinking, discovery, roadmapping), **AI tools** (Claude, ChatGPT, prompt engineering), **Design with AI** (Figma, Midjourney, rapid prototyping), and **Coding with AI** (vibe coding, HTML/CSS/JS, React basics). Scroll to the Skills section for the full list",
 more:"The thread connecting all of it: speed from idea to working thing. He uses AI at every step — research, writing, design exploration, and code — so one person can cover ground that used to need a team.",
 },
 {
 id:"projects",
 label:"projects",
 keys: { strong: ["project","portfolio","built","shipped","showcase","what has he built","what did he build"], weak: ["work","build","made","creation"] },
 reply:"Nadav has shipped a few real things: **1) WhatsApp Messaging at Scale** — a templating + smart-fallback system that saves the company **thousands of dollars a year** and boosted the message-receiving rate. **2) Bites Forms** — a Google-Forms-meets-DocuSign tool for his clients. **3) This website** — vibe-coded end-to-end with AI. **4) A Sushi infographic** — a clean visual designed with AI. Ask me about any one of them!",
 more:"His build style: scope something real, prototype it fast with AI, put it in front of users, iterate. The common thread is that he's a CSM who actually ships product — not just files tickets.",
 },
 {
 id:"whatsapp",
 label:"the WhatsApp project",
 keys: { strong: ["whatsapp","messaging","fallback","thousands","save money","saved money","cost saving","delivery rate","receiving rate"], weak: ["message","template","templates","scale","cost","costs"] },
 reply:"Nadav built a **WhatsApp messaging system at Bites** — reusable message templates plus a smarter fallback logic that routes around delivery failures. The impact: it saves the company **thousands of dollars a year** in messaging costs *and* boosted the **message-receiving rate** through better reach and reliability.",
 more:"It's a great example of how he works — spotting an expensive, overlooked operational problem and engineering a smarter system that's both cheaper and more effective. Real business impact from a Customer Success seat.",
 },
 {
 id:"bitesforms",
 label:"Bites Forms",
 keys: { strong: ["bites forms","forms","docusign","signature","e-sign","esign"], weak: ["form","sign","document","contract"] },
 reply:"**Bites Forms** is a product Nadav designed and shipped for his clients — a hybrid of **Google Forms and DocuSign** in one flow. Customers collect structured responses *and* capture legally-binding signatures in a single tool, no more juggling two separate platforms.",
 more:"It came straight from his customer work: he saw clients bouncing between a form tool and a signing tool, and built the thing that merged them. Classic product instinct from a CS role.",
 },
 {
 id:"thissite",
 label:"this website",
 keys: { strong: ["this website","this site","this portfolio","vibe code","vibe coding","vibe coded"], weak: ["site","website","portfolio site","claude code"] },
 reply:"This very site! Nadav vibe-coded it end-to-end with AI (Claude Code), no framework — liquid-glass navigation, a live GitHub contribution feed from the API, and, well… me. It's proof of his whole thesis: one person + the right tools = a real shipped product.",
 more:"Every part of it — the design system, the GitHub integration, this chatbot's logic — was built by describing intent to AI and iterating fast. That's the workflow he's most excited about.",
 },
 {
 id:"sushi",
 label:"his Art & Vision work",
 keys: { strong: ["sushi","infographic","infografic","art","vision"], weak: ["graphic","visual","poster","illustration","creative"] },
 reply:"Under **Art & Vision**, Nadav shows visual work designed with AI tools — like a clean, engaging infographic. You can see it (and click to open it full-size) in the Projects section.",
 more:"It shows his design side away from product work: a good eye for layout and the ability to go from idea to a polished, shareable visual quickly using AI.",
 },
 {
 id:"contact",
 label:"contact",
 keys: { strong: ["contact","email","reach","hire","get in touch","hiring","recruit"], weak: ["talk","available","message","connect","dm"] },
 reply:"Easiest way to reach Nadav is email: **nadavile415@gmail.com**. There's also a contact form on this page, plus LinkedIn (linkedin.com/in/nadav-levy-26a010273) and GitHub (@nadavl-dev). He's always up for a conversation about product, AI, or building things.",
 more:"If you're a recruiter: the resume download button is in the hero and the Contact section. He responds fastest to email.",
 },
 {
 id:"experience",
 label:"experience",
 keys: { strong: ["experience","bites","career","customer success","csm"], weak: ["job","company","role","cs","success","current"] },
 reply:"Nadav is a **Customer Success Manager at Bites** (2022 → present) — a platform that helps enterprise companies train and upskill frontline teams. He owns the customer lifecycle end-to-end: onboarding, adoption, renewal, and growth.",
 more:"What makes his CS work different: he operates like a PM. Customer pain gets translated into concrete product feedback, and he prototypes solutions with AI instead of just filing tickets. Companies like Unilever and Amazon use Bites.",
 },
 {
 id:"army",
 label:"military service",
 keys: { strong: ["army","idf","military","sergeant","artillery","combat","service","soldier"], weak: ["commander","medical","unit","war"] },
 reply:"Nadav served in the **IDF Artillery Corps** (Apr 2019 – Dec 2021) as a **Sergeant Major** — combat commander leading soldiers in high-pressure operational environments, plus head of his unit's medical staff and all medical equipment.",
 more:"That experience shaped how he works: staying calm under pressure, making decisions with incomplete information, and taking full ownership for the people around him. It translates directly to handling demanding enterprise customers.",
 },
 {
 id:"scouts",
 label:"volunteering",
 keys: { strong: ["scout","volunteer","tzofim","youth","instructor"], weak: ["movement","mentor","teach","guide"] },
 reply:"Before the army, Nadav spent **3.5 years in the Hebrew Scouts Movement** (2015–2018), including 2 years as a **Head Instructor** — designing educational programs and leading groups of 20–30 youth.",
 more:"It's where his leadership started: planning activities, handling conflicts, and creating an environment where people grow. Same core skill he uses with customers today.",
 },
 {
 id:"education",
 label:"education",
 keys: { strong: ["education","university","reichman","degree","study","studies","student"], weak: ["school","ba","communication","marketing","academic"] },
 reply:"Nadav is studying for a **B.A. in Communication with a Marketing track at Reichman University** (2023–2026) — while working full-time at Bites.",
 more:"The combo is deliberate: strategic communication and consumer-behavior frameworks from academia, applied immediately to real product and customer work at Bites.",
 },
 {
 id:"github",
 label:"GitHub",
 keys: { strong: ["github","git","repo","contribution","commit"], weak: ["code","coding","open source"] },
 reply:"Nadav codes under **@nadavl-dev** on GitHub — the GitHub section on this page pulls his real contribution heatmap and top languages live from the API.",
 more:"Most of his building is AI-assisted ('vibe coding') — describing what he wants precisely and iterating fast. This whole portfolio is an example.",
 },
 {
 id:"ai",
 label:"AI",
 keys: { strong: ["ai","claude","chatgpt","prompt","llm","gpt","artificial"], weak: ["machine learning","automation","model"] },
 reply:"AI is core to how Nadav works — Claude and ChatGPT for thinking and writing, prompt engineering for reliable output, and AI-assisted workflows end-to-end. This whole site was vibe-coded with AI",
 more:"His take: AI rewrote what one person can ship. The interesting skill isn't using a chatbot — it's chaining AI through research → design → build → test so ideas become products in days.",
 },
 {
 id:"design",
 label:"design",
 keys: { strong: ["design","figma","midjourney","ui","ux"], weak: ["visual","prototype","mockup","interface"] },
 reply:"Nadav designs *with* AI — Figma for UI/UX flows, Midjourney for visual concepts, and fast prototyping to test ideas before committing. The goal: idea → something tangible, quickly.",
 more:"He cares about clean, minimal interfaces (this black-and-white site is his taste). Design for him is a thinking tool, not decoration.",
 },
 {
 id:"product",
 label:"product",
 keys: { strong: ["product","pm","roadmap","product manager"], weak: ["manager","strategy","prioritize","discovery"] },
 reply:"Nadav approaches things with a product mindset: find the real problem, prioritize ruthlessly, prototype, ship. Coming from Customer Success means he stays close to actual user needs.",
 more:"CS is his unfair advantage as a product thinker — he hears unfiltered customer pain every day, so his product instincts are grounded in reality, not theory.",
 },
 {
 id:"resume",
 label:"resume",
 keys: { strong: ["resume","cv"], weak: ["download","pdf"] },
 reply:"You can grab Nadav's resume from the **Download Resume** button in the hero or the Contact section.",
 more:"Short version: CSM at Bites (2022–now), IDF Sergeant Major before that, B.A. in Communication & Marketing at Reichman in progress, and a Product/AI/Design generalist profile.",
 },
 {
 id:"location",
 label:"location",
 keys: { strong: ["where","location","based","israel","live"], weak: ["city","country","from","relocate"] },
 reply:"Nadav is based in **Israel** — he studies at Reichman University in Herzliya and works at Bites.",
 more:"He's comfortable working with international teams and customers — Bites serves global enterprise clients.",
 },
 {
 id:"greeting",
 label:"hello",
 keys: { strong: ["hello","hi","hey","shalom","howdy"], weak: ["yo","sup","morning","evening"] },
 reply:"Hey! I'm Nadav's AI assistant. Ask me anything — his skills, experience at Bites, army service, education, projects, or how to reach him.",
 more:"Try things like: *\"what did he do in the army?\"*, *\"what does he do at Bites?\"*, or *\"how do I contact him?\"*",
 },
 {
 id:"about",
 label:"about Nadav",
 keys: { strong: ["who is","about nadav","tell me about","introduce","bio"], weak: ["who","nadav","yourself","summary"] },
 reply:"Nadav Levy is a **Customer Success Manager at Bites** who works like a PM, designs with AI, and builds with AI. Before tech: IDF Sergeant Major in the Artillery Corps and Head Instructor in the Hebrew Scouts. Currently also studying Communication & Marketing at Reichman University.",
 more:"The pattern across everything: leading people, owning outcomes, and moving fast. Ask me about any specific chapter — army, scouts, Bites, or his AI workflow.",
 },
 {
 id:"thanks",
 label:"thanks",
 keys: { strong: ["thank","thanks","toda","appreciate"], weak: ["cool","awesome","great","nice"] },
 reply:"Anytime! Anything else you want to know about Nadav?",
 more:"I'm here all day. Literally — I'm a script.",
 },
 ];

 /* --- smarter matching: scoring + fuzzy + follow-up memory --- */
 let lastIntent = null;

 const norm = (s) => s.toLowerCase().replace(/[^a-z0-9֐-׿\s]/g, "").replace(/\s+/g, " ").trim();
 const stem = (w) => w.replace(/(ing|ed|es|s)$/,"");

 // levenshtein distance capped at 2 (early exit), for typo tolerance
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

 // returns match quality: 1 = exact/stem/phrase, 0.6 = fuzzy (typo), 0 = none
 const keyHit = (text, words, key) => {
 if (key.includes("")) return text.includes(key) ? 1 : 0; // phrases: substring match
 if (words.includes(key)) return 1;
 const sk = stem(key);
 let fuzzy = 0;
 for (const w of words) {
 if (stem(w) === sk) return 1;
 if (key.length >= 4 && w.length >= 4 && editDist(w, key) <= (key.length >= 7 ? 2 : 1)) fuzzy = 0.6; // typo tolerance
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

 const getReply = (text) => {
 const t = norm(text);
 const words = t.split(" ");

 // follow-up on the previous topic? ("tell me more","why", etc.)
 if (lastIntent && words.length <= 4 && FOLLOWUPS.some((f) => t === f || t.startsWith(f +"") || t.endsWith("" + f))) {
 const intent = KB.find((i) => i.id === lastIntent);
 if (intent && intent.more) { lastIntent = null; return intent.more; }
 }

 // score every intent, pick the best
 const ranked = KB.map((i) => ({ i, s: scoreIntent(i, t, words) }))
.filter((r) => r.s > 0)
.sort((a, b) => b.s - a.s);

 if (ranked.length) {
 const best = ranked[0];
 lastIntent = best.i.id;
 let reply = best.i.reply;
 // if a second topic also scored well, offer it
 const second = ranked[1];
 if (second && second.s >= 3 && second.i.id !== best.i.id && !["greeting","thanks"].includes(second.i.id)) {
 reply += `\n\nI can also tell you about his **${second.i.label}** — just ask.`;
 }
 return reply;
 }

 lastIntent = null;
 return"Hmm, I don't have that one. I know about Nadav's **skills**, **experience at Bites**, **army service**, **scouts**, **education**, **projects**, **AI workflow**, and **how to contact him**. Or email him directly: nadavile415@gmail.com";
 };

 // minimal markdown: **bold**
 const fmt = (s) => s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");

 const BOT_AVATAR ="bot-avatar.png";
 const BOT_FALLBACK =
"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 40 40%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23eeeeee%27/%3E%3Ccircle cx=%2720%27 cy=%2716%27 r=%276.5%27 fill=%27%23999999%27/%3E%3Cpath d=%27M7 37c1-7 6-11 13-11s12 4 13 11z%27 fill=%27%23999999%27/%3E%3C/svg%3E";
 const avatarHTML = `<img class="msg-avatar" src="${BOT_AVATAR}" alt="" onerror="this.onerror=null;this.src='${BOT_FALLBACK}'">`;

 const addMsg = (text, who) => {
 if (who ==="user") {
 const el = document.createElement("div");
 el.className ="msg msg--user";
 el.innerHTML = fmt(text);
 log.appendChild(el);
 log.scrollTop = log.scrollHeight;
 return el;
 }
 const row = document.createElement("div");
 row.className ="msg-row";
 row.innerHTML = `${avatarHTML}<div class="msg msg--bot">${fmt(text)}</div>`;
 log.appendChild(row);
 log.scrollTop = log.scrollHeight;
 return row;
 };

 const showTyping = () => {
 const row = document.createElement("div");
 row.className ="msg-row";
 row.innerHTML = `${avatarHTML}<div class="typing"><span></span><span></span><span></span></div>`;
 log.appendChild(row);
 log.scrollTop = log.scrollHeight;
 return row;
 };

 const botRespond = (userText) => {
 const typing = showTyping();
 const delay = prefersReducedMotion ? 200 : 650 + Math.min(userText.length * 18, 700);
 setTimeout(() => {
 typing.remove();
 addMsg(getReply(userText),"bot");
 }, delay);
 };

 const openChat = () => {
 panel.classList.add("is-open");
 panel.setAttribute("aria-hidden","false");
 fab.classList.add("is-open");
 fab.setAttribute("aria-expanded","true");
 if (!greeted) {
 greeted = true;
 setTimeout(() => addMsg("Hi! I'm Nadav's AI assistant. Ask me about his skills, projects, experience, or how to get in touch.","bot"), 250);
 }
 setTimeout(() => chatInput.focus(), 300);
 };
 const closeChat = () => {
 panel.classList.remove("is-open");
 panel.setAttribute("aria-hidden","true");
 fab.classList.remove("is-open");
 fab.setAttribute("aria-expanded","false");
 };
 const toggleChat = () => (panel.classList.contains("is-open") ? closeChat() : openChat());

 fab.addEventListener("click", toggleChat);
 closeBtn.addEventListener("click", closeChat);
 document.addEventListener("keydown", (e) => {
 if (e.key ==="Escape" && panel.classList.contains("is-open")) closeChat();
 });

 const send = (text) => {
 const msg = text.trim();
 if (!msg) return;
 addMsg(msg,"user");
 chatInput.value ="";
 botRespond(msg);
 };

 chatForm.addEventListener("submit", (e) => {
 e.preventDefault();
 send(chatInput.value);
 });
 suggest.addEventListener("click", (e) => {
 const btn = e.target.closest("button[data-q]");
 if (btn) { openChat(); send(btn.dataset.q); }
 });

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

 const load = (year) => {
 setLabels(year);
 loadFake(year);
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
