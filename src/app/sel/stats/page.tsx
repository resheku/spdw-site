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
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get selected seasons from URL search params
    const seasonsParam = searchParams.get('season');
    const selectedSeasons = seasonsParam
        ? seasonsParam.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s))
        : [];

    const fetchData = useCallback(async (seasons: number[] = []) => {
        const isInitialLoad = data.length === 0;

        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsFilterLoading(true);
        }

        try {
            const seasonsQuery = seasons.length > 0 ? `?season=${seasons.join(',')}` : '';
            const response = await fetch(`/api/sel/stats${seasonsQuery}`);
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
        fetchData(seasons);
    }, [searchParams, fetchData]);

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

        fetchAvailableSeasons();
    }, []);

    // Initial data load
    useEffect(() => {
        fetchData(selectedSeasons);
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
                <h1>stats</h1>
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
                        isLoading={isFilterLoading}
                    />
                )}
            </div>
        </>
    )
}
