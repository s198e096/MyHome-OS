import { useState } from "react";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { supabase } from "../lib/supabase.js";

export default function AuthScreen() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleSubmit() {
    setError("");
    setNotice("");
    if (!email.trim()) return setError("Enter your email.");

    if (mode === "forgot") {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
      setLoading(false);
      if (resetError) return setError(resetError.message);
      return setNotice("Check your email for a password reset link.");
    }

    if (!password) return setError("Enter your password.");

    setLoading(true);
    const { error: authError } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);

    if (authError) return setError(authError.message);
    if (mode === "signup") setNotice("Check your email to confirm your account.");
  }

  const titles = { signin: "Sign in", signup: "Create account", forgot: "Reset password" };
  const submitLabels = { signin: "Sign in", signup: "Sign up", forgot: "Send reset link" };

  return (
    <div>
      <div className="text-[17px] font-semibold text-stone-900 mb-1">{titles[mode]}</div>
      <div className="text-[12.5px] text-stone-400 mb-4">MyHome OS</div>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        autoComplete="email"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={{ border: "1px solid #E0E8D3" }}
      />
      {mode !== "forgot" && (
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
      )}

      {mode === "signin" && (
        <button onClick={() => switchMode("forgot")} className="w-full text-right text-[12px] mb-3 -mt-1" style={{ color: PRIMARY }}>
          Forgot password?
        </button>
      )}

      {error && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</div>}
      {notice && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.green }}>{notice}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold mb-3"
        style={{ background: PRIMARY, color: "white", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Please wait..." : submitLabels[mode]}
      </button>

      {mode === "forgot" ? (
        <button onClick={() => switchMode("signin")} className="w-full text-[12.5px] text-stone-500">
          Back to sign in
        </button>
      ) : (
        <button onClick={() => switchMode(mode === "signin" ? "signup" : "signin")} className="w-full text-[12.5px] text-stone-500">
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      )}
    </div>
  );
}
