import { AlertTriangle } from "lucide-react";
import Card from "../../common/Card";

function ReportProblem() {
    return (
        <Card className="p-5 flex flex-col items-start">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle size={18} strokeWidth={3} className="text-red-500" />
          </div>
          <h3 className="text-sm font-bold">Report a Problem</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Help us by reporting landslide or related issues.
          </p>
          <button className="mt-auto w-full bg-[#0B1B3B] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-[#132a5c] transition-colors">
            Report Now
          </button>
        </Card>
    )
}

export default ReportProblem;