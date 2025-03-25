import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { UserRole } from "@shared/schema";
import CartDropdown from "../cart-dropdown";
import LoginDropdown from "../login-dropdown";

const Header = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { totalItems } = useCart();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
      
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target as Node)) {
        setCartDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get user role-specific dashboard link
  const getDashboardLink = () => {
    if (!user) return null;
    
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
              <span className="text-[#3d4152] font-bold text-xl hidden sm:block">SPARKUR</span>
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
                <Link href="/" className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors">
                  <i className="bi bi-search mr-2"></i>
                  <span>Search</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors">
                  <i className="bi bi-percent mr-2"></i>
                  <span>Offers</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="flex items-center px-2 py-1.5 hover:text-[#FC8019] transition-colors">
                  <i className="bi bi-question-circle mr-2"></i>
                  <span>Help</span>
                </Link>
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
              
              {loginDropdownOpen && !user && (
                <LoginDropdown />
              )}
            </div>

            {/* Cart Button with Dropdown */}
            <div className="relative" ref={cartDropdownRef}>
              <button 
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
                <Link 
                  href="/" 
                  className="flex items-center py-2 hover:text-[#FC8019] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="bi bi-search mr-2"></i>
                  <span>Search</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/" 
                  className="flex items-center py-2 hover:text-[#FC8019] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="bi bi-percent mr-2"></i>
                  <span>Offers</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/" 
                  className="flex items-center py-2 hover:text-[#FC8019] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="bi bi-question-circle mr-2"></i>
                  <span>Help</span>
                </Link>
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
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
