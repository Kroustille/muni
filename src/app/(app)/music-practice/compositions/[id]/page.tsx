"use client";

import { useParams } from "next/navigation";

import { CompositionDetail } from "@/components/music-practice/composition-detail";

export default function CompositionDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <CompositionDetail id={id} />;
}
