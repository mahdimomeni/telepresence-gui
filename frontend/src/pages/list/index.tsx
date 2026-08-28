import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ServerOff, Radio, Layers, AlertTriangle, LogOut, Boxes } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { models } from "@/../wailsjs/go/models";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import { EventsOff, EventsOn } from "../../../wailsjs/runtime/runtime";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { TelepresenceService } from "@/services/telepresence";
import { CoreService } from "@/services/core";
import { InterceptDialog } from "@/components/intercept-dialog";
import { ReplaceDialog } from "@/components/replace-dialog";
import { WorkloadDetailsDialog } from "@/components/workload-details-dialog";
import { InterceptRowDetails } from "./intercept-row-details";

export function ListPage({ onDisconnect }: { onDisconnect: () => void }) {
  const [workloads, setWorkloads] = useState<models.Workload[]>([]);
  const [error, setError] = useState("");
  const [interceptTarget, setInterceptTarget] = useState<string | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const [selectedWorkloadForDetails, setSelectedWorkloadForDetails] =
    useState<models.Workload | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const isScanning = useLoadingStore(state => state.isLoading("workloads"));
  const isDisconnecting = useLoadingStore(state => state.isLoading("connection"));
  const loading = isScanning || isDisconnecting;

  const startLoading = useLoadingStore(state => state.startLoading);
  const stopLoading = useLoadingStore(state => state.stopLoading);
  const setLoading = useLoadingStore(state => state.setLoading);

  const fetchWorkloads = useCallback(async () => {
    startLoading("workloads");
    setError("");

    try {
      const data = await TelepresenceService.listWorkloads();
      setWorkloads(data || []);
    } catch (err) {
      console.error(err);
      setError(String(err));
      CoreService.notify("Telepresence Workloads Fetch Error", String(err));
    } finally {
      stopLoading("workloads");
    }
  }, [startLoading, stopLoading]);

  const handleDisconnect = useCallback(async () => {
    startLoading("connection");

    try {
      await TelepresenceService.disconnect();
      onDisconnect();
    } catch (err) {
      CoreService.notify("Telepresence Disconnection Error", String(err));
    } finally {
      stopLoading("connection");
    }
  }, [startLoading, stopLoading, onDisconnect]);

  const handleOpenIntercept = useCallback((name: string) => {
    setInterceptTarget(name);
  }, []);

  const handleCloseIntercept = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setInterceptTarget(null);
    }
  }, []);

  const handleOpenReplace = useCallback((name: string) => {
    setReplaceTarget(name);
  }, []);

  const handleCloseReplace = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setReplaceTarget(null);
    }
  }, []);

  const handleOpenDetails = useCallback((workload: models.Workload) => {
    setSelectedWorkloadForDetails(workload);
  }, []);

  const handleToggleExpand = useCallback((workloadName: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(workloadName)) {
        next.delete(workloadName);
      } else {
        next.add(workloadName);
      }
      return next;
    });
  }, []);

  const isRowExpanded = useCallback(
    (workload: models.Workload) => expandedRows.has(workload.name),
    [expandedRows]
  );

  const renderSubRow = useCallback(
    (workload: models.Workload) => {
      return (
        <InterceptRowDetails
          workload={workload}
          onFetchWorkloads={fetchWorkloads}
          onOpenDetails={handleOpenDetails}
        />
      );
    },
    [fetchWorkloads, handleOpenDetails]
  );

  const columns = useMemo(
    () =>
      getColumns(
        fetchWorkloads,
        handleOpenIntercept,
        handleOpenReplace,
        handleOpenDetails,
        expandedRows,
        handleToggleExpand
      ),
    [
      fetchWorkloads,
      handleOpenIntercept,
      handleOpenReplace,
      handleOpenDetails,
      expandedRows,
      handleToggleExpand,
    ]
  );

  // Workload metrics summary
  const metrics = useMemo(() => {
    let intercepted = 0;
    let replaced = 0;
    let incompatible = 0;
    let degraded = 0;

    for (const w of workloads) {
      const isAttached = Boolean(w.intercept_info && w.intercept_info.length > 0);
      if (isAttached) {
        if (w.intercept_info![0]?.spec?.replace) {
          replaced++;
        } else {
          intercepted++;
        }
      }
      if (w.not_interceptable_reason) {
        incompatible++;
      } else if (w.desired_replicas > 0 && w.ready_replicas < w.desired_replicas) {
        degraded++;
      }
    }

    return {
      total: workloads.length,
      intercepted,
      replaced,
      incompatible,
      degraded,
      active: intercepted + replaced,
    };
  }, [workloads]);

  const activeNamespace = useMemo(() => {
    if (workloads.length > 0 && workloads[0]?.namespace) {
      return workloads[0].namespace;
    }
    return "default";
  }, [workloads]);

  // Keep selectedWorkloadForDetails in sync with latest workloads array
  const activeSelectedWorkload = useMemo(() => {
    if (!selectedWorkloadForDetails) return null;
    return (
      workloads.find(
        w =>
          w.name === selectedWorkloadForDetails.name &&
          w.namespace === selectedWorkloadForDetails.namespace
      ) || selectedWorkloadForDetails
    );
  }, [workloads, selectedWorkloadForDetails]);

  useEffect(() => {
    let ignore = false;
    TelepresenceService.listWorkloads()
      .then(data => {
        if (!ignore) {
          setWorkloads(data || []);
        }
      })
      .catch(err => {
        if (!ignore) {
          console.error(err);
          setError(String(err));
          CoreService.notify("Telepresence Workloads Fetch Error", String(err));
        }
      });

    EventsOn("workloads-changed", (updatedWorkloads: models.Workload[]) => {
      setWorkloads(updatedWorkloads || []);
    });

    EventsOn("connection-pending", (status: boolean) => {
      setLoading("connection", status);
    });

    return () => {
      ignore = true;
      EventsOff("workloads-changed");
      EventsOff("connection-pending");
    };
  }, [setLoading]);

  return (
    <Card className="w-full max-w-5xl bg-card/90 backdrop-blur-md border-border/60 shadow-2xl shadow-black/25 flex flex-col hover-card-glow transition-all">
      {/* Header Banner */}
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-xl font-bold tracking-tight">
              Active Workload Session
            </CardTitle>
            <Badge variant="secondary" className="gap-1 font-mono text-xs px-2 py-0.5 shadow-xs">
              ns: <span className="font-semibold text-foreground">{activeNamespace}</span>
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Manage traffic routing, intercepts, and local replacements for cluster workloads.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkloads}
            disabled={loading}
            className="h-8 gap-1.5 text-xs active:scale-95 transition-transform"
            title="Rescan cluster workloads"
          >
            <RefreshCw className={`size-3.5 ${isScanning ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={loading}
            className="h-8 gap-1.5 text-xs shadow-xs active:scale-95 transition-transform"
            title="Disconnect Telepresence daemon"
          >
            {isDisconnecting ? (
              <Spinner className="size-3.5 animate-spin" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            <span>Disconnect</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Metric Summary Cards with Staggered Entrance and Hover Glow */}
        {workloads.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-card/60 flex items-center justify-between animate-stagger-1 hover-card-glow transition-all">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Total Workloads
                </span>
                <div className="text-lg font-bold font-mono leading-tight mt-0.5">
                  {metrics.total}
                </div>
              </div>
              <div className="p-2 rounded-md bg-muted text-muted-foreground shadow-xs">
                <Boxes className="size-4" />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between animate-stagger-2 hover-card-glow transition-all">
              <div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Intercepted
                </span>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                  {metrics.intercepted}
                </div>
              </div>
              <div className="p-2 rounded-md bg-emerald-500/15 text-emerald-500 shadow-xs">
                <Radio className="size-4 animate-pulse" />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center justify-between animate-stagger-3 hover-card-glow transition-all">
              <div>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Replaced
                </span>
                <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                  {metrics.replaced}
                </div>
              </div>
              <div className="p-2 rounded-md bg-amber-500/15 text-amber-500 shadow-xs">
                <Layers className="size-4 animate-pulse" />
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card/60 flex items-center justify-between animate-stagger-4 hover-card-glow transition-all">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Degraded / Issues
                </span>
                <div className="text-lg font-bold font-mono text-muted-foreground leading-tight mt-0.5">
                  {metrics.incompatible + metrics.degraded}
                </div>
              </div>
              <div className="p-2 rounded-md bg-muted text-muted-foreground shadow-xs">
                <AlertTriangle className="size-4" />
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
            <AlertTitle className="font-semibold text-sm">Error Loading Workloads</AlertTitle>
            <AlertDescription className="text-xs font-mono mt-1">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading Skeleton */}
        {isScanning && workloads.length === 0 ? (
          <div className="space-y-3 py-6">
            <div className="flex items-center justify-center gap-2.5 text-xs text-muted-foreground mb-4">
              <Spinner className="size-4" />
              <span>Scanning namespace &quot;{activeNamespace}&quot; for workloads...</span>
            </div>
            <div className="h-10 rounded-md skeleton-shimmer w-full" />
            <div className="h-12 rounded-md skeleton-shimmer w-full opacity-80" />
            <div className="h-12 rounded-md skeleton-shimmer w-full opacity-60" />
            <div className="h-12 rounded-md skeleton-shimmer w-full opacity-40" />
          </div>
        ) : workloads.length === 0 && !error ? (
          <div className="flex flex-col justify-center items-center py-12 text-muted-foreground space-y-3">
            <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
              <ServerOff className="size-8 opacity-60" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-foreground text-sm">
                No workloads found in this namespace
              </p>
              <p className="text-xs max-w-sm text-muted-foreground">
                Verify that your Kubernetes deployments or services are deployed in namespace &quot;
                {activeNamespace}&quot;.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWorkloads}
              className="h-8 gap-1.5 text-xs mt-2"
            >
              <RefreshCw className="size-3.5" />
              Rescan Namespace
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={workloads}
            renderSubRow={renderSubRow}
            isRowExpanded={isRowExpanded}
          />
        )}

        {/* Dialogs */}
        {interceptTarget && (
          <InterceptDialog
            workloadName={interceptTarget}
            open={Boolean(interceptTarget)}
            onOpenChange={handleCloseIntercept}
            onSuccess={fetchWorkloads}
          />
        )}

        {replaceTarget && (
          <ReplaceDialog
            workloadName={replaceTarget}
            open={Boolean(replaceTarget)}
            onOpenChange={handleCloseReplace}
            onSuccess={fetchWorkloads}
          />
        )}

        {activeSelectedWorkload && (
          <WorkloadDetailsDialog
            workload={activeSelectedWorkload}
            open={Boolean(activeSelectedWorkload)}
            onOpenChange={isOpen => {
              if (!isOpen) setSelectedWorkloadForDetails(null);
            }}
            onSuccess={fetchWorkloads}
          />
        )}
      </CardContent>
    </Card>
  );
}
