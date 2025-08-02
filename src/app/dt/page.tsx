"use client"

import { columns, Schedule } from "./columns"
import { DataTable } from "./data-table"
import { useState, useEffect } from 'react';

export default function DemoPage() {
    const [data, setData] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/sel/stats');
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // if (isLoading) return <p>Loading...</p>;
    // if (!data) return <p>No data available</p>;

    return (
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={data} />
        </div>
    )
}