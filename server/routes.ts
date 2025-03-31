import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { UserRole, OrderStatus, insertOrderSchema, insertRestaurantSchema, insertMenuItemSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes
  setupAuth(app);
  
  // User routes
  app.patch("/api/user/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = Number(req.params.id);
      
      // Users can only update their own profile
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Restaurant routes
  app.get("/api/restaurants", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        veg: req.query.veg === "true" ? true : undefined,
        rating: req.query.rating ? Number(req.query.rating) : undefined,
        search: req.query.search as string | undefined
      };
      
      // If admin parameter is set to true, return only restaurants owned by this admin
      const adminOnly = req.query.admin === 'true';
      
      if (adminOnly && req.isAuthenticated() && req.user.role === UserRole.RESTAURANT_ADMIN) {
        console.log("Fetching restaurants for admin:", req.user.id);
        const restaurants = await storage.getRestaurantsByAdmin(req.user.id);
        return res.json(restaurants);
      }
      
      const restaurants = await storage.getRestaurants(filters);
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/featured", async (req, res) => {
    try {
      const featuredRestaurants = await storage.getFeaturedRestaurants();
      res.json(featuredRestaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured restaurants" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(Number(req.params.id));
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post("/api/restaurants", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== UserRole.RESTAURANT_ADMIN) {
        return res.status(403).json({ message: "Only restaurant admins can create restaurants" });
      }

      const restaurantData = insertRestaurantSchema.parse({
        ...req.body,
        admin_id: req.user.id
      });
      
      const restaurant = await storage.createRestaurant(restaurantData);
      res.status(201).json(restaurant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid restaurant data", errors: error.format() });
      }
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  app.put("/api/restaurants/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== UserRole.RESTAURANT_ADMIN) {
        return res.status(403).json({ message: "Only restaurant admins can update restaurants" });
      }

      const restaurant = await storage.getRestaurant(Number(req.params.id));
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      if (restaurant.admin_id !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own restaurants" });
      }

      const updatedRestaurant = await storage.updateRestaurant(
        Number(req.params.id),
        req.body
      );
      
      res.json(updatedRestaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });

  // Menu routes
  app.get("/api/restaurants/:id/menu", async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems(Number(req.params.id));
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post("/api/restaurants/:id/menu", async (req, res) => {
    try {
      console.log("Adding menu item to restaurant:", req.params.id);
      console.log("Request body:", req.body);
      
      if (!req.isAuthenticated() || req.user.role !== UserRole.RESTAURANT_ADMIN) {
        console.log("Auth error - User:", req.user);
        return res.status(403).json({ message: "Only restaurant admins can add menu items" });
      }

      const restaurant = await storage.getRestaurant(Number(req.params.id));
      if (!restaurant) {
        console.log("Restaurant not found:", req.params.id);
        return res.status(404).json({ message: "Restaurant not found" });
      }

      if (restaurant.admin_id !== req.user.id) {
        console.log("Restaurant admin mismatch. Restaurant admin:", restaurant.admin_id, "User:", req.user.id);
        return res.status(403).json({ message: "You can only add items to your own restaurants" });
      }

      console.log("Parsing menu item data");
      const menuItemData = insertMenuItemSchema.parse({
        ...req.body,
        restaurant_id: Number(req.params.id)
      });
      
      console.log("Creating menu item:", menuItemData);
      const menuItem = await storage.createMenuItem(menuItemData);
      console.log("Menu item created:", menuItem);
      res.status(201).json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid menu item data", errors: error.format() });
      }
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  app.put("/api/menu-items/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== UserRole.RESTAURANT_ADMIN) {
        return res.status(403).json({ message: "Only restaurant admins can update menu items" });
      }

      const menuItem = await storage.getMenuItem(Number(req.params.id));
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      const restaurant = await storage.getRestaurant(menuItem.restaurant_id);
      if (!restaurant || restaurant.admin_id !== req.user.id) {
        return res.status(403).json({ message: "You can only update items in your own restaurants" });
      }

      const updatedMenuItem = await storage.updateMenuItem(
        Number(req.params.id),
        req.body
      );
      
      res.json(updatedMenuItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== UserRole.RESTAURANT_ADMIN) {
        return res.status(403).json({ message: "Only restaurant admins can delete menu items" });
      }

      const menuItem = await storage.getMenuItem(Number(req.params.id));
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      const restaurant = await storage.getRestaurant(menuItem.restaurant_id);
      if (!restaurant || restaurant.admin_id !== req.user.id) {
        return res.status(403).json({ message: "You can only delete items in your own restaurants" });
      }

      await storage.deleteMenuItem(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Category routes
  app.get("/api/restaurants/:id/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories(Number(req.params.id));
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/restaurants/:id/categories", async (req, res) => {
    try {
      console.log("Adding category to restaurant:", req.params.id);
      console.log("Request body:", req.body);
      
      if (!req.isAuthenticated() || req.user.role !== UserRole.RESTAURANT_ADMIN) {
        console.log("Auth error - User:", req.user);
        return res.status(403).json({ message: "Only restaurant admins can add categories" });
      }

      const restaurant = await storage.getRestaurant(Number(req.params.id));
      if (!restaurant) {
        console.log("Restaurant not found:", req.params.id);
        return res.status(404).json({ message: "Restaurant not found" });
      }

      if (restaurant.admin_id !== req.user.id) {
        console.log("Restaurant admin mismatch. Restaurant admin:", restaurant.admin_id, "User:", req.user.id);
        return res.status(403).json({ message: "You can only add categories to your own restaurants" });
      }

      console.log("Parsing category data");
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        restaurant_id: Number(req.params.id)
      });
      
      console.log("Creating category:", categoryData);
      const category = await storage.createCategory(categoryData);
      console.log("Category created:", category);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.format() });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let orders;
      if (req.user.role === UserRole.CUSTOMER) {
        orders = await storage.getUserOrders(req.user.id);
      } else if (req.user.role === UserRole.RESTAURANT_ADMIN) {
        // Get the restaurant ID from query parameters, if provided
        const restaurantId = req.query.restaurantId ? Number(req.query.restaurantId) : undefined;
        
        // Get all restaurants owned by this admin
        const restaurants = await storage.getRestaurantsByAdmin(req.user.id);
        if (restaurants.length === 0) {
          return res.json([]);
        }
        
        // If restaurant ID was provided and user owns it, get orders for that specific restaurant
        if (restaurantId && restaurants.some(r => r.id === restaurantId)) {
          orders = await storage.getRestaurantOrders(restaurantId);
        }
        // Otherwise, get orders for the first restaurant
        else {
          orders = await storage.getRestaurantOrders(restaurants[0].id);
        }
      } else if (req.user.role === UserRole.DELIVERY_PARTNER) {
        orders = await storage.getDeliveryPartnerOrders(req.user.id);
      } else {
        return res.status(403).json({ message: "Unknown user role" });
      }

      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const order = await storage.getOrder(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check authorization based on role
      if (req.user.role === UserRole.CUSTOMER && order.user_id !== req.user.id) {
        return res.status(403).json({ message: "You can only view your own orders" });
      } else if (req.user.role === UserRole.RESTAURANT_ADMIN) {
        const restaurant = await storage.getRestaurant(order.restaurant_id);
        if (!restaurant || restaurant.admin_id !== req.user.id) {
          return res.status(403).json({ message: "You can only view orders for your restaurants" });
        }
      } else if (req.user.role === UserRole.DELIVERY_PARTNER && 
                 order.delivery_partner_id !== req.user.id && 
                 order.status !== OrderStatus.READY_FOR_PICKUP) {
        return res.status(403).json({ message: "You can only view orders assigned to you or ready for pickup" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== UserRole.CUSTOMER) {
        return res.status(403).json({ message: "Only customers can place orders" });
      }

      const orderData = insertOrderSchema.parse({
        ...req.body,
        user_id: req.user.id,
        status: OrderStatus.PENDING
      });
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.format() });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { status } = req.body;
      if (!Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
      }

      const order = await storage.getOrder(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check authorization based on role and requested status change
      if (req.user.role === UserRole.CUSTOMER) {
        if (order.user_id !== req.user.id) {
          return res.status(403).json({ message: "You can only update your own orders" });
        }
        
        // Customers can only cancel their own orders
        if (status !== OrderStatus.CANCELLED) {
          return res.status(403).json({ message: "Customers can only cancel orders" });
        }
        
        // Can't cancel if already in progress
        if ([OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any)) {
          return res.status(400).json({ message: "Cannot cancel order that is already being delivered or delivered" });
        }
      } else if (req.user.role === UserRole.RESTAURANT_ADMIN) {
        const restaurant = await storage.getRestaurant(order.restaurant_id);
        if (!restaurant || restaurant.admin_id !== req.user.id) {
          return res.status(403).json({ message: "You can only update orders for your restaurants" });
        }
        
        // Restaurant admins can confirm, prepare, and mark orders as ready
        if (![OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP].includes(status as any)) {
          return res.status(403).json({ message: "Restaurant admins can only confirm, prepare, or mark orders as ready" });
        }
      } else if (req.user.role === UserRole.DELIVERY_PARTNER) {
        // Delivery partners can pick up orders that are ready or update orders assigned to them
        if (status === OrderStatus.OUT_FOR_DELIVERY) {
          if (order.status !== OrderStatus.READY_FOR_PICKUP) {
            return res.status(400).json({ message: "Can only pick up orders that are ready" });
          }
        } else if (status === OrderStatus.DELIVERED) {
          if (order.delivery_partner_id !== req.user.id) {
            return res.status(403).json({ message: "You can only mark your assigned orders as delivered" });
          }
          
          if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
            return res.status(400).json({ message: "Can only mark orders that are out for delivery as delivered" });
          }
        } else {
          return res.status(403).json({ message: "Delivery partners can only update to out for delivery or delivered" });
        }
      }

      // Handle delivery partner assignment when picking up an order
      let deliveryPartnerId = undefined;
      if (req.user.role === UserRole.DELIVERY_PARTNER && status === OrderStatus.OUT_FOR_DELIVERY) {
        deliveryPartnerId = req.user.id;
      } else if (status === OrderStatus.DELIVERED) {
        // Keep the existing delivery partner when marking as delivered
        deliveryPartnerId = order.delivery_partner_id;
      }

      const updatedOrder = await storage.updateOrderStatus(
        Number(req.params.id),
        status,
        deliveryPartnerId
      );
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Get all menu items (for search functionality)
  app.get("/api/menu-items", async (req, res) => {
    try {
      // Get all restaurants first
      const restaurants = await storage.getRestaurants();
      
      // Fetch menu items for each restaurant and flatten the array
      const menuItemPromises = restaurants.map(restaurant => 
        storage.getMenuItems(restaurant.id)
      );
      
      const menuItemsNested = await Promise.all(menuItemPromises);
      const menuItems = menuItemsNested.flat();
      
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  // Food categories
  app.get("/api/food-categories", async (req, res) => {
    try {
      const categories = await storage.getFoodCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food categories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
