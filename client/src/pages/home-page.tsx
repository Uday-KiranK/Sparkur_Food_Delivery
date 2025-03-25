import { useQuery } from "@tanstack/react-query";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import RestaurantCard from "@/components/restaurant-card";
import CategoryCard from "@/components/category-card";
import { Restaurant, FoodCategory } from "@shared/schema";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const HomePage = () => {
  const [filterRating, setFilterRating] = useState(false);
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);

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

      {/* Hero Section */}
      <section className="bg-[#f2f2f2] py-8 md:py-12 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Hungry? We've Got You Covered</h1>
            <p className="text-[#686b78] mb-6 md:text-lg">Order food from favorite restaurants near you</p>
            <div className="flex flex-col sm:flex-row">
              <input 
                type="text" 
                placeholder="Enter your delivery location" 
                className="px-4 py-3 rounded-md border border-gray-300 mb-3 sm:mb-0 sm:mr-3 focus:outline-none focus:ring-1 focus:ring-[#FC8019] w-full"
              />
              <button className="bg-[#FC8019] text-white px-6 py-3 rounded-md font-medium hover:bg-[#e67016] transition-colors">
                Find Food
              </button>
            </div>
          </div>
        </div>
        <div className="hidden md:block absolute right-0 bottom-0 w-1/3 h-full">
          <svg className="h-full w-full" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f8f8f8" />
            <path d="M50,250 C50,150 150,50 250,50 C350,50 450,150 450,250 C450,350 350,450 250,450 C150,450 50,350 50,250 Z" fill="#FEF2E8" />
            <path d="M100,250 C100,180 180,100 250,100 C320,100 400,180 400,250 C400,320 320,400 250,400 C180,400 100,320 100,250 Z" fill="#FFDCB8" />
            <path d="M150,250 C150,210 210,150 250,150 C290,150 350,210 350,250 C350,290 290,350 250,350 C210,350 150,290 150,250 Z" fill="#FC8019" />
          </svg>
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
                {allRestaurants?.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>

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
