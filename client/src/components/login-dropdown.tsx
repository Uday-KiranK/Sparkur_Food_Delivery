import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const LoginDropdown = () => {
  return (
    <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-30">
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-3">Login or create an account</h3>
        <Link href="/auth">
          <button className="w-full bg-[#FC8019] text-white py-2 rounded-md hover:bg-[#e67016] transition-colors">
            Login / Register
          </button>
        </Link>
        <div className="mt-3 text-xs text-center text-[#686b78]">
          By clicking on Login, I accept the <a href="#" className="text-[#FC8019]">Terms & Conditions</a> & <a href="#" className="text-[#FC8019]">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default LoginDropdown;
