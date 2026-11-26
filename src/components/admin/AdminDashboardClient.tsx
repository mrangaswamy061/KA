"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Compass,
  Calendar,
  HeartHandshake,
  Users,
  ClipboardList,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toCsv, formatINR } from "@/lib/utils/format";
import type {
  Adventure,
  AdventureCategory,
  CollaborationEnquiry,
  Enquiry,
  EventCategory,
  EventRecord,
  EventStatus,
  Profile,
  Registration,
  RegistrationStatus,
  TrekLeader,
  VolunteerRegistration,
  WebsiteSettings,
} from "@/types/database";

type TabId =
  | "overview"
  | "adventures"
  | "events"
  | "volunteers"
  | "leaders"
  | "registrations"
  | "enquiries"
  | "media"
  | "settings";

interface AdminDashboardClientProps {
  profile: Profile;
  initialAdventures: Adventure[];
  initialEvents: EventRecord[];
  initialLeaders: TrekLeader[];
  initialRegistrations: Registration[];
  initialVolunteerRegistrations: VolunteerRegistration[];
  initialEnquiries: Enquiry[];
  initialCollaborations: CollaborationEnquiry[];
  initialSettings: WebsiteSettings;
}

export function AdminDashboardClient({
  profile,
  initialAdventures,
  initialEvents,
  initialLeaders,
  initialRegistrations,
  initialVolunteerRegistrations,
  initialEnquiries,
  initialCollaborations,
  initialSettings,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [adventures, setAdventures] = useState(initialAdventures);
  const [events, setEvents] = useState(initialEvents);
  const [leaders, setLeaders] = useState(initialLeaders);
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [volRegs, setVolRegs] = useState(initialVolunteerRegistrations);
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [collaborations, setCollaborations] = useState(initialCollaborations);
  const [settings, setSettings] = useState(initialSettings);

  // Filters
  const [advCategoryFilter, setAdvCategoryFilter] = useState<AdventureCategory | "all">("all");
  const [regSearch, setRegSearch] = useState("");
  const [regEventFilter, setRegEventFilter] = useState("all");
  const [enqSearch, setEnqSearch] = useState("");

  // Creation Forms State
  const [newAdv, setNewAdv] = useState({
    category: "trek" as AdventureCategory,
    title: "",
    location: "",
    duration: "",
    difficulty: "",
    distance: "",
    elevation: "",
    price: "",
    age_requirement: "",
    short_description: "",
    description: "",
    cover_image_url: "",
    is_published: false,
  });

  const [newEvent, setNewEvent] = useState({
    category: "trek" as EventCategory,
    adventure_id: "",
    title: "",
    location: "",
    map_url: "",
    start_date: "",
    end_date: "",
    start_time: "",
    price: "",
    max_participants: "",
    short_description: "",
    description: "",
    cover_image_url: "",
    status: "draft" as EventStatus,
  });

  const [newLeader, setNewLeader] = useState({
    full_name: "",
    specialisation: "",
    experience: "",
    bio: "",
    avatar_url: "",
    is_published: true,
  });

  // Media State
  const [mediaFolder, setMediaFolder] = useState("treks");
  const [mediaItems, setMediaItems] = useState<
    Array<{ name: string; path: string; publicUrl: string }>
  >([]);
  const [mediaLoadedFolder, setMediaLoadedFolder] = useState<string | null>(null);

  function showToast(type: "ok" | "err", text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  }

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    } else {
      await fetch("/api/admin/local-logout", { method: "POST" });
    }
    router.push("/admin/login");
    router.refresh();
  }

  // Overview stats
  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(
    () => ({
      totalEvents: events.length,
      upcomingEvents: events.filter(
        (e) => e.start_date >= today && e.status === "published"
      ).length,
      totalRegistrations: registrations.length,
      pendingEnquiries:
        enquiries.filter((e) => e.status === "new").length +
        collaborations.filter((c) => c.status === "new").length,
      volunteerRegistrations: volRegs.length,
      publishedActivities: adventures.filter((a) => a.is_published).length,
    }),
    [events, registrations, enquiries, collaborations, volRegs, adventures, today]
  );

  // Adventure CRUD
  async function createAdventure(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/adventures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAdv),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Failed to create activity.");
    setAdventures([data.item, ...adventures]);
    setNewAdv({
      category: newAdv.category,
      title: "",
      location: "",
      duration: "",
      difficulty: "",
      distance: "",
      elevation: "",
      price: "",
      age_requirement: "",
      short_description: "",
      description: "",
      cover_image_url: "",
      is_published: false,
    });
    showToast("ok", "Activity created.");
  }

  async function toggleAdventurePublish(item: Adventure) {
    const res = await fetch("/api/admin/adventures", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, is_published: !item.is_published }),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Update failed.");
    setAdventures(adventures.map((a) => (a.id === item.id ? data.item : a)));
    showToast("ok", `${item.title} ${data.item.is_published ? "published" : "unpublished"}.`);
  }

  async function deleteAdventure(id: string) {
    const res = await fetch(`/api/admin/adventures?id=${id}`, { method: "DELETE" });
    if (!res.ok) return showToast("err", "Failed to delete activity.");
    setAdventures(adventures.filter((a) => a.id !== id));
    showToast("ok", "Activity deleted.");
  }

  // Event CRUD
  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Failed to create event.");
    setEvents([...events, data.item]);
    setNewEvent({
      category: "trek",
      adventure_id: "",
      title: "",
      location: "",
      map_url: "",
      start_date: "",
      end_date: "",
      start_time: "",
      price: "",
      max_participants: "",
      short_description: "",
      description: "",
      cover_image_url: "",
      status: "draft",
    });
    showToast("ok", "Event created.");
  }

  async function updateEventStatus(id: string, status: EventStatus) {
    const res = await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Status update failed.");
    setEvents(events.map((ev) => (ev.id === id ? data.item : ev)));
    showToast("ok", "Event status updated.");
  }

  async function deleteEvent(id: string) {
    const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
    if (!res.ok) return showToast("err", "Cannot delete event (may have linked registrations).");
    setEvents(events.filter((ev) => ev.id !== id));
    showToast("ok", "Event deleted.");
  }

  // Leader CRUD
  async function createLeader(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/trek-leaders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLeader),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Failed to create leader.");
    setLeaders([...leaders, data.item]);
    setNewLeader({
      full_name: "",
      specialisation: "",
      experience: "",
      bio: "",
      avatar_url: "",
      is_published: true,
    });
    showToast("ok", "Leader profile added.");
  }

  async function toggleLeaderPublish(leader: TrekLeader) {
    const res = await fetch("/api/admin/trek-leaders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leader.id, is_published: !leader.is_published }),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Update failed.");
    setLeaders(leaders.map((l) => (l.id === leader.id ? data.item : l)));
    showToast("ok", "Leader visibility updated.");
  }

  async function deleteLeader(id: string) {
    const res = await fetch(`/api/admin/trek-leaders?id=${id}`, { method: "DELETE" });
    if (!res.ok) return showToast("err", "Failed to delete leader.");
    setLeaders(leaders.filter((l) => l.id !== id));
    showToast("ok", "Leader deleted.");
  }

  async function uploadLeaderPhoto(file: File, leaderId?: string) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "leaders");
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      showToast("err", data.error || "Photo upload failed.");
      return;
    }

    if (!leaderId) {
      setNewLeader((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      showToast("ok", "Trek guide photo uploaded.");
      return;
    }

    const patchRes = await fetch("/api/admin/trek-leaders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leaderId, avatar_url: data.publicUrl }),
    });
    const patchData = await patchRes.json();
    if (!patchRes.ok) {
      showToast("err", patchData.error || "Failed to update leader photo.");
      return;
    }
    setLeaders((prev) => prev.map((l) => (l.id === leaderId ? patchData.item : l)));
    showToast("ok", "Trek guide photo updated.");
  }

  // Registrations & Enquiries updates
  async function updateRegistrationStatus(
    id: string,
    status: RegistrationStatus,
    type: "standard" | "volunteer" = "standard"
  ) {
    const res = await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, type }),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Failed to update registration.");
    if (type === "volunteer") {
      setVolRegs(volRegs.map((r) => (r.id === id ? { ...r, status: data.item.status } : r)));
    } else {
      setRegistrations(
        registrations.map((r) => (r.id === id ? { ...r, status: data.item.status } : r))
      );
    }
    showToast("ok", "Registration status updated.");
  }

  async function updateEnquiry(
    id: string,
    kind: "general" | "collaboration",
    updates: { status?: string; internal_notes?: string }
  ) {
    const res = await fetch("/api/admin/enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind, ...updates }),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Failed to update enquiry.");
    if (kind === "collaboration") {
      setCollaborations(collaborations.map((c) => (c.id === id ? data.item : c)));
    } else {
      setEnquiries(enquiries.map((e) => (e.id === id ? data.item : e)));
    }
    showToast("ok", "Enquiry updated.");
  }

  // Media Manager
  async function loadMedia(folder: string) {
    setMediaFolder(folder);
    const res = await fetch(`/api/admin/media?folder=${folder}`);
    const data = await res.json();
    if (res.ok) {
      setMediaItems(data.items || []);
      setMediaLoadedFolder(folder);
    } else {
      showToast("err", data.error || "Failed to load media.");
    }
  }

  async function uploadMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", mediaFolder);
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Upload failed.");
    setMediaItems([{ name: file.name, path: data.path, publicUrl: data.publicUrl }, ...mediaItems]);
    showToast("ok", "Image uploaded.");
  }

  async function uploadImageToField(
    file: File,
    folder: string,
    onSuccess: (publicUrl: string) => void
  ) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Image upload failed.");
    onSuccess(data.publicUrl);
    showToast("ok", "Image uploaded.");
  }

  async function deleteMedia(path: string) {
    const res = await fetch(`/api/admin/media?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
    if (!res.ok) return showToast("err", "Delete failed.");
    setMediaItems(mediaItems.filter((m) => m.path !== path));
    showToast("ok", "Media deleted.");
  }

  // Website Settings
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) return showToast("err", data.error || "Failed to save settings.");
    setSettings(data.settings);
    showToast("ok", "Website settings saved.");
  }

  // CSV Downloads
  function downloadCsv(filename: string, csvText: string) {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredRegistrations = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    return registrations.filter((r) => {
      const matchesEvent = regEventFilter === "all" || r.event_id === regEventFilter;
      const matchesQ =
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.reference_code.toLowerCase().includes(q) ||
        r.mobile.includes(q);
      return matchesEvent && matchesQ;
    });
  }, [registrations, regSearch, regEventFilter]);

  const TABS: Array<{ id: TabId; label: string; icon: typeof LayoutDashboard }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "adventures", label: "Treks, Trips & Kids", icon: Compass },
    { id: "events", label: "Event Calendar", icon: Calendar },
    { id: "volunteers", label: "Volunteers", icon: HeartHandshake },
    { id: "leaders", label: "Trek Leaders", icon: Users },
    { id: "registrations", label: "Registrations", icon: ClipboardList },
    { id: "enquiries", label: "Enquiries", icon: MessageSquare },
    { id: "media", label: "Media Library", icon: ImageIcon },
    { id: "settings", label: "Website Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4ED] text-[#262B27]">
      {/* Top Admin Bar */}
      <header className="bg-[#18372D] text-[#FFFDF8] border-b border-[#244B3C] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-editorial text-lg font-semibold">
            Kaggadu Admin
          </span>
          <span className="hidden sm:inline-block rounded-full bg-[#244B3C] px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-[#A8B8A0]">
            {profile.role}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-[#F6F4ED]/85 hover:text-[#FFFDF8]"
          >
            View Site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#244B3C] px-3 py-1.5 font-semibold hover:bg-[#244B3C]/80"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </header>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-md flex items-center gap-2 ${
            toast.type === "ok"
              ? "bg-[#18372D] text-[#FFFDF8]"
              : "bg-red-700 text-white"
          }`}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id);
                  if (t.id === "media" && mediaLoadedFolder !== mediaFolder) {
                    loadMedia(mediaFolder);
                  }
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#244B3C] text-[#FFFDF8]"
                    : "text-[#262B27] hover:bg-[#E9E9E2]/70"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Panel */}
        <section className="lg:col-span-9 space-y-6">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                Dashboard Overview
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Total Events", value: stats.totalEvents },
                  { label: "Upcoming Published Events", value: stats.upcomingEvents },
                  { label: "Total Registrations", value: stats.totalRegistrations },
                  { label: "Pending Enquiries", value: stats.pendingEnquiries },
                  { label: "Volunteer Registrations", value: stats.volunteerRegistrations },
                  { label: "Published Activities", value: stats.publishedActivities },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8C735A]">
                      {card.label}
                    </p>
                    <p className="font-editorial text-3xl font-semibold text-[#18372D] mt-2">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADVENTURES */}
          {activeTab === "adventures" && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                  Treks, Trips, Camping & Kids Programs
                </h1>
                <select
                  value={advCategoryFilter}
                  onChange={(e) =>
                    setAdvCategoryFilter(e.target.value as AdventureCategory | "all")
                  }
                  className="rounded-md border border-[#E9E9E2] bg-[#FFFDF8] px-3 py-2 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="trek">Treks</option>
                  <option value="trip">Trips</option>
                  <option value="camping">Camping</option>
                  <option value="kids">For Kids</option>
                </select>
              </div>

              <form
                onSubmit={createAdventure}
                className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-4"
              >
                <h2 className="font-editorial text-xl font-semibold text-[#18372D] flex items-center gap-2">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add New Activity
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <select
                    value={newAdv.category}
                    onChange={(e) =>
                      setNewAdv({ ...newAdv, category: e.target.value as AdventureCategory })
                    }
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  >
                    <option value="trek">Trek</option>
                    <option value="trip">Trip</option>
                    <option value="camping">Camping</option>
                    <option value="kids">For Kids</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Title (e.g., Kudremukh Peak Trek)"
                    value={newAdv.title}
                    onChange={(e) => setNewAdv({ ...newAdv, title: e.target.value })}
                    className="sm:col-span-2 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={newAdv.location}
                    onChange={(e) => setNewAdv({ ...newAdv, location: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., 2 Days / 1 Night)"
                    value={newAdv.duration}
                    onChange={(e) => setNewAdv({ ...newAdv, duration: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price (INR)"
                    value={newAdv.price}
                    onChange={(e) => setNewAdv({ ...newAdv, price: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Difficulty / Age Eligibility"
                    value={newAdv.difficulty}
                    onChange={(e) => setNewAdv({ ...newAdv, difficulty: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Cover Image URL (or upload)"
                      value={newAdv.cover_image_url}
                      onChange={(e) => setNewAdv({ ...newAdv, cover_image_url: e.target.value })}
                      className="flex-1 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                    />
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-md border border-[#244B3C] px-3 py-2 text-xs font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] transition-colors shrink-0">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Upload Cover
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const folder =
                            newAdv.category === "trek"
                              ? "treks"
                              : newAdv.category === "trip"
                              ? "trips"
                              : newAdv.category;
                          if (file) {
                            uploadImageToField(file, folder, (url) =>
                              setNewAdv((prev) => ({ ...prev, cover_image_url: url }))
                            );
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {newAdv.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={newAdv.cover_image_url}
                        alt="Activity cover preview"
                        className="h-9 w-14 rounded object-cover border border-[#E9E9E2] shrink-0"
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Short editorial summary"
                    value={newAdv.short_description}
                    onChange={(e) =>
                      setNewAdv({ ...newAdv, short_description: e.target.value })
                    }
                    className="sm:col-span-3 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <textarea
                    rows={3}
                    placeholder="Full description, safety guidelines, or itinerary notes"
                    value={newAdv.description}
                    onChange={(e) => setNewAdv({ ...newAdv, description: e.target.value })}
                    className="sm:col-span-3 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newAdv.is_published}
                      onChange={(e) => setNewAdv({ ...newAdv, is_published: e.target.checked })}
                    />
                    Publish immediately
                  </label>
                  <button
                    type="submit"
                    className="rounded-md bg-[#244B3C] px-5 py-2 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D]"
                  >
                    Create Activity
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {adventures
                  .filter(
                    (a) => advCategoryFilter === "all" || a.category === advCategoryFilter
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-[#8C735A]">
                          {item.category} • {item.location || "No location"}
                        </span>
                        <h3 className="font-editorial text-lg font-semibold text-[#18372D]">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#262B27]/75">
                          {formatINR(item.price)} • {item.duration || "Duration N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAdventurePublish(item)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                            item.is_published
                              ? "bg-[#244B3C] text-[#FFFDF8]"
                              : "border border-[#E9E9E2] text-[#262B27]"
                          }`}
                        >
                          {item.is_published ? "Published" : "Draft (Publish)"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAdventure(item.id)}
                          aria-label={`Delete ${item.title}`}
                          className="rounded-md p-2 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* EVENTS CALENDAR */}
          {activeTab === "events" && (
            <div className="space-y-8">
              <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                Event Calendar Management
              </h1>

              <form
                onSubmit={createEvent}
                className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-4"
              >
                <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
                  Schedule New Event
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <select
                    value={newEvent.category}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, category: e.target.value as EventCategory })
                    }
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  >
                    <option value="trek">Trek</option>
                    <option value="trip">Trip</option>
                    <option value="camping">Camping</option>
                    <option value="kids">Kids Program</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="special">Special Event</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Event Title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="sm:col-span-2 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    required
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price (INR)"
                    value={newEvent.price}
                    onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max Participants"
                    value={newEvent.max_participants}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, max_participants: e.target.value })
                    }
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Google Maps Link (optional)"
                    value={newEvent.map_url}
                    onChange={(e) => setNewEvent({ ...newEvent, map_url: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Start Time (e.g., 6:00 AM)"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <select
                    value={newEvent.adventure_id}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, adventure_id: e.target.value })
                    }
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  >
                    <option value="">Link to Activity (optional)</option>
                    {adventures.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.title} ({adv.category})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Cover Image URL (or upload)"
                      value={newEvent.cover_image_url}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, cover_image_url: e.target.value })
                      }
                      className="flex-1 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-[#244B3C] px-2.5 py-2 text-xs font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] shrink-0">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const folder =
                            newEvent.category === "trek"
                              ? "treks"
                              : newEvent.category === "trip"
                              ? "trips"
                              : newEvent.category === "volunteer"
                              ? "volunteers"
                              : newEvent.category === "special"
                              ? "general"
                              : newEvent.category;
                          if (file) {
                            uploadImageToField(file, folder, (url) =>
                              setNewEvent((prev) => ({ ...prev, cover_image_url: url }))
                            );
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Short description"
                    value={newEvent.short_description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, short_description: e.target.value })
                    }
                    className="sm:col-span-3 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <textarea
                    rows={3}
                    placeholder="Full event details, reporting time, and instructions"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    className="sm:col-span-3 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <select
                    value={newEvent.status}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, status: e.target.value as EventStatus })
                    }
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="fully_booked">Fully Booked</option>
                    <option value="registration_closed">Registration Closed</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-md bg-[#244B3C] px-5 py-2 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D]"
                  >
                    Create Event
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-[#8C735A]">
                        {ev.category} • {ev.start_date}
                      </span>
                      <h3 className="font-editorial text-lg font-semibold text-[#18372D]">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-[#262B27]/75">
                        {ev.location} • {formatINR(ev.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={ev.status}
                        onChange={(e) =>
                          updateEventStatus(ev.id, e.target.value as EventStatus)
                        }
                        className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-2.5 py-1.5 text-xs font-medium"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="fully_booked">Fully Booked</option>
                        <option value="registration_closed">Registration Closed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteEvent(ev.id)}
                        aria-label={`Delete ${ev.title}`}
                        className="rounded-md p-2 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VOLUNTEERS */}
          {activeTab === "volunteers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                  Volunteer Registrations
                </h1>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      "kaggadu-volunteers.csv",
                      toCsv(
                        ["Reference", "Event", "Name", "Mobile", "Email", "Count", "Status"],
                        volRegs.map((r) => [
                          r.reference_code,
                          r.event?.title || "",
                          r.full_name,
                          r.mobile,
                          r.email,
                          r.participants_count,
                          r.status,
                        ])
                      )
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#244B3C] px-4 py-2 text-xs font-semibold text-[#FFFDF8]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Export CSV
                </button>
              </div>
              <div className="space-y-3">
                {volRegs.length === 0 ? (
                  <p className="text-sm text-[#262B27]/75">No volunteer registrations yet.</p>
                ) : (
                  volRegs.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs font-mono text-[#8C735A]">{r.reference_code}</p>
                        <p className="font-semibold text-[#18372D]">{r.full_name}</p>
                        <p className="text-xs text-[#262B27]/75">
                          {r.mobile} • {r.email} • {r.event?.title}
                        </p>
                      </div>
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateRegistrationStatus(
                            r.id,
                            e.target.value as RegistrationStatus,
                            "volunteer"
                          )
                        }
                        className="rounded-md border border-[#E9E9E2] px-2.5 py-1.5 text-xs"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TREK LEADERS */}
          {activeTab === "leaders" && (
            <div className="space-y-8">
              <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                Trek Leader Profiles
              </h1>
              <form
                onSubmit={createLeader}
                className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-4"
              >
                <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
                  Add Verified Trek Leader
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newLeader.full_name}
                    onChange={(e) =>
                      setNewLeader({ ...newLeader, full_name: e.target.value })
                    }
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Specialisation (e.g., High-altitude & First Aid)"
                    value={newLeader.specialisation}
                    onChange={(e) =>
                      setNewLeader({ ...newLeader, specialisation: e.target.value })
                    }
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Experience (e.g., 6+ years in Western Ghats)"
                    value={newLeader.experience}
                    onChange={(e) =>
                      setNewLeader({ ...newLeader, experience: e.target.value })
                    }
                    className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Profile Photo URL (or upload)"
                      value={newLeader.avatar_url}
                      onChange={(e) =>
                        setNewLeader({ ...newLeader, avatar_url: e.target.value })
                      }
                      className="flex-1 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                    />
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-md border border-[#244B3C] px-3 py-2 text-xs font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] transition-colors shrink-0">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadLeaderPhoto(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {newLeader.avatar_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={newLeader.avatar_url}
                        alt="Trek guide preview"
                        className="h-9 w-9 rounded-full object-cover border border-[#E9E9E2] shrink-0"
                      />
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Biography"
                    value={newLeader.bio}
                    onChange={(e) => setNewLeader({ ...newLeader, bio: e.target.value })}
                    className="sm:col-span-2 rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newLeader.is_published}
                      onChange={(e) =>
                        setNewLeader({ ...newLeader, is_published: e.target.checked })
                      }
                    />
                    Publish profile
                  </label>
                  <button
                    type="submit"
                    className="rounded-md bg-[#244B3C] px-5 py-2 text-sm font-semibold text-[#FFFDF8]"
                  >
                    Add Leader
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {leaders.map((leader) => (
                  <div
                    key={leader.id}
                    className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {leader.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={leader.avatar_url}
                          alt={leader.avatar_alt || leader.full_name}
                          className="h-12 w-12 rounded-full object-cover border border-[#E9E9E2] shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-[#A8B8A0]/25 text-[#244B3C] flex items-center justify-center text-xs font-semibold shrink-0">
                          {leader.full_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-editorial text-lg font-semibold text-[#18372D]">
                          {leader.full_name}
                        </h3>
                        <p className="text-xs text-[#8C735A]">
                          {leader.specialisation} • {leader.experience}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-[#E9E9E2] px-3 py-1.5 text-xs font-semibold text-[#244B3C] hover:border-[#244B3C] transition-colors">
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        {leader.avatar_url ? "Change Photo" : "Add Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadLeaderPhoto(file, leader.id);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleLeaderPublish(leader)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          leader.is_published
                            ? "bg-[#244B3C] text-[#FFFDF8]"
                            : "border border-[#E9E9E2]"
                        }`}
                      >
                        {leader.is_published ? "Published" : "Draft"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLeader(leader.id)}
                        className="rounded-md p-2 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REGISTRATIONS */}
          {activeTab === "registrations" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                  Registrations
                </h1>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      "kaggadu-registrations.csv",
                      toCsv(
                        [
                          "Reference",
                          "Event",
                          "Name",
                          "Mobile",
                          "Email",
                          "Participants",
                          "Emergency Contact",
                          "Status",
                          "Created At",
                        ],
                        filteredRegistrations.map((r) => [
                          r.reference_code,
                          r.event?.title || "",
                          r.full_name,
                          r.mobile,
                          r.email,
                          r.participants_count,
                          r.emergency_contact || "",
                          r.status,
                          r.created_at,
                        ])
                      )
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#244B3C] px-4 py-2 text-xs font-semibold text-[#FFFDF8]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Export CSV
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <input
                  type="search"
                  placeholder="Search by name, mobile, or reference..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="rounded-md border border-[#E9E9E2] bg-[#FFFDF8] px-3.5 py-2 text-sm min-w-[240px]"
                />
                <select
                  value={regEventFilter}
                  onChange={(e) => setRegEventFilter(e.target.value)}
                  className="rounded-md border border-[#E9E9E2] bg-[#FFFDF8] px-3 py-2 text-sm"
                >
                  <option value="all">All Events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {filteredRegistrations.length === 0 ? (
                  <p className="text-sm text-[#262B27]/75">No matching registrations found.</p>
                ) : (
                  filteredRegistrations.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-[#8C735A]">
                          {r.reference_code} • {r.event?.title || "Event"}
                        </p>
                        <p className="font-semibold text-[#18372D]">
                          {r.full_name} ({r.participants_count} pax)
                        </p>
                        <p className="text-xs text-[#262B27]/75">
                          {r.mobile} • {r.email}
                          {r.emergency_contact ? ` • Emergency: ${r.emergency_contact}` : ""}
                        </p>
                      </div>
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateRegistrationStatus(
                            r.id,
                            e.target.value as RegistrationStatus
                          )
                        }
                        className="rounded-md border border-[#E9E9E2] px-2.5 py-1.5 text-xs"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ENQUIRIES */}
          {activeTab === "enquiries" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                  General & Collaboration Enquiries
                </h1>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      "kaggadu-enquiries.csv",
                      toCsv(
                        ["Type", "Name", "Organisation", "Mobile", "Email", "Subject/Type", "Status", "Message"],
                        [
                          ...enquiries.map((e) => [
                            "General",
                            e.full_name,
                            "",
                            e.mobile,
                            e.email,
                            e.subject || "",
                            e.status,
                            e.message,
                          ]),
                          ...collaborations.map((c) => [
                            "Collaboration",
                            c.name,
                            c.organisation,
                            c.mobile,
                            c.email,
                            c.collaboration_type,
                            c.status,
                            c.message,
                          ]),
                        ]
                      )
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#244B3C] px-4 py-2 text-xs font-semibold text-[#FFFDF8]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Export CSV
                </button>
              </div>

              <input
                type="search"
                placeholder="Search enquiries..."
                value={enqSearch}
                onChange={(e) => setEnqSearch(e.target.value)}
                className="rounded-md border border-[#E9E9E2] bg-[#FFFDF8] px-3.5 py-2 text-sm w-full sm:max-w-xs"
              />

              <div className="space-y-4">
                {enquiries
                  .filter(
                    (e) =>
                      !enqSearch ||
                      e.full_name.toLowerCase().includes(enqSearch.toLowerCase()) ||
                      (e.subject || "").toLowerCase().includes(enqSearch.toLowerCase())
                  )
                  .map((enq) => (
                    <div
                      key={enq.id}
                      className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] uppercase font-semibold text-[#8C735A]">
                            General Enquiry
                          </span>
                          <h3 className="font-semibold text-[#18372D]">
                            {enq.full_name} — {enq.subject}
                          </h3>
                          <p className="text-xs text-[#262B27]/75">
                            {enq.mobile} • {enq.email}
                          </p>
                        </div>
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            updateEnquiry(enq.id, "general", { status: e.target.value })
                          }
                          className="rounded-md border border-[#E9E9E2] px-2.5 py-1.5 text-xs"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <p className="text-sm text-[#262B27]/85">{enq.message}</p>
                    </div>
                  ))}

                {collaborations
                  .filter(
                    (c) =>
                      !enqSearch ||
                      c.name.toLowerCase().includes(enqSearch.toLowerCase()) ||
                      c.organisation.toLowerCase().includes(enqSearch.toLowerCase())
                  )
                  .map((col) => (
                    <div
                      key={col.id}
                      className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] uppercase font-semibold text-[#244B3C]">
                            Collaboration • {col.collaboration_type}
                          </span>
                          <h3 className="font-semibold text-[#18372D]">
                            {col.organisation} ({col.name})
                          </h3>
                          <p className="text-xs text-[#262B27]/75">
                            {col.mobile} • {col.email}
                          </p>
                        </div>
                        <select
                          value={col.status}
                          onChange={(e) =>
                            updateEnquiry(col.id, "collaboration", {
                              status: e.target.value,
                            })
                          }
                          className="rounded-md border border-[#E9E9E2] px-2.5 py-1.5 text-xs"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <p className="text-sm text-[#262B27]/85">{col.message}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* MEDIA LIBRARY */}
          {activeTab === "media" && (
            <div className="space-y-6">
              <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                Media Library
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {["logo", "treks", "trips", "camping", "kids", "volunteers", "leaders", "general"].map(
                    (f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => loadMedia(f)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${
                          mediaFolder === f
                            ? "bg-[#244B3C] text-[#FFFDF8]"
                            : "border border-[#E9E9E2] text-[#262B27]"
                        }`}
                      >
                        {f}
                      </button>
                    )
                  )}
                </div>
                <label className="inline-flex items-center gap-2 rounded-md bg-[#244B3C] px-4 py-2 text-xs font-semibold text-[#FFFDF8] cursor-pointer hover:bg-[#18372D]">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadMedia}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mediaItems.map((m) => (
                  <div
                    key={m.path}
                    className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.publicUrl}
                      alt={m.name}
                      className="h-36 w-full object-cover"
                    />
                    <div className="p-3 space-y-2">
                      <p className="text-xs truncate font-medium">{m.name}</p>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(m.publicUrl);
                            showToast("ok", "Image URL copied.");
                          }}
                          className="text-xs font-semibold text-[#244B3C] hover:underline"
                        >
                          Copy URL
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMedia(m.path)}
                          className="text-red-700 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WEBSITE SETTINGS */}
          {activeTab === "settings" && (
            <form
              onSubmit={saveSettings}
              className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-5"
            >
              <h1 className="font-editorial text-3xl font-semibold text-[#18372D]">
                Website Settings
              </h1>
              {profile.role !== "admin" && (
                <p className="text-xs text-red-700">
                  Only Administrator accounts can save Website Settings.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    WhatsApp Number or URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://wa.me/... or 917760013106"
                    value={settings.whatsapp_number}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsapp_number: e.target.value })
                    }
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Contact Email / Website
                  </label>
                  <input
                    type="text"
                    value={settings.contact_email}
                    onChange={(e) =>
                      setSettings({ ...settings, contact_email: e.target.value })
                    }
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Primary Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settings.contact_phone}
                    onChange={(e) =>
                      setSettings({ ...settings, contact_phone: e.target.value })
                    }
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Secondary Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settings.secondary_phone}
                    onChange={(e) =>
                      setSettings({ ...settings, secondary_phone: e.target.value })
                    }
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={settings.instagram_url}
                    onChange={(e) =>
                      setSettings({ ...settings, instagram_url: e.target.value })
                    }
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Google Review URL
                  </label>
                  <input
                    type="url"
                    value={settings.google_review_url}
                    onChange={(e) =>
                      setSettings({ ...settings, google_review_url: e.target.value })
                    }
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Logo URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.logo_url || ""}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                      className="flex-1 rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-[#244B3C] px-2.5 py-2 text-xs font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] shrink-0">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadImageToField(file, "logo", (url) =>
                              setSettings((prev) => ({ ...prev, logo_url: url }))
                            );
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Hero Title
                  </label>
                  <input
                    type="text"
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    Hero Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={settings.hero_subtitle}
                    onChange={(e) =>
                      setSettings({ ...settings, hero_subtitle: e.target.value })
                    }
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#8C735A] mb-1">
                    SEO Default Description
                  </label>
                  <textarea
                    rows={2}
                    value={settings.seo_default_description}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seo_default_description: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-[#E9E9E2] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={profile.role !== "admin"}
                className="rounded-md bg-[#244B3C] px-6 py-2.5 text-sm font-semibold text-[#FFFDF8] disabled:opacity-50"
              >
                Save Website Settings
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
