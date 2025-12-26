"use client"

import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { columns, Stat } from "./columns"
import { DataTable } from "./data-table"
import { useState, Suspense } from 'react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { useTableParams } from '@/lib/useTableParams';
import GenericTable from '@/components/ui/generic-table'

function SelStatsContent() {
    const {
        search,
        selectedSeasons,
        selectedTeams,
        selectedLeagues,
        selectedHeatsRange,
        setSearch,
        setSeasons,
        setTeams,
        setLeagues,
        setHeats,
    } = useTableParams();
    
    // Build seasons URL with league filter
    const seasonsUrl = (() => {
        const params = new URLSearchParams();
        if (selectedLeagues.length > 0) {
            params.set('leagues', selectedLeagues.join(','));
        }
        const query = params.toString();
        return query ? `/api/sel/stats/seasons?${query}` : '/api/sel/stats/seasons';
    })();
    
    const { data: availableSeasonsRaw, loading: loadingSeasons } = useCachedFetch(seasonsUrl) as { data: unknown, loading: boolean };
    const { data: availableLeaguesRaw, loading: loadingLeagues } = useCachedFetch('/api/sel/stats/leagues') as { data: unknown, loading: boolean };
    
    // Build teams URL with season and league filters
    const teamsUrl = (() => {
        const params = new URLSearchParams();
        if (selectedSeasons.length > 0) {
            params.set('seasons', selectedSeasons.join(','));
        }
        if (selectedLeagues.length > 0) {
            params.set('leagues', selectedLeagues.join(','));
        }
        const query = params.toString();
        return query ? `/api/sel/stats/teams?${query}` : '/api/sel/stats/teams';
    })();
    
    const { data: availableTeamsRaw, loading: loadingTeams } = useCachedFetch(teamsUrl) as { data: unknown, loading: boolean };
    
    // Ensure seasons are numbers (API returns them, but ensure type consistency)
    const availableSeasons: number[] = Array.isArray(availableSeasonsRaw) 
        ? availableSeasonsRaw.map(s => typeof s === 'number' ? s : parseInt(String(s))).filter(n => !isNaN(n))
        : [];
    const availableTeams: string[] = Array.isArray(availableTeamsRaw) ? availableTeamsRaw.map(t => String(t)) : [];
    const availableLeagues: string[] = Array.isArray(availableLeaguesRaw) ? availableLeaguesRaw.map(l => String(l)) : [];

    const handleSeasonsChange = setSeasons
    const handleTeamsChange = setTeams
    const handleLeaguesChange = setLeagues
    const handleHeatsRangeChange = setHeats

    return (
        <div className="px-4 py-2 pb-20">
            <GenericTable apiPath="/api/sel/stats">
                {({ data: fetchedData, isLoading: fetchedLoading }) => (
                    fetchedLoading ? (
                        <div className="rounded-md border p-8 text-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={fetchedData as Stat[]}
                            availableSeasons={availableSeasons}
                            selectedSeasons={selectedSeasons}
                            onSeasonsChange={handleSeasonsChange}
                            availableTeams={availableTeams}
                            selectedTeams={selectedTeams}
                            onTeamsChange={handleTeamsChange}
                            availableLeagues={availableLeagues}
                            selectedLeagues={selectedLeagues}
                            onLeaguesChange={handleLeaguesChange}
                            selectedHeatsRange={selectedHeatsRange}
                            onHeatsRangeChange={handleHeatsRangeChange}
                            isLoading={fetchedLoading}
                        />
                    )
                )}
            </GenericTable>
        </div>
    );
}

export default function SelStatsPage() {
    return (
        <>
            <div className="p-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/">Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/sel">sel</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>stats</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="content-area">
                <h1>sel stats</h1>
                <br />
            </div>
            <Suspense fallback={
                <div className="px-4 py-2 pb-20">
                    <div className="rounded-md border p-8 text-center text-muted-foreground">
                        Loading...
                    </div>
                </div>
            }>
                <SelStatsContent />
            </Suspense>
        </>
    )
}
