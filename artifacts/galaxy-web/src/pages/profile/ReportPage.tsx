import { UserProfile } from "../../lib/userService";
import SupportForm from "./SupportForm";

export default function ReportPage({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  return <SupportForm kind="report" user={user} onClose={onClose} />;
}