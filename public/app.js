/* ═══════════════════════════════════════════
   أرشيف الطالب — Dashboard  v3
   ═══════════════════════════════════════════ */

let TAX = {};   // { "مرحلة": ["مادة1","مادة2"] }

/* ─────────── INIT ─────────── */
document.addEventListener('DOMContentLoaded', () => {
    if (getCookie('admin_phone')) showDashboard();
});

/* ─────────── AUTH ─────────── */
async function doLogin() {
    const phone = document.getElementById('lph').value.trim();
    if (!phone) return toast('أدخل رقم الهاتف', 'w');

    const r = await apiFetch('/api/login', { method:'POST', body:{ phone } });
    if (r.ok) {
        const d = await r.json();
        document.getElementById('rbadge').textContent =
            d.role === 'super_admin' ? 'SUPER ADMIN' :
            d.role === 'editor'      ? 'EDITOR' : 'SUPPORT';
        showDashboard();
    } else {
        toast('رقم غير مسموح', 'e');
    }
}

function showDashboard() {
    document.getElementById('lp').style.display = 'none';
    showSec('home');
}

function doLogout() {
    document.cookie = 'admin_phone=;expires=Thu,01 Jan 1970 00:00:00 UTC;path=/';
    location.reload();
}

/* ─────────── NAV ─────────── */
const SECS = ['home','files','users','admins','bc','settings'];

function showSec(id) {
    SECS.forEach(s => {
        document.getElementById('s-'+s)?.classList.remove('on');
        document.getElementById('nb-'+s)?.classList.remove('on');
    });
    document.getElementById('s-'+id)?.classList.add('on');
    document.getElementById('nb-'+id)?.classList.add('on');

    if (id === 'home')     loadHome();
    if (id === 'files')    loadFiles();
    if (id === 'users')    loadUsers();
    if (id === 'admins')   loadAdmins();
    if (id === 'bc')       loadBroadcasts();
    if (id === 'settings') loadSettings();
}

/* ─────────── HOME / STATS ─────────── */
async function loadHome() {
    const [users, files] = await Promise.all([
        apiFetch('/api/users').then(r=>r.json()),
        apiFetch('/api/files').then(r=>r.json()),
    ]);
    set('st-u', users.length);
    set('st-f', files.length);
    set('st-b', users.filter(u=>u.isBanned).length);
    set('st-m', users.filter(u=>u.isMuted).length);

    const recent = [...users].sort((a,b)=>b.lastSeen-a.lastSeen).slice(0,7);
    document.getElementById('act-list').innerHTML = recent.length
        ? recent.map(u => {
            const n = u.name || 'طالب جديد';
            const av= u.avatarUrl || avUrl(n);
            const t = new Date(u.lastSeen).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
            return `<div class="act">
                <img src="${av}" class="av" onerror="this.src='${avUrl(n)}'">
                <div style="flex:1;min-width:0"><div class="un">${n}</div><div class="up2">${u.phone}</div></div>
                <span class="badge bg3">${t}</span>
            </div>`;
        }).join('')
        : '<p style="color:var(--mu);padding:1rem;text-align:center">لا يوجد طلاب بعد</p>';

    // Load Bot QR Status
    loadBotStatus();
}

let qrInterval = null;
let currentQR = null;
let qrCodeObj = null;

async function loadBotStatus() {
    if (qrInterval) clearInterval(qrInterval);

    const checkStatus = async () => {
        try {
            const res = await apiFetch('/api/qr').then(r => r.json());
            const textEl = document.getElementById('bot-status-text');
            const qrContainer = document.getElementById('bot-qr-container');

            if (res.ready) {
                textEl.innerHTML = '<span style="color:var(--ok)"><i class="fas fa-check-circle"></i> البوت متصل بالواتساب وجاهز للعمل 🚀</span>';
                qrContainer.innerHTML = '';
                currentQR = null;
            } else if (res.qr) {
                textEl.innerHTML = 'امسح الباركود بهاتفك لتسجيل الدخول';
                if (currentQR !== res.qr) {
                    currentQR = res.qr;
                    qrContainer.innerHTML = '';
                    qrCodeObj = new QRCode(qrContainer, {
                        text: res.qr,
                        width: 200,
                        height: 200,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M
                    });
                }
            } else {
                textEl.innerHTML = 'جاري الاتصال...';
                qrContainer.innerHTML = '';
            }
        } catch (e) {
            console.error('Error fetching bot status:', e);
        }
    };

    await checkStatus();
    // Poll every 5 seconds while on home tab
    qrInterval = setInterval(checkStatus, 5000);
}

// Stop polling when leaving home tab
const originalShowSec = showSec;
showSec = function(id) {
    if (id !== 'home' && qrInterval) {
        clearInterval(qrInterval);
        qrInterval = null;
    }
    originalShowSec(id);
};

/* ─────────── FILES ─────────── */
async function loadFiles() {
    await loadTaxonomy();   // populate TAX (may be empty)
    const files = await apiFetch('/api/files').then(r => r.json());
    const container = document.getElementById('ftree');
    container.innerHTML = '';

    if (!files.length) {
        container.innerHTML = '<p style="color:var(--mu);text-align:center;padding:2rem">لا توجد ملفات مرفوعة بعد</p>';
        return;
    }

    // Always group by actual stage values in DB
    // TAX stages first, then any extra stages found in files
    const taxStages  = Object.keys(TAX);
    const fileStages = [...new Set(files.map(f => f.stage).filter(Boolean))];
    const allStages  = [...new Set([...taxStages, ...fileStages])];

    if (!allStages.length) {
        container.innerHTML = '<p style="color:var(--mu);text-align:center;padding:2rem">لا توجد ملفات</p>';
        return;
    }

    allStages.forEach(stage => {
        const sf = files.filter(f => f.stage === stage);
        if (!sf.length) return;

        const subjects = [...new Set(sf.map(f => (f.subject || f.course || 'غير محدد')))];

        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '1rem';
        card.innerHTML = `<div class="sh"><i class="fas fa-folder-open"></i>${stage}<span class="badge bp2">${sf.length}</span></div>`;

        subjects.forEach(sub => {
            // safe base64 key without Arabic
            const uid = 'k' + Math.abs(hashStr(stage + '||' + sub)).toString(16);
            const subFiles = sf.filter(f => (f.subject || f.course || 'غير محدد') === sub);
            card.innerHTML += `
            <div class="subrow" onclick="toggleSub('${uid}')">
                <span style="font-weight:700">📘 ${sub}</span>
                <span class="badge bp2">${subFiles.length}</span>
            </div>
            <div id="sf_${uid}" class="subfls">
                ${subFiles.map(f => `
                <div class="frow">
                    <span class="fn" title="${esc(f.name)}">📄 ${f.name}</span>
                    <div style="display:flex;gap:.35rem;flex-shrink:0">
                        <button class="bico" onclick='openEdit(${JSON.stringify(f._id)},${JSON.stringify(f.name)},${JSON.stringify(f.stage)},${JSON.stringify(f.subject||f.course||"")})'>
                            <i class="fas fa-pencil"></i>
                        </button>
                        <button class="bico" style="color:var(--err)" onclick="delFile('${f._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>`).join('')}
            </div>`;
        });

        container.appendChild(card);
    });
}

// Simple string hash for stable IDs (avoids btoa Arabic issues)
function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
}

function toggleSub(uid) {
    const el = document.getElementById('sf_' + uid);
    el.style.display = (el.style.display === 'none' || !el.style.display) ? 'block' : 'none';
}

/* ─────────── UPLOAD ─────────── */
function loadUpModal() {
    fillStgSel('up-stg');
    syncUpSubs();
    document.getElementById('up-name').value = '';
    document.getElementById('up-file').value = '';
    document.getElementById('up-prog').style.display = 'none';
}

function syncUpSubs() { fillSubSel('up-sub', document.getElementById('up-stg').value); }
function syncEdSubs() { fillSubSel('ed-sub', document.getElementById('ed-stg').value); }

function fillStgSel(id, extra = []) {
    const el = document.getElementById(id);
    // Merge TAX stages with any extra stages (from the file itself)
    const allStages = [...new Set([...Object.keys(TAX), ...extra])];
    el.innerHTML = allStages.length
        ? allStages.map(s => `<option value="${s}">${s}</option>`).join('')
        : '<option value="">لا توجد مراحل — أضف من الإعدادات</option>';
}

function fillSubSel(id, stage, extra = []) {
    const el = document.getElementById(id);
    const allSubs = [...new Set([...(TAX[stage] || []), ...extra])];
    el.innerHTML = allSubs.length
        ? allSubs.map(s => `<option value="${s}">${s}</option>`)
                 .join('')
        : '<option value="">لا توجد مواد لهذه المرحلة</option>';
}

async function doUpload() {
    const file = document.getElementById('up-file').files[0];
    if (!file) return toast('اختر ملفاً','w');

    const btn = document.getElementById('up-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
    document.getElementById('up-prog').style.display = 'block';
    animBar(0, 70, 1200);

    const fd = new FormData();
    fd.append('stage',   document.getElementById('up-stg').value);
    fd.append('subject', document.getElementById('up-sub').value);
    fd.append('name',    document.getElementById('up-name').value || file.name.replace(/\.[^.]+$/,''));
    fd.append('file', file);

    const res = await fetch('/api/files', { method:'POST', body:fd });
    animBar(70, 100, 400);

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> رفع الآن';

    if (res.ok) { toast('تم الرفع ✅'); closeModal('m-upload'); loadFiles(); }
    else        { toast('فشل الرفع ❌','e'); }
}

function animBar(from, to, dur) {
    const bar = document.getElementById('up-bar');
    const step = (to-from)/(dur/16);
    let cur = from;
    const t = setInterval(()=>{
        cur += step; bar.style.width = Math.min(cur,to)+'%';
        if(cur>=to) clearInterval(t);
    },16);
}

/* ─────────── EDIT FILE ─────────── */
async function openEdit(id, name, stage, subject) {
    await loadTaxonomy();

    document.getElementById('ed-id').value   = id;
    document.getElementById('ed-name').value = name;

    // Inject file's own stage/subject so dropdown always has a valid option
    fillStgSel('ed-stg', stage ? [stage] : []);
    const stgEl = document.getElementById('ed-stg');
    stgEl.value = stage;

    // Sync subjects for this stage, injecting file's own subject as fallback
    fillSubSel('ed-sub', stage, subject ? [subject] : []);
    document.getElementById('ed-sub').value = subject;

    // Re-sync subjects when stage changes
    stgEl.onchange = () => {
        fillSubSel('ed-sub', stgEl.value);
    };

    openModal('m-edit');
}

async function doEditFile() {
    const id      = document.getElementById('ed-id').value;
    const name    = document.getElementById('ed-name').value.trim();
    const stage   = document.getElementById('ed-stg').value;
    const subject = document.getElementById('ed-sub').value;
    const fileInp = document.getElementById('ed-file');
    const file    = fileInp.files[0];

    const btn = document.getElementById('ed-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديث...';

    let res;
    if (file) {
        // Upload new file + metadata via FormData
        document.getElementById('ed-prog').style.display = 'block';
        animBarEdit(0, 70, 1200);

        const fd = new FormData();
        fd.append('stage', stage);
        fd.append('subject', subject);
        fd.append('name', name || file.name.replace(/\.[^.]+$/, ''));
        fd.append('file', file);

        res = await fetch(`/api/files/${id}`, { method: 'PUT', body: fd });
        animBarEdit(70, 100, 400);
    } else {
        // Just update metadata via JSON
        res = await apiFetch(`/api/files/${id}`, { method: 'PUT', body: { name, stage, subject } });
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> تحديث';

    if (res.ok) {
        toast('تم التحديث ✅');
        closeModal('m-edit');
        loadFiles();
    } else {
        toast('فشل التحديث ❌', 'e');
    }
}

function animBarEdit(from, to, dur) {
    const bar = document.getElementById('ed-bar');
    const step = (to - from) / (dur / 16);
    let cur = from;
    const t = setInterval(() => {
        cur += step; bar.style.width = Math.min(cur, to) + '%';
        if (cur >= to) clearInterval(t);
    }, 16);
}

async function delFile(id) {
    if (!confirm('حذف الملف نهائياً؟')) return;
    await apiFetch(`/api/files/${id}`, { method:'DELETE' });
    toast('تم الحذف');
    loadFiles();
}

/* ─────────── USERS ─────────── */
async function loadUsers() {
    const users = await apiFetch('/api/users').then(r => r.json());
    document.getElementById('ulist').innerHTML = users.length
        ? users.map(u => {
            const n   = u.name || 'طالب جديد';
            const av  = u.avatarUrl || avUrl(n);
            const sc  = u.isBanned ? 'be' : u.isMuted ? 'byw' : 'bg3';
            const sl  = u.isBanned ? 'محظور' : u.isMuted ? 'مكتوم' : 'نشط';
            const ts  = u.lastSeen ? new Date(u.lastSeen).toLocaleString('ar', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' }) : '—';
            const bio = u.about ? `<div style="font-size:.75rem;color:var(--mu);margin-top:2px;font-style:italic">"${u.about}"</div>` : '';
            return `<div class="urow" style="align-items:flex-start;padding:1.1rem">
                <img src="${av}" class="av" style="width:54px;height:54px;border-radius:15px" onerror="this.src='${avUrl(n)}'">
                <div class="ui">
                    <span class="un">${n}</span>
                    <span class="up2">📞 ${u.phone}</span>
                    ${bio}
                    <div style="margin-top:5px;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
                        <span class="badge ${sc}">${sl}</span>
                        <span style="font-size:.7rem;color:var(--mu)">🕐 ${ts}</span>
                    </div>
                </div>
                <div class="ua" style="margin-top:4px">
                    <button class="btn ${u.isMuted ? 'bs' : 'bw'} bsm" onclick="toggleU('${u._id}','mute',${!u.isMuted})">
                        <i class="fas fa-${u.isMuted ? 'volume-up' : 'volume-mute'}"></i> ${u.isMuted ? 'رفع الكتم' : 'كتم'}
                    </button>
                    <button class="btn ${u.isBanned ? 'bs' : 'bd2'} bsm" onclick="toggleU('${u._id}','ban',${!u.isBanned})">
                        <i class="fas fa-${u.isBanned ? 'unlock' : 'ban'}"></i> ${u.isBanned ? 'رفع الحظر' : 'حظر'}
                    </button>
                </div>
            </div>`;
        }).join('')
        : '<p style="color:var(--mu);padding:1.5rem;text-align:center">لا يوجد طلاب</p>';
}

async function toggleU(id, type, val) {
    const ep  = type==='ban'?'/api/users/ban':'/api/users/mute';
    const key = type==='ban'?'isBanned':'isMuted';
    await apiFetch(ep, { method:'POST', body:{ id, [key]:val } });
    loadUsers();
    toast(val?(type==='ban'?'تم الحظر':'تم الكتم'):'تم الرفع');
}

/* ─────────── ADMINS ─────────── */
async function loadAdmins() {
    const admins = await apiFetch('/api/admins').then(r=>r.json());
    document.getElementById('alist').innerHTML = admins.length
        ? admins.map(a=>{
            const rc = a.role==='super_admin'?'be':a.role==='editor'?'byw':'bp2';
            return `<div class="urow">
                <div class="av" style="display:flex;align-items:center;justify-content:center;font-size:1.4rem">🛡️</div>
                <div class="ui">
                    <span class="un">${a.phone}</span>
                    <div style="margin-top:4px"><span class="badge ${rc}">${a.role}</span></div>
                </div>
                <button class="btn bd2 bsm" onclick="delAdmin('${a._id}')"><i class="fas fa-trash"></i></button>
            </div>`;
        }).join('')
        : '<p style="color:var(--mu);padding:1.5rem;text-align:center">لا يوجد أدمنية</p>';
}

async function doAddAdmin() {
    const phone = document.getElementById('na-phone').value.trim();
    const role  = document.getElementById('na-role').value;
    if (!phone) return toast('أدخل رقم الهاتف','w');
    await apiFetch('/api/admins', { method:'POST', body:{ phone, role } });
    document.getElementById('na-phone').value = '';
    toast('تمت الإضافة ✅');
    loadAdmins();
}

async function delAdmin(id) {
    if (!confirm('إزالة هذا الأدمن؟')) return;
    await apiFetch(`/api/admins/${id}`, { method:'DELETE' });
    toast('تم الحذف');
    loadAdmins();
}

/* ─────────── BROADCAST ─────────── */
function previewBc() {
    const msg = document.getElementById('bc-msg').value.trim();
    const p   = document.getElementById('bc-preview');
    if (!msg) return;
    p.textContent = msg;
    p.style.display = 'block';
}

async function sendBroadcast() {
    const msg = document.getElementById('bc-msg').value.trim();
    if (!msg) return toast('اكتب رسالة أولاً','w');
    if (!confirm(`إرسال هذه الرسالة لجميع الطلاب؟`)) return;

    const btn = document.getElementById('bc-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';

    const res = await apiFetch('/api/broadcast', { method:'POST', body:{ message:msg } });
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال للجميع';

    if (res.ok) {
        toast('✅ تمت الإضافة! البوت سيرسل خلال 30 ثانية');
        document.getElementById('bc-msg').value = '';
        document.getElementById('bc-preview').style.display = 'none';
        loadBroadcasts();
    } else {
        toast('فشل الإرسال','e');
    }
}

async function loadBroadcasts() {
    const list = await apiFetch('/api/broadcasts').then(r=>r.json());
    document.getElementById('bc-log').innerHTML = list.length
        ? list.map(b=>{
            const sc = b.status==='sent'?'bg3':b.status==='failed'?'be':'byw';
            const sl = b.status==='sent'?'مُرسَل':b.status==='failed'?'فشل':'معلق';
            const dt = new Date(b.createdAt).toLocaleString('ar');
            const sc2 = b.sentCount!=null?` • ${b.sentCount} مستلم`:'';
            return `<div class="bcitem">
                <div class="bc-msg">${b.message}</div>
                <div class="bc-meta">
                    <span class="badge ${sc}">${sl}</span>
                    <span>${dt}${sc2}</span>
                </div>
            </div>`;
        }).join('')
        : '<p style="color:var(--mu);padding:1.5rem;text-align:center">لا توجد إذاعات بعد</p>';
}

/* ─────────── SETTINGS ─────────── */
async function loadTaxonomy() {
    const d = await apiFetch('/api/settings').then(r=>r.json());
    TAX = d.taxonomy || {};
    return TAX;
}

async function loadSettings() {
    const d = await apiFetch('/api/settings').then(r=>r.json());
    TAX = d.taxonomy || {};
    document.getElementById('inp-wel').value = d.welcome || '';
    document.getElementById('inp-dev').value = d.dev     || '';
    renderTaxonomy();
}

function renderTaxonomy() {
    // stage chips
    document.getElementById('stage-chips').innerHTML =
        Object.keys(TAX).map(s=>`
        <div class="chip">${s}
            <span class="cx" onclick="delStage('${esc(s)}')">✕</span>
        </div>`).join('');

    // subject parent select
    const sel = document.getElementById('sub-par');
    sel.innerHTML = '<option value="">المرحلة...</option>'+
        Object.keys(TAX).map(s=>`<option>${s}</option>`).join('');

    // tree
    document.getElementById('tx-tree').innerHTML =
        Object.entries(TAX).map(([stg, subs])=>`
        <div class="txnode">
            <div class="txhdr">
                <span><i class="fas fa-folder-open" style="color:var(--p)"></i> ${stg}</span>
                <span class="badge bp2">${subs.length} مادة</span>
            </div>
            <div class="txsubs">
                ${subs.map((s,i)=>`
                <div class="chip">${s}
                    <span class="cx" onclick="delSubject('${esc(stg)}',${i})">✕</span>
                </div>`).join('')}
                ${!subs.length?'<span style="color:var(--mu);font-size:.8rem">لا توجد مواد بعد</span>':''}
            </div>
        </div>`).join('');
}

function addStage() {
    const v = document.getElementById('inp-stage').value.trim();
    if (!v) return;
    if (TAX[v]) return toast('المرحلة موجودة','w');
    TAX[v] = [];
    document.getElementById('inp-stage').value = '';
    renderTaxonomy();
}

function delStage(s) {
    if (!confirm(`حذف "${s}" وكل مواده؟`)) return;
    delete TAX[s]; renderTaxonomy();
}

function addSubject() {
    const stg = document.getElementById('sub-par').value;
    const sub = document.getElementById('inp-sub').value.trim();
    if (!stg) return toast('اختر المرحلة أولاً','w');
    if (!sub) return;
    if (!TAX[stg]) TAX[stg] = [];
    if (TAX[stg].includes(sub)) return toast('المادة موجودة','w');
    TAX[stg].push(sub);
    document.getElementById('inp-sub').value = '';
    renderTaxonomy();
}

function delSubject(stg, idx) {
    TAX[stg].splice(idx,1); renderTaxonomy();
}

async function saveTaxonomy() {
    await apiFetch('/api/settings',{ method:'POST', body:{ taxonomy:TAX } });
    toast('تم حفظ الهيكلية ✨');
}

async function saveBotSettings() {
    await apiFetch('/api/settings',{
        method:'POST',
        body:{
            welcome: document.getElementById('inp-wel').value,
            dev:     document.getElementById('inp-dev').value,
        }
    });
    toast('تم الحفظ ✅');
}

async function resetArchive() {
    const code = Math.floor(1000 + Math.random() * 9000);
    const input = prompt(`⚠️ تحذير: هذا سيحذف كل شيء! للتأكيد، اكتب الرمز التالي: ${code}`);
    if (input !== code.toString()) return toast('الرمز غير صحيح، تم إلغاء العملية','w');

    await apiFetch('/api/reset-archive', { method:'POST' });
    toast('تم تصفير الأرشيف بالكامل 🗑️');
    loadSettings();
    loadFiles();
}

/* ─────────── MODAL ─────────── */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ─────────── TOAST ─────────── */
function toast(msg, type='s') {
    const c = {s:'#22c55e',e:'#ef4444',w:'#f59e0b'};
    const el = document.createElement('div');
    Object.assign(el.style,{
        position:'fixed',bottom:'90px',left:'50%',transform:'translateX(-50%)',
        background:'#18181b',color:c[type]||c.s,
        border:`1px solid ${c[type]||c.s}`,
        padding:'.65rem 1.3rem',borderRadius:'11px',fontWeight:'700',
        fontSize:'.88rem',zIndex:'9999',whiteSpace:'nowrap',
        boxShadow:'0 8px 24px rgba(0,0,0,.4)',transition:'opacity .3s',
        fontFamily:"'Cairo',sans-serif",
    });
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),300); },2500);
}

/* ─────────── HELPERS ─────────── */
function apiFetch(url, opts={}) {
    const o = { headers:{'Content-Type':'application/json'}, ...opts };
    if (o.body && typeof o.body === 'object') o.body = JSON.stringify(o.body);
    return fetch(url, o);
}

function avUrl(n) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=18181b&color=6366f1&bold=true&size=52`;
}

function set(id, val) { document.getElementById(id).textContent = val; }

function esc(s) { return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

function getCookie(n) {
    const v = `; ${document.cookie}`;
    const p = v.split(`; ${n}=`);
    if (p.length===2) return p.pop().split(';').shift();
}
