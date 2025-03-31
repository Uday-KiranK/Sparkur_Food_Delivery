import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, PlusCircle } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Restaurant, Order, OrderStatus, UserRole } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AddRestaurantForm from "@/components/add-restaurant-form";
import RestaurantSelectorModal from "@/components/restaurant-selector-modal";

const updateRestaurantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  cuisine_types: z.string().min(3, "Cuisine types must be at least 3 characters"),
  price_for_two: z.number().min(1, "Price for two must be at least 1"),
  delivery_time: z.number().min(5, "Delivery time must be at least 5 minutes"),
  is_veg: z.boolean().default(false),
});

type UpdateRestaurantForm = z.infer<typeof updateRestaurantSchema>;

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"orders" | "info">("orders");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddRestaurantForm, setShowAddRestaurantForm] = useState(false);
  const [showRestaurantSelector, setShowRestaurantSelector] = useState(false);

  // Redirect if not a restaurant admin
  useEffect(() => {
    if (user && user.role !== UserRole.RESTAURANT_ADMIN) {
      navigate("/");
    }
  }, [user, navigate]);

  // Get restaurant ID from URL (if any)
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const selectedRestaurantId = urlParams.get('restaurantId') ? Number(urlParams.get('restaurantId')) : undefined;
  
  // Fetch restaurants owned by this admin
  const { data: restaurants, isLoading: isRestaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    enabled: !!user && user.role === UserRole.RESTAURANT_ADMIN,
  });

  // Select active restaurant (from URL param or first available)
  const [activeRestaurantId, setActiveRestaurantId] = useState<number | undefined>(selectedRestaurantId);
  
  useEffect(() => {
    // If we have restaurants but no active restaurant selected, select the first one
    if (restaurants?.length && !activeRestaurantId) {
      setActiveRestaurantId(restaurants[0].id);
    }
  }, [restaurants, activeRestaurantId]);
  
  const restaurant = restaurants?.find(r => r.id === activeRestaurantId);

  // Fetch restaurant orders - use the selected restaurant ID in query
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", activeRestaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/orders?restaurantId=${activeRestaurantId}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!restaurant && !!activeRestaurantId,
  });

  const restaurantForm = useForm<UpdateRestaurantForm>({
    resolver: zodResolver(updateRestaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      cuisine_types: "",
      price_for_two: 0,
      delivery_time: 0,
      is_veg: false,
    },
  });

  // Set form values when restaurant data is available
  useEffect(() => {
    if (restaurant) {
      restaurantForm.reset({
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        cuisine_types: restaurant.cuisine_types.join(", "),
        price_for_two: restaurant.price_for_two,
        delivery_time: restaurant.delivery_time,
        is_veg: restaurant.is_veg,
      });
    }
  }, [restaurant, restaurantForm]);

  // Update restaurant mutation
  const updateRestaurantMutation = useMutation({
    mutationFn: async (data: Partial<UpdateRestaurantForm>) => {
      if (!restaurant) throw new Error("No restaurant data available");
      const res = await apiRequest("PUT", `/api/restaurants/${restaurant.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Restaurant information updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update restaurant: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", activeRestaurantId] });
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitRestaurantInfo = (data: UpdateRestaurantForm) => {
    // Convert cuisine_types from string to array
    const cuisineTypesArray = data.cuisine_types.split(",").map(cuisine => cuisine.trim());
    
    updateRestaurantMutation.mutate({
      ...data,
      cuisine_types: cuisineTypesArray,
    });
  };

  // Filter orders by status
  const pendingOrders = orders?.filter(order => 
    [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status as any)
  ) || [];

  const preparingOrders = orders?.filter(order => 
    [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP].includes(order.status as any)
  ) || [];

  const completedOrders = orders?.filter(order => 
    [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status as any)
  ) || [];

  // Helper function to format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            {showAddRestaurantForm ? (
              <AddRestaurantForm 
                onSuccess={() => {
                  setShowAddRestaurantForm(false);
                  // Refresh the restaurants list
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                }} 
                onCancel={() => setShowAddRestaurantForm(false)} 
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <i className="bi bi-shop text-5xl text-gray-400 mb-4"></i>
                <h2 className="text-2xl font-bold mb-2">No Restaurant Found</h2>
                <p className="text-[#686b78] mb-4">You don't have a restaurant yet. Create one to get started.</p>
                <button 
                  className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
                  onClick={() => setShowAddRestaurantForm(true)}
                >
                  Create Restaurant
                </button>
              </div>
            )}
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
          {/* Restaurant selector modal */}
          {showRestaurantSelector && restaurants && (
            <RestaurantSelectorModal
              restaurants={restaurants}
              onSelect={(restaurantId) => {
                setShowRestaurantSelector(false);
                navigate(`/admin/menu?restaurantId=${restaurantId}`);
              }}
              onClose={() => setShowRestaurantSelector(false)}
            />
          )}
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                <p className="text-[#686b78]">{restaurant.address}</p>
                
                {/* Add restaurant selector when there are multiple restaurants */}
                {restaurants && restaurants.length > 1 && (
                  <div className="mt-2">
                    <Select onValueChange={(value) => setActiveRestaurantId(Number(value))}>
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Select restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap space-x-4">
                <button 
                  className={`px-4 py-2 rounded-md ${activeTab === "orders" ? "bg-[#FC8019] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                  onClick={() => setActiveTab("orders")}
                >
                  Manage Orders
                </button>
                <button 
                  className={`px-4 py-2 rounded-md ${activeTab === "info" ? "bg-[#FC8019] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                  onClick={() => setActiveTab("info")}
                >
                  Restaurant Info
                </button>
                <button 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                  onClick={() => {
                    // If there's only one restaurant, go directly to the menu page
                    if (restaurants && restaurants.length === 1) {
                      navigate(`/admin/menu?restaurantId=${restaurant.id}`);
                    } else {
                      // Otherwise, show the restaurant selector modal
                      setShowRestaurantSelector(true);
                    }
                  }}
                >
                  Menu Management
                </button>
                <button 
                  className="px-4 py-2 flex items-center space-x-1 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
                  onClick={() => setShowAddRestaurantForm(true)}
                >
                  <PlusCircle className="h-4 w-4" /> <span>Add Restaurant</span>
                </button>
              </div>
            </div>
          </div>
          
          {showAddRestaurantForm && (
            <div className="mb-6">
              <AddRestaurantForm 
                onSuccess={() => {
                  setShowAddRestaurantForm(false);
                  // Refresh the restaurants list
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                  toast({
                    title: "Success",
                    description: "Your new restaurant has been added successfully!",
                  });
                }} 
                onCancel={() => setShowAddRestaurantForm(false)} 
              />
            </div>
          )}

          {activeTab === "orders" ? (
            <>
              {selectedOrder ? (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Order #{selectedOrder.id} Details</h2>
                    <button 
                      className="text-[#686b78] hover:text-[#FC8019]"
                      onClick={() => setSelectedOrder(null)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-bold mb-2">Order Information</h3>
                      <p><span className="text-[#686b78]">Order Date:</span> {formatDate(selectedOrder.order_time.toString())}</p>
                      <p><span className="text-[#686b78]">Current Status:</span> {selectedOrder.status}</p>
                      <p><span className="text-[#686b78]">Delivery Address:</span> {selectedOrder.delivery_address}</p>
                      {selectedOrder.special_instructions && (
                        <p><span className="text-[#686b78]">Special Instructions:</span> {selectedOrder.special_instructions}</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-bold mb-2">Customer Information</h3>
                      <p><span className="text-[#686b78]">Customer ID:</span> {selectedOrder.user_id}</p>
                      {selectedOrder.delivery_partner_id && (
                        <p><span className="text-[#686b78]">Delivery Partner ID:</span> {selectedOrder.delivery_partner_id}</p>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-bold mb-2">Order Items</h3>
                  <div className="border rounded-md overflow-hidden mb-6">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-center">Quantity</th>
                          <th className="px-4 py-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let orderItems = [];
                          try {
                            orderItems = typeof selectedOrder.items === 'string' 
                              ? JSON.parse(selectedOrder.items) 
                              : selectedOrder.items || [];
                          } catch (error) {
                            console.error("Error parsing order items:", error);
                          }
                          return orderItems;
                        })().map((item: any) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">₹{item.price * item.quantity}</td>
                          </tr>
                        ))}
                        <tr className="border-t bg-gray-50 font-bold">
                          <td className="px-4 py-2" colSpan={2}>Total</td>
                          <td className="px-4 py-2 text-right">₹{selectedOrder.total_amount}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <h3 className="font-bold mb-2">Update Order Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === OrderStatus.PENDING && (
                      <button 
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        onClick={() => updateOrderStatusMutation.mutate({ 
                          orderId: selectedOrder.id, 
                          status: OrderStatus.CONFIRMED 
                        })}
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        {updateOrderStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : (
                          "Confirm Order"
                        )}
                      </button>
                    )}
                    
                    {selectedOrder.status === OrderStatus.CONFIRMED && (
                      <button 
                        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                        onClick={() => updateOrderStatusMutation.mutate({ 
                          orderId: selectedOrder.id, 
                          status: OrderStatus.PREPARING 
                        })}
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        {updateOrderStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : (
                          "Start Preparing"
                        )}
                      </button>
                    )}
                    
                    {selectedOrder.status === OrderStatus.PREPARING && (
                      <button 
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        onClick={() => updateOrderStatusMutation.mutate({ 
                          orderId: selectedOrder.id, 
                          status: OrderStatus.READY_FOR_PICKUP 
                        })}
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        {updateOrderStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : (
                          "Ready for Pickup"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Pending Orders */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span> New Orders
                    </h2>
                    
                    {isOrdersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FC8019]" />
                      </div>
                    ) : pendingOrders.length > 0 ? (
                      <div className="space-y-4">
                        {pendingOrders.map((order) => (
                          <div 
                            key={order.id} 
                            className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-[#FC8019] transition-colors"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-bold">Order #{order.id}</p>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{formatDate(order.order_time.toString())}</p>
                            <p className="text-sm font-medium">₹{order.total_amount}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#686b78]">
                        No new orders
                      </div>
                    )}
                  </div>
                  
                  {/* Preparing Orders */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span> Preparing
                    </h2>
                    
                    {isOrdersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FC8019]" />
                      </div>
                    ) : preparingOrders.length > 0 ? (
                      <div className="space-y-4">
                        {preparingOrders.map((order) => (
                          <div 
                            key={order.id} 
                            className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-[#FC8019] transition-colors"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-bold">Order #{order.id}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.status === OrderStatus.PREPARING 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-purple-100 text-purple-800"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{formatDate(order.order_time.toString())}</p>
                            <p className="text-sm font-medium">₹{order.total_amount}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#686b78]">
                        No orders in preparation
                      </div>
                    )}
                  </div>
                  
                  {/* Completed Orders */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Completed/Delivered
                    </h2>
                    
                    {isOrdersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FC8019]" />
                      </div>
                    ) : completedOrders.length > 0 ? (
                      <div className="space-y-4">
                        {completedOrders.slice(0, 5).map((order) => (
                          <div 
                            key={order.id} 
                            className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-[#FC8019] transition-colors"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-bold">Order #{order.id}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.status === OrderStatus.DELIVERED 
                                  ? "bg-green-100 text-green-800" 
                                  : order.status === OrderStatus.CANCELLED
                                    ? "bg-red-100 text-red-800"
                                    : "bg-orange-100 text-orange-800"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{formatDate(order.order_time.toString())}</p>
                            <p className="text-sm font-medium">₹{order.total_amount}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#686b78]">
                        No completed orders
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Restaurant Information</h2>
              
              <form onSubmit={restaurantForm.handleSubmit(onSubmitRestaurantInfo)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                    <input 
                      type="text"
                      {...restaurantForm.register("name")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                    />
                    {restaurantForm.formState.errors.name && (
                      <p className="text-red-500 text-xs mt-1">{restaurantForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                      type="text"
                      {...restaurantForm.register("phone")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                    />
                    {restaurantForm.formState.errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{restaurantForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input 
                    type="text"
                    {...restaurantForm.register("address")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                  />
                  {restaurantForm.formState.errors.address && (
                    <p className="text-red-500 text-xs mt-1">{restaurantForm.formState.errors.address.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    {...restaurantForm.register("description")}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                  ></textarea>
                  {restaurantForm.formState.errors.description && (
                    <p className="text-red-500 text-xs mt-1">{restaurantForm.formState.errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Types (comma separated)</label>
                  <input 
                    type="text"
                    {...restaurantForm.register("cuisine_types")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                  />
                  {restaurantForm.formState.errors.cuisine_types && (
                    <p className="text-red-500 text-xs mt-1">{restaurantForm.formState.errors.cuisine_types.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time (minutes)</label>
                    <input 
                      type="number"
                      {...restaurantForm.register("delivery_time", { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                    />
                    {restaurantForm.formState.errors.delivery_time && (
                      <p className="text-red-500 text-xs mt-1">{restaurantForm.formState.errors.delivery_time.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price for Two (₹)</label>
                    <input 
                      type="number"
                      {...restaurantForm.register("price_for_two", { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                    />
                    {restaurantForm.formState.errors.price_for_two && (
                      <p className="text-red-500 text-xs mt-1">{restaurantForm.formState.errors.price_for_two.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox"
                    id="is_veg"
                    {...restaurantForm.register("is_veg")}
                    className="h-4 w-4 text-[#FC8019] focus:ring-[#FC8019] border-gray-300 rounded"
                  />
                  <label htmlFor="is_veg" className="ml-2 block text-sm text-gray-700">
                    This is a pure vegetarian restaurant
                  </label>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors flex items-center"
                    disabled={updateRestaurantMutation.isPending}
                  >
                    {updateRestaurantMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Update Restaurant Information
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RestaurantDashboard;
