import { useState } from "react";
import { supabase } from "../supabase";
import { Mountain, Mail, Lock, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ContourMotif from "../components/analysis/ContourMotif";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="relative hidden md:flex bg-[#112D4E] text-white p-10 flex-col justify-between overflow-hidden">
          {/* Background contour motif filling the lower space */}
          <ContourMotif className="absolute -bottom-6 -right-10 w-[420px] h-[280px] text-[#3F72AF] opacity-25 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="bg-[#3F72AF] p-3 rounded-xl">
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
                Monitor Risk.
                <br />
                Protect Communities.
              </h2>

              <p className="mt-5 text-slate-200 leading-relaxed">
                AI-based landslide risk monitoring and early warning system for
                the North Eastern Region of India.
              </p>
            </div>

            {/* Stat callouts to fill the mid-panel space with intent */}
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
            <div className="bg-[#112D4E] text-white p-3 rounded-xl">
              <Mountain size={24} />
            </div>

            <div>
              <h1 className="font-bold text-[#112D4E]">LandslideRisk NER</h1>

              <p className="text-xs text-slate-500">Early Warning System</p>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-slate-800">Welcome back</h2>

            <p className="mt-2 text-slate-500">
              Sign in to access the monitoring dashboard.
            </p>

            {/* LOGIN FORM */}
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {/* EMAIL */}
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
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#3F72AF] focus:border-transparent"
                  />
                </div>
              </div>

              {/* PASSWORD */}
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#3F72AF] focus:border-transparent"
                  />
                </div>
              </div>

              {/* ERROR BANNER — reserved space, fades in without layout jump */}
              <div
                className={`grid transition-all duration-200 ease-out ${
                  error
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3F72AF] hover:bg-[#345f92] text-white py-3 rounded-lg font-semibold shadow-sm shadow-[#3F72AF]/30 transition disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* SIGN UP */}
            <p className="text-center text-sm text-slate-500 mt-7">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#3F72AF] font-semibold hover:underline"
              >
                Create account
              </Link>
            </p>

            {/* DEMO NOTE */}
            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
              <strong className="text-slate-700">Demo access</strong>
              <br />
              Authorized field teams and analysts can sign in with credentials
              issued by their regional coordinator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
