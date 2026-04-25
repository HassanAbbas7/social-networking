import NetworkGraph from "../components/graph/NetworkGraph";
import { demoAttendees } from "../data/demoAttendees";
import { demoConnections } from "../data/demoConnections";

function ScreenPage() {
  return (
    <NetworkGraph
      attendees={demoAttendees}
      connections={demoConnections}
    />
  );
}

export default ScreenPage;