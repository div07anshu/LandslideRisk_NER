import { useState } from "react";
import { supabase } from "../supabase";
import {
  Mountain,
  Mail,
  Lock,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ContourMotif from "../components/analysis/ContourMotif";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // "login" | "forgot"
  const [mode, setMode] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/login`,
    });

    setResetLoading(false);

    if (error) {
      setResetError(error.message);
      return;
    }

    setResetSent(true);
  };

  const goToForgot = () => {
    setResetEmail(email);
    setResetError("");
    setResetSent(false);
    setMode("forgot");
  };

  const backToLogin = () => {
    setMode("login");
    setResetError("");
    setResetSent(false);
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
            {mode === "login" ? (
              <>
                <h2 className="text-3xl font-bold text-slate-800">
                  Welcome back
                </h2>

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
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={goToForgot}
                        className="text-xs font-semibold text-[#3F72AF] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

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
                  Authorized field teams and analysts can sign in with
                  credentials issued by their regional coordinator.
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 mb-6"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                  Back to sign in
                </button>

                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle2
                        size={24}
                        strokeWidth={2.5}
                        className="text-green-600"
                      />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800">
                      Check your inbox
                    </h2>

                    <p className="mt-2 text-slate-500">
                      We've sent a password reset link to{" "}
                      <span className="font-medium text-slate-700">
                        {resetEmail}
                      </span>
                      .
                    </p>

                    <button
                      type="button"
                      onClick={backToLogin}
                      className="inline-block mt-6 bg-[#112D4E] hover:bg-[#183d66] text-white py-3 px-6 rounded-lg font-semibold transition"
                    >
                      Back to sign in
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Reset your password
                    </h2>

                    <p className="mt-2 text-slate-500">
                      Enter the email associated with your account and we'll
                      send you a link to reset your password.
                    </p>

                    <form
                      onSubmit={handleForgotPassword}
                      className="mt-8 space-y-5"
                    >
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
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#3F72AF] focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div
                        className={`grid transition-all duration-200 ease-out ${
                          resetError
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {resetError}
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full bg-[#3F72AF] hover:bg-[#345f92] text-white py-3 rounded-lg font-semibold shadow-sm shadow-[#3F72AF]/30 transition disabled:opacity-60"
                      >
                        {resetLoading ? "Sending..." : "Send reset link"}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
