import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types/roles
export const UserRole = {
  CUSTOMER: "customer",
  RESTAURANT_ADMIN: "restaurant_admin",
  DELIVERY_PARTNER: "delivery_partner",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Order status
export const OrderStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY_FOR_PICKUP: "ready_for_pickup",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  role: text("role").notNull().$type<UserRoleType>().default(UserRole.CUSTOMER),
  address: text("address"),
  created_at: timestamp("created_at").defaultNow(),
});

// Restaurants table
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  cuisine_types: text("cuisine_types").array().notNull(),
  image_url: text("image_url").notNull(),
  rating: real("rating").default(0),
  delivery_time: integer("delivery_time").notNull(), // minutes
  price_for_two: integer("price_for_two").notNull(), // in rupees
  admin_id: integer("admin_id").notNull().references(() => users.id),
  is_veg: boolean("is_veg").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Menu categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
});

// Menu items
export const menu_items = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in rupees
  image_url: text("image_url"),
  is_veg: boolean("is_veg").default(false),
  category_id: integer("category_id").references(() => categories.id),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
  is_available: boolean("is_available").default(true),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  restaurant_id: integer("restaurant_id").notNull().references(() => restaurants.id),
  items: jsonb("items").notNull(), // Array of menu items with quantities
  total_amount: integer("total_amount").notNull(),
  delivery_address: text("delivery_address").notNull(),
  status: text("status").notNull().$type<OrderStatusType>().default(OrderStatus.PENDING),
  delivery_partner_id: integer("delivery_partner_id").references(() => users.id),
  order_time: timestamp("order_time").defaultNow(),
  delivery_time: timestamp("delivery_time"),
  special_instructions: text("special_instructions"),
});

// Food categories (what's on your mind section)
export const food_categories = pgTable("food_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  image_url: text("image_url").notNull(),
});

// Schemas for validation and insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, created_at: true });
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true, created_at: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menu_items).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, order_time: true, delivery_time: true });
export const insertFoodCategorySchema = createInsertSchema(food_categories).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type MenuItem = typeof menu_items.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type FoodCategory = typeof food_categories.$inferSelect;
export type InsertFoodCategory = z.infer<typeof insertFoodCategorySchema>;

export type LoginData = Pick<InsertUser, "username" | "password">;

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  restaurant_id: number;
  restaurant_name: string;
}

export interface CartItem extends OrderItem {}
