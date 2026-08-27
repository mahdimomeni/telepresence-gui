import { createColumnHelper } from "@tanstack/react-table"

import { type DataTableFeatures } from "./data-table-features"

import { models } from "@/../wailsjs/go/models"
import { Badge } from "@/components/ui/badge"
import { DetachButton } from "./detach-button"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronDown, ChevronRight, Info } from "lucide-react"

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, models.Workload>()

export const getColumns = (
    fetchWorkloads: () => void,
    onOpenIntercept: (workloadName: string) => void,
    onOpenReplace: (workloadName: string) => void,
    onOpenDetails: (workload: models.Workload) => void,
    expandedRows?: Set<string>,
    onToggleExpand?: (workloadName: string) => void
) => columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row }) => {
            const workload = row.original
            const isAttached = Boolean(workload.intercept_info && workload.intercept_info.length > 0)
            const isExpanded = expandedRows ? expandedRows.has(workload.name) : false

            return (
                <div className="flex items-center gap-1.5 font-medium">
                    {isAttached && onToggleExpand ? (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 p-0 hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleExpand(workload.name)
                            }}
                            title={isExpanded ? "Collapse details" : "Expand details"}
                        >
                            {isExpanded ? (
                                <ChevronDown className="size-3.5" />
                            ) : (
                                <ChevronRight className="size-3.5" />
                            )}
                        </Button>
                    ) : (
                        <div className="w-6" />
                    )}
                    <span className="truncate">{workload.name}</span>
                </div>
            )
        }
    }),
    columnHelper.accessor("namespace", {
        header: "Namespace",
    }),
    columnHelper.accessor("workload_resource_type", {
        header: "Kind",
        cell: ({ row }) => {
            const workload = row.original

            return (
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {workload.workload_resource_type}
                </Badge>
            )
        }
    }),
    columnHelper.display({
        id: "replicas",
        header: "Replicas",
        cell: ({ row }) => {
            const workload = row.original
            const desired = workload.desired_replicas ?? 0
            const ready = workload.ready_replicas ?? 0
            const isAllReady = desired > 0 && ready === desired
            const isPartial = desired > 0 && ready > 0 && ready < desired
            const isDown = ready === 0

            let badgeVariant = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500/20"
            if (isPartial) {
                badgeVariant = "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-500/20"
            } else if (isDown && desired > 0) {
                badgeVariant = "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-500/20"
            } else if (desired === 0) {
                badgeVariant = "bg-muted text-muted-foreground border-border"
            }

            return (
                <Badge variant="outline" className={`font-mono text-xs ${badgeVariant}`}>
                    {ready}/{desired}
                </Badge>
            )
        }
    }),
    columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => {
            const workload = row.original
            const isAttached = workload.intercept_info && workload.intercept_info.length > 0
            const intercept = isAttached ? workload.intercept_info![0] : null
            const isReplaced = isAttached && Boolean(intercept?.spec?.replace)
            const targetPort = intercept?.spec?.target_port

            if (isReplaced) {
                return (
                    <Badge
                        variant="outline"
                        className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors gap-1"
                        onClick={() => onOpenDetails(workload)}
                        title="Click to view replacement details"
                    >
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Replaced{targetPort ? ` (:${targetPort})` : ""}
                    </Badge>
                )
            }

            if (isAttached) {
                return (
                    <Badge
                        variant="outline"
                        className="border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors gap-1"
                        onClick={() => onOpenDetails(workload)}
                        title="Click to view intercept details"
                    >
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Intercepted{targetPort ? ` (:${targetPort})` : ""}
                    </Badge>
                )
            }

            if (workload.not_interceptable_reason) {
                return (
                    <Badge
                        variant="outline"
                        className="border-border bg-muted/60 text-muted-foreground gap-1 max-w-[150px] truncate cursor-help"
                        title={workload.not_interceptable_reason}
                    >
                        <AlertCircle className="size-3 text-amber-500 shrink-0" />
                        <span className="truncate">Incompatible</span>
                    </Badge>
                )
            }

            if (workload.desired_replicas > 0 && workload.ready_replicas < workload.desired_replicas) {
                return (
                    <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-50/50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 gap-1"
                        title={`Only ${workload.ready_replicas} of ${workload.desired_replicas} replicas are ready`}
                    >
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        Degraded
                    </Badge>
                )
            }

            return (
                <Badge variant="outline" className="border-border text-muted-foreground">
                    Ready
                </Badge>
            )
        }
    }),
    columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const workload = row.original
            const isAttached = workload.intercept_info && workload.intercept_info.length > 0
            const isNonInterceptable = Boolean(workload.not_interceptable_reason)

            if (isAttached) {
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => onOpenDetails(workload)}
                            title="View Intercept/Replace Details"
                        >
                            <Info className="size-3.5 text-primary" />
                            Details
                        </Button>
                        <DetachButton workload={workload} onFetchWorkloads={fetchWorkloads} />
                    </div>
                )
            }

            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenIntercept(workload.name)}
                        disabled={isNonInterceptable}
                        title={isNonInterceptable ? workload.not_interceptable_reason : "Intercept this workload"}
                    >
                        Intercept
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenReplace(workload.name)}
                        disabled={isNonInterceptable}
                        title={isNonInterceptable ? workload.not_interceptable_reason : "Replace this workload"}
                    >
                        Replace
                    </Button>
                </div>
            )
        }
    })
])