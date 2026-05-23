# Correção - Cache do Cardápio na Comanda

Ajustes aplicados no Movyo Garçom:

- O cardápio agora é pré-carregado automaticamente ao abrir a comanda, não apenas quando o modal de adicionar item é aberto.
- O catálogo é salvo no cache por ID do restaurante e também por slug, evitando perda do cache quando a API retorna identificadores em formatos diferentes.
- A tela de comanda tenta carregar os itens do cache imediatamente antes da requisição online.
- Se o celular estiver sem internet, os produtos do último carregamento online continuam disponíveis para adicionar na comanda.
- A sessão agora normaliza melhor `restaurante._id`, `restaurante.id`, `restauranteId`, `slugIdentificador` e equivalentes.
- Ao puxar para atualizar, a comanda também atualiza o cache do catálogo.

Observação: para o uso offline funcionar, o garçom precisa abrir o app uma vez com internet para baixar e salvar o cardápio localmente.
