"use client";

import type { CheckfrontItem } from "@/lib/checkfront-types";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { availabilityLabel, getItemImageUrl, stripHtml } from "@/lib/utils";

interface ItemCardProps {
  item: CheckfrontItem;
  selected?: boolean;
  onSelect?: () => void;
}

export function ItemCard({ item, selected, onSelect }: ItemCardProps) {
  const ratedStock = item.rate?.available ?? item.stock;
  const availability = availabilityLabel(ratedStock, item.unlimited);
  const badgeVariant =
    availability === "Sold out"
      ? "error"
      : availability.startsWith("Only")
        ? "warning"
        : "success";

  const isSoldOut = availability === "Sold out" || item.rate?.status === "UNAVAILABLE";
  const imageUrl = getItemImageUrl(item.image);
  const cleanSummary = item.summary ? stripHtml(item.summary) : "";

  return (
    <Card
      selected={selected}
      hoverable={!isSoldOut}
      onClick={isSoldOut ? undefined : onSelect}
      className={isSoldOut ? "opacity-60" : ""}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={item.name}
          className="mb-3 h-40 w-full rounded-lg object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <CardTitle>{item.name}</CardTitle>
        <Badge variant={badgeVariant}>{availability}</Badge>
      </div>
      <CardContent>
        {cleanSummary && (
          <p className="mt-2 line-clamp-3 text-sm text-[var(--color-muted)]">
            {cleanSummary}
          </p>
        )}
        {item.rate && (
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold">
              {item.rate.summary?.price?.total || "Price on request"}
            </span>
            {item.rate.summary?.price?.unit && (
              <span className="text-sm text-[var(--color-muted)]">
                {item.rate.summary.price.unit}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
