import { createColumnHelper } from "@tanstack/react-table"

import { type DataTableFeatures } from "./data-table-features"

import { models } from "@/../wailsjs/go/models"
import { Badge } from "@/components/ui/badge"
import { DetachButton } from "./detach-button"
import { Button } from "@/components/ui/button"

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, models.Workload>()

export const getColumns = (
    fetchWorkloads: () => void,
    onOpenIntercept: (workloadName: string) => void,
    onOpenReplace: (workloadName: string) => void
) => columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
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
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{workload.workload_resource_type}</Badge>
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
                    <Badge variant="outline" className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium">
                        Replaced
                    </Badge>
                )
            }

            return (
                <Badge variant="outline" className="border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium">
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
                        <DetachButton workload={workload} onFetchWorkloads={fetchWorkloads} />
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