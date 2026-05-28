const express = require("express");
const multer = require("multer");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api");
const { uploadToR2, deleteFromR2 } = require("./backend/r2");
require("dotenv").config();

// Baileys Imports
const {
    default: makeWASocket,
    useMultiFileAuthState,
    getContentType,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

if (!process.env.CONVEX_URL) {
    console.warn("⚠️ CONVEX_URL is not defined in environment variables!");
}
const convexUrl = process.env.CONVEX_URL || "https://robust-hamster-352.convex.cloud";
const convex = new ConvexHttpClient(convexUrl);

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// ── Cache & Global State ─────────────────────
const botCache = {
    settings: {},
    taxonomy: {},
    lastFetch: 0
};

let globalSock = null;
let currentQR = null;
let botReady = false;

async function getCachedSettings() {
    if (Date.now() - botCache.lastFetch > 60000) { // Refresh every 60s
        try {
            const taxRaw = await convex.query(api.settings.get, { key: "taxonomy" });
            botCache.taxonomy = taxRaw ? JSON.parse(taxRaw) : {};
            botCache.settings.welcome = await convex.query(api.settings.get, { key: "welcome_msg" });
            botCache.settings.dev = await convex.query(api.settings.get, { key: "dev_msg" });
            botCache.lastFetch = Date.now();
        } catch(e) {}
    }
    return botCache;
}

// ── Auth Middleware ──────────────────────────
const authAdmin = async (req, res, next) => {
  const adminPhone = req.cookies.admin_phone;
  if (!adminPhone) return res.status(401).json({ error: "Unauthorized" });

  const isAdmin = await convex.query(api.admins.isAdmin, { phone: adminPhone });
  if (!isAdmin) return res.status(401).json({ error: "Unauthorized" });

  next();
};

// ── API Routes ───────────────────────────────
app.get("/api/qr", authAdmin, (req, res) => {
    res.json({ qr: currentQR, ready: botReady });
});

app.post("/api/login", async (req, res) => {
  const { phone } = req.body;
  const admin = await convex.query(api.admins.getByPhone, { phone });
  if (admin) {
    res.cookie("admin_phone", phone, { httpOnly: true, maxAge: 86400000 });
    res.json({ success: true, role: admin.role });
  } else {
    res.status(401).json({ error: "ليس لديك صلاحية الوصول" });
  }
});

// Admins
app.get("/api/admins", authAdmin, async (req, res) => {
    const admins = await convex.query(api.admins.list);
    res.json(admins);
});
app.post("/api/admins", authAdmin, async (req, res) => {
    const { phone, role } = req.body;
    await convex.mutation(api.admins.add, { phone, role });
    res.json({ success: true });
});
app.delete("/api/admins/:id", authAdmin, async (req, res) => {
    await convex.mutation(api.admins.remove, { id: req.params.id });
    res.json({ success: true });
});

// Files
app.get("/api/files", authAdmin, async (req, res) => {
  const files = await convex.query(api.files.list);
  res.json(files);
});

function detectSubject(filename) {
    const name = filename.split('.')[0];
    const parts = name.split(/[_\-\s]/);
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
}

app.post("/api/files", authAdmin, upload.single("file"), async (req, res) => {
  const { stage, name, subject: manualSubject } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const subject = manualSubject || detectSubject(file.originalname);
    const fileName = `${Date.now()}-${file.originalname}`;
    const fileUrl = await uploadToR2(file.buffer, fileName, file.mimetype);

    await convex.mutation(api.files.add, {
      stage, subject, name: name || file.originalname,
      fileUrl, mimetype: file.mimetype, size: file.size,
    });
    botCache.lastFetch = 0; // force cache refresh
    res.json({ success: true, url: fileUrl, detectedSubject: subject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/files/:id", authAdmin, upload.single("file"), async (req, res) => {
    const { stage, subject, name } = req.body;
    const file = req.file;
    try {
        const updateData = { id: req.params.id, stage, subject, name };
        if (file) {
            const fileName = `${Date.now()}-${file.originalname}`;
            const fileUrl = await uploadToR2(file.buffer, fileName, file.mimetype);
            updateData.fileUrl = fileUrl;
            updateData.mimetype = file.mimetype;
            updateData.size = file.size;
        }
        await convex.mutation(api.files.update, updateData);
        botCache.lastFetch = 0; // force cache refresh
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/files/:id", authAdmin, async (req, res) => {
  await convex.mutation(api.files.remove, { id: req.params.id });
  botCache.lastFetch = 0; // force cache refresh
  res.json({ success: true });
});

// Users
app.get("/api/users", authAdmin, async (req, res) => {
  const users = await convex.query(api.users.list);
  res.json(users);
});
app.post("/api/users/ban", authAdmin, async (req, res) => {
  await convex.mutation(api.users.toggleBan, { id: req.body.id, isBanned: req.body.isBanned });
  res.json({ success: true });
});
app.post("/api/users/mute", authAdmin, async (req, res) => {
  await convex.mutation(api.users.toggleMute, { id: req.body.id, isMuted: req.body.isMuted });
  res.json({ success: true });
});

// Broadcast
app.get("/api/broadcasts", authAdmin, async (req, res) => {
  const list = await convex.query(api.broadcasts.list);
  res.json(list);
});
app.post("/api/broadcast", authAdmin, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });
  const id = await convex.mutation(api.broadcasts.add, { message });
  res.json({ success: true, id, note: "تمت الإضافة للقائمة، سيرسلها البوت خلال 30 ثانية" });
});

// Settings
app.get("/api/settings", authAdmin, async (req, res) => {
  const welcome     = await convex.query(api.settings.get, { key: "welcome_msg" });
  const dev         = await convex.query(api.settings.get, { key: "dev_msg" });
  const taxRaw      = await convex.query(api.settings.get, { key: "taxonomy" });
  let taxonomy = {};
  try { taxonomy = taxRaw ? JSON.parse(taxRaw) : {}; } catch(e) { taxonomy = {}; }
  res.json({ welcome, dev, taxonomy });
});

app.post("/api/settings", authAdmin, async (req, res) => {
  const { welcome, dev, taxonomy } = req.body;
  if (welcome  !== undefined) await convex.mutation(api.settings.set, { key: "welcome_msg", value: welcome });
  if (dev      !== undefined) await convex.mutation(api.settings.set, { key: "dev_msg",     value: dev });
  if (taxonomy !== undefined) await convex.mutation(api.settings.set, { key: "taxonomy",    value: JSON.stringify(taxonomy) });
  botCache.lastFetch = 0; // force cache refresh
  res.json({ success: true });
});

app.post("/api/reset-archive", authAdmin, async (req, res) => {
  try {
    await convex.mutation(api.settings.set, { key: "taxonomy", value: "{}" });
    await convex.mutation(api.files.removeAll, {});
    botCache.lastFetch = 0;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || process.env.API_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on port ${PORT}`);
});

// ── Baileys Bot Implementation ──────────────────
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        version,
        browser: ['StudentArchive', 'Chrome', '4.0.0'],
    });

    globalSock = sock;

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            currentQR = qr;
            botReady = false;
        }
        if (connection === 'close') {
            botReady = false;
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? 
                lastDisconnect.error.output.statusCode !== 401 : true;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('WhatsApp Bot is Online! 🚀');
            botReady = true;
            currentQR = null;
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const phone = from.split('@')[0];
        const pushName = msg.pushName || 'مستخدم جديد';
        const type = getContentType(msg.message);
        const body = (type === 'conversation') ? msg.message.conversation : 
                     (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : '';

        // Capture User Profile
        let avatarUrl = null; let about = null;
        await Promise.allSettled([
            sock.profilePictureUrl(from, 'image').then(url => { avatarUrl = url; }).catch(() => {}),
            sock.fetchStatus(from).then(s => { about = s?.status || null; }).catch(() => {}),
        ]);

        const userPayload = { phone, name: pushName };
        if (avatarUrl) userPayload.avatarUrl = avatarUrl;
        if (about)     userPayload.about     = about;

        try { await convex.mutation(api.users.saveUser, userPayload); }
        catch (e) { try { await convex.mutation(api.users.saveUser, { phone, name: pushName }); } catch (_) {} }

        const user = await convex.query(api.users.getByPhone, { phone });
        if (user?.isBanned || user?.isMuted) {
            if (user?.isMuted) await convex.mutation(api.messages.send, { userPhone: phone, text: body, fromMe: false });
            return;
        }

        await convex.mutation(api.messages.send, { userPhone: phone, text: body, fromMe: false });

        if (!global.userSessions) global.userSessions = {};
        const session = global.userSessions[phone] || { state: 'MAIN' };

        const settings = await getCachedSettings();
        let taxonomy = settings.taxonomy;
        const stageNames = Object.keys(taxonomy);

        const isMainMenuChoice = ['1','2','3'].includes(body);
        const isGoBack = body === '0' || body === 'قائمة' || body === 'رجوع';

        if (isGoBack || (!isMainMenuChoice && session.state === 'MAIN')) {
            session.state = 'MAIN';
            global.userSessions[phone] = session;
            const welcomeMsg = settings.settings.welcome || `🌟 أهلاً بك في نظام أرشيف الطالب 🌟\nهذا البوت يساعدك على الوصول للملازم والملفات الدراسية.\n\n👇 اختار من القائمة:\n1️⃣ الملفات والمصادر\n2️⃣ تواصل مع الإدارة\n3️⃣ المطور ومعلومات التواصل\n\nأرسل رقم الاختيار فقط.`;
            await sock.sendMessage(from, { text: welcomeMsg });
            return;
        }

        if (body === '1' && session.state === 'MAIN') {
            if (stageNames.length === 0) {
                await sock.sendMessage(from, { text: '❌ لا توجد مراحل دراسية مضافة بعد.' });
                return;
            }
            session.state = 'STAGES';
            session.stageNames = stageNames;
            global.userSessions[phone] = session;
            let menu = "🎓 *اختار المرحلة الدراسية:*\n\n";
            stageNames.forEach((s, i) => menu += `${i+1}. ${s}\n`);
            menu += "\n0. العودة للقائمة الرئيسية";
            await sock.sendMessage(from, { text: menu });
            return;
        }

        if (body === '2' && session.state === 'MAIN') {
            await sock.sendMessage(from, { text: '☎️ *أنت الآن في وضع التواصل المباشر مع الإدارة.*\n\nأرسل رسالتك وسيتم الرد عليك قريباً.\n\nأرسل *0* للعودة للقائمة.' });
            return;
        }

        if (body === '3' && session.state === 'MAIN') {
            const devMsg = settings.settings.dev || `👨‍💻 *علي الاكبر حيدر شاكر*\nالمدير التنفيذي لشركة صيادين العراق\nمطور برمجيات | طالب هندسة\n\n🔗 *تواصل معي:*\n- انستغرام: https://www.instagram.com/dxet1?igsh=N20wNnJ5bjh0bmJx`;
            await sock.sendMessage(from, { text: devMsg });
            return;
        }

        if (session.state === 'STAGES' && body.match(/^\d+$/)) {
            const stageIdx = parseInt(body) - 1;
            const stage = session.stageNames[stageIdx];
            if (!stage) {
                await sock.sendMessage(from, { text: "❌ اختيار غير صحيح، أرسل رقماً من القائمة." });
                return;
            }

            let subjects = taxonomy && taxonomy[stage] ? taxonomy[stage] : null;
            if (!subjects || subjects.length === 0) {
                const files = await convex.query(api.files.list);
                subjects = [...new Set(files.filter(f => f.stage === stage).map(f => f.subject))];
            }
            
            if (subjects.length === 0) {
                await sock.sendMessage(from, { text: `❌ لا توجد مواد مضافة لـ ${stage} بعد.` });
                return;
            }

            session.state = 'SUBJECTS';
            session.selectedStage = stage;
            session.subjectsList = subjects;
            global.userSessions[phone] = session;

            let menu = `📚 *مواد ${stage}:*\n\n`;
            subjects.forEach((s, i) => menu += `${i+1}. ${s}\n`);
            menu += "\n0. العودة للقائمة الرئيسية";
            await sock.sendMessage(from, { text: menu });
            return;
        }

        if (session.state === 'SUBJECTS' && (body.match(/^\d+$/) || body.toLowerCase() === 'more')) {
            const subjects = session.subjectsList;
            let subject = session.selectedSubject;
            
            if (body.match(/^\d+$/)) {
                const subjectIdx = parseInt(body) - 1;
                subject = subjects[subjectIdx];
            }

            if (!subject) {
                await sock.sendMessage(from, { text: "❌ اختيار غير صحيح." });
                return;
            }

            session.selectedSubject = subject;
            const files = await convex.query(api.files.list);
            const subjectFiles = files.filter(f => f.stage === session.selectedStage && f.subject === subject);

            const pageSize = 5;
            const page = body.toLowerCase() === 'more' ? (session.filePage || 0) + 1 : 0;
            session.filePage = page;
            global.userSessions[phone] = session;

            const start = page * pageSize;
            const end = start + pageSize;
            const filesToShow = subjectFiles.slice(start, end);

            if (filesToShow.length === 0) {
                await sock.sendMessage(from, { text: `✅ انتهت جميع ملفات مادة ${subject}.` });
                return;
            }

            await sock.sendMessage(from, { text: `📂 *ملفات مادة ${subject} (صفحة ${page + 1}):*` });

            for (const f of filesToShow) {
                try {
                    await sock.sendMessage(from, { document: { url: f.fileUrl }, fileName: f.name, mimetype: f.mimetype });
                } catch (e) {}
            }

            if (subjectFiles.length > end) {
                await sock.sendMessage(from, { text: `👇 يوجد المزيد من الملفات!\n\nأرسل *more* لرؤية الصفحة التالية.` });
            }
            return;
        }
    });
}

async function processBroadcasts() {
    if (!globalSock || !botReady) return;
    try {
        const pending = await convex.query(api.broadcasts.listPending);
        if (!pending || pending.length === 0) return;

        const users = await convex.query(api.users.list);
        const activeUsers = users.filter(u => !u.isBanned && !u.isMuted);

        for (const broadcast of pending) {
            let sentCount = 0;
            for (const user of activeUsers) {
                try {
                    const jid = user.phone + '@s.whatsapp.net';
                    await globalSock.sendMessage(jid, { text: broadcast.message });
                    sentCount++;
                    await new Promise(r => setTimeout(r, 500));
                } catch (e) {}
            }
            await convex.mutation(api.broadcasts.markSent, { id: broadcast._id, sentCount });
        }
    } catch (e) { console.error('Broadcast error:', e.message); }
}

startBot();
setTimeout(() => {
    setInterval(processBroadcasts, 30000);
    console.log('📡 Broadcast polling started');
}, 10000);
