"use client";

import { useParams } from "next/navigation";
import { PlantDetail } from "@/components/plants/plant-detail";

export default function PlantDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <PlantDetail plantId={id} />;
}
