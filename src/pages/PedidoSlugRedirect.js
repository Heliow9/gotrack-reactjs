import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://168.75.78.51/api";

const PedidoSlugRedirect = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurante = async () => {
     
     
      try {
        const res = await axios.get(`${API_URL}/publico/${slug}`);
        if (res.data?.restaurante) {
          localStorage.setItem("restauranteSelecionado", JSON.stringify(res.data.restaurante));
          navigate("/pedido");
    
        } else {
          navigate("/erro");
        }
      } catch (error) {
        console.error("Erro ao carregar restaurante:", error);
        navigate("/erro");
      }
    };

    fetchRestaurante();
  }, [slug, navigate]);

  return <p>Carregando restaurante...</p>;
};

export default PedidoSlugRedirect;
