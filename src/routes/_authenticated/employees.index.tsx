import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/employees/")({
  component: EmployeeDirectory,
});

function EmployeeDirectory() {
  const { canManage } = useAuth();
  const [q, setQ] = useState("");
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, departments(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = employees.filter((e: any) => {
    const s = `${e.first_name} ${e.last_name} ${e.email} ${e.job_title ?? ""} ${e.employee_code}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">{employees.length} people in the directory</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link to="/employees/new"><Plus className="h-4 w-4 mr-1" /> Add employee</Link>
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, title, code…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Department</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No employees found.</td></tr>
              )}
              {filtered.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/40 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link to="/employees/$id" params={{ id: e.id }} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{(e.first_name?.[0] ?? "") + (e.last_name?.[0] ?? "")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{e.first_name} {e.last_name}</p>
                        <p className="text-xs text-muted-foreground">{e.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.employee_code}</td>
                  <td className="px-4 py-3">{e.job_title ?? "—"}</td>
                  <td className="px-4 py-3">{e.departments?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={e.status === "active" ? "default" : e.status === "on_leave" ? "secondary" : "outline"}>
                      {e.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
