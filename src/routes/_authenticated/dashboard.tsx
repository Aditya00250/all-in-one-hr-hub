import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Building, UserCheck, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, tone = "primary" }: { icon: any; label: string; value: string | number; tone?: "primary" | "success" | "warning" }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold mt-2 tracking-tight">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-md flex items-center justify-center bg-${tone}/10 text-${tone}`} style={{ background: "color-mix(in oklab, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [emps, depts, active, onLeave] = await Promise.all([
        supabase.from("employees").select("*", { count: "exact", head: true }),
        supabase.from("departments").select("*", { count: "exact", head: true }),
        supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "on_leave"),
      ]);
      const recent = await supabase
        .from("employees")
        .select("id, first_name, last_name, job_title, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return {
        employees: emps.count ?? 0,
        departments: depts.count ?? 0,
        active: active.count ?? 0,
        onLeave: onLeave.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total employees" value={data?.employees ?? "—"} />
        <Stat icon={UserCheck} label="Active" value={data?.active ?? "—"} />
        <Stat icon={Briefcase} label="On leave" value={data?.onLeave ?? "—"} />
        <Stat icon={Building} label="Departments" value={data?.departments ?? "—"} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recently added</h2>
        </div>
        <div className="divide-y">
          {(data?.recent ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No employees yet. Add one from the Employees page.
            </p>
          )}
          {data?.recent?.map((e) => (
            <div key={e.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{e.first_name} {e.last_name}</p>
                <p className="text-xs text-muted-foreground">{e.job_title ?? "—"}</p>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
