import { useQuery } from "@tanstack/react-query";
import Header from "@/components/ui/header";
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
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    restaurants: Restaurant[];
    menuItems: MenuItem[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch featured restaurants
  const { data: featuredRestaurants, isLoading: isFeaturedLoading } = useQuery<
    Restaurant[]
  >({
    queryKey: ["/api/restaurants/featured"],
  });

  // Fetch food categories
  const { data: foodCategories, isLoading: isCategoriesLoading } = useQuery<
    FoodCategory[]
  >({
    queryKey: ["/api/food-categories"],
  });

  // Generate query params based on active filters
  const filterParams = useMemo(() => {
    const params: { veg?: boolean; rating?: number; category?: string } = {};

    if (filterVeg) {
      params.veg = true;
    }

    if (filterRating) {
      params.rating = 4.0;
    }

    if (filterCategory) {
      params.category = filterCategory;
    }

    return params;
  }, [filterVeg, filterRating, filterCategory]);

  // Get search query from URL if present
  const urlSearchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const urlSearchQuery = urlSearchParams.get("search");

  // Set search query from URL if present
  useEffect(() => {
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    }
  }, [urlSearchQuery]);

  // Fetch all restaurants with filters
  const { data: allRestaurants, isLoading: isRestaurantsLoading } = useQuery<
    Restaurant[]
  >({
    queryKey: [
      "/api/restaurants",
      { ...filterParams, search: searchQuery || urlSearchQuery },
    ],
  });

  // Process restaurants for fast delivery filter only
  // (category, veg, and rating filters are handled server-side)
  const filteredRestaurants = useMemo(() => {
    if (!allRestaurants) return [];

    let restaurants = [...allRestaurants];

    // Apply fastest delivery filter if enabled (client-side)
    if (filterFastDelivery) {
      restaurants = restaurants
        .sort((a, b) => {
          return (a.delivery_time || 30) - (b.delivery_time || 30);
        })
        .slice(0, 10); // Show only the 10 fastest restaurants
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

    // Filter restaurants by name, description and cuisine types
    const matchedRestaurants = allRestaurants.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(query) ||
        (restaurant.description &&
          restaurant.description.toLowerCase().includes(query)) ||
        (restaurant.cuisine_types &&
          restaurant.cuisine_types.some((cuisine) =>
            cuisine.toLowerCase().includes(query),
          )),
    );

    // Filter menu items by name and description
    const matchedMenuItems = allMenuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)),
    );

    setSearchResults({
      restaurants: matchedRestaurants,
      menuItems: matchedMenuItems,
    });

    setIsSearching(false);
    setShowSearchDropdown(true);
  };

  // Auto-search when query changes (after a small delay)
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);

      return () => clearTimeout(timer);
    } else if (searchQuery.trim().length === 0) {
      setShowSearchDropdown(false);
    }
  }, [searchQuery]);

  // Clear search results
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setShowSearchDropdown(false);
  };

  // Handle click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
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

    const restaurant = allRestaurants.find(
      (r) => r.id === menuItem.restaurant_id,
    );
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
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchResults.restaurants.length === 0 &&
                searchResults.menuItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <>
                    {searchResults.restaurants.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">
                          Restaurants
                        </div>
                        <div className="divide-y divide-gray-100">
                          {searchResults.restaurants.map((restaurant) => (
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
                                <div className="font-medium">
                                  {restaurant.name}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-md">
                                  {restaurant.cuisine_types.join(", ")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.menuItems.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">
                          Menu Items
                        </div>
                        <div className="divide-y divide-gray-100">
                          {searchResults.menuItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleMenuItemClick(item)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-500">
                                    ₹{item.price}
                                  </div>
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

      {/* Restaurant List */}
      <section id="restaurants-section" className="py-8 bg-white flex-grow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Restaurants near you</h2>
              {filterCategory && (
                <div className="mt-1 text-[#686b78]">
                  <span className="font-medium">Category:</span>{" "}
                  {filterCategory}
                  <button
                    className="ml-2 text-[#FC8019] hover:text-[#e67016] focus:outline-none"
                    onClick={() => setFilterCategory(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <div className="hidden md:flex space-x-4">
              <button className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-[#f2f2f2] transition-colors flex items-center">
                <i className="bi bi-sliders mr-2"></i>
                Filter
              </button>
              <button
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterRating ? "bg-[#FC8019] text-white border-[#FC8019]" : "border-gray-300 hover:bg-[#f2f2f2]"}`}
                onClick={() => setFilterRating(!filterRating)}
              >
                Rating: 4.0+
              </button>
              <button
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterFastDelivery ? "bg-[#FC8019] text-white border-[#FC8019]" : "border-gray-300 hover:bg-[#f2f2f2]"}`}
                onClick={() => setFilterFastDelivery(!filterFastDelivery)}
              >
                Fastest Delivery
              </button>
              <button
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterVeg ? "bg-[#FC8019] text-white border-[#FC8019]" : "border-gray-300 hover:bg-[#f2f2f2]"}`}
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
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterRating ? "bg-[#FC8019] text-white border-[#FC8019]" : "border-gray-300 hover:bg-[#f2f2f2]"}`}
                onClick={() => setFilterRating(!filterRating)}
              >
                Rating: 4.0+
              </button>
              <button
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterFastDelivery ? "bg-[#FC8019] text-white border-[#FC8019]" : "border-gray-300 hover:bg-[#f2f2f2]"}`}
                onClick={() => setFilterFastDelivery(!filterFastDelivery)}
              >
                Fastest Delivery
              </button>
              <button
                className={`px-3 py-1.5 border rounded-md transition-colors ${filterVeg ? "bg-[#FC8019] text-white border-[#FC8019]" : "border-gray-300 hover:bg-[#f2f2f2]"}`}
                onClick={() => setFilterVeg(!filterVeg)}
              >
                Pure Veg
              </button>
              {filterCategory && (
                <button
                  className="px-3 py-1.5 bg-[#FC8019] text-white border border-[#FC8019] rounded-md flex items-center"
                  onClick={() => setFilterCategory(null)}
                >
                  {filterCategory} ✕
                </button>
              )}
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
                  <h3 className="text-xl font-bold mb-2">
                    No restaurants found
                  </h3>
                  <p className="text-[#686b78] mb-4">
                    Try changing your filters to see more options.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
