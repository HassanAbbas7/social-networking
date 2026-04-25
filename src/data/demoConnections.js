export const demoConnections = [
  // { id: "c1", scanner_id: "1", scanned_id: "2" },
  // { id: "c2", scanner_id: "1", scanned_id: "3" },
  // { id: "c3", scanner_id: "2", scanned_id: "4" },
  // { id: "c4", scanner_id: "3", scanned_id: "5" },
  // { id: "c5", scanner_id: "4", scanned_id: "6" },
  // { id: "c6", scanner_id: "2", scanned_id: "6" },
];

for (let i=2; i<490; i++){
  demoConnections.push({
    id: `c${i}`,
    scanner_id: (Math.floor(Math.random() * (495 - 2)) + 2).toString(),
    scanned_id: (Math.floor(Math.random() * (495 - 2)) + 2).toString(),
  })
}