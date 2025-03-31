import { users, restaurants, menu_items, orders, food_categories, categories, UserRole, OrderStatus } from "@shared/schema";
import { db } from "./db";
import { eq, like, and, inArray, or, desc, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { type User, type InsertUser, type Restaurant, type InsertRestaurant, 
  type MenuItem, type InsertMenuItem, type Category, type InsertCategory,
  type Order, type InsertOrder, type FoodCategory, type InsertFoodCategory } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<Omit<InsertUser, 'password' | 'role'>>): Promise<User | undefined>;
  
  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantsByAdmin(adminId: number): Promise<Restaurant[]>;
  getRestaurants(filters?: {category?: string, veg?: boolean, rating?: number}): Promise<Restaurant[]>;
  getFeaturedRestaurants(): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  
  // Menu operations
  getMenuItems(restaurantId: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  // Category operations
  getCategories(restaurantId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getRestaurantOrders(restaurantId: number): Promise<Order[]>;
  getDeliveryPartnerOrders(partnerId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: typeof OrderStatus[keyof typeof OrderStatus], deliveryPartnerId?: number): Promise<Order | undefined>;
  
  // Food categories
  getFoodCategories(): Promise<FoodCategory[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<Omit<InsertUser, 'password' | 'role'>>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantsByAdmin(adminId: number): Promise<Restaurant[]> {
    return await db.select().from(restaurants).where(eq(restaurants.admin_id, adminId));
  }

  async getRestaurants(filters?: {category?: string, veg?: boolean | undefined, rating?: number}): Promise<Restaurant[]> {
    let query = db.select().from(restaurants);
    
    if (filters) {
      // Only apply veg filter if it's explicitly true
      if (filters.veg === true) {
        query = query.where(eq(restaurants.is_veg, true));
      }
      
      // Only apply rating filter if it's provided
      if (filters.rating && filters.rating > 0) {
        query = query.where(restaurants.rating.gte(filters.rating));
      }
      
      // Apply category filter if provided
      if (filters.category) {
        // Convert to lowercase for case-insensitive matching
        const lowerCategory = filters.category.toLowerCase();
        
        // This is a simplification - in a real app, we'd use proper joins
        // Here we're checking if the category exists in the cuisine_types array
        // We're using string matching since the array is stored as text in SQLite/Postgres
        query = query.where(
          or(
            like(restaurants.cuisine_types.toString().toLowerCase(), `%${lowerCategory}%`),
            like(restaurants.cuisine_types.toString().toLowerCase(), `%"${lowerCategory}"%`)
          )
        );
      }
    }
    
    return await query.orderBy(desc(restaurants.rating));
  }

  async getFeaturedRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants).orderBy(desc(restaurants.rating)).limit(4);
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [createdRestaurant] = await db.insert(restaurants).values(restaurant).returning();
    return createdRestaurant;
  }

  async updateRestaurant(id: number, restaurantUpdate: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set(restaurantUpdate)
      .where(eq(restaurants.id, id))
      .returning();
    return updatedRestaurant;
  }

  // Menu operations
  async getMenuItems(restaurantId: number): Promise<MenuItem[]> {
    return await db.select().from(menu_items).where(eq(menu_items.restaurant_id, restaurantId));
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [menuItem] = await db.select().from(menu_items).where(eq(menu_items.id, id));
    return menuItem;
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const [createdMenuItem] = await db.insert(menu_items).values(menuItem).returning();
    return createdMenuItem;
  }

  async updateMenuItem(id: number, menuItemUpdate: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updatedMenuItem] = await db
      .update(menu_items)
      .set(menuItemUpdate)
      .where(eq(menu_items.id, id))
      .returning();
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menu_items).where(eq(menu_items.id, id)).returning();
    return result.length > 0;
  }

  // Category operations
  async getCategories(restaurantId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.restaurant_id, restaurantId));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [createdCategory] = await db.insert(categories).values(category).returning();
    return createdCategory;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.user_id, userId)).orderBy(desc(orders.order_time));
  }

  async getRestaurantOrders(restaurantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.restaurant_id, restaurantId)).orderBy(desc(orders.order_time));
  }

  async getDeliveryPartnerOrders(partnerId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(
        or(
          // Orders assigned to this delivery partner
          eq(orders.delivery_partner_id, partnerId),
          // Orders ready for pickup (that don't have a delivery partner assigned yet)
          and(
            eq(orders.status, OrderStatus.READY_FOR_PICKUP),
            isNull(orders.delivery_partner_id)
          )
        )
      )
      .orderBy(desc(orders.order_time));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [createdOrder] = await db.insert(orders).values(order).returning();
    return createdOrder;
  }

  async updateOrderStatus(id: number, status: typeof OrderStatus[keyof typeof OrderStatus], deliveryPartnerId?: number): Promise<Order | undefined> {
    const updateData: any = { status };
    
    if (deliveryPartnerId) {
      updateData.delivery_partner_id = deliveryPartnerId;
    }
    
    if (status === OrderStatus.DELIVERED) {
      updateData.delivery_time = new Date();
    }
    
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }

  // Food categories
  async getFoodCategories(): Promise<FoodCategory[]> {
    return await db.select().from(food_categories);
  }
}

export const storage = new DatabaseStorage();
