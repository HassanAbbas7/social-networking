export const demoAttendees = [];

for (let i = 1; i <= 500; i++) {
  demoAttendees.push({
    id: String(i),
    name: `User ${i}`,
    company: `Company ${i}`,
    title: "Attendee",
    sector: "Tech",
    country: "Germany",
  });
}