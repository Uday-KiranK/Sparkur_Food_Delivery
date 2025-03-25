import { FoodCategory } from "@shared/schema";

interface CategoryCardProps {
  category: FoodCategory;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const { name, image_url } = category;
  
  return (
    <div className="text-center">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mx-auto">
        <img src={image_url} className="w-full h-full object-cover" alt={name} />
      </div>
      <p className="mt-2 font-medium">{name}</p>
    </div>
  );
};

export default CategoryCard;
