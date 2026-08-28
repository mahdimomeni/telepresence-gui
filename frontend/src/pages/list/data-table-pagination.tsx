import { type ReactTable, type RowData } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type DataTableFeatures } from "./data-table-features";

interface DataTablePaginationProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
}

export function DataTablePagination<TData extends RowData>({
  table,
}: DataTablePaginationProps<TData>) {
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const currentPage = table.state.pagination.pageIndex + 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 text-xs">
      <div className="text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filteredCount}</span> workload
        {filteredCount === 1 ? "" : "s"}
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs whitespace-nowrap">Rows:</span>
          <Select
            value={`${table.state.pagination.pageSize}`}
            onValueChange={value => {
              if (value) table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-7 w-17 text-xs">
              <SelectValue placeholder={table.state.pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map(pageSize => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground whitespace-nowrap">
          Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
          <span className="font-semibold text-foreground">{pageCount}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            className="size-7"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First page"
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            className="size-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous page"
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            className="size-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next page"
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            className="size-7"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Last page"
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
