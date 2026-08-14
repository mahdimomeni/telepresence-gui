import { createColumnHelper } from "@tanstack/react-table"

import { InterceptDialog } from "@/components/intercept-dialog"

import { type DataTableFeatures } from "./data-table-features"

import { main as models } from "@/../wailsjs/go/models"
import { Badge } from "@/components/ui/badge"
import { DetachButton } from "./detach-button"

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, models.Workload>()

export const getColumns = (fetchWorkloads: () => void) => columnHelper.columns([
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
        id: "intercept",
        cell: ({ row }) => {
            const workload = row.original

            return (
                <>
                {workload['intercept_info'] ?
                    <DetachButton workload={workload} onFetchWorkloads={fetchWorkloads} /> :
                    <InterceptDialog
                        workloadName={workload.name}
                        onSuccess={fetchWorkloads}
                    />       
                }
                </>
                
            )
        }

    })
])