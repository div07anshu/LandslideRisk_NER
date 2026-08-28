import { useState } from "react";
import { supabase } from "../supabase";
import { Mountain, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created successfully!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">

        <div className="flex justify-center mb-6">
          <div className="bg-[#112D4E] text-white p-3 rounded-xl">
            <Mountain size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-800">
          Create Account
        </h1>

        <p className="text-center text-slate-500 mt-2">
          Create your LandslideRisk NER account
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
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#3F72AF]"
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
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#3F72AF]"
              />
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Password must be at least 6 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#112D4E] hover:bg-[#183d66] text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        <p className="text-center text-sm text-slate-500 mt-7">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#3F72AF] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;