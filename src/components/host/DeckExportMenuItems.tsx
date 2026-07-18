import { Download } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

type DeckExportMenuItemsProps = {
  onSquadGames: () => void;
  onKahoot: () => void;
  onBlooket: () => void;
  onGimkit: () => void;
};

export function DeckExportMenuItems({
  onSquadGames,
  onKahoot,
  onBlooket,
  onGimkit,
}: DeckExportMenuItemsProps) {
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Download />
          Export
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={onSquadGames}>ClassUpGames</DropdownMenuItem>
          <DropdownMenuItem onSelect={onKahoot}>Kahoot!</DropdownMenuItem>
          <DropdownMenuItem onSelect={onBlooket}>Blooket</DropdownMenuItem>
          <DropdownMenuItem onSelect={onGimkit}>Gimkit</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}
