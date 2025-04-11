import React, { useState } from "react";
import { buscarEndereco } from "../utils/buscaEndereco";
import MiniMapa from "./MiniMapa";
import "./ModalPedido.css";

const ModalPedido = ({ isOpen, onClose }) => {
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
        <h3>Novo Pedido</h3>
        <form onSubmit={handleSubmit}>
          <input name="nome" placeholder="Nome do Cliente" onChange={handleChange} />
          <input name="telefone" placeholder="Telefone" onChange={handleChange} />
          <input name="valor" placeholder="Valor do Pedido" onChange={handleChange} />
          <input name="pagamento" placeholder="Forma de Pagamento" onChange={handleChange} />
          <textarea name="descricao" placeholder="Descrição" onChange={handleChange} />

          <input name="endereco" placeholder="Endereço" onChange={handleEnderecoChange} />
          <input name="numero" placeholder="Número" onChange={handleChange} />
          <input name="complemento" placeholder="Complemento" onChange={handleChange} />
          <input name="pontoReferencia" placeholder="Ponto de Referência" onChange={handleChange} />

          <input value={formData.bairro || ""} placeholder="Bairro" readOnly />
          <input value={formData.cep || ""} placeholder="CEP" readOnly />

          {formData.latitude && formData.longitude && (
            <MiniMapa latitude={formData.latitude} longitude={formData.longitude} />
          )}

          <button type="submit">Salvar Pedido</button>
          <button type="button" onClick={onClose}>Fechar</button>
        </form>
      </div>
    </div>
  );
};

export default ModalPedido;
