import { UserProfile } from "../../lib/userService";
import SupportForm from "./SupportForm";

export default function FeedbackPage({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  return <SupportForm kind="feedback" user={user} onClose={onClose} />;
}