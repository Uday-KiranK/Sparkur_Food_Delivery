import { FoodCategory } from "@shared/schema";

interface CategoryCardProps {
  category: FoodCategory;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const { name, image_url } = category;
  
  return (
    <div className="text-center cursor-pointer group transform transition-transform hover:scale-105">
      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mx-auto shadow-md border-2 border-white">
        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 relative">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300"></div>
          <img 
            src={image_url} 
            className="w-full h-full object-cover" 
            alt={name}
            loading="lazy" 
          />
        </div>
      </div>
      <div className="mt-3 transition-all">
        <p className="font-medium text-[#3d4152] group-hover:text-[#FC8019]">{name}</p>
        <div className="w-8 h-1 bg-[#FC8019] mx-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
};

export default CategoryCard;
