import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/use-auth";
import { Order, OrderStatus, UserRole } from "@shared/schema";
import { useLocation } from "wouter";

const ProfilePage = () => {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");

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
                  <h2 className="text-xl font-bold mb-6">My Profile</h2>
                  
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
                    
                    <div className="pt-4">
                      <button className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors">
                        Edit Profile
                      </button>
                    </div>
                  </div>
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
                        const orderItems = JSON.parse(order.items as unknown as string);
                        return (
                          <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-lg font-bold">Order #{order.id}</p>
                                <p className="text-sm text-[#686b78]">{formatDate(order.order_time.toString())}</p>
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
                            
                            {/* Order actions based on status */}
                            {order.status === OrderStatus.PENDING && (
                              <div className="mt-4">
                                <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                                  Cancel Order
                                </button>
                              </div>
                            )}
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
