import { DocumentationManager } from "./DocumentationManager";
import AdminPage from "../AdminPage";

export default async function AdminDocumentationPage() {
  return (
    <AdminPage>
      <div className="p-4 md:p-8">
        <DocumentationManager />
      </div>
    </AdminPage>
  );
}
