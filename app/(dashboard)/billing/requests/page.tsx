"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  listMyPlanRequests,
  cancelPlanRequest,
  getPlanRequestReceiptUrl,
  type PlanChangeRequest,
  type PlanChangeRequestStatus,
} from "@/api/services/plan-requests.service";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_BADGE: Record<PlanChangeRequestStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  REJECTED: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  CANCELLED: "bg-muted text-muted-foreground",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function BillingRequestsPage() {
  const { refresh: refreshSubscription } = useSubscription();
  const [items, setItems] = useState<PlanChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState<PlanChangeRequest | null>(
    null,
  );
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listMyPlanRequests();
      setItems(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onCancel = async (req: PlanChangeRequest) => {
    setBusyId(req.id);
    try {
      await cancelPlanRequest(req.id);
      toast.success("Request cancelled");
      setConfirmCancel(null);
      await refresh();
      void refreshSubscription();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to cancel request");
    } finally {
      setBusyId(null);
    }
  };

  const openReceipt = async (req: PlanChangeRequest) => {
    try {
      const res = await getPlanRequestReceiptUrl(req.id);
      if (res?.url) window.open(res.url, "_blank", "noopener");
      else toast.message("No receipt was attached to this request");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to open receipt");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Plan Requests</h1>
          <p className="text-sm text-muted-foreground">
            History of every upgrade or downgrade request your company has
            submitted.
          </p>
        </div>
        <Button asChild>
          <Link href="/billing/upgrade">Request upgrade</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Requested plan</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Reviewed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No requests yet.{" "}
                  <Link
                    className="text-primary underline"
                    href="/billing/upgrade"
                  >
                    Submit your first request
                  </Link>
                  .
                </TableCell>
              </TableRow>
            )}
            {items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Badge className={STATUS_BADGE[r.status]} variant="outline">
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {r.requestedPlan?.name ?? `Plan #${r.requestedPlanId}`}
                  </div>
                  {r.currentPlan && (
                    <div className="text-xs text-muted-foreground">
                      from {r.currentPlan.name}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">{r.billingCycle}</TableCell>
                <TableCell>
                  {r.receiptFileName ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() => openReceipt(r)}
                    >
                      View
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fmtDate(r.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.reviewedAt ? (
                    <div>
                      <div>{fmtDate(r.reviewedAt)}</div>
                      {r.reviewedBy && (
                        <div className="text-xs">by {r.reviewedBy.name}</div>
                      )}
                      {r.reviewNotes && (
                        <div className="text-xs italic">"{r.reviewNotes}"</div>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {r.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => setConfirmCancel(r)}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={Boolean(confirmCancel)}
        onOpenChange={(o) => !o && setConfirmCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
            <AlertDialogDescription>
              The reviewer will no longer see this in the queue. You can submit a
              new request afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep request</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCancel && onCancel(confirmCancel)}
            >
              Cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
