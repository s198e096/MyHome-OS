import { useState } from "react";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { supabase } from "../lib/supabase.js";

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) return setError(updateError.message);
    onDone();
  }

  return (
    <div>
      <div className="text-[17px] font-semibold text-stone-900 mb-1">Set a new password</div>
      <div className="text-[12.5px] text-stone-400 mb-4">MyHome OS</div>

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        type="password"
        autoComplete="new-password"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={{ border: "1px solid #E0E8D3" }}
      />
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        type="password"
        autoComplete="new-password"
        className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
        style={{ border: "1px solid #E0E8D3" }}
      />

      {error && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
        style={{ background: PRIMARY, color: "white", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Saving..." : "Save new password"}
      </button>
    </div>
  );
}
