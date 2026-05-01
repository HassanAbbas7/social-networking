import ProfilePage from "./Profile";
import IdentitySelect from "../pages/IdentitySelect";
import IdnetityConfirm from "./IdentityConfirm";
import { useEffect, useState } from "react";
import IdentityConfirm from "./IdentityConfirm";

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
    return <IdentityConfirm slug={slug} />;
  }

  return <ProfilePage slug={slug} profile={profile} />;
}