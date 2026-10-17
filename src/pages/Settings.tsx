import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Mail,
  RefreshCw,
  Unplug,
  Trash2,
  Monitor,
  Sun,
  Moon,
  Check,
  Save,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageHeader, ConfirmAction } from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import ConnectEmailDialog from "@/components/ConnectEmailDialog";
import { useConnections } from "@/hooks/use-workspace-data";
import { useUserId } from "@/hooks/useUserId";
import { useSession, authClient } from "@/lib/auth-client";
import { settingsApi, type SettingsUpdate } from "@/lib/api/settings";
import { emailConnectionsApi } from "@/lib/api";
import { errorMessage } from "@/lib/format";
import { toast } from "sonner";
const tabs = [
  { id: "profile", name: "Account" },
  { id: "email", name: "Email connections" },
  { id: "ai", name: "Draft preferences" },
  { id: "notifications", name: "Notifications" },
  { id: "appearance", name: "Appearance" },
  { id: "security", name: "Security" },
];
const defaults: SettingsUpdate = {
  full_name: "",
  company: "",
  role: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: "en",
  email_signature: "",
  default_tone: "professional",
  auto_archive: true,
  archive_after_days: 30,
  email_notifications: true,
  ai_enabled: true,
  confidence_threshold: 85,
  auto_generate_drafts: true,
  suggest_follow_ups: true,
  analyze_sentiment: true,
  generate_subject_lines: true,
  preferred_tone: "professional",
  max_draft_length: 500,
  browser_notifications: true,
  hot_lead_alerts: true,
  follow_up_reminders: true,
  weekly_digest: true,
  ai_draft_ready: true,
  deal_at_risk: true,
  compact_mode: false,
  show_avatars: true,
  animations: true,
};
export default function Settings() {
  const id = useUserId();
  const { data: session } = useSession();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") || "profile";
  const tab = tabs.some((t) => t.id === requested) ? requested : "profile";
  const query = useQuery({
    queryKey: ["settings", id],
    queryFn: () => settingsApi.get(id!),
    enabled: !!id,
  });
  const connections = useConnections();
  const { theme, setTheme } = useTheme();
  const [draft, setDraft] = useState<SettingsUpdate>({
    ...defaults,
    full_name: session?.user.name || "",
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connect, setConnect] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    const failure = params.get("error");
    const success = params.get("success");
    if (failure) {
      toast.error("Email connection could not be completed", {
        description: failure,
      });
      setParams({ tab: "email" }, { replace: true });
    } else if (success === "true") {
      toast.success("Email connected");
      client.invalidateQueries({ queryKey: ["connections"] });
      setParams({ tab: "email" }, { replace: true });
    }
  }, [id, params, setParams, client]);
  useEffect(() => {
    if (query.data) {
      const {
        id: recordId,
        user_id: ownerId,
        created_at: created,
        updated_at: updated,
        theme: storedTheme,
        ...values
      } = query.data;
      setDraft({ ...defaults, ...values });
    } else if (query.isSuccess) {
      setDraft({ ...defaults, full_name: session?.user.name || "" });
    }
  }, [query.data, query.isSuccess, session?.user.name]);
  function update<K extends keyof SettingsUpdate>(
    key: K,
    value: SettingsUpdate[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }
  async function save() {
    if (!id) return;
    setSaving(true);
    try {
      const { full_name, ...other } = draft;
      await settingsApi.save(id, {
        ...other,
        full_name,
        theme: theme || "system",
      });
      if (full_name && full_name !== session?.user.name) {
        const result = await authClient.updateUser({ name: full_name });
        if (result.error)
          throw new Error(
            result.error.message ||
              "Profile preference saved, but the account name could not update.",
          );
      }
      setDirty(false);
      await client.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Preferences saved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  function applyPreference(
    name: "compact_mode" | "show_avatars" | "animations",
    value: boolean,
  ) {
    update(name, value);
    localStorage.setItem(`inboxiq:${name}`, String(value));
    document.documentElement.dataset[
      name === "compact_mode"
        ? "compact"
        : name === "show_avatars"
          ? "avatars"
          : "motion"
    ] =
      name === "animations"
        ? value
          ? "normal"
          : "reduce"
        : name === "show_avatars"
          ? value
            ? "visible"
            : "hidden"
          : String(value);
  }
  const toggle = (
    key: keyof SettingsUpdate,
    title: string,
    description: string,
  ) => (
    <PreferenceToggle
      key={key}
      checked={Boolean(draft[key])}
      onChange={(value) => update(key, value)}
      title={title}
      description={description}
    />
  );
  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Your account, connections, and the way you work."
      >
        <Button size="sm" disabled={saving || !dirty} onClick={save}>
          <Save size={12} />
          {saving ? "Saving..." : dirty ? "Save changes" : "All changes saved"}
        </Button>
      </PageHeader>
      {query.isPending ? (
        <LoadingState message="Loading settings..." />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="settings-workspace">
          <nav aria-label="Settings categories" className="settings-navigation">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setParams({ tab: t.id }, { replace: true })}
                aria-current={tab === t.id ? "page" : undefined}
              >
                {t.name}
              </button>
            ))}
          </nav>
          <div className="settings-content">
            {tab === "profile" && (
              <>
                <SettingsHeading
                  title="Account"
                  description="Personal information used across your workspace."
                />
                <div className="form-row mt-7">
                  <label className="form-field">
                    <span>Full name</span>
                    <input
                      className="form-input"
                      value={draft.full_name || ""}
                      onChange={(e) => update("full_name", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>Sign-in email</span>
                    <input
                      className="form-input"
                      value={session?.user.email || ""}
                      readOnly
                    />
                    <small className="text-[9px] text-muted-foreground">
                      Managed by your sign-in account.
                    </small>
                  </label>
                  <label className="form-field">
                    <span>Company</span>
                    <input
                      className="form-input"
                      value={draft.company || ""}
                      onChange={(e) => update("company", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>Role</span>
                    <input
                      className="form-input"
                      value={draft.role || ""}
                      onChange={(e) => update("role", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>Timezone</span>
                    <select
                      className="form-input"
                      value={draft.timezone}
                      onChange={(e) => update("timezone", e.target.value)}
                    >
                      {Array.from(
                        new Set([
                          draft.timezone || "UTC",
                          "UTC",
                          "Asia/Kolkata",
                          "America/New_York",
                          "America/Los_Angeles",
                          "Europe/London",
                          "Europe/Berlin",
                          "Asia/Singapore",
                          "Australia/Sydney",
                        ]),
                      ).map((zone) => (
                        <option key={zone}>{zone}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Language preference</span>
                    <select
                      className="form-input"
                      value={draft.language}
                      onChange={(e) => update("language", e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground mt-6">
                  Your language preference is saved to your account. The current
                  interface is available in English.
                </p>
              </>
            )}
            {tab === "email" && (
              <>
                <SettingsHeading
                  title="Email connections"
                  description="Connect an account, manage sync, and keep conversations up to date."
                />
                <div className="mt-6 space-y-0">
                  {connections.isPending ? (
                    <LoadingState message="Loading email accounts..." />
                  ) : connections.error ? (
                    <ErrorState
                      error={connections.error}
                      onRetry={() => connections.refetch()}
                    />
                  ) : connections.data?.length ? (
                    connections.data.map((c) => (
                      <article key={c.id} className="email-connection-row">
                        <div className="flex gap-3">
                          <span className="avatar">
                            <Mail size={14} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium break-all">
                              {c.email}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 capitalize">
                              {c.provider} <span className="mx-1">/</span>
                              {c.is_active ? "Connected" : "Disconnected"}
                            </p>
                            {c.last_sync_at && (
                              <p className="text-[9px] text-muted-foreground mt-2">
                                Last synced{" "}
                                {new Date(c.last_sync_at).toLocaleString()}
                              </p>
                            )}
                            {c.error_message && (
                              <p className="text-[10px] text-destructive mt-2">
                                {c.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {c.is_active && (
                            <button
                              className="icon-button"
                              aria-label={`Sync ${c.email}`}
                              disabled={syncing === c.id}
                              onClick={async () => {
                                setSyncing(c.id);
                                try {
                                  const result = await emailConnectionsApi.sync(
                                    c.id,
                                  );
                                  await client.invalidateQueries({
                                    queryKey: ["connections"],
                                  });
                                  await client.invalidateQueries({
                                    queryKey: ["threads"],
                                  });
                                  await client.invalidateQueries({
                                    queryKey: ["leads"],
                                  });
                                  toast.success(
                                    result.message || "Sync complete",
                                  );
                                } catch (e) {
                                  toast.error(errorMessage(e));
                                } finally {
                                  setSyncing(null);
                                }
                              }}
                            >
                              <RefreshCw
                                size={13}
                                className={
                                  syncing === c.id ? "animate-spin" : ""
                                }
                              />
                            </button>
                          )}
                          {c.is_active && (
                            <ConfirmAction
                              title="Disconnect this account?"
                              description={`${c.email} will stop syncing. Existing messages remain in your workspace.`}
                              confirmLabel="Disconnect"
                              onConfirm={async () => {
                                if (!id) return;
                                await emailConnectionsApi.disconnect(c.id, id);
                                await connections.refetch();
                                toast.success("Email disconnected");
                              }}
                            >
                              <button
                                className="icon-button"
                                aria-label={`Disconnect ${c.email}`}
                              >
                                <Unplug size={13} />
                              </button>
                            </ConfirmAction>
                          )}
                          <ConfirmAction
                            title="Remove this connection?"
                            description={`Remove the saved connection for ${c.email}. You can reconnect the account later.`}
                            destructive
                            confirmLabel="Remove connection"
                            onConfirm={async () => {
                              if (!id) return;
                              await emailConnectionsApi.delete(c.id, id);
                              await connections.refetch();
                              toast.success("Connection removed");
                            }}
                          >
                            <button
                              className="icon-button"
                              aria-label={`Remove ${c.email}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </ConfirmAction>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="py-8 border-y text-xs text-muted-foreground">
                      No email accounts are connected yet.
                    </div>
                  )}
                </div>
                <Button
                  className="mt-5"
                  size="sm"
                  variant="outline"
                  onClick={() => setConnect(true)}
                >
                  <Mail size={12} />
                  Connect email account
                </Button>
                <div className="settings-section mt-8">
                  <h2>Signature and defaults</h2>
                  <p>Preferences for your email workflow.</p>
                  <label className="form-field mt-6">
                    <span>Email signature</span>
                    <textarea
                      className="form-input"
                      rows={4}
                      value={draft.email_signature || ""}
                      onChange={(e) =>
                        update("email_signature", e.target.value)
                      }
                    />
                  </label>
                  <label className="form-field mt-5 max-w-xs">
                    <span>Default tone</span>
                    <select
                      className="form-input"
                      value={draft.default_tone}
                      onChange={(e) => update("default_tone", e.target.value)}
                    >
                      {[
                        "professional",
                        "short",
                        "confident",
                        "polite",
                        "sales-focused",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  {toggle(
                    "auto_archive",
                    "Auto-archive preference",
                    "Save your preference for archiving inactive conversations.",
                  )}
                  <label className="form-field mt-4 max-w-xs">
                    <span>Archive after (days)</span>
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      max={365}
                      value={draft.archive_after_days}
                      onChange={(e) =>
                        update(
                          "archive_after_days",
                          Math.max(1, Number(e.target.value)),
                        )
                      }
                    />
                  </label>
                </div>
              </>
            )}
            {tab === "ai" && (
              <>
                <SettingsHeading
                  title="Draft preferences"
                  description="Guidance for AI-assisted drafting. These settings never authorize automatic sending."
                />
                <div className="mt-6">
                  {toggle(
                    "ai_enabled",
                    "AI assistance",
                    "Save your preference for assisted drafting and conversation analysis.",
                  )}
                  {toggle(
                    "auto_generate_drafts",
                    "Draft suggestions",
                    "Allow draft suggestions where the integration is available. You still review and send.",
                  )}
                  {toggle(
                    "suggest_follow_ups",
                    "Follow-up suggestions",
                    "Include follow-up opportunities in your workflow.",
                  )}
                  {toggle(
                    "analyze_sentiment",
                    "Conversation analysis",
                    "Save your preference for conversation analysis.",
                  )}
                  {toggle(
                    "generate_subject_lines",
                    "Subject suggestions",
                    "Save your preference for draft subject generation.",
                  )}
                </div>
                <div className="form-row mt-7">
                  <label className="form-field">
                    <span>Preferred tone</span>
                    <select
                      className="form-input"
                      value={draft.preferred_tone}
                      onChange={(e) => update("preferred_tone", e.target.value)}
                    >
                      {[
                        "professional",
                        "short",
                        "confident",
                        "polite",
                        "sales-focused",
                      ].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Maximum draft length (characters)</span>
                    <input
                      className="form-input"
                      type="number"
                      min={100}
                      max={10000}
                      value={draft.max_draft_length}
                      onChange={(e) =>
                        update(
                          "max_draft_length",
                          Math.max(100, Number(e.target.value)),
                        )
                      }
                    />
                  </label>
                  <label className="form-field">
                    <span>Minimum classification confidence (%)</span>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      max={100}
                      value={draft.confidence_threshold}
                      onChange={(e) =>
                        update(
                          "confidence_threshold",
                          Math.min(100, Math.max(0, Number(e.target.value))),
                        )
                      }
                    />
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground mt-7">
                  AI-assisted features depend on the services enabled for your
                  workspace. Suggestions always need your judgment.
                </p>
              </>
            )}
            {tab === "notifications" && (
              <>
                <SettingsHeading
                  title="Notifications"
                  description="Save the updates you want to receive. Delivery depends on the channels enabled for your workspace."
                />
                <div className="mt-6">
                  {toggle(
                    "email_notifications",
                    "Email updates",
                    "Preference for workspace updates by email.",
                  )}
                  {toggle(
                    "browser_notifications",
                    "Browser updates",
                    "Preference for browser notifications.",
                  )}
                  {toggle(
                    "hot_lead_alerts",
                    "Qualified lead updates",
                    "New conversations with strong project intent.",
                  )}
                  {toggle(
                    "follow_up_reminders",
                    "Follow-up reminders",
                    "Relationships that may need your attention.",
                  )}
                  {toggle(
                    "ai_draft_ready",
                    "Drafts ready for review",
                    "New assisted drafts awaiting your decision.",
                  )}
                  {toggle(
                    "deal_at_risk",
                    "At-risk relationships",
                    "Conversations that have gone quiet.",
                  )}
                  {toggle(
                    "weekly_digest",
                    "Weekly digest",
                    "Preference for a weekly summary.",
                  )}
                </div>
              </>
            )}
            {tab === "appearance" && (
              <>
                <SettingsHeading
                  title="Appearance"
                  description="A workspace that fits your environment and attention."
                />
                <div className="appearance-options mt-7">
                  {[
                    { key: "light", name: "Light", icon: Sun },
                    { key: "dark", name: "Dark", icon: Moon },
                    { key: "system", name: "System", icon: Monitor },
                  ].map((option) => (
                    <button
                      key={option.key}
                      aria-pressed={theme === option.key}
                      onClick={() => {
                        setTheme(option.key);
                        setDirty(true);
                      }}
                    >
                      <div className={`theme-swatch ${option.key}`}>
                        <div />
                        <span />
                        <span />
                        <span />
                      </div>
                      <span>
                        <option.icon size={12} />
                        {option.name}
                        {theme === option.key && (
                          <Check size={12} className="ml-auto text-primary" />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-8">
                  <PreferenceToggle
                    title="Compact density"
                    description="Reduce spacing in tables and lists."
                    checked={!!draft.compact_mode}
                    onChange={(v) => applyPreference("compact_mode", v)}
                  />
                  <PreferenceToggle
                    title="Show contact avatars"
                    description="Display initials beside people and companies."
                    checked={draft.show_avatars !== false}
                    onChange={(v) => applyPreference("show_avatars", v)}
                  />
                  <PreferenceToggle
                    title="Interface motion"
                    description="Use subtle transitions. Your system's reduced-motion preference is always respected."
                    checked={draft.animations !== false}
                    onChange={(v) => applyPreference("animations", v)}
                  />
                </div>
              </>
            )}
            {tab === "security" && (
              <>
                <SettingsHeading
                  title="Sign-in and security"
                  description="Manage the credentials used to access your workspace."
                />
                <div className="flex gap-3 items-start py-6 border-b">
                  <ShieldCheck
                    size={16}
                    className="text-muted-foreground mt-1"
                  />
                  <div>
                    <h3 className="text-xs tracking-normal">Current account</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {session?.user.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                      Production sign-in uses secure, HTTP-only session cookies.
                      Signing out ends your current session.
                    </p>
                  </div>
                </div>
                <PasswordChange />
              </>
            )}
          </div>
        </div>
      )}
      <ConnectEmailDialog
        open={connect}
        onOpenChange={setConnect}
        onConnected={() => connections.refetch()}
      />
    </DashboardLayout>
  );
}
function SettingsHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-medium">{title}</h2>
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="preference-row">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}
function PasswordChange() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="settings-section mt-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (next !== confirm) {
          toast.error("The new passwords do not match");
          return;
        }
        setPending(true);
        try {
          const result = await authClient.changePassword({
            currentPassword: current,
            newPassword: next,
            revokeOtherSessions: true,
          });
          if (result.error)
            throw new Error(
              result.error.message || "Password could not be updated.",
            );
          setCurrent("");
          setNext("");
          setConfirm("");
          toast.success("Password updated. Other sessions were signed out.");
        } catch (error) {
          toast.error(errorMessage(error));
        } finally {
          setPending(false);
        }
      }}
    >
      <h2>Change password</h2>
      <p>Use at least 8 characters. Other sessions will be signed out.</p>
      <div className="space-y-4 mt-6 max-w-sm">
        <label className="form-field">
          <span>Current password</span>
          <input
            className="form-input"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span>New password</span>
          <input
            className="form-input"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span>Confirm new password</span>
          <input
            className="form-input"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={pending || !current || next.length < 8 || !confirm}
        >
          {pending ? "Updating..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
