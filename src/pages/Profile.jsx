import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { TABLE_NAME } from "../data/config";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function getCurrentUserSlug() {
  try {
    const rawProfile = localStorage.getItem("profile");

    if (!rawProfile) return null;

    const parsed = JSON.parse(rawProfile);

    // Case 1:
    // localStorage profile = {
    //   profile: "{\"slug\":\"hassan-naqvi_4b64\", ...}"
    // }
    if (parsed?.profile && typeof parsed.profile === "string") {
      const innerProfile = JSON.parse(parsed.profile);
      return innerProfile?.slug || null;
    }

    // Case 2:
    // localStorage profile = {
    //   profile: { slug: "hassan-naqvi_4b64", ... }
    // }
    if (parsed?.profile && typeof parsed.profile === "object") {
      return parsed.profile?.slug || null;
    }

    // Case 3:
    // localStorage profile = {
    //   slug: "hassan-naqvi_4b64",
    //   ...
    // }
    return parsed?.slug || null;
  } catch (error) {
    console.error("Could not parse profile from localStorage:", error);
    return null;
  }
}

export default function ProfilePage({ slug }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserSlug = useMemo(() => getCurrentUserSlug(), []);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);

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

    if (slug) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h1 className="text-3xl font-bold text-red-500">
          Profile Not Found
        </h1>
      </div>
    );
  }

  if (currentUserSlug && currentUserSlug === profile.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            This is your profile
          </h1>

          <p className="text-gray-600 mt-3">
            You are all set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-28 h-28 mx-auto rounded-full overflow-hidden shadow-lg ring-4 ring-indigo-100 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500">
            {profile.photo_url || profile.picture ? (
              <img
                src={profile.photo_url || profile.picture}
                alt={profile.name || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl font-bold">
                {profile.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?"}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold mt-5 text-gray-900">
            {profile.name}
          </h1>

          <p className="text-indigo-600 font-medium mt-1">
            {profile.title}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            {profile.company}
          </p>
        </div>

        <div className="my-6 border-t border-gray-200" />

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl">
            <span className="text-gray-500">Sector</span>
            <span className="font-medium text-gray-800">
              {profile.sector}
            </span>
          </div>

          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl">
            <span className="text-gray-500">Country</span>
            <span className="font-medium text-gray-800">
              {profile.country}
            </span>
          </div>

          {profile.bio && (
            <div className="bg-gray-50 px-4 py-3 rounded-xl">
              <p className="text-gray-600 leading-relaxed text-sm">
                {profile.bio}
              </p>
            </div>
          )}
        </div>

        {(profile.linkedin_url || profile.linkedin) && (
          <button
            onClick={() =>
              window.open(profile.linkedin_url || profile.linkedin, "_blank")
            }
            className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-md hover:shadow-lg"
          >
            Connect with {profile.name.split(" ")[0]}
          </button>
        )}
      </div>
    </div>
  );
}