import { Classes } from "../components/Classes";
import { useStore } from "../store-context";

export function ClassesPage() {
  const { templates, sessionCounts, openCreateClass, openEditClass, openCreateSession } = useStore();
  return (
    <Classes
      templates={templates}
      sessionCounts={sessionCounts}
      onCreate={openCreateClass}
      onEdit={openEditClass}
      onSchedule={(t) => openCreateSession(t.id)}
    />
  );
}
