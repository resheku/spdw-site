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
    const nameInputRef = React.useRef<HTMLInputElement | null>(null)
    const caretRef = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 })
    const pendingSearchRef = React.useRef<string | null>(null)

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

    // DEPRECATED: earlier version used `searchParams` in a callback.
    // Keeping no-op placeholder to avoid accidental references elsewhere.
    // (Replaced below with a window.location-based implementation.)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _applySearchToUrl_deprecated = React.useCallback((_value: string) => {}, [])
    // Helper to apply search param to URL (reads current window.location.search)
    function applySearchToUrl(value: string) {
        const params = new URLSearchParams(window.location.search)
        if (value.trim()) {
            params.set('search', value.trim())
        } else {
            params.delete('search')
        }
        const queryString = params.toString().replace(/%2C/g, ',')
        window.history.replaceState({}, '', `?${queryString}`)
    }

    // Update URL when nameFilter changes (debounced). Do not depend on `searchParams`
    // so unrelated URL changes (like sorting) don't re-run this effect.
    React.useEffect(() => {
        const input = nameInputRef.current
        const wasFocused = !!(input && document.activeElement === input)

        // Debounce URL updates to avoid updating history on every keystroke
        const handle = window.setTimeout(() => {
            // always update the URL so `search` stays in query string
            applySearchToUrl(nameFilter)
            pendingSearchRef.current = null

            // restore focus & caret only if it was focused when the timer started
            if (wasFocused && input) {
                try {
                    const start = Math.min(caretRef.current.start ?? 0, input.value.length)
                    const end = Math.min(caretRef.current.end ?? start, input.value.length)
                    input.focus()
                    input.setSelectionRange(start, end)
                } catch {}
            }
        }, 500)

        return () => clearTimeout(handle)
    }, [nameFilter])

    // Update URL when sortColumns changes so sorting is reflected in the URL
    // but does not trigger server refetch because GenericTable strips `sort`.
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (sortColumns.length > 0) {
            params.set('sort', JSON.stringify(sortColumns))
        } else {
            params.delete('sort')
        }

        // Convert URLSearchParams to string and decode common characters for readability
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

    // Compute dynamic width for the `rank` column based on number of rows
    const columnsWithDynamicRank = React.useMemo(() => {
        // determine digits needed for largest rank
        const rowCount = Array.isArray(rankedData) ? rankedData.length : 0
        const digits = String(Math.max(1, rowCount)).length

        // estimate width: approx 8-10px per digit plus padding
        const perDigit = 10 // px per digit (reasonable default)
        const padding = 12 // left + right padding
        const calculated = digits * perDigit + padding

        const minWidth = 24
        const maxWidth = 120
        const width = Math.min(maxWidth, Math.max(minWidth, calculated))

        return columns.map((col) => {
            if (col.key === "rank") {
                return {
                    ...col,
                    width,
                    minWidth,
                    maxWidth,
                }
            }
            return col
        })
    }, [columns, rankedData])

    // Auto-hide these detailed numeric columns on small screens
    const autoHideKeys = React.useMemo(() => new Set([
        'I','II','III','IV','R','T','M','X','Warn'
    ]), [])

    // Additional keys to hide on even smaller screens
    const extraHideKeys = React.useMemo(() => new Set([
        'Match', 'Heats', 'Points', 'Bonus'
    ]), [])

    const [isNarrow, setIsNarrow] = React.useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        return window.innerWidth < 1100
    })

    const [isExtraNarrow, setIsExtraNarrow] = React.useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        return window.innerWidth < 800
    })

    // Allow user to override hiding on small screens
    const [showHiddenColumns, setShowHiddenColumns] = React.useState<boolean>(false)

    React.useEffect(() => {
        function onResize() {
            const w = window.innerWidth
            setIsNarrow(w < 1100)
            setIsExtraNarrow(w < 800)
        }
        window.addEventListener('resize', onResize)
        onResize()
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const finalColumns = React.useMemo(() => {
        if (showHiddenColumns) return columnsWithDynamicRank
        return columnsWithDynamicRank.filter((col) => {
            try {
                const keyStr = String((col as any).key)
                if (isExtraNarrow && extraHideKeys.has(keyStr)) return false
                if (isNarrow && autoHideKeys.has(keyStr)) return false
            } catch {
                // fallback: keep col
            }
            return true
        })
    }, [columnsWithDynamicRank, isNarrow, isExtraNarrow, autoHideKeys, extraHideKeys, showHiddenColumns])

    // How many columns would be hidden by the responsive rules (regardless of current override)
    const possibleHiddenCount = React.useMemo(() => {
        let count = 0
        columnsWithDynamicRank.forEach((col) => {
            try {
                const keyStr = String((col as any).key)
                if (isExtraNarrow && extraHideKeys.has(keyStr)) {
                    count++
                } else if (isNarrow && autoHideKeys.has(keyStr)) {
                    count++
                }
            } catch {
                // ignore
            }
        })
        return count
    }, [columnsWithDynamicRank, isNarrow, isExtraNarrow, autoHideKeys, extraHideKeys])

    // --- CSV export helpers ---
    const extractText = (node: any): string => {
        if (node === null || node === undefined) return ''
        if (typeof node === 'string' || typeof node === 'number') return String(node)
        if (Array.isArray(node)) return node.map(extractText).join('')
        if (React.isValidElement(node)) {
            const children = (node as any).props?.children
            return extractText(children)
        }
        try { return String(node) } catch { return '' }
    }

    const getColumnLabel = (col: any) => {
        if (!col) return ''
        const { name, key } = col
        if (typeof name === 'string') return name
        return extractText(name) || String(key || '')
    }

    const formatCellForCsv = (col: any, row: any) => {
        try {
            if (typeof col.renderCell === 'function') {
                const node = col.renderCell({ row })
                return extractText(node)
            }
        } catch {
            // fall back
        }
        const { key } = col
        const raw = row?.[key]
        if (raw === null || raw === undefined) return ''
        return typeof raw === 'number' ? String(raw) : String(raw)
    }

    const toCsv = (rows: any[], cols: any[]) => {
        const esc = (value: string) => {
            if (value == null) return ''
            const s = String(value)
            if (s.includes('"')) return '"' + s.replace(/"/g, '""') + '"'
            if (s.includes(',') || s.includes('\n') || s.includes('\r')) return '"' + s + '"'
            return s
        }

        const header = cols.map(getColumnLabel)
        const body = rows.map((r) => cols.map((c) => esc(formatCellForCsv(c, r))))
        return [header.join(','), ...body.map(row => row.join(','))].join('\n')
    }

    const exportCsv = () => {
        try {
            const colsToExport = finalColumns
            const rowsToExport = rankedData
            const csv = toCsv(rowsToExport, colsToExport)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const now = new Date()
            const filename = `sel-stats-${now.toISOString().replace(/[:.]/g, '-')}.csv`
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error('CSV export failed', e)
        }
    }

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

    // If the table data refreshes (e.g. after a fetch), reapply caret position
    // but only if the input is still focused — this prevents stealing focus.
    React.useEffect(() => {
        const input = nameInputRef.current
        if (!input) return
        if (document.activeElement !== input) return
        const max = input.value.length
        const start = Math.min(caretRef.current.start ?? 0, max)
        const end = Math.min(caretRef.current.end ?? start, max)
        try {
            input.setSelectionRange(start, end)
        } catch {
            // ignore
        }
    }, [rankedData])

    return (
        <div className="spdw-data-table">
            <div className="flex flex-col sm:flex-row items-center py-4 gap-4">
                <div className="relative w-full sm:max-w-sm">
                    <Input
                    ref={nameInputRef}
                    placeholder="Search by name..."
                    value={nameFilter}
                    onChange={(event) => {
                        const target = event.target as HTMLInputElement
                        caretRef.current.start = target.selectionStart ?? target.value.length
                        caretRef.current.end = target.selectionEnd ?? target.value.length
                        setNameFilter(target.value)
                    }}
                    onKeyDown={(e) => {
                        const target = e.currentTarget as HTMLInputElement
                        // keep caret up-to-date
                        caretRef.current.start = target.selectionStart ?? target.value.length
                        caretRef.current.end = target.selectionEnd ?? target.value.length
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            applySearchToUrl(nameFilter)
                            pendingSearchRef.current = null
                        }
                    }}
                    onSelect={(e) => {
                        const target = e.currentTarget as HTMLInputElement
                        caretRef.current.start = target.selectionStart ?? target.value.length
                        caretRef.current.end = target.selectionEnd ?? target.value.length
                    }}
                    onBlur={() => {
                        // apply any pending search when user leaves the field
                        applySearchToUrl(pendingSearchRef.current ?? nameFilter)
                        pendingSearchRef.current = null
                    }}
                    className="pr-8 w-full"
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
                        <Button variant="outline" className="w-full sm:w-auto">
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
                        <Button variant="outline" className="w-full sm:w-auto">
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
                        <Button variant="outline" className="w-full sm:w-auto sm:ml-auto">
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
                <Button variant="outline" onClick={exportCsv} className="w-full sm:w-auto sm:ml-2">
                    Export CSV
                </Button>
                {possibleHiddenCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => setShowHiddenColumns(v => !v)}
                        className="w-full sm:w-auto sm:ml-2"
                        aria-pressed={showHiddenColumns}
                    >
                        {showHiddenColumns ? 'Hide columns' : `Show ${possibleHiddenCount} hidden columns`}
                    </Button>
                )}
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
                            columns={finalColumns}
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
