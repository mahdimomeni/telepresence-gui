import { createColumnHelper } from "@tanstack/react-table"

import { type DataTableFeatures } from "./data-table-features"

import { models } from "@/../wailsjs/go/models"
import { Badge } from "@/components/ui/badge"
import { DetachButton } from "./detach-button"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Info } from "lucide-react"

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
    columnHelper.display({
        id: "workload_resource_type",
        header: "Resource Type",
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
        id: "status",
        header: "Status",
        cell: ({ row }) => {
            const workload = row.original
            const isAttached = workload.intercept_info && workload.intercept_info.length > 0
            const isReplaced = isAttached && workload.intercept_info!.some((i) => i.spec?.replace)

            if (!isAttached) {
                return (
                    <Badge variant="outline" className="border-border text-muted-foreground">
                        Ready
                    </Badge>
                )
            }

            if (isReplaced) {
                return (
                    <Badge
                        variant="outline"
                        className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors gap-1"
                        onClick={() => onOpenDetails(workload)}
                        title="Click to view replacement details"
                    >
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Replaced
                    </Badge>
                )
            }

            return (
                <Badge
                    variant="outline"
                    className="border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors gap-1"
                    onClick={() => onOpenDetails(workload)}
                    title="Click to view intercept details"
                >
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Intercepted
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

            return (
                <div className="flex items-center gap-2">
                    {isAttached ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => onOpenIntercept(workload.name)}
                            >
                                Intercept
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onOpenReplace(workload.name)}
                            >
                                Replace
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    })
])