import React, { useState } from "react";
import { buscarEndereco } from "../utils/buscaEndereco";
import MiniMapa from "./MiniMapa";
import "./ModalPedido.css";
import { Box, Button, Typography, useMediaQuery, useTheme, TextField, MenuItem } from "@mui/material";
import { usePedidos } from '../Context/PedidosContext';


const ModalPedido = ({ isOpen, onClose }) => {
  const { triggerAtualizacao } = usePedidos();

  const restauranteId = localStorage.getItem('_id')
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
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'telefone') {
      // Remove tudo que não for número
      const onlyNumbers = value.replace(/\D/g, '');

      // Aplica a máscara
      if (onlyNumbers.length <= 10) {
        newValue = onlyNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else {
        newValue = onlyNumbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      }
    }


    if (name === 'valor') {
      // Remove tudo que não for dígito
      const onlyNumbers = value.replace(/\D/g, '');

      // Evita erro se estiver vazio
      if (!onlyNumbers) {
        newValue = '';
      } else {
        // Converte para número e formata como moeda
        const floatValue = parseInt(onlyNumbers, 10) / 100;
        newValue = floatValue.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };




  if (!isOpen) return null;





  async function handleRegisterPedido() {
    const payload = {
      numeroPedido: formData.numeroPedido,
      nomeCliente: formData.nomeCliente,
      telefoneCliente: formData.telefone,
      valorTotal: formData.valor,
      formadePagamento: formData.pagamento,
      descricaoPedido: formData.descricaoPedido,
      enderecoCliente: formData.endereco,
      numero: formData.numero,
      complemento: formData.complemento,
      pontoReferencia: formData.pontoReferencia,
      bairro: formData.bairro,
      cep: formData.cep,
      latitude: formData.latitude,
      longitude: formData.longitude,
      restauranteId, // já que você pegou do localStorage
    };

    try {
      const response = await fetch("https://gotrackapi.onrender.com/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Pedido salvo com sucesso!");
        triggerAtualizacao()
        onClose(); // fecha o modal
      } else {
        console.error("Erro ao salvar pedido:", result);
        alert("Erro ao salvar pedido: " + result?.message || "Erro desconhecido");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão ao salvar pedido.");
    }
  }







  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <Typography variant="h6" gutterBottom>
          Novo Pedido
        </Typography>
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          gap={3}
          className="form-columns"
        >
          <Box flex={1} display="flex" flexDirection="column" gap={1}>
            <input
              name="numeroPedido"
              placeholder="Número do Pedido"
              value={formData.numeroPedido ? `CR#${formData.numeroPedido}` : ''}

              onChange={(e) => {
                const rawValue = e.target.value.replace(/^CR#/, ''); // remove o prefixo
                setFormData((prev) => ({
                  ...prev,
                  numeroPedido: rawValue,
                }));
              }}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              inputMode="numeric"
            />
            <input
              name="telefone"
              placeholder="Telefone"
              value={formData.telefone || ''}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              inputMode="tel"
            />

            <input name="nomeCliente" placeholder="Nome do Cliente" onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
            <input
              name="valor"
              placeholder="Valor do Pedido"
              value={formData.valor || ''}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              inputMode="numeric"
            />
            <TextField
              select
              fullWidth
              label="Forma de Pagamento"
              name="pagamento"
              value={formData.pagamento || ''}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            >
              <MenuItem value="Dinheiro">Dinheiro</MenuItem>
              <MenuItem value="Pix">Pix</MenuItem>
              <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
            </TextField>

            <textarea
              name="descricaoPedido"
              placeholder="Descrição do Pedido"
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              style={{
                resize: "none",
                width: 'auto',
                height: "100px",
                maxHeight: "100px",
                overflowY: "auto"
              }}
            />
          </Box>

          <Box flex={1} display="flex" flexDirection="column" gap={1}>
            <div className="autocomplete-container">
              <input
                name="enderecoCliente"
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

                    const sugestoesFiltradas = (data.features || []).filter((feature) => {
                      const context = feature.context || [];

                      // Busca por item que representa a cidade
                      const cidade = context.find((c) => c.id.startsWith("place"));

                      if (!cidade) return false;

                      const nomeCidade = cidade.text.toLowerCase();

                      return nomeCidade.includes("recife") || nomeCidade.includes("olinda");
                    });

                    setSugestoesEndereco(sugestoesFiltradas);
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
          <Button type="submit" variant="contained" sx={{ backgroundColor: "#ff7b00" }} onClick={handleRegisterPedido}>
            Salvar Pedido
          </Button>
        </Box>

      </div>
    </div>
  );
};

export default ModalPedido;
