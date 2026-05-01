import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Html5Qrcode } from "html5-qrcode";

export default function IdentitySelect() {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  const [attendees, setAttendees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);


  const onSave = (profile) => {
    localStorage.setItem("profile", JSON.stringify(profile));
  }
  useEffect(() => {
    async function fetchAttendees() {
      const { data, error } = await supabase
        .from("attendees")
        .select("id, slug, name, company, title, photo_url")
        .order("name", { ascending: true });

      if (!error) setAttendees(data || []);
      setLoading(false);
    }

    fetchAttendees();
  }, []);

  const filteredAttendees = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return attendees;

    return attendees.filter((attendee) =>
      `${attendee.name} ${attendee.company} ${attendee.title}`
        .toLowerCase()
        .includes(term)
    );
  }, [attendees, search]);

  const selectedAttendee = attendees.find((a) => a.id === selectedId);

  const handleContinue = () => {
    if (!selectedAttendee) return;

    // const profileData = {
    //   id: selectedAttendee.id,
    //   slug: selectedAttendee.slug,
    //   name: selectedAttendee.name,
    //   company: selectedAttendee.company,
    //   title: selectedAttendee.title,
    //   photo_url: selectedAttendee.photo_url,
    // };

    // localStorage.setItem("profile", JSON.stringify(profileData));
    // onSave(profileData);
    // redirect
    window.location.href = `/connect/${selectedAttendee.slug}`;
  };

  // QR Scanner logic
  useEffect(() => {
    if (!scanning) return;

    const qr = new Html5Qrcode("qr-reader");

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        qr.stop().then(() => {
          setScanning(false);

          // Redirect immediately
          window.location.href = decodedText;
        });
      },
      () => {}
    );

    return () => {
      qr.stop().catch(() => {});
    };
  }, [scanning]);

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Who are you?
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Scan your QR code or type your name to find your profile.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScanning(true)}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium transition hover:bg-neutral-50"
          >
            <span className="text-lg">▣</span>
            Scan QR Code
          </button>

          {scanning && (
            <div className="mb-5">
              <div
                id="qr-reader"
                className="w-full overflow-hidden rounded-xl border border-neutral-200"
              />
            </div>
          )}

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs uppercase tracking-wide text-neutral-400">
              or
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Type your name"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedId("");
              }}
              disabled={loading}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 disabled:bg-neutral-100"
            />

            {!loading && search && filteredAttendees.length && !selectedAttendee > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
                {filteredAttendees.map((attendee) => (
                  <button
                    key={attendee.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(attendee.id);
                      setSearch(attendee.name);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-neutral-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-xs font-semibold">
                      {attendee.photo_url ? (
                        <img
                          src={attendee.photo_url}
                          alt={attendee.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        attendee.name?.charAt(0)
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {attendee.name}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {attendee.title} · {attendee.company}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && search && filteredAttendees.length === 0 && (
              <p className="text-sm text-neutral-500">
                No matching attendees found.
              </p>
            )}
          </div>

          {selectedAttendee && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold">
                {selectedAttendee.photo_url ? (
                  <img
                    src={selectedAttendee.photo_url}
                    alt={selectedAttendee.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  selectedAttendee.name?.charAt(0)
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {selectedAttendee.name}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {selectedAttendee.title} · {selectedAttendee.company}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedAttendee}
            className="mt-6 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}