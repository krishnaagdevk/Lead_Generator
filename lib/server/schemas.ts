import { z } from "zod";

export const searchSchema = z.object({
  businessType: z
    .string()
    .trim()
    .min(1, "Business type must be at least 1 character long")
    .max(100, "Business type must not exceed 100 characters"),
  geoQuery: z.object({
    mode: z.enum(["radius", "city", "polygon", "multi_city"]),
    lat: z.number().optional(),
    lng: z.number().optional(),
    radius_km: z.number().optional(),
    radius: z.number().optional(),
    center: z.object({ lat: z.number(), lng: z.number() }).optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    coords: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
    polygon: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
    cities: z.array(z.string()).optional(),
    unit: z.string().optional(),
  }).passthrough(),
});
