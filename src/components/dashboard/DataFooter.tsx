import { EUROSTAT_DATASETS } from "@/data/mockData";
import { Database, Info } from "lucide-react";

const DataFooter = () => {
  return (
    <footer className="border-t border-border bg-card px-4 py-2 shrink-0">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <Info className="w-3 h-3 text-muted-foreground" />
          <Database className="w-3 h-3 text-eu-blue" />
        </div>
        <div className="text-[9px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Data Source:</span>{" "}
          {EUROSTAT_DATASETS.length} Eurostat datasets ({EUROSTAT_DATASETS.join(", ")}).{" "}
          100% open EU data. Dashboard functionality depends on data completeness and update frequency.{" "}
          <span className="text-eu-blue cursor-pointer hover:underline">View data catalog →</span>
        </div>
      </div>
    </footer>
  );
};

export default DataFooter;
