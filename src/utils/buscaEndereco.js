const MAPBOX_TOKEN = "SUA_CHAVE_DO_MAPBOX"; // Substitua aqui

export const buscarEndereco = async (endereco) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(endereco)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const lugar = data.features[0];
      const contexto = lugar.context || [];
      const bairro = contexto.find((c) => c.id.includes("neighborhood"))?.text || "";
      const cep = contexto.find((c) => c.id.includes("postcode"))?.text || "";

      return {
        latitude: lugar.center[1],
        longitude: lugar.center[0],
        bairro,
        cep,
      };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar endereço:", error);
    return null;
  }
};
