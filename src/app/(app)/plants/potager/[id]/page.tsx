"use client";

import { useParams } from "next/navigation";
import { VegetableCultureDetail } from "@/components/plants/vegetable-culture-detail";

export default function PotagerDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <VegetableCultureDetail cultureId={id} />;
}
