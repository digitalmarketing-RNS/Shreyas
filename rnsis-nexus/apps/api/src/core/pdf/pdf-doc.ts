import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFFont, PDFImage, PDFPage, RGB, degrees, rgb } from 'pdf-lib';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

export interface PdfBranding {
  name: string;
  shortName?: string | null;
  tagline?: string | null;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  affiliationNo?: string | null;
  primaryColor: string;
  secondaryColor: string;
  logo?: Buffer | null;
}

export type PageSizeName = 'A4' | 'A4_LANDSCAPE' | 'A5' | 'THERMAL';

const SIZES: Record<PageSizeName, [number, number]> = {
  A4: [595.28, 841.89],
  A4_LANDSCAPE: [841.89, 595.28],
  A5: [419.53, 595.28],
  // 80mm roll: drawn on a tall page then cropped to the used height on save.
  THERMAL: [226.77, 2000],
};

type FontName = 'regular' | 'semibold' | 'bold';

export interface TextOpts {
  size?: number;
  font?: FontName;
  color?: RGB;
  align?: 'left' | 'center' | 'right';
  x?: number;
  width?: number;
  lineGap?: number;
  advance?: boolean;
}

export interface TableColumn {
  header: string;
  /** Relative width; columns are scaled to the content width. */
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableOpts {
  fontSize?: number;
  zebra?: boolean;
  headerFill?: RGB;
  headerColor?: RGB;
  footerRows?: string[][];
  boldRows?: number[];
  padding?: number;
  borderColor?: RGB;
}

let fontCache: { regular: Uint8Array; semibold: Uint8Array; bold: Uint8Array } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const candidates = [path.resolve(__dirname, '../../../assets/fonts'), path.resolve(process.cwd(), 'assets/fonts'), path.resolve(process.cwd(), 'apps/api/assets/fonts')];
  for (const dir of candidates) {
    try {
      fontCache = {
        regular: await fs.readFile(path.join(dir, 'NotoSans-Regular.ttf')),
        semibold: await fs.readFile(path.join(dir, 'NotoSans-SemiBold.ttf')),
        bold: await fs.readFile(path.join(dir, 'NotoSans-Bold.ttf')),
      };
      return fontCache;
    } catch {
      /* try next */
    }
  }
  throw new Error('PDF fonts not found (expected apps/api/assets/fonts/NotoSans-*.ttf)');
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  const n = parseInt(full.slice(0, 6), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export const COLORS = {
  text: rgb(0.11, 0.12, 0.15),
  muted: rgb(0.42, 0.45, 0.5),
  border: rgb(0.86, 0.88, 0.91),
  zebra: rgb(0.97, 0.975, 0.98),
  white: rgb(1, 1, 1),
  green: rgb(0.09, 0.55, 0.3),
  red: rgb(0.78, 0.16, 0.16),
  amber: rgb(0.8, 0.5, 0.05),
};

/**
 * Small flow-layout engine on top of pdf-lib: a cursor moves down the page, text wraps,
 * tables repeat their header on page breaks and every page gets the branded footer.
 */
export class PdfDoc {
  readonly pdf: PDFDocument;
  readonly fonts: Record<FontName, PDFFont>;
  readonly branding: PdfBranding;
  readonly primary: RGB;
  readonly secondary: RGB;
  page!: PDFPage;
  y = 0;
  readonly margin: number;
  readonly sizeName: PageSizeName;
  private logoImage?: PDFImage | null;
  private footerText?: string;

  private constructor(pdf: PDFDocument, fonts: Record<FontName, PDFFont>, branding: PdfBranding, sizeName: PageSizeName, margin: number) {
    this.pdf = pdf;
    this.fonts = fonts;
    this.branding = branding;
    this.primary = hexToRgb(branding.primaryColor || '#1e3a8a');
    this.secondary = hexToRgb(branding.secondaryColor || '#f59e0b');
    this.sizeName = sizeName;
    this.margin = margin;
  }

  static async create(opts: { branding: PdfBranding; size?: PageSizeName; margin?: number; title?: string; addPage?: boolean }): Promise<PdfDoc> {
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const raw = await loadFonts();
    const fonts = {
      regular: await pdf.embedFont(raw.regular, { subset: true }),
      semibold: await pdf.embedFont(raw.semibold, { subset: true }),
      bold: await pdf.embedFont(raw.bold, { subset: true }),
    };
    const size = opts.size ?? 'A4';
    const doc = new PdfDoc(pdf, fonts, opts.branding, size, opts.margin ?? (size === 'THERMAL' ? 12 : 40));
    pdf.setTitle(opts.title ?? opts.branding.name);
    pdf.setAuthor(opts.branding.name);
    pdf.setCreator('RNSIS Nexus');
    pdf.setProducer('RNSIS Nexus');
    if (opts.branding.logo) {
      try {
        doc.logoImage = await (isPng(opts.branding.logo) ? pdf.embedPng(opts.branding.logo) : pdf.embedJpg(opts.branding.logo));
      } catch {
        doc.logoImage = null;
      }
    }
    if (opts.addPage !== false) doc.addPage();
    return doc;
  }

  get width() {
    return this.page.getWidth();
  }
  get height() {
    return this.page.getHeight();
  }
  get contentWidth() {
    return this.width - this.margin * 2;
  }
  get left() {
    return this.margin;
  }
  get right() {
    return this.width - this.margin;
  }

  addPage(size?: [number, number]) {
    this.page = this.pdf.addPage(size ?? SIZES[this.sizeName]);
    this.y = this.page.getHeight() - this.margin;
    return this.page;
  }

  ensureSpace(h: number) {
    if (this.sizeName === 'THERMAL') return;
    if (this.y - h < this.margin + 28) this.addPage();
  }

  space(h = 8) {
    this.y -= h;
  }

  setFooter(text: string) {
    this.footerText = text;
  }

  measure(text: string, size = 10, font: FontName = 'regular') {
    return this.fonts[font].widthOfTextAtSize(sanitize(text), size);
  }

  wrap(text: string, width: number, size = 10, font: FontName = 'regular'): string[] {
    const f = this.fonts[font];
    const lines: string[] = [];
    for (const para of sanitize(text).split('\n')) {
      const words = para.split(/\s+/).filter((w) => w.length);
      if (!words.length) {
        lines.push('');
        continue;
      }
      let line = '';
      for (let word of words) {
        // hard-split words longer than the line
        while (f.widthOfTextAtSize(word, size) > width) {
          let cut = word.length;
          while (cut > 1 && f.widthOfTextAtSize(word.slice(0, cut), size) > width) cut--;
          if (line) {
            lines.push(line);
            line = '';
          }
          lines.push(word.slice(0, cut));
          word = word.slice(cut);
        }
        const candidate = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(candidate, size) <= width) line = candidate;
        else {
          if (line) lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  /** Draw wrapped text at the cursor; returns height used. */
  text(text: string, opts: TextOpts = {}): number {
    const size = opts.size ?? 10;
    const font = opts.font ?? 'regular';
    const x0 = opts.x ?? this.left;
    const width = opts.width ?? this.right - x0;
    const lineH = size * 1.25 + (opts.lineGap ?? 1.5);
    const lines = this.wrap(text, width, size, font);
    let y = this.y;
    for (const line of lines) {
      if (opts.advance !== false && y - lineH < this.margin + 20 && this.sizeName !== 'THERMAL') {
        this.addPage();
        y = this.y;
      }
      const w = this.fonts[font].widthOfTextAtSize(line, size);
      const x = opts.align === 'center' ? x0 + (width - w) / 2 : opts.align === 'right' ? x0 + width - w : x0;
      this.page.drawText(line, { x, y: y - size, size, font: this.fonts[font], color: opts.color ?? COLORS.text });
      y -= lineH;
    }
    const used = this.y - y;
    if (opts.advance !== false) this.y = y;
    return used;
  }

  /** Single line of text at an absolute position (no wrapping, no cursor move). */
  at(text: string, x: number, y: number, opts: { size?: number; font?: FontName; color?: RGB; align?: 'left' | 'center' | 'right'; maxWidth?: number } = {}) {
    const size = opts.size ?? 10;
    const f = this.fonts[opts.font ?? 'regular'];
    let t = sanitize(text);
    if (opts.maxWidth) while (t.length > 1 && f.widthOfTextAtSize(t, size) > opts.maxWidth) t = t.slice(0, -2) + '…';
    const w = f.widthOfTextAtSize(t, size);
    const dx = opts.align === 'center' ? -w / 2 : opts.align === 'right' ? -w : 0;
    this.page.drawText(t, { x: x + dx, y, size, font: f, color: opts.color ?? COLORS.text });
  }

  hr(color: RGB = COLORS.border, thickness = 0.8, gap = 8) {
    this.y -= gap / 2;
    this.page.drawLine({ start: { x: this.left, y: this.y }, end: { x: this.right, y: this.y }, thickness, color });
    this.y -= gap / 2;
  }

  rect(x: number, y: number, w: number, h: number, fill?: RGB, border?: RGB, borderWidth = 0.8) {
    this.page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: border, borderWidth: border ? borderWidth : 0 });
  }

  /** School letterhead: logo/monogram, name, affiliation, address, contact, brand rule. */
  letterhead(opts: { compact?: boolean; rightTitle?: string; rightSubtitle?: string } = {}) {
    const b = this.branding;
    const thermal = this.sizeName === 'THERMAL';
    if (thermal) {
      this.text(b.name, { size: 11, font: 'bold', align: 'center' });
      this.text(b.address, { size: 7, align: 'center', color: COLORS.muted });
      if (b.phone) this.text(`Ph: ${b.phone}`, { size: 7, align: 'center', color: COLORS.muted });
      this.hr(COLORS.text, 0.6, 8);
      return;
    }
    const logoSize = opts.compact ? 40 : 54;
    const top = this.y;
    this.page.drawRectangle({ x: 0, y: this.height - 6, width: this.width, height: 6, color: this.primary });
    this.page.drawRectangle({ x: 0, y: this.height - 8, width: this.width, height: 2, color: this.secondary });
    this.drawLogo(this.left, top - logoSize, logoSize);
    const tx = this.left + logoSize + 12;
    this.at(b.name, tx, top - 18, { size: opts.compact ? 14 : 17, font: 'bold', color: this.primary, maxWidth: this.right - tx - 150 });
    const sub = [b.affiliationNo ? `CBSE Affiliation No. ${b.affiliationNo}` : null, b.tagline].filter(Boolean).join('  ·  ');
    if (sub) this.at(sub, tx, top - 31, { size: 8, color: COLORS.muted, maxWidth: this.right - tx - 150 });
    this.at(b.address, tx, top - 42, { size: 8, color: COLORS.muted, maxWidth: this.right - tx - 150 });
    const contact = [b.phone, b.email, b.website].filter(Boolean).join('  ·  ');
    if (contact) this.at(contact, tx, top - 53, { size: 8, color: COLORS.muted, maxWidth: this.right - tx - 150 });
    if (opts.rightTitle) {
      this.at(opts.rightTitle, this.right, top - 18, { size: 14, font: 'bold', color: COLORS.text, align: 'right' });
      if (opts.rightSubtitle) this.at(opts.rightSubtitle, this.right, top - 32, { size: 9, color: COLORS.muted, align: 'right' });
    }
    this.y = top - logoSize - 10;
    this.page.drawLine({ start: { x: this.left, y: this.y }, end: { x: this.right, y: this.y }, thickness: 1.2, color: this.primary });
    this.y -= 14;
  }

  drawLogo(x: number, y: number, size: number) {
    if (this.logoImage) {
      const dims = this.logoImage.scaleToFit(size, size);
      this.page.drawImage(this.logoImage, { x: x + (size - dims.width) / 2, y: y + (size - dims.height) / 2, width: dims.width, height: dims.height });
      return;
    }
    // Monogram crest fallback
    this.page.drawCircle({ x: x + size / 2, y: y + size / 2, size: size / 2, color: this.primary });
    this.page.drawCircle({ x: x + size / 2, y: y + size / 2, size: size / 2 - 3, borderColor: this.secondary, borderWidth: 1.5 });
    const initials = (this.branding.shortName || this.branding.name)
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    const fs = size * (initials.length > 3 ? 0.22 : 0.3);
    const w = this.fonts.bold.widthOfTextAtSize(initials, fs);
    this.page.drawText(initials, { x: x + (size - w) / 2, y: y + size / 2 - fs / 2.8, size: fs, font: this.fonts.bold, color: COLORS.white });
  }

  title(text: string, subtitle?: string) {
    this.ensureSpace(40);
    this.text(text, { size: this.sizeName === 'THERMAL' ? 10 : 15, font: 'bold', align: 'center', color: this.sizeName === 'THERMAL' ? COLORS.text : this.primary });
    if (subtitle) this.text(subtitle, { size: this.sizeName === 'THERMAL' ? 7.5 : 9, align: 'center', color: COLORS.muted });
    this.space(this.sizeName === 'THERMAL' ? 4 : 8);
  }

  sectionHeading(text: string) {
    this.ensureSpace(30);
    this.space(4);
    this.text(text.toUpperCase(), { size: 8.5, font: 'bold', color: this.primary });
    this.page.drawLine({ start: { x: this.left, y: this.y + 2 }, end: { x: this.left + 40, y: this.y + 2 }, thickness: 1.5, color: this.secondary });
    this.space(6);
  }

  /** Label/value grid (e.g. student details) in N columns. */
  keyValues(pairs: [string, string | null | undefined][], opts: { cols?: number; size?: number; labelWidth?: number } = {}) {
    const cols = opts.cols ?? 2;
    const size = opts.size ?? (this.sizeName === 'THERMAL' ? 7.5 : 9);
    const colW = this.contentWidth / cols;
    const labelW = opts.labelWidth ?? Math.min(colW * 0.42, 110);
    const rowH = size * 1.55;
    for (let i = 0; i < pairs.length; i += cols) {
      const row = pairs.slice(i, i + cols);
      // compute height (values may wrap)
      const heights = row.map(([, v]) => this.wrap(v ?? '—', colW - labelW - 6, size, 'semibold').length);
      const lines = Math.max(1, ...heights);
      this.ensureSpace(rowH * lines + 2);
      row.forEach(([k, v], c) => {
        const x = this.left + c * colW;
        this.at(k, x, this.y - size, { size, color: COLORS.muted, maxWidth: labelW - 4 });
        const vLines = this.wrap(v ?? '—', colW - labelW - 6, size, 'semibold');
        vLines.forEach((ln, li) => this.at(ln, x + labelW, this.y - size - li * rowH, { size, font: 'semibold' }));
      });
      this.y -= rowH * lines;
    }
    this.space(4);
  }

  table(columns: TableColumn[], rows: string[][], opts: TableOpts = {}) {
    const size = opts.fontSize ?? (this.sizeName === 'THERMAL' ? 7.5 : 8.5);
    const pad = opts.padding ?? (this.sizeName === 'THERMAL' ? 2.5 : 5);
    const totalW = columns.reduce((a, c) => a + c.width, 0);
    const widths = columns.map((c) => (c.width / totalW) * this.contentWidth);
    const lineH = size * 1.3;
    const border = opts.borderColor ?? COLORS.border;
    const thermal = this.sizeName === 'THERMAL';

    const drawRow = (cells: string[], style: { bold?: boolean; fill?: RGB; color?: RGB; header?: boolean }) => {
      const wrapped = cells.map((c, i) => this.wrap(c ?? '', widths[i] - pad * 2, size, style.bold || style.header ? 'semibold' : 'regular'));
      const h = Math.max(...wrapped.map((w) => w.length)) * lineH + pad * 2 - 2;
      if (!thermal && this.y - h < this.margin + 28) {
        this.addPage();
        if (!style.header) drawHeader();
      }
      if (style.fill) this.rect(this.left, this.y - h, this.contentWidth, h, style.fill);
      let x = this.left;
      wrapped.forEach((lines, i) => {
        const col = columns[i];
        lines.forEach((ln, li) => {
          const font = style.bold || style.header ? this.fonts.semibold : this.fonts.regular;
          const w = font.widthOfTextAtSize(ln, size);
          const tx = col.align === 'right' ? x + widths[i] - pad - w : col.align === 'center' ? x + (widths[i] - w) / 2 : x + pad;
          this.page.drawText(ln, { x: tx, y: this.y - pad - size + 1 - li * lineH, size, font, color: style.color ?? COLORS.text });
        });
        x += widths[i];
      });
      this.y -= h;
      if (!style.header) this.page.drawLine({ start: { x: this.left, y: this.y }, end: { x: this.right, y: this.y }, thickness: 0.5, color: border });
    };

    const drawHeader = () =>
      drawRow(
        columns.map((c) => c.header),
        thermal ? { header: true } : { header: true, fill: opts.headerFill ?? this.primary, color: opts.headerColor ?? COLORS.white },
      );

    drawHeader();
    if (thermal) this.page.drawLine({ start: { x: this.left, y: this.y }, end: { x: this.right, y: this.y }, thickness: 0.6, color: COLORS.text });
    rows.forEach((r, i) => drawRow(r, { bold: opts.boldRows?.includes(i), fill: opts.zebra !== false && !thermal && i % 2 === 1 ? COLORS.zebra : undefined }));
    for (const f of opts.footerRows ?? []) drawRow(f, { bold: true, fill: thermal ? undefined : rgb(0.93, 0.95, 0.99) });
    this.space(6);
  }

  /** Right-aligned totals block (Subtotal / Discount / Total / Paid / Balance). */
  totals(rows: { label: string; value: string; bold?: boolean; color?: RGB }[], width = 230) {
    const thermal = this.sizeName === 'THERMAL';
    const w = thermal ? this.contentWidth : width;
    const x = this.right - w;
    const size = thermal ? 8 : 9.5;
    this.ensureSpace(rows.length * size * 1.7 + 10);
    for (const r of rows) {
      if (r.bold) this.rect(x, this.y - size * 1.7 + 2, w, size * 1.7, thermal ? undefined : rgb(0.94, 0.96, 1));
      this.at(r.label, x + 6, this.y - size - 1, { size, font: r.bold ? 'bold' : 'regular', color: r.color ?? COLORS.text });
      this.at(r.value, this.right - 6, this.y - size - 1, { size, font: r.bold ? 'bold' : 'semibold', align: 'right', color: r.color ?? COLORS.text });
      this.y -= size * 1.7;
    }
    this.space(6);
  }

  async qr(data: string, x: number, y: number, size: number) {
    const png = await QRCode.toBuffer(data, { margin: 0, width: Math.round(size * 4), errorCorrectionLevel: 'M' });
    const img = await this.pdf.embedPng(png);
    this.page.drawImage(img, { x, y, width: size, height: size });
  }

  async image(bytes: Buffer, x: number, y: number, w: number, h: number) {
    try {
      const img = isPng(bytes) ? await this.pdf.embedPng(bytes) : await this.pdf.embedJpg(bytes);
      const dims = img.scaleToFit(w, h);
      this.page.drawImage(img, { x: x + (w - dims.width) / 2, y: y + (h - dims.height) / 2, width: dims.width, height: dims.height });
      return true;
    } catch {
      return false;
    }
  }

  /** Diagonal stamp (PAID / CANCELLED / DRAFT). */
  stamp(text: string, color: RGB) {
    const size = this.sizeName === 'THERMAL' ? 26 : 64;
    const w = this.fonts.bold.widthOfTextAtSize(text, size);
    this.page.drawText(text, {
      x: this.width / 2 - (w / 2) * Math.cos(Math.PI / 6),
      y: this.height / 2 - (w / 2) * Math.sin(Math.PI / 6),
      size,
      font: this.fonts.bold,
      color,
      opacity: 0.12,
      rotate: degrees(30),
    });
  }

  signatures(labels: string[]) {
    this.ensureSpace(60);
    this.space(34);
    const colW = this.contentWidth / labels.length;
    labels.forEach((l, i) => {
      const cx = this.left + colW * i + colW / 2;
      this.page.drawLine({ start: { x: cx - colW * 0.35, y: this.y }, end: { x: cx + colW * 0.35, y: this.y }, thickness: 0.7, color: COLORS.muted });
      this.at(l, cx, this.y - 11, { size: 8.5, color: COLORS.muted, align: 'center' });
    });
    this.y -= 20;
  }

  async save(): Promise<Buffer> {
    const pages = this.pdf.getPages();
    if (this.sizeName === 'THERMAL') {
      const used = this.page.getHeight() - this.y + this.margin;
      const h = this.page.getHeight();
      this.page.setMediaBox(0, h - used, this.page.getWidth(), used);
      this.page.setCropBox(0, h - used, this.page.getWidth(), used);
    } else {
      pages.forEach((p, i) => {
        const size = 7.5;
        const footer = this.footerText ?? `${this.branding.name} · Generated by RNSIS Nexus`;
        p.drawLine({ start: { x: this.margin, y: 30 }, end: { x: p.getWidth() - this.margin, y: 30 }, thickness: 0.5, color: COLORS.border });
        const f = this.fonts.regular;
        let t = sanitize(footer);
        while (t.length > 1 && f.widthOfTextAtSize(t, size) > p.getWidth() - this.margin * 2 - 70) t = t.slice(0, -2) + '…';
        p.drawText(t, { x: this.margin, y: 19, size, font: f, color: COLORS.muted });
        const pn = `Page ${i + 1} of ${pages.length}`;
        p.drawText(pn, { x: p.getWidth() - this.margin - f.widthOfTextAtSize(pn, size), y: 19, size, font: f, color: COLORS.muted });
      });
    }
    return Buffer.from(await this.pdf.save());
  }
}

function isPng(b: Buffer) {
  return b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
}

/** Replace characters the embedded font cannot render (keeps ₹ and common punctuation). */
function sanitize(s: string): string {
  return String(s ?? '')
    .replace(/\t/g, '    ')
    .replace(/\r/g, '')
    .replace(/[​-‍﻿]/g, '')
    .replace(/[^\n -ɏ‐-‧‰-⁞₹™←-⇿✓✔•]/g, '?');
}
