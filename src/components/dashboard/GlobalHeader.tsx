import { Download, Save, User, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GlobalHeader = () => {
  return (
    <header className="eu-gradient-header px-4 py-2.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-eu-gold flex items-center justify-center">
            <span className="font-display text-sm font-bold text-foreground">EU</span>
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-primary-foreground leading-tight">
              EU City Sustainability Intelligence Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[10px] text-primary-foreground/70">
                <Database className="w-3 h-3" />
                Powered by Eurostat Open Data
              </span>
              <span className="text-[10px] text-primary-foreground/50">|</span>
              <span className="text-[10px] text-primary-foreground/70">2015–2024</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs h-8">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>PDF Report</DropdownMenuItem>
            <DropdownMenuItem>Excel (Multi-sheet)</DropdownMenuItem>
            <DropdownMenuItem>CSV Export</DropdownMenuItem>
            <DropdownMenuItem>JSON API Format</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs h-8">
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Save State
        </Button>

        <div className="w-8 h-8 rounded-full bg-primary-foreground/15 flex items-center justify-center cursor-pointer hover:bg-primary-foreground/25 transition-colors">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
