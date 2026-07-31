import { useCallback, useEffect, useState } from "react";

import { UsersList } from "@/components/users/users-list";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { listUsers } from "@/lib/users/queries";
import type { UserListItem } from "@/lib/users/types";

export function UsersPage() {
  useDocumentTitle("Users");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const result = await listUsers();
      setUsers(result.users);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6 lg:p-8">
      {listError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive shrink-0 rounded-xl border px-4 py-3 text-sm"
        >
          Could not load users: {listError}
        </div>
      ) : null}

      <UsersList users={users} loading={listLoading} />
    </div>
  );
}
