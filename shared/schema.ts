import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const itemConditionEnum = pgEnum('item_condition', ['excellent', 'good', 'fair', 'poor']);
export const itemCategoryEnum = pgEnum('item_category', ['tops', 'dresses', 'bottoms', 'outerwear', 'shoes', 'accessories']);
export const swapStatusEnum = pgEnum('swap_status', ['pending', 'accepted', 'declined', 'completed']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  password: text("password"),
  googleId: text("google_id"),
  role: userRoleEnum("role").notNull().default('user'),
  points: integer("points").notNull().default(0),
  suspendedUntil: timestamp("suspended_until"),
  isBanned: boolean("is_banned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: itemCategoryEnum("category").notNull(),
  condition: itemConditionEnum("condition").notNull(),
  size: text("size").notNull(),
  value: integer("value").notNull(),
  imageUrls: text("image_urls").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  userId: integer("user_id").references(() => users.id).notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const swaps = pgTable("swaps", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  requesterItemId: integer("requester_item_id").references(() => items.id),
  ownerItemId: integer("owner_item_id").references(() => items.id).notNull(),
  pointsDifference: integer("points_difference").notNull().default(0),
  status: swapStatusEnum("status").notNull().default('pending'),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  requestedSwaps: many(swaps, { relationName: "requesterSwaps" }),
  receivedSwaps: many(swaps, { relationName: "ownerSwaps" }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  requesterSwaps: many(swaps, { relationName: "requesterItemSwaps" }),
  ownerSwaps: many(swaps, { relationName: "ownerItemSwaps" }),
}));

export const swapsRelations = relations(swaps, ({ one }) => ({
  requester: one(users, {
    fields: [swaps.requesterId],
    references: [users.id],
    relationName: "requesterSwaps",
  }),
  owner: one(users, {
    fields: [swaps.ownerId],
    references: [users.id],
    relationName: "ownerSwaps",
  }),
  requesterItem: one(items, {
    fields: [swaps.requesterItemId],
    references: [items.id],
    relationName: "requesterItemSwaps",
  }),
  ownerItem: one(items, {
    fields: [swaps.ownerItemId],
    references: [items.id],
    relationName: "ownerItemSwaps",
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  role: true,
  points: true,
}).extend({
  password: z.string().optional(),
  googleId: z.string().optional(),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  userId: true,
  isApproved: true,
  createdAt: true,
});

export const insertSwapSchema = createInsertSchema(swaps).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[+]?[\d\s\-\(\)]+$/, "Invalid phone number format"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertSwap = z.infer<typeof insertSwapSchema>;
export type Swap = typeof swaps.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
