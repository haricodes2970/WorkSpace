"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LoginForm }    from "./login-form";
import { RegisterForm } from "./register-form";
import { OtpForm }      from "./otp-form";

type Tab   = "signin" | "register";
type Stage = "form"   | "otp";

interface AuthTabsProps {
  defaultTab?: Tab;
}

export function AuthTabs({ defaultTab = "signin" }: AuthTabsProps) {
  const [tab,   setTab  ] = useState<Tab>(defaultTab);
  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState<string>("");

  function handleEmailSuccess(resolvedEmail: string) {
    setEmail(resolvedEmail);
    setStage("otp");
  }

  function handleBack() {
    setStage("form");
    setEmail("");
  }

  return (
    <div>
      {/* Tab switcher — only shown on form stage */}
      <AnimatePresence mode="wait">
        {stage === "form" && (
          <motion.div
            key="tabs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-7"
          >
            <div className="relative flex gap-0 rounded-xl border border-white/[0.07] bg-white/[0.03] p-0.5">
              {/* Animated background pill */}
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-y-0.5 rounded-[10px] bg-white/[0.07]"
                style={{ left: tab === "signin" ? "calc(0.125rem)" : "calc(50%)", width: "calc(50% - 0.125rem)" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              {(["signin", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "relative z-10 flex-1 rounded-[10px] py-1.5 text-[12px] font-medium transition-colors duration-150",
                    tab === t ? "text-white/90" : "text-white/35 hover:text-white/55",
                  )}
                  role="tab"
                  aria-selected={tab === t}
                >
                  {t === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form content */}
      <AnimatePresence mode="wait" initial={false}>
        {stage === "otp" ? (
          <OtpForm key="otp" email={email} onBack={handleBack} />
        ) : tab === "signin" ? (
          <LoginForm key="login" onSuccess={handleEmailSuccess} />
        ) : (
          <RegisterForm key="register" onSuccess={handleEmailSuccess} />
        )}
      </AnimatePresence>
    </div>
  );
}
