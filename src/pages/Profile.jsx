import React from "react";

const demoProfiles = [
  {
    id: 1,
    name: "Raza",
    profession: "Programmer",
    picture: "",
    bio: "Passionate full-stack developer who loves building modern web apps.",
  },
  {
    id: 2,
    name: "Hassan",
    profession: "Programmer",
    picture: "",
    bio: "Creative coder focused on React and backend systems.",
  },
  {
    id: 3,
    name: "Abbas",
    profession: "Programmer",
    picture: "",
    bio: "Problem solver and freelancer delivering clean solutions.",
  },
];

export default function ProfilePage() {
  const path = window.location.pathname;
  const id = path.split("/profile/")[1];

  const profile = demoProfiles.find((item) => item.id === Number(id));

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h1 className="text-3xl font-bold text-red-500">Profile Not Found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-md w-full text-center">
        
        {/* Profile Image */}
        <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
          {profile.name.charAt(0)}
        </div>

        {/* Name */}
        <h1 className="text-3xl font-bold mt-5 text-gray-800">
          {profile.name}
        </h1>

        {/* Profession */}
        <p className="text-indigo-600 font-medium mt-2">
          {profile.profession}
        </p>

        {/* Bio */}
        <p className="text-gray-500 mt-4 leading-relaxed">
          {profile.bio}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <h2 className="font-bold text-lg text-gray-800">12</h2>
            <p className="text-sm text-gray-500">Projects</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <h2 className="font-bold text-lg text-gray-800">5</h2>
            <p className="text-sm text-gray-500">Clients</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <h2 className="font-bold text-lg text-gray-800">4.9</h2>
            <p className="text-sm text-gray-500">Rating</p>
          </div>
        </div>

        {/* Button */}
        <button className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-300">
          Connect
        </button>
      </div>
    </div>
  );
}