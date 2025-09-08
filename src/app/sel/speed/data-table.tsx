"use client"

import * as React from "react"
import { DataGrid, Column, SortColumn } from "react-data-grid"
import { useSearchParams } from "next/navigation"

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
import { X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"

interface DataTableProps<TData> {
    columns: Column<TData & { rank: number }>[]
    data: TData[]
    availableSeasons: number[]
    selectedSeasons: number[]
    onSeasonsChange: (seasons: number[]) => void
    availableTeams: string[]
    selectedTeams: string[]
    onTeamsChange: (teams: string[]) => void
    availableTracks: string[]
    selectedTracks: string[]
    onTracksChange: (tracks: string[]) => void
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
    availableTracks,
    selectedTracks,
    onTracksChange,
    isLoading = false,
}: DataTableProps<TData>) {
    const searchParams = useSearchParams()

    // Initialize nameFilter from URL search params
    const [nameFilter, setNameFilter] = React.useState(() => searchParams.get('search') || "")

    // Initialize pagination from URL search params
    const [currentPage, setCurrentPage] = React.useState(() => {
        const page = searchParams.get('page')
        return page ? parseInt(page, 10) : 1
    })
    const [pageSize, setPageSize] = React.useState(() => {
        const size = searchParams.get('pageSize')
        return size ? parseInt(size, 10) : 15
    })

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

    // Update URL when nameFilter changes
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

    // Update URL when pagination changes
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (currentPage > 1) {
            params.set('page', currentPage.toString())
        } else {
            params.delete('page')
        }

        if (pageSize !== 15) {
            params.set('pageSize', pageSize.toString())
        } else {
            params.delete('pageSize')
        }

        // Convert URLSearchParams to string and decode commas
        const queryString = params.toString().replace(/%2C/g, ',')

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${queryString}`)
    }, [currentPage, pageSize, searchParams])

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

    // Filter data based on name filter (client-side filtering)
    const filteredData = React.useMemo(() => {
        // Ensure data is always an array
        const safeData = Array.isArray(data) ? data : []
        let filtered = safeData

        // Filter by name
        if (nameFilter) {
            filtered = filtered.filter((row: any) =>
                `${row.rider_name} ${row.rider_surname}`.toLowerCase().includes(nameFilter.toLowerCase())
            )
        }

        return filtered
    }, [data, nameFilter])

    // Sort data
    const sortedData = React.useMemo(() => {
        // Ensure filteredData is always an array
        const safeFilteredData = Array.isArray(filteredData) ? filteredData : []

        if (sortColumns.length === 0) {
            return safeFilteredData
        }

        return [...safeFilteredData].sort((a, b) => {
            for (const sort of sortColumns) {
                const { columnKey, direction } = sort
                let aValue = a[columnKey]
                let bValue = b[columnKey]

                // Special handling for numeric fields to ensure proper sorting
                if (columnKey === 'heat' || columnKey === 'points' || columnKey === 'max_speed' || columnKey === 'season' || columnKey === 'rank') {
                    aValue = Number(aValue)
                    bValue = Number(bValue)
                }

                let result = 0
                if (aValue < bValue) {
                    result = -1
                }
                if (aValue > bValue) {
                    result = 1
                }

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

    // Paginate the data
    const paginatedData = React.useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return rankedData.slice(startIndex, endIndex)
    }, [rankedData, currentPage, pageSize])

    // Calculate pagination info
    const totalItems = rankedData.length
    const totalPages = Math.ceil(totalItems / pageSize)

    // Reset page to 1 when filters change and current page becomes invalid
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1)
        }
    }, [currentPage, totalPages])

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

    const handleTrackToggle = (track: string) => {
        const newSelectedTracks = selectedTracks.includes(track)
            ? selectedTracks.filter(t => t !== track)
            : [...selectedTracks, track]

        onTracksChange(newSelectedTracks)
    }

    const clearAllTracks = () => {
        onTracksChange([])
    }

    return (
        <div>
            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                    <div className="relative max-w-sm">
                        <Input
                            placeholder="Search by rider name..."
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
                                Tracks ({
                                    selectedTracks.length === 0
                                        ? 'All'
                                        : selectedTracks.length === 1
                                            ? selectedTracks[0]
                                            : selectedTracks.length
                                })
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Filter by Track</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {selectedTracks.length > 0 && (
                                <>
                                    <DropdownMenuCheckboxItem
                                        className="text-red-600"
                                        checked={false}
                                        onCheckedChange={clearAllTracks}
                                    >
                                        Clear all
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            {availableTracks.map((track) => (
                                <div
                                    key={track}
                                    className="relative flex cursor-default items-center rounded-sm py-1.5 px-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedTracks.includes(track)}
                                        onChange={() => handleTrackToggle(track)}
                                        className="mr-2 size-4 cursor-pointer accent-primary"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                        className="underline underline-offset-2 hover:no-underline text-left flex-1 capitalize"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTracksChange([track]);
                                        }}
                                    >
                                        {track}
                                    </button>
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
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
                
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                    </span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value))
                            setCurrentPage(1)
                        }}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value={15}>15 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                        <option value={200}>200 per page</option>
                    </select>
                </div>
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
                            rows={paginatedData}
                            sortColumns={sortColumns}
                            onSortColumnsChange={setSortColumns}
                            rowKeyGetter={(row) => `rank-${row.rank}`}
                            defaultColumnOptions={{
                                sortable: true,
                                resizable: true,
                            }}
                            style={{
                                height: `${Math.max(400, paginatedData.length * 35 + 80)}px`,
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            First
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {(() => {
                            const pages = []
                            const startPage = Math.max(1, currentPage - 2)
                            const endPage = Math.min(totalPages, currentPage + 2)
                            
                            if (startPage > 1) {
                                pages.push(
                                    <Button
                                        key={1}
                                        variant={currentPage === 1 ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(1)}
                                    >
                                        1
                                    </Button>
                                )
                                if (startPage > 2) {
                                    pages.push(<span key="ellipsis1" className="px-2">...</span>)
                                }
                            }
                            
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <Button
                                        key={i}
                                        variant={currentPage === i ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(i)}
                                    >
                                        {i}
                                    </Button>
                                )
                            }
                            
                            if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                    pages.push(<span key="ellipsis2" className="px-2">...</span>)
                                }
                                pages.push(
                                    <Button
                                        key={totalPages}
                                        variant={currentPage === totalPages ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(totalPages)}
                                    >
                                        {totalPages}
                                    </Button>
                                )
                            }
                            
                            return pages
                        })()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            Last
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}