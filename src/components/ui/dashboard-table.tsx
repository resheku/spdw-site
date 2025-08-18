import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface DashboardTableProps {
  title: string;
  data: any[];
  columns: string[];
  isLoading?: boolean;
  className?: string;
  highlightSeason?: number | null;
  titleElement?: React.ReactNode;
}

export function DashboardTable({ title, data, columns, isLoading = false, className = "", highlightSeason, titleElement }: DashboardTableProps) {
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-semibold">{titleElement ?? title}</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold">{titleElement ?? title}</h3>
      <div className="w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="font-medium px-4">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => {
                let isHighlight = false;
                if (highlightSeason) {
                  if (row["Season"] !== undefined) {
                    isHighlight = row["Season"] === highlightSeason;
                  } else if (row["Date"] && typeof row["Date"] === "string") {
                    // Try to extract year from Date (format: YYYY-MM-DD or similar)
                    const year = parseInt(row["Date"].slice(0, 4));
                    isHighlight = year === highlightSeason;
                  }
                }
                return (
                  <TableRow key={index} className={isHighlight ? "font-bold" : undefined}>
                    {columns.map((column) => (
                      <TableCell key={column} className="py-2 px-4">
                        {typeof row[column] === 'number' && column === 'Speed'
                          ? row[column].toFixed(1)
                          : typeof row[column] === 'number' && column === 'Average'
                            ? row[column].toFixed(3)
                            : row[column]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-4 text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}