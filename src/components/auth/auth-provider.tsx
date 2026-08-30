"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PortalShell, type UpcomingMatch } from "@/components/shell/portal-shell";
import type { CurrentProfile } from "@/lib/auth-types";
import { withBasePath } from "@/lib/base-path";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  profile: CurrentProfile;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function todayInNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    iso: `${value.year}-${value.month}-${value.day}`,
    label: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date()),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [upcomingMatch, setUpcomingMatch] = useState<UpcomingMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => todayInNewYork(), []);

  async function loadSession() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace(withBasePath("/login/"));
      return;
    }

    const [{ data: profileData }, { data: matchData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("matches")
        .select("opponent, home_away, date")
        .eq("status", "upcoming")
        .gte("date", today.iso)
        .order("date", { ascending: true })
        .order("kickoff_time", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!profileData) {
      await supabase.auth.signOut();
      window.location.replace(withBasePath("/login/"));
      return;
    }

    setProfile(profileData as CurrentProfile);
    setUpcomingMatch((matchData as UpcomingMatch | null) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadSession(), 0);
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") window.location.replace(withBasePath("/login/"));
    });
    return () => {
      window.clearTimeout(loadTimer);
      listener.subscription.unsubscribe();
    };
    // A route change also refreshes permissions so promotions take effect immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (loading || !profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">Loading NCF portal</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ profile, refreshProfile: loadSession }}>
      <PortalShell profile={profile} todayLabel={today.label} upcomingMatch={upcomingMatch}>
        {children}
      </PortalShell>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
