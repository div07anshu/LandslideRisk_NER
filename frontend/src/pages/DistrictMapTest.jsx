import DistrictRiskMap from "../components/riskmap/district-map/DistrictRiskMap";

export default function DistrictMapTest() {
    return (
        <div className="w-full min-h-full bg-slate-50 px-5 py-5 lg:px-6">
            <div className="w-full">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">

                    {/* Map */}
                    <div className="min-w-0">
                        <div className="h-[80vh] min-h-[650px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <DistrictRiskMap />
                        </div>

                        <div className="mt-3 flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                <span>NER district boundaries</span>
                            </div>

                            <span className="text-sm font-medium text-slate-600">
                                132 districts
                            </span>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="flex h-[76vh] min-h-[620px] min-w-0 flex-col gap-4">

                        {/* Regional Overview */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Regional Overview
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Current NER monitoring coverage
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs font-medium text-slate-500">
                                        Districts
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        132
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs font-medium text-slate-500">
                                        States
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        8
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Monitoring Status */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-base font-semibold text-slate-900">
                                Monitoring Status
                            </h2>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">
                                        Map coverage
                                    </span>

                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                        Complete
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">
                                        District data
                                    </span>

                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                                        Pending
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">
                                        Risk analysis
                                    </span>

                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                        Not connected
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Data Update */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-base font-semibold text-slate-900">
                                Data Update
                            </h2>

                            <div className="mt-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Last updated
                                </p>

                                <p className="mt-1 text-lg font-semibold text-slate-900">
                                    Awaiting live data
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    District risk information will appear here
                                    once the backend API is connected.
                                </p>
                            </div>
                        </div>

                        {/* District Details */}
                        <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-base font-semibold text-slate-900">
                                District Details
                            </h2>

                            <div className="flex flex-1 items-center justify-center text-center">
                                <div>
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                        <span className="text-lg text-slate-400">
                                            +
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                        Select a district
                                    </p>

                                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                                        Click on any district on the map to
                                        view its risk information.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}