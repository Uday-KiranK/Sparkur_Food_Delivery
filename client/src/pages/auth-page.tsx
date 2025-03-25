import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

// Extend the schema with validation rules
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { loginMutation, registerMutation, user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      phone: "",
      role: "customer" as const,
      address: "",
    },
  });

  const onLoginSubmit = loginForm.handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  const onRegisterSubmit = registerForm.handleSubmit((data) => {
    // Remove confirmPassword as it's not in the schema
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center bg-[#f2f2f2] py-10">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto">
            {/* Form Section */}
            <div className="md:w-1/2 p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Create Account"}</h2>
                <p className="text-[#686b78] mt-1">
                  {isLogin ? "Welcome back to SPARKUR" : "Join the SPARKUR community"}
                </p>
              </div>

              {isLogin ? (
                // Login Form
                <form onSubmit={onLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      {...loginForm.register("username")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Username"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      {...loginForm.register("password")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Password"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-[#FC8019] text-white py-2 rounded-md hover:bg-[#e67016] transition-colors flex items-center justify-center"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Login
                  </button>
                  
                  <div className="text-center mt-4">
                    <p className="text-sm text-[#686b78]">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-[#FC8019] hover:underline"
                      >
                        Register
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                // Register Form
                <form onSubmit={onRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      {...registerForm.register("username")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Username"
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      {...registerForm.register("email")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Email"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      {...registerForm.register("phone")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Phone number"
                    />
                    {registerForm.formState.errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
                    <input
                      type="text"
                      {...registerForm.register("address")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Delivery address"
                    />
                    {registerForm.formState.errors.address && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.address.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      {...registerForm.register("role")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                    >
                      <option value="customer">Customer</option>
                      <option value="restaurant_admin">Restaurant Owner</option>
                      <option value="delivery_partner">Delivery Partner</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      {...registerForm.register("password")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Password"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      {...registerForm.register("confirmPassword")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
                      placeholder="Confirm password"
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-[#FC8019] text-white py-2 rounded-md hover:bg-[#e67016] transition-colors flex items-center justify-center"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Register
                  </button>
                  
                  <div className="text-center mt-4">
                    <p className="text-sm text-[#686b78]">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-[#FC8019] hover:underline"
                      >
                        Login
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
            
            {/* Hero Section */}
            <div className="md:w-1/2 bg-gradient-to-r from-[#ffdbb5] to-[#ffc38e] p-8 flex items-center">
              <div>
                <h1 className="text-3xl font-bold mb-4">Delicious food is just a click away!</h1>
                <p className="mb-6 text-[#3d4152]">
                  Join SPARKUR to order from your favorite restaurants, track deliveries in real-time, and enjoy exclusive offers.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                      <i className="bi bi-clock text-[#FC8019]"></i>
                    </div>
                    <div>
                      <h3 className="font-medium">Quick Delivery</h3>
                      <p className="text-sm text-[#3d4152]">Get your food delivered in under 30 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                      <i className="bi bi-geo-alt text-[#FC8019]"></i>
                    </div>
                    <div>
                      <h3 className="font-medium">Live Tracking</h3>
                      <p className="text-sm text-[#3d4152]">Track your order in real-time from restaurant to your door</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                      <i className="bi bi-tag text-[#FC8019]"></i>
                    </div>
                    <div>
                      <h3 className="font-medium">Exclusive Offers</h3>
                      <p className="text-sm text-[#3d4152]">Enjoy special discounts and deals from top restaurants</p>
                    </div>
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

export default AuthPage;
