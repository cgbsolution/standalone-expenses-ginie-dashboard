"use client";

import { useEffect, useState } from "react";
import { Database, Users2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegrations, useUpdateIntegrations } from "@/lib/hooks/use-integrations";
import { testConnection, type TestResult } from "@/lib/api/integrations";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { slug: string };
}

type SapForm = {
  enabled: boolean;
  baseUrl: string;
  authType: string;
  username: string;
  companyCode: string;
  glAccount: string;
  costCenter: string;
  taxCode: string;
};
type HrmsForm = {
  enabled: boolean;
  baseUrl: string;
  authType: string;
  username: string;
  employeeEndpoint: string;
  autoSync: boolean;
};

const EMPTY_SAP: SapForm = {
  enabled: false, baseUrl: "", authType: "basic", username: "",
  companyCode: "", glAccount: "", costCenter: "", taxCode: "",
};
const EMPTY_HRMS: HrmsForm = {
  enabled: false, baseUrl: "", authType: "basic", username: "",
  employeeEndpoint: "", autoSync: false,
};

export default function IntegrationsPage({ params }: PageProps) {
  const { slug } = params;
  const { data, isLoading } = useIntegrations(slug);
  const update = useUpdateIntegrations(slug);

  const [sap, setSap] = useState<SapForm>(EMPTY_SAP);
  const [sapPassword, setSapPassword] = useState("");
  const [hrms, setHrms] = useState<HrmsForm>(EMPTY_HRMS);
  const [hrmsSecret, setHrmsSecret] = useState("");

  const [sapTest, setSapTest] = useState<TestResult | null>(null);
  const [hrmsTest, setHrmsTest] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState<"sap" | "hrms" | null>(null);

  useEffect(() => {
    if (!data) return;
    setSap({
      enabled: data.sap.enabled, baseUrl: data.sap.baseUrl,
      authType: data.sap.authType || "basic", username: data.sap.username,
      companyCode: data.sap.companyCode, glAccount: data.sap.glAccount,
      costCenter: data.sap.costCenter, taxCode: data.sap.taxCode,
    });
    setHrms({
      enabled: data.hrms.enabled, baseUrl: data.hrms.baseUrl,
      authType: data.hrms.authType || "basic", username: data.hrms.username,
      employeeEndpoint: data.hrms.employeeEndpoint, autoSync: data.hrms.autoSync,
    });
  }, [data]);

  const saveSap = async () => {
    try {
      await update.mutateAsync({ sap: { ...sap, ...(sapPassword ? { password: sapPassword } : {}) } });
      setSapPassword("");
      toast.success("SAP settings saved");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
  const saveHrms = async () => {
    try {
      await update.mutateAsync({ hrms: { ...hrms, ...(hrmsSecret ? { secret: hrmsSecret } : {}) } });
      setHrmsSecret("");
      toast.success("HRMS settings saved");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const runTest = async (type: "sap" | "hrms") => {
    const baseUrl = type === "sap" ? sap.baseUrl : hrms.baseUrl;
    const setResult = type === "sap" ? setSapTest : setHrmsTest;
    setTesting(type);
    setResult(null);
    try {
      setResult(await testConnection(slug, type, baseUrl));
    } catch (e) {
      setResult({ ok: false, message: apiErrorMessage(e) });
    } finally {
      setTesting(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect this tenant to your SAP ERP and HRMS. Settings are saved per tenant."
      />

      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        Configure the connection details here. Once your SAP / HRMS endpoints are provided and enabled,
        approved expenses post to SAP and employee data syncs from your HRMS automatically.
      </p>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[360px]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ---------------- SAP ---------------- */}
          <ProviderCard
            icon={Database}
            title="SAP S/4HANA (ERP posting)"
            description="Approved expenses post to SAP FI with your cost-centre, GL, and tax codes."
            enabled={sap.enabled}
            configured={!!sap.baseUrl}
            onToggle={(v) => setSap({ ...sap, enabled: v })}
            onSave={saveSap}
            onTest={() => runTest("sap")}
            testing={testing === "sap"}
            testResult={sapTest}
            saving={update.isPending}
          >
            <Field id="sap-url" label="OData service endpoint" placeholder="https://s4hana.jkgroup.com/sap/opu/odata/…"
              value={sap.baseUrl} onChange={(v) => setSap({ ...sap, baseUrl: v })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField id="sap-auth" label="Authentication"
                value={sap.authType} onChange={(v) => setSap({ ...sap, authType: v })}
                options={[["basic", "Basic auth"], ["oauth2", "OAuth 2.0"]]} />
              <Field id="sap-user" label="Username / client ID"
                value={sap.username} onChange={(v) => setSap({ ...sap, username: v })} />
              <SecretField id="sap-pass" label="Password / client secret"
                saved={!!data?.sap.passwordSet} value={sapPassword} onChange={setSapPassword} />
              <Field id="sap-company" label="Company code" placeholder="1000"
                value={sap.companyCode} onChange={(v) => setSap({ ...sap, companyCode: v })} />
              <Field id="sap-gl" label="Default GL account"
                value={sap.glAccount} onChange={(v) => setSap({ ...sap, glAccount: v })} />
              <Field id="sap-cc" label="Cost centre"
                value={sap.costCenter} onChange={(v) => setSap({ ...sap, costCenter: v })} />
              <Field id="sap-tax" label="Default tax code"
                value={sap.taxCode} onChange={(v) => setSap({ ...sap, taxCode: v })} />
            </div>
          </ProviderCard>

          {/* ---------------- HRMS ---------------- */}
          <ProviderCard
            icon={Users2}
            title="HRMS (employee sync)"
            description="Sync the employee master — grades, managers, cost centres — from your HR system."
            enabled={hrms.enabled}
            configured={!!hrms.baseUrl}
            onToggle={(v) => setHrms({ ...hrms, enabled: v })}
            onSave={saveHrms}
            onTest={() => runTest("hrms")}
            testing={testing === "hrms"}
            testResult={hrmsTest}
            saving={update.isPending}
          >
            <Field id="hrms-url" label="HRMS API base URL" placeholder="https://hrms.jkgroup.com/api"
              value={hrms.baseUrl} onChange={(v) => setHrms({ ...hrms, baseUrl: v })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField id="hrms-auth" label="Authentication"
                value={hrms.authType} onChange={(v) => setHrms({ ...hrms, authType: v })}
                options={[["basic", "Basic auth"], ["apikey", "API key"]]} />
              <Field id="hrms-user" label="Username"
                value={hrms.username} onChange={(v) => setHrms({ ...hrms, username: v })} />
              <SecretField id="hrms-secret" label="Password / API key"
                saved={!!data?.hrms.secretSet} value={hrmsSecret} onChange={setHrmsSecret} />
              <Field id="hrms-emp" label="Employee endpoint path" placeholder="/employees"
                value={hrms.employeeEndpoint} onChange={(v) => setHrms({ ...hrms, employeeEndpoint: v })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary"
                checked={hrms.autoSync} onChange={(e) => setHrms({ ...hrms, autoSync: e.target.checked })} />
              Auto-sync employees daily
            </label>
          </ProviderCard>
        </div>
      )}
    </>
  );
}

/* ---------------- building blocks ---------------- */

function ProviderCard({
  icon: Icon, title, description, enabled, configured,
  onToggle, onSave, onTest, testing, testResult, saving, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  onToggle: (v: boolean) => void;
  onSave: () => void;
  onTest: () => void;
  testing: boolean;
  testResult: TestResult | null;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              {enabled && configured ? (
                <Badge variant="default" className="bg-success/15 text-success">Connected</Badge>
              ) : configured ? (
                <Badge variant="secondary">Configured · off</Badge>
              ) : (
                <Badge variant="secondary">Not configured</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label={`Enable ${title}`} />
      </CardHeader>

      <CardContent className="space-y-4">{children}</CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <div className="min-h-5 text-xs">
          {testResult ? (
            <span className={cn("inline-flex items-center gap-1.5", testResult.ok ? "text-success" : "text-destructive")}>
              {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {testResult.message}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Test connection
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function Field({
  id, label, value, onChange, placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SecretField({
  id, label, saved, value, onChange,
}: {
  id: string;
  label: string;
  saved: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete="new-password"
        value={value}
        placeholder={saved ? "•••••••• (saved — leave blank to keep)" : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({
  id, label, value, onChange, options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}
