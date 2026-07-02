"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, MapPin, Globe, Pencil, Building2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MapView } from "./MapView";
import { useRouter } from "next/navigation";

type TabId = "radius" | "city" | "polygon" | "multi_city";

const TABS: { id: TabId; label: string; icon: typeof MapPin }[] = [
  { id: "radius", label: "Radius", icon: MapPin },
  { id: "city", label: "City", icon: Building2 },
  { id: "polygon", label: "Draw Area", icon: Pencil },
  { id: "multi_city", label: "Multi-City", icon: Globe },
];

interface SearchJob {
  id: number;
  status: string;
  totalFound: number;
  businessType: string;
  error: string | null;
}

const SUGGESTIONS = [
  "Restaurants",
  "Dentists",
  "Gyms",
  "Cafes",
  "Bakeries",
  "Real Estate",
  "Plumbers",
  "Electricians",
  "Hair Salons",
  "Hotels",
  "Spas",
  "Law Firms",
  "Clinics",
  "Schools",
  "Supermarkets",
  "Pharmacies",
  "Auto Repair",
];

export function SearchPanel() {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("radius");
  const [businessType, setBusinessType] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [unit, setUnit] = useState<"km" | "mi">("km");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [polygon, setPolygon] = useState<Array<{ lat: number; lng: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setCenter({ lat: 28.6139, lng: 77.209 });
        }
      );
    } else {
      setCenter({ lat: 28.6139, lng: 77.209 });
    }
  }, []);

  const { data: jobStatus } = useQuery<SearchJob>({
    queryKey: ["search-job", activeJobId],
    queryFn: () => fetch(`/api/search/${activeJobId}`).then((r) => r.json()),
    enabled: !!activeJobId,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "running" || status === "queued" ? 2000 : false;
    },
  });

  useEffect(() => {
    if (jobStatus?.status === "done") {
      qc.invalidateQueries({ queryKey: ["leads"] });
      router.push("/leads");
    }
  }, [jobStatus?.status, qc, router]);

  const startSearch = useMutation({
    mutationFn: async () => {
      let geoQuery: Record<string, unknown>;
      if (tab === "radius") {
        if (!center) throw new Error("Click on the map to set your search location");
        const km = unit === "mi" ? radiusKm * 1.60934 : radiusKm;
        geoQuery = { mode: "radius", lat: center.lat, lng: center.lng, radius_km: km };
      } else if (tab === "city") {
        if (!city.trim()) throw new Error("Enter a city name");
        geoQuery = { mode: "city", city: city.trim() };
      } else if (tab === "polygon") {
        if (polygon.length < 3) throw new Error("Draw an area on the map (minimum 3 points)");
        geoQuery = { mode: "polygon", coords: polygon };
      } else {
        if (cities.length === 0) throw new Error("Add at least one city");
        geoQuery = { mode: "multi_city", cities };
      }

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: businessType.trim(), geoQuery }),
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<SearchJob>;
    },
    onSuccess: (job) => setActiveJobId(job.id),
    onError: (err) => alert(err instanceof Error ? err.message : "Search failed"),
  });

  const isRunning = jobStatus?.status === "running" || jobStatus?.status === "queued";

  const filteredSuggestions = SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(businessType.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-80 shrink-0 bg-white border-r border-border flex flex-col overflow-y-auto">
        <div className="p-4 flex flex-col gap-4">
          <div className="relative">
            <Input
              label="Business Type"
              placeholder="e.g. restaurants, dentists, gyms"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
            />
            {showSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setBusinessType(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-background cursor-pointer transition-colors font-medium text-text"
                  >
                    {suggestion}
                  </button>
                ))}
                {filteredSuggestions.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted">
                    No matching suggestions
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div>
            <p className="text-sm font-medium text-text mb-2">Search Area</p>
            <div className="grid grid-cols-2 gap-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200",
                    tab === id
                      ? "text-white"
                      : "bg-background text-muted hover:bg-background/80"
                  )}
                  style={tab === id ? { backgroundColor: "var(--color-primary)" } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {tab === "radius" && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-text">Radius</label>
                  <div className="flex rounded-md overflow-hidden border border-border text-xs">
                    {(["km", "mi"] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={cn("px-2 py-1 cursor-pointer transition-colors", unit === u ? "text-white" : "text-muted")}
                        style={unit === u ? { backgroundColor: "var(--color-primary)" } : {}}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between items-center text-xs text-muted mt-1 gap-2">
                  <span>1 {unit}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={radiusKm || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val)) setRadiusKm(val);
                      }}
                      className="w-16 h-6 px-1 text-center border border-border rounded bg-transparent text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="font-semibold text-primary">{unit}</span>
                  </div>
                  <span>50 {unit}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted">
                  {center ? `📍 ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : "Click on the map to set location"}
                </p>
                <button
                  onClick={() => {
                    if ("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        () => setCenter({ lat: 28.6139, lng: 77.209 })
                      );
                    }
                  }}
                  className="text-xs text-primary hover:underline cursor-pointer font-medium"
                >
                  Locate me
                </button>
              </div>
            </div>
          )}

          {tab === "city" && (
            <Input
              label="City / Neighborhood / Postcode"
              placeholder="e.g. Austin, TX or SW1A 1AA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          )}

          {tab === "polygon" && (
            <div className="text-sm text-muted bg-background rounded-md p-3">
              Click points on the map to draw your search area. Click the first point again to close the polygon.
              {polygon.length > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-primary font-medium">{polygon.length} points</span>
                  <button onClick={() => setPolygon([])} className="text-red-500 text-xs cursor-pointer hover:underline">Clear</button>
                </div>
              )}
            </div>
          )}

          {tab === "multi_city" && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Add a city"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && cityInput.trim()) {
                      setCities((c) => [...c, cityInput.trim()]);
                      setCityInput("");
                    }
                  }}
                />
                <Button size="sm" onClick={() => { if (cityInput.trim()) { setCities((c) => [...c, cityInput.trim()]); setCityInput(""); } }}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {cities.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-2 py-1">
                    {c}
                    <button onClick={() => setCities((cs) => cs.filter((_, j) => j !== i))} className="cursor-pointer hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search status */}
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-md p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching... {jobStatus?.totalFound ?? 0} found so far</span>
            </div>
          )}

          <Button
            className="w-full"
            loading={startSearch.isPending || isRunning}
            disabled={!businessType.trim()}
            onClick={() => startSearch.mutate()}
          >
            <Search className="w-4 h-4" />
            {isRunning ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView
          mode={tab}
          center={center}
          radiusKm={radiusKm}
          unit={unit}
          polygon={polygon}
          onCenterChange={setCenter}
          onPolygonChange={setPolygon}
        />
      </div>
    </div>
  );
}
