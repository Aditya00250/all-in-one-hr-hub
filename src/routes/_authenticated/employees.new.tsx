import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employees/new")({
  component: NewEmployee,
});

function NewEmployee() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    employee_code: "", email: "", first_name: "", last_name: "", job_title: "",
    department_id: "", employment_type: "full_time", status: "active",
    hire_date: "", location: "", salary: "", phone: "",
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await supabase.from("departments").select("*").order("name")).data ?? [],
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload: any = { ...form };
    if (!payload.department_id) delete payload.department_id;
    if (!payload.hire_date) delete payload.hire_date;
    if (payload.salary) payload.salary = parseFloat(payload.salary); else delete payload.salary;
    const { error } = await supabase.from("employees").insert(payload);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Employee added");
    navigate({ to: "/employees" });
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
        <p className="text-sm text-muted-foreground">Create a new employee record.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Employee code *"><Input required value={form.employee_code} onChange={(e) => set("employee_code", e.target.value)} /></Field>
          <Field label="Email *"><Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="First name *"><Input required value={form.first_name} onChange={(e) => set("first_name", e.target.value)} /></Field>
          <Field label="Last name *"><Input required value={form.last_name} onChange={(e) => set("last_name", e.target.value)} /></Field>
          <Field label="Job title"><Input value={form.job_title} onChange={(e) => set("job_title", e.target.value)} /></Field>
          <Field label="Department">
            <Select value={form.department_id} onValueChange={(v) => set("department_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Employment type">
            <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Hire date"><Input type="date" value={form.hire_date} onChange={(e) => set("hire_date", e.target.value)} /></Field>
          <Field label="Location"><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Annual salary"><Input type="number" step="0.01" value={form.salary} onChange={(e) => set("salary", e.target.value)} /></Field>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/employees" })}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save employee"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
