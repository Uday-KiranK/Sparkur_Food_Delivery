import { useCart } from "@/hooks/use-cart";
import { Link } from "wouter";

interface CartDropdownProps {
  onClose: () => void;
}

const CartDropdown = ({ onClose }: CartDropdownProps) => {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    subtotal,
    deliveryFee,
    total,
    canCheckout
  } = useCart();

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-30">
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-3">Your Cart</h3>
        
        {items.length === 0 ? (
          <div className="text-center py-6">
            <i className="bi bi-cart-x text-3xl text-gray-400 mb-2"></i>
            <p className="text-[#686b78]">Your cart is empty</p>
            <p className="text-sm text-[#93959f] mt-1">Add items to get started</p>
          </div>
        ) : (
          <>
            <div className="border-b pb-4 mb-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-[#686b78]">{item.restaurant_name}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex border rounded overflow-hidden">
                      <button 
                        className="px-2 text-[#686b78] bg-gray-100"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="px-3 py-1">{item.quantity}</span>
                      <button 
                        className="px-2 text-[#FC8019] bg-gray-100"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="font-medium">₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
            
            <Link href="/checkout">
              <button 
                className="w-full bg-[#FC8019] text-white py-2 rounded-md hover:bg-[#e67016] transition-colors"
                disabled={!canCheckout}
              >
                Checkout
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDropdown;
