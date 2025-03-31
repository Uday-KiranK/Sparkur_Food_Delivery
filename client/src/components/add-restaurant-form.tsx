import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { insertRestaurantSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Create a schema for restaurant creation form
const createRestaurantSchema = insertRestaurantSchema
  .omit({ admin_id: true }) // admin_id will be added on the server
  .extend({
    cuisine_types: z.string().min(3, "Cuisine types must be at least 3 characters"),
  });

type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema> & {
  cuisine_types: string; // Override the type to string for the form input
};

interface AddRestaurantFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddRestaurantForm = ({ onSuccess, onCancel }: AddRestaurantFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      cuisine_types: "",
      image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
      price_for_two: 300,
      delivery_time: 30,
      is_veg: false,
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: CreateRestaurantFormData) => {
      // Convert cuisine_types from string to array
      const cuisineTypesArray = data.cuisine_types.split(",").map(cuisine => cuisine.trim());
      
      const restaurantData = {
        ...data,
        cuisine_types: cuisineTypesArray,
        price_for_two: Number(data.price_for_two),
        delivery_time: Number(data.delivery_time),
      };
      
      const res = await apiRequest("POST", "/api/restaurants", restaurantData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Restaurant created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create restaurant: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateRestaurantFormData) => {
    createRestaurantMutation.mutate(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("image_url", url);
    setImagePreview(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Restaurant</h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
            <input
              type="text"
              {...form.register("name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
              placeholder="Enter restaurant name"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              {...form.register("phone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
              placeholder="Enter phone number"
            />
            {form.formState.errors.phone && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <input
            type="text"
            {...form.register("address")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
            placeholder="Enter restaurant address"
          />
          {form.formState.errors.address && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.address.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            {...form.register("description")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
            placeholder="Enter restaurant description"
            rows={3}
          />
          {form.formState.errors.description && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.description.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Types *</label>
            <input
              type="text"
              {...form.register("cuisine_types")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
              placeholder="E.g. Italian, Chinese, Indian (comma separated)"
            />
            {form.formState.errors.cuisine_types && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.cuisine_types.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Type</label>
            <div className="flex items-center space-x-2 h-[42px]">
              <input
                type="checkbox"
                id="is_veg"
                {...form.register("is_veg")}
                className="rounded border-gray-300 text-[#FC8019] focus:ring-[#FC8019]"
              />
              <label htmlFor="is_veg">Pure Vegetarian</label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price for Two (₹) *</label>
            <input
              type="number"
              {...form.register("price_for_two", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
              placeholder="Enter price for two people"
              min={1}
            />
            {form.formState.errors.price_for_two && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.price_for_two.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time (minutes) *</label>
            <input
              type="number"
              {...form.register("delivery_time", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
              placeholder="Enter average delivery time"
              min={5}
            />
            {form.formState.errors.delivery_time && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.delivery_time.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Image URL *</label>
          <input
            type="text"
            {...form.register("image_url")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FC8019]"
            placeholder="Enter image URL"
            onChange={handleImageChange}
          />
          {form.formState.errors.image_url && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.image_url.message}</p>
          )}
          
          {imagePreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">Image Preview:</p>
              <img 
                src={imagePreview} 
                alt="Restaurant preview" 
                className="h-32 w-full object-cover rounded-md"
                onError={() => setImagePreview(null)}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 bg-[#FC8019] text-white rounded-md hover:bg-[#e67016] transition-colors flex items-center justify-center"
            disabled={createRestaurantMutation.isPending}
          >
            {createRestaurantMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            Create Restaurant
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRestaurantForm;