import apiClient from "@/lib/api/client";
import { expenseCategory, expenseTotal, invoiceFiles, invoiceNarration } from "@/lib/expense";
import { formatDate, toAmount } from "@/lib/format";
import type { MasterExpense } from "@/types/expense";
import type { Workbook, Worksheet } from "exceljs";

/**
 * Excel export of selected expenses: one row per bill line with every detail,
 * plus a Receipts sheet with each attachment embedded (images) and a link to
 * open it (images and PDFs).
 *
 * Receipts live in a private bucket, so each one is signed via /storage/sign.
 * Signed links can live at most 7 days (the backend's cap) — the workbook says
 * so on its Info sheet. Images are embedded so they never expire; PDFs can't be
 * embedded in .xlsx, so they're link-only.
 */

const LINK_TTL_SECONDS = 60 * 60 * 24 * 7;
const CONCURRENCY = 4;
/** Embedded images are re-encoded to this size so 50 phone photos don't make a 200 MB file. */
const MAX_IMAGE_PX = 1200;
const THUMB = { w: 90, h: 70 };
const PREVIEW = { w: 320, h: 320 };
const DATE_FMT = "dd-mmm-yyyy";
const CURRENCY_FMT = '"₹"#,##0.00';
const LINK_FONT = { color: { argb: "FF0563C1" }, underline: true } as const;

export interface ExportProgress {
  done: number;
  total: number;
}

interface ReceiptJob {
  expense: MasterExpense;
  lineIndex: number; // 0-based index into ExpenseData, -1 when the expense has no lines
  name: string;
  path: string;
  kind: "image" | "pdf" | "file";
  // filled in by resolveReceipt
  url?: string;
  imageId?: number;
  width?: number;
  height?: number;
  error?: string;
}

export async function exportExpensesToXlsx(
  expenses: MasterExpense[],
  opts: { fileName: string; exportedBy?: string; onProgress?: (p: ExportProgress) => void },
): Promise<{ receipts: number; failed: number }> {
  const ExcelJS = await loadExcelJS();
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = "ExpGenie";
  wb.created = new Date();

  // 1. Collect every attachment across the selection.
  const jobs: ReceiptJob[] = [];
  for (const e of expenses) {
    (e.ExpenseData ?? []).forEach((inv, i) => {
      for (const f of invoiceFiles(inv)) {
        jobs.push({ expense: e, lineIndex: i, name: f.name, path: f.path, kind: fileKind(f.name, f.path) });
      }
    });
  }

  // 2. Sign + download them a few at a time.
  let done = 0;
  opts.onProgress?.({ done, total: jobs.length });
  await runPool(jobs, CONCURRENCY, async (job) => {
    await resolveReceipt(wb, job);
    done += 1;
    opts.onProgress?.({ done, total: jobs.length });
  });

  // 3. Build the sheets.
  const byLine = new Map<string, ReceiptJob[]>();
  for (const j of jobs) {
    const key = `${j.expense.id}:${j.lineIndex}`;
    byLine.set(key, [...(byLine.get(key) ?? []), j]);
  }
  buildExpensesSheet(wb, expenses, byLine);
  buildReceiptsSheet(wb, jobs);
  buildInfoSheet(wb, expenses, jobs, opts.exportedBy);

  // 4. Download.
  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    opts.fileName,
  );
  return { receipts: jobs.length, failed: jobs.filter((j) => j.error).length };
}

// ---------------------------------------------------------------------------
// Sheets

function buildExpensesSheet(wb: Workbook, expenses: MasterExpense[], byLine: Map<string, ReceiptJob[]>) {
  const ws = wb.addWorksheet("Expenses", { views: [{ state: "frozen", ySplit: 1 }] });

  const maxLinks = Math.max(1, ...[...byLine.values()].map((l) => l.length));
  const linkCols = Array.from({ length: maxLinks }, (_, i) => ({
    header: maxLinks === 1 ? "Receipt link" : `Receipt ${i + 1}`,
    key: `link${i}`,
    width: 28,
  }));

  ws.columns = [
    { header: "S.No", key: "sno", width: 6 },
    { header: "Expense ID", key: "expenseId", width: 36 },
    { header: "Title", key: "title", width: 22 },
    { header: "Submitter", key: "submitter", width: 18 },
    { header: "Submitter email", key: "submitterEmail", width: 28 },
    { header: "Approver email", key: "approver", width: 28 },
    { header: "Status", key: "status", width: 11 },
    { header: "Submitted on", key: "submitted", width: 13, style: { numFmt: DATE_FMT } },
    { header: "Approved on", key: "approved", width: 13, style: { numFmt: DATE_FMT } },
    { header: "Rejection reason", key: "rejection", width: 26 },
    { header: "Payment status", key: "payment", width: 12 },
    { header: "Paid on", key: "paidOn", width: 13, style: { numFmt: DATE_FMT } },
    { header: "Paid by", key: "paidBy", width: 24 },
    { header: "Payment reference", key: "paymentRef", width: 20 },
    { header: "Line #", key: "line", width: 7 },
    { header: "Bill / invoice no.", key: "billNo", width: 18 },
    { header: "Vendor", key: "vendor", width: 20 },
    { header: "Category", key: "category", width: 16 },
    { header: "Sub-category", key: "subCategory", width: 16 },
    { header: "Narration", key: "narration", width: 32 },
    { header: "Document date", key: "docDate", width: 13, style: { numFmt: DATE_FMT } },
    { header: "Posting date", key: "postDate", width: 13, style: { numFmt: DATE_FMT } },
    { header: "GL code", key: "gl", width: 12 },
    { header: "Cost center", key: "costCenter", width: 12 },
    { header: "Line amount", key: "amount", width: 14, style: { numFmt: CURRENCY_FMT } },
    { header: "Expense total", key: "total", width: 14, style: { numFmt: CURRENCY_FMT } },
    { header: "Attachments", key: "attachments", width: 11 },
    { header: "Receipt preview", key: "preview", width: 14 },
    ...linkCols,
  ];
  styleHeader(ws);

  const previewCol = ws.columns.findIndex((c) => c.key === "preview"); // 0-based for addImage
  const firstLinkCol = ws.columns.findIndex((c) => c.key === "link0") + 1; // 1-based for getCell
  let sno = 0;

  for (const e of expenses) {
    sno += 1;
    const lines = e.ExpenseData?.length ? e.ExpenseData : [undefined];
    lines.forEach((inv, i) => {
      const lineIndex = inv ? i : -1;
      const receipts = byLine.get(`${e.id}:${lineIndex}`) ?? [];
      const row = ws.addRow({
        sno,
        expenseId: e.ExpenseId,
        title: e.ExpenseTitle,
        submitter: e.SubmitterName,
        submitterEmail: e.SubmitterEmail,
        approver: e.ApproverEmail,
        status: e.ApprovalStatus,
        submitted: toDate(e.SubmissionDate),
        approved: toDate(e.ApprovedAt),
        rejection: e.RejectionInfo
          ? [e.RejectionInfo.Reason, e.RejectionInfo.Comments].filter(Boolean).join(" — ")
          : "",
        payment: e.PaymentStatus ?? "Unpaid",
        paidOn: toDate(e.PaymentInfo?.PaidAt),
        paidBy: e.PaymentInfo?.PaidBy ?? "",
        paymentRef: e.PaymentInfo?.Reference ?? "",
        line: inv ? i + 1 : "",
        billNo: inv?.BillNumber || inv?.InvoiceNumber || inv?.ItemData?.DocumentNo || "",
        vendor: inv?.VendorName ?? "",
        category: inv?.Category || inv?.ExpenseType || (inv ? "" : expenseCategory(e)),
        subCategory: inv?.SubCategory ?? "",
        narration: invoiceNarration(inv),
        docDate: toDate(inv?.DocumentDate),
        postDate: toDate(inv?.PostingDate),
        gl: inv?.ItemData?.GLCode ?? "",
        costCenter: inv?.ItemData?.CostCenter ?? "",
        amount: inv ? toAmount(inv.InvoiceAmount) : expenseTotal(e),
        total: expenseTotal(e),
        attachments: receipts.length,
      });
      row.alignment = { vertical: "middle", wrapText: true };

      receipts.forEach((r, k) => setLink(row.getCell(firstLinkCol + k), r));

      const firstImage = receipts.find((r) => r.imageId !== undefined);
      if (firstImage) {
        row.height = THUMB.h * 0.75 + 6; // points; 1px ≈ 0.75pt
        const ext = fit(firstImage, THUMB);
        ws.addImage(firstImage.imageId!, {
          tl: { col: previewCol + 0.05, row: row.number - 1 + 0.05 },
          ext,
          editAs: "oneCell",
        });
      }
    });
  }

  // Totals row — Line amount sums every bill line, so no double counting.
  const amountCol = ws.getColumn("amount").letter;
  const last = ws.rowCount;
  const totalRow = ws.addRow({ narration: "Total" });
  totalRow.getCell("amount").value = { formula: `SUM(${amountCol}2:${amountCol}${last})` };
  totalRow.font = { bold: true };

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
}

function buildReceiptsSheet(wb: Workbook, jobs: ReceiptJob[]) {
  const ws = wb.addWorksheet("Receipts", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Expense ID", key: "expenseId", width: 36 },
    { header: "Title", key: "title", width: 20 },
    { header: "Submitter", key: "submitter", width: 18 },
    { header: "Line #", key: "line", width: 7 },
    { header: "Bill / invoice no.", key: "billNo", width: 18 },
    { header: "Line amount", key: "amount", width: 14, style: { numFmt: CURRENCY_FMT } },
    { header: "File name", key: "name", width: 28 },
    { header: "Type", key: "kind", width: 8 },
    { header: "Open link", key: "link", width: 22 },
    { header: "Signed URL", key: "url", width: 50 },
    { header: "Storage path", key: "path", width: 50 },
    { header: "Preview", key: "preview", width: PREVIEW.w / 7 + 2 },
  ];
  styleHeader(ws);
  const previewCol = ws.columns.findIndex((c) => c.key === "preview");

  for (const j of jobs) {
    const inv = j.lineIndex >= 0 ? j.expense.ExpenseData[j.lineIndex] : undefined;
    const row = ws.addRow({
      expenseId: j.expense.ExpenseId,
      title: j.expense.ExpenseTitle,
      submitter: j.expense.SubmitterName,
      line: j.lineIndex + 1,
      billNo: inv?.BillNumber || inv?.InvoiceNumber || "",
      amount: inv ? toAmount(inv.InvoiceAmount) : "",
      name: j.name,
      kind: j.kind.toUpperCase(),
      url: j.url ?? "",
      path: j.path,
    });
    row.alignment = { vertical: "top", wrapText: true };
    setLink(row.getCell("link"), j);

    if (j.imageId !== undefined) {
      const ext = fit(j, PREVIEW);
      row.height = ext.height * 0.75 + 8;
      ws.addImage(j.imageId, {
        tl: { col: previewCol + 0.05, row: row.number - 1 + 0.05 },
        ext,
        editAs: "oneCell",
      });
    } else {
      row.getCell("preview").value =
        j.error ?? (j.kind === "pdf" ? "PDF — use the link to open" : "Preview not available — use the link");
      row.getCell("preview").font = { italic: true, color: { argb: "FF6B7280" } };
    }
  }
}

function buildInfoSheet(wb: Workbook, expenses: MasterExpense[], jobs: ReceiptJob[], exportedBy?: string) {
  const ws = wb.addWorksheet("Info");
  ws.columns = [{ width: 26 }, { width: 60 }];
  const expires = localWallClock(new Date(Date.now() + LINK_TTL_SECONDS * 1000));
  const failed = jobs.filter((j) => j.error).length;
  const rows: [string, string | number | Date][] = [
    ["Exported at", localWallClock(new Date())],
    ["Exported by", exportedBy || "—"],
    ["Expenses", expenses.length],
    ["Bill lines", expenses.reduce((n, e) => n + Math.max(1, e.ExpenseData?.length ?? 0), 0)],
    ["Total amount", expenses.reduce((s, e) => s + expenseTotal(e), 0)],
    ["Receipts", jobs.length],
    ["Receipts embedded as images", jobs.filter((j) => j.imageId !== undefined).length],
    ["Receipts with link only (no preview)", failed],
    ["Receipt links valid until", expires],
    [
      "Note",
      "Receipt links are signed and expire on the date above. Images are embedded in the file " +
        "and never expire; PDFs can only be linked. Re-export from ExpGenie for fresh links.",
    ],
  ];
  for (const [k, v] of rows) {
    const row = ws.addRow([k, v]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { wrapText: true, horizontal: "left" };
    if (v instanceof Date) row.getCell(2).numFmt = "dd-mmm-yyyy hh:mm";
    if (k === "Total amount") row.getCell(2).numFmt = CURRENCY_FMT;
  }
}

// ---------------------------------------------------------------------------
// Receipts

async function resolveReceipt(wb: Workbook, job: ReceiptJob) {
  try {
    job.url = await signPath(job.path);
  } catch {
    job.error = "Could not sign the link";
    return;
  }
  if (job.kind !== "image") return;
  try {
    const res = await fetch(job.url);
    if (!res.ok) throw new Error(String(res.status));
    const img = await toJpeg(await res.blob());
    job.imageId = wb.addImage({ buffer: img.buffer, extension: "jpeg" });
    job.width = img.width;
    job.height = img.height;
  } catch {
    // Link still works; just no embedded preview (CORS, HEIC, network…).
    job.error = "Preview not available — use the link";
  }
}

async function signPath(path: string): Promise<string> {
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await apiClient.get<{ url: string }>("/storage/sign", {
    params: { path, expiresIn: LINK_TTL_SECONDS },
  });
  return data.url;
}

/** Decode any browser-readable image, downscale, re-encode as JPEG (Excel-safe). */
async function toJpeg(blob: Blob): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_IMAGE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // transparent PNGs would turn black in JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const out = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.82),
  );
  return { buffer: await out.arrayBuffer(), width, height };
}

function fileKind(name: string, path: string): ReceiptJob["kind"] {
  const s = `${name} ${path}`.toLowerCase();
  if (/\.pdf(\?|\s|$)/.test(s)) return "pdf";
  if (/\.(png|jpe?g|gif|webp|bmp|heic|heif)(\?|\s|$)/.test(s)) return "image";
  // The chatbot often stores photos without an extension — try them as images;
  // a failed decode just falls back to the link.
  return /\.[a-z0-9]{2,5}(\?|\s|$)/.test(s) ? "file" : "image";
}

// ---------------------------------------------------------------------------
// Helpers

async function loadExcelJS() {
  // Lazy: exceljs is ~1 MB and only needed when someone clicks Export.
  const mod = await import("exceljs");
  return (mod as unknown as { default?: typeof mod }).default ?? mod;
}

function styleHeader(ws: Worksheet) {
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF087AA7" } };
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 22;
}

function setLink(cell: import("exceljs").Cell, r: ReceiptJob) {
  if (!r.url) {
    cell.value = `${r.name} (link unavailable)`;
    return;
  }
  cell.value = { text: `${r.name} (${r.kind.toUpperCase()})`, hyperlink: r.url };
  cell.font = LINK_FONT;
}

function fit(r: ReceiptJob, box: { w: number; h: number }) {
  const w = r.width ?? box.w;
  const h = r.height ?? box.h;
  const s = Math.min(box.w / w, box.h / h, 1);
  return { width: Math.round(w * s), height: Math.round(h * s) };
}

function toDate(v?: string): Date | string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  // A bare "2026-09-28" is already a calendar date — keep it as-is.
  return /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? d : localWallClock(d);
}

/**
 * Excel has no time zones and exceljs writes Dates as UTC, so an IST submission
 * at 01:00 would land on the previous day. Shift to the viewer's wall clock.
 */
function localWallClock(d: Date): Date {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
}

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await fn(items[next++] as T);
  });
  await Promise.all(workers);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFileName(slug: string): string {
  return `expenses-${slug}-${formatDate(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`;
}
