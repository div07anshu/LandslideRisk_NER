import { useState } from "react";
import { Mountain, Lock, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useTranslation } from "react-i18next";

export default function UpdatePassword() {
  const { t } = useTranslation();
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
      setError(t("auth.updatePassword.errors.tooShort"));
      return;
    }

    if (password !== confirm) {
      setError(t("auth.updatePassword.errors.noMatch"));
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
            {t("auth.updatePassword.successTitle")}
          </h1>

          <p className="text-slate-500 mt-2">
            {t("auth.updatePassword.successMessage")}
          </p>

          <button
            onClick={() => navigate("/login")}
            className="inline-block mt-6 bg-brand-900 hover:bg-brand-800 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            {t("auth.updatePassword.goToSignIn")}
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
          {t("auth.updatePassword.title")}
        </h1>

        <p className="text-center text-slate-500 mt-2">
          {t("auth.updatePassword.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("auth.updatePassword.newPasswordLabel")}
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                placeholder={t("auth.updatePassword.newPasswordPlaceholder")}
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
              {t("auth.updatePassword.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                placeholder={t("auth.updatePassword.confirmPasswordPlaceholder")}
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
            {loading ? t("auth.updatePassword.updating") : t("auth.updatePassword.updateButton")}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-7">
          <Link
            to="/login"
            className="text-brand-600 font-semibold hover:underline"
          >
            {t("auth.updatePassword.backToSignIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}