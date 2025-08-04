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
    columns: Column<TData & { rank: number }>[]
    data: TData[]
    availableSeasons: number[]
    selectedSeasons: number[]
    onSeasonsChange: (seasons: number[]) => void
    availableTeams: string[]
    selectedTeams: string[]
    onTeamsChange: (teams: string[]) => void
    isLoading?: boolean
}

export function DataTable<TData extends Record<string, any>>({
    columns,
    data,
    availableSeasons,
    selectedSeasons,
    onSeasonsChange,
    availableTeams,
    selectedTeams,
    onTeamsChange,
    isLoading = false,
}: DataTableProps<TData>) {
    const [nameFilter, setNameFilter] = React.useState("")
    const [sortColumns, setSortColumns] = React.useState<readonly SortColumn[]>([])

    // Filter data based on name filter (client-side filtering for name still)
    const filteredData = React.useMemo(() => {
        let filtered = data

        // Filter by name
        if (nameFilter) {
            filtered = filtered.filter((row: any) =>
                row.Name?.toLowerCase().includes(nameFilter.toLowerCase())
            )
        }

        return filtered
    }, [data, nameFilter])

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

    // Add rank to sorted data
    const rankedData = React.useMemo(() => {
        return sortedData.map((row, index) => ({
            ...row,
            rank: index + 1
        }))
    }, [sortedData])

    const handleSeasonToggle = (season: number) => {
        const newSelectedSeasons = selectedSeasons.includes(season)
            ? selectedSeasons.filter(s => s !== season)
            : [...selectedSeasons, season]

        onSeasonsChange(newSelectedSeasons)
    }

    const clearAllSeasons = () => {
        onSeasonsChange([])
    }

    const handleTeamToggle = (team: string) => {
        const newSelectedTeams = selectedTeams.includes(team)
            ? selectedTeams.filter(t => t !== team)
            : [...selectedTeams, team]

        onTeamsChange(newSelectedTeams)
    }

    const clearAllTeams = () => {
        onTeamsChange([])
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
                        <Button variant="outline">
                            Teams ({
                                selectedTeams.length === 0
                                    ? 'All'
                                    : selectedTeams.length === 1
                                        ? selectedTeams[0]
                                        : selectedTeams.length
                            })
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Filter by Team</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {selectedTeams.length > 0 && (
                            <>
                                <DropdownMenuCheckboxItem
                                    className="text-red-600"
                                    checked={false}
                                    onCheckedChange={clearAllTeams}
                                >
                                    Clear all
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        {availableTeams.map((team) => (
                            <DropdownMenuCheckboxItem
                                key={team}
                                className="capitalize"
                                checked={selectedTeams.includes(team)}
                                onCheckedChange={() => handleTeamToggle(team)}
                            >
                                {team}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Seasons ({
                                selectedSeasons.length === 0
                                    ? 'All'
                                    : selectedSeasons.length === 1
                                        ? selectedSeasons[0]
                                        : selectedSeasons.length
                            })
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Filter by Season</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {selectedSeasons.length > 0 && (
                            <>
                                <DropdownMenuCheckboxItem
                                    className="text-red-600"
                                    checked={false}
                                    onCheckedChange={clearAllSeasons}
                                >
                                    Clear all
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        {availableSeasons.map((season) => (
                            <DropdownMenuCheckboxItem
                                key={season}
                                className="capitalize"
                                checked={selectedSeasons.includes(season)}
                                onCheckedChange={() => handleSeasonToggle(season)}
                            >
                                {season}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {sortedData.length === 0 ? (
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                    {isLoading ? "Loading..." : "No data found."}
                </div>
            ) : (
                <div className="overflow-hidden rounded-md border">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                            <div className="text-muted-foreground">Loading...</div>
                        </div>
                    )}
                    <div className={isLoading ? "opacity-50" : ""}>
                        <DataGrid
                            columns={columns}
                            rows={rankedData}
                            sortColumns={sortColumns}
                            onSortColumnsChange={setSortColumns}
                            rowKeyGetter={(row) => `${row.Name}-${row.Season}-${row.Team}`}
                            defaultColumnOptions={{
                                sortable: true,
                                resizable: true,
                            }}
                            style={{
                                height: `${Math.max(400, (rankedData.length + 1) * 35 + 40)}px`,
                                '--rdg-border-color': 'hsl(var(--border))',
                                '--rdg-selection-color': 'hsl(var(--accent))',
                                '--rdg-background-color': 'hsl(var(--background))',
                                '--rdg-header-background-color': 'hsl(var(--muted))',
                                '--rdg-row-hover-background-color': 'hsl(var(--muted) / 50%)',
                                border: '1px solid hsl(var(--border))'
                            } as React.CSSProperties}
                            className="rdg-light rdg-bordered"
                            headerRowHeight={40}
                            rowHeight={35}
                            enableVirtualization={false}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
