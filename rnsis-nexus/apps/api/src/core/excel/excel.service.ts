import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

export type ColumnKind = 'text' | 'money' | 'number' | 'date' | 'datetime' | 'percent';

export interface ReportColumn {
  key: string;
  header: string;
  kind?: ColumnKind;
  width?: number;
}

export interface ReportTable {
  title: string;
  subtitle?: string;
  filters?: [string, string][];
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
}

/** Indian grouping (₹1,00,000.00) as an Excel number format. Values are rupees, not paise. */
export const INR_FORMAT = '[>=10000000]"₹"##\\,##\\,##\\,##0.00;[>=100000]"₹"##\\,##\\,##0.00;"₹"#,##0.00';

@Injectable()
export class ExcelService {
  async fromTable(table: ReportTable, schoolName: string): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'RNSIS Nexus';
    wb.created = new Date();
    const ws = wb.addWorksheet(table.title.slice(0, 31).replace(/[\\/*?:[\]]/g, ' '), { views: [{ state: 'frozen', ySplit: 0 }] });
    const ncol = table.columns.length;

    ws.mergeCells(1, 1, 1, ncol);
    ws.getCell(1, 1).value = schoolName;
    ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
    ws.mergeCells(2, 1, 2, ncol);
    ws.getCell(2, 1).value = table.title + (table.subtitle ? ` — ${table.subtitle}` : '');
    ws.getCell(2, 1).font = { bold: true, size: 12 };
    let r = 3;
    for (const [k, v] of table.filters ?? []) {
      ws.getCell(r, 1).value = k;
      ws.getCell(r, 1).font = { color: { argb: 'FF6B7280' } };
      ws.getCell(r, 2).value = v;
      r++;
    }
    r++;
    const headerRow = ws.getRow(r);
    table.columns.forEach((c, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = c.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { vertical: 'middle', horizontal: c.kind === 'money' || c.kind === 'number' ? 'right' : 'left' };
      ws.getColumn(i + 1).width = c.width ?? (c.kind === 'money' ? 16 : c.kind === 'date' ? 13 : Math.max(12, c.header.length + 4));
    });
    ws.views = [{ state: 'frozen', ySplit: r }];
    ws.autoFilter = { from: { row: r, column: 1 }, to: { row: r, column: ncol } };

    const put = (row: ExcelJS.Row, data: Record<string, unknown>, bold = false) => {
      table.columns.forEach((c, i) => {
        const cell = row.getCell(i + 1);
        const v = data[c.key];
        if (v === undefined || v === null || v === '') {
          cell.value = null;
        } else if (c.kind === 'money') {
          cell.value = Number(v) / 100;
          cell.numFmt = INR_FORMAT;
        } else if (c.kind === 'number') {
          cell.value = Number(v);
        } else if (c.kind === 'percent') {
          cell.value = Number(v) / 100;
          cell.numFmt = '0.0%';
        } else if (c.kind === 'date' || c.kind === 'datetime') {
          const d = v instanceof Date ? v : new Date(String(v));
          cell.value = Number.isNaN(d.getTime()) ? String(v) : d;
          cell.numFmt = c.kind === 'date' ? 'dd-mmm-yyyy' : 'dd-mmm-yyyy hh:mm';
        } else {
          cell.value = String(v);
        }
        if (bold) cell.font = { bold: true };
      });
    };

    for (const row of table.rows) put(ws.getRow(++r), row);
    if (table.totals) {
      const tr = ws.getRow(++r);
      put(tr, table.totals, true);
      tr.eachCell((c) => (c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF3FB' } }));
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  /** Blank import template with header row, an example row and a notes sheet. */
  async template(name: string, columns: { header: string; example?: string; note?: string; required?: boolean }[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(name.slice(0, 31));
    ws.addRow(columns.map((c) => c.header));
    ws.getRow(1).eachCell((cell, i) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: columns[i - 1].required ? 'FF1E3A8A' : 'FF64748B' } };
    });
    ws.addRow(columns.map((c) => c.example ?? ''));
    columns.forEach((c, i) => (ws.getColumn(i + 1).width = Math.max(14, c.header.length + 4)));
    const notes = wb.addWorksheet('Instructions');
    notes.addRow(['Column', 'Required', 'Notes']);
    notes.getRow(1).font = { bold: true };
    for (const c of columns) notes.addRow([c.header, c.required ? 'Yes' : 'No', c.note ?? '']);
    notes.getColumn(1).width = 28;
    notes.getColumn(3).width = 80;
    notes.addRow([]);
    notes.addRow(['Delete the example row before uploading. Dates: YYYY-MM-DD or DD-MM-YYYY. Amounts in rupees.']);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  /** Read the first worksheet as objects keyed by (trimmed) header text. */
  async readRows(buffer: Buffer, mime?: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    const wb = new ExcelJS.Workbook();
    try {
      if (mime?.includes('csv')) {
        const { Readable } = await import('stream');
        await wb.csv.read(Readable.from(buffer));
      } else {
        await wb.xlsx.load(buffer as any);
      }
    } catch {
      throw new BadRequestException('Could not read the file. Upload an .xlsx (or .csv) file based on the template.');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('The workbook has no sheets.');
    const headers: string[] = [];
    ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => (headers[col - 1] = cellText(cell.value).trim()));
    const rows: Record<string, string>[] = [];
    ws.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx === 1) return;
      const obj: Record<string, string> = {};
      let any = false;
      headers.forEach((h, i) => {
        const v = cellText(row.getCell(i + 1).value).trim();
        if (v) any = true;
        if (h) obj[h] = v;
      });
      if (any) rows.push({ __row: String(idx), ...obj });
    });
    return { headers, rows };
  }
}

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if ('text' in v && typeof (v as any).text === 'string') return (v as any).text;
    if ('result' in v) return cellText((v as any).result);
    if ('richText' in v) return (v as any).richText.map((t: any) => t.text).join('');
    if ('hyperlink' in v) return String((v as any).text ?? (v as any).hyperlink);
  }
  return String(v);
}
