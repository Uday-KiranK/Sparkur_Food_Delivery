import { Link } from "wouter";
import { Restaurant } from "@shared/schema";
import { useEffect, useState } from "react";

interface RestaurantCardProps {
  restaurant: Restaurant;
  featured?: boolean;
}

const RestaurantCard = ({
  restaurant,
  featured = false,
}: RestaurantCardProps) => {
  const {
    id,
    name,
    image_url,
    rating: initialRating,
    delivery_time,
    price_for_two,
    cuisine_types,
    address,
    is_veg,
  } = restaurant;

  // Get the first part of the address (locality)
  const locality = address.split(",")[0].trim();

  // Create a more dynamic experience with fixed random values for ratings
  const [displayRating, setDisplayRating] = useState(initialRating || 4.0);
  const [offerText, setOfferText] = useState("");
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    // Use a fixed seed based on restaurant ID for consistent randomness
    const seed = id * 17;

    // Generate fixed random rating between 3.8 and 4.7
    const adjustedRating = 3.8 + (seed % 10) / 10;
    setDisplayRating(Math.min(Math.round(adjustedRating * 10) / 10, 4.7));

    // Generate fixed random review count
    setReviewCount(200 + (seed % 800));

    // Generate fixed random offer text
    const offerType = seed % 4;
    if (offerType === 0) {
      setOfferText(`${20 + (seed % 30)}% OFF up to ₹${100 + (seed % 100)}`);
    } else if (offerType === 1) {
      setOfferText("Free delivery");
    } else if (offerType === 2) {
      setOfferText(`₹${50 + (seed % 150)} OFF above ₹${299 + (seed % 200)}`);
    } else {
      setOfferText("BOGO on selected items");
    }
  }, [id]);

  return (
    <Link href={`/restaurant/${id}`}>
      <div
        className={`${featured ? "rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer" : "cursor-pointer group"}`}
      >
        {/* Image Container */}
        <div
          className={`${featured ? "h-44" : "h-52 rounded-lg overflow-hidden"} relative`}
        >
          <img
            src={image_url}
            className={`w-full h-full object-cover ${!featured && "group-hover:scale-105 transition-transform duration-300"}`}
            alt={name}
            loading="lazy"
          />

          {/* Offer Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-[#FC8019] text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
              <i className="bi bi-tag-fill mr-1"></i>
              {offerText}
            </div>
          </div>

          {/* Veg/Non-veg Badge */}
          <div className="absolute top-3 right-3">
            <div
              className={`${is_veg ? "border-green-600 text-green-600" : "border-red-500 text-red-500"} bg-white border w-6 h-6 flex items-center justify-center rounded-md shadow-sm`}
            >
              {is_veg ? (
                <span className="block w-3 h-3 bg-green-600 rounded-full"></span>
              ) : (
                <span className="text-xs">🍖</span>
              )}
            </div>
          </div>

          {/* Dark Gradient Overlay */}
          <div className="absolute bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent w-full h-24"></div>

          {/* Time Badge */}
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
            <i className="bi bi-clock mr-1"></i>
            {delivery_time} mins
          </div>
        </div>

        {/* Content */}
        <div className={`${featured ? "p-4" : "pt-3"}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-[#3d4152] truncate">
              {name}
            </h3>

            {/* Rating Badge */}
            <div className="flex items-center gap-1">
              <span
                className={`${displayRating >= 4.0 ? "bg-[#60b246]" : displayRating >= 3.5 ? "bg-[#db7c38]" : "bg-[#e1b055]"} text-white text-xs px-1.5 py-0.5 rounded flex items-center font-medium`}
              >
                <i className="bi bi-star-fill text-xs mr-1"></i>
                {displayRating.toFixed(1)}
              </span>
              <span className="text-xs text-[#686b78]">({reviewCount})</span>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="mt-1">
            <p className="text-[#686b78] text-sm font-medium truncate">
              {cuisine_types.join(", ")}
            </p>
            <div className="flex items-center text-sm text-[#93959f] mt-1">
              <i className="bi bi-geo-alt-fill text-xs mr-1"></i>
              <span>{locality}</span>
              <span className="mx-1.5">•</span>
              <i className="bi bi-currency-rupee text-xs"></i>
              <span>{price_for_two} for two</span>
            </div>
          </div>

          {/* Quick View Button (only on hover and non-featured cards) */}
          {!featured && (
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-full border border-[#FC8019] text-[#FC8019] py-1.5 rounded-md text-sm font-medium hover:bg-[#fff3e9] transition-colors">
                Quick View
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
