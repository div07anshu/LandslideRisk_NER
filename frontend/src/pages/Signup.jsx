import { useState } from "react";
import { supabase } from "../supabase";
import { Mountain, Mail, Lock, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ContourMotif from "../components/analysis/ContourMotif";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-900 text-white p-3 rounded-xl">
              <Mountain size={28} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Account created</h1>
          <p className="text-slate-500 mt-2">
            Check your inbox to confirm your email, then sign in to continue.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 bg-brand-900 hover:bg-brand-800 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="relative hidden md:flex bg-brand-900 text-white p-10 flex-col justify-between overflow-hidden">
          {/* Background contour motif */}
          <ContourMotif className="absolute -bottom-6 -right-10 w-[420px] h-[280px] text-brand-600 opacity-25 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 p-3 rounded-xl">
                <Mountain size={28} />
              </div>

              <div>
                <h1 className="text-xl font-bold">LandslideRisk NER</h1>

                <p className="text-xs text-slate-300">
                  Early Warning & Risk Monitoring
                </p>
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-3xl font-bold leading-tight">
                Join the Network.
                <br />
                Stay Ahead of Risk.
              </h2>

              <p className="mt-5 text-slate-200 leading-relaxed">
                Create an account to submit field reports, monitor high-risk slopes, and receive critical early warnings.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">110</div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Areas monitored
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Live monitoring
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">8</div>
                <div className="text-xs text-slate-300 mt-0.5">
                  NE states covered
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-3 text-sm text-slate-200 font-medium">
            <ShieldCheck size={20} className="text-[#7FA8D9]" />
            <span>Disaster Management Monitoring System</span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-8 sm:p-12">
          {/* MOBILE LOGO */}
          <div className="flex md:hidden items-center gap-3 mb-10">
            <div className="bg-brand-900 text-white p-3 rounded-xl">
              <Mountain size={24} />
            </div>

            <div>
              <h1 className="font-bold text-brand-900">LandslideRisk NER</h1>

              <p className="text-xs text-slate-500">Early Warning System</p>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-slate-800">
              Create Account
            </h2>

            <p className="mt-2 text-slate-500">
              Sign up to access the monitoring and reporting platform.
            </p>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Password must be at least 6 characters.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-semibold shadow-sm shadow-brand-600/30 transition disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-7">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-brand-600 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
