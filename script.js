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
 let lastLang = "en";

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

 const CHAT_STARTERS_HE = [
 { label: "סיכום מקצועי", q: "תן לי סיכום מקצועי למגייס" },
 { label: "השפעת הפרויקטים", q: "מה ההשפעה של הפרויקטים שלו?" },
 { label: "תפקידי AI", q: "לאיזה תפקידי AI הוא מחפש?" },
 { label: "רקע מנהיגות", q: "ספר על הרקע הניהולי שלו" },
 ];

 const DEFAULT_SUGGEST_HE = [
 { label: "פרויקט WhatsApp", q: "מה הייתה ההשפעה של פרויקט הוואטסאפ?" },
 { label: "תפקיד AI", q: "לאיזה תפקידי AI הוא מחפש?" },
 { label: "יצירת קשר", q: "איך אפשר ליצור איתו קשר?" },
 { label: "קורות חיים", q: "איפה קורות החיים?" },
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
 keys: { strong: ["skill","stack","tooling","tech stack","good at","capabilities","excel","sql","hubspot","zapier"], weak: ["tool","tech","work with","expert","know"] },
 reply:"Day to day Nadav works in Claude Code, Cursor, Figma, HubSpot, Zapier, Twilio, and Vercel.\n\nAlong the way he also picked up Excel and a working amount of SQL — enough to pull numbers, clean a sheet, and check what is actually in the database. Claude Code and Cursor are how he ships; this site is on Vercel; Twilio showed up in the WhatsApp fallback at Bites; Zapier is how he emails training certificates when the product does not cover it.",
 more:"His strength is not depth in one isolated tool. It is the ability to connect customer insight, design exploration, and delivery into one continuous workflow.",
 suggest: ["What impact did his projects have?", "How does he use AI?", "View stack"],
 actions: [{ label: "Stack section", scroll: "#stack" }],
 },
 {
 id:"projects",
 label:"projects",
 keys: { strong: ["project","portfolio","built","shipped","showcase","what has he built","what did he build","best project","project impact","impact did his projects"], weak: ["work","build","made","creation"] },
 reply:"Nadav's most meaningful work includes a few areas with clear business or product impact:\n\nSupport AI Agents — He leads all company support at Bites and built smart AI agents for triage and automated solution delivery, reducing manual load and improving response quality.\n\nWhatsApp Messaging at Scale — WhatsApp is how Bites reaches frontline employees in Israel, the Middle East, and Europe. Meta kept blocking marketing messages while Bites still paid for them. He built a fallback: blocked send → utility message → SMS. That reached 98% deliverability and saved more than $10,000 a year, because utility messages are much cheaper than resending marketing.\n\nBites Forms — Clients asked Bites to embed Google Forms. Instead of iframing a paid third-party publisher, he built Forms in-house, then added DocuSign-style signing so clients could onboard employees end to end. Email copies go out; everything is stored in the Bites database.\n\nTraining certificates with Zapier — Clients wanted a professional certificate after an employee finished training. The product does not support that. He connected the app with an API key, caught the completion on a Zapier webhook, filled a PDF with the name, the training, and the other fields they asked for, and emailed it to the client.\n\nThis portfolio — He designed and built the site end to end with AI-assisted development, including this assistant, as a working example of AI-assisted product delivery.",
 more:"Across these projects, the pattern is consistent: identify a recurring customer or business problem, scope a practical solution, ship it, and measure the outcome. That is the through-line in his work.",
 suggest: ["What was the impact of the WhatsApp project?", "Tell me about the Zapier certificates", "What AI roles is he looking for?"],
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
 id:"zapiercerts",
 label:"Zapier certificates",
 keys: { strong: ["zapier","certificate","certificates","training certificate","webhook","pdf certificate"], weak: ["automation","automations","pdf"] },
 reply:"Clients wanted a professional certificate after an employee finished training. Bites does not support that in the product.\n\nNadav connected the app with an API key, caught the completion on a Zapier webhook, filled a PDF with the employee's name, the training name, and the other details the client asked for, and emailed the finished certificate to them.",
 more:"It is the same move as Bites Forms: a customer ask the product does not cover yet, then a practical path that ships.",
 suggest: ["What impact did his projects have?", "Tell me about Bites Forms", "What tools does he use?"],
 actions: [{ label: "Read the case study", href: "zapier.html" }],
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
 keys: { strong: ["experience","bites","career","customer success","csm","what does he do","day to day","daily work"], weak: ["job","company","role","cs","success","current"] },
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
 actions: [{ label: "Work and education", scroll: "#experience" }],
 },
 {
 id:"scouts",
 label:"Scouts background",
 keys: { strong: ["scout","volunteer","tzofim","youth","instructor","scouts background"], weak: ["movement","mentor","teach","guide"] },
 reply:"From 2015 to 2018, Nadav was active in the Hebrew Scouts Movement, including two years as a Head Instructor. He designed educational programs and led groups of 20 to 30 participants.",
 more:"This was an early foundation in facilitation, planning, and group leadership — skills that later translated into customer-facing and team-facing work.",
 suggest: ["Leadership in the IDF", "Professional summary", "About Nadav"],
 actions: [{ label: "Work and education", scroll: "#experience" }],
 },
 {
 id:"education",
 label:"education",
 keys: { strong: ["education","university","reichman","degree","study","studies","student","graduate","graduation","when does he graduate","when did he graduate"], weak: ["school","ba","communication","marketing","academic","finish school"] },
 reply:"Nadav graduates in August 2026 with a B.A. in Communication and Marketing from Reichman University. He is working full time at Bites while he finishes the degree.",
 more:"He uses the program to strengthen strategic communication and consumer behavior frameworks, then applies those concepts directly to customer and product work.",
 suggest: ["Experience at Bites", "Professional summary", "About Nadav"],
 actions: [{ label: "Work and education", scroll: "#experience" }],
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
 reply:"Nadav uses AI throughout his workflow: research, writing, design exploration, prototyping, and implementation. Claude Code and Cursor are how he ships working software. HubSpot and Figma keep customer work and flows in one place; Twilio showed up in the WhatsApp fallback at Bites; Zapier is how he sends training certificates when the product does not cover it.",
 more:"His value is not simply using AI tools. It is knowing how to chain them into a repeatable process that turns insight into shipped work.",
 suggest: ["This website", "What impact did his projects have?", "Skills"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"design",
 label:"design approach",
 keys: { strong: ["design","figma","midjourney","ui","ux","design approach"], weak: ["visual","prototype","mockup","interface"] },
 reply:"Nadav uses design as a thinking tool. He maps user flows and prototypes interfaces in Figma before committing to a build, so ideas get tested while they are still cheap to change.",
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
 keys: { strong: ["where does he live","where do you live","where is he based","tel aviv","tlv","where","location","based","israel","live"], weak: ["city","country","from"] },
 reply:"Nadav lives in Tel Aviv. He studies at Reichman University in Herzliya and works at Bites.",
 more:"He already works with US accounts from Israel, so day-to-day customer work is both local and international.",
 suggest: ["Is he open to remote?", "What AI roles is he looking for?", "How can I contact Nadav?"],
 },
 {
 id:"age",
 label:"age",
 keys: { strong: ["how old","years old","age","birthday","born"], weak: ["old"] },
 reply:"Nadav is 26.",
 more:"He is finishing his degree in August 2026 while working full time at Bites.",
 suggest: ["Where does he live?", "When does he graduate?", "Professional summary"],
 },
 {
 id:"interests",
 label:"what drives him",
 keys: { strong: ["what drives","interested in","interests","passion","what does he care","what is he interested","ui ux","ui/ux"], weak: ["care about","curious","excited"] },
 reply:"Nadav is very interested in AI and technology — more on the business side and on product, and in finding the balance between both. He is also very interested in UI and UX.",
 more:"That is why he is aiming at AI product and AI engineer roles: understand the user, then build with AI.",
 suggest: ["What AI roles is he looking for?", "How does he use AI?", "What does he do in his free time?"],
 actions: [{ label: "About Nadav", scroll: "#about" }],
 },
 {
 id:"hobbies",
 label:"hobbies",
 keys: { strong: ["hobby","hobbies","free time","spare time","outside work","sports","football","soccer","basketball","fashion","reading","books"], weak: ["fun","personal life","weekend"] },
 reply:"In his free time Nadav plays sports — football, basketball, basically any sport. His hobbies are sports, reading books, and fashion. He loves fashion as well.",
 more:"If you want the work story, ask about Bites, the WhatsApp project, or Bites Forms.",
 suggest: ["What drives him?", "What impact did his projects have?", "How can I contact Nadav?"],
 },
 {
 id:"languages",
 label:"languages",
 keys: { strong: ["language","languages","hebrew","english","speak","fluent","bilingual"], weak: ["ivrit"] },
 reply:"Nadav works in Hebrew and English. He owns the Israel client portfolio and several US accounts, so customer conversations happen in both.",
 more:"That mix is useful for AI product and GTM roles that sit between local operators and international teams.",
 suggest: ["Experience at Bites", "How can I contact Nadav?", "Professional summary"],
 actions: [{ label: "About Nadav", scroll: "#about" }],
 },
 {
 id:"available",
 label:"availability",
 keys: { strong: ["available","open to work","looking for a job","looking for work","can i hire","is he hiring","job search","notice period"], weak: ["start date","when can he"] },
 reply:"Nadav is open to AI product and AI engineer roles — AI product manager, AI engineer, go-to-market engineer, or similar. Email is the fastest start: nadavile415@gmail.com.",
 more:"His resume is on this site if you want the one-pager before you write.",
 suggest: ["What AI roles is he looking for?", "Professional summary", "How can I contact Nadav?"],
 actions: [{ label: "Email Nadav", href: "mailto:nadavile415@gmail.com" }, { label: "Download resume", href: "/resume.pdf" }],
 },
 {
 id:"clients",
 label:"clients",
 keys: { strong: ["unilever","amazon","enterprise client","which clients","who are his clients","what companies"], weak: ["accounts"] },
 reply:"At Bites he owns 25+ accounts — small businesses through large enterprises — including companies such as Unilever and Amazon. He manages the full Israel portfolio and several US accounts.",
 more:"The through-line is the same at every size: onboarding, adoption, renewal, and turning recurring friction into something the product team can ship.",
 suggest: ["Experience at Bites", "What impact did his projects have?", "Professional summary"],
 actions: [{ label: "Work and education", scroll: "#experience" }],
 },
 {
 id:"whyhim",
 label:"why Nadav",
 keys: { strong: ["why hire","why him","stand out","what makes him","why should we","why nadav","what is unique"], weak: ["strength","strengths","advantage","differentiator"] },
 reply:"What distinguishes him is that he already runs the full loop: talk to customers, spot the pattern, prototype, and ship. He leads company support, built AI agents for triage, shipped a WhatsApp fallback that hit 98% deliverability and saved $10,000+ a year, and built Bites Forms in-house instead of paying a third-party publisher.\n\nHe has also operated enterprise relationships with companies such as Unilever and Amazon while finishing a Communication and Marketing degree at Reichman.",
 more:"That combination — customer depth plus shipped product — is the case for AI product and GTM roles.",
 suggest: ["What impact did his projects have?", "Professional summary", "How can I contact Nadav?"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"cancode",
 label:"can he code",
 keys: { strong: ["can he code","does he code","vibe code","vibe coding","is he a developer","is he a programmer","is he an engineer"], weak: ["coder","python","javascript"] },
 reply:"He can vibe-code. He is not a traditional coder and does not have a CS or Python-style major. Claude Code and Cursor are how he ships — this site is the proof.",
 more:"The point is not leetcode. It is taking a real customer problem and getting a working product out.",
 suggest: ["How did he learn to build?", "This website", "What impact did his projects have?"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"peoplelead",
 label:"managed people",
 keys: { strong: ["managed people","manage people","people manager","has he managed","did he manage","manage a team","managed a team"], weak: ["direct reports","ran a team"] },
 reply:"Yes. He ran the floor as Shift Manager at Petelina, was Front of House Manager at Gerem 22, served as a combat commander in the IDF Artillery Corps, and was a Head Instructor in the Hebrew Scouts.",
 more:"That is operations and people under pressure — staffing, guests, soldiers, and youth groups — not a software-engineering org chart.",
 suggest: ["Leadership in the IDF", "Experience at Bites", "Professional summary"],
 actions: [{ label: "Work and education", scroll: "#experience" }],
 },
 {
 id:"typicalday",
 label:"typical day",
 keys: { strong: ["typical day","day to day","day-to-day","what does a day","everyday work","daily work"], weak: ["routine","schedule"] },
 reply:"A typical day is customer conversations, support triage, and turning recurring friction into product and AI work.",
 more:"That is also how WhatsApp fallback and Bites Forms started — a pattern in the queue, then something shipped.",
 suggest: ["Experience at Bites", "What impact did his projects have?", "How does he use AI?"],
 actions: [{ label: "Work and education", scroll: "#experience" }],
 },
 {
 id:"remote",
 label:"remote or office",
 keys: { strong: ["remote","hybrid","office","on site","onsite","wfh","work from home","in person"], weak: ["relocate","relocation"] },
 reply:"He is based in Tel Aviv. The role can be remote or not — he can do either. He prefers office.",
 more:"He already works with US accounts from Israel. For a specific setup, email nadavile415@gmail.com.",
 suggest: ["Where does he live?", "What AI roles is he looking for?", "How can I contact Nadav?"],
 actions: [{ label: "Email Nadav", href: "mailto:nadavile415@gmail.com" }],
 },
 {
 id:"favoritework",
 label:"biggest work",
 keys: { strong: ["favorite project","favourite project","biggest project","proudest","best work","favorite work","biggest work"], weak: ["most proud","highlight"] },
 reply:"The two that matter most are both of them: the WhatsApp fallback — 98% deliverability and $10,000+ saved a year — and Bites Forms, built in-house after clients asked to embed Google Forms, then given DocuSign-style signing.",
 more:"Same pattern in both: a customer problem he could not ignore, then ship it.",
 suggest: ["What was the impact of the WhatsApp project?", "Tell me about Bites Forms", "How did he learn to build?"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"learned",
 label:"how he learned to build",
 keys: { strong: ["how did he learn","how he learned","self taught","self-taught","learn to build","learn to code","youtube"], weak: ["taught himself","picked up"] },
 reply:"He learned by himself — a lot of YouTube, then shipping real customer problems with AI-assisted tools. No CS major.",
 more:"Claude Code and Cursor are the current stack. The portfolio is one of the things that came out of that.",
 suggest: ["Can he code?", "This website", "What impact did his projects have?"],
 actions: [{ label: "View projects", scroll: "#projects" }],
 },
 {
 id:"greeting",
 label:"hello",
 keys: { strong: ["hello","hi","hey","shalom","howdy"], weak: ["yo","sup","morning","evening"] },
 reply:"Hello. Ask anything about Nadav in your own words — work, school, what drives him, or just the person. You can also pick a topic below.",
 suggest: ["Professional summary", "What impact did his projects have?", "What AI roles is he looking for?", "How can I contact Nadav?"],
 },
 {
 id:"about",
 label:"about Nadav",
 keys: { strong: ["who is","about nadav","tell me about","introduce","bio","who is he","tell me about him"], weak: ["who","nadav","yourself","summary"] },
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

 const isHebrew = (s) => /[\u0590-\u05FF]/.test(s);

 const keyHitHe = (text, words, key) => {
 if (key.includes(" ")) return text.includes(key) ? 1 : 0;
 return words.includes(key) ? 1 : 0;
 };

 const hePack = (intent) => (typeof HE !== "undefined" && HE[intent.id]) || {};

 const scoreIntent = (intent, text, words) => {
 let score = 0;
 intent.keys.strong.forEach((k) => { score += 3 * keyHit(text, words, k); });
 intent.keys.weak.forEach((k) => { score += 1 * keyHit(text, words, k); });
 const heKeys = intent.keys.he || hePack(intent).keys || [];
 heKeys.forEach((k) => { score += 3 * keyHitHe(text, words, k); });
 return score;
 };

 /* Extra facts for questions that are not a dedicated topic. */
 const PROFILE = [
 { keys: ["salary","compensation","pay","rate","how much"], fact:"Compensation is not listed here. Email nadavile415@gmail.com if you want to talk about a role.", factHe:"שכר לא מופיע כאן. אפשר לכתוב ל־nadavile415@gmail.com אם רוצים לדבר על תפקיד." },
 { keys: ["visa","work permit","authorization"], fact:"Nadav lives in Tel Aviv and already works with US accounts. For work-authorization details, email nadavile415@gmail.com.", factHe:"נדב גר בתל אביב וכבר עובד מול לקוחות בארה״ב. לפרטי אשרת עבודה — nadavile415@gmail.com." },
 { keys: ["name","pronounce","levy"], fact:"His name is Nadav Levy. He is 26, lives in Tel Aviv, and is a Customer Success Manager at Bites.", factHe:"קוראים לו נדב לוי. הוא בן 26, גר בתל אביב, ו־Customer Success Manager ב־Bites." },
 { keysHe: ["משכורת","שכר","כמה הוא מרוויח"], fact:"Compensation is not listed here. Email nadavile415@gmail.com if you want to talk about a role.", factHe:"שכר לא מופיע כאן. אפשר לכתוב ל־nadavile415@gmail.com אם רוצים לדבר על תפקיד." },
 { keysHe: ["ויזה","אשרה","אשרת עבודה"], fact:"Nadav lives in Tel Aviv and already works with US accounts. For work-authorization details, email nadavile415@gmail.com.", factHe:"נדב גר בתל אביב וכבר עובד מול לקוחות בארה״ב. לפרטי אשרת עבודה — nadavile415@gmail.com." },
 { keysHe: ["איך קוראים לו","מה השם","השם שלו"], fact:"His name is Nadav Levy. He is 26, lives in Tel Aviv, and is a Customer Success Manager at Bites.", factHe:"קוראים לו נדב לוי. הוא בן 26, גר בתל אביב, ו־Customer Success Manager ב־Bites." },
 ];

 const HE = {
 recruiter: {
 keys: ["סיכום","סיכום מקצועי","מגייס","ראיון","למה לקחת אותו","תקציר"],
 reply:"נדב לוי הוא Customer Success Manager ב־Bites. הוא הופך צרכים של לקוחות למוצר שיוצא לדרך: מוביל את כל התמיכה בחברה, בנה סוכני AI לטריאז' ולפתרונות, בנה נפילה חכמה בוואטסאפ שהגיעה ל־98% מסירה וחסכה יותר מ־10,000 דולר בשנה, ובנה את Bites Forms בפנים אחרי שלקוחות ביקשו להטמיע גוגל פורמס — כולל חתימה בסגנון DocuSign.\n\nלפני Bites הוא היה רב־סמל בחיל התותחנים ורכז בתנועת הצופים. הוא מסיים תואר ראשון בתקשורת ושיווק ברייכמן ומכוון לתפקידי מוצר AI — ניהול מוצר, GTM, ופתרונות ללקוחות — במקום שבו הבנת משתמשים ובנייה עם AI שווים.",
 more:"מה שמייחד אותו: הוא כבר רץ על דיסקברי, פרוטוטייפ ומסירה, במקביל לניהול לקוחות כמו יוניליוור ואמזון.",
 suggest: ["מה ההשפעה של הפרויקטים שלו?","לאיזה תפקידי AI הוא מחפש?","איך אפשר ליצור איתו קשר?"],
 },
 whypm: {
 keys: ["תפקיד ai","תפקידי ai","מנהל מוצר","למה מוצר","איזה תפקיד","מה הוא מחפש"],
 reply:"נדב מכוון לתפקידי מוצר AI — ניהול מוצר, הנדסת GTM, ופתרונות ללקוחות — כי הוא כבר עובד על כל הלולאה עם AI במרכז. ב־CS הוא מדבר עם משתמשים כל יום, מזהה חיכוך, משרטט בפיגמה, ומוציא כלים עם פיתוח בסיוע AI.",
 more:"הסוכנים, הוואטסאפ, הטפסים והפורטפוליו כבר מראים את הבעלות הזאת.",
 suggest: ["מה ההשפעה של הפרויקטים שלו?","סיכום מקצועי"],
 },
 skills: {
 keys: ["כלים","סטאק","במה הוא עובד","אקסל","sql","האבספוט","זאפייר"],
 reply:"ביום־יום: Claude Code, Cursor, Figma, HubSpot, Zapier, Twilio ו־Vercel. בדרך הוא גם הרים אקסל ו־SQL ברמה שעובדת — למשוך מספרים, לנקות גיליון, ולבדוק מה באמת במסד. האתר הזה על Vercel; טוויליו נכנס בנפילת הוואטסאפ ב־Bites; Zapier שולח תעודות הדרכה כשהמוצר לא מכסה את זה.",
 more:"החוזק הוא לא כלי אחד. זה לחבר תובנת לקוח, עיצוב ומסירה.",
 suggest: ["איך הוא משתמש ב־AI?","מה ההשפעה של הפרויקטים שלו?"],
 },
 projects: {
 keys: ["פרויקטים","מה הוא בנה","עבודות","תיק עבודות"],
 reply:"כמה דברים עם השפעה: סוכני AI לתמיכה; וואטסאפ בקנה מידה — נפילה מ־marketing ל־utility ואז SMS, 98% מסירה ויותר מ־10,000 דולר חיסכון בשנה; Bites Forms בפנים במקום גוגל פורמס, עם חתימה; תעודות הדרכה ב־Zapier — וובהוק, PDF במייל ללקוח; והפורטפוליו הזה, שנבנה מקצה לקצה עם AI.",
 more:"אותו דפוס: בעיה שחוזרת, פתרון פרקטי, משלוח, מדידה.",
 suggest: ["מה הייתה ההשפעה של פרויקט הוואטסאפ?","ספר על התעודות ב־Zapier"],
 },
 whatsapp: {
 keys: ["וואטסאפ","ווטסאפ","whatsapp","פרויקט הוואטסאפ","פרויקט הווטסאפ","מסירה","98","חיסכון"],
 reply:"וואטסאפ זה איך Bites מגיעים לעובדי קו בארץ, במזרח התיכון ובאירופה. מטא חסמה הודעות שיווק ו־Bites עדיין שילמו. נדב בנה נפילה: חסימה → הודעת utility → SMS. 98% מסירה, יותר מ־10,000 דולר חיסכון בשנה, כי utility זול יותר מלשלוח שיווק שוב.",
 more:"חשיבת מוצר מתוך CS: להבין איך הפלטפורמה מחליטה מה עובר, ולבנות סביב זה.",
 suggest: ["ספר על Bites Forms","סיכום מקצועי"],
 },
 supportagents: {
 keys: ["סוכני ai","תמיכה","טריאז","helpdesk"],
 reply:"ב־Bites נדב מוביל את כל התמיכה — טריאז', פתרון, וטיפול בפניות. הוא בנה סוכני AI שמסווגים ומעבירים או פותרים פניות נפוצות לפני שהן מגיעות לטיפול ידני.",
 more:"צוואר בקבוק אמיתי, תהליך עם AI, ומסירה בתוך תמיכה חיה.",
 suggest: ["איך הוא משתמש ב־AI?","ניסיון ב־Bites"],
 },
 bitesforms: {
 keys: ["טפסים","ביטס פורמס","בייטס פורמס","גוגל פורמס","חתימה","docusign","bites forms"],
 reply:"לקוחות ביקשו להטמיע גוגל פורמס. במקום לשלם על פאבלישר חיצוני, נדב בנה טפסים בפנים. אחר כך הוסיף חתימה בסגנון DocuSign לקליטת עובדים — שניים באחד. עותקים במייל, הכל במסד של Bites.",
 more:"לקוח מבקש הטמעה, הוא שואל אם החברה צריכה להחזיק את התהליך, מוציא גרסה, וסוגר את הפער הבא.",
 suggest: ["פרויקט הוואטסאפ","סיכום מקצועי"],
 },
 zapiercerts: {
 keys: ["זאפייר","zapier","תעודה","תעודות","תעודת הדרכה","וובהוק"],
 reply:"לקוחות רצו תעודה מקצועית אחרי שעובד מסיים הדרכה. במוצר של Bites זה לא קיים. נדב חיבר את האפליקציה עם מפתח API, תפס את הסיום ב־webhook של Zapier, מילא PDF עם שם העובד, שם ההדרכה ושאר השדות שהלקוח ביקש, ושלח במייל.",
 more:"אותו מהלך כמו הטפסים: בקשת לקוח שהמוצר עוד לא מכסה, ואז נתיב פרקטי שיוצא.",
 suggest: ["מה ההשפעה של הפרויקטים שלו?","ספר על Bites Forms"],
 },
 thissite: {
 keys: ["האתר","הפורטפוליו","האתר הזה"],
 reply:"הפורטפוליו עצמו הוא פרויקט. נדב עיצב ובנה אותו מקצה לקצה עם פיתוח בסיוע AI, בלי פריימוורק כבד. יש כאן את העוזר הזה. זה גם מצגת וגם הוכחה שהוא מוציא מוצר עובד.",
 more:"איכות ביצוע, תשומת לב, ונוחות עם כלי AI.",
 suggest: ["איך הוא למד לבנות?","הוא יודע לקודד?"],
 },
 contact: {
 keys: ["צור קשר","מייל","אימייל","ליצור קשר","איך אפשר ליצור איתו קשר","איך ליצור קשר","איך מגיעים אליו"],
 reply:"הכי ישיר: nadavile415@gmail.com. אפשר גם את הטופס באתר, לינקדאין, או גיטהאב @nadavl-dev.",
 more:"לגיוס — הקורות חיים להורדה בהירו ובקונטקט. מייל בדרך כלל הכי מהיר.",
 suggest: ["סיכום מקצועי","איפה קורות החיים?"],
 },
 gerem: {
 keys: ["גרם","פטלינה","פטלינה","מנהל משמרת","כניסה"],
 reply:"לפני ובמקביל ל־Bites נדב עבד בהכנסת אורחים בתל אביב. בפטלינה הוא היה מנהל משמרת (דצמבר 2021–יולי 2025). בגרם 22 ביפו הוא היה מנהל קבלה (אוגוסט–נובמבר 2022).",
 more:"תפקיד תפעול מוקדם — הרצפה והאורח — שחוזר אחר כך בניהול לקוחות.",
 suggest: ["ניסיון ב־Bites","רקע מנהיגות"],
 },
 experience: {
 keys: ["ביטס","ניסיון","קריירה","הצלחת לקוחות","מה הוא עושה בביטס","מה הוא עושה בעבודה"],
 reply:"נדב הוא CSM ב־Bites, פלטפורמה להכשרת עובדי קו. הוא מחזיק 25+ חשבונות מקצה לקצה, מוביל את התמיכה, ובנה סוכני AI לטריאז'. מעבר לחשבון: הוא הופך חיכוך לכיוון מוצר ומוציא פתרונות פנימיים.",
 more:"בעלות על הקשר וביצוע מוצר — זה הכיוון לתפקיד המוצר.",
 suggest: ["מה ההשפעה של הפרויקטים שלו?","סיכום מקצועי"],
 },
 army: {
 keys: ["צבא","צהל","תותחנים","קצונה","שירות","רב סמל"],
 reply:"נדב שירת בצה״ל מ־2019 עד 2021 כרב־סמל בחיל התותחנים. מפקד לוחם, וגם ראש הצוות הרפואי ביחידה.",
 more:"אחריות תחת לחץ, החלטות עם מידע חסר, ואנשים על הראש.",
 suggest: ["צופים","ניסיון ב־Bites"],
 },
 scouts: {
 keys: ["צופים","מדריך","נוער","תנועת הצופים"],
 reply:"מ־2015 עד 2018 בתנועת הצופים, שנתיים כרכז. בנה תוכניות והוביל קבוצות של 20–30.",
 more:"בסיס מוקדם בהנחיה, תכנון ומנהיגות קבוצה.",
 suggest: ["רקע בצה״ל","סיכום מקצועי"],
 },
 education: {
 keys: ["לימודים","תואר","רייכמן","מתי הוא מסיים","מתי מסיים","סיום לימודים","אוגוסט 2026","בוגר"],
 reply:"נדב מסיים באוגוסט 2026 תואר ראשון בתקשורת ושיווק באוניברסיטת רייכמן. במקביל הוא עובד מלא ב־Bites.",
 more:"הוא לוקח משם תקשורת והתנהגות צרכן, ומוריד ישר לעבודה מול לקוחות ומוצר.",
 suggest: ["ניסיון ב־Bites","בן כמה הוא?"],
 },
 github: {
 keys: ["גיטהאב","גיט","קוד פתוח"],
 reply:"העבודה שלו בגיטהאב תחת @nadavl-dev.",
 more:"רוב העבודה הטכנית בסיוע AI, ממוקדת בהוצאת רעיון למוצר עובד.",
 suggest: ["האתר הזה","איך הוא משתמש ב־AI?"],
 },
 ai: {
 keys: ["בינה מלאכותית","איך הוא משתמש בai","קלוד","chatgpt"],
 reply:"AI רץ אצלו על מחקר, כתיבה, עיצוב, פרוטוטייפ ומסירה. Claude Code ו־Cursor הם איך הוא מוציא תוכנה. HubSpot ופיגמה מחזיקים את העבודה מול לקוחות; טוויליו נכנס בוואטסאפ.",
 more:"הערך הוא לא הכלי. זה לשרשר אותם לתהליך שחוזר על עצמו.",
 suggest: ["הוא יודע לקודד?","מה ההשפעה של הפרויקטים שלו?"],
 },
 design: {
 keys: ["עיצוב","פיגמה","יו איקס","ui","ux"],
 reply:"עיצוב אצלו הוא כלי חשיבה. הוא ממפה פלואוז ומשרטט בפיגמה לפני בנייה, כשהשינוי עוד זול.",
 more:"נקי ומינימלי — כמו האתר. בהירות, לא קישוט.",
 suggest: ["מה מעניין אותו?","האתר הזה"],
 },
 product: {
 keys: ["חשיבת מוצר","מוצר","פריוריטי"],
 reply:"גישת מוצר: להגדיר את הבעיה האמיתית, לדרג, לשרטט מהר, ולהוציא משהו מדיד. ה־CS משאיר אותו צמוד לפידבק חי.",
 more:"הקרבה לכאב של הלקוח היא יתרון.",
 suggest: ["לאיזה תפקידי AI הוא מחפש?","סיכום מקצועי"],
 },
 resume: {
 keys: ["קורות חיים","קוח","cv","resume"],
 reply:"קורות החיים להורדה מההירו ומהקונטקט באתר.",
 more:"יש שם Bites, שירות, לימודים, והמוצרים שהוא הוציא מתוך תפקיד מול לקוחות.",
 suggest: ["סיכום מקצועי","איך אפשר ליצור איתו קשר?"],
 },
 location: {
 keys: ["איפה הוא גר","איפה אתה גר","איפה נדב גר","תל אביב","מגורים","מאיפה הוא"],
 reply:"נדב גר בתל אביב. הוא לומד באוניברסיטת רייכמן בהרצליה ועובד ב־Bites.",
 more:"הוא כבר עובד מול לקוחות בארה״ב מישראל.",
 suggest: ["הוא פתוח לעבודה מרחוק?","איך אפשר ליצור איתו קשר?"],
 },
 age: {
 keys: ["בן כמה","בן כמה הוא","בן כמה אתה","מה הגיל","גיל"],
 reply:"נדב בן 26.",
 more:"הוא מסיים את התואר באוגוסט 2026 ועובד מלא ב־Bites.",
 suggest: ["איפה הוא גר?","מתי הוא מסיים?"],
 },
 interests: {
 keys: ["מה מעניין אותו","מה דוחף אותו","תחומי עניין","ui ux","עיצוב חוויה"],
 reply:"הוא מאוד מתעניין ב־AI ובטכנולוגיה — יותר בצד העסקי ובמוצר, ובאיזון ביניהם. הוא גם מאוד מתעניין ב־UI/UX.",
 more:"לכן הוא מכוון לתפקידי מוצר ומהנדס AI: להבין את המשתמש, ואז לבנות עם AI.",
 suggest: ["לאיזה תפקידי AI הוא מחפש?","מה הוא עושה בזמן הפנוי?"],
 },
 hobbies: {
 keys: ["תחביבים","זמן פנוי","בזמן הפנוי","מה הוא עושה בזמן הפנוי","ספורט","כדורגל","כדורסל","אופנה","ספרים","קריאה"],
 reply:"בזמן הפנוי הוא עושה ספורט — כדורגל, כדורסל, בעצם כל ספורט. התחביבים: ספורט, קריאת ספרים ואופנה. הוא אוהב אופנה.",
 more:"לסיפור העבודה — Bites, הוואטסאפ או הטפסים.",
 suggest: ["מה מעניין אותו?","מה ההשפעה של הפרויקטים שלו?"],
 },
 languages: {
 keys: ["שפות","עברית","אנגלית","דו לשוני"],
 reply:"נדב עובד בעברית ובאנגלית. הוא מחזיק את תיק ישראל וכמה חשבונות בארה״ב.",
 more:"שימושי לתפקידי מוצר ו־GTM בין שטח מקומי לצוותים בחו״ל.",
 suggest: ["ניסיון ב־Bites","איך אפשר ליצור איתו קשר?"],
 },
 available: {
 keys: ["זמין","מחפש עבודה","אפשר לגייס","מתי הוא יכול"],
 reply:"הוא פתוח לתפקידי מוצר AI ומהנדס AI. המייל הכי מהיר: nadavile415@gmail.com.",
 more:"הקורות חיים באתר אם רוצים דף אחד לפני שכותבים.",
 suggest: ["לאיזה תפקידי AI הוא מחפש?","איך אפשר ליצור איתו קשר?"],
 },
 clients: {
 keys: ["לקוחות","יוניליוור","אמזון","איזה חברות"],
 reply:"ב־Bites הוא מחזיק 25+ חשבונות — מעסקים קטנים עד ארגונים, כולל יוניליוור ואמזון. תיק ישראל מלא וכמה חשבונות בארה״ב.",
 more:"אותו קו בכל גודל: אונבורדינג, אימוץ, חידוש, והפיכת חיכוך למוצר.",
 suggest: ["ניסיון ב־Bites","מה ההשפעה של הפרויקטים שלו?"],
 },
 whyhim: {
 keys: ["למה הוא","למה לקחת","מה מייחד","ייחודי"],
 reply:"הוא כבר רץ על כל הלולאה: לדבר עם לקוחות, לראות דפוס, לשרטט, להוציא. מוביל תמיכה, בנה סוכנים, הוציא נפילת וואטסאפ ב־98% וחיסכון של 10,000+ דולר, ובנה טפסים בפנים. במקביל לקוחות כמו יוניליוור ואמזון, ותואר ברייכמן.",
 more:"עומק לקוח ומוצר שיוצא — זה הטיעון לתפקידי מוצר ו־GTM.",
 suggest: ["מה ההשפעה של הפרויקטים שלו?","סיכום מקצועי"],
 },
 cancode: {
 keys: ["הוא יודע לקודד","הוא יודע לתכנת","הוא מתכנת","וייב קוד","וייב־קוד","הוא מפתח"],
 reply:"הוא יודע לעשות וייב־קוד. הוא לא מתכנת קלאסי ואין לו תואר במדעי המחשב או פייתון. Claude Code ו־Cursor הם איך הוא מוציא — האתר הזה ההוכחה.",
 more:"הנקודה היא לא ליטקוד. לקחת בעיית לקוח אמיתית ולהוציא מוצר עובד.",
 suggest: ["איך הוא למד לבנות?","האתר הזה"],
 },
 peoplelead: {
 keys: ["ניהל אנשים","הוא ניהל אנשים","ניהול צוות","הוא ניהל","מנהל אנשים"],
 reply:"כן. מנהל משמרת בפטלינה, מנהל קבלה בגרם 22, מפקד בחיל התותחנים, ורכז בצופים.",
 more:"תפעול ואנשים תחת לחץ — לא אורגצ׳ארט של הנדסה.",
 suggest: ["רקע בצה״ל","ניסיון ב־Bites"],
 },
 typicalday: {
 keys: ["יום טיפוסי","יום יום","איך נראה יום","יום עבודה","איך נראה יום עבודה"],
 reply:"יום טיפוסי: שיחות עם לקוחות, טריאז' של תמיכה, והפיכת חיכוך שחוזר למוצר ולעבודת AI.",
 more:"ככה נולדו גם הוואטסאפ והטפסים — דפוס בתור, ואז משהו שיוצא.",
 suggest: ["ניסיון ב־Bites","איך הוא משתמש ב־AI?"],
 },
 remote: {
 keys: ["רימוט","עבודה מהבית","משרד","מעדיף משרד","היברידי","מרחוק","עבודה מהמשרד"],
 reply:"הוא בתל אביב. התפקיד יכול להיות מרחוק או לא — הוא יכול גם וגם. הוא מעדיף משרד.",
 more:"הוא כבר עובד מול ארה״ב מישראל. לסידור ספציפי: nadavile415@gmail.com.",
 suggest: ["איפה הוא גר?","איך אפשר ליצור איתו קשר?"],
 },
 favoritework: {
 keys: ["הכי גאה","הפרויקט הכי","העבודה הכי גדולה","הכי חשוב"],
 reply:"שניהם: נפילת הוואטסאפ — 98% מסירה ויותר מ־10,000 דולר חיסכון — ו־Bites Forms, שנבנה בפנים אחרי שביקשו גוגל פורמס, עם חתימה.",
 more:"אותו דפוס: בעיית לקוח שאי אפשר להתעלם ממנה, ואז משלוח.",
 suggest: ["מה הייתה ההשפעה של פרויקט הוואטסאפ?","ספר על Bites Forms"],
 },
 learned: {
 keys: ["איך הוא למד","למד לבד","יוטיוב","למד מיוטיוב","איך למד לקודד"],
 reply:"למד לבד — הרבה יוטיוב, ואז הוציא בעיות לקוח אמיתיות עם כלי AI. בלי תואר במדעי המחשב.",
 more:"Claude Code ו־Cursor הם הסטאק עכשיו. הפורטפוליו יצא משם.",
 suggest: ["הוא יודע לקודד?","האתר הזה"],
 },
 greeting: {
 keys: ["שלום","היי","הי","אהלן","בוקר טוב","ערב טוב"],
 reply:"שלום. אפשר לשאול בעברית — עבודה, לימודים, מה מעניין אותו, או סתם מי הוא. אפשר גם לבחור נושא למטה.",
 suggest: ["סיכום מקצועי","מה ההשפעה של הפרויקטים שלו?","לאיזה תפקידי AI הוא מחפש?","איך אפשר ליצור איתו קשר?"],
 },
 about: {
 keys: ["מי זה נדב","מי הוא","ספר עליו","ביו"],
 reply:"נדב לוי הוא CSM ב־Bites, בצומת של תובנת לקוח, חשיבת מוצר, עיצוב וביצוע עם AI. הוא הוציא כלים שחסכו כסף ושיפרו תהליכים, מנהל לקוחות ארגוניים, ומכוון לתפקידי מוצר ו־GTM.\n\nברקע: צה״ל, צופים, ותואר בתקשורת ושיווק ברייכמן.",
 more:"אפשר להעמיק בפרויקטים, בדרך למוצר, במנהיגות, או באיך ליצור קשר.",
 suggest: ["סיכום מקצועי","מה ההשפעה של הפרויקטים שלו?"],
 },
 thanks: {
 keys: ["תודה","תודה רבה"],
 reply:"בשמחה. אם יש עוד משהו על הרקע של נדב — אפשר לשאול.",
 suggest: ["סיכום מקצועי","איך אפשר ליצור איתו קשר?"],
 },
 no: {
 keys: ["לא","לא עכשיו"],
 reply:"בסדר. אפשר נושא אחר או אחת ההצעות למטה.",
 suggest: ["מה ההשפעה של הפרויקטים שלו?","סיכום מקצועי"],
 },
 };

 const HE_LABELS = {
 recruiter: "הסיכום המקצועי",
 whypm: "תפקידי ה-AI שהוא מחפש",
 skills: "הכלים",
 projects: "הפרויקטים",
 whatsapp: "פרויקט הוואטסאפ",
 supportagents: "סוכני ה-AI לתמיכה",
 bitesforms: "Bites Forms",
 zapiercerts: "התעודות ב-Zapier",
 thissite: "האתר הזה",
 contact: "יצירת קשר",
 gerem: "פטלינה וגרם 22",
 experience: "הניסיון ב-Bites",
 army: "השירות בצה״ל",
 scouts: "הצופים",
 education: "הלימודים",
 github: "גיטהאב",
 ai: "איך הוא משתמש ב-AI",
 design: "הגישה לעיצוב",
 product: "חשיבת המוצר",
 resume: "קורות החיים",
 location: "איפה הוא גר",
 age: "הגיל",
 interests: "מה מעניין אותו",
 hobbies: "התחביבים",
 languages: "השפות",
 available: "הזמינות",
 clients: "הלקוחות",
 whyhim: "למה הוא",
 cancode: "וייב-קוד",
 peoplelead: "ניהול אנשים",
 typicalday: "יום טיפוסי",
 remote: "משרד או רימוט",
 favoritework: "העבודה הכי גדולה",
 learned: "איך הוא למד לבנות",
 greeting: "שלום",
 about: "מי הוא",
 thanks: "תודה",
 no: "נושא אחר",
 };

 const FOLLOWUPS = ["more","tell me more","go on","expand","elaborate","why","how come","really","interesting","and"];
 const FOLLOWUPS_HE = ["עוד","ספר עוד","תמשיך","למה","באמת","ותוסיף"];
 const YES_HE = ["כן","בטח","סבבה","יאללה","בסדר"];
 const YES_EN = ["yes","yeah","yep","sure","ok","okay","please","yup"];

 const findIntent = (id) => KB.find((i) => i.id === id);

 const pickReply = (intent, hebrew, more) => {
 const pack = hePack(intent);
 if (hebrew) {
 if (more) return pack.more || intent.moreHe || intent.more || pack.reply || intent.reply;
 return pack.reply || intent.replyHe || intent.reply;
 }
 if (more) return intent.more;
 return intent.reply;
 };

 const pickSuggest = (intent, hebrew) => {
 const pack = intent ? hePack(intent) : {};
 if (hebrew) return pack.suggest || DEFAULT_SUGGEST_HE.map((s) => s.q);
 return (intent && intent.suggest) || DEFAULT_SUGGEST.map((s) => s.q);
 };

 const getReply = (text) => {
 const t = norm(text);
 const words = t.split(" ");
 const hebrew = isHebrew(text);
 lastLang = hebrew ? "he" : "en";

 const saidYes = hebrew
 ? YES_HE.some((w) => t === w || t.startsWith(w + " "))
 : YES_EN.some((w) => t === w || t.startsWith(w + " "));

 if (pendingOffer && saidYes) {
 const offered = findIntent(pendingOffer);
 pendingOffer = null;
 if (offered) {
 lastIntent = offered.id;
 return { text: pickReply(offered, hebrew, false), intent: offered, suggest: pickSuggest(offered, hebrew), actions: offered.actions, hebrew };
 }
 }

 const followList = hebrew ? FOLLOWUPS_HE : FOLLOWUPS;
 if (lastIntent && words.length <= 4 && followList.some((f) => t === f || t.startsWith(f + " ") || t.endsWith(" " + f))) {
 const intent = findIntent(lastIntent);
 if (intent && (intent.more || hePack(intent).more)) {
 lastIntent = null;
 return { text: pickReply(intent, hebrew, true), intent, suggest: pickSuggest(intent, hebrew), actions: intent.actions, hebrew };
 }
 }

 const ranked = KB.map((i) => ({ i, s: scoreIntent(i, t, words) }))
 .filter((r) => r.s > 0 && r.i.id !== "yes")
 .sort((a, b) => b.s - a.s);

 if (ranked.length) {
 const best = ranked[0];
 lastIntent = best.i.id;
 let replyText = pickReply(best.i, hebrew, false);
 pendingOffer = null;
 const second = ranked[1];
 if (second && second.s >= 3 && second.i.id !== best.i.id && !["greeting","thanks","no"].includes(second.i.id)) {
 replyText += hebrew
 ? `\n\nאפשר גם לספר עוד על ${hePack(second.i).label || HE_LABELS[second.i.id] || second.i.label}.`
 : `\n\nI can also share more on ${second.i.label} if that would be helpful.`;
 pendingOffer = second.i.id;
 }
 return {
 text: replyText,
 intent: best.i,
 suggest: pickSuggest(best.i, hebrew),
 actions: best.i.actions,
 hebrew,
 };
 }

 const profileHits = PROFILE
 .map((p) => {
 const en = (p.keys || []).reduce((n, k) => n + keyHit(t, words, k), 0);
 const he = (p.keysHe || []).reduce((n, k) => n + keyHitHe(t, words, k), 0);
 return { p, s: en + he };
 })
 .filter((r) => r.s > 0)
 .sort((a, b) => b.s - a.s);
 if (profileHits.length) {
 lastIntent = null;
 pendingOffer = null;
 return {
 text: profileHits.slice(0, 2).map((r) => (hebrew && r.p.factHe) ? r.p.factHe : r.p.fact).join("\n\n"),
 suggest: pickSuggest(null, hebrew),
 actions: [{ label: hebrew ? "צור קשר" : "Contact section", scroll: "#contact" }],
 hebrew,
 };
 }

 const overview = findIntent("recruiter") || findIntent("about");
 lastIntent = overview ? overview.id : null;
 pendingOffer = null;
 const extra = hebrew
 ? "אפשר לשאול עוד בעברית — פרויקטים, לימודים, מנהיגות, כלים, או איך ליצור קשר."
 : "Ask anything else in your own words — projects, school, leadership, tools, or how to reach him.";
 return {
 text: (overview ? pickReply(overview, hebrew, false) + "\n\n" : "") + extra,
 suggest: pickSuggest(overview, hebrew),
 actions: overview && overview.actions ? overview.actions : [{ label: "About Nadav", scroll: "#about" }],
 hebrew,
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
 const fallback = lastLang === "he" ? DEFAULT_SUGGEST_HE : DEFAULT_SUGGEST;
 const list = (items || fallback).slice(0, 4);
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
 if (isHebrew(text)) el.setAttribute("dir", "auto");
 el.innerHTML = fmt(text);
 log.appendChild(el);
 log.scrollTop = log.scrollHeight;
 return el;
 }
 const row = document.createElement("div");
 row.className = "msg-row";
 row.innerHTML = `${avatarHTML}<div class="msg msg--bot"${isHebrew(text) ? ' dir="auto"' : ""}>${fmt(text)}</div>`;
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
 row.innerHTML = `${avatarHTML}<div class="msg msg--bot"${payload.hebrew ? ' dir="auto"' : ""}>${fmt(payload.text)}${actionsHTML}</div>`;
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
 const he = lastLang === "he";
 const starters = he ? CHAT_STARTERS_HE : CHAT_STARTERS;
 const wrap = document.createElement("div");
 wrap.className = "chat-welcome";
 if (he) wrap.setAttribute("dir", "auto");
 wrap.innerHTML = he ? `
 <p class="chat-welcome__title">אפשר לשאול בעברית.</p>
 <p class="chat-welcome__sub">שאלה חופשית — עבודה, לימודים, מה מעניין אותו, או סתם מי הוא — או לבחור נושא למטה.</p>
 <div class="chat-welcome__grid">
 ${starters.map((s) => `<button type="button" class="chat-starter" data-q="${s.q.replace(/"/g, "&quot;")}"><span>${s.label}</span></button>`).join("")}
 </div>` : `
 <p class="chat-welcome__title">Ask anything about Nadav.</p>
 <p class="chat-welcome__sub">Type a question in your own words — work, school, what drives him, or just the person — or start with a topic below.</p>
 <div class="chat-welcome__grid">
 ${starters.map((s) => `<button type="button" class="chat-starter" data-q="${s.q.replace(/"/g, "&quot;")}"><span>${s.label}</span></button>`).join("")}
 </div>`;
 log.appendChild(wrap);
 setSuggestions(he ? DEFAULT_SUGGEST_HE : DEFAULT_SUGGEST);
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
