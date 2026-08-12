import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

function MapEvents({ setBoundingBox }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      setBoundingBox({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    },
  });
  
  // Set initial bounds on mount
  useEffect(() => {
    const bounds = map.getBounds();
    setBoundingBox({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    });
  }, [map, setBoundingBox]);

  return null;
}

export default function MapComponent({ listings, hoveredListingId, setBoundingBox, center = [21.0285, 105.8542], zoom = 13 }) {
  const navigate = useNavigate();

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1, borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {setBoundingBox && <MapEvents setBoundingBox={setBoundingBox} />}

        {listings?.map((listing) => {
          const isHovered = hoveredListingId === listing.id;
          
          // Tạo một marker hiển thị mức giá rút gọn (ví dụ 3.5M)
          let priceStr = listing.price;
          if (listing.price >= 1000000) {
            priceStr = (listing.price / 1000000).toFixed(1).replace('.0', '') + 'M';
          } else if (listing.price >= 1000) {
            priceStr = (listing.price / 1000).toFixed(0) + 'k';
          }
          
          const iconHtml = `
            <div style="
              background-color: ${isHovered ? 'var(--color-primary)' : '#fff'};
              color: ${isHovered ? '#fff' : 'var(--color-primary)'};
              border: 2px solid var(--color-primary);
              border-radius: 20px;
              padding: 4px 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 13px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.15);
              transition: all 0.2s ease;
              transform: ${isHovered ? 'scale(1.15) translateY(-5px)' : 'scale(1)'};
              z-index: ${isHovered ? 1000 : 1};
              white-space: nowrap;
              font-family: var(--font-sans);
            ">
              ${priceStr}
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-leaflet-icon',
            iconSize: null, // Allow css to define size
            iconAnchor: [20, 20], // Center bottom point roughly
          });

          return (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  navigate(`/listing/${listing.id}`);
                },
              }}
            >
              <Popup>
                <div style={{ cursor: 'pointer', fontFamily: 'var(--font-sans)' }} onClick={() => navigate(`/listing/${listing.id}`)}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{listing.titleVi}</div>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                    {listing.price.toLocaleString('vi-VN')} đ/tháng
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
