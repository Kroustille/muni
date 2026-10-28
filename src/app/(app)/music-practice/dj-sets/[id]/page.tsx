"use client";

import { useParams } from "next/navigation";

import { DjSetDetail } from "@/components/music-practice/dj-set-detail";

export default function DjSetDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <DjSetDetail id={id} />;
}
