import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { TABLE_NAME } from "../data/config";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export default function IdentityConfirm({ slug }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);


  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error(error);
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    if (slug) fetchProfile();
  }, [slug]);

  const handleYes = () => {
    if (!profile) return;

    localStorage.setItem("profile", JSON.stringify(profile));
    // window.location.href = "/";
  };

  const handleNo = () => {
    window.location.href = "/identity";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <p className="text-sm text-neutral-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-neutral-200">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Profile Not Found
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            We could not find a profile for this QR code.
          </p>

          <button
            type="button"
            onClick={handleNo}
            className="mt-6 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Choose another profile
          </button>
        </div>
      </div>
    );
  }

if (confirmed) {
    // return something like "Welcome {profile.name}! you can close this window now. "
    return (

        <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-neutral-200">
                <h1 className="text-2xl font-semibold text-neutral-900">
                    Welcome, {profile.name}!
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    You can close this window now.
                </p>    
            </div>
        </div>
    );
}
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-8 text-neutral-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Is this you?
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Your phone will remember you all day.
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-neutral-50 p-5 text-center ring-1 ring-neutral-200">
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-2xl font-semibold text-neutral-700">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              profile.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>

          <h2 className="mt-4 text-xl font-semibold text-neutral-900">
            {profile.name}
          </h2>

          {profile.title && (
            <p className="mt-1 text-sm font-medium text-neutral-700">
              {profile.title}
            </p>
          )}

          {profile.company && (
            <p className="mt-1 text-sm text-neutral-500">
              {profile.company}
            </p>
          )}
        </div>

        <div className="mt-5 space-y-3 text-sm">
          {profile.sector && (
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
              <span className="text-neutral-500">Sector</span>
              <span className="font-medium text-neutral-800">
                {profile.sector}
              </span>
            </div>
          )}

          {profile.country && (
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
              <span className="text-neutral-500">Country</span>
              <span className="font-medium text-neutral-800">
                {profile.country}
              </span>
            </div>
          )}

          {profile.bio && (
            <div className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-sm leading-relaxed text-neutral-600">
                {profile.bio}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleNo}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            No
          </button>

          <button
            type="button"
            onClick={()=> {
                setConfirmed(true);
                setTimeout(handleYes, 2000);
            }}
            className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Yes, this is me
          </button>
        </div>
      </div>
    </div>
  );
}