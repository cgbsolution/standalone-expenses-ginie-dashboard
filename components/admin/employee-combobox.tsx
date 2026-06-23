"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUsers } from "@/lib/hooks/use-users";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmployeeComboboxProps {
  /** Tenant whose employees populate the list. */
  tenantSlug?: string;
  /** Currently selected email. */
  value: string;
  onChange: (email: string) => void;
  placeholder?: string;
  /** An email to hide from the list (e.g. so a user can't be their own manager). */
  excludeEmail?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Searchable people picker. Lists the tenant's employees (name + email) and
 * stores the chosen person's email. Typing a full email that isn't in the list
 * offers a "use this address" option, so off-roster managers still work.
 *
 * The dropdown is rendered inline (not via a portal) on purpose: this component
 * lives inside modal Sheets, where a portaled popover's items can become
 * unclickable due to the dialog's focus/pointer trapping.
 */
export function EmployeeCombobox({
  tenantSlug,
  value,
  onChange,
  placeholder = "Search for a person…",
  excludeEmail,
  disabled,
  id,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { data: users, isLoading } = useUsers(tenantSlug ? { tenant: tenantSlug } : {});

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = (users ?? []).filter(
    (u) => !excludeEmail || u.email.toLowerCase() !== excludeEmail.toLowerCase(),
  );
  const selected = options.find((u) => u.email.toLowerCase() === (value ?? "").toLowerCase());

  const trimmed = query.trim().toLowerCase();
  const showCustom =
    !!trimmed && EMAIL_RE.test(trimmed) && !options.some((u) => u.email.toLowerCase() === trimmed);

  function choose(email: string) {
    onChange(email);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        id={id}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
      >
        <span className="truncate">
          {selected ? `${selected.displayName} · ${selected.email}` : value || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <Command>
            <CommandInput
              autoFocus
              placeholder="Search by name or email…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-56">
              <CommandEmpty>{isLoading ? "Loading…" : "No matching employee."}</CommandEmpty>
              {value ? (
                <CommandItem value="__clear__" onSelect={() => choose("")}>
                  <X className="h-4 w-4" />
                  Clear selection
                </CommandItem>
              ) : null}
              <CommandGroup>
                {options.map((u) => (
                  <CommandItem
                    key={u.email}
                    value={`${u.displayName} ${u.email}`}
                    onSelect={() => choose(u.email)}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selected?.email === u.email ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{u.displayName}</span>
                      <span className="truncate text-[11px] text-muted-foreground">{u.email}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {showCustom ? (
                <CommandItem value={`use-${trimmed}`} onSelect={() => choose(trimmed)}>
                  <Check className="h-4 w-4 opacity-0" />
                  Use “{trimmed}”
                </CommandItem>
              ) : null}
            </CommandList>
          </Command>
        </div>
      ) : null}
    </div>
  );
}
