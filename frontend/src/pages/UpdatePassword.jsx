import { useState } from "react";
import { Mountain, Lock, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2
              size={24}
              strokeWidth={2.5}
              className="text-green-600"
            />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Password updated
          </h1>

          <p className="text-slate-500 mt-2">
            Your password has been changed. You can now sign in with it.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="inline-block mt-6 bg-brand-900 hover:bg-brand-800 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="flex justify-center mb-6">
          <div className="bg-brand-900 text-white p-3 rounded-xl">
            <Mountain size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-800">
          Set a new password
        </h1>

        <p className="text-center text-slate-500 mt-2">
          Choose a new password for your LandslideRisk NER account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                placeholder="Enter a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                placeholder="Re-enter the password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-900 hover:bg-brand-800 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-7">
          <Link
            to="/login"
            className="text-brand-600 font-semibold hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
