"use client";

import { useEffect, useRef, useState } from "react";

/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    initMap: () => void;
  }
}

interface MapViewProps {
  mode: "radius" | "city" | "polygon" | "multi_city";
  center: { lat: number; lng: number } | null;
  radiusKm: number;
  unit: "km" | "mi";
  polygon: Array<{ lat: number; lng: number }>;
  onCenterChange: (c: { lat: number; lng: number }) => void;
  onPolygonChange: (pts: Array<{ lat: number; lng: number }>) => void;
}

export function MapView({ mode, center, radiusKm, unit, polygon, onCenterChange, onPolygonChange }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const markerRef = useRef<any>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const polyPointsRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const polygonValRef = useRef(polygon);
  const modeValRef = useRef(mode);

  useEffect(() => {
    polygonValRef.current = polygon;
  }, [polygon]);

  useEffect(() => {
    modeValRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return;
    if (window.google?.maps) { setLoaded(true); return; }

    (window as any).initMap = () => {
      setLoaded(true);
    };

    let script = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLScriptElement | null;
    if (script && !script.src.includes("places")) {
      script.remove();
      script = null;
      if (typeof window !== "undefined" && (window as any).google) {
        try {
          delete (window as any).google;
        } catch (e) {}
      }
    }

    if (!script) {
      script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=drawing,marker,places&loading=async&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      if (window.google?.maps) {
        setLoaded(true);
      }
    }

    return () => {
      delete (window as any).initMap;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || mapObjRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.209 },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: "DEMO_MAP_ID",
    });
    mapObjRef.current = map;

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      const currentMode = modeValRef.current;
      if (currentMode === "radius" || currentMode === "city" || currentMode === "multi_city") {
        onCenterChange(pt);
      } else if (currentMode === "polygon") {
        onPolygonChange([...polygonValRef.current, pt]);
      }
    });
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update circle / marker
  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || !center) return;

    if (markerRef.current) markerRef.current.map = null;
    markerRef.current = new google.maps.marker.AdvancedMarkerElement({ position: center, map });

    if (mode === "radius") {
      if (circleRef.current) circleRef.current.setMap(null);
      const km = unit === "mi" ? radiusKm * 1.60934 : radiusKm;
      circleRef.current = new google.maps.Circle({
        center,
        radius: km * 1000,
        map,
        fillColor: "#6366F1",
        fillOpacity: 0.1,
        strokeColor: "#6366F1",
        strokeWeight: 2,
      });
      map.setCenter(center);
    }
  }, [center, radiusKm, unit, mode]);

  // Update polygon overlay
  useEffect(() => {
    const map = mapObjRef.current;
    if (!map) return;

    // Handle custom markers for points while drawing (length < 3)
    polyPointsRef.current.forEach((m) => (m.map = null));
    polyPointsRef.current = [];

    if (polygon.length > 0 && polygon.length < 3) {
      polyPointsRef.current = polygon.map((pt) => {
        const dot = document.createElement("div");
        dot.style.width = "12px";
        dot.style.height = "12px";
        dot.style.backgroundColor = "#6366F1";
        dot.style.borderRadius = "50%";
        return new google.maps.marker.AdvancedMarkerElement({ position: pt, map, content: dot });
      });
    }

    if (polygon.length < 3) {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
      return;
    }

    // If polygon has >= 3 points, render or update the editable & draggable polygon
    if (polygon.length >= 3) {
      if (!polygonRef.current) {
        const poly = new google.maps.Polygon({
          paths: polygon,
          map,
          fillColor: "#6366F1",
          fillOpacity: 0.15,
          strokeColor: "#6366F1",
          strokeWeight: 2,
          editable: true,
          draggable: true,
        });
        polygonRef.current = poly;

        const updatePath = () => {
          const path = poly.getPath();
          const newPts: Array<{ lat: number; lng: number }> = [];
          for (let i = 0; i < path.getLength(); i++) {
            const xy = path.getAt(i);
            newPts.push({ lat: xy.lat(), lng: xy.lng() });
          }
          onPolygonChange(newPts);
        };

        const path = poly.getPath();
        path.addListener("set_at", updatePath);
        path.addListener("insert_at", updatePath);
        path.addListener("remove_at", updatePath);
      } else {
        // If the polygon exists, update its path ONLY if it differs from the prop.
        // This prevents resetting the user's drag state while they are editing.
        const path = polygonRef.current.getPath();
        let pathDiffers = path.getLength() !== polygon.length;
        if (!pathDiffers) {
          for (let i = 0; i < polygon.length; i++) {
            const xy = path.getAt(i);
            if (Math.abs(xy.lat() - polygon[i].lat) > 0.000001 || Math.abs(xy.lng() - polygon[i].lng) > 0.000001) {
              pathDiffers = true;
              break;
            }
          }
        }

        if (pathDiffers) {
          path.clear();
          polygon.forEach((pt) => path.push(new google.maps.LatLng(pt.lat, pt.lng)));
        }
      }
    }
  }, [polygon]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <div className="text-center text-muted">
          <p className="font-medium">Google Maps not configured</p>
          <p className="text-sm mt-1">Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env.local</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" aria-label="Search area map" />;
}
