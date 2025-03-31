import { Restaurant } from "@shared/schema";
import { X } from "lucide-react";

interface RestaurantSelectorModalProps {
  restaurants: Restaurant[];
  onSelect: (restaurantId: number) => void;
  onClose: () => void;
}

const RestaurantSelectorModal = ({ restaurants, onSelect, onClose }: RestaurantSelectorModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Select Restaurant</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-4">Please select which restaurant's menu you would like to manage:</p>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {restaurants.map((restaurant) => (
              <div 
                key={restaurant.id}
                className="border border-gray-200 p-4 rounded-lg hover:border-[#FC8019] cursor-pointer transition-colors"
                onClick={() => onSelect(restaurant.id)}
              >
                <h3 className="font-bold">{restaurant.name}</h3>
                <p className="text-gray-600 text-sm">{restaurant.address}</p>
                <p className="text-sm">
                  <span className="text-[#FC8019] font-medium">{restaurant.cuisine_types.join(", ")}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSelectorModal;