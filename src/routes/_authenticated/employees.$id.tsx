import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employees/$id")({
  component: EmployeeDetail,
});

function EmployeeDetail() {
  const { id } = Route.useParams();
  const { canManage } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: e, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, departments(name), manager:manager_id(first_name, last_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function del() {
    if (!confirm("Delete this employee?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Employee deleted");
    qc.invalidateQueries({ queryKey: ["employees"] });
    navigate({ to: "/employees" });
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!e) return <p>Not found.</p>;

  return (
    <div className="space-y-5 max-w-4xl">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/employees"><ArrowLeft className="h-4 w-4 mr-1" /> Back to employees</Link>
      </Button>

      <Card className="p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl">{(e.first_name?.[0] ?? "") + (e.last_name?.[0] ?? "")}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">{e.first_name} {e.last_name}</h1>
              <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status.replace("_", " ")}</Badge>
            </div>
            <p className="text-muted-foreground">{e.job_title ?? "—"} · {e.departments?.name ?? "No department"}</p>
            <p className="text-xs text-muted-foreground mt-1">Code: {e.employee_code}</p>
          </div>
          {canManage && (
            <Button variant="outline" size="sm" onClick={del}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-6 space-y-3">
          <h2 className="font-semibold mb-2">Contact</h2>
          <Row icon={Mail} label="Email" value={e.email} />
          <Row icon={Phone} label="Phone" value={e.phone ?? "—"} />
          <Row icon={MapPin} label="Location" value={e.location ?? "—"} />
        </Card>
        <Card className="p-6 space-y-3">
          <h2 className="font-semibold mb-2">Employment</h2>
          <Row icon={Briefcase} label="Type" value={e.employment_type.replace("_", " ")} />
          <Row icon={Calendar} label="Hire date" value={e.hire_date ? new Date(e.hire_date).toLocaleDateString() : "—"} />
          <Row icon={Briefcase} label="Manager" value={e.manager ? `${e.manager.first_name} ${e.manager.last_name}` : "—"} />
          {canManage && e.salary != null && (
            <Row icon={Briefcase} label="Salary" value={`$${Number(e.salary).toLocaleString()}`} />
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground w-20">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
