import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { TABLE_NAME } from "../data/config";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const path = window.location.pathname;
  const id = path.split("/profile/")[1];

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    if (id) fetchProfile();
  }, [id]);

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

  return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
    <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-md w-full">
      
      {/* Top Section */}
      <div className="text-center">
        <div className="w-28 h-28 mx-auto rounded-full overflow-hidden shadow-lg ring-4 ring-indigo-100 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500">
  {profile.picture ? (
    <img
      src={profile.picture}
      alt={profile.name}
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-white text-3xl font-bold">
      {profile.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()}
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

      {/* Divider */}
      <div className="my-6 border-t border-gray-200" />

      {/* Info Section */}
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

      {/* Button */}
      <button
        onClick={() => window.open(profile.linkedin, "_blank")}
        className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-md hover:shadow-lg"
      >
        Connect on LinkedIn
      </button>
    </div>
  </div>
);
}