import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/departments")({
  component: Departments,
});

function Departments() {
  const { canManage } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-with-count"],
    queryFn: async () => {
      const { data } = await supabase.from("departments").select("*, employees(count)").order("name");
      return data ?? [];
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("departments").insert({ name, description: desc || null });
    if (error) return toast.error(error.message);
    toast.success("Department created");
    setName(""); setDesc(""); setOpen(false);
    qc.invalidateQueries({ queryKey: ["departments-with-count"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this department?")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["departments-with-count"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">Organize your company structure</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New department</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New department</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d: any) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-primary/10 text-primary">
                <Building className="h-5 w-5" />
              </div>
              {canManage && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(d.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <h3 className="font-semibold mt-3">{d.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{d.description ?? "No description"}</p>
            <p className="text-xs text-muted-foreground mt-3">{d.employees?.[0]?.count ?? 0} employees</p>
          </Card>
        ))}
        {departments.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground col-span-full">
            No departments yet.
          </Card>
        )}
      </div>
    </div>
  );
}
