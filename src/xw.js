/* ===== XW: bộ ghi file .xlsx tối giản, có định dạng (không cần thư viện ngoài) ===== */
const XW = (() => {
  const enc = new TextEncoder();
  const xesc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const colName = n => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const ref = (r, c) => colName(c) + r;
  let CRC; const crc32 = u8 => { if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const parts = [], central = []; let off = 0;
    files.forEach(f => {
      const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    const csize = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    const all = [...parts, ...central, new Uint8Array(e.buffer)]; const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0;
    all.forEach(a => { out.set(a, p); p += a.length; }); return out;
  }

  class Sheet {
    constructor(wb, name, o = {}) { this.wb = wb; this.name = name.slice(0, 31); this.cells = new Map(); this.merges = []; this.heights = {}; this.cols = o.cols || []; this.o = o; }
    set(r, c, v, st) { this.cells.set(r * 1000 + c, { r, c, v, s: this.wb.style(st || {}) }); return this; }
    get(r, c) { return this.cells.get(r * 1000 + c); }
    /* Ô gộp: ghi giá trị vào ô đầu, kẻ viền/định dạng cho mọi ô của vùng */
    merge(r1, c1, r2, c2, v, st) {
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) this.set(r, c, r === r1 && c === c1 ? v : null, st);
      if (r2 > r1 || c2 > c1) this.merges.push([r1, c1, r2, c2]); return this;
    }
    height(r, h) { this.heights[r] = h; return this; }
    /* Ước lượng chiều cao dòng theo số dòng chữ khi xuống dòng tự động */
    autoHeights(min = 18, lineH = 17) {
      const rows = new Map();
      const span = new Map(); this.merges.forEach(([r1, c1, r2, c2]) => span.set(r1 * 1000 + c1, [r2 - r1 + 1, c1, c2]));
      this.cells.forEach(cell => {
        if (cell.v == null || cell.v === '') return; if (this.heights[cell.r]) return;
        const sp = span.get(cell.r * 1000 + cell.c); if (sp && sp[0] > 1) return;
        let w = 0; for (let c = sp ? sp[1] : cell.c; c <= (sp ? sp[2] : cell.c); c++) w += this.cols[c - 1] || 9;
        const st = this.wb.styles[cell.s]; const sz = (st && st.font && st.font.sz) || 13; const per = Math.max(4, w * 1.15 * 11 / sz);
        const lines = String(cell.v).split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / per)), 0);
        const h = Math.max(min, lines * lineH * sz / 13 + 4);
        rows.set(cell.r, Math.max(rows.get(cell.r) || 0, h));
      });
      rows.forEach((h, r) => { if (!this.heights[r]) this.heights[r] = Math.min(409, Math.round(h)); });
    }
    xml() {
      const byRow = new Map(); [...this.cells.values()].forEach(c => { if (!byRow.has(c.r)) byRow.set(c.r, []); byRow.get(c.r).push(c); });
      Object.keys(this.heights).forEach(r => { if (!byRow.has(+r)) byRow.set(+r, []); });
      const rows = [...byRow.keys()].sort((a, b) => a - b).map(r => {
        const cs = byRow.get(r).sort((a, b) => a.c - b.c).map(c => {
          if (c.v == null || c.v === '') return `<c r="${ref(c.r, c.c)}" s="${c.s}"/>`;
          if (typeof c.v === 'number' && isFinite(c.v)) return `<c r="${ref(c.r, c.c)}" s="${c.s}"><v>${c.v}</v></c>`;
          return `<c r="${ref(c.r, c.c)}" s="${c.s}" t="inlineStr"><is><t xml:space="preserve">${xesc(c.v)}</t></is></c>`;
        }).join('');
        const h = this.heights[r]; return `<row r="${r}"${h ? ` ht="${h}" customHeight="1"` : ''}>${cs}</row>`;
      }).join('');
      const cols = this.cols.length ? `<cols>${this.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
      const merges = this.merges.length ? `<mergeCells count="${this.merges.length}">${this.merges.map(([a, b, c, d]) => `<mergeCell ref="${ref(a, b)}:${ref(c, d)}"/>`).join('')}</mergeCells>` : '';
      const o = this.o;
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"${o.zoom ? ` zoomScale="${o.zoom}"` : ''}/></sheetViews>
<sheetFormatPr defaultRowHeight="16.5"/>${cols}<sheetData>${rows}</sheetData>${merges}
<printOptions horizontalCentered="1"/><pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="${o.paper || 9}" orientation="${o.landscape ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/></worksheet>`;
    }
  }

  class Book {
    constructor() { this.sheets = []; this.styles = [{}]; this.keys = new Map([['{}', 0]]); }
    sheet(name, o) { const s = new Sheet(this, name, o); this.sheets.push(s); return s; }
    style(st) { const k = JSON.stringify(st); if (this.keys.has(k)) return this.keys.get(k); const i = this.styles.length; this.styles.push(st); this.keys.set(k, i); return i; }
    stylesXml() {
      const fonts = [], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'], borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
      const fi = new Map(), fl = new Map(), bo = new Map();
      const font = f => { f = Object.assign({ name: 'Times New Roman', sz: 13 }, f || {}); const x = `<font>${f.b ? '<b/>' : ''}${f.i ? '<i/>' : ''}${f.u ? '<u/>' : ''}<sz val="${f.sz}"/><color rgb="FF${f.color || '000000'}"/><name val="${xesc(f.name)}"/><family val="1"/></font>`;
        if (!fi.has(x)) { fi.set(x, fonts.length); fonts.push(x); } return fi.get(x); };
      const fill = c => { if (!c) return 0; const x = `<fill><patternFill patternType="solid"><fgColor rgb="FF${c}"/><bgColor indexed="64"/></patternFill></fill>`; if (!fl.has(x)) { fl.set(x, fills.length); fills.push(x); } return fl.get(x); };
      const border = b => { if (!b) return 0; const o = typeof b === 'string' ? { l: b, r: b, t: b, b } : b;
        const e = (tag, s) => s ? `<${tag} style="${s}"><color indexed="64"/></${tag}>` : `<${tag}/>`;
        const x = `<border>${e('left', o.l)}${e('right', o.r)}${e('top', o.t)}${e('bottom', o.b)}<diagonal/></border>`; if (!bo.has(x)) { bo.set(x, borders.length); borders.push(x); } return bo.get(x); };
      font({});
      const xfs = this.styles.map(st => {
        const f = font(st.font), l = fill(st.fill), b = border(st.border);
        const al = (st.h || st.v || st.wrap) ? `<alignment${st.h ? ` horizontal="${st.h}"` : ''} vertical="${st.v || 'top'}"${st.wrap ? ' wrapText="1"' : ''}/>` : '<alignment vertical="top"/>';
        return `<xf numFmtId="0" fontId="${f}" fillId="${l}" borderId="${b}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${al}</xf>`;
      });
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="${borders.length}">${borders.join('')}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    }
    build() {
      const sh = this.sheets;
      const files = [
        { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sh.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
        { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
        { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sh.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
        { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sh.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sh.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
        { name: 'xl/styles.xml', data: this.stylesXml() },
        ...sh.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: s.xml() }))
      ];
      return zip(files);
    }
  }
  return { Book };
})();
if (typeof module !== 'undefined') module.exports = { XW };
