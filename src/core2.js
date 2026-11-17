/* ===== Lõi dữ liệu: đơn vị, ngày giờ, giờ làm thêm, kiểm tra, xuất mẫu ===== */
const PX = [
  { id: 'cc-pm', dept: 'PXSCC-PM', short: 'PXSCC PM', name: 'PXSC Cơ - Nhiệt Phú Mỹ', full: 'PHÂN XƯỞNG SỬA CHỮA CƠ - NHIỆT PHÚ MỸ', area: 'PM', kind: 'CC', groups: ['tại Phân xưởng', 'tại NMNĐ Phú Mỹ 3', 'tại NMNĐ Phú Mỹ 2.2'] },
  { id: 'cd-pm', dept: 'PXSCĐ-PM', short: 'PXSCĐ PM', name: 'PXSC Điện - Tự động Phú Mỹ', full: 'PHÂN XƯỞNG SỬA CHỮA ĐIỆN - TỰ ĐỘNG PHÚ MỸ', area: 'PM', kind: 'CĐ', groups: ['tại Phân xưởng', 'tại NMNĐ Phú Mỹ 3', 'tại NMNĐ Phú Mỹ 2.2'] },
  { id: 'cc-vt', dept: 'PXSCC-VT', short: 'PXSCC VT', name: 'PXSC Cơ - Nhiệt Vĩnh Tân', full: 'PHÂN XƯỞNG SỬA CHỮA CƠ - NHIỆT VĨNH TÂN', area: 'VT', kind: 'CC', groups: ['tại NMNĐ VT2', 'tại NMNĐ VT4'] },
  { id: 'cd-vt', dept: 'PXSCĐ-VT', short: 'PXSCĐ VT', name: 'PXSC Điện - Tự động Vĩnh Tân', full: 'PHÂN XƯỞNG SỬA CHỮA ĐIỆN - TỰ ĐỘNG VĨNH TÂN', area: 'VT', kind: 'CĐ', groups: ['tại Vĩnh Tân 2', 'tại Vĩnh Tân 4'] },
  { id: 'cc-md', dept: 'PXSCC-MD', short: 'PXSCC MD', name: 'PXSC Cơ - Nhiệt Mông Dương', full: 'PHÂN XƯỞNG SỬA CHỮA CƠ - NHIỆT MÔNG DƯƠNG', area: 'MD', kind: 'CC', groups: [''] },
  { id: 'cd-md', dept: 'PXSCĐ-MD', short: 'PXSCĐ MD', name: 'PXSC Điện - Tự động Mông Dương', full: 'PHÂN XƯỞNG SỬA CHỮA ĐIỆN - TỰ ĐỘNG MÔNG DƯƠNG', area: 'MD', kind: 'CĐ', groups: [''] },
  { id: 'gc-ph', dept: 'PX GC-PH', short: 'PX GC-PH', name: 'PX Gia công - Phục hồi', full: 'PHÂN XƯỞNG GIA CÔNG - PHỤC HỒI', area: 'GC', kind: 'GC', groups: ['tại Phú Mỹ', 'tại Vĩnh Tân', 'tại Mông Dương'] }
];
const PXI = Object.fromEntries(PX.map(p => [p.id, p]));
const KINDS = { eps: 'Nhân sự EPS', sctx: 'Ca SCTX', thue: 'Thuê ngoài', os: 'Outsource' };
const PRJ_TYPES = { SCL: 'Sửa chữa lớn', SXK: 'Sản xuất khác', SCTX: 'Sửa chữa thường xuyên' };
function prjOn(ctx, sid, date) { return (ctx.projects || []).filter(p => p.from && p.from <= date && (!p.to || p.to >= date) && (p.members || []).some(m => m.sid === sid)); }
function prjStatus(p, today) { if (p.from && today < p.from) return 'sap'; if (p.to && today > p.to) return 'xong'; return 'dang'; }
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function toStaff(raw) { return raw.map(r => ({ id: r[0], name: r[1], year: r[2], gender: r[3], title: r[4], dept: r[5], cat: r[6] })); }
const pd = s => new Date(s + 'T00:00:00Z');
const iso = d => d.toISOString().slice(0, 10);
const dmy = s => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
const dm = s => { const [, m, d] = s.split('-'); return `${d}/${m}`; };
const nextDay = s => { const d = pd(s); d.setUTCDate(d.getUTCDate() + 1); return iso(d); };
const wdNum = s => pd(s).getUTCDay();
const wdShort = s => { const n = wdNum(s); return n === 0 ? 'CN' : 'Thứ ' + (n + 1); };
const wdLong = s => { const n = wdNum(s); return n === 0 ? 'Chủ nhật' : 'Thứ ' + (n + 1); };
const dayLong = s => { const [y, m, d] = s.split('-'); return `${wdShort(s)}, ngày ${d} tháng ${m} năm ${y}`; };
const caList = day => [day.ca1 && 'c1', day.ca2 && 'c2'].filter(Boolean);
const caName = c => c === 'c1' ? 'Ca 1' : 'Ca 2';
const caTime = c => c === 'c1' ? '07h00 – 19h00 · 12 giờ' : '19h00 – 07h00 sáng hôm sau · 12 giờ';
const caLabel = c => c === 'c1' ? 'Ca ngày (Ca 1)' : 'Ca đêm (Ca 2)';
const rkey = (date, c, g) => `${date}|${c}|${g}`;
const uid = p => p + Math.random().toString(36).slice(2, 9);
const normName = s => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

function defaultUnit(pxid) {
  return { px: pxid, status: 'draft', note: '', groups: PXI[pxid].groups.slice(), canbo: {}, roster: {}, follow: {}, tc: {}, hd: {}, ot: {}, congxa: pxid === 'gc-ph' ? defaultCongXa() : null, signer: { title: 'QUẢN ĐỐC', name: '' }, updatedAt: 0 };
}
function defaultCongXa() {
  return { sections: [
    { id: 's1', title: 'Trực phục vụ Lãnh đạo Tổng Công ty', type: 'mark', rows: [] },
    { id: 's2', title: 'Trực phục vụ Công tác đột xuất tại VP.TCT (Trực tại VP.TCT)', type: 'mark', rows: [] },
    { id: 's3', title: 'Trực phục vụ Lãnh đạo Công ty EPS', type: 'mark', rows: [] },
    { id: 's4', title: 'Trực phục vụ Lãnh đạo Công ty OPS', type: 'mark', rows: [] },
    { id: 's5', title: 'Trực phục vụ công tác PCCC tại NMĐ PM2.2 và trực phục vụ công tác xe chuyên dùng', type: 'shift', rows: [{ ca: 'Ca1', cells: {} }, { ca: 'Ca2', cells: {} }] },
    { id: 's6', title: 'Trực phục vụ công tác PCCC tại NMĐ PM3 và trực phục vụ công tác xe chuyên dùng', type: 'shift', rows: [{ ca: 'Ca1', cells: {} }, { ca: 'Ca2', cells: {} }] }
  ] };
}
/* 11/2026: PXSCC PM, PXSCĐ PM trực tại Phân xưởng, NMNĐ Phú Mỹ 3, NMNĐ Phú Mỹ 2.2.
   Bố cục cũ ([''], 2 hoặc 3 vị trí kiểu cũ): dồn toàn bộ người đã nhập vào vị trí "tại Phân xưởng". */
function pmGroups(x, pxid) {
  const g = x.groups.join('|'); const OLD = ['', 'tại NMNĐ Phú Mỹ 3|tại NMNĐ Phú Mỹ 2.2', 'tại NMNĐ Phú Mỹ 3|tại NMNĐ Phú Mỹ 2.2|tại Phân xưởng'];
  if (!OLD.includes(g)) return;
  ['roster', 'follow'].forEach(f => { const src = x[f] || {}, out = {};
    Object.keys(src).forEach(k => { const [d, c] = k.split('|'); const nk = rkey(d, c, 0);
      if (f === 'roster') out[nk] = (out[nk] || []).concat(src[k] || []); else out[nk] = out[nk] || src[k]; });
    x[f] = out; });
  Object.keys(x.follow).forEach(k => { if ((x.roster[k] || []).length) delete x.follow[k]; });
  x.groups = PXI[pxid].groups.slice();
}
function normUnit(u, pxid) { const d = defaultUnit(pxid); const x = Object.assign(d, u || {}); ['canbo', 'roster', 'follow', 'tc', 'hd', 'ot'].forEach(k => x[k] = x[k] || {}); if (!x.groups || !x.groups.length) x.groups = PXI[pxid].groups.slice(); if (pxid === 'cc-pm' || pxid === 'cd-pm') pmGroups(x, pxid); if (pxid === 'gc-ph' && !x.congxa) x.congxa = defaultCongXa(); if (!x.signer) x.signer = { title: 'QUẢN ĐỐC', name: '' }; return x; }

/* ===== Hiển thị một người ===== */
function personName(e, ctx) { if (e.sid && ctx.idx.get(e.sid)) return ctx.idx.get(e.sid).name; return e.name || ''; }
function personPhone(e, ctx) { return e.phone || (e.sid && ctx.phones[e.sid]) || ''; }
function personTag(e) {
  const t = []; if (e.nt) t.push('(NT)'); if (e.k === 'sctx') t.push('(Ca SCTX)'); if (e.k === 'thue') t.push('(Thuê ngoài)'); if (e.k === 'os' && e.trade) t.push(`(${e.trade})`); if (e.dp) t.push('(DP)');
  return t.join(' ');
}
function personLine(e, n, ctx, withPhone) {
  const ph = personPhone(e, ctx); const tag = personTag(e);
  return `${n ? n + '. ' : ''}${personName(e, ctx)}${tag ? ' ' + tag : ''}${ph && (withPhone || e.nt) ? '\nSĐT: ' + ph : ''}`;
}
const ntFirst = arr => arr.slice().sort((a, b) => (b.nt ? 1 : 0) - (a.nt ? 1 : 0));

/* ===== Giờ trực lễ và giờ làm thêm ===== */
/* Giờ làm thêm tính cho mỗi ca trực 12 giờ: mặc định 10,5 giờ; ca đêm đầu tiên của dịp lễ: 2,5 giờ */
function otHours(org) { const h = (org && org.hours) || {}; const n = (v, d) => (v === '' || v == null || isNaN(+v)) ? d : +v; const ca = n(h.otCa, 10.5); return { ca, first: n(h.otFirst, 2.5), canbo: n(h.otCanbo, ca), phone: n(h.phoneNight, 0) }; }
function shiftOt(H, day, c, org) { const o = otHours(org); return (c === 'c2' && H.days.length && day.date === H.days[0].date) ? o.first : o.ca; }
const fh = v => v == null || v === '' ? '–' : String(Math.round(+v * 100) / 100).replace('.', ',');
function dutyMap(u, H, org) {
  const o = otHours(org); const m = new Map();
  const add = (sid, h, label) => { if (!sid) return; const x = m.get(sid) || { h: 0, items: [] }; x.h += h; x.items.push(`${label}: ${fh(h)} giờ`); m.set(sid, x); };
  H.days.forEach(day => {
    caList(day).forEach(c => (u.groups || ['']).forEach((g, gi) => ((u.roster || {})[rkey(day.date, c, gi)] || []).forEach(e => {
      if (e.k === 'eps' && e.sid) add(e.sid, shiftOt(H, day, c, org), `${dm(day.date)} ${caName(c)}`);
    })));
    const cb = (u.canbo || {})[day.date];
    if (cb) { if (day.ca1 && o.canbo) add(cb, o.canbo, `${dm(day.date)} cán bộ trực ca ngày`); if (day.ca2 && o.phone) add(cb, o.phone, `${dm(day.date)} trực điện thoại đêm`); }
  });
  return m;
}
/* Nhân sự thuê ngoài/outsource trong lịch ca trực: số ca, số giờ (không tính vào giới hạn làm thêm) */
function outsideRows(u, H, org) {
  const hc = +((org.hours || {}).ca) || 12; const m = new Map();
  H.days.forEach(day => caList(day).forEach(c => (u.groups || []).forEach((g, gi) => ((u.roster || {})[rkey(day.date, c, gi)] || []).forEach(e => {
    if (e.k !== 'thue' && e.k !== 'os') return; const k = normName(e.name); if (!k) return;
    const x = m.get(k) || { name: e.name, k: e.k, trade: e.trade || '', company: e.company || '', phone: e.phone || '', n: 0, h: 0, items: [] };
    x.n++; x.h += hc; x.items.push(`${dm(day.date)} ${c === 'c1' ? 'ca ngày' : 'ca đêm'}${g ? ' ' + g : ''}`); m.set(k, x);
  }))));
  return [...m.values()].sort((a, b) => b.h - a.h);
}
function peopleOf(u, H) {
  const s = new Set();
  H.days.forEach(day => { caList(day).forEach(c => (u.groups || []).forEach((g, gi) => ((u.roster || {})[rkey(day.date, c, gi)] || []).forEach(e => e.k === 'eps' && e.sid && s.add(e.sid))));
    if ((u.canbo || {})[day.date]) s.add(u.canbo[day.date]);
    ['tc', 'hd'].forEach(k => (((u[k] || {})[day.date]) || []).forEach(e => e.k === 'eps' && e.sid && s.add(e.sid))); });
  return [...s];
}
function otRows(u, H, ctx) {
  const lim = ctx.org.limits || { month: 40, year: 300 }; const duty = dutyMap(u, H, ctx.org);
  return peopleOf(u, H).map(sid => {
    const s = ctx.idx.get(sid) || { name: sid, title: '', dept: '' }; const o = (u.ot || {})[sid] || {}; const d = duty.get(sid) || { h: 0, items: [] };
    const num = v => (v === '' || v == null || isNaN(+v)) ? null : +v;
    const m = num(o.m), y = num(o.y), x = num(o.x) || 0;
    const totM = m == null ? null : m + d.h + x, totY = y == null ? null : y + d.h + x;
    let level = 'ok';
    if ((totM != null && totM > lim.month) || (totY != null && totY > lim.year)) level = 'over'; else if (m == null || y == null) level = 'missing'; else if (totM >= lim.month * 0.8 || totY >= lim.year * 0.9) level = 'near';
    return { sid, s, duty: d.h, items: d.items, m, y, x, totM, totY, level, note: o.note || '' };
  }).sort((a, b) => (b.totY || 0) - (a.totY || 0));
}

/* ===== Kiểm tra đủ dữ liệu trước khi gửi duyệt ===== */
/* Vị trí trực không bắt buộc: để trống vẫn gửi duyệt được (NMNĐ Phú Mỹ 3, NMNĐ Phú Mỹ 2.2) */
const optGroup = g => /Phú Mỹ (3|2\.2)\b/.test(g || '');
function checkUnit(u, H, ctx) {
  const err = [], warn = []; const p = PXI[u.px];
  H.days.forEach(day => {
    const perCa = {};
    caList(day).forEach(c => u.groups.forEach((g, gi) => {
      const k = rkey(day.date, c, gi); const list = (u.roster[k] || []).filter(e => e.k !== 'os');
      const where = `${caName(c)} ${dmy(day.date)}${g ? ' ' + g : ''}`;
      if (!list.length && !u.follow[k] && !optGroup(g)) err.push(`Chưa có người trực ${where}`);
      if (list.length && !list.some(e => e.nt)) warn.push(`Chưa chọn nhóm trưởng (NT) ${where}`);
      list.forEach(e => { if (e.sid) { perCa[e.sid] = perCa[e.sid] || new Set(); perCa[e.sid].add(c); } });
    }));
    Object.keys(perCa).forEach(sid => prjOn(ctx, sid, day.date).forEach(pj => warn.push(`${(ctx.idx.get(sid) || {}).name || sid} đang tham gia công trình ${pj.type} "${pj.name}" ngày ${dmy(day.date)}`)));
    Object.entries(perCa).forEach(([sid, set]) => { if (set.size > 1) warn.push(`${(ctx.idx.get(sid) || {}).name || sid} trực cả 2 ca ngày ${dmy(day.date)} (24 giờ liên tục)`); });
    if (!u.canbo[day.date]) warn.push(`Chưa chọn cán bộ phân xưởng trực ngày ${dmy(day.date)}`);
  });
  const rows = otRows(u, H, ctx);
  const miss = rows.filter(r => r.m == null || r.y == null); if (miss.length) err.push(`${miss.length} người chưa nhập giờ làm thêm lũy kế (tháng và năm)`);
  const over = rows.filter(r => r.level === 'over'); if (over.length) warn.push(`${over.length} người vượt giới hạn giờ làm thêm`);
  return { err, warn, rows };
}

/* ===== Xuất các mẫu Excel ===== */
const F = { n: { font: {} }, b: { font: { b: true } } };
const BOX = { border: 'thin', wrap: true, v: 'top' };
const CENTER = { h: 'center', v: 'center', wrap: true };
function head3(ws, org, col, toCol) {
  const L = org.company || ['TỔNG CÔNG TY PHÁT ĐIỆN 3', 'CÔNG TY DỊCH VỤ SỬA CHỮA', 'CÁC NHÀ MÁY ĐIỆN EVNGENCO3'];
  L.forEach((t, i) => ws.merge(i + 1, col, i + 1, toCol || col, t, { font: { b: i > 0, sz: 13 }, h: 'center', v: 'center' }));
}
function signBlock(ws, r, c1, c2, signer, extra) {
  const st = { font: { b: true }, h: 'center', v: 'center', wrap: true };
  let rr = r; if (extra) { ws.merge(rr, c1, rr, c2, extra, { font: { i: true }, h: 'center', v: 'center' }); rr++; }
  ws.merge(rr, c1, rr, c2, (signer && signer.title) || 'GIÁM ĐỐC', st); ws.height(rr, (signer && signer.title || '').includes('\n') ? 36 : 20);
  ws.height(rr + 1, 20); ws.height(rr + 2, 20); ws.height(rr + 3, 20);
  ws.merge(rr + 4, c1, rr + 4, c2, (signer && signer.name) || '', st);
  return rr + 5;
}
function holTitle(H) { return (H.title || H.name).toUpperCase(); }

/* --- DK01: Lịch trực Công ty --- */
function buildDK01(H, units, ctx) {
  const wb = new XW.Book(); const ws = wb.sheet('LICH TRUC', { cols: [2.4, 50, 52, 52, 56, 52], landscape: true, paper: 8 });
  const lastC = 6; head3(ws, ctx.org, 2);
  ws.merge(5, 2, 5, lastC, `LỊCH TRỰC CÔNG TY EPS CAO ĐIỂM TRONG DỊP ${holTitle(H)}`, { font: { b: true, sz: 16 }, h: 'center', v: 'center', wrap: true }); ws.height(5, 26);
  const hdr = ['Trực Lãnh đạo và Cán bộ EPS', 'Phân xưởng Gia công - Phục hồi', 'Các phân xưởng sửa chữa Phú Mỹ', 'Các phân xưởng Sửa chữa Vĩnh Tân', 'Phân xưởng Sửa chữa Mông Dương'];
  hdr.forEach((t, i) => ws.set(7, i + 2, t, { font: { b: true }, border: 'thin', h: 'center', v: 'center', wrap: true })); ws.height(7, 36);
  let r = 8;
  const U = id => units[id];
  const caHead = (day, c) => !day.ca1 ? 'Trực từ 19h00 giao ca đến 07h00 ngày hôm sau' : (c === 'c1' ? 'Trực ca 1: từ 07h00 giao ca đến 19h00' : 'Trực ca 2: từ 19h00 giao ca đến 07h00 ngày hôm sau');
  const pxBlock = (lines, pid, num, day, labelFn) => {
    const u = U(pid); const p = PXI[pid]; lines.push({ t: `${ROMAN[num]}. ${p.kind === 'CC' ? 'PXSC Cơ - Nhiệt' : 'PXSC Điện - Tự Động'}:`, b: true });
    caList(day).forEach(c => {
      lines.push({ t: caHead(day, c), i: true });
      const os = [];
      u.groups.forEach((g, gi) => {
        const k = rkey(day.date, c, gi); const list = ntFirst((u.roster[k] || []).filter(e => e.k !== 'os'));
        os.push(...(u.roster[k] || []).filter(e => e.k === 'os'));
        if (u.groups.length > 1 || g) lines.push({ t: `${p.kind === 'CC' ? 'PXSC Cơ - Nhiệt' : 'PXSC Điện - Tự động'} ${g}`, b: true });
        if (!list.length) lines.push({ t: u.follow[k] ? 'Theo lịch trực tăng cường' : '-' });
        list.forEach((e, i) => lines.push({ t: personLine(e, i + 1, ctx) }));
      });
      if (os.length) { lines.push({ t: 'Outsource', b: true }); os.forEach((e, i) => lines.push({ t: personLine(e, i + 1, ctx, true) })); }
      lines.push({ t: '' });
    });
  };
  H.days.forEach(day => {
    const start = day.ca1 ? '07h00' : '19h00';
    ws.merge(r, 2, r, lastC, `${dayLong(day.date)} (từ ${start} ngày ${dmy(day.date)} đến 07h00 ngày ${dmy(nextDay(day.date))})`, { font: { b: true }, fill: 'FFFF00', border: 'thin', v: 'center' }); ws.height(r, 22); r++;
    const cols = [[], [], [], [], []];
    // Cột 1: Lãnh đạo, cán bộ
    const L = (H.lead || {})[day.date] || {}; const c0 = cols[0];
    const who = (sid, lines) => { const s = sid && ctx.idx.get(sid); if (!s) { lines.push({ t: '-' }); return; } lines.push({ t: s.name, b: true }); lines.push({ t: 'Chức vụ: ' + ((ctx.org.titles || {})[sid] || s.title) }); lines.push({ t: 'SĐT: ' + (ctx.phones[sid] || '') }); };
    const mode = (place) => day.ca1 ? `- Ca ngày: trực tại ${place} từ 07h00 đến 19h00.\n- Ca đêm: trực điện thoại từ xa từ 19h00 đến 07h00 sáng hôm sau.` : 'Trực điện thoại từ xa từ 19h00 đến 07h00 sáng hôm sau.';
    c0.push({ t: 'I. Lãnh đạo EPS:', b: true }, { t: mode('Văn Phòng EPS'), i: true }); who(L.ld, c0); c0.push({ t: '' });
    c0.push({ t: 'II. Cán bộ Các Phòng EPS:', b: true }, { t: mode('Văn Phòng EPS'), i: true }); who(L.cb, c0); c0.push({ t: '' });
    c0.push({ t: 'III. Cán bộ Các Phân xưởng:', b: true }, { t: mode('Phân Xưởng'), i: true });
    let n = 0; ['cc-pm', 'cd-pm', 'cc-vt', 'cd-vt', 'cc-md', 'cd-md', 'gc-ph'].forEach(pid => { const sid = U(pid).canbo[day.date]; if (!sid) return; n++; c0.push({ t: `${n}. ${PXI[pid].name}:`, b: true }); who(sid, c0); c0.push({ t: '' }); });
    if (!n) c0.push({ t: '-' });
    // Cột 2: GC-PH
    const g = U('gc-ph'); const c1 = cols[1];
    g.groups.forEach((grp, gi) => {
      c1.push({ t: `${ROMAN[gi]}. Trực công tác Gia công phục hồi ${grp}`, b: true });
      caList(day).forEach(c => {
        const k = rkey(day.date, c, gi); const list = ntFirst((g.roster[k] || []).filter(e => e.k !== 'os')); const os = (g.roster[k] || []).filter(e => e.k === 'os');
        c1.push({ t: caHead(day, c), i: true });
        if (!list.length) c1.push({ t: g.follow[k] || !os.length ? 'Theo lịch trực tăng cường' : '-' });
        list.forEach((e, i) => c1.push({ t: personLine(e, i + 1, ctx) }));
        if (os.length) { c1.push({ t: 'Outsource', b: true }); os.forEach((e, i) => c1.push({ t: personLine(e, i + 1, ctx, true) })); }
      });
      c1.push({ t: '' });
    });
    pxBlock(cols[2], 'cc-pm', 0, day); pxBlock(cols[2], 'cd-pm', 1, day);
    pxBlock(cols[3], 'cc-vt', 0, day); pxBlock(cols[3], 'cd-vt', 1, day);
    pxBlock(cols[4], 'cc-md', 0, day); pxBlock(cols[4], 'cd-md', 1, day);
    const nmax = Math.max(...cols.map(c => c.length));
    for (let i = 0; i < nmax; i++) {
      cols.forEach((col, j) => { const ln = col[i] || { t: '' };
        ws.set(r, j + 2, ln.t, { font: { b: !!ln.b, i: !!ln.i }, wrap: true, border: { l: 'thin', r: 'thin', b: i === nmax - 1 ? 'thin' : null }, v: 'top' }); });
      r++;
    }
  });
  r++;
  ws.set(r++, 2, 'Ghi chú: ', { font: { b: true, i: true } });
  (H.notes || []).forEach(t => { ws.merge(r, 2, r, lastC, t, { font: { i: true }, wrap: true }); r++; });
  r++;
  const top = r; ws.set(r++, 2, 'Nơi nhận:', { font: { b: true, i: true } });
  (H.recipients || []).forEach(t => ws.set(r++, 2, t, { font: { sz: 12 } }));
  signBlock(ws, top, 5, 6, H.signer);
  ws.autoHeights(); return wb;
}

/* --- DK02: Trực tăng cường & huy động đột xuất --- */
function buildDK02(H, units, ctx) {
  const wb = new XW.Book();
  [['tc', 'Danh sach truc tang cuong', 'DANH SÁCH NHÂN SỰ TRỰC TĂNG CƯỜNG TẠI CÁC ĐƠN VỊ'], ['hd', 'Danh sach huy dong dot xuat', 'DANH SÁCH NHÂN SỰ TRỰC HUY ĐỘNG ĐỘT XUẤT TẠI CÁC ĐƠN VỊ']].forEach(([key, sname, title]) => {
    const D = H.days; const nC = D.length; const lastC = 2 + nC;
    const ws = wb.sheet(sname, { cols: [2, 15, ...D.map(() => 26)], landscape: true });
    head3(ws, ctx.org, 2, 3);
    ws.merge(5, 2, 5, lastC, `${title}\nTRONG DỊP ${holTitle(H)}`, { font: { b: true, sz: 14 }, h: 'center', v: 'center', wrap: true }); ws.height(5, 40);
    const hs = { font: { b: true }, border: 'thin', h: 'center', v: 'center', wrap: true };
    let r = 7;
    ws.set(r, 2, 'Ngày:', hs); D.forEach((d, i) => ws.set(r, 3 + i, `${dmy(d.date)} (${wdShort(d.date)})`, hs)); r++;
    ws.set(r, 2, 'Từ:', hs); D.forEach((d, i) => ws.set(r, 3 + i, `${d.ca1 ? '07h00' : '19h00'} ${dmy(d.date)}`, { border: 'thin', h: 'center', v: 'center' })); r++;
    ws.set(r, 2, 'Đến:', hs); D.forEach((d, i) => ws.set(r, 3 + i, `07h00 ${dmy(nextDay(d.date))}`, { border: 'thin', h: 'center', v: 'center' })); r++;
    const cell = { border: 'thin', wrap: true, v: 'center', h: 'center' };
    const rowsFor = (lists, labelFn) => {
      const n = Math.max(1, ...lists.map(l => l.length));
      for (let i = 0; i < n; i++) { ws.set(r, 2, labelFn(i), { border: 'thin', h: 'center', v: 'center', wrap: true });
        lists.forEach((l, j) => ws.set(r, 3 + j, l[i] ? personLine(l[i], 0, ctx, true) : '', cell)); r++; }
    };
    PX.forEach((p, pi) => {
      const u = units[p.id];
      ws.merge(r, 2, r, lastC, `${ROMAN[pi]}. ${p.full}`, { font: { b: true }, border: 'thin', v: 'center' }); r++;
      if (p.id === 'gc-ph') {
        u.groups.forEach((grp, gi) => {
          ws.merge(r, 2, r, lastC, `${gi + 1}. ${grp.charAt(0).toUpperCase() + grp.slice(1)}`, { font: { b: true, i: true }, border: 'thin' }); r++;
          [['c1', 'a. Trực ca 1: từ 07h00 đến 19h00'], ['c2', 'b. Trực ca 2: từ 19h00 đến 07h00 ngày hôm sau']].forEach(([c, lab]) => {
            ws.merge(r, 2, r, lastC, lab, { font: { i: true }, border: 'thin' }); r++;
            rowsFor(D.map(d => ntFirst((u[key][d.date] || []).filter(e => (e.g || 0) === gi && (e.c || 'c2') === c))), i => String(i + 1));
          });
        });
      } else {
        rowsFor(D.map(d => ntFirst((u[key][d.date] || []).filter(e => e.k !== 'os'))), i => String(i + 1));
        const os = D.map(d => (u[key][d.date] || []).filter(e => e.k === 'os'));
        if (os.some(l => l.length)) rowsFor(os, i => 'Outsource ' + (i + 1));
      }
    });
    r++;
    ws.merge(r, 2, r, lastC, 'Ghi chú: Các nhân viên Nhóm trực tăng cường luôn đảm bảo điện thoại liên lạc thông suốt 24/24 và trực từ xa tại khu QLVHSC. Phải đảm bảo có mặt trong vòng 30 phút từ khi được huy động tăng cường.', { font: { i: true }, wrap: true }); r += 2;
    signBlock(ws, r, Math.max(3, lastC - 1), lastC, H.signer);
    ws.autoHeights();
  });
  return wb;
}

/* --- DK03: Lịch phục vụ công xa (PX GC-PH) --- */
function buildDK03(H, units, ctx, wbIn) {
  const u = units['gc-ph']; const D = H.days; const lastC = 3 + D.length;
  const wb = wbIn || new XW.Book(); const ws = wb.sheet('Cong xa', { cols: [6, 24, 22, ...D.map(() => 14)], landscape: true });
  const half = Math.max(3, Math.floor(lastC / 2));
  ws.merge(1, 1, 1, 3, 'CÔNG TY DỊCH VỤ SỬA CHỮA CÁC\nNHÀ MÁY ĐIỆN EVNGENCO3', { font: { sz: 12 }, h: 'center', v: 'center', wrap: true });
  ws.merge(1, 4, 1, lastC, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc', { font: { b: true, sz: 12 }, h: 'center', v: 'center', wrap: true }); ws.height(1, 36);
  ws.merge(2, 1, 2, 3, 'PX GIA CÔNG - PHỤC HỒI', { font: { b: true, sz: 12 }, h: 'center' });
  ws.merge(3, 4, 3, lastC, `Phú Mỹ, ngày….tháng…..năm ${D.length ? D[0].date.slice(0, 4) : ''}`, { font: { i: true, sz: 12 }, h: 'center' });
  ws.merge(5, 1, 5, lastC, `LỊCH PHỤC VỤ CÔNG XA DỊP NGHỈ ${holTitle(H)}`, { font: { b: true, sz: 14 }, h: 'center', v: 'center', wrap: true }); ws.height(5, 26);
  let r = 7; const hs = { font: { b: true, sz: 12 }, border: 'thin', h: 'center', v: 'center', wrap: true }; const cs = { font: { sz: 12 }, border: 'thin', h: 'center', v: 'center', wrap: true }; const ls = { font: { sz: 12 }, border: 'thin', v: 'center', wrap: true };
  (u.congxa ? u.congxa.sections : []).forEach(sec => {
    ws.merge(r, 1, r, lastC, sec.title, { font: { b: true, i: true, sz: 12 }, v: 'center', wrap: true }); r++;
    if (sec.type === 'shift') {
      ws.set(r, 1, 'Ca', hs); ws.merge(r, 2, r, 3, 'Thời gian', hs); D.forEach((d, i) => ws.set(r, 4 + i, dmy(d.date), hs)); r++;
      sec.rows.forEach(row => { ws.set(r, 1, row.ca, cs); ws.merge(r, 2, r, 3, row.ca === 'Ca1' ? 'Từ 07h00 đến 19h00' : 'Từ 19h00 đến 07h00 hôm sau', ls);
        D.forEach((d, i) => { const e = (row.cells || {})[d.date]; ws.set(r, 4 + i, e && (e.name || e.sid) ? personLine(e, 0, ctx, true) : '', cs); }); r++; });
    } else {
      ws.set(r, 1, 'STT', hs); ws.set(r, 2, 'Họ và tên', hs); ws.set(r, 3, 'Phục vụ', hs); D.forEach((d, i) => ws.set(r, 4 + i, dmy(d.date), hs)); r++;
      if (!sec.rows.length) { ws.set(r, 1, '', cs); ws.set(r, 2, '', ls); ws.set(r, 3, '', ls); D.forEach((d, i) => ws.set(r, 4 + i, '', cs)); r++; }
      sec.rows.forEach((row, i) => {
        ws.set(r, 1, String(i + 1).padStart(2, '0'), cs); ws.set(r, 2, personLine(row, 0, ctx, true), ls); ws.set(r, 3, row.serve || '', ls);
        if (row.span) ws.merge(r, 4, r, lastC, row.span, cs); else D.forEach((d, j) => ws.set(r, 4 + j, ((row.marks || {})[d.date]) || '', cs));
        r++;
      });
    }
  });
  r++;
  ws.merge(r, 1, r, lastC, 'GHI CHÚ:\n  -   T: Là trực 24/24 giờ (thời gian bắt đầu 07 giờ 00 phút ngày trực đến 07 giờ 00 phút ngày hôm sau).\n  -   Ca 1:  Trực từ 7h00 đến 19h00.\n  -   Ca 2:  Trực từ 19h00 đến 07h00 ngày hôm sau.', { font: { i: true, sz: 12 }, wrap: true }); ws.height(r, 72); r += 2;
  signBlock(ws, r, Math.max(4, lastC - 2), lastC, u.signer);
  ws.autoHeights(18, 16); return wb;
}

/* --- DK06: Sơ đồ phối hợp --- */
function buildDK06(H, units, ctx) {
  const org = ctx.org; const wb = new XW.Book();
  const box = { border: 'thin', h: 'center', v: 'center', wrap: true, font: { sz: 12 } };
  const boxB = { border: 'thin', h: 'center', v: 'center', wrap: true, font: { b: true, sz: 12 } };
  // Sheet 1: Tổng quan
  { const W = 16; const ws = wb.sheet('Tong quan', { cols: Array.from({ length: W }, (_, i) => i % 4 === 0 ? 2 : 11), landscape: true });
    ws.merge(1, 1, 1, W, `SƠ ĐỒ TỔNG QUAN ĐIỀU PHỐI XỬ LÝ SỰ CỐ\nTRONG DỊP ${holTitle(H)}`, { font: { b: true, sz: 16 }, h: 'center', v: 'center', wrap: true }); ws.height(1, 44);
    const slot = (k, n) => { const span = Math.floor(W / n); const c1 = k * span + 2; return [c1, Math.min(W, c1 + span - 2)]; };
    const put = (r, k, n, top, body) => { const [a, b] = slot(k, n); ws.merge(r, a, r, b, top, boxB); if (body != null) ws.merge(r + 1, a, r + 1, b, body, box); };
    const gd = org.gd || {}; put(3, 1, 3, gd.role || 'GĐ\nChỉ đạo chung', gd.text || '');
    (org.pgd || []).forEach((x, i, a) => put(6, i, a.length, x.role, x.text));
    (org.groups || []).forEach((x, i, a) => put(9, i, a.length, x.role, (x.people || []).join('\n')));
    [['PXSCC PM', 'PXSCC VT', 'PXSCC MD'], ['PXSCĐ PM', 'PXSCĐ VT', 'PXSCĐ MD'], ['KV. MIỀN NAM', 'KV. MIỀN TRUNG', 'KV. MIỀN BẮC']].forEach((row, ri) => row.forEach((t, i) => { const [a, b] = slot(i, 3); ws.merge(12 + ri * 2, a, 12 + ri * 2, b, t, ri === 2 ? boxB : box); }));
    [3, 4, 6, 7, 9, 10].forEach(r => ws.height(r, r === 10 ? 110 : 44)); [12, 14, 16].forEach(r => ws.height(r, 24));
  }
  // Sheet 2: Sơ đồ lịch trực
  { const order = ['cc-pm', 'cd-pm', 'gc-ph', 'cd-vt', 'cc-vt', 'cc-md', 'cd-md']; const lastC = 2 + order.length;
    const ws = wb.sheet('So do Lich truc', { cols: [13, 7, ...order.map(() => 24)], landscape: true, paper: 8 });
    ws.merge(1, 1, 1, lastC, `SƠ ĐỒ NHÂN SỰ CHỦ CHỐT TRONG DỊP ${holTitle(H)}`, { font: { b: true, sz: 16 }, h: 'center', v: 'center', wrap: true }); ws.height(1, 30);
    const gd = org.gd || {}; ws.merge(3, 4, 3, 6, gd.text || '', boxB); ws.height(3, 36);
    const top = org.sodoTop || []; const per = Math.max(1, Math.floor(order.length / Math.max(1, top.length)));
    top.forEach((t, i) => { const a = 3 + i * per; ws.merge(5, a, 5, Math.min(lastC, a + per - 1), t, box); }); ws.height(5, 36);
    if (org.sodoKT) { ws.merge(7, 4, 7, 6, org.sodoKT, box); ws.height(7, 66); }
    let r = 9; order.forEach((id, i) => ws.set(r, 3 + i, PXI[id].short, boxB)); ws.height(r, 22); r++;
    const keys = order.map(id => ((org.key || {})[id] || [])); const nk = Math.max(1, ...keys.map(k => k.length));
    for (let i = 0; i < nk; i++) { ws.set(r, 1, '', {}); order.forEach((id, j) => ws.set(r, 3 + j, keys[j][i] || '', box)); r++; }
    r++;
    ws.set(r, 1, 'Ngày', boxB); ws.set(r, 2, 'Ca', boxB); order.forEach((id, i) => ws.set(r, 3 + i, PXI[id].short, boxB)); r++;
    H.days.forEach(day => {
      ws.merge(r, 1, r + 1, 1, `${wdLong(day.date)}\n${dmy(day.date)}`, boxB);
      ['c1', 'c2'].forEach((c, ci) => {
        ws.set(r + ci, 2, caName(c), boxB);
        order.forEach((id, j) => {
          const u = units[id]; let txt = '-';
          if (day[c === 'c1' ? 'ca1' : 'ca2']) {
            const parts = u.groups.map((g, gi) => {
              const k = rkey(day.date, c, gi); const list = ntFirst((u.roster[k] || []).filter(e => e.k !== 'os'));
              let e = list[0]; if (e && !e.nt && list.find(x => x.nt)) e = list.find(x => x.nt);
              if (!e) { const t = ((u.tc || {})[day.date] || []).filter(x => (id !== 'gc-ph') || ((x.g || 0) === gi && (x.c || 'c2') === c)); if (t[0]) e = Object.assign({}, t[0], { dp: true, nt: false }); }
              const line = e ? personLine(Object.assign({}, e), 0, ctx, true) : '-';
              return u.groups.length > 1 ? `${gi + 1}. ${id === 'gc-ph' ? 'KV ' + g.replace(/^tại /, '') : g.replace(/^tại /, '')}\n${line}` : line;
            });
            txt = parts.join('\n');
          }
          ws.set(r + ci, 3 + j, txt, box);
        });
      });
      r += 2;
    });
    ws.autoHeights(20, 16);
  }
  return wb;
}

/* --- Bảng tổng hợp giờ làm thêm --- */
function buildOT(H, units, ctx) {
  const wb = new XW.Book(); const ws = wb.sheet('Gio lam them', { cols: [6, 26, 12, 30, 12, 10, 11, 11, 11, 12, 12, 16], landscape: true });
  const lim = ctx.org.limits || { month: 40, year: 300 }; const last = 12;
  head3(ws, ctx.org, 1, 4);
  ws.merge(5, 1, 5, last, `TỔNG HỢP GIỜ LÀM THÊM NHÂN SỰ TRỰC ${holTitle(H)}`, { font: { b: true, sz: 14 }, h: 'center', v: 'center', wrap: true });
  ws.merge(6, 1, 6, last, `Giới hạn: ${lim.month} giờ/tháng, ${lim.year} giờ/năm. Chỉ tính nhân sự EPS. Mỗi ca trực 12 giờ (ca ngày 07h00–19h00, ca đêm 19h00–07h00) tính ${fh(otHours(ctx.org).ca)} giờ làm thêm; ca đêm đầu tiên tính ${fh(otHours(ctx.org).first)} giờ. Không tính Ca SCTX và người thuê ngoài.`, { font: { i: true, sz: 12 }, h: 'center' });
  const hs = { font: { b: true, sz: 12 }, border: 'thin', h: 'center', v: 'center', wrap: true };
  ['STT', 'Họ và tên', 'Số hiệu', 'Chức danh', 'Đơn vị', 'Giờ làm thêm dịp lễ', 'Lũy kế tháng', 'Lũy kế năm', 'Phát sinh khác', 'Tổng tháng', 'Tổng năm', 'Ghi chú'].forEach((t, i) => ws.set(8, i + 1, t, hs)); ws.height(8, 34);
  let r = 9, n = 0; const cs = { font: { sz: 12 }, border: 'thin', v: 'center', wrap: true }; const ns = { font: { sz: 12 }, border: 'thin', v: 'center', h: 'right' };
  PX.forEach(p => otRows(units[p.id], H, ctx).forEach(x => {
    n++; const warn = x.level === 'over' ? 'VƯỢT GIỚI HẠN' : x.level === 'missing' ? 'Thiếu số liệu' : '';
    const vs = x.level === 'over' ? { font: { sz: 12, b: true, color: 'C00000' }, border: 'thin', v: 'center', h: 'right' } : ns;
    [n, x.s.name, x.sid, x.s.title, p.short, x.duty, x.m ?? '', x.y ?? '', x.x || 0, x.totM ?? '', x.totY ?? '', [warn, x.note].filter(Boolean).join('. ')].forEach((v, i) =>
      ws.set(r, i + 1, v, i >= 5 && i <= 10 ? (i >= 9 ? vs : ns) : (i === 0 ? { font: { sz: 12 }, border: 'thin', h: 'center', v: 'center' } : cs)));
    r++;
  }));
  ws.autoHeights(18, 16); return wb;
}

/* --- Lịch trực riêng của một phân xưởng --- */
function buildPX(H, units, ctx, px) {
  const u = units[px], p = PXI[px], D = H.days; const wb = new XW.Book();
  const hs = { font: { b: true, sz: 12 }, border: 'thin', h: 'center', v: 'center', wrap: true };
  const cs = { font: { sz: 12 }, border: 'thin', v: 'center', wrap: true }; const cc = Object.assign({}, cs, { h: 'center' });
  const head = (ws, last, title) => {
    const w = ws.cols.slice(0, last); const tot = w.reduce((a, b) => a + b, 0); let acc = 0, sp = 1; for (let i = 0; i < last - 1; i++) { acc += w[i]; sp = i + 1; if (acc >= tot * 0.45) break; }
    ws.merge(1, 1, 1, sp, 'CÔNG TY DỊCH VỤ SỬA CHỮA CÁC\nNHÀ MÁY ĐIỆN EVNGENCO3', { font: { sz: 12 }, h: 'center', v: 'center', wrap: true }); ws.height(1, 36);
    ws.merge(2, 1, 2, sp, p.full, { font: { b: true, sz: 12 }, h: 'center', v: 'center', wrap: true }); ws.height(2, 34);
    ws.merge(1, sp + 1, 1, last, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc', { font: { b: true, sz: 12 }, h: 'center', v: 'center', wrap: true });
    ws.merge(2, sp + 1, 2, last, `………, ngày….tháng…..năm ${D.length ? D[0].date.slice(0, 4) : ''}`, { font: { i: true, sz: 12 }, h: 'center', v: 'center' });
    const lines = title.split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length * 1.25 / Math.max(10, tot))), 0);
    ws.merge(4, 1, 4, last, title, { font: { b: true, sz: 14 }, h: 'center', v: 'center', wrap: true }); ws.height(4, 22 * lines + 6);
  };
  const sign = (ws, r, last) => {
    ws.merge(r, 1, r, 3, 'NGƯỜI LẬP', { font: { b: true, sz: 12 }, h: 'center' });
    signBlock(ws, r, Math.max(5, last - 3), last, u.signer && u.signer.title ? u.signer : { title: 'QUẢN ĐỐC', name: '' });
  };
  // Sheet 1: lịch ca trực
  { const last = 9; const ws = wb.sheet('Lich ca truc', { cols: [12, 10, 15, 16, 5, 24, 30, 13, 15], landscape: true });
    head(ws, last, `LỊCH TRỰC CA CỦA ${p.full}\nTRONG DỊP ${holTitle(H)}`);
    let r = 6; ['Ngày', 'Ca', 'Thời gian', 'Vị trí', 'STT', 'Họ và tên', 'Chức danh', 'Ghi chú', 'Số điện thoại'].forEach((t, i) => ws.set(r, i + 1, t, hs)); ws.height(r, 30); r++;
    D.forEach(day => {
      const cb = u.canbo[day.date] && ctx.idx.get(u.canbo[day.date]);
      const r0 = r;
      caList(day).forEach(c => {
        const rc = r;
        u.groups.forEach((g, gi) => {
          const k = rkey(day.date, c, gi); const list = ntFirst(u.roster[k] || []); const rg = r;
          if (!list.length) { ws.set(r, 5, '', cc); ws.set(r, 6, u.follow[k] ? 'Theo lịch trực tăng cường' : '–', Object.assign({}, cs, { font: { sz: 12, i: true } })); [7, 8, 9].forEach(j => ws.set(r, j, '', cs)); r++; }
          list.forEach((e, i) => { const s = e.sid && ctx.idx.get(e.sid);
            ws.set(r, 5, i + 1, cc); ws.set(r, 6, personName(e, ctx) + (e.nt ? ' (NT)' : ''), Object.assign({}, cs, { font: { sz: 12, b: !!e.nt } }));
            ws.set(r, 7, s ? s.title : [e.company, e.trade].filter(Boolean).join(' · '), cs);
            ws.set(r, 8, e.k === 'eps' ? '' : KINDS[e.k], cc); ws.set(r, 9, personPhone(e, ctx), cc); r++; });
          ws.merge(rg, 4, r - 1, 4, g ? g.replace(/^tại /, '') : '', cc);
        });
        ws.merge(rc, 2, r - 1, 2, c === 'c1' ? 'Ca ngày\n(Ca 1)' : 'Ca đêm\n(Ca 2)', Object.assign({}, cc, { font: { sz: 12, b: true } }));
        ws.merge(rc, 3, r - 1, 3, c === 'c1' ? '07h00 – 19h00' : '19h00 – 07h00\nhôm sau', cc);
      });
      { ws.set(r, 2, '', cs); ws.merge(r, 2, r, 4, day.ca1 ? 'Cán bộ PX trực (ca ngày tại PX, ca đêm điện thoại)' : 'Cán bộ PX trực (điện thoại)', Object.assign({}, cs, { font: { sz: 12, i: true } }));
        ws.set(r, 5, '', cs); ws.set(r, 6, cb ? cb.name : '–', Object.assign({}, cs, { font: { sz: 12, b: true } })); ws.set(r, 7, cb ? cb.title : '', cs); ws.set(r, 8, '', cs); ws.set(r, 9, cb ? (ctx.phones[cb.id] || '') : '', cc); r++; }
      ws.merge(r0, 1, r - 1, 1, `${wdLong(day.date)}\n${dmy(day.date)}`, Object.assign({}, cc, { font: { sz: 12, b: true } }));
    });
    r++; ws.merge(r, 1, r, last, 'Ghi chú: Mỗi ca trực 12 giờ. NT: nhóm trưởng. Ca SCTX: ca sửa chữa thường xuyên. Nhóm trưởng báo cho Trưởng ca đương nhiệm số điện thoại liên hệ khi có công tác.', { font: { i: true, sz: 12 }, wrap: true }); r += 2;
    sign(ws, r, last); ws.autoHeights(18, 16); }
  // Sheet 2: tăng cường, huy động
  { const last = 2 + D.length; const ws = wb.sheet('Tang cuong - huy dong', { cols: [16, 8, ...D.map(() => 28)], landscape: true });
    head(ws, last, `DANH SÁCH TRỰC TĂNG CƯỜNG, HUY ĐỘNG ĐỘT XUẤT CỦA ${p.full}\nTRONG DỊP ${holTitle(H)}`);
    let r = 6; ws.set(r, 1, 'Danh sách', hs); ws.set(r, 2, 'STT', hs); D.forEach((d, i) => ws.set(r, 3 + i, `${dmy(d.date)} (${wdShort(d.date)})`, hs)); r++;
    [['tc', 'Trực tăng cường'], ['hd', 'Huy động đột xuất']].forEach(([k, lab]) => {
      const lists = D.map(d => ntFirst((u[k] || {})[d.date] || [])); const n = Math.max(1, ...lists.map(l => l.length)); const r0 = r;
      for (let i = 0; i < n; i++) { ws.set(r, 2, i + 1, cc); lists.forEach((l, j) => { const e = l[i];
        ws.set(r, 3 + j, e ? personLine(e, 0, ctx, true) + (px === 'gc-ph' && e ? `\n(${(u.groups[e.g || 0] || '').replace(/^tại /, 'KV ')}, ${caName(e.c || 'c2')})` : '') : '', cc); }); r++; }
      ws.merge(r0, 1, r - 1, 1, lab, Object.assign({}, cc, { font: { sz: 12, b: true } }));
    });
    r++; ws.merge(r, 1, r, last, 'Ghi chú: Nhân viên trực tăng cường luôn đảm bảo điện thoại liên lạc thông suốt 24/24, có mặt trong vòng 30 phút khi được huy động.', { font: { i: true, sz: 12 }, wrap: true }); r += 2;
    sign(ws, r, last); ws.autoHeights(18, 16); }
  // Sheet 3: giờ làm thêm
  { const last = 10; const ws = wb.sheet('Gio lam them', { cols: [6, 24, 28, 10, 11, 11, 11, 11, 11, 18], landscape: true }); const lim = ctx.org.limits || { month: 40, year: 300 };
    head(ws, last, `GIỜ LÀM THÊM CỦA NHÂN SỰ TRỰC LỄ – ${p.full}\nTRONG DỊP ${holTitle(H)}`);
    ws.merge(5, 1, 5, last, `Giới hạn ${lim.month} giờ/tháng, ${lim.year} giờ/năm. Mỗi ca trực 12 giờ tính ${fh(otHours(ctx.org).ca)} giờ làm thêm; ca đêm đầu tiên tính ${fh(otHours(ctx.org).first)} giờ. Không tính Ca SCTX và người thuê ngoài.`, { font: { i: true, sz: 12 }, h: 'center' });
    let r = 6; ['STT', 'Họ và tên', 'Chức danh', 'Giờ làm thêm dịp lễ', 'Lũy kế tháng', 'Lũy kế năm', 'Phát sinh khác', 'Tổng tháng', 'Tổng năm', 'Ghi chú'].forEach((t, i) => ws.set(r, i + 1, t, hs)); ws.height(r, 34); r++;
    otRows(u, H, ctx).forEach((x, i) => { const bad = x.level === 'over'; const ns = { font: { sz: 12, b: bad, color: bad ? 'C00000' : '000000' }, border: 'thin', v: 'center', h: 'right' };
      [i + 1, x.s.name, x.s.title, x.duty, x.m ?? '', x.y ?? '', x.x || 0, x.totM ?? '', x.totY ?? '', [bad ? 'Vượt giới hạn' : '', x.note].filter(Boolean).join('. ')].forEach((v, j) => ws.set(r, j + 1, v, j === 0 ? cc : j <= 2 || j === 9 ? cs : (j >= 7 && j <= 8 ? ns : Object.assign({}, cs, { h: 'right' })))); r++; });
    r++; sign(ws, r, last); ws.autoHeights(18, 16); }
  if (px === 'gc-ph') buildDK03(H, units, ctx, wb);
  return wb;
}

/* --- Danh sách nhân sự thực hiện các công trình --- */
function buildPRJ(ctx, pxFilter) {
  const wb = new XW.Book(); const last = 11;
  const ws = wb.sheet('Cong trinh', { cols: [5, 12, 30, 8, 18, 20, 5, 32, 11, 28, 14], landscape: true });
  const hs = { font: { b: true, sz: 12 }, border: 'thin', h: 'center', v: 'center', wrap: true };
  const cs = { font: { sz: 12 }, border: 'thin', v: 'center', wrap: true }; const cc = Object.assign({}, cs, { h: 'center' });
  head3(ws, ctx.org, 1, 4);
  ws.merge(1, 7, 1, last, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { font: { b: true, sz: 12 }, h: 'center' });
  ws.merge(2, 7, 2, last, 'Độc lập - Tự do - Hạnh phúc', { font: { b: true, sz: 12 }, h: 'center' });
  const today = new Date(); const ymd = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  ws.merge(5, 1, 5, last, `DANH SÁCH NHÂN SỰ THỰC HIỆN CÁC CÔNG TRÌNH SCL, SXK, SCTX${pxFilter ? '\n' + PXI[pxFilter].full : ''}`, { font: { b: true, sz: 14 }, h: 'center', v: 'center', wrap: true }); ws.height(5, pxFilter ? 44 : 24);
  ws.merge(6, 1, 6, last, `(Cập nhật đến ngày ${ymd}. SCL: sửa chữa lớn; SXK: sản xuất khác; SCTX: sửa chữa thường xuyên)`, { font: { i: true, sz: 12 }, h: 'center' });
  let r = 8; ['STT', 'Phân xưởng', 'Tên công trình', 'Loại', 'Địa điểm', 'Thời gian thực hiện', 'TT', 'Họ và tên', 'Số hiệu', 'Chức danh / đơn vị', 'Số điện thoại'].forEach((t, i) => ws.set(r, i + 1, t, hs)); ws.height(r, 34); r++;
  const list = (ctx.projects || []).filter(p => !pxFilter || p.px === pxFilter).sort((a, b) => PX.findIndex(x => x.id === a.px) - PX.findIndex(x => x.id === b.px) || (a.from || '').localeCompare(b.from || ''));
  list.forEach((p, i) => {
    const ms = ntFirst(p.members || []); const r0 = r;
    if (!ms.length) { [7, 8, 9, 10, 11].forEach(j => ws.set(r, j, j === 8 ? '(chưa có nhân sự)' : '', j === 8 ? Object.assign({}, cs, { font: { sz: 12, i: true } }) : cs)); r++; }
    ms.forEach((m, j) => { const s = m.sid && ctx.idx.get(m.sid);
      ws.set(r, 7, j + 1, cc); ws.set(r, 8, personName(m, ctx) + (m.nt ? ' (Trưởng nhóm)' : ''), Object.assign({}, cs, { font: { sz: 12, b: !!m.nt } }));
      ws.set(r, 9, s ? s.id : '', cc); ws.set(r, 10, s ? s.title + (PXI[p.px] && s.dept !== PXI[p.px].dept ? ' (' + s.dept + ')' : '') : ['Thuê ngoài', m.company, m.trade].filter(Boolean).join(' · '), cs); ws.set(r, 11, personPhone(m, ctx), cc); r++; });
    ws.merge(r0, 1, r - 1, 1, i + 1, cc); ws.merge(r0, 2, r - 1, 2, (PXI[p.px] || {}).short || p.px, cc);
    ws.merge(r0, 3, r - 1, 3, p.name + (p.note ? '\n(' + p.note + ')' : ''), Object.assign({}, cs, { font: { sz: 12, b: true } }));
    ws.merge(r0, 4, r - 1, 4, p.type, cc); ws.merge(r0, 5, r - 1, 5, p.site || '', cc);
    ws.merge(r0, 6, r - 1, 6, `${p.from ? dmy(p.from) : '…'} – ${p.to ? dmy(p.to) : '…'}`, cc);
  });
  if (!list.length) { ws.merge(r, 1, r, last, 'Chưa có công trình.', Object.assign({}, cs, { font: { sz: 12, i: true } })); r++; }
  r++; signBlock(ws, r, last - 3, last, { title: pxFilter ? 'QUẢN ĐỐC' : 'PHÒNG KỸ THUẬT - AN TOÀN', name: '' });
  ws.autoHeights(18, 16); return wb;
}

/* ===== Báo cáo trực lễ hằng ngày (Word): bản gửi TCT và bản nội bộ EPS ===== */
const PLANTS = [
  { k: 'pm1', n: 'Phú Mỹ 1', a: 'PM' }, { k: 'pm21', n: 'Phú Mỹ 2.1 & 2.1 mở rộng', a: 'PM' }, { k: 'pm22', n: 'Phú Mỹ 2.2', a: 'PM' },
  { k: 'pm3', n: 'Phú Mỹ 3', a: 'PM' }, { k: 'pm4', n: 'Phú Mỹ 4', a: 'PM' }, { k: 'vt2', n: 'Vĩnh Tân 2', a: 'VT' },
  { k: 'dmt', n: 'ĐMT Vĩnh Tân 2', a: 'VT', other: true }, { k: 'vt4', n: 'Vĩnh Tân 4 và Vĩnh Tân 4 MR', a: 'VT' }, { k: 'md1', n: 'Mông Dương 1', a: 'MD' }];
const PFIELDS = [['run', 'Tổ máy vận hành'], ['sb', 'Tổ máy dự phòng'], ['rep', 'Tổ máy sửa chữa'], ['fault', 'Thiết bị, vị trí sự cố'], ['st', 'Trạm điện'], ['sec', 'Bảo vệ an ninh'], ['at', 'ATVSLĐ/ ATGT/ TNGT'], ['pc', 'PCCN']];
const plantDef = k => ({ run: k === 'dmt' ? 'Bình thường' : '-', sb: '-', rep: '-', fault: 'Không', st: 'Bình thường', sec: 'Tốt', at: 'Bình thường', pc: 'Bình thường' });
const repOf = (u, date) => ((u && u.rep) || {})[date] || {};
/* Giá trị một nhà máy trong ngày: lấy bản sửa sau cùng của các PX cùng khu vực; chưa nhập thì lấy ngày trước đó */
function plantVal(units, H, date, k) {
  const pl = PLANTS.find(p => p.k === k); const ids = PX.filter(p => p.area === pl.a).map(p => p.id);
  const days = H.days.map(d => d.date).filter(d => d <= date).reverse();
  for (const d of days) { let best = null, by = null; ids.forEach(id => { const e = (repOf(units[id], d).plants || {})[k]; if (e && (!best || (e.ts || 0) > (best.ts || 0))) { best = e; by = id; } }); if (best) return { v: Object.assign(plantDef(k), best), from: d, by }; }
  return { v: plantDef(k), from: null, by: null };
}
const nextIso = s => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
function repCfg(units, H) { const c = ((units.lead || {}).repCfg) || {}; return { ref: c.ref || '', reporter: c.reporter || '', place: c.place || 'Phú Mỹ', title: c.title || H.name || '' }; }
/* Nhóm công tác theo mẫu nội bộ */
function repSections(units) {
  const S = []; const w = id => (u => u ? u.groups : PXI[id].groups)(units[id]);
  S.push({ h: 'PXSC Cơ - Nhiệt Phú Mỹ', src: [['cc-pm', null]] }, { h: 'PXSC Điện - Tự động Phú Mỹ', src: [['cd-pm', null]] });
  [0, 1].forEach(g => S.push({ h: `02 PXSC VT tại NMNĐ ${g ? 'VT4' : 'VT2'}`, src: [['cc-vt', g], ['cd-vt', g]] }));
  S.push({ h: 'PXSC Cơ - Nhiệt Mông Dương', src: [['cc-md', null]] }, { h: 'PXSC Điện - Tự động Mông Dương', src: [['cd-md', null]] }, { h: 'PX Gia công - Phục hồi', src: [['gc-ph', null]] });
  return S;
}

const DW = (() => {
  const x = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const run = (t, o = {}) => { const pr = `${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${o.u ? '<w:u w:val="single"/>' : ''}${o.sz ? `<w:sz w:val="${o.sz * 2}"/><w:szCs w:val="${o.sz * 2}"/>` : ''}`;
    return String(t == null ? '' : t).split('\n').map((l, i) => `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}${i ? '<w:br/>' : ''}<w:t xml:space="preserve">${x(l)}</w:t></w:r>`).join(''); };
  const runs = (c, o) => Array.isArray(c) ? c.map(r => typeof r === 'string' ? run(r, o) : run(r.t, Object.assign({}, o, r))).join('') : run(c, o);
  const P = (c, o = {}) => `<w:p><w:pPr>${o.keep ? '<w:keepNext/>' : ''}<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 60 : o.after}" w:line="${o.line || 264}" w:lineRule="auto"/>${o.ind ? `<w:ind w:left="${o.ind}"/>` : ''}${o.first ? `<w:ind w:firstLine="${o.first}"/>` : ''}<w:jc w:val="${o.al || 'both'}"/></w:pPr>${runs(c, o)}</w:p>`;
  const B = '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>';
  /* rows: [[cell, ...]], cell = chuỗi hoặc { t, b, i, al, span, fill, sz } ; o.head = số dòng tiêu đề lặp lại */
  function T(rows, widths, o = {}) {
    const tot = widths.reduce((a, b) => a + b, 0);
    const tr = (r, ri) => { let ci = 0; return `<w:tr>${ri < (o.head || 0) ? '<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' : '<w:trPr><w:cantSplit/></w:trPr>'}${r.map(c0 => { const c = typeof c0 === 'object' && c0 !== null && !Array.isArray(c0) ? c0 : { t: c0 }; const sp = c.span || 1;
      const w = widths.slice(ci, ci + sp).reduce((a, b) => a + b, 0); ci += sp;
      const paras = (Array.isArray(c.t) ? [c.t] : String(c.t == null ? '' : c.t).split('\n\n')).map(t => P(t, { al: c.al || o.al || 'left', b: c.b, i: c.i, sz: c.sz || o.sz, after: 0, line: 240 })).join('');
      return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${sp > 1 ? `<w:gridSpan w:val="${sp}"/>` : ''}${c.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${c.fill}"/>` : ''}<w:vAlign w:val="${c.va || 'center'}"/></w:tcPr>${paras}</w:tc>`; }).join('')}</w:tr>`; };
    return `<w:tbl><w:tblPr><w:tblW w:w="${tot}" w:type="dxa"/>${o.center ? '<w:jc w:val="center"/>' : ''}<w:tblBorders>${o.noBorder ? '' : B}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="70" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.map(tr).join('')}</w:tbl>`;
  }
  function doc(body, o = {}) {
    const W = o.landscape ? 16838 : 11906, Hh = o.landscape ? 11906 : 16838; const m = Object.assign({ t: 1000, b: 1000, l: 1418, r: 1134 }, o.m || {});
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/_rels/document.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'word/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>' },
      { name: 'word/document.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="${W}" w:h="${Hh}"${o.landscape ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${m.t}" w:right="${m.r}" w:bottom="${m.b}" w:left="${m.l}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>` }];
    return XW.zip(files);
  }
  return { P, T, doc, run };
})();

function buildRepDoc(kind, H, units, date, ctx) {
  const cfg = repCfg(units, H); const P = DW.P, T = DW.T; const nd = nextIso(date); const [y, m, d] = nd.split('-');
  const day = H.days.find(x => x.date === date) || {}; const from = day.ca1 === false ? '19h00' : '07h00';
  const USE = 14287; const pw = pc => { const s = pc.reduce((a, b) => a + b, 0); const w = pc.map(p => Math.round(p / s * USE)); w[w.length - 1] += USE - w.reduce((a, b) => a + b, 0); return w; };
  const hdr = (l, r) => T([[{ t: l, al: 'center' }, { t: r, al: 'center' }]], pw([42, 58]), { noBorder: true });
  const plantTable = list => T([[...['Stt', 'Nhà máy', ...PFIELDS.map(f => kind === 'tct' && f[0] === 'fault' ? 'Thiết bị sự cố' : f[1])].map(t => ({ t, b: true, al: 'center', fill: 'F2F2F2' }))],
    ...list.map((p, i) => { const v = plantVal(units, H, date, p.k).v; return [{ t: String(i + 1), al: 'center' }, { t: p.n, b: true }, ...PFIELDS.map(f => ({ t: v[f[0]] || '-', al: 'center' }))]; })], pw([4, 13, 12, 11, 11, 10, 10, 8, 11, 10]), { head: 1, sz: 12 });
  const ids = PX.map(p => p.id);
  const incs = ids.map(id => [PXI[id].name, (repOf(units[id], date).inc || '').trim()]).filter(x => x[1]);
  const atvs = ids.map(id => [PXI[id].name, (repOf(units[id], date).atv || '').trim()]).filter(x => x[1]);
  const lines = arr => arr.length ? arr.map(([n, t]) => P([{ t: `- ${n}: `, b: true }, t], { ind: 567 })).join('') : P('- Không có.', { ind: 567 });
  const dateLine = `${cfg.place}, ngày ${d} tháng ${m} năm ${y}`;
  let b = '';
  if (kind === 'tct') {
    b += hdr([{ t: 'TỔNG CÔNG TY PHÁT ĐIỆN 3\n', sz: 12 }, { t: 'CÔNG TY DỊCH VỤ SỬA CHỮA\nCÁC NHÀ MÁY ĐIỆN EVNGENCO3\n', b: true, sz: 12 }, { t: '\nSố: ………/BC-EPS', sz: 13 }],
      [{ t: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n', b: true, sz: 12 }, { t: 'Độc lập - Tự do - Hạnh phúc\n\n', b: true, sz: 13 }, { t: dateLine, i: true }]);
    b += P('BÁO CÁO', { al: 'center', b: true, sz: 14, before: 240, after: 0 }) + P('Về việc tình hình vận hành, bảo vệ an ninh, AT-VSLĐ, PCCN', { al: 'center', b: true, after: 0 }) + P(`trong thời gian nghỉ ${cfg.title}`, { al: 'center', b: true, after: 240 });
    b += P(`Thực hiện theo văn bản số ${cfg.ref || '……………'} về việc đảm bảo cung cấp điện trong thời gian nghỉ ${cfg.title}, Công ty Dịch vụ Sửa chữa các Nhà máy điện EVNGENCO3 (Công ty EPS) kính báo cáo Tổng Công ty Phát điện 3 tình hình thực hiện công tác vận hành, sự cố, bảo vệ an ninh, an toàn lao động, phòng chống cháy nổ trong thời gian nghỉ ${cfg.title} tại Công ty EPS ngày ${dmy(date)} như sau:`, { first: 567, after: 120 });
    const det = P('2. Chi tiết bất thường, sự cố: (chỉ nêu khi có bất thường, sự cố thiết bị, mất an ninh hay xảy ra vi phạm AT-VSLĐ, ATGT, TNGT, PCCN)', { i: true, ind: 284, before: 120 });
    b += P('I. Các đơn vị nhiệt điện', { b: true, keep: true }) + P('1. Tình hình chung', { b: true, i: true, ind: 284, keep: true }) + plantTable(PLANTS.filter(p => !p.other)) + det + lines(incs.concat(atvs));
    b += P('II. Các nhà máy điện khác', { b: true, keep: true, before: 120 }) + P('1. Tình hình chung', { b: true, i: true, ind: 284, keep: true }) + plantTable(PLANTS.filter(p => p.other)) + det + P('- Không có.', { ind: 567 });
    b += P('', { after: 120 }) + T([[{ t: [{ t: 'Nơi nhận:\n', b: true, i: true, sz: 12 }, { t: '- Ban AT, KT-SX/EVNGENCO3;\n- Ban GĐ/EPS;\n- Các PXSC;\n- Lưu: KT-AT.', sz: 11 }], va: 'top' }, { t: [{ t: 'PHÒNG KỸ THUẬT – AN TOÀN/EPS', b: true }], al: 'center', va: 'top' }]], pw([50, 50]), { noBorder: true });
    return DW.doc(b, { landscape: true, m: { t: 993, b: 851, l: 1418, r: 1134 } });
  }
  b += hdr([{ t: 'CÔNG TY DỊCH VỤ SỬA CHỮA\nCÁC NHÀ MÁY ĐIỆN EVNGENCO3\n', sz: 12 }, { t: 'CÁC ĐƠN VỊ', b: true, sz: 12 }],
    [{ t: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n', b: true, sz: 12 }, { t: 'Độc lập - Tự do - Hạnh phúc\n\n', b: true, sz: 13 }, { t: dateLine, i: true }]);
  b += P('BÁO CÁO', { al: 'center', b: true, sz: 14, before: 240, after: 0 }) + P('Về tình hình bảo vệ an toàn, AT-VSLĐ, PCCN, sửa chữa và vận hành', { al: 'center', b: true, after: 0 }) + P(`dịp nghỉ ${cfg.title}`, { al: 'center', b: true, after: 0 }) + P(`(Từ ${from} ngày ${dmy(date)} đến 07h00 ngày ${dmy(nd)})`, { al: 'center', i: true, after: 240 });
  b += P('1. Tình hình chung:', { b: true, keep: true }) + plantTable(PLANTS);
  b += P('2. Chi tiết bất thường, sự cố: (chỉ nêu khi có bất thường, sự cố thiết bị)', { b: true, before: 120 }) + lines(incs);
  b += P('3. Chi tiết AT-VSLĐ, PCCN, ATGT-TNGT (chỉ nêu khi xảy ra vi phạm AT-VSLĐ, ATGT, TNGT PCCN)', { b: true, before: 120 });
  const ok = atvs.length ? 'Xem ghi nhận bên dưới' : 'Đảm bảo';
  b += P('a. Tình hình AT-VSLĐ', { b: true, i: true, ind: 284 }) + P(`- Thiết bị: ${ok}`, { ind: 567 }) + P(`- Con người: ${ok}`, { ind: 567 }) + P(`- Biện pháp đã xử lý, giải quyết (nếu có): ${atvs.length ? '' : 'Không'}`, { ind: 567 }) + (atvs.length ? lines(atvs) : '');
  b += P('b. Tình hình PCCN', { b: true, i: true, ind: 284 }) + P('- Thiết bị: Đảm bảo', { ind: 567 }) + P('- Con người: Đảm bảo', { ind: 567 }) + P('- Biện pháp đã xử lý, giải quyết (nếu có): Không', { ind: 567 });
  b += P('c. Tình hình ATGT-TNGT', { b: true, i: true, ind: 284 }) + P('- Số vụ tai nạn giao thông xảy ra (nếu có): Không có', { ind: 567 });
  b += P('4. Các công tác trong ca trực:', { b: true, before: 120, keep: true });
  const rows = [['Stt', 'Nội dung công tác', 'Vị trí', 'Đang thực hiện', 'Hoàn thành', 'Ghi chú'].map(t => ({ t, b: true, al: 'center', fill: 'F2F2F2' }))];
  repSections(units).forEach(sec => {
    const items = []; sec.src.forEach(([id, g]) => (repOf(units[id], date).works || []).forEach(w => { if (!w.t) return; if (g != null && (w.g || 0) !== g) return; items.push(w); }));
    rows.push([{ t: sec.h, b: true, span: 6, fill: 'FAFAFA' }]);
    if (!items.length) rows.push([{ t: '', al: 'center' }, { t: 'Không có công tác phát sinh', i: true }, '', '', '', '']);
    items.forEach((w, i) => rows.push([{ t: String(i + 1), al: 'center' }, w.t, { t: w.loc || '', al: 'center' }, { t: w.st === 'run' ? 'X' : '', al: 'center' }, { t: w.st === 'run' ? '' : 'X', al: 'center' }, w.note || '']));
  });
  b += T(rows, pw([5, 46, 13, 9, 9, 18]), { head: 1, sz: 12 });
  b += P('', { after: 120 }) + T([[{ t: [{ t: 'Nơi nhận:\n', b: true, i: true, sz: 12 }, { t: '- Ban Lãnh đạo;\n- Các Phòng/ Phân xưởng;\n- Lưu: P.KT-AT.', sz: 11 }], va: 'top' }, { t: [{ t: 'Người báo cáo', b: true }], al: 'center', va: 'top' }]], pw([50, 50]), { noBorder: true });
  return DW.doc(b, { landscape: true, m: { t: 1440, b: 1134, l: 1440, r: 1440 } });
}

if (typeof module !== 'undefined') module.exports = { PLANTS, PFIELDS, plantVal, repOf, buildRepDoc, repSections, optGroup, otHours, shiftOt, fh, buildPRJ, prjOn, buildPX, outsideRows, PX, PXI, toStaff, defaultUnit, normUnit, dutyMap, otRows, checkUnit, buildDK01, buildDK02, buildDK03, buildDK06, buildOT, rkey, caList };
