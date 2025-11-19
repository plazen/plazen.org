import { ReleaseNotesManager } from "./ReleaseNotesManager";
import AdminPage from "../AdminPage";

export default async function AdminReleaseNotesPage() {
  return (
    <AdminPage>
      <div className="p-4 md:p-8">
        <ReleaseNotesManager />
      </div>
    </AdminPage>
  );
}
