"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  const [dashboardData, setDashboardData] = useState({
    bestAveragesThisSeason: [],
    bestAveragesAllTime: [],
    maxSpeedsThisSeason: [],
    maxSpeedsAllTime: []
  });
  const [isLoading, setIsLoading] = useState(true);
  // Use env var or fallback to current year
  const currentSeason = Number(process.env.NEXT_PUBLIC_CURRENT_SEASON) || new Date().getFullYear();
  const [seasonRange, setSeasonRange] = useState<string>("");
  const [maxSpeedRange, setMaxSpeedRange] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch all seasons for the range
        const seasonsResponse = await fetch('/api/sel/seasons');
        const seasons = await seasonsResponse.json();


        // Set season range for all-time table (averages)
        if (Array.isArray(seasons) && seasons.length > 0) {
          const firstSeason = seasons[seasons.length - 1];
          setSeasonRange(`${firstSeason} - ${currentSeason}`);
        } else {
          setSeasonRange("");
        }

        // Fetch actual range for max speed (telemetry seasons only)
        const telemetrySeasonsResp = await fetch('/api/sel/dashboard/max-speeds/telem-seasons');
        const telemetrySeasons = await telemetrySeasonsResp.json();
        if (Array.isArray(telemetrySeasons) && telemetrySeasons.length > 0) {
          const firstT = telemetrySeasons[telemetrySeasons.length - 1];
          const lastT = telemetrySeasons[0];
          setMaxSpeedRange(`${firstT} - ${lastT}`);
        } else {
          setMaxSpeedRange("");
        }

        // Use current season from env
        // currentSeason is always set above, no need to check or log error

        // Then fetch all dashboard data in parallel
        const [
          bestAveragesThisSeason,
          bestAveragesAllTime,
          maxSpeedsThisSeason,
          maxSpeedsAllTime
        ] = await Promise.all([
          fetch(`/api/sel/dashboard/best-averages?season=${currentSeason}`).then(res => res.json()),
          fetch('/api/sel/dashboard/best-averages?season=all').then(res => res.json()),
          fetch(`/api/sel/dashboard/max-speeds?season=${currentSeason}`).then(res => res.json()),
          fetch('/api/sel/dashboard/max-speeds?season=all').then(res => res.json())
        ]);

        setDashboardData({
          bestAveragesThisSeason,
          bestAveragesAllTime,
          maxSpeedsThisSeason,
          maxSpeedsAllTime
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

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
            <Link href={`/sel/stats?season=${currentSeason}`} className="spdw-link">stats</Link>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <DashboardTable
              titleElement={
                <Link href={`/sel/stats?season=${currentSeason}`} className="spdw-link">
                  {currentSeason ? `${currentSeason}` : "Averages"}
                </Link>
              }
              title={currentSeason ? `${currentSeason}` : "Averages"}
              data={mapNoToEmptyKey(dashboardData.bestAveragesThisSeason)}
              columns={['', 'Name', 'Team', 'Average']}
              isLoading={isLoading}
            />

            {/* //TODO: update link to follow same rule as query and include the no heats filter */}
            <DashboardTable
              titleElement={
                <Link href="/sel/stats" className="spdw-link">
                  {seasonRange ? `${seasonRange}` : "All Time"}
                </Link>
              }
              title={seasonRange ? `${seasonRange}` : "All Time"}
              data={mapNoToEmptyKey(dashboardData.bestAveragesAllTime)}
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
              data={mapNoToEmptyKey(dashboardData.maxSpeedsThisSeason)}
              columns={['', 'Name', 'Team', 'Speed', 'Track', 'Date']}
              isLoading={isLoading}
            />

            <DashboardTable
              title={maxSpeedRange ? `${maxSpeedRange}` : "All Time"}
              data={mapNoToEmptyKey(dashboardData.maxSpeedsAllTime)}
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
