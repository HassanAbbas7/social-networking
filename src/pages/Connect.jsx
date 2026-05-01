import ProfilePage from "./Profile";
import IdentitySelect from "../pages/IdentitySelect";
import { useEffect, useState } from "react";

export default function ConnectPage() {
  const path = window.location.pathname;
  const slug = path.split("/connect/")[1];

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem("profile");

    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, []);

  if (!profile) {
    return <IdentitySelect onSave={setProfile} />;
  }

  return <ProfilePage slug={slug} profile={profile} />;
}