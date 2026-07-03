"use client";

import { useQuery } from "@tanstack/react-query";
import { GoogleMap, HeatmapLayer, LoadScript } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 100px)'
};

export default function HeatmapPage() {
  const { data: leads } = useQuery({
    queryKey: ["heatmap-data"],
    queryFn: () => fetch("/api/analytics/heatmap").then(r => r.json()),
  });

  // Convert leads to heatmap data points
  const heatmapData = leads?.map((lead: any) => ({
    lat: parseFloat(lead.lat),
    lng: parseFloat(lead.lng),
    weight: lead.leadScore / 10 || 1
  })) || [];

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-text mb-4">Search Heatmap</h1>
      <p className="text-sm text-muted mb-6">
        Visual representation of lead density. Darker areas indicate higher concentration of leads.
      </p>

      <div className="bg-white border border-border rounded-xl overflow-hidden h-[calc(100vh-180px)]">
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={heatmapData.length > 0 ? {
                lat: heatmapData[0].lat,
                lng: heatmapData[0].lng
              } : { lat: 37.0902, lng: -95.7129 }} // Default to US center
              zoom={heatmapData.length > 0 ? 8 : 4}
            >
              <HeatmapLayer
                data={heatmapData}
                options={
                  {
                    radius: 20,
                    opacity: 0.6,
                    dissipating: true
                  }
                }
              />
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="flex items-center justify-center h-full text-muted">
            <div className="text-center">
              <p className="font-medium mb-2">Google Maps API key not configured</p>
              <p className="text-sm">Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to your environment variables</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}