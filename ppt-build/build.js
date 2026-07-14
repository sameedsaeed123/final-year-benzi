const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");

// ---------- palette ----------
const INK   = "0B3B38"; // deep teal (dark slides)
const INK2  = "072B29";
const TEAL  = "0F766E";
const TEAL2 = "0D9488";
const MINT  = "5EEAD4";
const LIGHT = "F1FAF8"; // content background
const CARD  = "FFFFFF";
const TINT  = "E9F6F3";
const TEXT  = "13322F";
const MUTED = "5C7C78";
const WHITE = "FFFFFF";
const BORDER= "D4E9E5";

const SERIF = "Cambria";
const SANS  = "Calibri";

// ---------- icon rasterizer ----------
async function icon(IconComponent, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

const makeShadow = (opts = {}) => ({
  type: "outer", color: "0B3B38", blur: 9, offset: 3, angle: 90, opacity: 0.16, ...opts,
});

async function main() {
  // pre-render icons
  const I = {};
  const white = "#FFFFFF";
  const need = {
    brain: Fa.FaBrain, robot: Fa.FaRobot, shield: Fa.FaShieldAlt, chart: Fa.FaChartLine,
    smile: Fa.FaRegSmile, calendar: Fa.FaCalendarCheck, comments: Fa.FaComments, userMd: Fa.FaUserMd,
    users: Fa.FaUsers, lock: Fa.FaLock, book: Fa.FaBookOpen, target: Fa.FaBullseye,
    card: Fa.FaCreditCard, bell: Fa.FaBell, video: Fa.FaVideo, search: Fa.FaSearch,
    check: Fa.FaCheckCircle, mic: Fa.FaMicrophone, heart: Fa.FaHeart, server: Fa.FaServer,
    db: Fa.FaDatabase, cogs: Fa.FaCogs, react: Fa.FaReact, node: Fa.FaNodeJs, python: Fa.FaPython,
    image: Fa.FaRegImage, plus: Fa.FaPlus, bulb: Fa.FaLightbulb, hand: Fa.FaHandHoldingHeart,
    warn: Fa.FaExclamationTriangle, layer: Fa.FaLayerGroup, flask: Fa.FaFlask, mobile: Fa.FaMobileAlt,
    sitemap: Fa.FaSitemap, rocket: Fa.FaRocket, seed: Fa.FaSeedling, clipboard: Fa.FaClipboardList,
    bolt: Fa.FaBolt, hospital: Fa.FaClinicMedical, gem: Fa.FaGem,
  };
  for (const k of Object.keys(need)) I[k] = await icon(need[k], white);
  // teal variants for light cards
  const T = {};
  for (const k of Object.keys(need)) T[k] = await icon(need[k], "#0F766E");

  const pres = new pptxgen();
  pres.defineLayout({ name: "W", width: 13.333, height: 7.5 });
  pres.layout = "W";
  pres.author = "Group F25CS186";
  pres.title = "Benzi — AI-Assisted Mental Health Support Platform";
  const PW = 13.333, PH = 7.5;
  const LOGO = "assets/benzi-logo.png"; // 148x50 (ar 2.96)

  // ---------- helpers ----------
  function iconCircle(slide, x, y, d, iconData, fill = TEAL) {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, shadow: makeShadow({ blur: 6, offset: 2, opacity: 0.18 }) });
    const p = d * 0.27;
    slide.addImage({ data: iconData, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  }

  function header(slide, kicker, title) {
    slide.addText(kicker.toUpperCase(), { x: 0.7, y: 0.42, w: 9, h: 0.3, fontSize: 12, bold: true, color: TEAL2, charSpacing: 3, fontFace: SANS, margin: 0 });
    slide.addText(title, { x: 0.7, y: 0.72, w: 10.6, h: 0.8, fontSize: 30, bold: true, color: INK, fontFace: SERIF, margin: 0 });
    slide.addImage({ path: LOGO, x: 12.05, y: 0.5, w: 0.95, h: 0.321 });
  }

  function placeholder(slide, x, y, w, h, label, sub) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: TINT }, line: { color: TEAL2, width: 1.5, dashType: "dash" } });
    const d = 0.7;
    iconCircle(slide, x + w / 2 - d / 2, y + h / 2 - d / 2 - 0.35, d, I.image, TEAL2);
    slide.addText(label, { x, y: y + h / 2 + 0.18, w, h: 0.34, fontSize: 14, bold: true, color: TEAL, align: "center", fontFace: SANS, margin: 0 });
    if (sub) slide.addText(sub, { x, y: y + h / 2 + 0.52, w, h: 0.3, fontSize: 10.5, italic: true, color: MUTED, align: "center", fontFace: SANS, margin: 0 });
  }

  function featureCard(slide, x, y, w, h, iconData, title, desc) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: makeShadow({ blur: 8, offset: 3, opacity: 0.10 }) });
    iconCircle(slide, x + 0.3, y + 0.3, 0.62, iconData, TEAL);
    slide.addText(title, { x: x + 0.3, y: y + 1.02, w: w - 0.55, h: 0.32, fontSize: 14.5, bold: true, color: INK, fontFace: SANS, margin: 0 });
    slide.addText(desc, { x: x + 0.3, y: y + 1.34, w: w - 0.55, h: h - 1.45, fontSize: 11, color: MUTED, fontFace: SANS, margin: 0, lineSpacingMultiple: 1.0 });
  }

  // Place an image inside a frame, preserving aspect ratio and centering it,
  // on a white card with a soft border. `ar` = image width / height.
  function fitImage(slide, fx, fy, fw, fh, imgPath, ar, caption) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: fx, y: fy, w: fw, h: fh, rectRadius: 0.08, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: makeShadow({ blur: 8, offset: 3, opacity: 0.10 }) });
    const pad = 0.16;
    const capH = caption ? 0.34 : 0;
    const availW = fw - 2 * pad;
    const availH = fh - 2 * pad - capH;
    let w = availW, h = availW / ar;
    if (h > availH) { h = availH; w = availH * ar; }
    const x = fx + (fw - w) / 2;
    const y = fy + pad + (availH - h) / 2;
    slide.addImage({ path: imgPath, x, y, w, h });
    if (caption) slide.addText(caption, { x: fx, y: fy + fh - capH - 0.04, w: fw, h: capH, fontSize: 11, italic: true, color: MUTED, align: "center", fontFace: SANS, margin: 0 });
  }

  function logoPill(slide, x, y) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.5, h: 0.92, rectRadius: 0.12, fill: { color: WHITE }, line: { type: "none" }, shadow: makeShadow({ blur: 10, offset: 3, opacity: 0.25 }) });
    slide.addImage({ path: LOGO, x: x + 0.42, y: y + 0.24, w: 1.66, h: 0.561 });
  }

  // ============================================================ 1. TITLE
  let s = pres.addSlide();
  s.background = { color: INK };
  s.addShape(pres.shapes.OVAL, { x: 9.6, y: 4.2, w: 6.5, h: 6.5, fill: { color: TEAL, transparency: 62 }, line: { type: "none" } });
  s.addShape(pres.shapes.OVAL, { x: -2.2, y: -2.6, w: 5.2, h: 5.2, fill: { color: MINT, transparency: 86 }, line: { type: "none" } });
  logoPill(s, 0.9, 0.75);
  s.addText("FINAL YEAR PROJECT  ·  FINAL EVALUATION", { x: 0.95, y: 2.12, w: 11, h: 0.35, fontSize: 13, bold: true, color: MINT, charSpacing: 3, fontFace: SANS, margin: 0 });
  s.addText("An AI-Assisted Mental Health\nSupport Platform", { x: 0.92, y: 2.5, w: 11.2, h: 1.7, fontSize: 46, bold: true, color: WHITE, fontFace: SERIF, lineSpacingMultiple: 1.02, margin: 0 });
  s.addText("Compassionate, always-available support that bridges the gap between therapy sessions.", { x: 0.95, y: 4.28, w: 9.6, h: 0.5, fontSize: 15, italic: true, color: "BFE9E1", fontFace: SANS, margin: 0 });

  // team card
  const tcx = 0.95, tcy = 5.15, tcw = 11.4, tch = 1.85;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: tcx, y: tcy, w: tcw, h: tch, rectRadius: 0.1, fill: { color: INK2 }, line: { color: TEAL, width: 1 } });
  s.addText("PROJECT GROUP  ·  F25CS186", { x: tcx + 0.4, y: tcy + 0.22, w: 6, h: 0.3, fontSize: 12, bold: true, color: MINT, charSpacing: 2, fontFace: SANS, margin: 0 });
  const team = [
    ["Sameed Saeed", "L1F22BSCS0956"],
    ["Hassan Hayat", "L1F22BSCS0976"],
    ["Faziyab Ahmad", "L1F22BSCS1111"],
  ];
  team.forEach((m, i) => {
    const cx = tcx + 0.4 + i * 3.05;
    s.addText([
      { text: m[0] + "\n", options: { bold: true, fontSize: 15, color: WHITE } },
      { text: m[1], options: { fontSize: 11.5, color: "9FD3CC" } },
    ], { x: cx, y: tcy + 0.6, w: 3.0, h: 0.8, fontFace: SANS, margin: 0, lineSpacingMultiple: 1.05 });
  });
  s.addText([
    { text: "Supervisor\n", options: { fontSize: 11, color: "9FD3CC" } },
    { text: "Mam Misha Asif", options: { bold: true, fontSize: 15, color: WHITE } },
  ], { x: tcx + 0.4 + 3 * 3.05 + 0.15, y: tcy + 0.58, w: 2.2, h: 0.9, fontFace: SANS, align: "left", margin: 0, lineSpacingMultiple: 1.05 });

  // ============================================================ 2. INTRODUCTION / PROBLEM
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "Introduction", "The Problem We Are Solving");
  s.addImage({ path: "assets/problem.png", x: 7.55, y: 1.95, w: 5.1, h: 2.745, rounding: false });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.55, y: 1.95, w: 5.1, h: 2.745, rectRadius: 0.06, fill: { color: WHITE, transparency: 100 }, line: { color: BORDER, width: 1 } });
  s.addText([
    { text: "Mental health care is hard to access — and even harder to sustain between sessions.\n\n", options: { fontSize: 14.5, color: TEXT, breakLine: true } },
    { text: "Therapy is expensive and infrequent.  ", options: { bold: true, fontSize: 13, color: INK } },
    { text: "Patients are left without support during the days and weeks between appointments.\n\n", options: { fontSize: 12.5, color: MUTED, breakLine: true } },
    { text: "Early warning signs are missed.  ", options: { bold: true, fontSize: 13, color: INK } },
    { text: "Therapists lack visibility into a patient’s mood and crisis moments outside the clinic.\n\n", options: { fontSize: 12.5, color: MUTED, breakLine: true } },
    { text: "Self-help is fragmented.  ", options: { bold: true, fontSize: 13, color: INK } },
    { text: "Resources, mood logs, scheduling and records live in disconnected tools.", options: { fontSize: 12.5, color: MUTED } },
  ], { x: 0.7, y: 1.95, w: 6.55, h: 3.6, fontFace: SANS, margin: 0, valign: "top", lineSpacingMultiple: 1.04 });

  const stats = [["73%", "of people cite cost & access as barriers to care"], ["1 in 4", "adults experience a mental-health condition"], ["24/7", "support gap between scheduled sessions"]];
  stats.forEach((st, i) => {
    const x = 0.7 + i * 4.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 5.75, w: 3.75, h: 1.35, rectRadius: 0.08, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: makeShadow({ blur: 7, offset: 2, opacity: 0.08 }) });
    s.addText(st[0], { x: x + 0.25, y: 5.9, w: 3.3, h: 0.6, fontSize: 30, bold: true, color: TEAL, fontFace: SERIF, margin: 0 });
    s.addText(st[1], { x: x + 0.25, y: 6.5, w: 3.3, h: 0.5, fontSize: 11, color: MUTED, fontFace: SANS, margin: 0 });
  });

  // ============================================================ 3. OBJECTIVES
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "Project Scope", "Objectives & Goals");
  const objs = [
    [T.hand, "Always-on AI companion", "Give patients an empathetic, private space to talk and reflect between therapy sessions."],
    [T.shield, "Safety first", "Detect crisis and self-harm language and guide users toward professional help immediately."],
    [T.chart, "Track mood & progress", "Let patients log moods and goals, and give therapists clear insight into their journey."],
    [T.userMd, "Connect to real care", "Verified therapists, appointment booking, secure chat and video — all in one platform."],
    [T.lock, "Private & secure", "Protect sensitive records with JWT auth, two-factor login and access-controlled data."],
  ];
  objs.forEach((o, i) => {
    const y = 1.85 + i * 1.04;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y, w: 11.93, h: 0.9, rectRadius: 0.07, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: makeShadow({ blur: 6, offset: 2, opacity: 0.07 }) });
    iconCircle(s, 0.92, y + 0.18, 0.54, o[0] === T.hand ? I.hand : o[0] === T.shield ? I.shield : o[0] === T.chart ? I.chart : o[0] === T.userMd ? I.userMd : I.lock, TEAL);
    s.addText(o[1], { x: 1.7, y: y + 0.15, w: 3.5, h: 0.6, fontSize: 15, bold: true, color: INK, fontFace: SANS, valign: "middle", margin: 0 });
    s.addText(o[2], { x: 5.3, y: y + 0.12, w: 7.1, h: 0.66, fontSize: 12, color: MUTED, fontFace: SANS, valign: "middle", margin: 0 });
  });

  // ============================================================ 4. PROPOSED SOLUTION
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "Proposed Solution", "Meet Benzi — One Connected Platform");
  const sol = [
    [I.mobile, "Patient App", "AI companion, mood tracking, appointments, secure chat, self-help resources & goals."],
    [I.userMd, "Therapist Portal", "Verification, client management, availability, reports and crisis alerts."],
    [I.cogs, "Admin Dashboard", "Therapist approval, subscriptions, coupons, revenue and platform oversight."],
  ];
  sol.forEach((c, i) => {
    const x = 0.7 + i * 4.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.85, w: 3.75, h: 2.55, rectRadius: 0.08, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: makeShadow({ blur: 8, offset: 3, opacity: 0.10 }) });
    iconCircle(s, x + 0.32, 2.15, 0.7, c[0], TEAL);
    s.addText(c[1], { x: x + 0.32, y: 3.0, w: 3.1, h: 0.4, fontSize: 17, bold: true, color: INK, fontFace: SANS, margin: 0 });
    s.addText(c[2], { x: x + 0.32, y: 3.42, w: 3.15, h: 0.9, fontSize: 11.5, color: MUTED, fontFace: SANS, margin: 0, lineSpacingMultiple: 1.03 });
  });
  // AI band
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 4.65, w: 11.93, h: 2.25, rectRadius: 0.1, fill: { color: INK }, line: { type: "none" }, shadow: makeShadow({ blur: 9, offset: 3, opacity: 0.18 }) });
  iconCircle(s, 1.1, 5.05, 1.0, I.robot, TEAL2);
  s.addText("Powered by the Benzi AI Engine", { x: 2.35, y: 4.98, w: 9.8, h: 0.5, fontSize: 19, bold: true, color: WHITE, fontFace: SERIF, margin: 0 });
  s.addText("A locally-hosted, fine-tuned empathetic language model running on Ollama — paired with a crisis-detection safety layer and retrieval over the patient’s own records. Private by design: the model runs on our own infrastructure.", { x: 2.35, y: 5.5, w: 9.9, h: 1.2, fontSize: 13, color: "C7E6E1", fontFace: SANS, margin: 0, lineSpacingMultiple: 1.05 });

  // ============================================================ 5. SYSTEM ARCHITECTURE (placeholder)
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "System Design", "System Architecture");
  s.addText("A modular client–server architecture: React web apps talk to a Node.js / Express REST API and a Socket.IO real-time layer, backed by MongoDB and a Redis-powered job queue, with the Benzi AI engine served locally via Ollama.", { x: 0.7, y: 1.74, w: 11.9, h: 0.7, fontSize: 13, color: TEXT, fontFace: SANS, margin: 0, lineSpacingMultiple: 1.05 });
  fitImage(s, 0.7, 2.5, 11.93, 4.55, "assets/architecture.png", 2352 / 1647);

  // ============================================================ 6. AI ENGINE
  s = pres.addSlide();
  s.background = { color: INK };
  s.addText("THE DIFFERENTIATOR", { x: 0.7, y: 0.45, w: 9, h: 0.3, fontSize: 12, bold: true, color: MINT, charSpacing: 3, fontFace: SANS, margin: 0 });
  s.addText("The Benzi AI Engine", { x: 0.7, y: 0.74, w: 10, h: 0.7, fontSize: 30, bold: true, color: WHITE, fontFace: SERIF, margin: 0 });
  logoPill(s, 10.5, 0.5);
  // left: model card
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 1.85, w: 4.5, h: 5.05, rectRadius: 0.1, fill: { color: INK2 }, line: { color: TEAL, width: 1 } });
  iconCircle(s, 1.05, 2.2, 0.8, I.robot, TEAL2);
  s.addText("Fine-tuned\nEmpathetic Model", { x: 2.05, y: 2.22, w: 2.95, h: 0.8, fontSize: 17, bold: true, color: WHITE, fontFace: SERIF, margin: 0, lineSpacingMultiple: 0.98 });
  s.addText([
    { text: "Base model", options: { fontSize: 10.5, color: "9FD3CC", breakLine: true } },
    { text: "Qwen2.5 Instruct", options: { fontSize: 14.5, bold: true, color: MINT, breakLine: true, paraSpaceAfter: 9 } },
    { text: "Method", options: { fontSize: 10.5, color: "9FD3CC", breakLine: true } },
    { text: "QLoRA fine-tuning (PEFT)", options: { fontSize: 14.5, bold: true, color: WHITE, breakLine: true, paraSpaceAfter: 9 } },
    { text: "Served with", options: { fontSize: 10.5, color: "9FD3CC", breakLine: true } },
    { text: "Ollama — runs locally", options: { fontSize: 14.5, bold: true, color: WHITE, breakLine: true, paraSpaceAfter: 9 } },
    { text: "Training data", options: { fontSize: 10.5, color: "9FD3CC", breakLine: true } },
    { text: "1,000 curated examples", options: { fontSize: 14.5, bold: true, color: WHITE } },
  ], { x: 1.05, y: 3.18, w: 3.9, h: 3.5, fontFace: SANS, margin: 0, lineSpacingMultiple: 1.0 });

  // right: capability rows
  const caps = [
    [I.heart, "Empathetic companion", "Acknowledges feelings, reflects, and asks one gentle question — concise and supportive, never a diagnosis."],
    [I.shield, "Crisis-detection safety layer", "Flags self-harm and crisis language and steers users to their therapist or emergency help."],
    [I.search, "Retrieval (RAG) over records", "Grounds replies in the patient’s own notes and documents using vector embeddings."],
    [I.smile, "Sentiment & mood analysis", "Reads emotional tone to log mood trends and surface insights for therapists."],
  ];
  caps.forEach((c, i) => {
    const y = 1.85 + i * 1.28;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.45, y, w: 7.18, h: 1.12, rectRadius: 0.08, fill: { color: INK2 }, line: { color: TEAL, width: 1 } });
    iconCircle(s, 5.7, y + 0.27, 0.58, c[0], TEAL2);
    s.addText(c[1], { x: 6.5, y: y + 0.16, w: 6.0, h: 0.36, fontSize: 15, bold: true, color: WHITE, fontFace: SANS, margin: 0 });
    s.addText(c[2], { x: 6.5, y: y + 0.5, w: 6.0, h: 0.55, fontSize: 11.5, color: "BFE0DB", fontFace: SANS, margin: 0, lineSpacingMultiple: 1.0 });
  });

  // ============================================================ 7. PATIENT FEATURES
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "Key Features", "For Patients");
  const pf = [
    [I.robot, "Benzi AI Companion", "Private, always-available empathetic chat with voice input support."],
    [I.smile, "Mood Tracking", "Daily mood logs that build a visual picture of emotional wellbeing."],
    [I.calendar, "Appointments", "Browse verified therapists and book, reschedule or cancel sessions."],
    [I.comments, "Secure Chat & Video", "Real-time messaging and anonymous video meets with your therapist."],
    [I.book, "Self-Help Resources", "Curated meditations, exercises and guidance for between sessions."],
    [I.target, "Goals & Progress", "Set wellness goals and track achievements and progress over time."],
  ];
  const gx = [0.7, 4.745, 8.79], gy = [1.9, 3.95];
  pf.forEach((c, i) => featureCard(s, gx[i % 3], gy[Math.floor(i / 3)], 3.75, 1.85, c[0], c[1], c[2]));

  // ============================================================ 8. THERAPIST & ADMIN FEATURES
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "Key Features", "For Therapists & Admins");
  const tf = [
    [I.check, "Therapist Verification", "Document upload and admin approval before therapists go live."],
    [I.users, "Client Management", "Per-patient panels with history, notes and AI-generated context briefs."],
    [I.calendar, "Availability & Scheduling", "Set working hours, services and pricing; sync with appointments."],
    [I.bell, "Crisis Alerts", "Instant email alerts when a patient shows crisis signals in chat."],
    [I.card, "Subscriptions & Billing", "Stripe-powered plans, coupons and usage limits for therapists."],
    [I.chart, "Revenue & Analytics", "Admin dashboards for revenue, subscriptions and platform health."],
  ];
  tf.forEach((c, i) => featureCard(s, gx[i % 3], gy[Math.floor(i / 3)], 3.75, 1.85, c[0], c[1], c[2]));

  // ============================================================ 9. ER DIAGRAM (full width)
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "System Design", "Entity Relationship Diagram");
  fitImage(s, 0.7, 1.7, 11.93, 5.4, "assets/erd.png", 6423 / 3291,
    "Core entities — User · Patient · Therapist · Appointment · Service · Message · Record · AI data · Subscriptions");

  // ============================================================ 9b. DATA FLOW DIAGRAM (full width)
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "System Design", "Data Flow Diagram — Level 1");
  fitImage(s, 0.7, 1.85, 11.93, 5.15, "assets/dfd.png", 2352 / 786,
    "External entities, six core processes and data stores — auth, appointments, messaging, records & AI, billing, admin");

  // ============================================================ 10. TECH STACK
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "Implementation", "Technology Stack");
  const stack = [
    [I.react, "Frontend", ["React + Vite", "Tailwind CSS", "Socket.IO client", "React Router"]],
    [I.node, "Backend", ["Node.js + Express", "MongoDB + Mongoose", "Redis + BullMQ", "Socket.IO"]],
    [I.flask, "AI / ML", ["Python · PyTorch", "Qwen2.5 + QLoRA", "Ollama (local)", "RAG embeddings"]],
    [I.bolt, "Integrations", ["Stripe billing", "JWT + 2FA auth", "Nodemailer email", "Google Calendar"]],
  ];
  stack.forEach((c, i) => {
    const x = 0.7 + i * 3.04;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: 2.78, h: 4.7, rectRadius: 0.08, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: makeShadow({ blur: 8, offset: 3, opacity: 0.10 }) });
    iconCircle(s, x + 0.32, 2.25, 0.66, c[0], TEAL);
    s.addText(c[1], { x: x + 0.32, y: 3.05, w: 2.2, h: 0.4, fontSize: 16, bold: true, color: INK, fontFace: SANS, margin: 0 });
    s.addText(c[2].map((t, j) => ({ text: t, options: { bullet: { code: "2022", indent: 14 }, color: TEXT, fontSize: 12.5, breakLine: true, paraSpaceAfter: 8 } })), { x: x + 0.34, y: 3.5, w: 2.3, h: 3.0, fontFace: SANS, margin: 0 });
  });

  // ============================================================ 11. SCREENSHOTS (placeholders)
  s = pres.addSlide();
  s.background = { color: LIGHT };
  header(s, "Demonstration", "Application Screenshots");
  // Patient & Therapist dashboards are landscape; the chat stays portrait.
  // Frame widths are tuned per aspect ratio so each image renders large and centered.
  const shotY = 2.25, shotH = 4.5, shotGap = 0.3;
  const shotRow = [
    { path: "assets/shot-patient-dash.png", ar: 1024 / 905, w: 4.23, cap: "Patient Dashboard" },
    { path: "assets/shot-chat.png", ar: 1560 / 2040, w: 2.86, cap: "Benzi AI Chat" },
    { path: "assets/shot-therapist-dash.png", ar: 1024 / 889, w: 4.23, cap: "Therapist Dashboard" },
  ];
  let shotX = 0.7;
  shotRow.forEach((sh) => {
    fitImage(s, shotX, shotY, sh.w, shotH, sh.path, sh.ar, sh.cap);
    shotX += sh.w + shotGap;
  });

  // ============================================================ 12. CONCLUSION & FUTURE WORK
  s = pres.addSlide();
  s.background = { color: INK };
  s.addText("WRAPPING UP", { x: 0.7, y: 0.55, w: 9, h: 0.3, fontSize: 12, bold: true, color: MINT, charSpacing: 3, fontFace: SANS, margin: 0 });
  s.addText("Conclusion & Future Work", { x: 0.7, y: 0.85, w: 11, h: 0.7, fontSize: 30, bold: true, color: WHITE, fontFace: SERIF, margin: 0 });
  logoPill(s, 10.5, 0.55);
  // conclusion card
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 2.0, w: 5.85, h: 4.85, rectRadius: 0.1, fill: { color: INK2 }, line: { color: TEAL, width: 1 } });
  iconCircle(s, 1.05, 2.35, 0.7, I.check, TEAL2);
  s.addText("What we delivered", { x: 1.95, y: 2.45, w: 4.4, h: 0.5, fontSize: 18, bold: true, color: WHITE, fontFace: SERIF, margin: 0 });
  s.addText([
    "A full-stack platform with patient, therapist and admin apps",
    "A locally-hosted, fine-tuned empathetic AI companion on Ollama",
    "A crisis-detection safety layer with real-time therapist alerts",
    "Mood tracking, appointments, secure chat, video & subscriptions",
    "Secure auth with JWT and two-factor login",
  ].map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 16 }, color: "DCEFEC", fontSize: 13, breakLine: true, paraSpaceAfter: 12 } })), { x: 1.1, y: 3.3, w: 5.15, h: 3.4, fontFace: SANS, margin: 0 });
  // future card
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.78, y: 2.0, w: 5.85, h: 4.85, rectRadius: 0.1, fill: { color: INK2 }, line: { color: TEAL, width: 1 } });
  iconCircle(s, 7.13, 2.35, 0.7, I.rocket, TEAL2);
  s.addText("Where we go next", { x: 8.03, y: 2.45, w: 4.4, h: 0.5, fontSize: 18, bold: true, color: WHITE, fontFace: SERIF, margin: 0 });
  s.addText([
    "Mobile apps for iOS and Android",
    "Larger fine-tuning dataset & multilingual support",
    "Voice-first conversations with the AI companion",
    "Wearable & sleep data for richer mood insights",
    "Clinical validation studies with partner therapists",
  ].map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 16 }, color: "DCEFEC", fontSize: 13, breakLine: true, paraSpaceAfter: 12 } })), { x: 7.18, y: 3.3, w: 5.15, h: 3.4, fontFace: SANS, margin: 0 });

  // ============================================================ 13. THANK YOU
  s = pres.addSlide();
  s.background = { color: INK };
  s.addShape(pres.shapes.OVAL, { x: 9.3, y: 3.6, w: 7, h: 7, fill: { color: TEAL, transparency: 60 }, line: { type: "none" } });
  s.addShape(pres.shapes.OVAL, { x: -2.4, y: -2.6, w: 5.2, h: 5.2, fill: { color: MINT, transparency: 86 }, line: { type: "none" } });
  logoPill(s, 0.95, 0.9);
  s.addText("Thank You", { x: 0.95, y: 2.55, w: 11, h: 1.1, fontSize: 58, bold: true, color: WHITE, fontFace: SERIF, margin: 0 });
  s.addText("Questions & Discussion", { x: 0.98, y: 3.75, w: 11, h: 0.5, fontSize: 19, italic: true, color: MINT, fontFace: SANS, margin: 0 });
  s.addText([
    { text: "Group F25CS186   ·   Supervisor: Mam Misha Asif\n", options: { fontSize: 13, color: "C7E6E1", breakLine: true } },
    { text: "Sameed Saeed  ·  Hassan Hayat  ·  Faziyab Ahmad", options: { fontSize: 13, bold: true, color: WHITE } },
  ], { x: 0.98, y: 5.5, w: 11, h: 1, fontFace: SANS, margin: 0, lineSpacingMultiple: 1.2 });

  await pres.writeFile({ fileName: "Benzi-FYP-Final-Evaluation.pptx" });
  console.log("WROTE Benzi-FYP-Final-Evaluation.pptx");
}

main().catch((e) => { console.error(e); process.exit(1); });
