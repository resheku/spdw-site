"use client"

import * as React from "react"
import { DataGrid, Column, SortColumn } from "react-data-grid"

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

interface DataTableProps<TData> {
    columns: Column<TData>[]
    data: TData[]
}

export function DataTable<TData extends Record<string, any>>({
    columns,
    data,
}: DataTableProps<TData>) {
    const [nameFilter, setNameFilter] = React.useState("")
    const [selectedSeasons, setSelectedSeasons] = React.useState<number[]>([])
    const [sortColumns, setSortColumns] = React.useState<readonly SortColumn[]>([])

    // Extract unique seasons from data
    const uniqueSeasons = React.useMemo(() => {
        const seasons = Array.from(new Set(
            data.map((row: any) => row.Season).filter(Boolean)
        )).sort((a, b) => b - a) // Sort descending
        return seasons as number[]
    }, [data])

    // Filter data based on name filter and selected seasons
    const filteredData = React.useMemo(() => {
        let filtered = data

        // Filter by name
        if (nameFilter) {
            filtered = filtered.filter((row: any) => 
                row.Name?.toLowerCase().includes(nameFilter.toLowerCase())
            )
        }

        // Filter by seasons
        if (selectedSeasons.length > 0) {
            filtered = filtered.filter((row: any) => selectedSeasons.includes(row.Season))
        }

        return filtered
    }, [data, nameFilter, selectedSeasons])

    // Sort data
    const sortedData = React.useMemo(() => {
        if (sortColumns.length === 0) return filteredData

        return [...filteredData].sort((a, b) => {
            for (const sort of sortColumns) {
                const { columnKey, direction } = sort
                const aValue = a[columnKey]
                const bValue = b[columnKey]

                let result = 0
                if (aValue < bValue) result = -1
                if (aValue > bValue) result = 1

                if (result !== 0) {
                    return direction === 'ASC' ? result : -result
                }
            }
            return 0
        })
    }, [filteredData, sortColumns])

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
                    placeholder="Search by name..."
                    value={nameFilter}
                    onChange={(event) => setNameFilter(event.target.value)}
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
            {sortedData.length === 0 ? (
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                    No data found.
                </div>
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <DataGrid
                        columns={columns}
                        rows={sortedData}
                        sortColumns={sortColumns}
                        onSortColumnsChange={setSortColumns}
                        rowKeyGetter={(row) => `${row.Name}-${row.Season}-${row.Team}`}
                        defaultColumnOptions={{
                            sortable: true,
                            resizable: true,
                        }}
                        style={{ height: '600px' }}
                        className="rdg-light"
                        headerRowHeight={40}
                        rowHeight={35}
                    />
                </div>
            )}
        </div>
    )
}
