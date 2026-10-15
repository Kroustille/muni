"use client";

import { useParams } from "next/navigation";

import { ListPageFromParam } from "@/components/lists/list-page-content";

export default function ListPage() {
  const params = useParams();
  const routeParam = params.type;
  return (
    <ListPageFromParam
      routeParam={typeof routeParam === "string" ? routeParam : undefined}
    />
  );
}
