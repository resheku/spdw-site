"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [selectedSeasons, setSelectedSeasons] = React.useState<number[]>([])

    // Extract unique seasons from data
    const uniqueSeasons = React.useMemo(() => {
        const seasons = Array.from(new Set(
            data.map((row: any) => row.Season).filter(Boolean)
        )).sort((a, b) => b - a) // Sort descending
        return seasons as number[]
    }, [data])

    // Filter data based on selected seasons
    const filteredData = React.useMemo(() => {
        if (selectedSeasons.length === 0) {
            return data
        }
        return data.filter((row: any) => selectedSeasons.includes(row.Season))
    }, [data, selectedSeasons])

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    const handleSeasonToggle = (season: number) => {
        setSelectedSeasons(prev =>
            prev.includes(season)
                ? prev.filter(s => s !== season)
                : [...prev, season]
        )
    }

    return (
        <div>
            <div className="flex items-center py-4 gap-4">
                <Input
                    placeholder="Search ..."
                    value={(table.getColumn("Name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("Name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Seasons ({selectedSeasons.length > 0 ? selectedSeasons.length : 'All'})
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Filter by Season</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {uniqueSeasons.map((season) => (
                            <DropdownMenuCheckboxItem
                                key={season}
                                className="capitalize"
                                checked={selectedSeasons.includes(season)}
                                onCheckedChange={() => handleSeasonToggle(season)}
                            >
                                {season}
                            </DropdownMenuCheckboxItem>
                        ))}
                        {selectedSeasons.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    className="text-red-600"
                                    checked={false}
                                    onCheckedChange={() => setSelectedSeasons([])}
                                >
                                    Clear all
                                </DropdownMenuCheckboxItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
