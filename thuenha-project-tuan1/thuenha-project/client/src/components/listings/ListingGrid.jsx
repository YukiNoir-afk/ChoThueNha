import ListingCard from './ListingCard';

/**
 * ListingGrid — CSS Grid responsive bọc nhiều ListingCard.
 * Grid rule: repeat(auto-fill, minmax(280px, 1fr))
 * → 1 col mobile, 2 col tablet, 3-4 col desktop tự động.
 */
export default function ListingGrid({ listings = [], setHoveredListingId }) {
  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="listing-grid" id="listing-grid">
      {listings.map((listing, index) => (
        <div
          key={listing.id}
          className={`animate-fade-in-up animate-fade-in-up-delay-${(index % 4) + 1}`}
        >
          <ListingCard
            id={listing.id}
            titleVi={listing.titleVi}
            titleEn={listing.titleEn}
            address={listing.address}
            price={listing.price}
            area={listing.area}
            bedrooms={listing.bedrooms}
            type={listing.type}
            thumbnail={listing.thumbnail}
            distanceKm={listing.distanceKm}
            onMouseEnter={() => setHoveredListingId && setHoveredListingId(listing.id)}
            onMouseLeave={() => setHoveredListingId && setHoveredListingId(null)}
          />
        </div>
      ))}
    </div>
  );
}
