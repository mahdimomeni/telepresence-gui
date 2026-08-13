import { createColumnHelper } from "@tanstack/react-table"

import { InterceptDialog } from "@/components/intercept-dialog"

import { type DataTableFeatures } from "./data-table-features"

import { main as models } from "@/../wailsjs/go/models"
import { Button } from "@/components/ui/button"

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, models.Workload>()

export const getColumns = (fetchWorkloads: () => void) => columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
    }),
    columnHelper.accessor("namespace", {
        header: "Namespace",
    }),
    columnHelper.accessor("workload_resource_type", {
        header: "Resource Type",
    }),
    columnHelper.display({
        id: "intercept",
        cell: ({ row }) => {
            const workload = row.original

            return (
                <>
                {workload['intercept_info'] ?
                    <Button variant="destructive">Detach</Button> :
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