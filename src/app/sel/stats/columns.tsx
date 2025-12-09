"use client"

import { Column } from "react-data-grid"

export type Stat = {
    Season: number;
    Name: string;
    Team: string;
    Average: number;
    Match: string;
    Heats: number;
    Points: number;
    Bonus: number;
    "Home Avg.": number | null;
    "Away Avg.": number | null;
    "I": number;
    "II": number;
    "III": number;
    "IV": number;
    R: number;
    T: number;
    M: number;
    X: number;
    F: number;
    Warn: number;
    "Max Speed": number | null;
    rank?: number; // Dynamic rank column
}

export const columns: Column<Stat & { rank: number }>[] = [
    {
        key: "rank",
        name: (
            <div className="text-right pr-2">#</div>
        ),
        sortable: false,
        resizable: true,
        renderCell: ({ row }) => {
            return (
                <div className="text-right pr-2">
                    {row.rank}
                </div>
            )
        },
    },
    {
        key: "Name",
        name: "Name",
        sortable: true,
        resizable: true,
    },
    {
        key: "Team",
        name: "Team",
        sortable: true,
        resizable: true,
    },
    {
        key: "Average",
        name: "Average",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row.Average;
            return value ? value.toFixed(3) : "0.000";
        },
    },
    {
        key: "Match",
        name: "Match",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "Heats",
        name: "Heats",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "Points",
        name: "Points",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "Bonus",
        name: "Bonus",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "Home Avg.",
        name: "Home",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row["Home Avg."];
            return value !== null ? value.toFixed(3) : "";
        },
    },
    {
        key: "Away Avg.",
        name: "Away",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row["Away Avg."];
            return value !== null ? value.toFixed(3) : "";
        },
    },
    {
        key: "I",
        name: "I",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "II",
        name: "II",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "III",
        name: "III",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "IV",
        name: "IV",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "R",
        name: "R",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "T",
        name: "T",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "M",
        name: "M",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "X",
        name: "X",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "Warn",
        name: "Warn",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
    {
        key: "Max Speed",
        name: "Speed",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row["Max Speed"];
            return value !== null ? value.toFixed(2) : "";
        },
    },
    {
        key: "Season",
        name: "Season",
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
    },
]
