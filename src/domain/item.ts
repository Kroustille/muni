import { z } from "zod";

export const ITEM_TYPES = ["shopping", "book", "movie", "recipe"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

const STATUSES = {
  shopping: [],
  book: ["to_read", "reading", "read"],
  movie: ["to_watch", "watched"],
  recipe: [],
} as const satisfies Record<ItemType, readonly string[]>;

export type BookStatus = (typeof STATUSES.book)[number];
export type MovieStatus = (typeof STATUSES.movie)[number];
export type ItemStatus = BookStatus | MovieStatus;

export function statusesFor(type: ItemType): readonly string[] {
  return STATUSES[type];
}

export function defaultStatus(type: ItemType): ItemStatus | null {
  return (STATUSES[type][0] as ItemStatus | undefined) ?? null;
}

export type Ingredient = { quantity: string; name: string };

export type Item = {
  id: string;
  type: ItemType;
  title: string;
  createdAt: string;
  author: string | null;
  status: ItemStatus | null;
  recommendedBy: string | null;
  rating: number | null;
  notes: string | null;
  quantity: string | null;
  checked: boolean;
  ingredients: Ingredient[] | null;
  steps: string[] | null;
  deletedAt: string | null;
};

const FIELDS_BY_TYPE: Record<ItemType, readonly (keyof Item)[]> = {
  shopping: ["quantity", "checked"],
  book: ["author", "status", "recommendedBy", "rating", "notes"],
  movie: ["status", "recommendedBy", "rating", "notes"],
  recipe: ["notes", "ingredients", "steps"],
};

const TYPE_SPECIFIC_FIELDS = [
  "author",
  "status",
  "recommendedBy",
  "rating",
  "notes",
  "quantity",
  "ingredients",
  "steps",
] as const satisfies readonly (keyof Item)[];

const timestamp = z.iso.datetime({ offset: true });
const text = z.string().nullable();

const itemShape = {
  id: z.uuid(),
  type: z.enum(ITEM_TYPES),
  title: z.string().trim().min(1),
  createdAt: timestamp,
  author: text,
  status: z.string().nullable(),
  recommendedBy: text,
  rating: z.number().int().min(1).max(5).nullable(),
  notes: text,
  quantity: text,
  checked: z.boolean(),
  ingredients: z.array(z.strictObject({ quantity: z.string(), name: z.string() })).nullable(),
  steps: z.array(z.string()).nullable(),
  deletedAt: timestamp.nullable(),
};

function checkCrossType(value: Item, ctx: z.RefinementCtx, path: (f: string) => string): void {
  const allowed = FIELDS_BY_TYPE[value.type];
  for (const field of TYPE_SPECIFIC_FIELDS) {
    if (!allowed.includes(field) && value[field] !== null) {
      ctx.addIssue({
        code: "custom",
        path: [path(field)],
        message: `${field} must be null for type ${value.type}`,
      });
    }
  }
  if (value.type !== "shopping" && value.checked) {
    ctx.addIssue({
      code: "custom",
      path: [path("checked")],
      message: "checked must be false outside shopping",
    });
  }
  if (value.status !== null && !statusesFor(value.type).includes(value.status)) {
    ctx.addIssue({
      code: "custom",
      path: [path("status")],
      message: `invalid status for type ${value.type}`,
    });
  }
}

const itemSchema = z
  .strictObject(itemShape)
  .superRefine((value, ctx) => checkCrossType(value as Item, ctx, (f) => f));

const SNAKE: Partial<Record<keyof Item, string>> = {
  createdAt: "created_at",
  recommendedBy: "recommended_by",
  deletedAt: "deleted_at",
};

const snakeOf = (field: string): string => SNAKE[field as keyof Item] ?? field;

export const itemWireSchema = z
  .strictObject({
    id: itemShape.id,
    type: itemShape.type,
    title: itemShape.title,
    created_at: itemShape.createdAt,
    author: itemShape.author,
    status: itemShape.status,
    recommended_by: itemShape.recommendedBy,
    rating: itemShape.rating,
    notes: itemShape.notes,
    quantity: itemShape.quantity,
    checked: itemShape.checked,
    ingredients: itemShape.ingredients,
    steps: itemShape.steps,
    deleted_at: itemShape.deletedAt,
    fields_updated_at: z.record(z.string(), z.string()),
    server_updated_at: timestamp.nullable(),
  })
  .superRefine((wire, ctx) =>
    checkCrossType(
      {
        ...wire,
        createdAt: wire.created_at,
        recommendedBy: wire.recommended_by,
        deletedAt: wire.deleted_at,
      } as Item,
      ctx,
      snakeOf,
    ),
  );

export type ItemWire = z.infer<typeof itemWireSchema>;

export type NewItemInput = {
  id: string;
  type: ItemType;
  title: string;
  createdAt: string;
} & Partial<
  Pick<
    Item,
    | "author"
    | "status"
    | "recommendedBy"
    | "rating"
    | "notes"
    | "quantity"
    | "checked"
    | "ingredients"
    | "steps"
  >
>;

export type ItemPatch = Partial<Omit<Item, "id" | "type" | "createdAt">>;

export function newItem(input: NewItemInput): Item {
  const candidate: Item = {
    id: input.id,
    type: input.type,
    title: input.title,
    createdAt: input.createdAt,
    author: input.author ?? null,
    status: input.status ?? defaultStatus(input.type),
    recommendedBy: input.recommendedBy ?? null,
    rating: input.rating ?? null,
    notes: input.notes ?? null,
    quantity: input.quantity ?? null,
    checked: input.checked ?? false,
    ingredients: input.ingredients ?? null,
    steps: input.steps ?? null,
    deletedAt: null,
  };
  return itemSchema.parse(candidate) as Item;
}

export function updateItem(item: Item, patch: ItemPatch): Item {
  const immutable = ["id", "type", "createdAt"] as const;
  for (const key of immutable) {
    const value = (patch as Record<string, unknown>)[key];
    if (value !== undefined && value !== item[key]) {
      throw new Error(`${key} is immutable`);
    }
  }
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
  return itemSchema.parse({ ...item, ...defined }) as Item;
}
