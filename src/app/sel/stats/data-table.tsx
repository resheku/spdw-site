"use client"

import * as React from "react"
import { DataGrid, Column, SortColumn } from "react-data-grid"
import { useSearchParams } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, X } from "lucide-react"

interface DataTableProps<TData> {
    columns: Column<TData & { rank: number }>[]
    data: TData[]
    availableSeasons: number[]
    selectedSeasons: number[]
    onSeasonsChange: (seasons: number[]) => void
    availableTeams: string[]
    selectedTeams: string[]
    onTeamsChange: (teams: string[]) => void
    selectedHeatsRange: number[]
    onHeatsRangeChange: (heatsRange: number[]) => void
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
    selectedHeatsRange,
    onHeatsRangeChange,
    isLoading = false,
}: DataTableProps<TData>) {
    const searchParams = useSearchParams()

    // Initialize nameFilter from URL search params, keeping all existing functionality
    const [nameFilter, setNameFilter] = React.useState(() => searchParams.get('search') || "")

    // Initialize sortColumns from URL search params
    const [sortColumns, setSortColumns] = React.useState<readonly SortColumn[]>(() => {
        const sortParam = searchParams.get('sort')
        if (sortParam) {
            try {
                const sortData = JSON.parse(sortParam)
                return Array.isArray(sortData) ? sortData : []
            } catch {
                return []
            }
        }
        return []
    })

    // Update URL when nameFilter changes (keeping the same client-side filtering)
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (nameFilter.trim()) {
            params.set('search', nameFilter.trim())
        } else {
            params.delete('search')
        }

        // Convert URLSearchParams to string and decode commas
        const queryString = params.toString().replace(/%2C/g, ',')

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${queryString}`)
    }, [nameFilter, searchParams])

    // Update URL when sortColumns changes
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (sortColumns.length > 0) {
            params.set('sort', JSON.stringify(sortColumns))
        } else {
            params.delete('sort')
        }

        // Convert URLSearchParams to string and decode all encoded characters for clean URLs
        const queryString = params.toString()
            .replace(/%2C/g, ',')
            .replace(/%3A/g, ':')
            .replace(/%22/g, '"')
            .replace(/%5B/g, '[')
            .replace(/%5D/g, ']')
            .replace(/%7B/g, '{')
            .replace(/%7D/g, '}')

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${queryString}`)
    }, [sortColumns, searchParams])

    // Calculate heats range from data only when data changes (e.g., season filter changes)
    const heatsRange = React.useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            return { min: 0, max: 100 };
        }

        const heatsValues = data
            .map((row: any) => row.Heats)
            .filter((heats: any) => typeof heats === 'number' && !isNaN(heats));

        if (heatsValues.length === 0) {
            return { min: 0, max: 100 };
        }

        const min = Math.min(...heatsValues);
        const max = Math.max(...heatsValues);

        return { min, max };
    }, [data]); // Only recalculate when data changes (e.g., season/team filters)

    // Local state for slider to make it more responsive
    const [localHeatsRange, setLocalHeatsRange] = React.useState<number[]>([]);

    // Update local state when selectedHeatsRange changes or when heatsRange changes
    React.useEffect(() => {
        if (selectedHeatsRange.length === 2) {
            setLocalHeatsRange(selectedHeatsRange);
        } else {
            setLocalHeatsRange([heatsRange.min, heatsRange.max]);
        }
    }, [selectedHeatsRange, heatsRange.min, heatsRange.max]);

    // Debounced update to avoid too many URL updates
    const debouncedHeatsRangeUpdate = React.useCallback(
        React.useMemo(() => {
            let timeoutId: NodeJS.Timeout;
            return (newRange: number[]) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    onHeatsRangeChange(newRange);
                }, 300); // 300ms delay
            };
        }, [onHeatsRangeChange]),
        [onHeatsRangeChange]
    );

    const handleSliderChange = (newRange: number[]) => {
        setLocalHeatsRange(newRange);
        debouncedHeatsRangeUpdate(newRange);
    };

    const resetHeatsFilter = () => {
        const resetRange = [heatsRange.min, heatsRange.max];
        setLocalHeatsRange(resetRange);
        onHeatsRangeChange([]);
    };

    // Filter data based on name filter and heats range (client-side filtering)
    const filteredData = React.useMemo(() => {
        // Ensure data is always an array
        const safeData = Array.isArray(data) ? data : []
        let filtered = safeData

        // Filter by name
        if (nameFilter) {
            filtered = filtered.filter((row: any) =>
                row.Name?.toLowerCase().includes(nameFilter.toLowerCase())
            )
        }

        // Filter by heats range (use local state for immediate feedback, fall back to selected range)
        const activeHeatsRange = localHeatsRange.length === 2 ? localHeatsRange : selectedHeatsRange;
        if (activeHeatsRange.length === 2) {
            const [minHeats, maxHeats] = activeHeatsRange;
            // Simple range check - only filter if not showing full range
            if (minHeats > heatsRange.min || maxHeats < heatsRange.max) {
                filtered = filtered.filter((row: any) => {
                    const heats = row.Heats;
                    return typeof heats === 'number' &&
                        heats >= minHeats &&
                        heats <= maxHeats;
                });
            }
        }

        return filtered
    }, [data, nameFilter, localHeatsRange, selectedHeatsRange, heatsRange.min, heatsRange.max])

    // Sort data
    const sortedData = React.useMemo(() => {
        // Ensure filteredData is always an array
        const safeFilteredData = Array.isArray(filteredData) ? filteredData : []

        if (sortColumns.length === 0) return safeFilteredData

        return [...safeFilteredData].sort((a, b) => {
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
        // Ensure sortedData is always an array
        const safeSortedData = Array.isArray(sortedData) ? sortedData : []

        return safeSortedData.map((row, index) => ({
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
                <div className="relative max-w-sm">
                    <Input
                        placeholder="Search by name..."
                        value={nameFilter}
                        onChange={(event) => setNameFilter(event.target.value)}
                        className="pr-8"
                    />
                    {nameFilter && (
                        <button
                            onClick={() => setNameFilter("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
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
                            <div
                                key={team}
                                className="relative flex cursor-default items-center rounded-sm py-1.5 px-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTeams.includes(team)}
                                    onChange={() => handleTeamToggle(team)}
                                    className="mr-2 size-4 cursor-pointer accent-primary"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    className="underline underline-offset-2 hover:no-underline text-left flex-1 capitalize"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTeamsChange([team]);
                                    }}
                                >
                                    {team}
                                </button>
                            </div>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Heats ({
                                selectedHeatsRange.length === 2
                                    ? `${selectedHeatsRange[0]}-${selectedHeatsRange[1]}`
                                    : 'All'
                            })
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[420px]">
                        <DropdownMenuLabel>Filter by Number of Heats</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuSeparator />
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                                <span>{localHeatsRange[0] || heatsRange.min}</span>
                                <span>{localHeatsRange[1] || heatsRange.max}</span>
                            </div>
                            <Slider
                                value={localHeatsRange.length === 2 ? localHeatsRange : [heatsRange.min, heatsRange.max]}
                                onValueChange={handleSliderChange}
                                min={heatsRange.min}
                                max={heatsRange.max}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                                <span>Min: {heatsRange.min}</span>
                                <span>Max: {heatsRange.max}</span>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            className="text-red-600"
                            checked={false}
                            onCheckedChange={resetHeatsFilter}
                        >
                            Reset filter
                        </DropdownMenuCheckboxItem>
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
                            <div
                                key={season}
                                className="relative flex cursor-default items-center rounded-sm py-1.5 px-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSeasons.includes(season)}
                                    onChange={() => handleSeasonToggle(season)}
                                    className="mr-2 size-4 cursor-pointer accent-primary"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    className="underline underline-offset-2 hover:no-underline text-left flex-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSeasonsChange([season]);
                                    }}
                                >
                                    {season}
                                </button>
                            </div>
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
                                height: `${Math.max(400, (Array.isArray(rankedData) ? rankedData.length : 0 + 1) * 35 + 40)}px`,
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
