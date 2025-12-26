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
  const [maxSpeedsThisSeason, setMaxSpeedsThisSeason] = useState<any[] | null>(null)
  const [loadingMaxSpeedsThisSeason, setLoadingMaxSpeedsThisSeason] = useState<boolean>(false)
  const [maxSpeedsAllTime, setMaxSpeedsAllTime] = useState<any[] | null>(null)
  const [loadingMaxSpeedsAllTime, setLoadingMaxSpeedsAllTime] = useState<boolean>(false)

  const isLoading = loadingSeasons || loadingTelemetrySeasons || loadingBestAveragesThisSeason || loadingBestAveragesAllTime || loadingMaxSpeedsThisSeason || loadingMaxSpeedsAllTime;

  // Lazy fetch lower-priority max speed tables after top tables load
  useEffect(() => {
    let cancelled = false
    const getSecondsUntilNext10PMUTC = () => {
      const now = new Date();
      const next10pm = new Date(now);
      next10pm.setUTCHours(22, 0, 0, 0);
      if (now >= next10pm) next10pm.setUTCDate(next10pm.getUTCDate() + 1);
      return Math.floor((next10pm.getTime() - now.getTime()) / 1000);
    }

    async function fetchMaxSpeeds() {
      try {
        // first table: max speeds this season
        const urlThis = `/api/sel/dashboard/max-speeds?season=${currentSeason}`
        const cacheKeyThis = `cache:${urlThis}`
        const cachedThis = localStorage.getItem(cacheKeyThis)
        if (cachedThis) {
          try {
            const parsed = JSON.parse(cachedThis)
            if (parsed?.expiry && Date.now() < parsed.expiry) {
              if (!cancelled) setMaxSpeedsThisSeason(parsed.value || [])
            } else {
              localStorage.removeItem(cacheKeyThis)
            }
          } catch {}
        }

        if (!cachedThis) {
          setLoadingMaxSpeedsThisSeason(true)
          const res = await fetch(urlThis)
          if (!res.ok) throw new Error('Network error')
          const json = await res.json()
          if (!cancelled) setMaxSpeedsThisSeason(Array.isArray(json) ? json : [])
          try {
            const expiry = Date.now() + getSecondsUntilNext10PMUTC() * 1000
            localStorage.setItem(cacheKeyThis, JSON.stringify({ value: json, expiry }))
          } catch {}
          setLoadingMaxSpeedsThisSeason(false)
        }

        // second table: max speeds all time
        const urlAll = `/api/sel/dashboard/max-speeds?season=all`
        const cacheKeyAll = `cache:${urlAll}`
        const cachedAll = localStorage.getItem(cacheKeyAll)
        if (cachedAll) {
          try {
            const parsed = JSON.parse(cachedAll)
            if (parsed?.expiry && Date.now() < parsed.expiry) {
              if (!cancelled) setMaxSpeedsAllTime(parsed.value || [])
            } else {
              localStorage.removeItem(cacheKeyAll)
            }
          } catch {}
        }

        if (!cachedAll) {
          setLoadingMaxSpeedsAllTime(true)
          const res2 = await fetch(urlAll)
          if (!res2.ok) throw new Error('Network error')
          const json2 = await res2.json()
          if (!cancelled) setMaxSpeedsAllTime(Array.isArray(json2) ? json2 : [])
          try {
            const expiry = Date.now() + getSecondsUntilNext10PMUTC() * 1000
            localStorage.setItem(cacheKeyAll, JSON.stringify({ value: json2, expiry }))
          } catch {}
          setLoadingMaxSpeedsAllTime(false)
        }
      } catch (e) {
        if (!cancelled) {
          setLoadingMaxSpeedsThisSeason(false)
          setLoadingMaxSpeedsAllTime(false)
        }
      }
    }

    // start fetching when at least one top table is loaded (prioritize perceived speed)
    if (!loadingBestAveragesThisSeason && !loadingBestAveragesAllTime) {
      fetchMaxSpeeds()
    }

    return () => { cancelled = true }
  }, [currentSeason, loadingBestAveragesThisSeason, loadingBestAveragesAllTime])
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
            <Link href={`/sel/stats?season=${currentSeason}&league=PGEE`} className="spdw-link" onMouseEnter={() => prefetchStatsForLink(`/sel/stats?season=${currentSeason}&league=PGEE`)} onFocus={() => prefetchStatsForLink(`/sel/stats?season=${currentSeason}&league=PGEE`)}>stats</Link>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <DashboardTable
                titleElement={
                <Link href={`/sel/stats?season=${currentSeason}&league=PGEE`} className="spdw-link" onMouseEnter={() => prefetchStatsForLink(`/sel/stats?season=${currentSeason}&league=PGEE`)} onFocus={() => prefetchStatsForLink(`/sel/stats?season=${currentSeason}&league=PGEE`)}>
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
                <Link href="/sel/stats?league=PGEE" className="spdw-link" onMouseEnter={() => prefetchStatsForLink('/sel/stats?league=PGEE')} onFocus={() => prefetchStatsForLink('/sel/stats?league=PGEE')}>
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
