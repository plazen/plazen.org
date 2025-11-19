import { NotificationManager } from "./NotificationManager";
import AdminPage from "../AdminPage";

export default async function AdminNotificationsPage() {
  return (
    <AdminPage>
      <div className="p-4 md:p-8">
        <NotificationManager />
      </div>
    </AdminPage>
  );
}
