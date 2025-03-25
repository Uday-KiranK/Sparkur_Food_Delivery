import { db } from "./db";
import { users, restaurants, food_categories, categories, menu_items, UserRole } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  try {
    await db.delete(menu_items);
    await db.delete(categories);
    await db.delete(restaurants);
    await db.delete(food_categories);
    await db.delete(users);
    console.log('Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error);
  }

  // Create users with different roles
  const usersData = [
    {
      username: 'customer',
      password: await hashPassword('password123'),
      email: 'customer@example.com',
      phone: '9876543210',
      address: '123 Customer St, Customer City',
      role: UserRole.CUSTOMER,
    },
    {
      username: 'restaurant',
      password: await hashPassword('password123'),
      email: 'restaurant@example.com',
      phone: '8765432109',
      address: '456 Restaurant Ave, Food City',
      role: UserRole.RESTAURANT_ADMIN,
    },
    {
      username: 'delivery',
      password: await hashPassword('password123'),
      email: 'delivery@example.com',
      phone: '7654321098',
      address: '789 Delivery Blvd, Delivery Town',
      role: UserRole.DELIVERY_PARTNER,
    }
  ];

  const createdUsers = await db.insert(users).values(usersData).returning();
  console.log(`✅ Created ${createdUsers.length} users`);

  // Create food categories
  const foodCategoriesData = [
    { name: 'Pizza', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop' },
    { name: 'Burger', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop' },
    { name: 'Sushi', image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=300&auto=format&fit=crop' },
    { name: 'Chinese', image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=300&auto=format&fit=crop' },
    { name: 'Indian', image_url: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=300&auto=format&fit=crop' },
    { name: 'Italian', image_url: 'https://images.unsplash.com/photo-1601276861758-2d9c5ca69de2?q=80&w=300&auto=format&fit=crop' },
    { name: 'Dessert', image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=300&auto=format&fit=crop' },
    { name: 'Healthy', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop' }
  ];

  const createdFoodCategories = await db.insert(food_categories).values(foodCategoriesData).returning();
  console.log(`✅ Created ${createdFoodCategories.length} food categories`);

  // Create restaurants
  const restaurantAdmin = createdUsers.find(user => user.role === UserRole.RESTAURANT_ADMIN);
  if (!restaurantAdmin) {
    throw new Error('Restaurant admin user not found');
  }

  const restaurantsData = [
    {
      name: 'Pizza Palace',
      description: 'Authentic Italian pizzas with a variety of toppings. Our dough is freshly made daily and baked in a wood-fired oven.',
      admin_id: restaurantAdmin.id,
      address: '123 Pizza St, Food City',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=500&auto=format&fit=crop',
      cuisine_types: ['Italian', 'Pizza'],
      price_for_two: 500,
      delivery_time: 30,
      rating: 4.6,
      is_veg: false,
      featured: true,
      phone: '1234567890'
    },
    {
      name: 'Burger Boulevard',
      description: 'Juicy burgers with premium ingredients. We grind our beef daily and all our sauces are homemade.',
      admin_id: restaurantAdmin.id,
      address: '456 Burger Ave, Foodville',
      image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500&auto=format&fit=crop',
      cuisine_types: ['American', 'Burger'],
      price_for_two: 400,
      delivery_time: 25,
      rating: 4.3,
      is_veg: false,
      featured: true,
      phone: '2345678901'
    },
    {
      name: 'Sushi Symphony',
      description: 'Fresh and authentic Japanese sushi prepared by expert chefs. We use only the freshest ingredients.',
      admin_id: restaurantAdmin.id,
      address: '789 Sushi Lane, Oceanview',
      image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=500&auto=format&fit=crop',
      cuisine_types: ['Japanese', 'Sushi'],
      price_for_two: 800,
      delivery_time: 40,
      rating: 4.7,
      is_veg: false,
      featured: true,
      phone: '3456789012'
    },
    {
      name: 'Spice Garden',
      description: 'Authentic Indian cuisine with a modern twist. Our spices are imported directly from India.',
      admin_id: restaurantAdmin.id,
      address: '101 Spice Road, Flavourtown',
      image_url: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=500&auto=format&fit=crop',
      cuisine_types: ['Indian', 'Curry'],
      price_for_two: 600,
      delivery_time: 35,
      rating: 4.5,
      is_veg: true,
      featured: false,
      phone: '4567890123'
    },
    {
      name: 'Green Basket',
      description: 'Healthy and nutritious meals for the health-conscious. All our produce is locally sourced and organic.',
      admin_id: restaurantAdmin.id,
      address: '202 Green St, Healthville',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop',
      cuisine_types: ['Healthy', 'Salad'],
      price_for_two: 450,
      delivery_time: 20,
      rating: 4.2,
      is_veg: true,
      featured: false,
      phone: '5678901234'
    },
    {
      name: 'Dragon Wok',
      description: 'Authentic Chinese cuisine with recipes passed down through generations. We use traditional cooking techniques.',
      admin_id: restaurantAdmin.id,
      address: '303 Dragon Road, Chinatown',
      image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=500&auto=format&fit=crop',
      cuisine_types: ['Chinese', 'Asian'],
      price_for_two: 550,
      delivery_time: 30,
      rating: 4.4,
      is_veg: false,
      featured: false,
      phone: '6789012345'
    },
    {
      name: 'Sweet Tooth',
      description: 'Delicious desserts and pastries that will satisfy your sweet cravings. All our desserts are made fresh daily.',
      admin_id: restaurantAdmin.id,
      address: '404 Sweet Street, Dessertville',
      image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=500&auto=format&fit=crop',
      cuisine_types: ['Dessert', 'Bakery'],
      price_for_two: 300,
      delivery_time: 25,
      rating: 4.8,
      is_veg: true,
      featured: false,
      phone: '7890123456'
    },
    {
      name: 'Pasta Paradise',
      description: 'Authentic Italian pasta made with imported ingredients. Our pasta is handmade daily.',
      admin_id: restaurantAdmin.id,
      address: '505 Pasta Lane, Italytown',
      image_url: 'https://images.unsplash.com/photo-1601276861758-2d9c5ca69de2?q=80&w=500&auto=format&fit=crop',
      cuisine_types: ['Italian', 'Pasta'],
      price_for_two: 600,
      delivery_time: 35,
      rating: 4.6,
      is_veg: false,
      featured: false,
      phone: '8901234567'
    }
  ];

  const createdRestaurants = await db.insert(restaurants).values(restaurantsData).returning();
  console.log(`✅ Created ${createdRestaurants.length} restaurants`);

  // Create menu categories for each restaurant
  const categoriesData = [];
  for (const restaurant of createdRestaurants) {
    const restaurantCategoriesData = [
      { name: 'Starters', restaurant_id: restaurant.id },
      { name: 'Main Course', restaurant_id: restaurant.id },
      { name: 'Desserts', restaurant_id: restaurant.id },
      { name: 'Beverages', restaurant_id: restaurant.id },
    ];
    
    if (restaurant.name === 'Pizza Palace') {
      restaurantCategoriesData.push({ name: 'Specialty Pizzas', restaurant_id: restaurant.id });
    } else if (restaurant.name === 'Burger Boulevard') {
      restaurantCategoriesData.push({ name: 'Specialty Burgers', restaurant_id: restaurant.id });
    } else if (restaurant.name === 'Sushi Symphony') {
      restaurantCategoriesData.push({ name: 'Sushi Platters', restaurant_id: restaurant.id });
    }
    
    categoriesData.push(...restaurantCategoriesData);
  }

  const createdCategories = await db.insert(categories).values(categoriesData).returning();
  console.log(`✅ Created ${createdCategories.length} menu categories`);

  // Create menu items for each restaurant
  const menuItemsData = [];

  // Helper to find restaurant by name
  const findRestaurant = (name: string) => createdRestaurants.find(r => r.name === name);
  
  // Helper to find category by restaurant id and name
  const findCategory = (restaurantId: number, name: string) => 
    createdCategories.find(c => c.restaurant_id === restaurantId && c.name === name);

  // Pizza Palace menu items
  const pizzaPalace = findRestaurant('Pizza Palace');
  if (pizzaPalace) {
    const startersCategory = findCategory(pizzaPalace.id, 'Starters');
    const mainCourseCategory = findCategory(pizzaPalace.id, 'Main Course');
    const specialtyCategory = findCategory(pizzaPalace.id, 'Specialty Pizzas');
    const dessertsCategory = findCategory(pizzaPalace.id, 'Desserts');
    const beveragesCategory = findCategory(pizzaPalace.id, 'Beverages');

    if (startersCategory && mainCourseCategory && specialtyCategory && dessertsCategory && beveragesCategory) {
      menuItemsData.push(
        {
          name: 'Garlic Bread',
          description: 'Freshly baked bread with garlic butter and herbs',
          price: 150,
          is_veg: true,
          is_available: true,
          restaurant_id: pizzaPalace.id,
          category_id: startersCategory.id,
          image_url: 'https://images.unsplash.com/photo-1619683548505-f31c8e963a85?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Margherita Pizza',
          description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
          price: 350,
          is_veg: true,
          is_available: true,
          restaurant_id: pizzaPalace.id,
          category_id: mainCourseCategory.id,
          image_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Pepperoni Pizza',
          description: 'Pizza topped with pepperoni slices and mozzarella cheese',
          price: 400,
          is_veg: false,
          is_available: true,
          restaurant_id: pizzaPalace.id,
          category_id: mainCourseCategory.id,
          image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Truffle Mushroom Pizza',
          description: 'Specialty pizza with truffle oil, mushrooms, and arugula',
          price: 550,
          is_veg: true,
          is_available: true,
          restaurant_id: pizzaPalace.id,
          category_id: specialtyCategory.id,
          image_url: 'https://images.unsplash.com/photo-1589840700256-41c5d199f5d4?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Tiramisu',
          description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
          price: 250,
          is_veg: true,
          is_available: true,
          restaurant_id: pizzaPalace.id,
          category_id: dessertsCategory.id,
          image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Italian Soda',
          description: 'Refreshing soda with fruit syrup and cream',
          price: 120,
          is_veg: true,
          is_available: true,
          restaurant_id: pizzaPalace.id,
          category_id: beveragesCategory.id,
          image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=300&auto=format&fit=crop'
        }
      );
    }
  }

  // Burger Boulevard menu items
  const burgerBlvd = findRestaurant('Burger Boulevard');
  if (burgerBlvd) {
    const startersCategory = findCategory(burgerBlvd.id, 'Starters');
    const mainCourseCategory = findCategory(burgerBlvd.id, 'Main Course');
    const specialtyCategory = findCategory(burgerBlvd.id, 'Specialty Burgers');
    const dessertsCategory = findCategory(burgerBlvd.id, 'Desserts');
    const beveragesCategory = findCategory(burgerBlvd.id, 'Beverages');

    if (startersCategory && mainCourseCategory && specialtyCategory && dessertsCategory && beveragesCategory) {
      menuItemsData.push(
        {
          name: 'Loaded Fries',
          description: 'Crispy fries topped with cheese, bacon, and sour cream',
          price: 180,
          is_veg: false,
          is_available: true,
          restaurant_id: burgerBlvd.id,
          category_id: startersCategory.id,
          image_url: 'https://images.unsplash.com/photo-1606755456206-b25206cde27e?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Classic Cheeseburger',
          description: 'Beef patty with cheddar cheese, lettuce, tomato, and special sauce',
          price: 300,
          is_veg: false,
          is_available: true,
          restaurant_id: burgerBlvd.id,
          category_id: mainCourseCategory.id,
          image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Veggie Burger',
          description: 'Plant-based patty with avocado, lettuce, and tomato',
          price: 280,
          is_veg: true,
          is_available: true,
          restaurant_id: burgerBlvd.id,
          category_id: mainCourseCategory.id,
          image_url: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Double Trouble Burger',
          description: 'Two beef patties with bacon, cheese, and BBQ sauce',
          price: 450,
          is_veg: false,
          is_available: true,
          restaurant_id: burgerBlvd.id,
          category_id: specialtyCategory.id,
          image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Chocolate Milkshake',
          description: 'Thick and creamy chocolate milkshake topped with whipped cream',
          price: 180,
          is_veg: true,
          is_available: true,
          restaurant_id: burgerBlvd.id,
          category_id: beveragesCategory.id,
          image_url: 'https://images.unsplash.com/photo-1619158401201-8fa932695178?q=80&w=300&auto=format&fit=crop'
        }
      );
    }
  }

  // Sushi Symphony menu items
  const sushiSymphony = findRestaurant('Sushi Symphony');
  if (sushiSymphony) {
    const startersCategory = findCategory(sushiSymphony.id, 'Starters');
    const mainCourseCategory = findCategory(sushiSymphony.id, 'Main Course');
    const specialtyCategory = findCategory(sushiSymphony.id, 'Sushi Platters');
    const dessertsCategory = findCategory(sushiSymphony.id, 'Desserts');
    const beveragesCategory = findCategory(sushiSymphony.id, 'Beverages');

    if (startersCategory && mainCourseCategory && specialtyCategory && dessertsCategory && beveragesCategory) {
      menuItemsData.push(
        {
          name: 'Miso Soup',
          description: 'Traditional Japanese soup with tofu, seaweed, and green onions',
          price: 120,
          is_veg: true,
          is_available: true,
          restaurant_id: sushiSymphony.id,
          category_id: startersCategory.id,
          image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'California Roll',
          description: 'Crab, avocado, and cucumber roll with sesame seeds',
          price: 250,
          is_veg: false,
          is_available: true,
          restaurant_id: sushiSymphony.id,
          category_id: mainCourseCategory.id,
          image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Salmon Nigiri',
          description: 'Fresh salmon slices served on top of pressed vinegared rice',
          price: 300,
          is_veg: false,
          is_available: true,
          restaurant_id: sushiSymphony.id,
          category_id: mainCourseCategory.id,
          image_url: 'https://images.unsplash.com/photo-1648147526775-dce0f1e46047?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Deluxe Sushi Platter',
          description: 'Assortment of premium sushi including tuna, salmon, and eel',
          price: 850,
          is_veg: false,
          is_available: true,
          restaurant_id: sushiSymphony.id,
          category_id: specialtyCategory.id,
          image_url: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Green Tea Ice Cream',
          description: 'Traditional Japanese dessert with a unique green tea flavor',
          price: 180,
          is_veg: true,
          is_available: true,
          restaurant_id: sushiSymphony.id,
          category_id: dessertsCategory.id,
          image_url: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?q=80&w=300&auto=format&fit=crop'
        },
        {
          name: 'Sake',
          description: 'Traditional Japanese rice wine served warm',
          price: 350,
          is_veg: true,
          is_available: true,
          restaurant_id: sushiSymphony.id,
          category_id: beveragesCategory.id,
          image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=300&auto=format&fit=crop'
        }
      );
    }
  }

  // Add a few items for other restaurants
  for (const restaurant of createdRestaurants) {
    if (['Pizza Palace', 'Burger Boulevard', 'Sushi Symphony'].includes(restaurant.name)) {
      continue; // Skip restaurants we've already added items for
    }

    const startersCategory = findCategory(restaurant.id, 'Starters');
    const mainCourseCategory = findCategory(restaurant.id, 'Main Course');

    if (startersCategory && mainCourseCategory) {
      // Add generic items based on cuisine type
      const isVeg = restaurant.is_veg;
      const cuisineType = restaurant.cuisine_types[0];

      let starterName = 'Appetizer';
      let starterDesc = 'Delicious appetizer to start your meal';
      let starterPrice = 150;
      let starterImg = 'https://images.unsplash.com/photo-1541528906260-fca9c949e480?q=80&w=300&auto=format&fit=crop';

      let mainName = 'Main Dish';
      let mainDesc = 'Flavorful main course prepared by our expert chefs';
      let mainPrice = 350;
      let mainImg = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=300&auto=format&fit=crop';

      // Customize based on cuisine
      if (cuisineType === 'Indian') {
        starterName = 'Vegetable Samosa';
        starterDesc = 'Crispy pastry filled with spiced potatoes and peas';
        starterImg = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=300&auto=format&fit=crop';
        
        mainName = isVeg ? 'Paneer Butter Masala' : 'Butter Chicken';
        mainDesc = isVeg 
          ? 'Paneer cubes in a rich and creamy tomato sauce' 
          : 'Tender chicken in a rich and creamy tomato sauce';
        mainImg = isVeg 
          ? 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=300&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=300&auto=format&fit=crop';
      } else if (cuisineType === 'Chinese') {
        starterName = 'Spring Rolls';
        starterDesc = 'Crispy rolls filled with vegetables and served with sweet chili sauce';
        starterImg = 'https://images.unsplash.com/photo-1595436252086-7496fb8118bb?q=80&w=300&auto=format&fit=crop';
        
        mainName = isVeg ? 'Vegetable Fried Rice' : 'Kung Pao Chicken';
        mainDesc = isVeg 
          ? 'Stir-fried rice with mixed vegetables and soy sauce' 
          : 'Spicy stir-fried chicken with peanuts and vegetables';
        mainImg = isVeg 
          ? 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=300&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=300&auto=format&fit=crop';
      } else if (cuisineType === 'Healthy') {
        starterName = 'Fresh Salad';
        starterDesc = 'Mix of fresh vegetables with olive oil and balsamic dressing';
        starterImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop';
        
        mainName = 'Quinoa Bowl';
        mainDesc = 'Nutritious quinoa bowl with roasted vegetables and avocado';
        mainImg = 'https://images.unsplash.com/photo-1539136788836-5699e78bfc75?q=80&w=300&auto=format&fit=crop';
      } else if (cuisineType === 'Dessert') {
        starterName = 'Fresh Fruit Platter';
        starterDesc = 'Assortment of seasonal fresh fruits';
        starterImg = 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab2c?q=80&w=300&auto=format&fit=crop';
        
        mainName = 'Chocolate Cake';
        mainDesc = 'Rich chocolate cake with a molten center and vanilla ice cream';
        mainImg = 'https://images.unsplash.com/photo-1605807646983-377bc5a76493?q=80&w=300&auto=format&fit=crop';
      }
            
      menuItemsData.push(
        {
          name: starterName,
          description: starterDesc,
          price: starterPrice,
          is_veg: true,
          is_available: true,
          restaurant_id: restaurant.id,
          category_id: startersCategory.id,
          image_url: starterImg
        },
        {
          name: mainName,
          description: mainDesc,
          price: mainPrice,
          is_veg: isVeg,
          is_available: true,
          restaurant_id: restaurant.id,
          category_id: mainCourseCategory.id,
          image_url: mainImg
        }
      );
    }
  }

  const createdMenuItems = await db.insert(menu_items).values(menuItemsData).returning();
  console.log(`✅ Created ${createdMenuItems.length} menu items`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });