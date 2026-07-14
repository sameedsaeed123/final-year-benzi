const puppeteer = require("puppeteer");
const fs = require("fs");

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const logo = "file://" + __dirname + "/assets/benzi-logo.png";

const base = `
  *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;}
  body{width:780px;height:1020px;background:#F1FAF8;overflow:hidden;}
  .wrap{padding:26px 24px;}
  .row{display:flex;align-items:center;}
  .sb{justify-content:space-between;}
  .card{background:#fff;border:1px solid #E1F0EC;border-radius:18px;box-shadow:0 8px 22px rgba(11,59,56,.06);}
  .teal{background:#0F766E;color:#fff;}
  .ink{background:#0B3B38;color:#fff;}
  .mint{color:#5EEAD4;}
  .muted{color:#5C7C78;}
  .h{color:#0B3B38;font-weight:800;}
  .pill{border-radius:999px;}
  .dot{width:9px;height:9px;border-radius:50%;background:#34D399;display:inline-block;}
  .bar{background:#0D9488;border-radius:6px 6px 0 0;}
  .barlt{background:#CDEBE5;border-radius:6px 6px 0 0;}
  .av{width:42px;height:42px;border-radius:50%;background:#0F766E;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;}
`;

// ---------- 1. PATIENT DASHBOARD ----------
const patient = `<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head>
<body><div class="wrap">
  <div class="row sb" style="margin-bottom:22px;">
    <div><div class="muted" style="font-size:15px;">Good evening</div><div class="h" style="font-size:27px;">Hi, Ayesha 👋</div></div>
    <div class="av">A</div>
  </div>

  <div class="card teal" style="padding:22px 22px;margin-bottom:18px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:14px;">How are you feeling today?</div>
    <div class="row sb" style="font-size:30px;">
      <span>😞</span><span>🙁</span><span style="background:#5EEAD4;border-radius:50%;padding:4px 8px;">😐</span><span>🙂</span><span>😄</span>
    </div>
  </div>

  <div class="card" style="padding:20px;margin-bottom:18px;">
    <div class="row sb" style="margin-bottom:14px;"><div class="h" style="font-size:17px;">Mood this week</div><div class="muted" style="font-size:13px;">Avg 3.8 / 5</div></div>
    <div class="row" style="height:96px;align-items:flex-end;gap:14px;">
      <div class="barlt" style="width:100%;height:46%;"></div>
      <div class="bar" style="width:100%;height:62%;"></div>
      <div class="barlt" style="width:100%;height:40%;"></div>
      <div class="bar" style="width:100%;height:78%;"></div>
      <div class="bar" style="width:100%;height:70%;"></div>
      <div class="bar" style="width:100%;height:88%;"></div>
      <div class="barlt" style="width:100%;height:58%;"></div>
    </div>
  </div>

  <div class="card ink" style="padding:22px;margin-bottom:18px;">
    <div class="row sb">
      <div>
        <div class="mint" style="font-size:13px;font-weight:700;letter-spacing:1px;">BENZI AI COMPANION</div>
        <div style="font-size:19px;font-weight:700;margin-top:6px;">“I'm here whenever you<br>want to talk.”</div>
      </div>
      <div style="font-size:46px;">🤖</div>
    </div>
    <div class="pill" style="background:#0F766E;display:inline-block;padding:11px 22px;margin-top:16px;font-weight:700;font-size:15px;">Start a conversation →</div>
  </div>

  <div class="row sb" style="gap:16px;">
    <div class="card" style="padding:18px;flex:1;">
      <div class="muted" style="font-size:13px;">Next session</div>
      <div class="h" style="font-size:16px;margin-top:4px;">Dr. Khan</div>
      <div class="muted" style="font-size:13px;margin-top:2px;">Fri · 4:00 PM</div>
    </div>
    <div class="card" style="padding:18px;flex:1;">
      <div class="muted" style="font-size:13px;">Goals</div>
      <div class="h" style="font-size:16px;margin-top:4px;">3 of 5 done</div>
      <div style="height:8px;background:#E1F0EC;border-radius:6px;margin-top:8px;"><div style="height:8px;width:60%;background:#0D9488;border-radius:6px;"></div></div>
    </div>
  </div>
</div></body></html>`;

// ---------- 2. BENZI AI CHAT ----------
const chat = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
  .u{background:#0F766E;color:#fff;border-radius:18px 18px 4px 18px;padding:13px 16px;max-width:74%;margin-left:auto;font-size:15px;line-height:1.4;}
  .a{background:#fff;border:1px solid #E1F0EC;color:#13322F;border-radius:18px 18px 18px 4px;padding:13px 16px;max-width:78%;font-size:15px;line-height:1.45;box-shadow:0 4px 14px rgba(11,59,56,.05);}
  .msg{margin-bottom:16px;}
</style></head>
<body style="background:#F1FAF8;">
  <div class="ink" style="padding:22px 24px;display:flex;align-items:center;gap:14px;">
    <div style="width:46px;height:46px;border-radius:50%;background:#0F766E;display:flex;align-items:center;justify-content:center;font-size:24px;">🤖</div>
    <div><div style="font-weight:800;font-size:19px;">Benzi AI</div><div class="mint" style="font-size:13px;"><span class="dot"></span> Online · always here for you</div></div>
  </div>
  <div style="padding:24px 22px;">
    <div class="msg"><div class="a">Hi Ayesha, it's good to see you. How has your day been so far?</div></div>
    <div class="msg"><div class="u">Honestly a bit overwhelmed with exams and I couldn't sleep well.</div></div>
    <div class="msg"><div class="a">That sounds really draining — carrying exam stress <i>and</i> losing sleep is a lot at once. It makes sense you'd feel overwhelmed. What's weighing on you the most right now?</div></div>
    <div class="msg"><div class="u">I keep worrying I'll fail and let everyone down.</div></div>
    <div class="msg"><div class="a">Thank you for trusting me with that. Those “what if” thoughts can feel very loud. Would it help to try a short breathing exercise, or talk through one worry at a time?</div></div>
    <div style="text-align:center;margin:10px 0 20px;"><span class="pill" style="background:#E1F0EC;color:#0F766E;font-size:12px;font-weight:700;padding:6px 14px;">🛡️ Safety check passed · supportive mode</span></div>
  </div>
  <div style="position:fixed;bottom:0;left:0;right:0;padding:18px 22px;background:#F1FAF8;">
    <div class="card row sb" style="padding:14px 18px;">
      <span class="muted" style="font-size:15px;">Message Benzi…</span>
      <span class="row" style="gap:14px;"><span style="font-size:20px;">🎤</span><span class="teal pill" style="padding:9px 16px;font-weight:800;">➤</span></span>
    </div>
  </div>
</body></html>`;

// ---------- 3. ADMIN / THERAPIST DASHBOARD ----------
const admin = `<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head>
<body><div class="wrap">
  <div class="row sb" style="margin-bottom:22px;">
    <img src="${logo}" style="height:30px;"/>
    <div class="row" style="gap:10px;"><span class="muted" style="font-size:14px;">Admin</span><div class="av" style="width:38px;height:38px;">M</div></div>
  </div>
  <div class="h" style="font-size:25px;margin-bottom:18px;">Platform Overview</div>

  <div class="row" style="gap:14px;margin-bottom:16px;">
    <div class="card" style="padding:18px;flex:1;"><div class="muted" style="font-size:13px;">Patients</div><div class="h" style="font-size:28px;">1,248</div></div>
    <div class="card" style="padding:18px;flex:1;"><div class="muted" style="font-size:13px;">Therapists</div><div class="h" style="font-size:28px;">86</div></div>
  </div>
  <div class="row" style="gap:14px;margin-bottom:18px;">
    <div class="card teal" style="padding:18px;flex:1;"><div style="font-size:13px;opacity:.85;">Revenue (Jun)</div><div style="font-size:28px;font-weight:800;">$24.6k</div></div>
    <div class="card" style="padding:18px;flex:1;"><div class="muted" style="font-size:13px;">Pending verifications</div><div class="h" style="font-size:28px;">7</div></div>
  </div>

  <div class="card" style="padding:20px;margin-bottom:18px;">
    <div class="row sb" style="margin-bottom:14px;"><div class="h" style="font-size:17px;">Monthly revenue</div><div class="muted" style="font-size:13px;">+18% ▲</div></div>
    <div class="row" style="height:120px;align-items:flex-end;gap:12px;">
      ${[40,55,48,67,72,60,84,78,92].map((h,i)=>`<div class="${i%2?'bar':'barlt'}" style="width:100%;height:${h}%;"></div>`).join("")}
    </div>
  </div>

  <div class="card" style="padding:20px;">
    <div class="h" style="font-size:17px;margin-bottom:14px;">Therapist verifications</div>
    ${[["Dr. Sara Ahmed","Clinical Psychologist","Approved","#0F766E"],["Dr. Bilal Raza","Counselor","Pending","#C2850A"],["Dr. Hira Noor","Psychotherapist","Approved","#0F766E"]].map(r=>`
      <div class="row sb" style="padding:11px 0;border-top:1px solid #EEF6F4;">
        <div class="row" style="gap:12px;"><div class="av" style="width:36px;height:36px;font-size:14px;">${r[0].split(' ')[1][0]}</div><div><div class="h" style="font-size:15px;">${r[0]}</div><div class="muted" style="font-size:12px;">${r[1]}</div></div></div>
        <span class="pill" style="font-size:12px;font-weight:700;color:${r[3]};background:${r[3]==='#0F766E'?'#E1F0EC':'#FBF1DD'};padding:5px 12px;">${r[2]}</span>
      </div>`).join("")}
  </div>
</div></body></html>`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox", "--force-device-scale-factor=2"] });
  const targets = [["patient", patient], ["chat", chat], ["admin", admin]];
  for (const [name, html] of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: 780, height: 1020, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.screenshot({ path: `assets/shot-${name}.png`, clip: { x: 0, y: 0, width: 780, height: 1020 } });
    await page.close();
    console.log("shot-" + name + ".png");
  }
  await browser.close();
})();
