import * as React from "react";
import { ArrowUpDown, Search, X } from "lucide-react";
import { useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatBirthDate,
  formatDateTime,
  humanizeSnake,
} from "@/lib/users/format";
import type { UserListItem } from "@/lib/users/types";
import { cn } from "@/lib/utils";

type UsersListProps = {
  users: UserListItem[];
  loading?: boolean;
};

type SortKey =
  | "user"
  | "birthDate"
  | "role"
  | "createdAt"
  | "state"
  | "area"
  | "onboardingCompleted";

function userLabel(user: UserListItem): string {
  return user.email || (user.is_anonymous ? "Anonymous user" : "User");
}

function roleLabel(user: UserListItem): string {
  return typeof user.role === "string" && user.role.trim()
    ? humanizeSnake(user.role)
    : "Member";
}

function birthDateLabel(user: UserListItem): string {
  return formatBirthDate(user.birth_month, user.birth_year);
}

function valueForSort(user: UserListItem, key: SortKey): string {
  const values: Record<SortKey, string> = {
    user: userLabel(user),
    birthDate: birthDateLabel(user),
    role: roleLabel(user),
    createdAt: user.created_at ?? "",
    state: user.state?.name ?? "",
    area: user.area?.name ?? "",
    onboardingCompleted: user.onboarding_completed_at ?? "",
  };
  return values[key];
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead className={cn("bg-card", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-1 text-left hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <ArrowUpDown
          className={isActive ? "size-3.5 text-foreground" : "size-3.5"}
          aria-label={isActive ? `Sorted ${direction}` : undefined}
        />
      </button>
    </TableHead>
  );
}

export function UsersList({ users, loading }: UsersListProps) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc",
  );

  const displayedUsers = React.useMemo(() => {
    const value = query.trim().toLowerCase();
    return users
      .filter(
        (user) =>
          !value ||
          [
            userLabel(user),
            user.state?.name,
            user.area?.name,
            roleLabel(user),
            birthDateLabel(user),
          ].some((field) =>
            String(field ?? "")
              .toLowerCase()
              .includes(value),
          ),
      )
      .sort(
        (a, b) =>
          valueForSort(a, sortKey).localeCompare(
            valueForSort(b, sortKey),
            undefined,
            { numeric: true, sensitivity: "base" },
          ) * (sortDirection === "asc" ? 1 : -1),
      );
  }, [query, sortDirection, sortKey, users]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function openUser(user: UserListItem) {
    navigate(`/dashboard/users/${encodeURIComponent(user.id)}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 justify-end">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users…"
            className="h-8 pr-8 pl-8"
            aria-label="Search users"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex shrink-0 items-center border-b border-border/60 px-6 py-3">
          <p className="text-muted-foreground text-sm">
            {loading
              ? "Loading users…"
              : `${displayedUsers.length} user${displayedUsers.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto **:data-[slot=table-container]:overflow-visible">
          <Table>
            <TableHeader className="bg-card sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <SortableHead
                  label="User"
                  sortKey="user"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="min-w-64 pl-6"
                />
                <SortableHead
                  label="Birth Date"
                  sortKey="birthDate"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="min-w-36"
                />
                <SortableHead
                  label="State"
                  sortKey="state"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="min-w-28"
                />
                <SortableHead
                  label="Area"
                  sortKey="area"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="min-w-28"
                />
                <SortableHead
                  label="Onboarding Completed"
                  sortKey="onboardingCompleted"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="min-w-48"
                />
                <SortableHead
                  label="Role"
                  sortKey="role"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="min-w-28"
                />
                <SortableHead
                  label="Created At"
                  sortKey="createdAt"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="min-w-40 pr-6"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, row) => (
                    <TableRow key={row}>
                      {Array.from({ length: 7 }).map((__, cell) => (
                        <TableCell
                          key={cell}
                          className={cell === 0 ? "pl-6" : undefined}
                        >
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : displayedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => openUser(user)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openUser(user);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`View details for ${userLabel(user)}`}
                    >
                      <TableCell className="max-w-72 pl-6 whitespace-normal">
                        <p className="font-medium">{userLabel(user)}</p>
                        <p className="text-muted-foreground break-all font-mono text-[11px]">
                          {user.id}
                        </p>
                      </TableCell>
                      <TableCell>{birthDateLabel(user)}</TableCell>
                      <TableCell>{user.state?.name ?? "—"}</TableCell>
                      <TableCell>{user.area?.name ?? "—"}</TableCell>
                      <TableCell>
                        {user.onboarding_completed_at ? (
                          <Badge>Complete</Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            Not completed
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{roleLabel(user)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground pr-6 text-xs">
                        {formatDateTime(user.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && displayedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-12 text-center"
                  >
                    {query
                      ? `No users match “${query}”.`
                      : "No users have signed up yet."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
