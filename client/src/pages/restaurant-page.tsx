import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Restaurant, MenuItem, Category } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

const RestaurantPage = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  // Fetch restaurant details
  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${id}`],
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not load restaurant details",
        variant: "destructive",
      });
      navigate("/");
    },
  });

  // Fetch restaurant categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: [`/api/restaurants/${id}/categories`],
    enabled: !!restaurant,
  });

  // Fetch menu items
  const { data: menuItems, isLoading: isMenuLoading } = useQuery<MenuItem[]>({
    queryKey: [`/api/restaurants/${id}/menu`],
    enabled: !!restaurant,
  });

  // Filter menu items by category
  const filteredMenuItems = activeCategory
    ? menuItems?.filter((item) => item.category_id === activeCategory)
    : menuItems;

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
    });
  };

  if (isRestaurantLoading) {
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
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Restaurant not found</h2>
            <p className="text-[#686b78] mb-4">The restaurant you're looking for doesn't exist.</p>
            <button 
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors"
            >
              Go Back Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow">
        {/* Restaurant Header */}
        <div className="bg-[#171a29] text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="w-64 h-40 rounded-lg overflow-hidden mb-4 md:mb-0 md:mr-8">
                <img 
                  src={restaurant.image_url} 
                  alt={restaurant.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                <p className="text-gray-300 mb-2">{restaurant.cuisine_types.join(', ')}</p>
                <p className="text-gray-300 mb-4">{restaurant.address}</p>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex flex-col items-center border-r border-gray-700 pr-4 last:border-0">
                    <div className="flex items-center bg-[#48c479] px-1 rounded">
                      <i className="bi bi-star-fill text-xs mr-1"></i>
                      <span>{restaurant.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs mt-1 text-gray-400">Ratings</span>
                  </div>
                  
                  <div className="flex flex-col items-center border-r border-gray-700 pr-4 last:border-0">
                    <span className="font-bold">{restaurant.delivery_time} mins</span>
                    <span className="text-xs mt-1 text-gray-400">Delivery Time</span>
                  </div>
                  
                  <div className="flex flex-col items-center last:border-0">
                    <span className="font-bold">₹{restaurant.price_for_two}</span>
                    <span className="text-xs mt-1 text-gray-400">Cost for two</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Restaurant Menu */}
        <div className="container mx-auto px-4 py-8">
          {/* Categories */}
          {!isCategoriesLoading && categories && categories.length > 0 && (
            <div className="mb-6 overflow-x-auto whitespace-nowrap pb-2">
              <div className="inline-flex space-x-3">
                <button 
                  className={`px-4 py-2 rounded-md ${activeCategory === null ? 'bg-[#FC8019] text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </button>
                
                {categories.map(category => (
                  <button 
                    key={category.id}
                    className={`px-4 py-2 rounded-md ${activeCategory === category.id ? 'bg-[#FC8019] text-white' : 'bg-gray-100'}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {isMenuLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-[#FC8019]" />
            </div>
          ) : filteredMenuItems && filteredMenuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenuItems.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex justify-between">
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
                    <p className="text-sm text-[#93959f]">{item.description}</p>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end">
                    {item.image_url && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden mb-2">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <button 
                      className="px-4 py-1 text-[#60b246] border border-[#d4d5d9] rounded-md hover:shadow-md transition-shadow text-sm uppercase font-medium"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.is_available}
                    >
                      {item.is_available ? 'Add' : 'Sold Out'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-xl font-bold mb-2">No menu items available</h3>
              <p className="text-[#686b78]">This restaurant has not added any items to their menu yet.</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RestaurantPage;
