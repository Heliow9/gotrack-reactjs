import React, { useState } from "react";
import { buscarEndereco } from "../utils/buscaEndereco";
import MiniMapa from "./MiniMapa";
import "./ModalPedido.css";
import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";

const ModalPedido = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [sugestoesEndereco, setSugestoesEndereco] = useState([]);

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    valor: "",
    pagamento: "",
    descricao: "",
    endereco: "",
    numero: "",
    cep: "",
    complemento: "",
    pontoReferencia: "",
    bairro: "",
    latitude: null,
    longitude: null,
  });

  const handleEnderecoChange = async (e) => {
    const endereco = e.target.value;
    setFormData((prev) => ({ ...prev, endereco }));

    if (endereco.length > 5) {
      const resultado = await buscarEndereco(endereco);
      if (resultado) {
        setFormData((prev) => ({
          ...prev,
          latitude: resultado.latitude,
          longitude: resultado.longitude,
          cep: resultado.cep,
          bairro: resultado.bairro,
        }));
      }
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Pedido enviado:", formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <Typography variant="h6" gutterBottom>
          Novo Pedido
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box
            display="flex"
            flexDirection={isMobile ? "column" : "row"}
            gap={3}
            className="form-columns"
          >
            <Box flex={1} display="flex" flexDirection="column" gap={1}>
              <input name="numeroPedido" placeholder="Número do Pedido" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
              <input name="nome" placeholder="Nome do Cliente" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
              <input name="telefone" placeholder="Telefone" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
              <input name="valor" placeholder="Valor do Pedido" onChange={handleChange}   onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}/>
              <input name="pagamento" placeholder="Forma de Pagamento" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
              <textarea name="descricao" placeholder="Descrição do Pedido" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
            </Box>

            <Box flex={1} display="flex" flexDirection="column" gap={1}>
              <div className="autocomplete-container">
                <input
                  name="endereco"
                  placeholder="Endereço"
                  value={formData.endereco}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  onChange={async (e) => {
                    const endereco = e.target.value;
                    setFormData((prev) => ({ ...prev, endereco }));

                    if (endereco.length > 3) {
                      const response = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                          endereco
                        )}.json?access_token=pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ&country=BR&autocomplete=true&limit=5`
                      );
                      const data = await response.json();
                      setSugestoesEndereco(data.features || []);
                    } else {
                      setSugestoesEndereco([]);
                    }
                  }}
                />
                {sugestoesEndereco.length > 0 && (
                  <ul className="sugestoes-lista">
                    {sugestoesEndereco.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => {
                          const [lng, lat] = item.center;
                          const bairro = item.context?.find((ctx) =>
                            ctx.id.includes("neighborhood")
                          )?.text || "";
                          const cep = item.context?.find((ctx) =>
                            ctx.id.includes("postcode")
                          )?.text || "";

                          setFormData((prev) => ({
                            ...prev,
                            endereco: item.place_name,
                            latitude: lat,
                            longitude: lng,
                            bairro,
                            cep,
                          }));
                          setSugestoesEndereco([]);
                        }}
                      >
                        {item.place_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input name="numero" placeholder="Número" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
              <input name="complemento" placeholder="Complemento" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
              <input name="pontoReferencia" placeholder="Ponto de Referência" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
              <input value={formData.bairro || ""} placeholder="Bairro" readOnly onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
              <input value={formData.cep || ""} placeholder="CEP" readOnly onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />

              {formData.latitude && formData.longitude && (
                <div className="map-container">
                  <MiniMapa latitude={formData.latitude} longitude={formData.longitude} />
                </div>
              )}
            </Box>
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button onClick={onClose} variant="outlined">
              Fechar
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#ff7b00" }}>
              Salvar Pedido
            </Button>
          </Box>
        </form>
      </div>
    </div>
  );
};

export default ModalPedido;
