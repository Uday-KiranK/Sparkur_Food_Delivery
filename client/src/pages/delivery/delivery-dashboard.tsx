import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { useAuth } from "@/hooks/use-auth";
import { Order, OrderStatus, UserRole } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Redirect if not a delivery partner
  useEffect(() => {
    if (user && user.role !== UserRole.DELIVERY_PARTNER) {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch delivery partner's orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user && user.role === UserRole.DELIVERY_PARTNER,
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
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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

  // Filter orders by status
  const availableOrders = orders?.filter(order => 
    order.status === OrderStatus.READY_FOR_PICKUP || 
    (order.delivery_partner_id === user?.id && 
     [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any))
  ) || [];

  // Get completed deliveries for earnings calculation
  const completedOrders = availableOrders.filter(
    order => order.status === OrderStatus.DELIVERED && order.delivery_partner_id === user?.id
  );

  // Helper function to format date
  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isOrdersLoading) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow bg-[#f2f2f2] py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
                <p className="text-[#686b78]">Welcome, {user?.username}</p>
              </div>
              
              <div className="flex items-center space-x-2 text-[#FC8019]">
                <i className="bi bi-bicycle text-2xl"></i>
                <span className="font-bold text-lg">Delivery Partner</span>
              </div>
            </div>
          </div>
          
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
                  <p><span className="text-[#686b78]">Order Date:</span> {formatDate(selectedOrder.order_time?.toString())}</p>
                  <p><span className="text-[#686b78]">Current Status:</span> {selectedOrder.status}</p>
                  <p><span className="text-[#686b78]">Delivery Address:</span> {selectedOrder.delivery_address}</p>
                  <p><span className="text-[#686b78]">Total Amount:</span> ₹{selectedOrder.total_amount}</p>
                  {selectedOrder.special_instructions && (
                    <p><span className="text-[#686b78]">Special Instructions:</span> {selectedOrder.special_instructions}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-bold mb-2">Restaurant Information</h3>
                  <p><span className="text-[#686b78]">Restaurant ID:</span> {selectedOrder.restaurant_id}</p>
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
                    {(typeof selectedOrder.items === 'string'
                      ? JSON.parse(selectedOrder.items)
                      : selectedOrder.items
                    ).map((item: any, index: number) => (
                      <tr key={index} className="border-t">
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
              
              <div className="space-y-4">
                <h3 className="font-bold">Update Delivery Status</h3>
                
                {selectedOrder.status === OrderStatus.READY_FOR_PICKUP && (
                  <button 
                    className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
                    onClick={() => updateOrderStatusMutation.mutate({ 
                      orderId: selectedOrder.id, 
                      status: OrderStatus.OUT_FOR_DELIVERY 
                    })}
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    {updateOrderStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    ) : null}
                    Accept Order & Start Delivery
                  </button>
                )}
                
                {selectedOrder.status === OrderStatus.OUT_FOR_DELIVERY && (
                  <button 
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    onClick={() => updateOrderStatusMutation.mutate({ 
                      orderId: selectedOrder.id, 
                      status: OrderStatus.DELIVERED 
                    })}
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    {updateOrderStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    ) : null}
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* My Deliveries */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <span className="w-3 h-3 bg-[#FC8019] rounded-full mr-2"></span> My Deliveries
                </h2>
                
                {isOrdersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#FC8019]" />
                  </div>
                ) : availableOrders.length > 0 ? (
                  <div className="space-y-4">
                    {availableOrders.map((order) => (
                      <div 
                        key={order.id} 
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-[#FC8019] transition-colors"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold">Order #{order.id}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === OrderStatus.READY_FOR_PICKUP 
                              ? "bg-green-100 text-green-800"
                              : order.status === OrderStatus.OUT_FOR_DELIVERY
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm mb-2 line-clamp-1">{order.delivery_address}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-[#686b78]">{formatDate(order.order_time?.toString())}</p>
                          <p className="text-sm font-medium">₹{order.total_amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#686b78]">
                    No orders available
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Earnings Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-lg font-bold mb-4">Earnings Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-[#686b78] mb-1">Today's Earnings</h3>
                <p className="text-2xl font-bold">₹{
                  completedOrders.filter(order => {
                    const today = new Date();
                    const deliveryDate = order.delivery_time ? new Date(order.delivery_time) : null;
                    return deliveryDate && deliveryDate.toDateString() === today.toDateString();
                  }).reduce((sum, order) => sum + Math.round(order.total_amount * 0.1), 0)
                }</p>
                <p className="text-sm text-[#686b78]">
                  {completedOrders.filter(order => {
                    const today = new Date();
                    const deliveryDate = order.delivery_time ? new Date(order.delivery_time) : null;
                    return deliveryDate && deliveryDate.toDateString() === today.toDateString();
                  }).length} Deliveries
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-[#686b78] mb-1">This Week</h3>
                <p className="text-2xl font-bold">₹{
                  completedOrders.filter(order => {
                    if (!order.delivery_time) return false;
                    const now = new Date();
                    const deliveryDate = new Date(order.delivery_time);
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    return deliveryDate >= weekStart;
                  }).reduce((sum, order) => sum + Math.round(order.total_amount * 0.1), 0)
                }</p>
                <p className="text-sm text-[#686b78]">
                  {completedOrders.filter(order => {
                    if (!order.delivery_time) return false;
                    const now = new Date();
                    const deliveryDate = new Date(order.delivery_time);
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    return deliveryDate >= weekStart;
                  }).length} Deliveries
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-[#686b78] mb-1">Total Earnings</h3>
                <p className="text-2xl font-bold">₹{
                  completedOrders.reduce((sum, order) => sum + Math.round(order.total_amount * 0.1), 0)
                }</p>
                <p className="text-sm text-[#686b78]">{completedOrders.length} Deliveries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default DeliveryDashboard;
