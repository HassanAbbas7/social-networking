import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { TABLE_NAME, DEVELOPER_MODE } from "../data/config";
import ProfileScreen from "../components/common/ProfileScreen";
import SuccessScreen from "../components/common/SuccessScreen";
import EdgeScreen from "../components/common/EdgeScreen";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const CONNECTIONS_TABLE = "connections";

function getCurrentUserSlug() {
  try {
    const rawProfile = localStorage.getItem("profile");
    if (!rawProfile) return null;
    const parsed = JSON.parse(rawProfile);
    if (parsed?.profile && typeof parsed.profile === "string")
      return JSON.parse(parsed.profile)?.slug || null;
    if (parsed?.profile && typeof parsed.profile === "object")
      return parsed.profile?.slug || null;
    return parsed?.slug || null;
  } catch {
    return null;
  }
}

export default function ProfilePage({ slug }) {
  const [profile, setProfile] = useState(null);
  const [attendeeList, setAttendeeList] = useState([]);
  const [screen, setScreen] = useState("loading");  // loading | profile | success | self | duplicate | notFound | notActivated
  const [connecting, setConnecting] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);

  const currentUserSlug = useMemo(() => getCurrentUserSlug(), []);

  // ── Fetch scanned profile + determine initial screen ──
  useEffect(() => {
    async function init() {
      // 1. No identity saved → must activate first
      if (!currentUserSlug) {
        // Fetch attendee list for the picker
        const { data } = await supabase.from(TABLE_NAME).select("slug, name, company");
        setAttendeeList(data || []);
        setScreen("notActivated");
        return;
      }

      // 2. Load the scanned profile
      const { data: scannedProfile } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("slug", slug)
        .single();

      if (!scannedProfile) { setScreen("notFound"); return; }
      setProfile(scannedProfile);

      // 3. Self-scan?
      if (slug === currentUserSlug) { setScreen("self"); return; }

      // 4. Already connected?
      const { data: currentUser } = await supabase
        .from(TABLE_NAME).select("id").eq("slug", currentUserSlug).single();

      if (currentUser) {
        const { data: existing } = await supabase
          .from(CONNECTIONS_TABLE)
          .select("id")
          .or(
            `and(scanner_id.eq.${currentUser.id},scanned_id.eq.${scannedProfile.id}),and(scanner_id.eq.${scannedProfile.id},scanned_id.eq.${currentUser.id})`
          )
          .maybeSingle();

        if (existing) { setScreen("duplicate"); return; }
      }

      setScreen("profile");
    }

    init();
  }, [slug, currentUserSlug]);

  // ── Connect handler ──
  async function handleConnect() {
    if (!profile) return;
    setConnecting(true);

    const { data: currentUser } = await supabase
      .from(TABLE_NAME).select("*").eq("slug", currentUserSlug).single();

    await supabase.from(CONNECTIONS_TABLE).insert({
      scanner_id: currentUser.id,
      scanned_id: profile.id,
    });

    // Fetch today's connection count for the reward badge
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from(CONNECTIONS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("scanner_id", currentUser.id)
      .gte("created_at", today);

    setConnectionCount(count || 1);
    setConnecting(false);
    setScreen("success");
  }

  // ── Activate (notActivated → save identity + reload) ──
  function handleActivate(selectedSlug) {
    localStorage.setItem("profile", JSON.stringify({ slug: selectedSlug }));
    // Reload so getCurrentUserSlug() picks up the new value
    window.location.reload();
  }

  // ── Render ──
  if (screen === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{
          width: 24, height: 24,
          border: "2.5px solid #E4DED4",
          borderTopColor: "#008080",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
      </div>
    );
  }

  if (screen === "profile") {
    return (
      <ProfileScreen
        profile={profile}
        onConnect={handleConnect}
        connecting={connecting}
      />
    );
  }

  if (screen === "success") {
    return (
      <SuccessScreen
        profile={profile}
        connectionCount={connectionCount}
      />
    );
  }

  if (screen === "notActivated") {
    return (
      <EdgeScreen
        type="notActivated"
        profile={null}
        attendeeList={attendeeList}
        onActivate={handleActivate}
      />
    );
  }

  // self | duplicate | notFound
  return (
    <EdgeScreen
      type={screen}
      profile={profile}
    />
  );
}