import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = "pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ"; // Substitua aqui

const MiniMapa = ({ latitude, longitude }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [longitude, latitude],
      zoom: 15,
    });

    new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);

    return () => map.remove();
  }, [latitude, longitude]);

  return <div ref={mapRef} style={{ width: "100%", height: "200px", marginTop: "16px" }} />;
};

export default MiniMapa;
