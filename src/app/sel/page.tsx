"use client";

import Link from "next/link";
import { prefetchStatsForLink } from '@/lib/prefetchStats';
import { useState, useEffect } from "react";
import { useCachedFetch } from '@/lib/useCachedFetch';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DashboardTable } from "@/components/ui/dashboard-table";

interface DashboardData {
  bestAveragesThisSeason: any[];
  bestAveragesAllTime: any[];
  maxSpeedsThisSeason: any[];
  maxSpeedsAllTime: any[];
}

export default function SELPage() {
  const currentSeason = Number(process.env.NEXT_PUBLIC_CURRENT_SEASON) || new Date().getFullYear();
  // Use cached fetch for all API endpoints
  const { data: seasons, loading: loadingSeasons } = useCachedFetch('/api/sel/seasons') as { data: unknown, loading: boolean };
  const { data: telemetrySeasons, loading: loadingTelemetrySeasons } = useCachedFetch('/api/sel/dashboard/max-speeds/telem-seasons') as { data: unknown, loading: boolean };
  const { data: bestAveragesThisSeason, loading: loadingBestAveragesThisSeason } = useCachedFetch(`/api/sel/dashboard/best-averages?season=${currentSeason}`) as { data: unknown, loading: boolean };
  const { data: bestAveragesAllTime, loading: loadingBestAveragesAllTime } = useCachedFetch('/api/sel/dashboard/best-averages?season=all') as { data: unknown, loading: boolean };
  const { data: maxSpeedsThisSeason, loading: loadingMaxSpeedsThisSeason } = useCachedFetch(`/api/sel/dashboard/max-speeds?season=${currentSeason}`) as { data: unknown, loading: boolean };
  const { data: maxSpeedsAllTime, loading: loadingMaxSpeedsAllTime } = useCachedFetch('/api/sel/dashboard/max-speeds?season=all') as { data: unknown, loading: boolean };
  const isLoading = loadingSeasons || loadingTelemetrySeasons || loadingBestAveragesThisSeason || loadingBestAveragesAllTime || loadingMaxSpeedsThisSeason || loadingMaxSpeedsAllTime;
  // Compute season range and max speed range from cached data
  let seasonRange = '';
  if (Array.isArray(seasons) && (seasons as any[]).length > 0) {
    const arr = seasons as any[];
    const firstSeason = arr[arr.length - 1];
    seasonRange = `${firstSeason} - ${currentSeason}`;
  }
  let maxSpeedRange = '';
  if (Array.isArray(telemetrySeasons) && (telemetrySeasons as any[]).length > 0) {
    const arr = telemetrySeasons as any[];
    const firstT = arr[arr.length - 1];
    const lastT = arr[0];
    maxSpeedRange = `${firstT} - ${lastT}`;
  }

  // Helper to map 'No' field to '' for all rows
  function mapNoToEmptyKey(arr: any[]) {
    return arr.map(row => {
      if (row && typeof row === 'object' && row['No'] !== undefined) {
        const { No, ...rest } = row;
        return { '': No, ...rest };
      }
      return row;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>sel</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-8 w-full">
            <h2 className="text-2xl font-bold mb-2">
            <Link href={`/sel/stats?season=${currentSeason}`} className="spdw-link" onMouseEnter={() => prefetchStatsForLink(`/sel/stats?season=${currentSeason}`)} onFocus={() => prefetchStatsForLink(`/sel/stats?season=${currentSeason}`)}>stats</Link>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <DashboardTable
                titleElement={
                <Link href={`/sel/stats?season=${currentSeason}`} className="spdw-link" onMouseEnter={() => prefetchStatsForLink(`/sel/stats?season=${currentSeason}`)} onFocus={() => prefetchStatsForLink(`/sel/stats?season=${currentSeason}`)}>
                  {currentSeason ? `${currentSeason}` : "Averages"}
                </Link>
              }
              title={currentSeason ? `${currentSeason}` : "Averages"}
              data={mapNoToEmptyKey(Array.isArray(bestAveragesThisSeason) ? bestAveragesThisSeason : [])}
              columns={['', 'Name', 'Team', 'Average']}
              isLoading={isLoading}
            />

            {/* //TODO: update link to follow same rule as query and include the no heats filter */}
            <DashboardTable
              titleElement={
                <Link href="/sel/stats" className="spdw-link" onMouseEnter={() => prefetchStatsForLink('/sel/stats')} onFocus={() => prefetchStatsForLink('/sel/stats')}>
                  {seasonRange ? `${seasonRange}` : "All Time"}
                </Link>
              }
              title={seasonRange ? `${seasonRange}` : "All Time"}
              data={mapNoToEmptyKey(Array.isArray(bestAveragesAllTime) ? bestAveragesAllTime : [])}
              columns={['', 'Name', 'Team', 'Season', 'Average']}
              isLoading={isLoading}
              highlightSeason={currentSeason}
            />
          </div>

          <h3 className="text-2xl font-bold mb-2">
            top speed <span className="text-base font-normal text-black-500">(km/h)</span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <DashboardTable
              title={currentSeason ? `${currentSeason}` : "Max Speed"}
              data={mapNoToEmptyKey(Array.isArray(maxSpeedsThisSeason) ? maxSpeedsThisSeason : [])}
              columns={['', 'Name', 'Team', 'Speed', 'Track', 'Date']}
              isLoading={isLoading}
            />

            <DashboardTable
              title={maxSpeedRange ? `${maxSpeedRange}` : "All Time"}
              data={mapNoToEmptyKey(Array.isArray(maxSpeedsAllTime) ? maxSpeedsAllTime : [])}
              columns={['', 'Name', 'Team', 'Speed', 'Track', 'Date']}
              isLoading={isLoading}
              highlightSeason={currentSeason}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
