import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { features, type DataTableFeatures } from "./data-table-features"
import React from "react"
import { ContextInput } from "@/components/context-input"
import { DataTablePagination } from "./data-table-pagination"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  renderSubRow?: (data: TData) => React.ReactNode
  isRowExpanded?: (data: TData) => boolean
}

function DataTableComponent<TData extends RowData>({
  columns,
  data,
  renderSubRow,
  isRowExpanded,
}: DataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useTable({
    features,
    data,
    columns,
    autoResetPageIndex: false,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      columnFilters,
      sorting,
      pagination,
    },
  })

  const filterValue = (table.getColumn("name")?.getFilterValue() as string) ?? ""
  const handleFilterChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      table.getColumn("name")?.setFilterValue(event.target.value)
    },
    [table]
  )

  return (
    <div>
      <div className="flex items-center py-4">
        <ContextInput
          placeholder="Filter workloads by name..."
          value={filterValue}
          onChange={handleFilterChange}
          className="max-w-sm"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table containerClassName="max-h-[50vh] overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <TableHeader className="sticky top-0 z-10 bg-card border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const isSorted = header.column.getIsSorted()

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <div
                          className="flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground transition-colors group"
                          onClick={header.column.getToggleSortingHandler()}
                          title={
                            isSorted === "asc"
                              ? "Sorted ascending. Click to sort descending"
                              : isSorted === "desc"
                              ? "Sorted descending. Click to clear sort"
                              : "Click to sort"
                          }
                        >
                          <table.FlexRender header={header} />
                          {isSorted === "asc" ? (
                            <ArrowUp className="size-3.5 text-primary shrink-0" />
                          ) : isSorted === "desc" ? (
                            <ArrowDown className="size-3.5 text-primary shrink-0" />
                          ) : (
                            <ArrowUpDown className="size-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                          )}
                        </div>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const expanded = isRowExpanded ? isRowExpanded(row.original) : false

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className={expanded ? "border-b-0 bg-muted/20" : ""}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                    {expanded && renderSubRow && (
                      <TableRow className="hover:bg-transparent border-b bg-muted/10">
                        <TableCell colSpan={columns.length} className="px-4 py-2 pt-0">
                          {renderSubRow(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No workloads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent