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

import { columns, SpeedRecord } from "./columns"
import { DataTable } from "./data-table"
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useCachedFetch } from '@/lib/useCachedFetch';
import { useCachedFetchWithParams } from '@/lib/useCachedFetchWithParams';
import { useSearchParams, useRouter } from 'next/navigation';

function SelSpeedContent() {
    const [data, setData] = useState<SpeedRecord[]>([]);
    const { data: availableSeasonsRaw, loading: loadingSeasons } = useCachedFetch('/api/sel/speed/seasons') as { data: unknown, loading: boolean };
    const { data: availableTeamsRaw, loading: loadingTeams } = useCachedFetch('/api/sel/speed/teams') as { data: unknown, loading: boolean };
    const { data: availableTracksRaw, loading: loadingTracks } = useCachedFetch('/api/sel/speed/tracks') as { data: unknown, loading: boolean };
    const availableSeasons: number[] = Array.isArray(availableSeasonsRaw) ? availableSeasonsRaw : [];
    const availableTeams: string[] = Array.isArray(availableTeamsRaw) ? availableTeamsRaw : [];
    const availableTracks: string[] = Array.isArray(availableTracksRaw) ? availableTracksRaw : [];
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

    // Get selected tracks from URL search params
    const tracksParam = searchParams.get('track');
    const selectedTracks = tracksParam
        ? tracksParam.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

    // Build the API URL with query params
    const queryParams = new URLSearchParams();
    if (selectedSeasons.length > 0) {
        queryParams.set('season', selectedSeasons.join(','));
    }
    if (selectedTeams.length > 0) {
        queryParams.set('team', selectedTeams.join(','));
    }
    if (selectedTracks.length > 0) {
        queryParams.set('track', selectedTracks.join(','));
    }
    const speedUrl = `/api/sel/speed${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const { data: speedData, loading: loadingSpeed } = useCachedFetchWithParams(speedUrl);

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
    }, [searchParams]);

    const handleTracksChange = useCallback((tracks: string[]) => {
        // Update URL without navigation
        const params = new URLSearchParams(searchParams.toString());

        if (tracks.length > 0) {
            params.set('track', tracks.join(','));
        } else {
            params.delete('track');
        }

        // Convert URLSearchParams to string and decode commas
        const queryString = params.toString().replace(/%2C/g, ',');

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${queryString}`);
    }, [searchParams]);

    // Update data when speedData changes
    useEffect(() => {
        if (Array.isArray(speedData)) {
            setData(speedData);
        } else if (speedData && speedData.error) {
            setData([]);
        }
    }, [speedData]);

    return (
        <div className="px-4 py-2 pb-20">
            {loadingSpeed ? (
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
                    availableTracks={availableTracks}
                    selectedTracks={selectedTracks}
                    onTracksChange={handleTracksChange}
                    isLoading={loadingSpeed}
                />
            )}
        </div>
    );
}

export default function SelSpeedPage() {
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
                            <BreadcrumbPage>max speed</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="content-area">
                <h1>sel max speed</h1>
                <br />
            </div>
            <Suspense fallback={
                <div className="px-4 py-2 pb-20">
                    <div className="rounded-md border p-8 text-center text-muted-foreground">
                        Loading...
                    </div>
                </div>
            }>
                <SelSpeedContent />
            </Suspense>
        </>
    )
}