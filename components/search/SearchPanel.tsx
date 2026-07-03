"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, MapPin, Globe, Pencil, Building2, Trash2, AlertCircle } from "lucide-react";
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

  const autocompleteService = useRef<any>(null);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const fetchCitySuggestions = (input: string) => {
    if (!input.trim()) {
      setCitySuggestions([]);
      return;
    }
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      if (!autocompleteService.current) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      autocompleteService.current.getPlacePredictions(
        {
          input,
          types: ["(regions)"],
        },
        (predictions: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setCitySuggestions(predictions.map((p: any) => p.description));
          } else {
            setCitySuggestions([]);
          }
        }
      );
    }
  };

  const { data: savedSearches, refetch: refetchSaved } = useQuery<any[]>({
    queryKey: ["saved-searches"],
    queryFn: () => fetch("/api/saved-searches").then((r) => r.json()),
  });

  const saveSearchMutation = useMutation({
    mutationFn: async (name: string) => {
      let geoQuery: Record<string, unknown>;
      if (tab === "radius") {
        if (!center) throw new Error("Click on the map to set location");
        geoQuery = { mode: "radius", lat: center.lat, lng: center.lng, radius_km: radiusKm, unit };
      } else if (tab === "city") {
        if (!city.trim()) throw new Error("Enter a city name");
        geoQuery = { mode: "city", city: city.trim() };
      } else if (tab === "polygon") {
        if (polygon.length < 3) throw new Error("Draw an area on the map");
        geoQuery = { mode: "polygon", coords: polygon };
      } else {
        if (cities.length === 0) throw new Error("Add at least one city");
        geoQuery = { mode: "multi_city", cities };
      }

      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, businessType: businessType.trim(), geoQuery }),
      });
      if (!res.ok) throw new Error("Failed to save search preset");
      return res.json();
    },
    onSuccess: () => {
      refetchSaved();
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Failed to save preset"),
  });

  const deleteSavedMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete saved search");
      return res.json();
    },
    onSuccess: () => {
      refetchSaved();
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Failed to delete preset"),
  });

  const loadSavedSearch = (saved: any) => {
    setBusinessType(saved.businessType);
    const gq = saved.geoQuery;
    setTab(gq.mode);
    if (gq.mode === "radius") {
      setCenter({ lat: gq.lat, lng: gq.lng });
      setRadiusKm(gq.radius_km);
      if (gq.unit) setUnit(gq.unit);
    } else if (gq.mode === "city") {
      setCity(gq.city);
    } else if (gq.mode === "polygon") {
      setPolygon(gq.coords);
    } else if (gq.mode === "multi_city") {
      setCities(gq.cities);
    }
  };

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
    if (jobStatus?.status === "done" && !jobStatus?.error) {
      qc.invalidateQueries({ queryKey: ["leads"] });
      router.push("/leads");
    }
  }, [jobStatus?.status, jobStatus?.error, qc, router]);

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
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Left Panel */}
      <div className="w-full md:w-80 shrink-0 bg-white border-b md:border-b-0 md:border-r border-border flex flex-col overflow-y-auto max-h-[50vh] md:max-h-full">
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
            <div className="relative">
              <Input
                label="City / Neighborhood / Postcode"
                placeholder="e.g. Austin, TX or SW1A 1AA"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  fetchCitySuggestions(e.target.value);
                }}
                onFocus={() => setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {citySuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCity(suggestion);
                        setShowCitySuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-background cursor-pointer transition-colors font-medium text-text"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                <div className="flex-1 relative">
                  <input
                    className="w-full h-9 rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white text-text"
                    placeholder="Add a city"
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                      fetchCitySuggestions(e.target.value);
                    }}
                    onFocus={() => setShowCitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && cityInput.trim()) {
                        setCities((c) => [...c, cityInput.trim()]);
                        setCityInput("");
                        setCitySuggestions([]);
                      }
                    }}
                  />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {citySuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCities((c) => [...c, suggestion]);
                            setCityInput("");
                            setShowCitySuggestions(false);
                            setCitySuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-background cursor-pointer transition-colors font-medium text-text"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="sm" onClick={() => { if (cityInput.trim()) { setCities((c) => [...c, cityInput.trim()]); setCityInput(""); setCitySuggestions([]); } }}>
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

          {jobStatus?.status === "done" && jobStatus?.error && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-500 mt-0.5" />
              <span>{jobStatus.error}</span>
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

          <Button
            variant="secondary"
            className="w-full mt-1 border-dashed"
            disabled={!businessType.trim() || isRunning}
            onClick={() => {
              const name = prompt("Enter a name for this search preset:");
              if (name?.trim()) saveSearchMutation.mutate(name.trim());
            }}
          >
            Save Preset Template
          </Button>

          {savedSearches && savedSearches.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Saved Search Presets</p>
              <div className="flex flex-col gap-1.5">
                {savedSearches.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-md border border-border hover:bg-background/50 transition-colors duration-150">
                    <button
                      type="button"
                      onClick={() => loadSavedSearch(s)}
                      className="flex-1 text-left text-xs font-medium text-text hover:text-primary transition-colors cursor-pointer truncate"
                      title={`Load: ${s.name} (${s.businessType})`}
                    >
                      <div className="font-semibold truncate">{s.name}</div>
                      <div className="text-[10px] text-muted truncate mt-0.5">{s.businessType} • {s.geoQuery?.mode}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete preset "${s.name}"?`)) deleteSavedMutation.mutate(s.id);
                      }}
                      className="text-muted hover:text-red-500 cursor-pointer p-1"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 h-[50vh] md:h-full min-h-[300px]">
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
