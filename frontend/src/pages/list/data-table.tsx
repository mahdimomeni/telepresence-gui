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
import React, { useMemo, useState, useCallback } from "react"
import { ContextInput } from "@/components/context-input"
import { DataTablePagination } from "./data-table-pagination"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  X,
  Filter,
  Radio,
  Layers,
  Boxes,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { models } from "@/../wailsjs/go/models"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  renderSubRow?: (data: TData) => React.ReactNode
  isRowExpanded?: (data: TData) => boolean
}

type StatusFilter = "all" | "active" | "ready" | "issues"

function DataTableComponent<TData extends RowData>({
  columns,
  data,
  renderSubRow,
  isRowExpanded,
}: DataTableProps<TData>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [kindFilter, setKindFilter] = useState<string>("all")

  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // Extract unique kinds for dropdown filter
  const uniqueKinds = useMemo(() => {
    const kinds = new Set<string>()
    for (const item of data as unknown as models.Workload[]) {
      if (item.workload_resource_type) {
        kinds.add(item.workload_resource_type)
      }
    }
    return Array.from(kinds).sort()
  }, [data])

  // Count items by status
  const statusCounts = useMemo(() => {
    let active = 0
    let ready = 0
    let issues = 0

    for (const item of data as unknown as models.Workload[]) {
      const isAttached = Boolean(item.intercept_info && item.intercept_info.length > 0)
      if (isAttached) {
        active++
      } else if (item.not_interceptable_reason || (item.desired_replicas > 0 && item.ready_replicas < item.desired_replicas)) {
        issues++
      } else {
        ready++
      }
    }

    return {
      all: data.length,
      active,
      ready,
      issues,
    }
  }, [data])

  // Filter dataset based on search, status, and kind
  const filteredData = useMemo(() => {
    return (data as unknown as models.Workload[]).filter((workload) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = workload.name?.toLowerCase().includes(q)
        const matchNs = workload.namespace?.toLowerCase().includes(q)
        const matchKind = workload.workload_resource_type?.toLowerCase().includes(q)
        if (!matchName && !matchNs && !matchKind) return false
      }

      // 2. Status Filter
      const isAttached = Boolean(workload.intercept_info && workload.intercept_info.length > 0)
      const hasIssues = Boolean(
        workload.not_interceptable_reason ||
        (workload.desired_replicas > 0 && workload.ready_replicas < workload.desired_replicas)
      )

      if (statusFilter === "active" && !isAttached) return false
      if (statusFilter === "ready" && (isAttached || hasIssues)) return false
      if (statusFilter === "issues" && !hasIssues) return false

      // 3. Kind Filter
      if (kindFilter !== "all" && workload.workload_resource_type !== kindFilter) {
        return false
      }

      return true
    }) as unknown as TData[]
  }, [data, searchQuery, statusFilter, kindFilter])

  const table = useTable({
    features,
    data: filteredData,
    columns,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  })

  const handleResetFilters = useCallback(() => {
    setSearchQuery("")
    setStatusFilter("all")
    setKindFilter("all")
  }, [])

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || kindFilter !== "all"

  return (
    <div className="space-y-3">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <ContextInput
            placeholder="Search workloads by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs bg-background/80"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & Kind Dropdown */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center p-0.5 rounded-lg border bg-muted/40 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === "active"
                  ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Active ({statusCounts.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ready")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                statusFilter === "ready"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ready ({statusCounts.ready})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("issues")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === "issues"
                  ? "bg-card text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Issues ({statusCounts.issues})
            </button>
          </div>

          {uniqueKinds.length > 1 && (
            <Select value={kindFilter} onValueChange={(val) => setKindFilter(val || "all")}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Kinds</SelectItem>
                {uniqueKinds.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              title="Reset all filters"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-border/70 bg-card/50 shadow-xs">
        <Table containerClassName="max-h-[52vh] overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const isSorted = header.column.getIsSorted()

                  return (
                    <TableHead key={header.id} className="text-xs font-semibold py-2.5 text-muted-foreground">
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
                            <ArrowUpDown className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
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
                      className={`transition-colors ${
                        expanded
                          ? "border-b-0 bg-primary/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2.5">
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                    {expanded && renderSubRow && (
                      <TableRow className="hover:bg-transparent border-b bg-muted/15">
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
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2 py-4">
                    <Boxes className="size-6 text-muted-foreground/40" />
                    <p className="text-xs font-medium">
                      {hasActiveFilters
                        ? "No workloads match the selected filter criteria."
                        : "No workloads found."}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-7 text-xs gap-1"
                      >
                        <RotateCcw className="size-3" />
                        Clear Filter
                      </Button>
                    )}
                  </div>
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