import { Instructors } from "../components/Instructors";
import { useStore } from "../store-context";

export function InstructorsPage() {
  const { instructors, openEditInstructor } = useStore();
  return <Instructors instructors={instructors} onEdit={openEditInstructor} />;
}
