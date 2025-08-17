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
import { useSearchParams, useRouter } from 'next/navigation';

function SelStatsContent() {
    const [data, setData] = useState<Stat[]>([]);
    const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
    const [availableTeams, setAvailableTeams] = useState<string[]>([]);
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

    const fetchData = useCallback(async (seasons: number[] = [], teams: string[] = []) => {
        const isInitialLoad = data.length === 0;

        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsFilterLoading(true);
        }

        try {
            const queryParams = new URLSearchParams();
            if (seasons.length > 0) {
                queryParams.set('season', seasons.join(','));
            }
            if (teams.length > 0) {
                queryParams.set('team', teams.join(','));
            }

            const queryString = queryParams.toString();
            const response = await fetch(`/api/sel/stats${queryString ? `?${queryString}` : ''}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Check if the result has an error property (API error response)
            if (result.error) {
                console.error('API error:', result.error, result.details);
                setData([]); // Set empty array on error
            } else if (Array.isArray(result)) {
                setData(result);
            } else {
                console.error('Unexpected response format:', result);
                setData([]); // Set empty array if response is not an array
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setData([]); // Set empty array on error
        } finally {
            if (isInitialLoad) {
                setIsLoading(false);
            } else {
                setIsFilterLoading(false);
            }
        }
    }, [data.length]);

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

        // Fetch new data
        fetchData(seasons, selectedTeams);
    }, [searchParams, fetchData, selectedTeams]);

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

        // Fetch new data
        fetchData(selectedSeasons, teams);
    }, [searchParams, fetchData, selectedSeasons]);

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

    useEffect(() => {
        const fetchAvailableSeasons = async () => {
            try {
                const response = await fetch('/api/sel/stats/seasons');
                if (response.ok) {
                    const seasons = await response.json();
                    if (Array.isArray(seasons)) {
                        setAvailableSeasons(seasons);
                    } else {
                        console.error('Unexpected seasons response format:', seasons);
                        setAvailableSeasons([]);
                    }
                } else {
                    console.error('Failed to fetch seasons:', response.status);
                    setAvailableSeasons([]);
                }
            } catch (error) {
                console.error('Error fetching available seasons:', error);
                setAvailableSeasons([]);
            }
        };

        const fetchAvailableTeams = async () => {
            try {
                const response = await fetch('/api/sel/stats/teams');
                if (response.ok) {
                    const teams = await response.json();
                    if (Array.isArray(teams)) {
                        setAvailableTeams(teams);
                    } else {
                        console.error('Unexpected teams response format:', teams);
                        setAvailableTeams([]);
                    }
                } else {
                    console.error('Failed to fetch teams:', response.status);
                    setAvailableTeams([]);
                }
            } catch (error) {
                console.error('Error fetching available teams:', error);
                setAvailableTeams([]);
            }
        };

        fetchAvailableSeasons();
        fetchAvailableTeams();
    }, []);

    // Initial data load
    useEffect(() => {
        fetchData(selectedSeasons, selectedTeams);
    }, []); // Only run on mount

    return (
        <div className="px-4 py-2 pb-20">
            {isLoading ? (
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
                    isLoading={isFilterLoading}
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
