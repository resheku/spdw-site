"use client"

import { Column } from "react-data-grid"

export type SpeedRecord = {
    season: number;
    date: string;
    match: string;
    heat: number;
    rider_name: string;
    rider_surname: string;
    points: number;
    team: string | null;
    max_speed: number;
    track: string;
    z_score: number;
    track_avg_speed: number | string;
    speed_diff: number | string;
}

export const columns: Column<SpeedRecord & { rank: number }>[] = [
    {
        key: "rank",
        name: "#",
        sortable: false,
        resizable: true,
        width: 70,
        renderCell: ({ row }) => {
            return row.rank.toString();
        },
    },
    {
        key: "rider_name",
        name: "Name",
        sortable: true,
        resizable: true,
        renderCell: ({ row }) => {
            return `${row.rider_name} ${row.rider_surname}`;
        },
    },
    {
        key: "team",
        name: "Team",
        sortable: true,
        resizable: true,
        renderCell: ({ row }) => {
            return row.team || "";
        },
    },
    {
        key: "max_speed",
        name: "Max Speed",
        sortable: true,
        resizable: true,
        renderCell: ({ row }) => {
            return row.max_speed.toFixed(2);
        },
    },
    {
        key: "z_score",
        name: "Z-Score",
        sortable: true,
        resizable: true,
        renderCell: ({ row }) => {
            const zScore = Number(row.z_score);
            return isNaN(zScore) ? "N/A" : zScore.toFixed(3);
        },
    },
    {
        key: "track_avg_speed",
        name: "Track Avg",
        sortable: true,
        resizable: true,
        renderCell: ({ row }) => {
            const avgSpeed = Number(row.track_avg_speed);
            return isNaN(avgSpeed) ? "N/A" : avgSpeed.toFixed(2);
        },
    },
    {
        key: "speed_diff",
        name: "Speed Diff",
        sortable: true,
        resizable: true,
        renderCell: ({ row }) => {
            const diff = Number(row.speed_diff);
            if (isNaN(diff)) {
                return "N/A";
            }
            const sign = diff >= 0 ? "+" : "";
            return `${sign}${diff.toFixed(3)}`;
        },
    },
    {
        key: "track",
        name: "Track",
        sortable: true,
        resizable: true,
    },
    {
        key: "date",
        name: "Date",
        sortable: true,
        resizable: true,
        renderCell: ({ row }) => {
            return new Date(row.date).toLocaleDateString();
        },
    }, 
    {
        key: "match",
        name: "Match",
        sortable: true,
        resizable: true,
    },
    {
        key: "heat",
        name: "Heat No.",
        sortable: true,
        resizable: true,
        renderCell: ({ row }) => {
            return row.heat;
        },
    },   
    {
        key: "points",
        name: "Points",
        sortable: true,
        resizable: true,
    },    
    {
        key: "season",
        name: "Season",
        sortable: true,
        resizable: true,
    },
]