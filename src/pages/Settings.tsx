import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Bell,
  Sparkles,
  Shield,
  Palette,
  Globe,
  Save,
  Check,
  X,
  Edit,
  Trash2,
  Plus,
  Key,
  AlertCircle,
  Info,
  RefreshCw,
  Unlink
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useUserId } from "@/hooks/useUserId";
import { settingsApi, type SettingsUpdate } from "@/lib/api/settings";
import { emailConnectionsApi, type EmailConnection } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import ConnectEmailDialog from "@/components/ConnectEmailDialog";

type TabType = "profile" | "email" | "ai" | "notifications" | "security" | "appearance";

const Settings = () => {
  const userId = useUserId();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [emailConnections, setEmailConnections] = useState<EmailConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);

  // Profile settings
  const [profile, setProfile] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    company: "",
    role: "",
    timezone: "America/New_York",
    language: "en",
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    autoReply: false,
    signature: "",
    defaultTone: "professional",
    autoArchive: true,
    archiveAfterDays: 30,
    emailNotifications: true,
  });

  // AI settings
  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    confidenceThreshold: 85,
    autoGenerate: true,
    suggestFollowUps: true,
    analyzeSentiment: true,
    generateSubjectLines: true,
    preferredTone: "professional",
    maxDraftLength: 500,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    browserNotifications: true,
    hotLeadAlerts: true,
    followUpReminders: true,
    weeklyDigest: true,
    aiDraftReady: true,
    dealAtRisk: true,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    requirePasswordChange: false,
    lastPasswordChange: null as string | null,
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "dark",
    compactMode: false,
    showAvatars: true,
    animations: true,
  });

  // Load settings from database
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);

        const settings = await settingsApi.get(userId);

        if (settings) {
          // Load profile settings
          setProfile({
            name: settings.full_name || session?.user?.name || "",
            email: session?.user?.email || "",
            company: settings.company || "",
            role: settings.role || "",
            timezone: settings.timezone || "America/New_York",
            language: settings.language || "en",
          });

          // Load email settings
          setEmailSettings({
            autoReply: false, // Not in DB yet
            signature: settings.email_signature || "",
            defaultTone: settings.default_tone || "professional",
            autoArchive: settings.auto_archive ?? true,
            archiveAfterDays: settings.archive_after_days || 30,
            emailNotifications: settings.email_notifications ?? true,
          });

          // Load AI settings
          setAiSettings({
            enabled: settings.ai_enabled ?? true,
            confidenceThreshold: settings.confidence_threshold || 85,
            autoGenerate: settings.auto_generate_drafts ?? true,
            suggestFollowUps: settings.suggest_follow_ups ?? true,
            analyzeSentiment: settings.analyze_sentiment ?? true,
            generateSubjectLines: settings.generate_subject_lines ?? true,
            preferredTone: settings.preferred_tone || "professional",
            maxDraftLength: settings.max_draft_length || 500,
          });

          // Load notification settings
          setNotificationSettings({
            emailAlerts: settings.email_notifications ?? true,
            browserNotifications: settings.browser_notifications ?? true,
            hotLeadAlerts: settings.hot_lead_alerts ?? true,
            followUpReminders: settings.follow_up_reminders ?? true,
            weeklyDigest: settings.weekly_digest ?? true,
            aiDraftReady: settings.ai_draft_ready ?? true,
            dealAtRisk: settings.deal_at_risk ?? true,
          });

          // Load security settings
          setSecuritySettings({
            twoFactorEnabled: settings.two_factor_enabled ?? false,
            sessionTimeout: settings.session_timeout || 60,
            requirePasswordChange: settings.require_password_change ?? false,
            lastPasswordChange: settings.last_password_change || null,
          });

          // Load appearance settings
          setAppearanceSettings({
            theme: settings.theme || "dark",
            compactMode: settings.compact_mode ?? false,
            showAvatars: settings.show_avatars ?? true,
            animations: settings.animations ?? true,
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError(err instanceof Error ? err : new Error("Failed to load settings"));
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
    loadEmailConnections();

    // Handle OAuth callback from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const oauthProvider = urlParams.get("provider");
    const oauthCode = urlParams.get("code");
    const oauthState = urlParams.get("state");
    const oauthSuccess = urlParams.get("success");
    const oauthError = urlParams.get("error");

    // Handle OAuth success/error from URL params
    if (oauthSuccess === "true") {
      const provider = urlParams.get("provider") || "email";
      toast.success(`${provider === "gmail" ? "Gmail" : provider === "outlook" ? "Outlook" : "Email"} connected successfully!`);
      loadEmailConnections();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname + "?tab=email");
    }

    if (oauthError) {
      toast.error("Failed to connect email", {
        description: decodeURIComponent(oauthError),
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname + "?tab=email");
    }
  }, [userId, session]);

  // Load email connections
  const loadEmailConnections = async () => {
    if (!userId) return;

    try {
      setIsLoadingConnections(true);
      const connections = await emailConnectionsApi.getAll(userId);
      setEmailConnections(connections);
    } catch (err) {
      console.error("Error loading email connections:", err);
      // Don't show error toast - just log it
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleDisconnectEmail = async (connectionId: string) => {
    if (!userId) return;

    if (!confirm("Are you sure you want to disconnect this email account?")) {
      return;
    }

    try {
      await emailConnectionsApi.disconnect(connectionId, userId);
      toast.success("Email account disconnected");
      loadEmailConnections();
    } catch (err) {
      console.error("Error disconnecting email:", err);
      toast.error("Failed to disconnect email", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDeleteEmail = async (connectionId: string) => {
    if (!userId) return;

    if (!confirm("Are you sure you want to permanently delete this email connection?")) {
      return;
    }

    try {
      await emailConnectionsApi.delete(connectionId, userId);
      toast.success("Email connection deleted");
      loadEmailConnections();
    } catch (err) {
      console.error("Error deleting email connection:", err);
      toast.error("Failed to delete email connection", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleSyncEmail = async (connectionId: string) => {
    try {
      setSyncingConnectionId(connectionId);
      const result = await emailConnectionsApi.sync(connectionId);
      toast.success("Email sync completed", {
        description: result.threadsSynced 
          ? `Synced ${result.threadsSynced} email threads`
          : result.message || "Your emails have been synced.",
      });
      // Reload connections to show updated last_sync_at
      await loadEmailConnections();
      
      // Trigger inbox data refetch by dispatching a custom event
      window.dispatchEvent(new CustomEvent("emailSyncCompleted", { 
        detail: { threadsSynced: result.threadsSynced } 
      }));
    } catch (err) {
      console.error("Error syncing email:", err);
      toast.error("Failed to sync emails", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSyncingConnectionId(null);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("You must be logged in to save settings");
      return;
    }

    try {
      setIsSaving(true);

      // Prepare settings update
      const settingsUpdate: SettingsUpdate = {
        // Profile
        full_name: profile.name,
        company: profile.company,
        role: profile.role,
        timezone: profile.timezone,
        language: profile.language,
        // Email
        email_signature: emailSettings.signature,
        default_tone: emailSettings.defaultTone,
        auto_archive: emailSettings.autoArchive,
        archive_after_days: emailSettings.archiveAfterDays,
        email_notifications: emailSettings.emailNotifications,
        // AI
        ai_enabled: aiSettings.enabled,
        confidence_threshold: aiSettings.confidenceThreshold,
        auto_generate_drafts: aiSettings.autoGenerate,
        suggest_follow_ups: aiSettings.suggestFollowUps,
        analyze_sentiment: aiSettings.analyzeSentiment,
        generate_subject_lines: aiSettings.generateSubjectLines,
        preferred_tone: aiSettings.preferredTone,
        max_draft_length: aiSettings.maxDraftLength,
        // Notifications
        browser_notifications: notificationSettings.browserNotifications,
        hot_lead_alerts: notificationSettings.hotLeadAlerts,
        follow_up_reminders: notificationSettings.followUpReminders,
        weekly_digest: notificationSettings.weeklyDigest,
        ai_draft_ready: notificationSettings.aiDraftReady,
        deal_at_risk: notificationSettings.dealAtRisk,
        // Security
        two_factor_enabled: securitySettings.twoFactorEnabled,
        session_timeout: securitySettings.sessionTimeout,
        require_password_change: securitySettings.requirePasswordChange,
        last_password_change: securitySettings.lastPasswordChange || undefined,
        // Appearance
        theme: appearanceSettings.theme,
        compact_mode: appearanceSettings.compactMode,
        show_avatars: appearanceSettings.showAvatars,
        animations: appearanceSettings.animations,
      };

      await settingsApi.save(userId, settingsUpdate);
      toast.success("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile" as TabType, label: "Profile", icon: User },
    { id: "email" as TabType, label: "Email", icon: Mail },
    { id: "ai" as TabType, label: "AI Assistant", icon: Sparkles },
    { id: "notifications" as TabType, label: "Notifications", icon: Bell },
    { id: "security" as TabType, label: "Security", icon: Shield },
    { id: "appearance" as TabType, label: "Appearance", icon: Palette },
  ];

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    label, 
    description 
  }: { 
    enabled: boolean; 
    onChange: (enabled: boolean) => void;
    label: string;
    description?: string;
  }) => {
    return (
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={() => onChange(!enabled)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            enabled ? "bg-accent" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
    );
  };

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    description,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    description?: string;
  }) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 px-3 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
        />
      </div>
    );
  };

  const SelectField = ({
    label,
    value,
    onChange,
    options,
    description,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    description?: string;
  }) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const TextAreaField = ({
    label,
    value,
    onChange,
    placeholder,
    description,
    rows = 4,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    description?: string;
    rows?: number;
  }) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all resize-none"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading settings..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState 
          error={error} 
          onRetry={() => window.location.reload()} 
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 w-full min-w-0 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Manage your account preferences and configuration
            </p>
          </div>
          <Button
            variant="accent"
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Sidebar - Tabs */}
          <div className="col-span-1 lg:col-span-3">
            <div className="card-elevated p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all text-left",
                      activeTab === tab.id
                        ? "bg-accent/10 text-accent"
                        : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-9">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="card-elevated p-4 sm:p-5 md:p-6"
            >
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">Profile Information</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Update your personal information</p>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <InputField
                      label="Full Name"
                      value={profile.name}
                      onChange={(v) => setProfile({ ...profile, name: v })}
                      placeholder="Enter your full name"
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={profile.email}
                      onChange={(v) => setProfile({ ...profile, email: v })}
                      placeholder="Enter your email"
                    />
                    <InputField
                      label="Company"
                      value={profile.company}
                      onChange={(v) => setProfile({ ...profile, company: v })}
                      placeholder="Enter your company name"
                    />
                    <InputField
                      label="Role"
                      value={profile.role}
                      onChange={(v) => setProfile({ ...profile, role: v })}
                      placeholder="Enter your role"
                    />
                    <SelectField
                      label="Timezone"
                      value={profile.timezone}
                      onChange={(v) => setProfile({ ...profile, timezone: v })}
                      options={[
                        { value: "America/New_York", label: "Eastern Time (ET)" },
                        { value: "America/Chicago", label: "Central Time (CT)" },
                        { value: "America/Denver", label: "Mountain Time (MT)" },
                        { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
                        { value: "Europe/London", label: "London (GMT)" },
                        { value: "Europe/Paris", label: "Paris (CET)" },
                        { value: "Asia/Tokyo", label: "Tokyo (JST)" },
                      ]}
                    />
                    <SelectField
                      label="Language"
                      value={profile.language}
                      onChange={(v) => setProfile({ ...profile, language: v })}
                      options={[
                        { value: "en", label: "English" },
                        { value: "es", label: "Spanish" },
                        { value: "fr", label: "French" },
                        { value: "de", label: "German" },
                        { value: "ja", label: "Japanese" },
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Email Tab */}
              {activeTab === "email" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">Email Configuration</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Configure your email preferences and settings</p>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <ToggleSwitch
                        enabled={emailSettings.autoReply}
                        onChange={(v) => setEmailSettings({ ...emailSettings, autoReply: v })}
                        label="Auto-Reply"
                        description="Automatically send replies to incoming emails"
                      />
                      <ToggleSwitch
                        enabled={emailSettings.autoArchive}
                        onChange={(v) => setEmailSettings({ ...emailSettings, autoArchive: v })}
                        label="Auto-Archive"
                        description="Automatically archive emails after a specified period"
                      />
                      {emailSettings.autoArchive && (
                        <InputField
                          label="Archive After (Days)"
                          type="number"
                          value={emailSettings.archiveAfterDays.toString()}
                          onChange={(v) => setEmailSettings({ ...emailSettings, archiveAfterDays: parseInt(v) || 30 })}
                        />
                      )}
                      <SelectField
                        label="Default Tone"
                        value={emailSettings.defaultTone}
                        onChange={(v) => setEmailSettings({ ...emailSettings, defaultTone: v })}
                        options={[
                          { value: "professional", label: "Professional" },
                          { value: "confident", label: "Confident" },
                          { value: "polite", label: "Polite" },
                          { value: "short", label: "Short" },
                          { value: "sales-focused", label: "Sales-focused" },
                        ]}
                      />
                      <TextAreaField
                        label="Email Signature"
                        value={emailSettings.signature}
                        onChange={(v) => setEmailSettings({ ...emailSettings, signature: v })}
                        placeholder="Enter your email signature"
                        description="This signature will be added to all outgoing emails"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Tab */}
              {activeTab === "ai" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">AI Assistant Settings</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Configure AI-powered features and preferences</p>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <ToggleSwitch
                        enabled={aiSettings.enabled}
                        onChange={(v) => setAiSettings({ ...aiSettings, enabled: v })}
                        label="Enable AI Assistant"
                        description="Turn on AI-powered email drafting and suggestions"
                      />
                      {aiSettings.enabled && (
                        <>
                          <ToggleSwitch
                            enabled={aiSettings.autoGenerate}
                            onChange={(v) => setAiSettings({ ...aiSettings, autoGenerate: v })}
                            label="Auto-Generate Drafts"
                            description="Automatically generate email drafts for detected leads"
                          />
                          <ToggleSwitch
                            enabled={aiSettings.suggestFollowUps}
                            onChange={(v) => setAiSettings({ ...aiSettings, suggestFollowUps: v })}
                            label="Suggest Follow-ups"
                            description="AI will suggest when to follow up with leads"
                          />
                          <ToggleSwitch
                            enabled={aiSettings.analyzeSentiment}
                            onChange={(v) => setAiSettings({ ...aiSettings, analyzeSentiment: v })}
                            label="Analyze Sentiment"
                            description="Analyze email sentiment to prioritize responses"
                          />
                          <ToggleSwitch
                            enabled={aiSettings.generateSubjectLines}
                            onChange={(v) => setAiSettings({ ...aiSettings, generateSubjectLines: v })}
                            label="Generate Subject Lines"
                            description="AI will suggest subject lines for your emails"
                          />
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                              Confidence Threshold: {aiSettings.confidenceThreshold}%
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Minimum confidence score for AI suggestions
                            </p>
                            <input
                              type="range"
                              min="50"
                              max="100"
                              value={aiSettings.confidenceThreshold}
                              onChange={(e) => setAiSettings({ ...aiSettings, confidenceThreshold: parseInt(e.target.value) })}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                          <SelectField
                            label="Preferred Tone"
                            value={aiSettings.preferredTone}
                            onChange={(v) => setAiSettings({ ...aiSettings, preferredTone: v })}
                            options={[
                              { value: "professional", label: "Professional" },
                              { value: "confident", label: "Confident" },
                              { value: "polite", label: "Polite" },
                              { value: "short", label: "Short" },
                              { value: "sales-focused", label: "Sales-focused" },
                            ]}
                          />
                          <InputField
                            label="Max Draft Length"
                            type="number"
                            value={aiSettings.maxDraftLength.toString()}
                            onChange={(v) => setAiSettings({ ...aiSettings, maxDraftLength: parseInt(v) || 500 })}
                            description="Maximum number of characters in AI-generated drafts"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">Notification Preferences</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Control how and when you receive notifications</p>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <ToggleSwitch
                      enabled={notificationSettings.emailAlerts}
                      onChange={(v) => setNotificationSettings({ ...notificationSettings, emailAlerts: v })}
                      label="Email Alerts"
                      description="Receive notifications via email"
                    />
                    <ToggleSwitch
                      enabled={notificationSettings.browserNotifications}
                      onChange={(v) => setNotificationSettings({ ...notificationSettings, browserNotifications: v })}
                      label="Browser Notifications"
                      description="Receive browser push notifications"
                    />
                    <div className="pt-3 sm:pt-4 border-t border-border space-y-3 sm:space-y-4">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground">Alert Types</h3>
                      <ToggleSwitch
                        enabled={notificationSettings.hotLeadAlerts}
                        onChange={(v) => setNotificationSettings({ ...notificationSettings, hotLeadAlerts: v })}
                        label="Hot Lead Alerts"
                        description="Get notified when a lead becomes hot"
                      />
                      <ToggleSwitch
                        enabled={notificationSettings.followUpReminders}
                        onChange={(v) => setNotificationSettings({ ...notificationSettings, followUpReminders: v })}
                        label="Follow-up Reminders"
                        description="Remind me when leads need follow-up"
                      />
                      <ToggleSwitch
                        enabled={notificationSettings.aiDraftReady}
                        onChange={(v) => setNotificationSettings({ ...notificationSettings, aiDraftReady: v })}
                        label="AI Draft Ready"
                        description="Notify when AI drafts are ready for review"
                      />
                      <ToggleSwitch
                        enabled={notificationSettings.dealAtRisk}
                        onChange={(v) => setNotificationSettings({ ...notificationSettings, dealAtRisk: v })}
                        label="Deal at Risk"
                        description="Alert when deals are at risk of going cold"
                      />
                      <ToggleSwitch
                        enabled={notificationSettings.weeklyDigest}
                        onChange={(v) => setNotificationSettings({ ...notificationSettings, weeklyDigest: v })}
                        label="Weekly Digest"
                        description="Receive a weekly summary of your activity"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">Security Settings</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Manage your account security and privacy</p>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <ToggleSwitch
                        enabled={securitySettings.twoFactorEnabled}
                        onChange={(v) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: v })}
                        label="Two-Factor Authentication"
                        description="Add an extra layer of security to your account"
                      />
                      <SelectField
                        label="Session Timeout"
                        value={securitySettings.sessionTimeout.toString()}
                        onChange={(v) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(v) })}
                        options={[
                          { value: "15", label: "15 minutes" },
                          { value: "30", label: "30 minutes" },
                          { value: "60", label: "1 hour" },
                          { value: "120", label: "2 hours" },
                          { value: "240", label: "4 hours" },
                        ]}
                        description="Automatically log out after inactivity"
                      />
                      <div className="p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Password</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last changed: {securitySettings.lastPasswordChange}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Change Password
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Connected Email Accounts</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {emailConnections.length} {emailConnections.length === 1 ? "account" : "accounts"} connected
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => setIsConnectDialogOpen(true)}
                          >
                            <Plus className="w-4 h-4" />
                            Add Account
                          </Button>
                        </div>

                        {isLoadingConnections ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading connections...
                          </div>
                        ) : emailConnections.length === 0 ? (
                          <div className="p-4 rounded-lg bg-muted/30 border border-border text-center">
                            <p className="text-sm text-muted-foreground mb-3">No email accounts connected</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => setIsConnectDialogOpen(true)}
                            >
                              <Plus className="w-4 h-4" />
                              Connect Your First Account
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {emailConnections.map((connection) => (
                              <div
                                key={connection.id}
                                className="p-4 rounded-lg bg-muted/30 border border-border"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                      <p className="text-sm font-medium text-foreground">{connection.email}</p>
                                      {connection.is_active ? (
                                        <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                                          Active
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
                                          Inactive
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span className="capitalize">{connection.provider}</span>
                                      {connection.last_sync_at && (
                                        <>
                                          <span>•</span>
                                          <span>Last sync: {new Date(connection.last_sync_at).toLocaleDateString()}</span>
                                        </>
                                      )}
                                    </div>
                                    {connection.error_message && (
                                      <p className="text-xs text-red-400 mt-1">{connection.error_message}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSyncEmail(connection.id)}
                                      title="Sync Now"
                                      className="gap-2"
                                      disabled={syncingConnectionId === connection.id}
                                    >
                                      <RefreshCw className={cn("w-4 h-4", syncingConnectionId === connection.id && "animate-spin")} />
                                      {syncingConnectionId === connection.id ? "Syncing..." : "Sync"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleDisconnectEmail(connection.id)}
                                      title="Disconnect"
                                    >
                                      <Unlink className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleDeleteEmail(connection.id)}
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">Appearance Settings</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Customize the look and feel of your dashboard</p>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <SelectField
                      label="Theme"
                      value={appearanceSettings.theme}
                      onChange={(v) => setAppearanceSettings({ ...appearanceSettings, theme: v })}
                      options={[
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                        { value: "system", label: "System" },
                      ]}
                      description="Choose your preferred color theme"
                    />
                    <ToggleSwitch
                      enabled={appearanceSettings.compactMode}
                      onChange={(v) => setAppearanceSettings({ ...appearanceSettings, compactMode: v })}
                      label="Compact Mode"
                      description="Use a more compact layout to fit more content"
                    />
                    <ToggleSwitch
                      enabled={appearanceSettings.showAvatars}
                      onChange={(v) => setAppearanceSettings({ ...appearanceSettings, showAvatars: v })}
                      label="Show Avatars"
                      description="Display profile pictures and avatars throughout the app"
                    />
                    <ToggleSwitch
                      enabled={appearanceSettings.animations}
                      onChange={(v) => setAppearanceSettings({ ...appearanceSettings, animations: v })}
                      label="Animations"
                      description="Enable smooth animations and transitions"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Connect Email Dialog */}
      <ConnectEmailDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        onConnected={() => {
          loadEmailConnections();
          setIsConnectDialogOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default Settings;



