"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useBulkInviteUsers } from "@/lib/hooks/use-users";
import { parseCsv } from "@/lib/csv";
import type { BulkUserRow } from "@/lib/api/users";

// Maps a normalized header cell to a BulkUserRow key.
const HEADER_ALIASES: Record<string, keyof BulkUserRow> = {
  name: "displayName",
  fullname: "displayName",
  employeename: "displayName",
  email: "email",
  emailaddress: "email",
  workemail: "email",
  mail: "email",
  role: "role",
  department: "department",
  dept: "department",
  grade: "grade",
  employeeid: "employeeId",
  empid: "employeeId",
  employeecode: "employeeId",
  manageremail: "managerEmail",
  manager: "managerEmail",
  reportingmanager: "managerEmail",
  financemanageremail: "financeManagerEmail",
  financemanager: "financeManagerEmail",
  finance: "financeManagerEmail",
};

const TEMPLATE_HEADERS = [
  "name",
  "email",
  "role",
  "department",
  "grade",
  "employeeId",
  "managerEmail",
  "financeManagerEmail",
];

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rowsFromCsv(text: string): { rows: BulkUserRow[]; missingEmailOrName: number } {
  const grid = parseCsv(text);
  const headerRow = grid[0];
  if (!headerRow || grid.length < 2) return { rows: [], missingEmailOrName: 0 };

  const header = headerRow.map((h) => HEADER_ALIASES[normalizeHeader(h)]);
  const rows: BulkUserRow[] = [];
  let missingEmailOrName = 0;

  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r] ?? [];
    const obj: Partial<BulkUserRow> = {};
    header.forEach((key, c) => {
      if (!key) return;
      const val = (cells[c] ?? "").trim();
      if (val) (obj as Record<string, string>)[key] = val;
    });
    const role = (obj.role ?? "").toString().toLowerCase() === "admin" ? "admin" : "employee";
    if (!obj.email || !obj.displayName) {
      missingEmailOrName++;
      continue;
    }
    rows.push({ ...obj, role } as BulkUserRow);
  }
  return { rows, missingEmailOrName };
}

function downloadTemplate() {
  const sample =
    "Jane Doe,jane@company.com,employee,Engineering,G5,EMP1001,manager@company.com,finance@company.com";
  const csv = `${TEMPLATE_HEADERS.join(",")}\n${sample}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "employee-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkImportSheet({ tenantSlug }: { tenantSlug: string }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<BulkUserRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { mutateAsync, isPending } = useBulkInviteUsers();

  function reset() {
    setFileName(null);
    setRows([]);
    setSkipped(0);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const { rows: parsed, missingEmailOrName } = rowsFromCsv(text);
      if (parsed.length === 0) {
        setError("No valid rows found. Make sure the file has a header row with at least name and email.");
      }
      setRows(parsed);
      setSkipped(missingEmailOrName);
    } catch {
      setError("Could not read that file. Please upload a .csv file.");
      setRows([]);
    }
  }

  async function onImport() {
    if (!rows.length) return;
    try {
      await mutateAsync({ tenantSlug, users: rows });
      reset();
      setOpen(false);
    } catch {
      // hook surfaces the error toast
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4" />
          Bulk import
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Bulk import employees</SheetTitle>
          <SheetDescription>
            Upload a CSV to add many employees at once. Rows whose email already exists
            are skipped, so you can safely re-upload an updated list.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Step 1 — Format
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Columns: <span className="font-mono">name, email, role, department, grade, employeeId,
              managerEmail, financeManagerEmail</span>. Only <strong>name</strong> and{" "}
              <strong>email</strong> are required.
            </p>
            <Button variant="ghost" size="sm" className="mt-2 px-2" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5" />
              Download CSV template
            </Button>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Step 2 — Upload
            </p>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-secondary/80"
            />
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          {fileName && rows.length > 0 ? (
            <div className="rounded-lg border border-border bg-card/40 p-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="truncate text-sm font-medium">{fileName}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{rows.length}</span> employee
                {rows.length > 1 ? "s" : ""} ready to import
                {skipped > 0 ? (
                  <> · {skipped} row{skipped > 1 ? "s" : ""} skipped (missing name or email)</>
                ) : null}
                .
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Existing emails will be skipped automatically. New employees get an email to set
                their password.
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={onImport} disabled={isPending || rows.length === 0}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isPending ? "Importing…" : `Import ${rows.length || ""}`.trim()}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
