"use client";

import { useEffect, useState } from "react";
import {
  useInventory,
  DeadStockRow,
  SalesVelocityReport,
  TurnoverReport,
  ProfitPerProductReport,
  ReorderSuggestion,
} from "@/config/inventory/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconReportAnalytics, IconRefresh } from "@tabler/icons-react";
import { RouteGuard } from "@/components/route-guard";

export default function InventoryReportsPage() {
  const {
    getDeadStock,
    getSalesVelocity,
    getTurnover,
    getProfitPerProduct,
    getReorderSuggestions,
  } = useInventory();

  const [days, setDays] = useState(90);
  const [salesDays, setSalesDays] = useState(30);

  const [dead, setDead] = useState<DeadStockRow[]>([]);
  const [vel, setVel] = useState<SalesVelocityReport | null>(null);
  const [turnover, setTurnover] = useState<TurnoverReport | null>(null);
  const [profit, setProfit] = useState<ProfitPerProductReport | null>(null);
  const [reorder, setReorder] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [d, v, t, p, r] = await Promise.all([
      getDeadStock(days),
      getSalesVelocity(salesDays),
      getTurnover(days),
      getProfitPerProduct(salesDays),
      getReorderSuggestions(),
    ]);
    setDead(d);
    setVel(v);
    setTurnover(t);
    setProfit(p);
    setReorder(r);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <RouteGuard permission="inventory.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <IconReportAnalytics className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Inventory analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Label className="text-xs">Window (days)</Label>
              <Input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 90)}
                className="h-8 w-20"
              />
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs">Sales window</Label>
              <Input
                type="number"
                min="1"
                value={salesDays}
                onChange={(e) => setSalesDays(Number(e.target.value) || 30)}
                className="h-8 w-20"
              />
            </div>
            <Button variant="outline" onClick={fetchAll}>
              <IconRefresh className="me-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="reorder" className="w-full">
          <TabsList>
            <TabsTrigger value="reorder">Reorder suggestions</TabsTrigger>
            <TabsTrigger value="velocity">Sales velocity</TabsTrigger>
            <TabsTrigger value="dead">Dead stock</TabsTrigger>
            <TabsTrigger value="turnover">Turnover</TabsTrigger>
            <TabsTrigger value="profit">Profit per product</TabsTrigger>
          </TabsList>

          {/* Reorder suggestions */}
          <TabsContent value="reorder" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Items needing reorder ({reorder.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Velocity / day</TableHead>
                      <TableHead>Lead time</TableHead>
                      <TableHead>Reorder point</TableHead>
                      <TableHead>Suggested qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-20" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : reorder.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-20">
                          Nothing needs reordering.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reorder.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.name}
                            {r.sku && (
                              <span className="text-xs text-muted-foreground ms-1">
                                ({r.sku})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{r.totalStock}</TableCell>
                          <TableCell>{r.velocityPerDay.toFixed(2)}</TableCell>
                          <TableCell>{r.leadTimeDays}d</TableCell>
                          <TableCell>{r.reorderPoint}</TableCell>
                          <TableCell>
                            <Badge>{r.suggestedQuantity}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales velocity */}
          <TabsContent value="velocity" className="mt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fast moving</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Per day</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(vel?.fastMoving ?? []).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.soldQty}</TableCell>
                          <TableCell>{r.velocityPerDay.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {!loading && (vel?.fastMoving ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center h-16">
                            No data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Slow moving</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Per day</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(vel?.slowMoving ?? []).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.soldQty}</TableCell>
                          <TableCell>{r.velocityPerDay.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {!loading && (vel?.slowMoving ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center h-16">
                            No data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dead stock */}
          <TabsContent value="dead" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Dead stock — no OUT in last {days} days ({dead.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Last OUT</TableHead>
                      <TableHead>Days idle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dead.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.totalStock}</TableCell>
                        <TableCell className="text-xs">
                          {d.lastOutAt
                            ? new Date(d.lastOutAt).toLocaleDateString()
                            : "never"}
                        </TableCell>
                        <TableCell>
                          {d.daysSinceLastOut == null
                            ? "—"
                            : `${d.daysSinceLastOut}d`}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && dead.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-16">
                          No dead stock 🎉
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Turnover */}
          <TabsContent value="turnover" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Turnover — last {turnover?.windowDays ?? days} days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Stat label="COGS" value={turnover?.cogs.toFixed(2)} />
                  <Stat
                    label="Avg inventory $"
                    value={turnover?.avgInventoryValue.toFixed(2)}
                  />
                  <Stat
                    label="Turnover rate"
                    value={turnover?.turnoverRate.toFixed(2)}
                  />
                  <Stat
                    label="Days of inventory"
                    value={
                      turnover?.daysOfInventory == null
                        ? "—"
                        : turnover.daysOfInventory.toFixed(0)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit per product */}
          <TabsContent value="profit" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Profit per product — last {profit?.windowDays ?? salesDays} days
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Units sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>COGS</TableHead>
                      <TableHead>Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(profit?.items ?? []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.unitsSold}</TableCell>
                        <TableCell>{p.revenue.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.cogs.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={
                            p.profit >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {p.profit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && (profit?.items ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-16">
                          No sales data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RouteGuard>
  );
}

function Stat({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-xl font-bold">{value ?? "—"}</div>
    </div>
  );
}
