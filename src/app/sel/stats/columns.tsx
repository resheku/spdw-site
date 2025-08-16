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
    rank?: number; // Dynamic rank column
}

export const columns: Column<Stat & { rank: number }>[] = [
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
        key: "Name",
        name: "Name",
        sortable: true,
        resizable: true,
        minWidth: 150,
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
        resizable: true,
    },
    {
        key: "Heats",
        name: "Heats",
        sortable: true,
        resizable: true,
    },
    {
        key: "Points",
        name: "Points",
        sortable: true,
        resizable: true,
    },
    {
        key: "Bonus",
        name: "Bonus",
        sortable: true,
        resizable: true,
    },
    {
        key: "Home Avg.",
        name: "Home",
        sortable: true,
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
        resizable: true,
    },
    {
        key: "II",
        name: "II",
        sortable: true,
        resizable: true,
    },
    {
        key: "III",
        name: "III",
        sortable: true,
        resizable: true,
    },
    {
        key: "IV",
        name: "IV",
        sortable: true,
        resizable: true,
    },
    {
        key: "R",
        name: "R",
        sortable: true,
        resizable: true,
    },
    {
        key: "T",
        name: "T",
        sortable: true,
        resizable: true,
    },
    {
        key: "M",
        name: "M",
        sortable: true,
        resizable: true,
    },
    {
        key: "X",
        name: "X",
        sortable: true,
        resizable: true,
    },
    {
        key: "Warn",
        name: "Warn",
        sortable: true,
        resizable: true,
    },
    {
        key: "Season",
        name: "Season",
        sortable: true,
        resizable: true,
    },
]
