import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface SeasonSelectorProps {
  currentSeason: string;
  onSeasonChange: (season: string) => void;
  availableSeasons: number[];
}

export function SeasonSelector({ currentSeason, onSeasonChange, availableSeasons }: SeasonSelectorProps) {
  const getSeasonLabel = (season: string) => {
    if (season === 'all') {
      return 'All Time';
    }
    return `Season ${season}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[120px] justify-between">
          {getSeasonLabel(currentSeason)}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onSeasonChange('all')}>
          All Time
        </DropdownMenuItem>
        {availableSeasons.map((season) => (
          <DropdownMenuItem key={season} onClick={() => onSeasonChange(season.toString())}>
            Season {season}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}