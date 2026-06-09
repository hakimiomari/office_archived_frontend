"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUsers } from "@/config/users/users";
import { useRoles, RoleType } from "@/config/users/roles";
import { useCompanies, Company } from "@/api/hooks/use-companies";
import { useUser } from "@/contexts/UserContext";
import { RouteGuard } from "@/components/route-guard";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    // Always try to load companies — the API enforces SUPER_ADMIN-only at
    // the backend, so a tenant user just gets an empty list (and the
    // dropdown is disabled for them anyway).
    listCompanies({ limit: 200 }).then((r) => setCompanies(r.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // SUPER_ADMIN: take values from the form. Anyone else: their own companyId
    // and force COMPANY_USER (backend re-derives companyId from the request
    // user anyway, but we send sane defaults so the API contract is satisfied).
    const userRole: UserRoleValue = isSuper ? form.userRole : "COMPANY_USER";
    const companyId =
      userRole === "SUPER_ADMIN"
        ? null
        : isSuper
          ? form.companyId
            ? Number(form.companyId)
            : null
          : (user?.companyId ?? null);

    // Client-side validation: a non-SUPER_ADMIN target user MUST have a
    // company. Catch this here so the user gets a clear inline message
    // instead of a 400 from the backend.
    if (userRole !== "SUPER_ADMIN" && companyId == null) {
      toast.error(
        isSuper
          ? "Please pick a company for this user."
          : "No company is associated with your account.",
      );
      return;
    }

    setLoading(true);
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
                  <Combobox
                    value={form.role}
                    onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
                    options={roles.map((role) => ({
                      value: String(role.id),
                      label: role.name,
                    }))}
                    placeholder="Select a role"
                    searchPlaceholder="Search roles..."
                    emptyMessage="No role found."
                  />
                </div>
              </div>
              {/*
              Tenancy section. Always visible so the company dropdown is
              never hidden. Non-SUPER_ADMINs see a locked-down view.
            */}
              <div className="rounded-md border-2 border-blue-500/40 bg-blue-500/5 p-3 space-y-3">
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Tenancy assignment
                  <span className="ms-2 text-xs font-normal text-muted-foreground">
                    (
                    {isSuper
                      ? "you are super admin — pick any role + company"
                      : `locked to your company${user?.company?.name ? ` (${user.company.name})` : ""}`}
                    )
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tenancy role</Label>
                    <Combobox
                      value={form.userRole}
                      onValueChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          userRole: v as UserRoleValue,
                          companyId: v === "SUPER_ADMIN" ? "" : p.companyId,
                        }))
                      }
                      disabled={!isSuper}
                      options={[
                        ...(isSuper
                          ? [{ value: "SUPER_ADMIN", label: "Super admin (no company)" }]
                          : []),
                        { value: "COMPANY_ADMIN", label: "Company admin" },
                        { value: "COMPANY_USER", label: "Company user" },
                      ]}
                      placeholder="Select tenancy role"
                      searchPlaceholder="Search..."
                      emptyMessage="No role found."
                    />
                    {!isSuper && (
                      <p className="text-xs text-muted-foreground">
                        Locked to "Company user" — only super admins can grant
                        other roles.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Company
                      {form.userRole !== "SUPER_ADMIN" && (
                        <span className="text-red-600 ms-1">*</span>
                      )}
                    </Label>
                    {isSuper ? (
                      <>
                        <Combobox
                          value={form.companyId}
                          onValueChange={(v) =>
                            setForm((p) => ({ ...p, companyId: v }))
                          }
                          disabled={form.userRole === "SUPER_ADMIN"}
                          options={companies.map((c) => ({
                            value: String(c.id),
                            label: c.name,
                          }))}
                          placeholder={
                            form.userRole === "SUPER_ADMIN"
                              ? "—"
                              : companies.length === 0
                                ? "No companies — create one first"
                                : "Select a company"
                          }
                          searchPlaceholder="Search companies..."
                          emptyMessage="No company found."
                        />
                        {form.userRole !== "SUPER_ADMIN" &&
                          companies.length === 0 && (
                            <p className="text-xs text-red-600">
                              Create at least one company before creating
                              company users.
                            </p>
                          )}
                      </>
                    ) : (
                      // Non-super sees their own company name, locked.
                      <Input
                        value={
                          user?.company?.name ??
                          `Company #${user?.companyId ?? "?"}`
                        }
                        disabled
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => changeRoute("/users")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    // SUPER_ADMIN creating a non-super user must pick a company.
                    (isSuper &&
                      form.userRole !== "SUPER_ADMIN" &&
                      !form.companyId)
                  }
                >
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
