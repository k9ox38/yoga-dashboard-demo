import { useParams } from "react-router";
import { InstructorDetail } from "../components/InstructorDetail";

export function InstructorDetailPage() {
  const { id = "" } = useParams();
  return <InstructorDetail instructorId={id} />;
}
