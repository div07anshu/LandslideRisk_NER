import { Construction } from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import Card from "../common/Card";

export default function ComingSoon({ title, subtitle }) {
  return (
    <div className="p-6 flex-1">
      <SectionHeader title={title} subtitle={subtitle} />

      <Card className="p-10 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
          <Construction size={22} strokeWidth={3} className="text-blue-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          This page is under construction
        </h3>
        <p className="text-sm text-slate-500 max-w-md">
          We're still building this part of the dashboard. Check back soon.
        </p>
      </Card>
    </div>
  );
}
