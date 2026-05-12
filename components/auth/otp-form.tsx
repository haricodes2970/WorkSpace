"use client";

import { useRef, useState, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { verifyOtpAction } from "@/lib/auth/auth-actions";
import { useRouter } from "next/navigation";

const OTP_LENGTH = 6;

const schema = z.object({
  code: z.string().length(OTP_LENGTH, "Enter all 6 digits"),
});
type FormValues = z.infer<typeof schema>;

interface OtpFormProps {
  email:   string;
  onBack:  () => void;
}

export function OtpForm({ email, onBack }: OtpFormProps) {
  const router   = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error,  setError ] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const refs     = useRef<(HTMLInputElement | null)[]>([]);

  const setRef = useCallback((i: number) => (el: HTMLInputElement | null) => {
    refs.current[i] = el;
  }, []);

  function focusAt(i: number) {
    refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus();
  }

  function updateDigit(index: number, value: string) {
    const d = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < OTP_LENGTH - 1) focusAt(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        updateDigitDirect(index, "");
      } else {
        focusAt(index - 1);
        updateDigitDirect(index - 1, "");
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault(); focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault(); focusAt(index + 1);
    }
  }

  function updateDigitDirect(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next   = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  async function handleSubmit() {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) { setError("Enter all 6 digits"); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await verifyOtpAction(email, code);
      if (!result.success) {
        setError(result.error);
        setDigits(Array(OTP_LENGTH).fill(""));
        focusAt(0);
      } else {
        router.push(result.data.redirectTo);
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isComplete = digits.every(Boolean);

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Email indicator */}
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
        <Mail className="h-3.5 w-3.5 shrink-0 text-white/30" />
        <span className="flex-1 text-[13px] text-white/60 truncate">{email}</span>
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] text-[--color-primary]/80 hover:text-[--color-primary] transition-colors shrink-0"
        >
          Change
        </button>
      </div>

      {/* Instructions */}
      <div>
        <h2 className="text-[18px] font-semibold text-white/90 tracking-tight">
          Check your inbox
        </h2>
        <p className="mt-1 text-[13px] text-white/40 leading-relaxed">
          We sent a 6-digit code to your email.
        </p>
      </div>

      {/* OTP boxes */}
      <div className="flex gap-2" role="group" aria-label="Verification code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={setRef(i)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            autoFocus={i === 0}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => updateDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={cn(
              "h-12 w-full min-w-0 rounded-xl border text-center text-[18px] font-semibold tabular-nums",
              "bg-white/[0.04] text-white/90 outline-none",
              "transition-all duration-150",
              d
                ? "border-[--color-primary]/50 bg-[--color-primary]/[0.08]"
                : "border-white/[0.09] focus:border-white/20 focus:bg-white/[0.06]",
              "focus-visible:ring-1 focus-visible:ring-[--color-primary]/30",
              "caret-transparent selection:bg-[--color-primary]/20",
            )}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[12px] text-red-400/80"
        >
          {error}
        </motion.p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isComplete || loading}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
          "bg-[--color-primary] text-[13px] font-medium text-white",
          "transition-all duration-150",
          "hover:bg-[--color-primary-hover] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
        )}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Verifying…" : "Verify code"}
      </button>

      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
    </motion.div>
  );
}
