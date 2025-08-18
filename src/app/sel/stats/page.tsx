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
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { useCachedFetchWithParams } from '@/lib/useCachedFetchWithParams';
import { useSearchParams, useRouter } from 'next/navigation';

function SelStatsContent() {
    const [data, setData] = useState<Stat[]>([]);
    const { data: availableSeasonsRaw, loading: loadingSeasons } = useCachedFetch('/api/sel/stats/seasons') as { data: unknown, loading: boolean };
    const { data: availableTeamsRaw, loading: loadingTeams } = useCachedFetch('/api/sel/stats/teams') as { data: unknown, loading: boolean };
    const availableSeasons: number[] = Array.isArray(availableSeasonsRaw) ? availableSeasonsRaw : [];
    const availableTeams: string[] = Array.isArray(availableTeamsRaw) ? availableTeamsRaw : [];
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get selected seasons from URL search params
    const seasonsParam = searchParams.get('season');
    const selectedSeasons = seasonsParam
        ? seasonsParam.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s))
        : [];

    // Get selected teams from URL search params
    const teamsParam = searchParams.get('team');
    const selectedTeams = teamsParam
        ? teamsParam.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

    // Get heats range from URL search params
    const heatsParam = searchParams.get('heats');
    const selectedHeatsRange = heatsParam
        ? heatsParam.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h))
        : []; // Empty array means no filter applied

    // Build the API URL with query params
    const queryParams = new URLSearchParams();
    if (selectedSeasons.length > 0) {
        queryParams.set('season', selectedSeasons.join(','));
    }
    if (selectedTeams.length > 0) {
        queryParams.set('team', selectedTeams.join(','));
    }
    const statsUrl = `/api/sel/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const { data: statsData, loading: loadingStats } = useCachedFetchWithParams(statsUrl);

    const handleSeasonsChange = useCallback((seasons: number[]) => {
        // Update URL without navigation
        const params = new URLSearchParams(searchParams.toString());

        if (seasons.length > 0) {
            params.set('season', seasons.join(','));
        } else {
            params.delete('season');
        }

        // Convert URLSearchParams to string and decode commas
        const queryString = params.toString().replace(/%2C/g, ',');

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${queryString}`);
        // No need to fetch manually, hook will update
    }, [searchParams]);

    const handleTeamsChange = useCallback((teams: string[]) => {
        // Update URL without navigation
        const params = new URLSearchParams(searchParams.toString());

        if (teams.length > 0) {
            params.set('team', teams.join(','));
        } else {
            params.delete('team');
        }

        // Convert URLSearchParams to string and decode commas
        const queryString = params.toString().replace(/%2C/g, ',');

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${queryString}`);
        // No need to fetch manually, hook will update
    }, [searchParams]);

    const handleHeatsRangeChange = useCallback((heatsRange: number[]) => {
        // Update URL without navigation
        const params = new URLSearchParams(searchParams.toString());

        if (heatsRange.length === 2) {
            params.set('heats', heatsRange.join(','));
        } else {
            params.delete('heats');
        }

        // Convert URLSearchParams to string and decode commas
        const queryString = params.toString().replace(/%2C/g, ',');

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${queryString}`);
    }, [searchParams]);

    // No need for useEffect, availableSeasons and availableTeams are now from cache

    // Update data when statsData changes
    useEffect(() => {
        if (Array.isArray(statsData)) {
            setData(statsData);
        } else if (statsData && statsData.error) {
            setData([]);
        }
    }, [statsData]);

    return (
        <div className="px-4 py-2 pb-20">
            {loadingStats ? (
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                    Loading...
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={data}
                    availableSeasons={availableSeasons}
                    selectedSeasons={selectedSeasons}
                    onSeasonsChange={handleSeasonsChange}
                    availableTeams={availableTeams}
                    selectedTeams={selectedTeams}
                    onTeamsChange={handleTeamsChange}
                    selectedHeatsRange={selectedHeatsRange}
                    onHeatsRangeChange={handleHeatsRangeChange}
                    isLoading={loadingStats}
                />
            )}
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
