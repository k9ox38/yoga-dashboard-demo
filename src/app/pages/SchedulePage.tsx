import { Schedule } from "../components/Schedule";
import { useStore } from "../store-context";

export function SchedulePage() {
  const { sessions, templates, openEditSession, openCreateSession } = useStore();
  return <Schedule sessions={sessions} templates={templates} onEdit={openEditSession} onCreate={(date, start, end) => openCreateSession(undefined, date, start, end)} />;
}
