import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Link, useParams } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  shortId,
} from "@/lib/analytics/format";
import { resolveTargetLabels } from "@/lib/analytics/queries";
import { getUserDetail } from "@/lib/users/queries";
import type { UserDetail } from "@/lib/users/types";
import { useDocumentTitle } from "@/hooks/use-document-title";

const TABS = ["onboarding", "path", "analytics", "appointments"] as const;

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.map(displayValue).join(", ") || "—";
    const record = value as Record<string, unknown>;
    return String(
      record.name ?? record.label ?? record.code ?? JSON.stringify(value),
    );
  }
  return String(value);
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
      {message}
    </div>
  );
}

function EventTargetChip({
  properties,
  targetLabels,
}: {
  properties: UserDetail["events"][number]["properties"];
  targetLabels: Record<string, string>;
}) {
  const target = getEventTarget(properties);
  if (!target) return null;

  const label = getEventTargetLabel(properties, targetLabels);
  return (
    <Badge variant="outline" className="max-w-64 font-normal">
      <span className="text-muted-foreground shrink-0">
        {humanizeAnalyticsSnake(target.type)}
      </span>
      <span
        className={`ml-1 truncate ${label ? "font-medium" : "font-mono text-[10px]"}`}
        title={label ?? target.id}
      >
        {label ?? shortId(target.id, 6)}
      </span>
    </Badge>
  );
}

function OnboardingData({ detail }: { detail: UserDetail }) {
  const profile = detail.profile;
  const categories = detail.path;
  const answers = [
    {
      question: "When were you born?",
      answer: profile
        ? formatBirthDate(profile.birth_month, profile.birth_year)
        : "—",
    },
    {
      question: "What state will you be living in?",
      answer: profile?.state?.name ?? profile?.state_code ?? "—",
    },
    {
      question: "Will you be living in or near one of these areas?",
      answer: profile?.area?.name ?? profile?.area_id ?? "—",
    },
    {
      question: "How long have you been in the community?",
      answer:
        profile?.community_duration_label ??
        profile?.community_duration?.label ??
        "—",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-6">
      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Onboarding answers</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Details provided during onboarding.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {answers.map(({ question, answer }) => (
            <div
              key={question}
              className="bg-muted/30 rounded-lg border border-border/60 p-4"
            >
              <p className="text-muted-foreground text-sm">{question}</p>
              <p className="mt-1 text-sm font-medium">{answer}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Categories selected</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Categories chosen during onboarding.
          </p>
        </div>
        {categories.length === 0 ? (
          <Empty message="No onboarding categories selected for this user." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((category, index) => (
              <div
                key={`${category.goal_category_id}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3"
              >
                <p className="min-w-0 truncate text-sm font-medium">
                  {categoryName(category.category)}
                </p>
                {category.status ? (
                  <Badge variant="secondary" className="shrink-0">
                    {humanizeSnake(category.status)}
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Device</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            The device most recently used by this user.
          </p>
        </div>
        <DevicesTable devices={detail.devices} />
      </section>
    </div>
  );
}

function DevicesTable({ devices }: { devices: UserDetail["devices"] }) {
  if (devices.length === 0) {
    return <Empty message="No device has checked in for this user." />;
  }

  const device = devices[0];
  const fields = [
    ["Platform", device.platform],
    ["Model", device.model],
    ["OS version", device.os_version],
    ["App version", device.app_version],
    ["Install ID", device.install_id],
    ["Last seen", formatDateTime(device.last_seen_at)],
  ];

  return (
    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, value]) => (
        <div key={label}>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p
            className={`mt-1 break-all text-sm font-medium ${label === "Install ID" ? "font-mono text-xs" : ""}`}
          >
            {value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

export function UserDetailsPage() {
  const { userId } = useParams();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [targetLabels, setTargetLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(
    detail?.profile?.email ? `${detail.profile.email} · Users` : "User details",
  );

  const load = useCallback(async () => {
    if (!userId) {
      setError("A user ID is required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userDetail = await getUserDetail(userId);
      setDetail(userDetail);
      setTargetLabels(await resolveTargetLabels(userDetail.events));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load this user.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const profile = detail?.profile;
  const userLabel =
    profile?.email ||
    (profile?.is_anonymous ? "Anonymous user" : "User details");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-4 md:p-6 lg:p-8">
      <header className="flex items-start gap-3 sm:gap-4">
        <Link
          to="/dashboard/users"
          aria-label="Back to all users"
          title="Back to all users"
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-md border shadow-xs transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 pt-0.5">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {userLabel}
          </h1>
          {profile ? (
            <p className="text-muted-foreground mt-1 break-all font-mono text-xs">
              User ID: {profile.id}
            </p>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2">
          <LoaderCircle className="size-5 animate-spin" /> Loading user details…
        </div>
      ) : error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border p-4 text-sm"
        >
          <p>Could not load user details: {error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      ) : detail ? (
        <Tabs
          defaultValue="onboarding"
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="h-auto w-full justify-start overflow-x-auto">
            {TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {humanizeSnake(tab)}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollArea className="mt-4 min-h-0 flex-1">
            <TabsContent value="onboarding" className="mt-0">
              <OnboardingData detail={detail} />
            </TabsContent>
            <TabsContent value="path" className="mt-0">
              {detail.path.length === 0 ? (
                <Empty message="No My Path categories saved for this user." />
              ) : (
                <PathTable items={detail.path} />
              )}
            </TabsContent>
            <TabsContent value="analytics" className="mt-0">
              <div className="min-h-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                <Table>
                  <TableHeader className="bg-card">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="bg-card pl-6">When</TableHead>
                      <TableHead className="bg-card">Event</TableHead>
                      <TableHead className="bg-card hidden pr-6 md:table-cell">
                        Screen
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.events.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-muted-foreground py-12 text-center"
                        >
                          No analytics events recorded for this user.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.events.map((event, index) => {
                        const eventScreen = getEventScreen(event.properties);
                        return (
                          <TableRow
                            key={event.id ?? `${event.occurred_at}-${index}`}
                            className="hover:bg-muted/40"
                          >
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
                                {formatEventTitle(
                                  event.event_name,
                                  event.properties,
                                )}
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                <Badge
                                  variant="secondary"
                                  className="font-mono text-[10px] font-normal"
                                >
                                  {event.event_name}
                                </Badge>
                                <EventTargetChip
                                  properties={event.properties}
                                  targetLabels={targetLabels}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden align-top pr-6 md:table-cell">
                              {eventScreen
                                ? formatScreenLabel(eventScreen)
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="appointments" className="mt-0">
              {detail.appointments.length === 0 ? (
                <Empty message="No appointments scheduled for this user." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Appointment</TableHead>
                        <TableHead>Starts at</TableHead>
                        <TableHead>Reminder</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.appointments.map((appointment, index) => (
                        <TableRow key={appointment.id ?? index}>
                          <TableCell>
                            {appointment.title ?? "Appointment"}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(appointment.starts_at)}
                          </TableCell>
                          <TableCell>
                            {displayValue(appointment.has_reminder)}
                          </TableCell>
                          <TableCell>
                            {formatDate(appointment.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      ) : null}
    </div>
  );
}

function PathTable({ items }: { items: UserDetail["path"] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.goal_category_id}-${index}`}>
              <TableCell>{categoryName(item.category)}</TableCell>
              <TableCell>
                {item.status ? (
                  <Badge variant="outline">{humanizeSnake(item.status)}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{formatDate(item.added_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
