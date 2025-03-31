import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/use-auth";
import { Order, OrderStatus, UserRole, insertUserSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Profile form schema
const profileSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Set up form with react-hook-form
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) throw new Error("User not authenticated");
      const res = await apiRequest("PATCH", `/api/user/${user.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = form.handleSubmit((data) => {
    updateProfileMutation.mutate(data);
  });
  
  // Fetch user orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  if (!user) {
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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Helper function to get appropriate text for order status
  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: "Pending", color: "text-yellow-600" },
      confirmed: { text: "Confirmed", color: "text-blue-600" },
      preparing: { text: "Preparing", color: "text-blue-600" },
      ready_for_pickup: { text: "Ready for Pickup", color: "text-purple-600" },
      out_for_delivery: { text: "Out for Delivery", color: "text-orange-600" },
      delivered: { text: "Delivered", color: "text-green-600" },
      cancelled: { text: "Cancelled", color: "text-red-600" },
    };

    return statusMap[status] || { text: status, color: "text-gray-600" };
  };

  // Helper function to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow bg-[#f2f2f2] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="md:w-1/4">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-[#FC8019] rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-bold">{user.username}</h2>
                    <p className="text-[#686b78]">{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button 
                    className={`w-full text-left py-2 px-3 rounded-md ${activeTab === "profile" ? "bg-[#fef0e6] text-[#FC8019]" : "hover:bg-gray-100"}`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <i className="bi bi-person mr-2"></i>
                    Profile
                  </button>
                  <button 
                    className={`w-full text-left py-2 px-3 rounded-md ${activeTab === "orders" ? "bg-[#fef0e6] text-[#FC8019]" : "hover:bg-gray-100"}`}
                    onClick={() => setActiveTab("orders")}
                  >
                    <i className="bi bi-bag mr-2"></i>
                    Orders
                  </button>
                  
                  {/* Role-specific dashboards */}
                  {user.role === UserRole.RESTAURANT_ADMIN && (
                    <button 
                      className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                      onClick={() => navigate("/admin/restaurant")}
                    >
                      <i className="bi bi-shop mr-2"></i>
                      Restaurant Dashboard
                    </button>
                  )}
                  
                  {user.role === UserRole.DELIVERY_PARTNER && (
                    <button 
                      className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                      onClick={() => navigate("/delivery/dashboard")}
                    >
                      <i className="bi bi-bicycle mr-2"></i>
                      Delivery Dashboard
                    </button>
                  )}
                  
                  <button 
                    className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-red-600"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    ) : (
                      <i className="bi bi-box-arrow-right mr-2"></i>
                    )}
                    Logout
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="md:w-3/4">
              {activeTab === "profile" ? (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">My Profile</h2>
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                          disabled={updateProfileMutation.isPending}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          ) : null}
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="username" className="text-sm text-[#686b78] mb-1 block">Username</label>
                        <input
                          id="username"
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC8019]"
                          {...form.register("username")}
                        />
                        {form.formState.errors.username && (
                          <p className="text-sm text-red-500 mt-1">{form.formState.errors.username.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="text-sm text-[#686b78] mb-1 block">Email</label>
                        <input
                          id="email"
                          type="email"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC8019]"
                          {...form.register("email")}
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="text-sm text-[#686b78] mb-1 block">Phone</label>
                        <input
                          id="phone"
                          type="tel"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC8019]"
                          {...form.register("phone")}
                        />
                        {form.formState.errors.phone && (
                          <p className="text-sm text-red-500 mt-1">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="address" className="text-sm text-[#686b78] mb-1 block">Address</label>
                        <textarea
                          id="address"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC8019]"
                          rows={3}
                          {...form.register("address")}
                        />
                        {form.formState.errors.address && (
                          <p className="text-sm text-red-500 mt-1">{form.formState.errors.address.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm text-[#686b78] mb-1">Role</h3>
                        <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm text-[#686b78] mb-1">Username</h3>
                        <p className="font-medium">{user.username}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm text-[#686b78] mb-1">Email</h3>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm text-[#686b78] mb-1">Phone</h3>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm text-[#686b78] mb-1">Address</h3>
                        <p className="font-medium">{user.address || "No address provided"}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm text-[#686b78] mb-1">Role</h3>
                        <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-6">My Orders</h2>
                  
                  {isOrdersLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-[#FC8019]" />
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-6">
                      {orders.map((order) => {
                        const { text: statusText, color: statusColor } = getStatusText(order.status);
                        // Handle different types of order.items (string or already parsed object)
                        let orderItems = [];
                        try {
                          orderItems = typeof order.items === 'string' 
                            ? JSON.parse(order.items) 
                            : order.items || [];
                        } catch (error) {
                          console.error("Error parsing order items:", error);
                        }
                        return (
                          <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-lg font-bold">Order #{order.id}</p>
                                <p className="text-sm text-[#686b78]">{order.order_time ? formatDate(order.order_time.toString()) : "Processing"}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-sm ${statusColor} bg-opacity-10`}>
                                {statusText}
                              </span>
                            </div>
                            
                            <div className="border-t border-b py-3 mb-3">
                              {orderItems.map((item: any) => (
                                <div key={item.id} className="flex justify-between mb-2">
                                  <div className="flex">
                                    <span className="text-sm w-6 h-6 bg-[#f2f2f2] rounded-md flex items-center justify-center mr-2">
                                      {item.quantity}
                                    </span>
                                    <span>{item.name}</span>
                                  </div>
                                  <span>₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex justify-between text-sm mb-3">
                              <span className="text-[#686b78]">Delivery Address:</span>
                              <span className="text-right">{order.delivery_address}</span>
                            </div>
                            
                            {order.special_instructions && (
                              <div className="flex justify-between text-sm mb-3">
                                <span className="text-[#686b78]">Special Instructions:</span>
                                <span className="text-right">{order.special_instructions}</span>
                              </div>
                            )}
                            
                            <div className="flex justify-between font-bold">
                              <span>Total Amount:</span>
                              <span>₹{order.total_amount}</span>
                            </div>
                            
                            {/* No order actions available */}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <i className="bi bi-bag-x text-5xl text-gray-400 mb-4"></i>
                      <h3 className="text-xl font-bold mb-2">No orders yet</h3>
                      <p className="text-[#686b78] mb-4">You haven't placed any orders yet.</p>
                      <button 
                        onClick={() => navigate("/")}
                        className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
                      >
                        Browse Restaurants
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
