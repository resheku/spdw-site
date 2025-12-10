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
        name: <div className="text-right pr-2">Average</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row.Average;
            return (
                <div className="text-right pr-2">
                    {value ? value.toFixed(3) : "0.000"}
                </div>
            )
        },
    },
    {
        key: "Match",
        name: <div className="text-right pr-2">Match</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.Match ?? ''}</div>,
    },
    {
        key: "Heats",
        name: <div className="text-right pr-2">Heats</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row.Heats;
            return (
                <div className="text-right pr-2">{value ?? ''}</div>
            )
        },
    },
    {
        key: "Points",
        name: <div className="text-right pr-2">Points</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row.Points;
            return (
                <div className="text-right pr-2">{value ?? ''}</div>
            )
        },
    },
    {
        key: "Bonus",
        name: <div className="text-right pr-2">Bonus</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row.Bonus;
            return (
                <div className="text-right pr-2">{value ?? ''}</div>
            )
        },
    },
    {
        key: "Home Avg.",
        name: <div className="text-right pr-2">Home</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row["Home Avg."];
            return (
                <div className="text-right pr-2">{value !== null && value !== undefined ? value.toFixed(3) : ''}</div>
            )
        },
    },
    {
        key: "Away Avg.",
        name: <div className="text-right pr-2">Away</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row["Away Avg."];
            return (
                <div className="text-right pr-2">{value !== null && value !== undefined ? value.toFixed(3) : ''}</div>
            )
        },
    },
    {
        key: "I",
        name: <div className="text-right pr-2">I</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.I ?? ''}</div>,
    },
    {
        key: "II",
        name: <div className="text-right pr-2">II</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.II ?? ''}</div>,
    },
    {
        key: "III",
        name: <div className="text-right pr-2">III</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.III ?? ''}</div>,
    },
    {
        key: "IV",
        name: <div className="text-right pr-2">IV</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.IV ?? ''}</div>,
    },
    {
        key: "R",
        name: <div className="text-right pr-2">R</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.R ?? ''}</div>,
    },
    {
        key: "T",
        name: <div className="text-right pr-2">T</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.T ?? ''}</div>,
    },
    {
        key: "M",
        name: <div className="text-right pr-2">M</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.M ?? ''}</div>,
    },
    {
        key: "X",
        name: <div className="text-right pr-2">X</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.X ?? ''}</div>,
    },
    {
        key: "Warn",
        name: <div className="text-right pr-2">Warn</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.Warn ?? ''}</div>,
    },
    {
        key: "Max Speed",
        name: <div className="text-right pr-2">Speed</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => {
            const value = row["Max Speed"];
            return (
                <div className="text-right pr-2">{value !== null && value !== undefined ? value.toFixed(2) : ''}</div>
            )
        },
    },
    {
        key: "Season",
        name: <div className="text-right pr-2">Season</div>,
        sortable: true,
        sortDescendingFirst: true,
        resizable: true,
        renderCell: ({ row }) => <div className="text-right pr-2">{row.Season ?? ''}</div>,
    },
]
