import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { CartItem, OrderItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  removeItem: (itemId: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  canCheckout: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const DELIVERY_FEE = 30; // ₹30 delivery fee
const CART_STORAGE_KEY = "sparkur-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse saved cart:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((currentItems) => {
      // Check if we're adding from a different restaurant
      const existingRestaurantId = currentItems.length > 0 ? currentItems[0].restaurant_id : null;
      
      if (existingRestaurantId && existingRestaurantId !== item.restaurant_id) {
        toast({
          title: "Can't mix restaurants",
          description: "Your cart contains items from a different restaurant. Clear your cart first.",
          variant: "destructive",
        });
        return currentItems;
      }
      
      // Check if item already exists in cart
      const existingItem = currentItems.find((i) => i.id === item.id);
      
      if (existingItem) {
        // Update quantity if item exists
        return currentItems.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Add new item
        toast({
          title: "Added to cart",
          description: `${item.name} has been added to your cart.`,
        });
        return [...currentItems, item];
      }
    });
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (itemId: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart.",
    });
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);
  
  const canCheckout = items.length > 0;

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    subtotal,
    deliveryFee: items.length > 0 ? DELIVERY_FEE : 0,
    total,
    canCheckout,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
