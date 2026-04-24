import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { UserRole } from "@shared/schema";
import { Restaurant } from "@shared/schema";
import CartDropdown from "../cart-dropdown";
import LoginDropdown from "../login-dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const Header = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { totalItems } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);

  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const loginButtonRef = useRef<HTMLButtonElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // For login dropdown
      if (
        loginDropdownOpen &&
        loginDropdownRef.current &&
        !loginDropdownRef.current.contains(event.target as Node) &&
        loginButtonRef.current &&
        !loginButtonRef.current.contains(event.target as Node)
      ) {
        setLoginDropdownOpen(false);
      }

      // For cart dropdown
      if (
        cartDropdownOpen &&
        cartDropdownRef.current &&
        !cartDropdownRef.current.contains(event.target as Node) &&
        cartButtonRef.current &&
        !cartButtonRef.current.contains(event.target as Node)
      ) {
        setCartDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [loginDropdownOpen, cartDropdownOpen]);

  // State for dialog controls
  const [searchOpen, setSearchOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);

  // Fetch restaurants for search
  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    enabled: searchOpen,
  });

  // Function to perform search
  const handleSearch = () => {
    if (!searchQuery.trim() || !restaurants) {
      setSearchResults([]);
      return;
    }

    // Case insensitive search on the client side (as backup for the server search)
    const results = restaurants.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine_types.some((type) =>
          type.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    setSearchResults(results);
  };

  // Perform search when search button is clicked
  const performServerSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a search term",
      });
      return;
    }

    // Close the search dialog
    setSearchOpen(false);

    // Navigate to home page with search query
    window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
  };

  // Handle popular search term click
  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
    setTimeout(() => performServerSearch(), 100);
  };

  // Get user role-specific dashboard link
  const getDashboardLink = () => {
    if (!user) return "/profile";

    switch (user.role) {
      case UserRole.RESTAURANT_ADMIN:
        return "/admin/restaurant";
      case UserRole.DELIVERY_PARTNER:
        return "/delivery/dashboard";
      default:
        return "/profile";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-[#FC8019] rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-[#3d4152] font-bold text-xl hidden sm:block">
                SPARKUR
              </span>
            </Link>
          </div>

          {/* Location Selector */}
          <div className="hidden md:flex items-center ml-8 text-[#686b78]">
            <div className="flex items-center cursor-pointer group">
              <span className="font-medium mr-1">Bangalore</span>
              <i className="bi bi-geo-alt-fill text-[#FC8019]"></i>
              <i className="bi bi-chevron-down ml-1 text-xs group-hover:text-[#FC8019] transition-colors"></i>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:block flex-grow ml-10">
            <ul className="flex space-x-6">
              <li>
                <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors">
                      <i className="bi bi-search mr-2"></i>
                      <span>Search</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Search Restaurants & Food</DialogTitle>
                      <DialogDescription>
                        Find your favorite restaurants and dishes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex gap-2">
                        <Input
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleSearch();
                          }}
                          placeholder="Search for restaurants, dishes or cuisines..."
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              performServerSearch();
                            }
                          }}
                        />
                        <button
                          className="bg-[#FC8019] text-white px-4 py-2 rounded-md flex items-center"
                          onClick={performServerSearch}
                        >
                          <i className="bi bi-search mr-2"></i>
                          Search
                        </button>
                      </div>

                      {/* Show search results if available */}
                      {searchQuery.trim() !== "" &&
                        searchResults.length > 0 && (
                          <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">
                              Search Results:
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {searchResults.map((restaurant) => (
                                <Link
                                  key={restaurant.id}
                                  href={`/restaurant/${restaurant.id}`}
                                  className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                                  onClick={() => setSearchOpen(false)}
                                >
                                  <div className="w-12 h-12 rounded-md overflow-hidden mr-3">
                                    <img
                                      src={restaurant.image_url}
                                      alt={restaurant.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">
                                      {restaurant.name}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                      {restaurant.cuisine_types
                                        .slice(0, 3)
                                        .join(", ")}
                                      {restaurant.cuisine_types.length > 3 &&
                                        "..."}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Show empty state message */}
                      {searchQuery.trim() !== "" &&
                        searchResults.length === 0 && (
                          <div className="mt-4 py-4 text-center">
                            <p className="text-gray-500">
                              No restaurants found matching "{searchQuery}"
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              Try a different search term
                            </p>
                          </div>
                        )}

                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Popular Searches:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span
                            onClick={() => handlePopularSearchClick("Pizza")}
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                          >
                            Pizza
                          </span>
                          <span
                            onClick={() => handlePopularSearchClick("Burger")}
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                          >
                            Burger
                          </span>
                          <span
                            onClick={() => handlePopularSearchClick("Chinese")}
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                          >
                            Chinese
                          </span>
                          <span
                            onClick={() => handlePopularSearchClick("Biryani")}
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                          >
                            Biryani
                          </span>
                          <span
                            onClick={() =>
                              handlePopularSearchClick("Ice Cream")
                            }
                            className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                          >
                            Ice Cream
                          </span>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </li>
              <li>
                <Dialog open={offersOpen} onOpenChange={setOffersOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors">
                      <i className="bi bi-percent mr-2"></i>
                      <span>Offers</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Current Offers</DialogTitle>
                      <DialogDescription>
                        Amazing deals and discounts just for you
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="border rounded-md p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-[#FC8019] h-10 w-10 rounded-full flex items-center justify-center text-white">
                              <i className="bi bi-currency-rupee"></i>
                            </div>
                            <div className="ml-3">
                              <h3 className="font-bold">WELCOME50</h3>
                              <p className="text-sm text-gray-500">
                                50% off up to ₹100
                              </p>
                            </div>
                          </div>
                          <button className="text-[#FC8019] border border-[#FC8019] rounded-md px-3 py-1 text-sm hover:bg-[#fff3e9]">
                            COPY
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Valid on orders above ₹199. Only for new users.
                        </p>
                      </div>

                      <div className="border rounded-md p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-[#FC8019] h-10 w-10 rounded-full flex items-center justify-center text-white">
                              <i className="bi bi-bag-fill"></i>
                            </div>
                            <div className="ml-3">
                              <h3 className="font-bold">FREEDEL</h3>
                              <p className="text-sm text-gray-500">
                                Free Delivery
                              </p>
                            </div>
                          </div>
                          <button className="text-[#FC8019] border border-[#FC8019] rounded-md px-3 py-1 text-sm hover:bg-[#fff3e9]">
                            COPY
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Valid on orders above ₹249.
                        </p>
                      </div>

                      <div className="border rounded-md p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-[#FC8019] h-10 w-10 rounded-full flex items-center justify-center text-white">
                              <i className="bi bi-card-list"></i>
                            </div>
                            <div className="ml-3">
                              <h3 className="font-bold">JUMBO</h3>
                              <p className="text-sm text-gray-500">
                                20% off up to ₹150
                              </p>
                            </div>
                          </div>
                          <button className="text-[#FC8019] border border-[#FC8019] rounded-md px-3 py-1 text-sm hover:bg-[#fff3e9]">
                            COPY
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Valid on orders above ₹499.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </li>
              <li>
                <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors">
                      <i className="bi bi-question-circle mr-2"></i>
                      <span>Help</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Help & Support</DialogTitle>
                      <DialogDescription>
                        Frequently asked questions and support
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-4">
                        <div className="border-b pb-3">
                          <h3 className="font-medium mb-1">
                            How do I track my order?
                          </h3>
                          <p className="text-sm text-gray-600">
                            You can track your order in real-time by going to
                            the 'Orders' section in your profile. You'll see the
                            current status and live location of your delivery
                            partner.
                          </p>
                        </div>

                        <div className="border-b pb-3">
                          <h3 className="font-medium mb-1">
                            What if I want to cancel my order?
                          </h3>
                          <p className="text-sm text-gray-600">
                            You can cancel your order from the 'Orders' section
                            if it's still in the 'Pending' status. Once the
                            restaurant has accepted your order, you'll need to
                            contact customer support.
                          </p>
                        </div>

                        <div className="border-b pb-3">
                          <h3 className="font-medium mb-1">
                            How do I get a refund?
                          </h3>
                          <p className="text-sm text-gray-600">
                            Refunds are automatically processed if your order is
                            cancelled. For other issues like missing items or
                            quality concerns, please raise a help ticket from
                            the order details page.
                          </p>
                        </div>

                        <div className="border-b pb-3">
                          <h3 className="font-medium mb-1">
                            Can I change my delivery address?
                          </h3>
                          <p className="text-sm text-gray-600">
                            You can update your delivery address before placing
                            the order. Once the order is placed, the address
                            cannot be changed.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-medium mb-1">
                            How do I contact customer support?
                          </h3>
                          <p className="text-sm text-gray-600">
                            You can reach our customer support team 24/7 via
                            email at support@sparkur.com or call us at
                            +91-80XXXXXXXX.
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </li>
              {user && (
                <li>
                  <Link
                    href={getDashboardLink()}
                    className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors"
                  >
                    <i className="bi bi-speedometer2 mr-2"></i>
                    <span>Dashboard</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Login Button with Dropdown */}
            <div className="relative" ref={loginDropdownRef}>
              {user ? (
                <Link
                  href="/profile"
                  className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors"
                >
                  <i className="bi bi-person mr-1"></i>
                  <span className="hidden md:inline">{user.username}</span>
                </Link>
              ) : (
                <button
                  ref={loginButtonRef}
                  className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors"
                  onClick={() => {
                    setLoginDropdownOpen(!loginDropdownOpen);
                    setCartDropdownOpen(false);
                  }}
                >
                  <i className="bi bi-person mr-1"></i>
                  <span className="hidden md:inline">Login</span>
                </button>
              )}

              {loginDropdownOpen && !user && <LoginDropdown />}
            </div>

            {/* Cart Button with Dropdown - Only show to logged-in customers */}
            {user && user.role === UserRole.CUSTOMER && (
              <div className="relative" ref={cartDropdownRef}>
                <button
                  ref={cartButtonRef}
                  className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors"
                  onClick={() => {
                    setCartDropdownOpen(!cartDropdownOpen);
                    setLoginDropdownOpen(false);
                  }}
                >
                  <i className="bi bi-cart3 mr-1"></i>
                  <span className="hidden md:inline">Cart</span>
                  {totalItems > 0 && (
                    <span className="bg-[#FC8019] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                      {totalItems}
                    </span>
                  )}
                </button>

                {cartDropdownOpen && (
                  <CartDropdown onClose={() => setCartDropdownOpen(false)} />
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#3d4152] text-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="container mx-auto px-4 py-3">
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="flex items-center py-2 hover:text-[#FC8019] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="bi bi-geo-alt-fill mr-2 text-[#FC8019]"></i>
                  <span>Bangalore</span>
                </Link>
              </li>
              <li>
                <button
                  className="flex items-center py-2 hover:text-[#FC8019] transition-colors w-full text-left"
                  onClick={() => {
                    setSearchOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <i className="bi bi-search mr-2"></i>
                  <span>Search</span>
                </button>
              </li>
              <li>
                <button
                  className="flex items-center py-2 hover:text-[#FC8019] transition-colors w-full text-left"
                  onClick={() => {
                    setOffersOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <i className="bi bi-percent mr-2"></i>
                  <span>Offers</span>
                </button>
              </li>
              <li>
                <button
                  className="flex items-center py-2 hover:text-[#FC8019] transition-colors w-full text-left"
                  onClick={() => {
                    setHelpOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <i className="bi bi-question-circle mr-2"></i>
                  <span>Help</span>
                </button>
              </li>
              {user && (
                <li>
                  <Link
                    href={getDashboardLink()}
                    className="flex items-center py-2 hover:text-[#FC8019] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="bi bi-speedometer2 mr-2"></i>
                    <span>Dashboard</span>
                  </Link>
                </li>
              )}
              {user && user.role === UserRole.CUSTOMER && (
                <li>
                  <Link
                    href="/checkout"
                    className="flex items-center py-2 hover:text-[#FC8019] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="bi bi-cart3 mr-2"></i>
                    <span>Cart</span>
                    {totalItems > 0 && (
                      <span className="bg-[#FC8019] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
