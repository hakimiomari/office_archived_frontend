"use client";

import { useEffect, useState } from "react";
import { useUsers } from "@/config/users/users";
import { useRoles, RoleType } from "@/config/users/roles";
import { useCompanies, Company } from "@/config/companies/companies";
import { useUser } from "@/contexts/UserContext";
import { RouteGuard } from "@/components/route-guard";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UserRoleValue = "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_USER";

export default function CreateUserPage() {
  const { createUser } = useUsers();
  const { getRoles } = useRoles();
  const { list: listCompanies } = useCompanies();
  const { user } = useUser();
  const { changeRoute } = nextRoute();
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const isSuper = user?.userRole === "SUPER_ADMIN";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    userRole: "COMPANY_USER" as UserRoleValue,
    companyId: "" as string,
  });

  useEffect(() => {
    getRoles().then(setRoles);
    if (isSuper) {
      listCompanies({ limit: 200 }).then((r) => setCompanies(r.data));
    }
  }, [isSuper]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // SUPER_ADMIN: take values from the form. Anyone else: their own companyId
    // and force COMPANY_USER (backend ignores client-provided companyId for
    // non-super users via the JWT-derived context anyway, but we send sane
    // defaults so the API contract is satisfied).
    const userRole: UserRoleValue = isSuper
      ? form.userRole
      : "COMPANY_USER";
    const companyId =
      userRole === "SUPER_ADMIN"
        ? null
        : isSuper
          ? form.companyId
            ? Number(form.companyId)
            : null
          : (user?.companyId ?? null);

    const result = await createUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: parseInt(form.role),
      userRole,
      companyId,
    });
    setLoading(false);
    if (result) changeRoute("/users");
  };

  return (
    <RouteGuard permission="user.create">
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SUPER_ADMIN only: tenancy controls. */}
            {isSuper && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 rounded-md border bg-muted/30 p-3">
                <div className="space-y-2">
                  <Label>Tenancy role</Label>
                  <Select
                    value={form.userRole}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        userRole: v as UserRoleValue,
                        // Clear companyId when switching to SUPER_ADMIN.
                        companyId: v === "SUPER_ADMIN" ? "" : p.companyId,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">
                        Super admin (no company)
                      </SelectItem>
                      <SelectItem value="COMPANY_ADMIN">
                        Company admin
                      </SelectItem>
                      <SelectItem value="COMPANY_USER">
                        Company user
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select
                    value={form.companyId}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, companyId: v }))
                    }
                    disabled={form.userRole === "SUPER_ADMIN"}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          form.userRole === "SUPER_ADMIN"
                            ? "—"
                            : "Select a company"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => changeRoute("/users")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </RouteGuard>
  );
}
