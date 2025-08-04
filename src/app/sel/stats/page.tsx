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
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SelStatsPage() {
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
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
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

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${params.toString()}`);

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

        // Update URL without causing page navigation
        window.history.replaceState({}, '', `?${params.toString()}`);

        // Fetch new data
        fetchData(selectedSeasons, teams);
    }, [searchParams, fetchData, selectedSeasons]);

    useEffect(() => {
        const fetchAvailableSeasons = async () => {
            try {
                const response = await fetch('/api/sel/stats/seasons');
                if (response.ok) {
                    const seasons = await response.json();
                    setAvailableSeasons(seasons);
                }
            } catch (error) {
                console.error('Error fetching available seasons:', error);
            }
        };

        const fetchAvailableTeams = async () => {
            try {
                const response = await fetch('/api/sel/stats/teams');
                if (response.ok) {
                    const teams = await response.json();
                    setAvailableTeams(teams);
                }
            } catch (error) {
                console.error('Error fetching available teams:', error);
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
                        isLoading={isFilterLoading}
                    />
                )}
            </div>
        </>
    )
}
