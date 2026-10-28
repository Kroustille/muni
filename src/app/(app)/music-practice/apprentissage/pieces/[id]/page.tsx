"use client";

import { useParams } from "next/navigation";

import { LearningPieceDetail } from "@/components/music-practice/learning-piece-detail";

export default function LearningPieceDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <LearningPieceDetail id={id} />;
}
