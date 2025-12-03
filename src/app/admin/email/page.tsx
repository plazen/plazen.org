import AdminPage from "../AdminPage";
import { EmailManager } from "./EmailManager";

export default function AdminEmailPage() {
  return (
    <AdminPage>
      <div className="p-4 md:p-8">
        <EmailManager />
      </div>
    </AdminPage>
  );
}
