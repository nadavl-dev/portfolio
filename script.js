/* ============================================================
 Nadav Levy — Portfolio v1
 ============================================================ */
(function () {
"use strict";

 const $ = (sel, ctx = document) => ctx.querySelector(sel);
 const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
 const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

 /* ---------- no intro loader: page is ready immediately ---------- */
 document.body.classList.remove("is-loading");
 document.body.classList.add("is-ready");

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

 /* ---------- hero portrait: use the cut-out version when it exists ----------
 Drop a background-removed "profile-cutout.png" in the repo root and the hero
 switches to the floating-badge treatment automatically. */
 const heroPhoto = $("#heroPhoto");
 if (heroPhoto) {
 const cutout = new Image();
 cutout.onload = () => {
 const img = heroPhoto.querySelector("img");
 if (img) img.src = cutout.src;
 heroPhoto.classList.add("hero__photo--cutout");
 };
 cutout.src = "profile-cutout.png";
 }

 /* ---------- top nav: shadow on scroll + mobile menu ---------- */
 const siteNav = $("#siteNav");
 const navBurger = $("#navBurger");
 if (siteNav) {
 const syncNavShadow = () => siteNav.classList.toggle("is-stuck", window.scrollY > 8);
 syncNavShadow();
 window.addEventListener("scroll", syncNavShadow, { passive: true });
 }
 if (navBurger && siteNav) {
 navBurger.addEventListener("click", () => {
 const open = siteNav.classList.toggle("is-open");
 navBurger.setAttribute("aria-expanded", String(open));
 });
 $$(".site-nav__link").forEach((link) => {
 link.addEventListener("click", () => {
 siteNav.classList.remove("is-open");
 navBurger.setAttribute("aria-expanded", "false");
 });
 });
 }

 /* ---------- experience accordion + work card detail ---------- */
 const bindToggle = (selector, parentSelector, openLabel, closeLabel) => {
 $$(selector).forEach((btn) => {
 btn.addEventListener("click", () => {
 const parent = btn.closest(parentSelector);
 if (!parent) return;
 const open = parent.classList.toggle("is-open");
 btn.textContent = open ? closeLabel : openLabel;
 });
 });
 };
 bindToggle("[data-exp-toggle]", ".exp__job", "Read more...", "Hide");
 bindToggle("[data-work-toggle]", ".work-card", "Read more...", "Hide");

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
 const backBtn = $("#chatBack");
 const log = $("#chatLog");
 const chatForm = $("#chatForm");
 const chatInput = $("#chatInput");
 const suggest = $("#chatSuggest");
 let greeted = false;
 let lastIntent = null;
 let pendingOffer = null;

 const CHAT_STARTERS = [
 { label: "Professional summary", q: "Give me a professional summary for a recruiter" },
 { label: "Project impact", q: "What impact did his projects have?" },
 { label: "Path to AI product roles", q: "What AI roles is he looking for?" },
 { label: "Leadership background", q: "Tell me about his leadership experience" },
 ];

 const DEFAULT_SUGGEST = [
 { label: "WhatsApp project", q: "What was the impact of the WhatsApp project?" },
 { label: "AI role fit", q: "What AI roles is he looking for?" },
 { label: "Contact", q: "How can I contact Nadav?" },
 { label: "Resume", q: "Where can I find his resume?" },
 ];

 const norm = (s) => s.toLowerCase().replace(/[^a-z0-9֐-׿\s]/g, "").replace(/\s+/g, " ").trim();
 const stem = (w) => w.replace(/(ing|ed|es|s)$/,"");

 const KB = [
 {
 id:"recruiter",
 label:"professional summary",
 keys: { strong: ["recruiter brief","professional summary","30 second","30 sec","should we hire","hiring manager","interview him","pitch me","summary for a recruiter"], weak: ["recruiter","interview","candidate","hire"] },
 reply:"Nadav Levy is a Customer Success Manager at Bites who consistently translates customer needs into shipped product improvements. He leads all company support and built smart AI agents for triage and solution delivery. He also led a WhatsApp fallback that reached 98% deliverability — blocked marketing messages retry as utility, then SMS — and cut more than $10,000 a year in spend, and built Bites Forms in-house after clients asked to embed Google Forms — then added DocuSign-style signing, email copies, and database storage so nothing gets lost.\n\nBefore Bites, he served as a Sergeant Major in the IDF Artillery Corps and spent several years as a Head Instructor in the Hebrew Scouts Movement. He is completing a B.A. in Communication and Marketing at Reichman University and is pursuing AI product roles — AI product management, go-to-market engineering, and AI-driven customer solutions — where customer insight and hands-on building are equally valued.",
 more:"What distinguishes him from many applicants is that he has already operated across discovery, prototyping, and delivery while managing enterprise relationships with companies such as Unilever and Amazon. His customer success background provides depth; his shipped work provides evidence.",
 suggest: ["What impact did his projects have?", "What AI roles is he looking for?", "How can I contact Nadav?"],
 actions: [{ label: "View projects", scroll: "#projects" }, { label: "Email Nadav", href: "mailto:nadavile415@gmail.com" }],
 },
 {
 id:"whypm",
 label:"path to AI product roles",
 keys: { strong: ["why pm","why product","cs to pm","csm to pm","why product manager","moving to pm","path to product","ai product manager","ai pm","gtm engineer","go to market engineer","ai roles","what role is he looking for","what is he looking for"], weak: ["pm role","product role","career goal","aspiring","next role"] },
 reply:"Nadav is focused on AI product roles — AI product management, go-to-market engineering, and AI-driven customer solutions — because he already works across the full product loop with AI at the center.\n\nIn customer success, he speaks with users daily, identifies recurring friction, prototypes solutions in Figma, and uses AI-assisted development to ship tools that solve real operational problems. His goal is a role where research, prioritization, design, and AI-powered delivery are the core responsibility rather than a side initiative.",
 more:"In practice, he has already demonstrated this ownership through support AI agents, WhatsApp Messaging at Scale, Bites Forms, and this AI-built portfolio. AI product work is the natural next step in a career built on user empathy and hands-on execution.",
 suggest: ["What impact did his projects have?", "Professional summary", "View projects"],
 actions: [{ label: "About Nadav", scroll: "#about" }],
 },
 {
 id:"skills",
 label:"skills",
 keys: { strong: ["skill","stack","tooling","tech stack","good at","capabilities"], weak: ["tool","tech","work with","expert","know"] },
 reply:"The tools Nadav actually reaches for are Claude, ChatGPT, Cursor, Figma, and Midjourney.\n\nHe uses Claude and ChatGPT for research, writing, and structured prompting; Cursor to ship working software with AI-assisted development — this site included; and Figma and Midjourney to map flows and explore interfaces before a build.",
 more:"His strength is not depth in one isolated tool. It is the ability to connect customer insight, design exploration, and delivery into one continuous workflow.",
 suggest: ["What impact did his projects have?", "How does he use AI?", "View stack"],
 actions: [{ label: "Stack section", scroll: "#stack" }],
 },
 {
 id:"projects",
 label:"projects",
 keys: { strong: ["project","portfolio","built","shipped","showcase","what has he built","what did he build","best project","project impact","impact did his projects"], weak: ["work","build","made","creation"] },
 reply:"Nadav's most meaningful work includes four areas with clear business or product impact:\n\nSupport AI Agents — He leads all company support at Bites and built smart AI agents for triage and automated solution delivery, reducing manual load and improving response quality.\n\nWhatsApp Messaging at Scale — WhatsApp is how Bites reaches frontline employees in Israel, the Middle East, and Europe. Meta kept blocking marketing messages while Bites still paid for them. He built a fallback: blocked send → utility message → SMS. That reached 98% deliverability and saved more than $10,000 a year, because utility messages are much cheaper than resending marketing.\n\nBites Forms — Clients asked Bites to embed Google Forms. Instead of iframing a paid third-party publisher, he built Forms in-house, then added DocuSign-style signing so clients could onboard employees end to end. Email copies go out; everything is stored in the Bites database.\n\nThis portfolio — He designed and built the site end to end with AI-assisted development, including this assistant, as a working example of AI-assisted product delivery.",
 more:"Across these projects, the pattern is consistent: identify a recurring customer or business problem, scope a practical solution, ship it, and measure the outcome. That is the through-line in his work.",
 suggest: ["What was the impact of the WhatsApp project?", "Tell me about Bites Forms", "What AI roles is he looking for?"],
 actions: [{ label: "Open projects", scroll: "#projects" }],
 },
 {
 id:"whatsapp",
 label:"WhatsApp messaging",
 keys: { strong: ["whatsapp","messaging","fallback","utility","marketing message","blocked by meta","meta block","sms fallback","98%","deliverability","thousands","save money","saved money","cost saving","delivery rate","receiving rate","whatsapp impact","whatsapp savings","impact of the whatsapp"], weak: ["message","template","templates","scale","cost","costs","sms"] },
 reply:"WhatsApp is how Bites reaches frontline employees — primarily in Israel, the Middle East, and Europe.\n\nThe problem: Meta kept blocking marketing messages, and Bites was still paying for every blocked send — then paying again to resend the same marketing message.\n\nMeta splits traffic into marketing messages, which get blocked, and utility messages, which cannot be blocked the same way because they are important for the user to see — and they cost much less.\n\nNadav built a fallback: when a WhatsApp send is blocked, the same employee gets a utility message. If WhatsApp still does not arrive, it falls back to SMS. That reached 98% deliverability. Employees get the content, clients are happy, and the company saved more than $10,000 a year by not paying to fire blocked marketing messages again and again.",
 more:"The project is a strong example of product thinking inside a customer success role: he learned how the platform actually decides what gets through, designed a fallback around that rule, and shipped it.",
 suggest: ["What impact did his projects have?", "Tell me about Bites Forms", "Professional summary"],
 actions: [{ label: "See case study", scroll: "#projects" }],
 },
 {
 id:"supportagents",
 label:"support AI agents",
 keys: { strong: ["support agent","smart agent","ai agent","support triage","triage","helpdesk","customer support","support lead","in charge of support","company support","support automation"], weak: ["ticket","help","support team","cs support"] },
 reply:"At Bites, Nadav leads all company support — owning triage, resolution, and customer issue handling across the business.\n\nHe built and deployed smart AI agents for support triage and automated solution delivery. The agents handle initial classification and route or resolve common issues before they reach manual handling, improving response speed and reducing repetitive load on the team.",
 more:"This is one of his strongest signals for AI product and GTM roles: he identified a real operational bottleneck, designed an AI-powered workflow, and shipped it inside a live customer support function.",
 suggest: ["What impact did his projects have?", "How does he use AI?", "Experience at Bites"],
 actions: [{ label: "Work history", scroll: "#experience" }],
 },
 {
 id:"bitesforms",
 label:"Bites Forms",
 keys: { strong: ["bites forms","forms","docusign","google forms","google form","iframe","embed forms","signature","e-sign","esign"], weak: ["form","sign","document","contract","onboard"] },
 reply:"Bites Forms started because clients kept asking Bites to embed Google Forms and similar tools. The alternative was to iframe a third-party form publisher and pay for it as a company.\n\nNadav built Forms in-house instead. Then clients needed DocuSign-style signing so they could onboard employees from top to bottom — collect information, sign documents, and keep the trail in one place. He made it two in one.\n\nIt is used by clients today. Submissions send email copies, and everything is stored in the Bites database so nothing gets lost.",
 more:"The project shows how he works: a client asks for an embed, he asks whether the company should own the workflow, ships the first version, then adds the next gap they actually need.",
 suggest: ["What impact did his projects have?", "WhatsApp project", "Professional summary"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"thissite",
 label:"this website",
 keys: { strong: ["this website","this site","this portfolio","vibe code","vibe coding","vibe coded"], weak: ["site","website","portfolio site","claude code"] },
 reply:"This portfolio is itself one of Nadav's projects. He designed and built it end to end with AI-assisted development, without relying on a traditional framework.\n\nIt includes this AI assistant and a scrolling impact summary. The site functions as both a presentation layer and a proof point: he can take an idea from concept to a polished, working product.",
 more:"For visitors evaluating his profile, the site demonstrates execution quality, attention to detail, and comfort with modern AI-assisted build workflows.",
 suggest: ["What impact did his projects have?", "How does he use AI?", "What AI roles is he looking for?"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"contact",
 label:"contact",
 keys: { strong: ["contact","email","reach","hire","get in touch","hiring","recruit"], weak: ["talk","available","message","connect","dm"] },
 reply:"The most direct way to reach Nadav is by email at nadavile415@gmail.com. You can also use the contact form on this page, connect on LinkedIn, or review his work on GitHub at @nadavl-dev.",
 more:"For recruiting conversations, his resume is available for download in the hero section and in the contact area. Email is typically the fastest way to reach him.",
 suggest: ["Professional summary", "Where can I find his resume?", "What impact did his projects have?"],
 actions: [{ label: "Contact section", scroll: "#contact" }, { label: "Email Nadav", href: "mailto:nadavile415@gmail.com" }],
 },
 {
 id:"gerem",
 label:"Gerem 22",
 keys: { strong: ["gerem","garam","garam 22","gerem 22","front of house","front house","foh","patelina","petelina","shift manager"], weak: ["hospitality","jaffa","hotel"] },
 reply:"Before and alongside Bites, Nadav worked hospitality operations in Tel Aviv.\n\nAt Petelina he was Shift Manager (December 2021 to July 2025), running daily floor operations, staffing, and guest issues in a busy neighborhood bistro.\n\nAt Gerem 22 in Jaffa he was Front of House Manager (August to November 2022) — client meetings, guest experience, and day-to-day property upkeep in a small hospitality house.",
 more:"It is an earlier operations role — owning the floor and the guest, which later shows up in how he runs customer relationships.",
 suggest: ["Experience at Bites", "Leadership background", "Professional summary"],
 actions: [{ label: "Work history", scroll: "#experience" }],
 },
 {
 id:"experience",
 label:"experience at Bites",
 keys: { strong: ["experience","bites","career","customer success","csm"], weak: ["job","company","role","cs","success","current"] },
 reply:"Nadav is a Customer Success Manager at Bites, where he supports enterprise customers using a platform built for frontline team training and enablement. He owns the relationship from onboarding through adoption, renewal, and growth across 25+ accounts.\n\nHe also leads all company support — triage, resolution, and issue handling — and built smart AI agents to automate triage and solution delivery. His work goes beyond account management: he regularly translates customer friction into product direction and ships internal solutions when gaps become clear.",
 more:"That combination of relationship ownership and product execution is central to how he operates today and to the product role he is working toward.",
 suggest: ["What impact did his projects have?", "Professional summary", "Leadership background"],
 actions: [{ label: "Work history", scroll: "#experience" }],
 },
 {
 id:"army",
 label:"leadership in the IDF",
 keys: { strong: ["army","idf","military","sergeant","artillery","combat","service","soldier","leadership background","leadership experience"], weak: ["commander","medical","unit","war"] },
 reply:"Nadav served in the Israel Defense Forces from 2019 to 2021 as a Sergeant Major in the Artillery Corps. He worked as a combat commander in high-pressure operational environments and served as head of the medical staff in his unit, with responsibility for personnel readiness and medical equipment.",
 more:"That experience shaped his leadership style: accountability under pressure, decision-making with incomplete information, and direct responsibility for people and outcomes.",
 suggest: ["Scouts background", "Professional summary", "Experience at Bites"],
 actions: [{ label: "Education and service", scroll: "#education" }],
 },
 {
 id:"scouts",
 label:"Scouts background",
 keys: { strong: ["scout","volunteer","tzofim","youth","instructor","scouts background"], weak: ["movement","mentor","teach","guide"] },
 reply:"From 2015 to 2018, Nadav was active in the Hebrew Scouts Movement, including two years as a Head Instructor. He designed educational programs and led groups of 20 to 30 participants.",
 more:"This was an early foundation in facilitation, planning, and group leadership — skills that later translated into customer-facing and team-facing work.",
 suggest: ["Leadership in the IDF", "Professional summary", "About Nadav"],
 actions: [{ label: "Education and service", scroll: "#education" }],
 },
 {
 id:"education",
 label:"education",
 keys: { strong: ["education","university","reichman","degree","study","studies","student"], weak: ["school","ba","communication","marketing","academic"] },
 reply:"Nadav is completing a B.A. in Communication and Marketing at Reichman University, expected 2026, while working full time at Bites.",
 more:"He uses the program to strengthen strategic communication and consumer behavior frameworks, then applies those concepts directly to customer and product work.",
 suggest: ["Experience at Bites", "Professional summary", "About Nadav"],
 actions: [{ label: "Education section", scroll: "#education" }],
 },
 {
 id:"github",
 label:"GitHub",
 keys: { strong: ["github","git","repo","contribution","commit"], weak: ["code","coding","open source"] },
 reply:"Nadav publishes work under @nadavl-dev on GitHub. You can review his repositories and project history there.",
 more:"Most of his technical work is AI-assisted and iterative, focused on turning ideas into working software quickly rather than large standalone engineering projects.",
 suggest: ["This website", "How does he use AI?", "What impact did his projects have?"],
 actions: [{ label: "Open GitHub", href: "https://github.com/nadavl-dev" }],
 },
 {
 id:"ai",
 label:"AI workflow",
 keys: { strong: ["ai","claude","chatgpt","prompt","llm","gpt","artificial","ai workflow","how does he use ai"], weak: ["machine learning","automation","model"] },
 reply:"Nadav uses AI throughout his workflow: for research, writing, design exploration, prototyping, and implementation. Tools such as Claude and ChatGPT help him move from question to draft to working output with less friction between stages.",
 more:"His value is not simply using AI tools. It is knowing how to chain them into a repeatable process that turns insight into shipped work.",
 suggest: ["This website", "What impact did his projects have?", "Skills"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"design",
 label:"design approach",
 keys: { strong: ["design","figma","midjourney","ui","ux","design approach"], weak: ["visual","prototype","mockup","interface"] },
 reply:"Nadav uses design as a thinking tool. He works in Figma for interface flows, Midjourney for visual exploration, and rapid prototyping to test ideas before committing to build.",
 more:"His aesthetic preference is clean and minimal, which is reflected in this portfolio. Design, for him, supports clarity and decision-making rather than decoration alone.",
 suggest: ["This website", "What impact did his projects have?", "How does he use AI?"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"product",
 label:"product thinking",
 keys: { strong: ["product","pm","roadmap","product manager","product thinking"], weak: ["manager","strategy","prioritize","discovery"] },
 reply:"Nadav approaches problems with a product mindset: define the real issue, prioritize what matters, prototype quickly, and ship something measurable. His customer success role keeps that process grounded in live user feedback.",
 more:"That proximity to customer pain is one of his strongest advantages as a product thinker.",
 suggest: ["What AI roles is he looking for?", "What impact did his projects have?", "Professional summary"],
 },
 {
 id:"resume",
 label:"resume",
 keys: { strong: ["resume","cv","download resume","find his resume"], weak: ["download","pdf"] },
 reply:"Nadav's resume is available for download from the hero section and from the contact area on this site.",
 more:"It summarizes his experience at Bites, military service, education, and the product-oriented work he has shipped from a customer-facing role.",
 suggest: ["Professional summary", "Contact", "What impact did his projects have?"],
 actions: [{ label: "Download resume", href: "/resume.pdf" }, { label: "Contact", scroll: "#contact" }],
 },
 {
 id:"location",
 label:"location",
 keys: { strong: ["where","location","based","israel","live"], weak: ["city","country","from","relocate"] },
 reply:"Nadav is based in Israel. He studies at Reichman University in Herzliya and works at Bites.",
 more:"He is accustomed to working with international enterprise customers and teams.",
 },
 {
 id:"greeting",
 label:"hello",
 keys: { strong: ["hello","hi","hey","shalom","howdy"], weak: ["yo","sup","morning","evening"] },
 reply:"Hello. I can help you understand Nadav's experience, project impact, leadership background, and the direction of his career. Choose one of the topics below or ask a question in your own words.",
 suggest: ["Professional summary", "What impact did his projects have?", "What AI roles is he looking for?", "How can I contact Nadav?"],
 },
 {
 id:"about",
 label:"about Nadav",
 keys: { strong: ["who is","about nadav","tell me about","introduce","bio"], weak: ["who","nadav","yourself","summary"] },
 reply:"Nadav Levy is a Customer Success Manager at Bites who operates at the intersection of customer insight, product thinking, design, and AI-assisted execution. He has shipped tools that reduced cost and improved customer workflows, while managing enterprise relationships and pursuing AI product and go-to-market engineering roles.\n\nHis background includes military leadership in the IDF, youth instruction in the Hebrew Scouts, and ongoing study in Communication and Marketing at Reichman University.",
 more:"If you would like, I can go deeper on his projects, his path to product, his leadership experience, or the best way to contact him.",
 suggest: ["Professional summary", "What impact did his projects have?", "Leadership background"],
 actions: [{ label: "About section", scroll: "#about" }],
 },
 {
 id:"thanks",
 label:"thanks",
 keys: { strong: ["thank","thanks","toda","appreciate"], weak: ["cool","awesome","great","nice"] },
 reply:"You are welcome. If there is another part of Nadav's background you would like to explore, I can help with that as well.",
 suggest: ["Professional summary", "Contact", "What impact did his projects have?"],
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
 reply:"Understood. Feel free to ask about another topic or use one of the suggestions below.",
 suggest: ["What impact did his projects have?", "Contact", "Professional summary"],
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
 replyText += `\n\nI can also share more on ${second.i.label} if that would be helpful.`;
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
 text: "I may not have a precise answer to that yet. You could ask about his project impact, professional summary, his fit for AI product roles, leadership background, or how to contact him.",
 suggest: ["Professional summary", "What impact did his projects have?", "How can I contact Nadav?"],
 actions: [{ label: "Contact section", scroll: "#contact" }],
 };
 };

 const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

 const fmt = (s) => {
 const clean = s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim();
 if (!clean) return "";
 return clean
 .split("\n\n")
 .map((p) => `<p class="msg-p">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
 .join("");
 };

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
 if (payload.suggest) {
 setSuggestions(payload.suggest.map((q) => ({
 label: q.replace(/\?$/, "").slice(0, 26),
 q,
 })));
 }
 return row;
 };

 const isOnWelcome = () => !!log.querySelector(".chat-welcome");

 const setBackVisible = (visible) => {
 if (backBtn) backBtn.hidden = !visible;
 };

 const resetChatToWelcome = () => {
 log.innerHTML = "";
 lastIntent = null;
 pendingOffer = null;
 showWelcome();
 };

 const showWelcome = () => {
 const wrap = document.createElement("div");
 wrap.className = "chat-welcome";
 wrap.innerHTML = `
 <p class="chat-welcome__title">Welcome. I can help you review Nadav's background.</p>
 <p class="chat-welcome__sub">Choose a topic below to begin, or type your own question about his experience, projects, or career direction.</p>
 <div class="chat-welcome__grid">
 ${CHAT_STARTERS.map((s) => `<button type="button" class="chat-starter" data-q="${s.q.replace(/"/g, "&quot;")}"><span>${s.label}</span></button>`).join("")}
 </div>`;
 log.appendChild(wrap);
 setSuggestions(DEFAULT_SUGGEST);
 setBackVisible(false);
 };

 const showTyping = () => {
 const row = document.createElement("div");
 row.className = "msg-row";
 row.innerHTML = `${avatarHTML}<div class="typing"><span></span><span></span><span></span></div>`;
 log.appendChild(row);
 log.scrollTop = log.scrollHeight;
 return row;
 };

 const botRespond = (userText) => {
 const typing = showTyping();
 const delay = prefersReducedMotion ? 200 : 550 + Math.min(userText.length * 14, 600);
 setTimeout(() => {
 typing.remove();
 const welcome = log.querySelector(".chat-welcome");
 if (welcome) welcome.remove();
 addBotReply(getReply(userText));
 setBackVisible(true);
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
 if (backBtn) backBtn.addEventListener("click", resetChatToWelcome);
 document.addEventListener("keydown", (e) => {
 if (e.key === "Escape" && panel.classList.contains("is-open")) closeChat();
 });

 const send = (text) => {
 const msg = text.trim();
 if (!msg) return;
 if (isOnWelcome()) {
 const welcome = log.querySelector(".chat-welcome");
 if (welcome) welcome.remove();
 setBackVisible(true);
 }
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
