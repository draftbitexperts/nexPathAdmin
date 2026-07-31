import * as React from "react";
import {
  Activity,
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  MonitorSmartphone,
  Route,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  categoryName,
  communityDurationLabel,
  formatBirthDate,
  formatDate,
  formatDateTime,
  humanizeSnake,
} from "@/lib/users/format";
import {
  formatEventTitle,
  formatOccurredAt,
  formatRelativeTime,
  formatScreenLabel,
  getEventScreen,
  getEventTarget,
  getEventTargetLabel,
  humanizeSnake as humanizeAnalyticsSnake,
} from "@/lib/analytics/format";
import { getUserDetail } from "@/lib/users/queries";
import type {
  UserAnalyticsEvent,
  UserAppointment,
  UserDetail,
  UserDevice,
  UserListItem,
  UserPathCategory,
} from "@/lib/users/types";
import { cn } from "@/lib/utils";

type UsersManagerProps = {
  users: UserListItem[];
  listLoading?: boolean;
};

const USER_DETAIL_TABS = [
  "steps",
  "categories",
  "device",
  "appointments",
  "path",
] as const;

type UserDetailTab = (typeof USER_DETAIL_TABS)[number];

type UserDetailData = {
  steps: UserAnalyticsEvent[];
  categories: UserPathCategory[];
  devices: UserDevice[];
  appointments: UserAppointment[];
  path: UserPathCategory[];
};

const detailTabMeta: Record<
  UserDetailTab,
  {
    label: string;
    emptyMessage: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  steps: {
    label: "Analytics",
    emptyMessage: "No analytics events recorded for this user.",
    icon: Activity,
  },
  categories: {
    label: "Categories",
    emptyMessage: "No onboarding categories selected for this user.",
    icon: ClipboardList,
  },
  device: {
    label: "Devices",
    emptyMessage: "No devices have checked in for this user.",
    icon: MonitorSmartphone,
  },
  appointments: {
    label: "Appointments",
    emptyMessage: "No appointments scheduled for this user.",
    icon: CalendarClock,
  },
  path: {
    label: "My Path",
    emptyMessage: "No My Path categories saved for this user.",
    icon: Route,
  },
};
type SortKey =
  | "user"
  | "birthDate"
  | "role"
  | "createdAt"
  | "state"
  | "area"
  | "communityDuration"
  | "onboardingStep"
  | "onboardingCompleted";

function detailDataFromResponse(detail: UserDetail): UserDetailData {
  return {
    steps: detail.events,
    categories: detail.path,
    devices: detail.devices,
    appointments: detail.appointments,
    path: detail.path,
  };
}

function isTabEmpty(tab: UserDetailTab, data: UserDetailData): boolean {
  switch (tab) {
    case "steps":
      return data.steps.length === 0;
    case "categories":
      return data.categories.length === 0;
    case "device":
      return data.devices.length === 0;
    case "appointments":
      return data.appointments.length === 0;
    case "path":
      return data.path.length === 0;
  }
}

function userLabel(user: UserListItem): string {
  if (user.email) return user.email;
  return user.is_anonymous ? "Anonymous user" : "User";
}

function birthDateLabel(user: UserListItem): string {
  return formatBirthDate(user.birth_month, user.birth_year);
}

function roleLabel(user: UserListItem): string {
  const role = user.role;
  return typeof role === "string" && role.trim()
    ? humanizeSnake(role)
    : "Member";
}

function onboardingStepLabel(user: UserListItem): string {
  const step = user.onboarding_step ?? user.current_onboarding_step;
  if (typeof step === "string" && step.trim()) return humanizeSnake(step);
  if (typeof step === "number") return `Step ${step}`;
  return user.onboarding_completed_at ? "Complete" : "Not started";
}

function compareUsers(a: UserListItem, b: UserListItem, key: SortKey): number {
  const values: Record<SortKey, string> = {
    user: userLabel(a),
    birthDate: birthDateLabel(a),
    role: roleLabel(a),
    createdAt: a.created_at ?? "",
    state: a.state?.name ?? "",
    area: a.area?.name ?? "",
    communityDuration: communityDurationLabel(a),
    onboardingStep: onboardingStepLabel(a),
    onboardingCompleted: a.onboarding_completed_at ?? "",
  };
  const otherValues: Record<SortKey, string> = {
    user: userLabel(b),
    birthDate: birthDateLabel(b),
    role: roleLabel(b),
    createdAt: b.created_at ?? "",
    state: b.state?.name ?? "",
    area: b.area?.name ?? "",
    communityDuration: communityDurationLabel(b),
    onboardingStep: onboardingStepLabel(b),
    onboardingCompleted: b.onboarding_completed_at ?? "",
  };
  return values[key].localeCompare(otherValues[key], undefined, {
    numeric: true,
    sensitivity: "base",
  });
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

function LoadingRows() {
  return Array.from({ length: 8 }).map((_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 10 }).map((__, cellIndex) => (
        <TableCell
          key={cellIndex}
          className={cellIndex === 0 ? "pl-6" : undefined}
        >
          <Skeleton className="h-5 w-24" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function EventTargetChip({
  properties,
}: {
  properties: UserAnalyticsEvent["properties"];
}) {
  const target = getEventTarget(properties);
  if (!target) return null;

  const label = getEventTargetLabel(properties);
  return (
    <Badge variant="outline" className="max-w-64 font-normal">
      <span className="text-muted-foreground shrink-0">
        {humanizeAnalyticsSnake(target.type)}
      </span>
      <span
        className={cn(
          "ml-1 truncate",
          label ? "font-medium" : "font-mono text-[10px]",
        )}
        title={label ?? target.id}
      >
        {label ?? target.id}
      </span>
    </Badge>
  );
}

function DetailTabPanel({
  tab,
  data,
}: {
  tab: UserDetailTab;
  data: UserDetailData;
}) {
  if (isTabEmpty(tab, data)) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
        {detailTabMeta[tab].emptyMessage}
      </div>
    );
  }

  if (tab === "categories") {
    return (
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Category</TableHead>
              <TableHead className="pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.categories.map((item, index) => (
              <TableRow key={`${item.goal_category_id}-${item.added_at}-${index}`}>
                <TableCell className="pl-6 font-medium">
                  {categoryName(item.category)}
                </TableCell>
                <TableCell className="pr-6">
                  <Badge variant="outline">{humanizeSnake(item.status)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tab === "steps") {
    return (
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">When</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="hidden pr-6 md:table-cell">
                Screen
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.steps.map((event, index) => {
              const eventScreen = getEventScreen(event.properties);
              return (
                <TableRow key={event.id ?? `${event.occurred_at}-${index}`}>
                  <TableCell className="pl-6 align-top">
                    <p className="text-sm whitespace-nowrap">
                      {formatOccurredAt(event.occurred_at)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(event.occurred_at)}
                    </p>
                  </TableCell>
                  <TableCell className="align-top">
                    <p className="font-medium">
                      {formatEventTitle(event.event_name, event.properties)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px] font-normal"
                      >
                        {event.event_name}
                      </Badge>
                      <EventTargetChip properties={event.properties} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden align-top pr-6 md:table-cell">
                    {eventScreen ? formatScreenLabel(eventScreen) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tab === "device") {
    return (
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Platform</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>OS version</TableHead>
              <TableHead>App version</TableHead>
              <TableHead className="pr-6">Last seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.devices.map((device, index) => (
              <TableRow key={`${device.platform}-${device.model}-${index}`}>
                <TableCell className="pl-6 font-medium">
                  {device.platform ?? "—"}
                </TableCell>
                <TableCell>{device.model ?? "—"}</TableCell>
                <TableCell>{device.os_version ?? "—"}</TableCell>
                <TableCell>{device.app_version ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground pr-6 text-xs">
                  {formatDateTime(device.last_seen_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tab === "appointments") {
    return (
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Appointment</TableHead>
              <TableHead className="pr-6">Starts at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.appointments.map((appointment, index) => (
              <TableRow
                key={`${appointment.title}-${appointment.starts_at}-${index}`}
              >
                <TableCell className="pl-6 font-medium">
                  {appointment.title ?? "Appointment"}
                </TableCell>
                <TableCell className="text-muted-foreground pr-6 text-xs">
                  {formatDateTime(appointment.starts_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-6">Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.path.map((item, index) => (
            <TableRow key={`${item.goal_category_id}-${item.added_at}-${index}`}>
              <TableCell className="pl-6 font-medium">
                {categoryName(item.category)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{humanizeSnake(item.status)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground pr-6 text-xs">
                {formatDate(item.added_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function UsersManager({ users, listLoading }: UsersManagerProps) {
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc",
  );
  const [selectedUser, setSelectedUser] = React.useState<UserListItem | null>(
    null,
  );
  const [detailTab, setDetailTab] = React.useState<UserDetailTab>("steps");
  const [detailData, setDetailData] = React.useState<UserDetailData | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const filteredUsers = React.useMemo(() => {
    const value = query.trim().toLowerCase();
    return users.filter(
      (user) =>
        !value ||
        [
          userLabel(user),
          user.state?.name,
          user.area?.name,
          communityDurationLabel(user),
          roleLabel(user),
          birthDateLabel(user),
          onboardingStepLabel(user),
        ].some((field) =>
          String(field ?? "")
            .toLowerCase()
            .includes(value),
        ),
    );
  }, [query, users]);
  const sortedUsers = React.useMemo(
    () =>
      [...filteredUsers].sort(
        (a, b) =>
          compareUsers(a, b, sortKey) * (sortDirection === "asc" ? 1 : -1),
      ),
    [filteredUsers, sortDirection, sortKey],
  );
  const loadUserDetails = React.useCallback(async (user: UserListItem) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    try {
      const detail = await getUserDetail(user.id);
      setDetailData(detailDataFromResponse(detail));
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Could not load this user data.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function openDetails(user: UserListItem) {
    setSelectedUser(user);
    setDetailTab("steps");
    void loadUserDetails(user);
  }

  function closeDetails() {
    setSelectedUser(null);
    setDetailData(null);
    setDetailError(null);
    setDetailLoading(false);
    setDetailTab("steps");
  }
  function toggleSort(key: SortKey) {
    if (key === sortKey)
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  return (
    <>
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
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-6 py-3">
            <p className="text-muted-foreground text-sm">
              {listLoading
                ? "Loading users…"
                : `${sortedUsers.length} user${sortedUsers.length === 1 ? "" : "s"}`}
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
                    label="Community Duration"
                    sortKey="communityDuration"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                    className="min-w-44"
                  />
                  <SortableHead
                    label="Onboarding Step"
                    sortKey="onboardingStep"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                    className="min-w-44"
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
                    className="min-w-40"
                  />
                  <TableHead className="bg-card min-w-24 pr-4 text-right">
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  <LoadingRows />
                ) : sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-muted-foreground py-12 text-center"
                    >
                      {query
                        ? `No users match “${query}”.`
                        : "No users have signed up yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => openDetails(user)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openDetails(user);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${userLabel(user)}`}
                    >
                      <TableCell className="max-w-72 pl-6 whitespace-normal">
                        <div>
                          <p className="font-medium">{userLabel(user)}</p>
                          <p className="text-muted-foreground break-all font-mono text-[11px]">
                            {user.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{birthDateLabel(user)}</TableCell>
                      <TableCell>{user.state?.name ?? "—"}</TableCell>
                      <TableCell>{user.area?.name ?? "—"}</TableCell>
                      <TableCell>
                        {communityDurationLabel(user) || "—"}
                      </TableCell>
                      <TableCell>{onboardingStepLabel(user)}</TableCell>
                      <TableCell>
                        {user.onboarding_completed_at ? (
                          <Badge className="gap-1.5">
                            <CheckCircle2 className="size-3" />
                            Complete
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            Not completed
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{roleLabel(user)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDateTime(user.created_at)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDetails(user);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <Dialog
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) closeDetails();
        }}
      >
        <DialogContent className="flex h-[66.666667vh] max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b border-border/60 p-4 pr-14">
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `${userLabel(selectedUser)} · ${selectedUser.id}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 p-4 text-muted-foreground">
              <LoaderCircle className="size-5 animate-spin" />
              Loading user details…
            </div>
          ) : detailError ? (
            <div className="p-4">
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border p-4 text-sm"
              >
                <p>Could not load user details: {detailError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    selectedUser && void loadUserDetails(selectedUser)
                  }
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : detailData ? (
            <Tabs
              value={detailTab}
              onValueChange={(value) => {
                if (USER_DETAIL_TABS.includes(value as UserDetailTab)) {
                  setDetailTab(value as UserDetailTab);
                }
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="border-b border-border/60 px-4 py-3">
                <TabsList className="h-auto w-full justify-start overflow-x-auto">
                  {USER_DETAIL_TABS.map((tab) => {
                    const Icon = detailTabMeta[tab].icon;
                    return (
                      <TabsTrigger key={tab} value={tab} className="gap-1.5">
                        <Icon className="size-3.5" />
                        {detailTabMeta[tab].label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="min-w-0 p-4">
                  {USER_DETAIL_TABS.map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-0">
                      <DetailTabPanel tab={tab} data={detailData} />
                    </TabsContent>
                  ))}
                </div>
              </ScrollArea>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
