import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginDropdown = () => {
  const [isRegisterView, setIsRegisterView] = useState(false);
  const { loginMutation } = useAuth();
  const [, navigate] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-30">
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-3">
          {isRegisterView ? "Create an account" : "Login to your account"}
        </h3>
        
        {isRegisterView ? (
          <>
            <Link href="/auth">
              <button className="w-full bg-[#FC8019] text-white py-2 rounded-md hover:bg-[#e67016] transition-colors">
                Register Now
              </button>
            </Link>
            <div className="mt-3 text-center">
              <button 
                onClick={() => setIsRegisterView(false)}
                className="text-[#FC8019] text-sm font-medium"
              >
                Already have an account? Login
              </button>
            </div>
          </>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#FC8019] hover:bg-[#e67016]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Login
                </Button>
              </form>
            </Form>
            
            <div className="mt-3 text-center">
              <button 
                onClick={() => setIsRegisterView(true)}
                className="text-[#FC8019] text-sm font-medium"
              >
                New to Sparkur? Create account
              </button>
            </div>
          </>
        )}
        
        <div className="mt-3 text-xs text-center text-[#686b78]">
          By clicking on Login/Register, I accept the <a href="#" className="text-[#FC8019]">Terms & Conditions</a> & <a href="#" className="text-[#FC8019]">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default LoginDropdown;
