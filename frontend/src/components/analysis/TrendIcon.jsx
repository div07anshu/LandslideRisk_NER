import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function TrendIcon({ trend }) {
  if (trend === "up") {
    return <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />;
  }

  if (trend === "down") {
    return <ArrowDownRight className="w-3.5 h-3.5 text-green-500" />;
  }

  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}
