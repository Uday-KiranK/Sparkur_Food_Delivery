import { Link } from "wouter";
import { Restaurant } from "@shared/schema";

interface RestaurantCardProps {
  restaurant: Restaurant;
  featured?: boolean;
}

const RestaurantCard = ({ restaurant, featured = false }: RestaurantCardProps) => {
  const {
    id,
    name,
    image_url,
    rating,
    delivery_time,
    price_for_two,
    cuisine_types,
    address,
  } = restaurant;

  // Get the first part of the address (locality)
  const locality = address.split(',')[0].trim();

  return (
    <Link href={`/restaurant/${id}`}>
      <div className={`${featured ? 'rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer' : 'cursor-pointer group'}`}>
        <div className={`${featured ? 'h-40' : 'h-48 rounded-lg overflow-hidden mb-3'} relative`}>
          <img 
            src={image_url} 
            className={`w-full h-full object-cover ${!featured && 'group-hover:scale-105 transition-transform duration-300'}`} 
            alt={name} 
          />
          <div className="absolute bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent w-full p-3">
            <span className="text-white font-medium">
              {Math.random() > 0.5 ? `${Math.floor(Math.random() * 50) + 20}% OFF up to ₹${Math.floor(Math.random() * 100) + 100}` : 'Free delivery'}
            </span>
          </div>
        </div>
        <div className={`${featured ? 'p-4' : ''}`}>
          <h3 className="font-medium text-lg">{name}</h3>
          <div className="flex items-center mb-1">
            <span className="bg-[#60b246] text-white text-xs px-1 rounded flex items-center">
              <i className="bi bi-star-fill text-xs mr-1"></i>{rating.toFixed(1)}
            </span>
            <span className="mx-1">•</span>
            <span className="text-sm text-[#686b78]">{delivery_time} mins</span>
            {!featured && (
              <>
                <span className="mx-1">•</span>
                <span className="text-sm text-[#686b78]">₹{price_for_two} for two</span>
              </>
            )}
          </div>
          <p className="text-[#93959f] text-sm truncate">{cuisine_types.join(', ')}</p>
          <p className="text-[#93959f] text-sm">{locality}</p>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
