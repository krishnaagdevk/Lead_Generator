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

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return;
    if (window.google?.maps) { setLoaded(true); return; }

    (window as any).initMap = () => {
      setLoaded(true);
    };

    let script = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=drawing,marker&loading=async&callback=initMap`;
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

      if (mode === "radius" || mode === "city" || mode === "multi_city") {
        onCenterChange(pt);
      } else if (mode === "polygon") {
        onPolygonChange([...polygon, pt]);
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

    if (polygonRef.current) polygonRef.current.setMap(null);
    polyPointsRef.current.forEach((m) => (m.map = null));
    polyPointsRef.current = [];

    if (polygon.length > 0) {
      polyPointsRef.current = polygon.map((pt) => {
        const dot = document.createElement("div");
        dot.style.width = "12px";
        dot.style.height = "12px";
        dot.style.backgroundColor = "#6366F1";
        dot.style.borderRadius = "50%";
        return new google.maps.marker.AdvancedMarkerElement({ position: pt, map, content: dot });
      });
    }
    if (polygon.length >= 3) {
      polygonRef.current = new google.maps.Polygon({
        paths: polygon,
        map,
        fillColor: "#6366F1",
        fillOpacity: 0.15,
        strokeColor: "#6366F1",
        strokeWeight: 2,
      });
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
