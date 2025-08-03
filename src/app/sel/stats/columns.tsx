"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"


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
}

export const columns: ColumnDef<Stat>[] = [
    {
        accessorKey: "Season",
        header: "Season",
    },
    {
        accessorKey: "Name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "Team",
        header: "Team"
    },
    {
        accessorKey: "Average",
        header: "Average",
    },
    {
        accessorKey: "Match",
        header: "Match",
    },
    {
        accessorKey: "Heats",
        header: "Heats",
    },
    {
        accessorKey: "Points",
        header: "Points",
    },
    {
        accessorKey: "Bonus",
        header: "Bonus",
    },
    {
        accessorFn: (row) => row["Home Avg."],
        id: "homeAvg",
        header: "Home Avg",
    },
    {
        accessorFn: (row) => row["Away Avg."],
        id: "awayAvg", 
        header: "Away",
    },
    {
        accessorKey: "I",
        header: "I",
    },
    {
        accessorKey: "II",
        header: "II",
    },
    {
        accessorKey: "III",
        header: "III",
    },
    {
        accessorKey: "IV",
        header: "IV",
    },
    {
        accessorKey: "R",
        header: "R",
    },
    {
        accessorKey: "T",
        header: "T",
    },
    {
        accessorKey: "M",
        header: "M",
    },
    {
        accessorKey: "X",
        header: "X",
    },
    {
        accessorKey: "Warn",
        header: "Warn",
    }
]
