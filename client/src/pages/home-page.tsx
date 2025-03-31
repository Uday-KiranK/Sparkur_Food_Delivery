import { useQuery } from "@tanstack/react-query";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import RestaurantCard from "@/components/restaurant-card";
import CategoryCard from "@/components/category-card";
import { Restaurant, FoodCategory, MenuItem } from "@shared/schema";
import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2, Search, X } from "lucide-react";

const HomePage = () => {
  const [, navigate] = useLocation();
  const [filterRating, setFilterRating] = useState(false);
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{restaurants: Restaurant[], menuItems: MenuItem[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch featured restaurants
  const { data: featuredRestaurants, isLoading: isFeaturedLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants/featured"],
  });

  // Fetch food categories
  const { data: foodCategories, isLoading: isCategoriesLoading } = useQuery<FoodCategory[]>({
    queryKey: ["/api/food-categories"],
  });

  // Fetch all restaurants with filters
  const { data: allRestaurants, isLoading: isRestaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: [
      "/api/restaurants", 
      { veg: filterVeg, rating: filterRating ? 4.0 : undefined }
    ],
  });
  
  // Process restaurants for fast delivery filter
  const filteredRestaurants = useMemo(() => {
    if (!allRestaurants) return [];
    
    let restaurants = [...allRestaurants];
    
    // Apply fastest delivery filter if enabled
    if (filterFastDelivery) {
      restaurants = restaurants.sort((a, b) => {
        return (a.delivery_time || 30) - (b.delivery_time || 30);
      }).slice(0, 10); // Show only the 10 fastest restaurants
    }
    
    return restaurants;
  }, [allRestaurants, filterFastDelivery]);

  // Fetch all menu items for search
  const { data: allMenuItems } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    enabled: !!allRestaurants,
  });
  
  // Handle search functionality
  const handleSearch = () => {
    if (!searchQuery.trim() || !allRestaurants || !allMenuItems) return;
    
    setIsSearching(true);
    
    // Case-insensitive search
    const query = searchQuery.toLowerCase();
    
    // Filter restaurants by name and description
    const matchedRestaurants = allRestaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(query) || 
      (restaurant.description && restaurant.description.toLowerCase().includes(query))
    );
    
    // Filter menu items by name
    const matchedMenuItems = allMenuItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
    
    setSearchResults({
      restaurants: matchedRestaurants,
      menuItems: matchedMenuItems
    });
    
    setIsSearching(false);
    setShowSearchDropdown(true);
  };
  
  // Clear search results
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setShowSearchDropdown(false);
  };
  
  // Handle click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle menu item click to navigate to restaurant page
  const handleMenuItemClick = (menuItem: MenuItem) => {
    if (!allRestaurants) return;
    
    const restaurant = allRestaurants.find(r => r.id === menuItem.restaurant_id);
    if (restaurant) {
      navigate(`/restaurant/${restaurant.id}`);
      clearSearch();
    }
  };
  
  // Generate query params for filtered API calls
  const getFilterQueryParams = () => {
    let params = new URLSearchParams();
    if (filterVeg) params.append("veg", "true");
    if (filterRating) params.append("rating", "4.0");
    return params.toString();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Search Bar */}
      <div className="sticky top-0 z-50 bg-white shadow-md py-3 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="relative" ref={searchRef}>
            <div className="flex items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                  type="text" 
                  placeholder="Search for restaurants or food items..." 
                  className="px-4 py-2 pl-10 pr-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FC8019] w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={clearSearch}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <button 
                className="ml-2 bg-[#FC8019] text-white px-4 py-2 rounded-md font-medium hover:bg-[#e67016] transition-colors flex items-center justify-center"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchResults.restaurants.length === 0 && searchResults.menuItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <>
                    {searchResults.restaurants.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">Restaurants</div>
                        <div className="divide-y divide-gray-100">
                          {searchResults.restaurants.map(restaurant => (
                            <div 
                              key={restaurant.id} 
                              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
                              onClick={() => {
                                navigate(`/restaurant/${restaurant.id}`);
                                clearSearch();
                              }}
                            >
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                {restaurant.image_url ? (
                                  <img 
                                    src={restaurant.image_url} 
                                    alt={restaurant.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#FC8019] flex items-center justify-center text-white font-bold">
                                    {restaurant.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="font-medium">{restaurant.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-md">{restaurant.cuisine_types.join(", ")}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchResults.menuItems.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">Menu Items</div>
                        <div className="divide-y divide-gray-100">
                          {searchResults.menuItems.map(item => (
                            <div 
                              key={item.id} 
                              className="p-3 hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleMenuItemClick(item)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-500">₹{item.price}</div>
                                </div>
                                {item.image_url && (
                                  <div className="w-12 h-12 rounded-md overflow-hidden">
                                    <img 
                                      src={item.image_url} 
                                      alt={item.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#f2f2f2] to-[#fef2e8] py-10 md:py-16 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 text-[#3d4152]">
              <span className="text-[#FC8019]">Delicious</span> food, delivered fast
            </h1>
            <p className="text-[#686b78] mb-8 md:text-lg">Order from the best local restaurants with easy, on-demand delivery</p>
            <div className="flex flex-col sm:flex-row mb-4">
              <div className="relative flex-grow mb-3 sm:mb-0 sm:mr-3">
                <i className="bi bi-geo-alt absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Enter your delivery location" 
                  className="px-4 py-3 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FC8019] w-full shadow-sm"
                />
              </div>
              <button className="bg-[#FC8019] text-white px-8 py-3 rounded-md font-medium hover:bg-[#e67016] transition-colors shadow-md flex items-center justify-center">
                <i className="bi bi-search mr-2"></i>
                Find Food
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-white px-3 py-1 rounded-full text-sm text-[#686b78] shadow-sm">Bangalore</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-[#686b78] shadow-sm">Mumbai</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-[#686b78] shadow-sm">Delhi</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-[#686b78] shadow-sm">Chennai</span>
            </div>
          </div>
        </div>
        
        {/* Decorative food images */}
        <div className="hidden md:block absolute right-0 top-0 w-1/2 h-full">
          <div className="relative h-full w-full">
            {/* Food image collage */}
            <div className="absolute top-[10%] right-[15%] w-48 h-48 rounded-full bg-white p-2 shadow-lg transform rotate-6">
              <div className="w-full h-full rounded-full bg-cover bg-center" 
                   style={{backgroundImage: "url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=300&auto=format&fit=crop')"}}></div>
            </div>
            <div className="absolute top-[35%] right-[5%] w-32 h-32 rounded-full bg-white p-2 shadow-lg transform -rotate-3">
              <div className="w-full h-full rounded-full bg-cover bg-center" 
                   style={{backgroundImage: "url('https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop')"}}></div>
            </div>
            <div className="absolute top-[55%] right-[20%] w-40 h-40 rounded-full bg-white p-2 shadow-lg transform rotate-12">
              <div className="w-full h-full rounded-full bg-cover bg-center" 
                   style={{backgroundImage: "url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop')"}}></div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-[20%] right-[40%] w-12 h-12 bg-[#FC8019] rounded-full opacity-20"></div>
            <div className="absolute top-[60%] right-[40%] w-20 h-20 bg-[#FC8019] rounded-full opacity-10"></div>
            <div className="absolute top-[80%] right-[10%] w-16 h-16 bg-[#FC8019] rounded-full opacity-15"></div>
          </div>
        </div>
        
        {/* Mobile decoration */}
        <div className="md:hidden absolute bottom-0 right-0 w-full h-24 overflow-hidden">
          <div className="w-40 h-40 bg-[#FFDCB8] rounded-full absolute -bottom-20 -right-20 opacity-50"></div>
          <div className="w-24 h-24 bg-[#FC8019] rounded-full absolute -bottom-10 right-10 opacity-20"></div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Restaurants</h2>
            <div className="flex items-center space-x-2">
              <button className="border border-gray-300 rounded-full p-2 hover:bg-[#f2f2f2] transition-colors">
                <i className="bi bi-arrow-left"></i>
              </button>
              <button className="border border-gray-300 rounded-full p-2 hover:bg-[#f2f2f2] transition-colors">
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>

          {isFeaturedLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-[#FC8019]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredRestaurants?.map((restaurant) => (
                <RestaurantCard 
                  key={restaurant.id} 
                  restaurant={restaurant} 
                  featured={true} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Food Categories */}
      <section className="py-8 bg-[#f2f2f2]">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">What's on your mind?</h2>
          
          {isCategoriesLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#FC8019]" />
            </div>
          ) : (
            <div className="flex flex-wrap justify-between gap-4">
              {foodCategories?.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Restaurant List */}
      <section className="py-8 bg-white flex-grow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Restaurants near you</h2>
            <div className="hidden md:flex space-x-4">
              <button className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-[#f2f2f2] transition-colors flex items-center">
                <i className="bi bi-sliders mr-2"></i>
                Filter
              </button>
              <button 
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterRating ? 'bg-[#FC8019] text-white border-[#FC8019]' : 'border-gray-300 hover:bg-[#f2f2f2]'}`}
                onClick={() => setFilterRating(!filterRating)}
              >
                Rating: 4.0+
              </button>
              <button 
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterFastDelivery ? 'bg-[#FC8019] text-white border-[#FC8019]' : 'border-gray-300 hover:bg-[#f2f2f2]'}`}
                onClick={() => setFilterFastDelivery(!filterFastDelivery)}
              >
                Fastest Delivery
              </button>
              <button 
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterVeg ? 'bg-[#FC8019] text-white border-[#FC8019]' : 'border-gray-300 hover:bg-[#f2f2f2]'}`}
                onClick={() => setFilterVeg(!filterVeg)}
              >
                Pure Veg
              </button>
            </div>
          </div>

          {/* Filter for Mobile */}
          <div className="md:hidden overflow-x-auto whitespace-nowrap mb-4 pb-2">
            <div className="inline-flex space-x-3">
              <button className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-[#f2f2f2] transition-colors flex items-center">
                <i className="bi bi-sliders mr-2"></i>
                Filter
              </button>
              <button 
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterRating ? 'bg-[#FC8019] text-white border-[#FC8019]' : 'border-gray-300 hover:bg-[#f2f2f2]'}`}
                onClick={() => setFilterRating(!filterRating)}
              >
                Rating: 4.0+
              </button>
              <button 
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterFastDelivery ? 'bg-[#FC8019] text-white border-[#FC8019]' : 'border-gray-300 hover:bg-[#f2f2f2]'}`}
                onClick={() => setFilterFastDelivery(!filterFastDelivery)}
              >
                Fastest Delivery
              </button>
              <button 
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterVeg ? 'bg-[#FC8019] text-white border-[#FC8019]' : 'border-gray-300 hover:bg-[#f2f2f2]'}`}
                onClick={() => setFilterVeg(!filterVeg)}
              >
                Pure Veg
              </button>
            </div>
          </div>

          {isRestaurantsLoading ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-[#FC8019]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
              
              {filteredRestaurants.length === 0 && (
                <div className="text-center py-10">
                  <i className="bi bi-emoji-frown text-5xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-bold mb-2">No restaurants found</h3>
                  <p className="text-[#686b78] mb-4">Try changing your filters to see more options.</p>
                </div>
              )}

              <div className="text-center mt-10">
                <button className="px-6 py-2 border border-[#FC8019] text-[#FC8019] rounded-md hover:bg-[#FC8019] hover:text-white transition-colors">
                  Show More Restaurants
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* App Download */}
      <section className="py-12 bg-[#f2f2f2]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold mb-4">Get the SPARKUR App</h2>
              <p className="text-[#686b78] mb-6 max-w-lg">Order from your favorite restaurants, track delivery in real-time, and receive special offers on the go!</p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button className="flex items-center justify-center bg-[#3d4152] text-white px-6 py-3 rounded-md hover:bg-black transition-colors">
                  <i className="bi bi-apple text-2xl mr-2"></i>
                  <div className="text-left">
                    <p className="text-xs">Download on the</p>
                    <p className="font-medium">App Store</p>
                  </div>
                </button>
                <button className="flex items-center justify-center bg-[#3d4152] text-white px-6 py-3 rounded-md hover:bg-black transition-colors">
                  <i className="bi bi-google-play text-2xl mr-2"></i>
                  <div className="text-left">
                    <p className="text-xs">GET IT ON</p>
                    <p className="font-medium">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                <rect x="60" y="10" width="180" height="280" rx="20" fill="#333" />
                <rect x="70" y="30" width="160" height="240" rx="5" fill="#fff" />
                <circle cx="150" cy="290" r="10" fill="#444" />
                <rect x="100" y="20" width="100" height="5" rx="2.5" fill="#444" />
                <path d="M100,100 L220,100 L220,200 L100,200 Z" fill="#FC8019" />
                <circle cx="120" cy="120" r="10" fill="#fff" />
                <rect x="140" y="120" width="60" height="5" rx="2.5" fill="#fff" />
                <rect x="140" y="130" width="40" height="5" rx="2.5" fill="#fff" />
                <rect x="110" y="170" width="100" height="5" rx="2.5" fill="#fff" />
                <rect x="110" y="180" width="70" height="5" rx="2.5" fill="#fff" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
