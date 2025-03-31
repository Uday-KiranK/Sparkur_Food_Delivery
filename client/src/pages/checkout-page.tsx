import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";

const checkoutSchema = z.object({
  delivery_address: z.string().min(5, "Please enter a complete delivery address"),
  special_instructions: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Redirect non-customer users away from checkout
  useEffect(() => {
    if (user && user.role !== UserRole.CUSTOMER) {
      toast({
        title: "Access Denied",
        description: "Only customers can place orders.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      delivery_address: user?.address || "",
      special_instructions: "",
    },
  });

  const placeMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: (data) => {
      clearCart();
      toast({
        title: "Order placed successfully!",
        description: `Your order #${data.id} has been placed and will be delivered soon.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      navigate("/profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    },
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <i className="bi bi-cart-x text-5xl text-gray-400 mb-4"></i>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-[#686b78] mb-4">Add some delicious food from our restaurants.</p>
            <button 
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
            >
              Browse Restaurants
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const onSubmit = (data: CheckoutFormData) => {
    // Check if user is logged in and is a customer
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to log in as a customer to place an order.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (user.role !== UserRole.CUSTOMER) {
      toast({
        title: "Access Denied",
        description: "Only customers can place orders.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessingPayment(true);
    
    // For now, simulate payment processing
    setTimeout(() => {
      // Extract relevant information from the first item
      const { restaurant_id } = items[0];
      
      // Create order payload
      const orderPayload = {
        restaurant_id,
        items: JSON.stringify(items),
        total_amount: total,
        delivery_address: data.delivery_address,
        special_instructions: data.special_instructions || "",
      };
      
      placeMutation.mutate(orderPayload);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow bg-[#f2f2f2] py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Order Details */}
            <div className="md:w-2/3">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-bold mb-4">Order Details</h2>
                
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-0">
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-[#f2f2f2] rounded-md flex items-center justify-center mr-3 text-sm">
                        {item.quantity}
                      </span>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-[#686b78]">{item.restaurant_name}</p>
                      </div>
                    </div>
                    <p className="font-medium">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              
              {/* Delivery Form */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">Delivery Information</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address*
                    </label>
                    <textarea
                      {...register("delivery_address")}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Enter your full delivery address"
                    ></textarea>
                    {errors.delivery_address && (
                      <p className="text-red-500 text-xs mt-1">{errors.delivery_address.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions (optional)
                    </label>
                    <textarea
                      {...register("special_instructions")}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Any special instructions for the delivery partner or restaurant"
                    ></textarea>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-[#FC8019] text-white py-3 rounded-md hover:bg-[#e67016] transition-colors flex items-center justify-center"
                      disabled={isProcessingPayment || placeMutation.isPending}
                    >
                      {(isProcessingPayment || placeMutation.isPending) ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          {isProcessingPayment ? "Processing Payment..." : "Placing Order..."}
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="md:w-1/3">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-[#686b78]">Items Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#686b78]">Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#686b78]">Taxes and Charges</span>
                    <span>₹{Math.round(subtotal * 0.05)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{total + Math.round(subtotal * 0.05)}</span>
                  </div>
                </div>
                
                <div className="bg-[#f2f6fc] p-3 rounded-lg border border-[#e9f0fa] mb-4">
                  <div className="flex items-start">
                    <i className="bi bi-info-circle text-[#3d82e2] mr-2 mt-1"></i>
                    <p className="text-sm text-[#3d4152]">
                      Your order will be prepared as soon as the restaurant receives it. 
                      Estimated delivery time: {items[0]?.restaurant_id ? "30-45 minutes" : "Processing"}
                    </p>
                  </div>
                </div>
                
                <div className="bg-[#fef8ec] p-3 rounded-lg border border-[#faeccc]">
                  <div className="flex items-center">
                    <i className="bi bi-credit-card text-[#FC8019] mr-2"></i>
                    <p className="text-sm font-medium">Cash on Delivery Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CheckoutPage;
