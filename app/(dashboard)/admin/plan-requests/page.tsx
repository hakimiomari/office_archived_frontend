"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  listPlanRequests,
  approvePlanRequest,
  rejectPlanRequest,
  getPlanRequestReceiptUrl,
  type PlanChangeRequest,
  type PlanChangeRequestStatus,
} from "@/api/services/plan-requests.service";
import { useUser } from "@/contexts/UserContext";
import { usePermission } from "@/hooks/use-permission";
import { notifySubscriptionChanged } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const STATUS_BADGE: Record<PlanChangeRequestStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  REJECTED: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  CANCELLED: "bg-muted text-muted-foreground",
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminPlanRequestsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { can } = usePermission();

  const canReview =
    user?.userRole === "SUPER_ADMIN" || can("plan_request.review");

  const [items, setItems] = useState<PlanChangeRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  const [selected, setSelected] = useState<PlanChangeRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user && !canReview) {
      router.replace("/dashboard");
    }
  }, [user, canReview, router]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listPlanRequests({
        status:
          statusFilter !== "ALL"
            ? (statusFilter as PlanChangeRequestStatus)
            : undefined,
        limit: 100,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReview) void refresh();
  }, [statusFilter, canReview]);

  const openDetail = async (req: PlanChangeRequest) => {
    setSelected(req);
    setReviewNotes("");
    setReceiptUrl(null);
    if (req.receiptFileName) {
      try {
        const r = await getPlanRequestReceiptUrl(req.id);
        setReceiptUrl(r?.url ?? null);
      } catch {
        // ignore — link button still shows
      }
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setReviewNotes("");
    setReceiptUrl(null);
  };

  const onApprove = async () => {
    if (!selected) return;
    setBusy("approve");
    try {
      await approvePlanRequest(selected.id, reviewNotes.trim() || undefined);
      toast.success(`Approved — ${selected.company?.name} switched to ${selected.requestedPlan?.name}`);
      notifySubscriptionChanged();
      closeDetail();
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to approve");
    } finally {
      setBusy(null);
    }
  };

  const onReject = async () => {
    if (!selected) return;
    setBusy("reject");
    try {
      await rejectPlanRequest(selected.id, reviewNotes.trim() || undefined);
      toast.success("Request rejected");
      closeDetail();
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to reject");
    } finally {
      setBusy(null);
    }
  };

  if (user && !canReview) return null;

  const isImage = (url: string | null) =>
    url ? /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url) : false;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Plan Change Requests</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject upgrade requests submitted by tenant admins.
          Approval immediately switches the subscription.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5 sm:w-64">
          <Label>Filter by status</Label>
          <Combobox
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v || "PENDING")}
            options={STATUS_OPTIONS}
            placeholder="Status"
          />
        </div>
        <div className="sm:ml-auto text-sm text-muted-foreground">
          {total} request{total === 1 ? "" : "s"}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Plan change</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No requests match this filter.
                </TableCell>
              </TableRow>
            )}
            {items.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                <TableCell>
                  <Badge variant="outline" className={STATUS_BADGE[r.status]}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.company?.name ?? `#${r.companyId}`}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {r.currentPlan?.name ?? "—"}{" "}
                    <span className="text-muted-foreground">→</span>{" "}
                    <span className="font-medium">
                      {r.requestedPlan?.name ?? `Plan #${r.requestedPlanId}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{r.billingCycle}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fmtDate(r.createdAt)}
                </TableCell>
                <TableCell>
                  {r.receiptFileName ? (
                    <Badge variant="outline">Attached</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(r);
                    }}
                  >
                    {r.status === "PENDING" ? "Review" : "View"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Request #{selected?.id} — {selected?.company?.name}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Current plan</div>
                  <div className="font-medium">
                    {selected.currentPlan?.name ?? "None"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Requested plan</div>
                  <div className="font-medium">
                    {selected.requestedPlan?.name ?? `#${selected.requestedPlanId}`}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cycle</div>
                  <div>{selected.billingCycle}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Submitted by</div>
                  <div>
                    {selected.createdBy?.name ?? "—"}{" "}
                    {selected.createdBy?.email && (
                      <span className="text-xs text-muted-foreground">
                        ({selected.createdBy.email})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Requester notes
                  </div>
                  <div className="whitespace-pre-wrap">{selected.notes}</div>
                </div>
              )}

              {selected.receiptFileName && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Payment receipt</div>
                  {receiptUrl && isImage(receiptUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={receiptUrl}
                      alt="Payment receipt"
                      className="max-h-96 w-auto rounded-md border"
                    />
                  ) : receiptUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={receiptUrl} target="_blank" rel="noopener">
                        Open receipt
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Receipt loading…
                    </span>
                  )}
                </div>
              )}

              {selected.status === "PENDING" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reviewNotes">Review notes (optional)</Label>
                  <textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Visible to the requester after review…"
                    className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}

              {selected.status !== "PENDING" && selected.reviewNotes && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Review notes
                  </div>
                  <div className="whitespace-pre-wrap">{selected.reviewNotes}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDetail} disabled={busy !== null}>
              Close
            </Button>
            {selected?.status === "PENDING" && (
              <>
                <Button
                  variant="destructive"
                  onClick={onReject}
                  disabled={busy !== null}
                >
                  {busy === "reject" ? "Rejecting…" : "Reject"}
                </Button>
                <Button onClick={onApprove} disabled={busy !== null}>
                  {busy === "approve" ? "Approving…" : "Approve & switch plan"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
