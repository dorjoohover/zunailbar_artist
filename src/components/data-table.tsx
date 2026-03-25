"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { DEFAULT_LIMIT } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ChevronLeft,
  ChevronRight,
  CircleX,
  FileText,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { useSidebar } from "./ui/sidebar";
import { ScrollAreaViewport } from "@radix-ui/react-scroll-area";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  limit?: number;
  count?: number;
  loading?: boolean;
  refresh: <T>({
    page,
    limit,
    sort,
    filter,
  }: {
    page?: number;
    limit?: number;
    sort?: boolean;
    filter?: T;
  }) => void;
  modalAdd?: React.ReactNode;
  filter?: ReactNode;
  excel?: <T>({
    page,
    limit,
    sort,
    filter,
  }: {
    page?: number;
    limit?: number;
    sort?: boolean;
    filter?: T;
  }) => void;
  clear?: () => void;
  filterRight?: ReactNode;
  search?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  excel,
  count = 0,
  limit = DEFAULT_LIMIT,
  refresh,
  loading = false,
  modalAdd,
  clear,
  filter,
  filterRight,
  search = true,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: limit,
  });
  const onPaginationChange = (updater: any) => {
    setPagination((old) => {
      const newPagination =
        typeof updater === "function" ? updater(old) : updater;
      return newPagination;
    });
  };
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) {
      refresh({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        filter: globalFilter,
      });
    } else {
      mounted.current = true;
    }
    // mounted.current
    //   ? globalFilter.length > 1 || globalFilter.length == 0 refresh({
    //       page: pagination.pageIndex,
    //       limit: pagination.pageSize,
    //       filter: globalFilter,
    //     })
    //   : (mounted.current = true);
  }, [pagination.pageIndex, pagination.pageSize, globalFilter]);
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      pagination: pagination,
    },
    pageCount: Math.ceil(count / limit),
    manualPagination: true,
    onPaginationChange,
    onGlobalFilterChange: (e) => {
      console.log(e, "filter");
      setGlobalFilter(e);
    },
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
  });

  const totalPages = Math.ceil(count / limit);
  const currentPage = pagination.pageIndex;

  const downloadExcel = () => {
    if (excel) {
      excel({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        filter: globalFilter,
      });
    }
  };

  // const [width, setWidth] = useState(0);

  // useEffect(() => {
  //   // Handler to call on window resize
  //   const handleResize = () => setWidth(window.innerWidth);

  //   // Set initial width
  //   handleResize();

  //   // Listen for resize events
  //   window.addEventListener("resize", handleResize);

  //   // Cleanup listener on unmount
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  const { open } = useSidebar();

  useEffect(() => {
    if (open) {
    } else {
      // console.log("Sidebar close!");
    }
  }, [open]); // open өөрчлөгдөх бүрт ажиллана

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = React.useState(false);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setAtEnd(el.scrollLeft >= maxScroll - 5);
    };

    el.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "space-y-4 w-full transition-all duration-300",
        open
          ? "lg:w-[calc(100vw-20rem-3rem)] w-[calc(100vw-2rem)]"
          : "lg:w-[calc(100vw-8rem)] w-[calc(100vw-2rem)]",
      )}
    >
      {/* Table filter */}
      {(filter || filterRight) && (
        <div className="flex justify-between bg-white rounded-2xl  items-center shadow-light border-light p-3">
          {filter && (
            <div className="flex flex-wrap  items-end gap-1 ">
              {filter}
              <Button
                variant="ghost"
                onClick={clear}
                className="text-xs text-red-500 hover:text-red-500 bg-red-50 hover:bg-red-100  lg:h-10"
              >
                <CircleX />
              </Button>
            </div>
          )}
          {filterRight && filterRight}
        </div>
      )}

      {/* Filterees dooshig */}
      <div className="bg-white rounded-xl shadow-light border-light p-5 pt-0">
        {/* Table action */}
        <div className="w-full flex justify-between gap-4 lg:gap-20 py-5">
          {/* Search */}
          <div className="relative w-full max-w-xl space-y-2">
            {search && (
              <>
                <Search
                  className="size-5 absolute top-[50%] -translate-y-[50%] left-2 text-slate-600"
                  strokeWidth={2.5}
                />

                <Input
                  placeholder="Хайх..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 text-sm! bg-white"
                />
              </>
            )}
          </div>

          {/* Excel || Add button  */}
          <div className="flex items-center justify-end space-x-2">
            {/* Add modal button */}
            {excel && (
              <Button
                variant={"ghost"}
                onClick={downloadExcel}
                className="bg-green-500 text-white hover:bg-green-500/80 gap-1 hover:text-white"
              >
                <FileText />
                Excel
              </Button>
            )}
            {modalAdd && <div> {modalAdd}</div>}
          </div>
        </div>

        <ScrollArea className={cn("h-fit w-full transition-all duration-300")}>
          {/* Table */}
          <ScrollAreaViewport ref={viewportRef}>
            <div className="overflow-hidden border-slate-200">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        <div className="flex items-center justify-center gap-x-2">
                          <LoaderCircle className="animate-spin text-slate-700 size-8" />
                          Уншиж байна
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={cn()}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Хоосон байна
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollAreaViewport>
          <ScrollBar orientation="horizontal" className="" />
        </ScrollArea>

        {/* Table bottom action */}
        <div className="flex items-center mt-10 justify-between">
          {/* Hervee table row check hiivel heregtei */}
          <div>
            {/* <p className="text-sm font-medium">{table.getSelectedRowModel().rows.length} мөр сонгогдсон.</p> */}
          </div>

          {/* Table pagination */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-3 h-11">
              <div className="flex items-center h-full px-3 pl-1 bg-white rounded-lg gap-x-2 border-gray-200">
                <Select
                  value={(currentPage + 1).toString()}
                  onValueChange={(value) => {
                    const page = Number(value);
                    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="pl-2 pr-1 bg-gray-100 border-none rounded-sm shadow-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <SelectItem key={page} value={page.toString()}>
                          {page}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                of
                {/* <span>/</span> */}
                <p>{Math.ceil(count / limit)}</p>
              </div>

              <div className="flex h-full gap-x-1">
                <Button
                  variant="outline"
                  className="h-full bg-white shadow-none aspect-square"
                  onClick={() =>
                    setPagination((old) => ({
                      ...old,
                      pageIndex: Math.max(old.pageIndex - 1, 0),
                    }))
                  }
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="size-6" />
                </Button>

                <Button
                  variant="outline"
                  className="h-full bg-white shadow-none aspect-square"
                  onClick={() =>
                    setPagination((old) => ({
                      ...old,
                      pageIndex: Math.min(old.pageIndex + 1, totalPages - 1),
                    }))
                  }
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="size-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
