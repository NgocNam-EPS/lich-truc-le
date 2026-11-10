/* ===== Bản web: chạy trên GitHub Pages với Firebase (Auth + Firestore) ===== */
const IS_WEB = true;
const EMAIL_DOMAIN = '@eps-lichtruc.app';
let fbApp = null, fbAuth = null, CURRENT_UID = null, rolesUnsub = null, subs = [];
S.roles = []; S.noOwner = false; S.authReady = false;

function setStaff(raw, src) { STAFF = toStaff(raw || []); IDX = new Map(STAFF.map(s => [s.id, s])); S.staffSource = src || ''; }
function toEmail(u) { return String(u).trim().toLowerCase() + EMAIL_DOMAIN; }
resolveSession = function () { };

/* Tải xuống bằng trình duyệt */
dl = { save: async ({ filename, data }) => { const b = data instanceof Blob ? data : new Blob([data]); const url = URL.createObjectURL(b); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return { status: 'saved' }; } };

/* Văn bản lưu trong Firestore, chia nhỏ từng phần 900 KB (không cần gói trả phí) */
const CHUNK = 900 * 1024;
function makeAst() {
  return {
    upload: async (file, opt) => {
      const buf = new Uint8Array(await file.arrayBuffer()); const id = uid('a'); const n = Math.ceil(buf.length / CHUNK) || 1;
      for (let i = 0; i < n; i++) await db.doc(`filedata/${id}_${i}`).set({ i, n, d: firebase.firestore.Blob.fromUint8Array(buf.subarray(i * CHUNK, (i + 1) * CHUNK)), type: opt.type, at: Date.now() });
      return { id: id + ':' + n, sizeBytes: buf.length, contentType: opt.type };
    },
    read: async (assetId, type) => {
      const [id, n] = assetId.split(':'); const parts = [];
      for (let i = 0; i < +n; i++) { const d = await db.doc(`filedata/${id}_${i}`).get(); if (!d.exists) throw new Error('Tệp đã bị xóa hoặc chưa tải lên xong.'); parts.push(d.data().d.toUint8Array()); }
      return new Blob(parts, { type: type || 'application/octet-stream' });
    },
    delete: async assetId => { const [id, n] = assetId.split(':'); for (let i = 0; i < +n; i++) await db.doc(`filedata/${id}_${i}`).delete(); }
  };
}
fileBlob = async function (f) { return ast.read(f.assetId, f.type); };

/* ===== Đăng nhập ===== */
viewLogin = function () {
  if (S.noOwner) return `<form class="card login" id="setupform"><div><h2>Thiết lập lần đầu</h2><p class="hint">Chưa có quản trị. Tạo tài khoản chủ sở hữu (quản trị cao nhất) cho ứng dụng.</p></div>
    <label class="field"><span>Tên đăng nhập</span><input id="su_u" type="text" required pattern="[a-z0-9._\\-]{3,30}" placeholder="vd: quantri"></label>
    <label class="field"><span>Mật khẩu (ít nhất 8 ký tự)</span><input id="su_p" type="password" minlength="8" required autocomplete="new-password"></label>
    <label class="field"><span>Tên hiển thị</span><input id="su_n" type="text" placeholder="vd: Phòng KT-AT"></label>
    <button class="btn primary" type="submit">Tạo tài khoản quản trị</button><p class="hint" id="loginerr" role="alert"></p></form>`;
  return `<form class="card login" id="loginform"><div><h2>Đăng nhập</h2><p class="hint">Dùng tài khoản do quản trị cấp cho đơn vị của bạn.</p></div>
    ${S.loginNote ? `<p class="notice">${esc(S.loginNote)}</p>` : ''}
    <label class="field"><span>Tên đăng nhập</span><input id="lu" type="text" autocomplete="username" required></label>
    <label class="field"><span>Mật khẩu</span><input id="lp" type="password" autocomplete="current-password" required></label>
    <button class="btn primary" type="submit" ${S.authReady ? '' : 'disabled'}>${S.authReady ? 'Đăng nhập' : 'Đang kết nối…'}</button>
    <p class="hint" id="loginerr" role="alert"></p></form>`;
};
const AUTH_ERR = { 'auth/invalid-credential': 'Sai tên đăng nhập hoặc mật khẩu.', 'auth/wrong-password': 'Sai tên đăng nhập hoặc mật khẩu.', 'auth/user-not-found': 'Sai tên đăng nhập hoặc mật khẩu.', 'auth/too-many-requests': 'Đăng nhập sai quá nhiều lần, hãy thử lại sau ít phút.', 'auth/email-already-in-use': 'Tên đăng nhập đã tồn tại.', 'auth/weak-password': 'Mật khẩu quá ngắn (ít nhất 6 ký tự).', 'auth/network-request-failed': 'Không kết nối được máy chủ. Kiểm tra mạng.', 'auth/operation-not-allowed': 'Firebase chưa bật đăng nhập Email/Password.' };
const authMsg = e => AUTH_ERR[e && e.code] || (e && (e.message || e.code)) || String(e);

document.addEventListener('submit', async e => {
  const id = e.target.id; if (!['loginform', 'setupform', 'newacc'].includes(id)) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (id === 'loginform') {
    try { E('loginerr').textContent = 'Đang đăng nhập…'; await fbAuth.signInWithEmailAndPassword(toEmail(E('lu').value), E('lp').value); }
    catch (x) { E('loginerr').textContent = authMsg(x); }
  }
  if (id === 'setupform') {
    const u = E('su_u').value.trim().toLowerCase(), p = E('su_p').value, n = E('su_n').value.trim() || 'Quản trị';
    S.settingUp = true;
    try { const cr = await fbAuth.createUserWithEmailAndPassword(toEmail(u), p); const id2 = cr.user.uid;
      await db.doc('config/meta').set({ owner: id2, createdAt: Date.now() }); await db.doc('roles/' + id2).set({ role: 'owner', u, name: n, at: Date.now() });
      S.noOwner = false; await onAuth(cr.user); toast('Đã tạo tài khoản quản trị. Hãy vào tab Dữ liệu để nhập dữ liệu ban đầu.'); }
    catch (x) { E('loginerr').textContent = authMsg(x); }
    finally { S.settingUp = false; }
  }
  if (id === 'newacc') {
    const u = E('na_u').value.trim().toLowerCase(); const r = E('na_r').value;
    const acc = r === 'admin' || r === 'lead' || r === 'viewer' ? { u, role: r, name: E('na_n').value.trim() || (r === 'lead' ? 'Phòng KT-AT' : r === 'viewer' ? 'Lãnh đạo' : u) } : { u, role: 'px', px: r.slice(3), name: E('na_n').value.trim() || PXI[r.slice(3)].short };
    try { const pw = await createAccount(acc); S.newCreds = `${acc.name}  Tên đăng nhập: ${acc.u}   Mật khẩu: ${pw}`; render(); } catch (x) { toast(authMsg(x)); }
  }
}, true);

/* Tạo tài khoản bằng một phiên Firebase phụ để không đăng xuất quản trị */
async function createAccount(acc) {
  const sec = firebase.apps.find(a => a.name === 'sec') || firebase.initializeApp(window.FIREBASE_CONFIG, 'sec');
  const pw = newPw(); const cr = await sec.auth().createUserWithEmailAndPassword(toEmail(acc.u), pw);
  await db.doc('roles/' + cr.user.uid).set(Object.assign({ at: Date.now() }, acc)); await sec.auth().signOut(); return pw;
}
ACT.logout = async () => { await fbAuth.signOut(); };
ACT.createPxAccs = async () => {
  const lines = []; const has = f => S.roles.some(f);
  try {
    if (!has(a => a.role === 'lead')) { const a = { u: 'pktat', role: 'lead', name: 'Phòng KT-AT' }; lines.push(`Phòng KT-AT  Tên đăng nhập: ${a.u}   Mật khẩu: ${await createAccount(a)}`); }
    for (const p of PX) { if (has(a => a.role === 'px' && a.px === p.id)) continue; const a = { u: p.id.replace('cc-', 'pxscc-').replace('cd-', 'pxscd-').replace('gc-ph', 'pxgcph'), role: 'px', px: p.id, name: p.short }; lines.push(`${p.short.padEnd(10)}  Tên đăng nhập: ${a.u}   Mật khẩu: ${await createAccount(a)}`); }
  } catch (x) { toast(authMsg(x)); }
  S.newCreds = lines.join('\n'); render();
};
ACT.createViewer = async () => { const a = { u: S.roles.some(x => x.u === 'lanhdao') ? 'xem' + randStr(3, '0123456789') : 'lanhdao', role: 'viewer', name: 'Lãnh đạo' };
  try { S.newCreds = `Tài khoản chỉ xem  Tên đăng nhập: ${a.u}   Mật khẩu: ${await createAccount(a)}`; render(); } catch (x) { toast(authMsg(x)); } };
ACT.delAcc = async el => { const r = S.roles[+el.dataset.i]; const k = 'delAcc' + el.dataset.i; if (S.armed !== k) { S.armed = k; render(); return; } S.armed = null;
  try { await db.doc('roles/' + r.uid).delete(); toast('Đã khóa tài khoản ' + r.u); } catch (x) { toast(authMsg(x)); } };
ACT.resetPw = async el => { const r = S.roles[+el.dataset.i]; const base = r.u.replace(/-\d+$/, ''); let n = 2; while (S.roles.some(x => x.u === `${base}-${n}`)) n++;
  const acc = { u: `${base}-${n}`, role: r.role, name: r.name }; if (r.px) acc.px = r.px;
  try { const pw = await createAccount(acc); await db.doc('roles/' + r.uid).delete(); S.newCreds = `${acc.name}  Tên đăng nhập mới: ${acc.u}   Mật khẩu: ${pw}\n(Tài khoản cũ ${r.u} đã bị khóa)`; render(); } catch (x) { toast(authMsg(x)); } };

viewAccounts = function () {
  const list = S.roles.filter(r => r.role !== 'owner');
  const missing = PX.filter(p => !list.some(a => a.role === 'px' && a.px === p.id)).length + (list.some(a => a.role === 'lead') ? 0 : 1);
  return `<section class="card stack"><h2>Tài khoản đăng nhập</h2>
    <p class="hint">Mỗi đơn vị một tài khoản. Mật khẩu chỉ hiện một lần khi tạo. Quên mật khẩu thì bấm "Cấp tài khoản mới": ứng dụng tạo tên đăng nhập mới (thêm số -2, -3…) và khóa tài khoản cũ.</p>
    ${S.newCreds ? `<div class="notice good stack"><b>Thông tin đăng nhập vừa tạo. Hãy sao chép và gửi cho từng đơn vị; sau khi đóng sẽ không xem lại được.</b><div class="secrets" id="creds">${esc(S.newCreds)}</div><div class="row"><button class="btn sm" data-act="copyCreds">Sao chép</button><button class="btn sm" data-act="closeCreds">Đã lưu, đóng lại</button></div></div>` : ''}
    <div class="row">${missing ? `<button class="btn primary" data-act="createPxAccs">Tạo tài khoản cho ${missing} đơn vị chưa có (7 phân xưởng và Phòng KT-AT)</button>` : ''}${!list.some(a => a.role === 'viewer') ? '<button class="btn" data-act="createViewer">Tạo tài khoản chỉ xem</button>' : ''}</div>
    <div class="tbl"><table class="list"><thead><tr><th>Tên đăng nhập</th><th>Đơn vị / vai trò</th><th></th></tr></thead><tbody>
    ${S.roles.map((a, i) => a.role === 'owner' ? `<tr><td><b>${esc(a.u)}</b></td><td>Chủ sở hữu (quản trị cao nhất)</td><td></td></tr>` : `<tr><td><b>${esc(a.u)}</b></td><td>${a.role === 'px' ? esc(PXI[a.px].name) : a.role === 'lead' ? 'Phòng KT-AT — nhập lịch Lãnh đạo & các Phòng' : a.role === 'viewer' ? 'Chỉ xem — ' + esc(a.name || '') : 'Quản trị — ' + esc(a.name || '')}</td>
      <td class="num"><button class="btn sm" data-act="resetPw" data-i="${i}">Cấp tài khoản mới</button> <button class="btn sm danger ${S.armed === 'delAcc' + i ? 'armed' : ''}" data-act="delAcc" data-i="${i}">${S.armed === 'delAcc' + i ? 'Bấm lần nữa' : 'Khóa'}</button></td></tr>`).join('')}
    </tbody></table></div></section>
  <form class="card stack" id="newacc"><h3>Thêm tài khoản</h3><div class="row">
    <label class="field"><span>Tên đăng nhập</span><input id="na_u" type="text" required pattern="[a-z0-9._\\-]{3,30}" placeholder="vd: ktat2"></label>
    <label class="field"><span>Vai trò</span><select id="na_r"><option value="viewer">Chỉ xem (bảng theo dõi, giờ làm thêm, tải file)</option><option value="lead">Phòng KT-AT (nhập lịch Lãnh đạo & các Phòng)</option><option value="admin">Quản trị (xem, duyệt, xuất file)</option>${PX.map(p => `<option value="px:${p.id}">Phân xưởng ${esc(p.short)}</option>`).join('')}</select></label>
    <label class="field grow"><span>Tên hiển thị</span><input id="na_n" type="text"></label></div>
    <div><button class="btn" type="submit">Tạo tài khoản</button></div></form>`;
};

/* ===== Dữ liệu: nhập dữ liệu ban đầu, danh sách nhân sự ===== */
function viewData() {
  return `<section class="card stack"><h2>Dữ liệu ứng dụng</h2>
    <div class="stats"><div class="stat"><b>${STAFF.length}</b><span>Nhân sự trong danh sách</span></div><div class="stat"><b>${Object.keys(S.holidays).length}</b><span>Dịp lễ</span></div><div class="stat"><b>${Object.values(S.phones).reduce((a, d) => a + Object.keys((d && d.map) || {}).length, 0)}</b><span>Số điện thoại</span></div></div>
    ${!STAFF.length ? '<p class="notice">Chưa có danh sách nhân sự. Hãy nhập tệp dữ liệu ban đầu hoặc tệp Excel tổng hợp nhân sự.</p>' : `<p class="hint">Nguồn danh sách: ${esc(S.staffSource || '')}</p>`}</section>
  <section class="card stack"><h3>1. Nhập tệp dữ liệu ban đầu (.json)</h3><p class="hint">Tệp do Claude chuẩn bị, gồm danh sách nhân sự, sơ đồ phối hợp, số điện thoại, danh bạ thuê ngoài và dịp lễ 24/11/2026. Không đưa tệp này lên GitHub vì có thông tin cá nhân.</p>
    <div class="row"><input id="seedfile" type="file" accept=".json,application/json"><button class="btn primary" data-act="importSeed">Nhập dữ liệu</button></div></section>
  <section class="card stack"><h3>2. Cập nhật danh sách nhân sự từ Excel</h3><p class="hint">Tệp Excel cùng mẫu "Tổng hợp điều phối nhân sự": sheet <b>Tong hop</b> có các cột Số hiệu, Họ và tên, Năm sinh, Giới tính, Chức danh, Phòng ban, Phân loại.</p>
    <div class="row"><input id="stafffile" type="file" accept=".xlsx,.xls"><button class="btn" data-act="importStaff">Cập nhật danh sách</button></div></section>`;
}
ACT.importSeed = async () => {
  const f = E('seedfile').files[0]; if (!f) { toast('Hãy chọn tệp .json'); return; }
  try {
    const J = JSON.parse(await f.text()); let n = 0;
    if (J.staff) { await db.doc('staff/main').set({ list: J.staff, source: J.staffSource || f.name, updatedAt: Date.now() }); n++; }
    if (J.org) { await db.doc('org/main').set(J.org); n++; }
    for (const [k, v] of Object.entries(J.phones || {})) { await db.doc('phones/' + k).set(v); n++; }
    for (const [k, v] of Object.entries(J.outside || {})) { await db.doc('outside/' + k).set(v); n++; }
    for (const h of J.holidays || []) { const ex = await db.doc('holidays/' + h.id).get(); if (!ex.exists) { await db.doc('holidays/' + h.id).set(h); n++; } }
    toast(`Đã nhập ${n} mục dữ liệu.`);
  } catch (x) { toast('Không nhập được: ' + (x.message || x.code || x)); }
};
ACT.importStaff = async () => {
  const f = E('stafffile').files[0]; if (!f) { toast('Hãy chọn tệp Excel'); return; } if (typeof XLSX === 'undefined') { toast('Không tải được thư viện đọc Excel.'); return; }
  try {
    const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }); const ws = wb.Sheets['Tong hop'] || wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }); const hi = rows.findIndex(r => r.some(c => String(c).trim() === 'Số hiệu'));
    if (hi < 0) { toast('Không thấy cột "Số hiệu".'); return; }
    const H = rows[hi].map(c => String(c).trim()); const ci = ['Số hiệu', 'Họ và tên', 'Năm sinh', 'Giới tính', 'Chức danh', 'Phòng ban', 'Phân loại'].map(n => H.indexOf(n));
    if (ci.some(x => x < 0)) { toast('Tệp thiếu cột bắt buộc.'); return; }
    const seen = new Map(), out = [];
    rows.slice(hi + 1).forEach(r => { let id = String(r[ci[0]]).trim(); const name = String(r[ci[1]]).trim(); if (!id || !name) return;
      if (seen.has(id)) { seen.set(id, seen.get(id) + 1); id = 'CHUA-CO-SH-' + id + '-' + seen.get(id); } else seen.set(id, 1);
      out.push([id, name, r[ci[2]] || '', String(r[ci[3]]).trim(), String(r[ci[4]]).trim(), String(r[ci[5]]).trim(), String(r[ci[6]]).trim()]); });
    await db.doc('staff/main').set({ list: out, source: f.name + ' (' + new Date().toLocaleDateString('vi-VN') + ')', updatedAt: Date.now() }); toast(`Đã cập nhật ${out.length} nhân sự.`);
  } catch (x) { toast('Không đọc được tệp: ' + (x.message || x)); }
};

/* ===== Khởi động ===== */
function unsubAll() { subs.forEach(f => { try { f(); } catch (e) { } }); subs = []; if (unitsUnsub) { unitsUnsub(); unitsUnsub = null; } if (filesUnsub) { filesUnsub(); filesUnsub = null; } }
async function onAuth(user) {
  unsubAll(); CURRENT_UID = user ? user.uid : null; window.CURRENT_UID = CURRENT_UID;
  if (!user) { S.me = null; S.tab = null; S.holidays = {}; S.units = {}; S.files = {}; S.roles = []; setStaff([], ''); render(); return; }
  try {
    const [m, r] = await Promise.all([db.doc('config/meta').get(), db.doc('roles/' + user.uid).get()]);
    const isOwner = m.exists && m.data().owner === user.uid; const role = r.exists ? r.data() : null;
    if (!isOwner && !role) { S.loginNote = 'Tài khoản này đã bị khóa hoặc chưa được cấp quyền.'; await fbAuth.signOut(); return; }
    S.loginNote = ''; S.me = isOwner ? { role: 'owner', u: (role && role.u) || 'owner', name: (role && role.name) || 'Chủ sở hữu' } : { role: role.role, px: role.px, u: role.u, name: role.name };
  } catch (x) { S.loginNote = 'Không đọc được quyền tài khoản: ' + (x.message || x.code); await fbAuth.signOut(); return; }
  S.mode = 'db'; S.tab = defaultTab(); ast = S.me.role === 'viewer' ? null : makeAst();
  const err = x => setSave('error', x && (x.message || x.code));
  subs.push(db.doc('staff/main').onSnapshot(d => { const v = d.exists ? d.data() : null; setStaff(v ? v.list : [], v ? v.source : ''); render(); }, err));
  subs.push(db.collection('holidays').onSnapshot(snap => { const next = {}; snap.docs.forEach(d => { next[d.id] = pend.has('holidays/' + d.id) ? S.holidays[d.id] : clone(d.data()); });
    Object.keys(S.holidays).forEach(id => { if (pend.has('holidays/' + id) && S.holidays[id]) next[id] = S.holidays[id]; });
    S.holidays = next; const before = S.cur; ensureCur(); if (S.cur && before === S.cur && !unitsUnsub) subUnits(); render(); }, err));
  subs.push(db.doc('org/main').onSnapshot(d => { if (d.exists && !pend.has('org/main')) { S.org = Object.assign(clone(DEFAULT_ORG), clone(d.data())); render(); } }, () => { }));
  subs.push(db.collection('phones').onSnapshot(snap => { const n = {}; snap.docs.forEach(d => n[d.id] = pend.has('phones/' + d.id) ? S.phones[d.id] : clone(d.data())); S.phones = n; if (!S.panel) render(); }, () => { }));
  subs.push(db.collection('outside').onSnapshot(snap => { const n = {}; snap.docs.forEach(d => n[d.id] = pend.has('outside/' + d.id) ? S.outside[d.id] : clone(d.data())); S.outside = n; if (!S.panel) render(); }, () => { }));
  if (S.me.role === 'owner') subs.push(db.collection('roles').onSnapshot(snap => { S.roles = snap.docs.map(d => Object.assign({ uid: d.id }, d.data())).sort((a, b) => (a.at || 0) - (b.at || 0)); if (S.tab === 'accounts') render(); }, () => { }));
  setSave('idle'); render();
}
async function webBoot() {
  render();
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey || /DIEN_/.test(cfg.apiKey) || typeof firebase === 'undefined') {
    E('main').innerHTML = `<div class="card stack"><h2>Chưa cấu hình Firebase</h2><p class="hint">Mở tệp <b>firebase-config.js</b> trong repository và dán cấu hình dự án Firebase (xem README.md).</p></div>`; return;
  }
  fbApp = firebase.initializeApp(cfg); fbAuth = firebase.auth(); db = firebase.firestore();
  try { db.enablePersistence && await db.enablePersistence({ synchronizeTabs: true }); } catch (e) { }
  try { const m = await db.doc('config/meta').get(); S.noOwner = !m.exists; } catch (e) { S.noOwner = false; }
  S.mode = 'db'; S.authReady = true;
  fbAuth.onAuthStateChanged(u => { if (S.settingUp) return; if (S.noOwner && !u) { render(); return; } onAuth(u); });
  render();
}
webBoot();
