"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUsers, UserType } from "@/config/users/users";
import { useRoles, RoleType } from "@/config/users/roles";
import { useCompanies, Company } from "@/api/hooks/use-companies";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRoleValue = "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_USER";

type Props = {
  /** Pass for edit mode; omit (or pass null/undefined) for create mode. */
  editingUser?: UserType | null;
  /** Called after a successful create/update. */
  onSuccess?: () => void;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
};

/**
 * Reusable user form with full tenancy controls.
 *
 * Create mode (no editingUser):
 *   - Name, email, password, permission role (admin/manager/viewer),
 *     plus tenancy assignment (userRole + companyId).
 *   - SUPER_ADMINs can pick any tenancy role and any company; tenant admins
 *     are locked to "Company user" + their own company.
 *
 * Edit mode (editingUser passed):
 *   - Name + email + permission roles (multi-select via checkboxes).
 *   - Tenancy isn't editable here — keeps the surface focused. Promoting /
 *     demoting / moving a user can be added later if needed.
 */
export function UserForm({ editingUser, onSuccess, onCancel }: Props) {
  const { createUser, updateUser, getUser } = useUsers();
  const { getRoles } = useRoles();
  const { list: listCompanies } = useCompanies();
  const { user } = useUser();
  const isSuper = user?.userRole === "SUPER_ADMIN";

  const [allRoles, setAllRoles] = useState<RoleType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "" as string,           // create: single role id (string)
    roleIds: [] as number[],      // edit: multiple role ids
    userRole: "COMPANY_USER" as UserRoleValue,
    companyId: "" as string,
  });

  // Load roles + companies once.
  useEffect(() => {
    getRoles().then(setAllRoles);
    listCompanies({ limit: 200 }).then((r) => setCompanies(r.data));
  }, []);

  // When editing, hydrate the form from the full user record.
  useEffect(() => {
    if (!editingUser) return;
    let cancelled = false;
    getUser(editingUser.id).then((full: any) => {
      if (cancelled || !full) return;
      setForm((p) => ({
        ...p,
        name: full.name ?? "",
        email: full.email ?? "",
        roleIds: (full.roles ?? []).map((r: any) => r.id),
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [editingUser]);

  const toggleRole = (roleId: number) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let result;
    if (editingUser) {
      result = await updateUser(editingUser.id, {
        name: form.name,
        email: form.email,
        roleIds: form.roleIds,
      });
    } else {
      // Create mode — derive userRole + companyId.
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

      if (userRole !== "SUPER_ADMIN" && companyId == null) {
        setSaving(false);
        toast.error(
          isSuper
            ? "Please pick a company for this user."
            : "No company is associated with your account.",
        );
        return;
      }

      result = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: parseInt(form.role) || 0,
        userRole,
        companyId,
      });
    }
    setSaving(false);
    if (result) onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="userName">Full name</Label>
          <Input
            id="userName"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userEmail">Email</Label>
          <Input
            id="userEmail"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="john@example.com"
            required
          />
        </div>
      </div>

      {!editingUser && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="userPassword">Password</Label>
            <Input
              id="userPassword"
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
                {allRoles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="space-y-2">
          <Label>Roles</Label>
          <div className="grid grid-cols-2 gap-3 rounded-md border p-4 md:grid-cols-3">
            {allRoles.map((role) => (
              <div key={role.id} className="flex items-center gap-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={form.roleIds.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                />
                <Label
                  htmlFor={`role-${role.id}`}
                  className="cursor-pointer capitalize"
                >
                  {role.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenancy section — only shown in create mode. Always visible so the
          company dropdown is never hidden; non-SUPER_ADMINs see a
          locked-down view. */}
      {!editingUser && (
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
              <Select
                value={form.userRole}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    userRole: v as UserRoleValue,
                    companyId: v === "SUPER_ADMIN" ? "" : p.companyId,
                  }))
                }
                disabled={!isSuper}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuper && (
                    <SelectItem value="SUPER_ADMIN">
                      Super admin (no company)
                    </SelectItem>
                  )}
                  <SelectItem value="COMPANY_ADMIN">Company admin</SelectItem>
                  <SelectItem value="COMPANY_USER">Company user</SelectItem>
                </SelectContent>
              </Select>
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
                            : companies.length === 0
                              ? "No companies — create one first"
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
                  {form.userRole !== "SUPER_ADMIN" &&
                    companies.length === 0 && (
                      <p className="text-xs text-red-600">
                        Create at least one company before creating company
                        users.
                      </p>
                    )}
                </>
              ) : (
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
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            saving ||
            // SUPER_ADMIN creating a non-super user must pick a company.
            (!editingUser &&
              isSuper &&
              form.userRole !== "SUPER_ADMIN" &&
              !form.companyId)
          }
        >
          {saving
            ? "Saving..."
            : editingUser
              ? "Update user"
              : "Create user"}
        </Button>
      </div>
    </form>
  );
}
