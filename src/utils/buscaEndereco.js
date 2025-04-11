// utils/buscaEndereco.js
export const buscarEndereco = async (enderecoParcial) => {
  const token = "pk.eyJ1IjoiaGVsaW93OSIsImEiOiJjbTljNDRnazgwZ3BmMmxwdW9nbWk1c3ZmIn0.NR96Um-T_CqTI3jDb7c2OQ"; // substitua pelo seu token público da Mapbox

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(enderecoParcial)}.json?access_token=${token}&country=BR&autocomplete=true&limit=5`
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar endereço na Mapbox");
    }

    const data = await response.json();

    // retorna as sugestões encontradas
    return data.features.map((feature) => ({
      label: feature.place_name,
      cep: feature.context?.find(c => c.id.includes('postcode'))?.text || '',
      bairro: feature.context?.find(c => c.id.includes('neighborhood') || c.id.includes('place'))?.text || '',
      latitude: feature.center[1],
      longitude: feature.center[0],
    }));
  } catch (error) {
    console.error("Erro na busca do endereço:", error);
    return [];
  }
};
