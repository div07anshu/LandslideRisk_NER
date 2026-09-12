import { useState } from "react";
import { supabase } from "../../supabase";

const API_BASE =
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_BACKEND_URL ??
    "http://localhost:4000";

function LocationAlertSubscription() {
    const [open, setOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    async function enableAlerts() {
        if (!phoneNumber.trim()) {
            setStatus("Please enter your mobile number.");
            return;
        }

        if (!navigator.geolocation) {
            setStatus("Location is not supported by this browser.");
            return;
        }

        setLoading(true);
        setStatus("Getting your location...");

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            const token = session?.access_token;

            if (!token) {
                setStatus("Please log in first.");
                return;
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;

            setStatus("Saving your location and alert settings...");

            const response = await fetch(
                `${API_BASE}/api/auth/alerts/subscribe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        phone_number: phoneNumber.trim(),
                        latitude,
                        longitude,
                    }),
                },
            );

            const body = await response.json();

            if (!response.ok) {
                throw new Error(
                    body?.error?.message || "Failed to enable alerts.",
                );
            }

            setStatus("Checking current landslide risk...");

            const riskResponse = await fetch(
                `${API_BASE}/api/auth/alerts/check-risk`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const riskBody = await riskResponse.json();

            if (!riskResponse.ok) {
                throw new Error(
                    riskBody?.error?.message || "Failed to check risk.",
                );
            }

            setStatus(
                `Current risk: ${riskBody.risk.risk_level} (${riskBody.risk.risk_score}/100)`,
            );

            setTimeout(() => {
                setOpen(false);
                setStatus("");
            }, 3000);
        } catch (error) {
            if (error?.code === 1) {
                setStatus("Location permission was denied.");
            } else {
                setStatus(error.message || "Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {/* Bottom-most dashboard button */}
            <div className="mt-6 mb-6 flex justify-center">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="px-6 py-3 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                    Enable Location & SMS Alerts
                </button>
            </div>

            {/* Mobile number modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                        <div className="mb-5">
                            <h3 className="text-lg font-bold text-slate-900">
                                Enable SMS Alerts
                            </h3>

                            <p className="text-sm text-slate-500 mt-1">
                                Enter your mobile number to receive a landslide
                                risk alert for your location.
                            </p>
                        </div>

                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(event) =>
                                setPhoneNumber(event.target.value)
                            }
                            placeholder="+91XXXXXXXXXX"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                        />

                        {status && (
                            <p className="text-sm text-slate-600 mt-3">
                                {status}
                            </p>
                        )}

                        <div className="flex gap-3 mt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    setStatus("");
                                }}
                                disabled={loading}
                                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={enableAlerts}
                                disabled={loading}
                                className="flex-1 rounded-lg bg-slate-900 text-white py-2.5 text-sm font-semibold disabled:opacity-50"
                            >
                                {loading ? "Checking..." : "Enable Alerts"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default LocationAlertSubscription;