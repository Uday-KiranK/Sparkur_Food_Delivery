import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, X, Plus } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/use-auth";
import { Restaurant, MenuItem, Category, UserRole, insertMenuItemSchema, insertCategorySchema } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Extend the schema with validation rules
const menuItemSchema = insertMenuItemSchema.extend({
  image_url: z.string().url("Please enter a valid URL").or(z.literal("")),
});

const categorySchema = insertCategorySchema.extend({});

type MenuItemForm = z.infer<typeof menuItemSchema>;
type CategoryForm = z.infer<typeof categorySchema>;

const MenuManagement = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Redirect if not a restaurant admin
  useEffect(() => {
    if (user && user.role !== UserRole.RESTAURANT_ADMIN) {
      navigate("/");
    }
  }, [user, navigate]);

  // Get restaurant ID from URL (if any)
  const urlParams = new URLSearchParams(window.location.search);
  const selectedRestaurantId = urlParams.get('restaurantId') ? Number(urlParams.get('restaurantId')) : undefined;

  // Fetch restaurant info - only those owned by this admin
  const { data: restaurants, isLoading: isRestaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants", "admin"],
    queryFn: async () => {
      const res = await fetch("/api/restaurants?admin=true");
      if (!res.ok) throw new Error("Failed to fetch restaurants");
      return res.json();
    },
    enabled: !!user && user.role === UserRole.RESTAURANT_ADMIN,
  });

  // Select the restaurant from URL param or first available
  const restaurant = selectedRestaurantId 
    ? restaurants?.find(r => r.id === selectedRestaurantId) 
    : restaurants?.[0];

  // Fetch menu categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: [`/api/restaurants/${restaurant?.id}/categories`],
    enabled: !!restaurant,
  });

  // Fetch menu items
  const { data: menuItems, isLoading: isMenuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: [`/api/restaurants/${restaurant?.id}/menu`],
    enabled: !!restaurant,
  });

  // Filter menu items by category
  const filteredMenuItems = selectedCategory
    ? menuItems?.filter((item) => item.category_id === selectedCategory)
    : menuItems;

  // Menu item form
  const {
    register: registerMenuItem,
    handleSubmit: handleSubmitMenuItem,
    formState: { errors: menuItemErrors },
    reset: resetMenuItem,
    setValue: setMenuItemValue,
  } = useForm<MenuItemForm>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      is_veg: true,
      is_available: true,
      image_url: "",
      category_id: undefined,
      restaurant_id: undefined,
    },
  });

  // Category form
  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    formState: { errors: categoryErrors },
    reset: resetCategory,
    setValue: setCategoryValue,
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      restaurant_id: undefined,
    },
  });
  
  // Update restaurant_id in forms when restaurant changes
  useEffect(() => {
    if (restaurant) {
      setMenuItemValue("restaurant_id", restaurant.id);
      setCategoryValue("restaurant_id", restaurant.id);
    }
  }, [restaurant, setMenuItemValue, setCategoryValue]);

  // Update form when editing an item
  useEffect(() => {
    if (editingItem) {
      setMenuItemValue("name", editingItem.name);
      setMenuItemValue("description", editingItem.description);
      setMenuItemValue("price", editingItem.price);
      setMenuItemValue("is_veg", editingItem.is_veg);
      setMenuItemValue("is_available", editingItem.is_available);
      setMenuItemValue("image_url", editingItem.image_url || "");
      setMenuItemValue("category_id", editingItem.category_id);
      setShowAddItem(true);
    }
  }, [editingItem, setMenuItemValue]);

  // Create menu item mutation
  const createMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemForm) => {
      if (!restaurant) throw new Error("No restaurant data available");
      console.log("Creating menu item with data:", data);
      const res = await apiRequest("POST", `/api/restaurants/${restaurant.id}/menu`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurant?.id}/menu`] });
      resetMenuItem();
      setShowAddItem(false);
    },
    onError: (error: Error) => {
      console.error("Menu item creation error:", error);
      toast({
        title: "Error",
        description: `Failed to add menu item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update menu item mutation
  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MenuItemForm> }) => {
      const res = await apiRequest("PUT", `/api/menu-items/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurant?.id}/menu`] });
      resetMenuItem();
      setShowAddItem(false);
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update menu item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/menu-items/${id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurant?.id}/menu`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete menu item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      if (!restaurant) throw new Error("No restaurant data available");
      const res = await apiRequest("POST", `/api/restaurants/${restaurant.id}/categories`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurant?.id}/categories`] });
      resetCategory();
      setShowAddCategory(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitMenuItem = (data: MenuItemForm) => {
    if (!restaurant) {
      toast({
        title: "Error",
        description: "No restaurant selected",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Submitting menu item, restaurant ID:", restaurant.id);
    
    // If editing, update the item
    if (editingItem) {
      updateMenuItemMutation.mutate({ id: editingItem.id, data });
    } else {
      // Create new item
      createMenuItemMutation.mutate({
        ...data,
        restaurant_id: restaurant.id,
      });
    }
  };

  const onSubmitCategory = (data: CategoryForm) => {
    if (!restaurant) {
      toast({
        title: "Error",
        description: "No restaurant selected",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Submitting category, restaurant ID:", restaurant.id);
    
    createCategoryMutation.mutate({
      ...data,
      restaurant_id: restaurant.id,
    });
  };

  const handleDeleteMenuItem = (id: number) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      deleteMenuItemMutation.mutate(id);
    }
  };

  if (isRestaurantsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FC8019]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow bg-[#f2f2f2] py-8">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <i className="bi bi-shop text-5xl text-gray-400 mb-4"></i>
              <h2 className="text-2xl font-bold mb-2">No Restaurant Found</h2>
              <p className="text-[#686b78] mb-4">You need to create a restaurant first.</p>
              <button
                onClick={() => navigate("/admin/restaurant")}
                className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
              >
                Go to Restaurant Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow bg-[#f2f2f2] py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Menu Management</h1>
                <p className="text-[#686b78]">{restaurant.name}</p>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
                  onClick={() => {
                    resetMenuItem();
                    setEditingItem(null);
                    setShowAddItem(!showAddItem);
                    setShowAddCategory(false);
                  }}
                >
                  {showAddItem ? "Cancel" : (
                    <>
                      <i className="bi bi-plus-lg mr-2"></i>
                      Add Menu Item
                    </>
                  )}
                </button>
                <button 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                  onClick={() => {
                    resetCategory();
                    setShowAddCategory(!showAddCategory);
                    setShowAddItem(false);
                  }}
                >
                  {showAddCategory ? "Cancel" : (
                    <>
                      <i className="bi bi-folder-plus mr-2"></i>
                      Add Category
                    </>
                  )}
                </button>
                <button 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                  onClick={() => navigate("/admin/restaurant")}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
          
          {/* Add Menu Item Form */}
          {showAddItem && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</h2>
              
              <form onSubmit={handleSubmitMenuItem(onSubmitMenuItem)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name*</label>
                    <input 
                      type="text"
                      {...registerMenuItem("name")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="e.g. Chicken Biryani"
                    />
                    {menuItemErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{menuItemErrors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)*</label>
                    <input 
                      type="number"
                      {...registerMenuItem("price", { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="e.g. 250"
                    />
                    {menuItemErrors.price && (
                      <p className="text-red-500 text-xs mt-1">{menuItemErrors.price.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                  <textarea 
                    {...registerMenuItem("description")}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                    placeholder="Describe your dish..."
                  ></textarea>
                  {menuItemErrors.description && (
                    <p className="text-red-500 text-xs mt-1">{menuItemErrors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                  <input 
                    type="text"
                    {...registerMenuItem("image_url")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                    placeholder="http://example.com/image.jpg"
                  />
                  {menuItemErrors.image_url && (
                    <p className="text-red-500 text-xs mt-1">{menuItemErrors.image_url.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    {...registerMenuItem("category_id", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                  >
                    <option value="">-- Select Category --</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      id="is_veg"
                      {...registerMenuItem("is_veg")}
                      className="h-4 w-4 text-[#FC8019] focus:ring-[#FC8019] border-gray-300 rounded"
                    />
                    <label htmlFor="is_veg" className="ml-2 block text-sm text-gray-700">
                      Vegetarian
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      id="is_available"
                      {...registerMenuItem("is_available")}
                      className="h-4 w-4 text-[#FC8019] focus:ring-[#FC8019] border-gray-300 rounded"
                    />
                    <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
                      Available
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors flex items-center"
                    disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending}
                  >
                    {(createMenuItemMutation.isPending || updateMenuItemMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {editingItem ? "Update Item" : "Add Item"}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Add Category Form */}
          {showAddCategory && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Add New Category</h2>
              
              <form onSubmit={handleSubmitCategory(onSubmitCategory)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name*</label>
                  <input 
                    type="text"
                    {...registerCategory("name")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                    placeholder="e.g. Starters, Main Course, Desserts"
                  />
                  {categoryErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{categoryErrors.name.message}</p>
                  )}
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors flex items-center"
                    disabled={createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Categories and Menu Items */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Categories Sidebar */}
            <div className="md:w-1/4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-bold mb-3">Categories</h2>
                
                {isCategoriesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-[#FC8019]" />
                  </div>
                ) : (
                  <div>
                    <button 
                      className={`w-full text-left py-2 px-3 rounded-md mb-1 ${selectedCategory === null ? "bg-[#fef0e6] text-[#FC8019]" : "hover:bg-gray-100"}`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Items
                    </button>
                    
                    {categories && categories.length > 0 ? (
                      categories.map((category) => (
                        <button 
                          key={category.id}
                          className={`w-full text-left py-2 px-3 rounded-md mb-1 ${selectedCategory === category.id ? "bg-[#fef0e6] text-[#FC8019]" : "hover:bg-gray-100"}`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {category.name}
                        </button>
                      ))
                    ) : (
                      <p className="text-[#686b78] text-sm py-2">
                        No categories found. Add a category to organize your menu.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="md:w-3/4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">
                  {selectedCategory 
                    ? `${categories?.find(c => c.id === selectedCategory)?.name} Items` 
                    : "All Menu Items"}
                </h2>
                
                {isMenuItemsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#FC8019]" />
                  </div>
                ) : filteredMenuItems && filteredMenuItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMenuItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex justify-between hover:border-[#FC8019] transition-colors">
                        <div>
                          <div className="flex items-center">
                            {item.is_veg ? (
                              <span className="w-4 h-4 border border-green-600 flex items-center justify-center mr-2">
                                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                              </span>
                            ) : (
                              <span className="w-4 h-4 border border-red-600 flex items-center justify-center mr-2">
                                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                              </span>
                            )}
                            <h3 className="font-bold">{item.name}</h3>
                          </div>
                          <p className="text-[#686b78] mb-1">₹{item.price}</p>
                          <p className="text-sm text-[#93959f] line-clamp-2">{item.description}</p>
                          
                          {!item.is_available && (
                            <span className="inline-block mt-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Not Available
                            </span>
                          )}
                        </div>
                        
                        <div className="ml-4 flex flex-col items-end">
                          {item.image_url && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden mb-2">
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            <button 
                              className="p-1 text-blue-600 hover:text-blue-800"
                              onClick={() => setEditingItem(item)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button 
                              className="p-1 text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteMenuItem(item.id)}
                              disabled={deleteMenuItemMutation.isPending}
                            >
                              {deleteMenuItemMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="bi bi-inboxes text-5xl text-gray-400 mb-4"></i>
                    <h3 className="text-xl font-bold mb-2">No Menu Items</h3>
                    <p className="text-[#686b78] mb-4">
                      {selectedCategory 
                        ? "No items in this category. Add some items to get started."
                        : "Your menu is empty. Add some delicious items to get started."}
                    </p>
                    <button 
                      className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
                      onClick={() => {
                        resetMenuItem();
                        setEditingItem(null);
                        setShowAddItem(true);
                        setShowAddCategory(false);
                      }}
                    >
                      <i className="bi bi-plus-lg mr-2"></i>
                      Add Menu Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default MenuManagement;
