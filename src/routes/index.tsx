import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Building2, Users, Shield, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acme HRMS — People operations, simplified" },
      { name: "description", content: "Modern HR portal for managing employees, departments, and people operations." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            Acme HRMS
          </div>
          <Button asChild><Link to="/auth">Sign in</Link></Button>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary mb-4">People operations</p>
            <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              The HR portal your team actually wants to use.
            </h1>
            <p className="text-lg text-muted-foreground mt-5 max-w-2xl">
              Centralize your employee directory, department structure, and access controls in one corporate-grade workspace.
            </p>
            <div className="flex gap-3 mt-8">
              <Button size="lg" asChild><Link to="/auth">Get started</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/auth">Sign in</Link></Button>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: "Employee directory", desc: "Searchable, sortable directory with full employee profiles." },
            { icon: Shield, title: "Role-based access", desc: "Admin, HR, and employee roles with secure row-level permissions." },
            { icon: BarChart3, title: "Live analytics", desc: "Headcount, departments, and status at a glance." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mt-4">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Acme HRMS
      </footer>
    </div>
  );
}
