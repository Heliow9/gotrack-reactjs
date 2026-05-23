// src/screens/BalcaoScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import NetInfo from "@react-native-community/netinfo";

import { api } from "../api/api";
import { getSession } from "../api/storage/session";
import { cachedApiGet, cacheGetData } from "../utils/smartCache";
import { connectSocket, getSocket } from "../socket/socket";

const CATALOGO_CACHE_KEY = (restauranteId) => `garcom:catalogo:${restauranteId}`;
const buildProdutosEndpoint = (restauranteId) => `/api/produtos/${restauranteId}`;

const money = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
const toNum = (v) => {
  const n = Number(String(v ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const arr = (v) => (Array.isArray(v) ? v : []);
const safeText = (v) => String(v ?? "").trim();
const keyNorm = (v) => safeText(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const pickRestauranteId = (s) => s?.restaurante?._id || s?.restaurante?.id || s?.restaurante?.restauranteId || null;

function normalizeProdutoParaConfig(p) {
  if (!p) return null;
  const extrasObj = p?.extras && typeof p.extras === "object" ? p.extras : {};
  const extrasKeys = Object.keys(extrasObj || {});
  const extrasMapNorm = new Map();
  for (const k of extrasKeys) extrasMapNorm.set(keyNorm(k), k);

  const catNome = safeText(p?.categoria?.nome || p?.categoriaNome || p?.categoria || "");
  const catTipo = safeText(p?.categoriaType || p?.categoria?.tipo || p?.categoriaTipo || "");
  const saboresDireto = arr(p?.saboresDisponiveis).length ? arr(p?.saboresDisponiveis) : arr(p?.sabores);
  const saboresKeyReal = extrasMapNorm.get("sabores") || extrasMapNorm.get("sabor");
  const saboresFromExtras = saboresKeyReal ? arr(extrasObj[saboresKeyReal]) : [];
  const saboresDisponiveis = saboresDireto.length ? saboresDireto : saboresFromExtras;
  const isPizza = keyNorm(catTipo) === "pizza" || keyNorm(catNome).includes("pizza") || (saboresDisponiveis.length > 0 && toNum(p?.maxSabores) > 0);

  const adicionais = arr(p?.adicionais).length ? arr(p?.adicionais) : arr(p?.adicional);
  const bordas = arr(p?.bordasDisponiveis).length ? arr(p?.bordasDisponiveis) : arr(p?.bordas);
  const complementos = arr(p?.complementos);

  const tiposExtrasBase = arr(p?.tiposExtras).map((tipo) => {
    const nomeTipo = safeText(tipo?.nome);
    const chaveReal = extrasMapNorm.get(keyNorm(nomeTipo));
    const itensFromMap = chaveReal ? arr(extrasObj[chaveReal]) : [];
    const itensDireto = arr(tipo?.itens);
    return { ...tipo, itens: itensDireto.length ? itensDireto : itensFromMap };
  });

  const nomesTiposExistentes = new Set(tiposExtrasBase.map((t) => keyNorm(t?.nome)));
  const extrasIgnorar = new Set(["sabores", "sabor"]);
  const tiposExtrasAuto = extrasKeys
    .filter((k) => {
      const kn = keyNorm(k);
      if (extrasIgnorar.has(kn)) return false;
      if (nomesTiposExistentes.has(kn)) return false;
      return arr(extrasObj[k]).length > 0;
    })
    .map((k) => ({ nome: k, obrigatorio: false, tipoSelecion: "multiplo", minimoSelecionados: 0, itens: arr(extrasObj[k]) }));

  return {
    ...p,
    _id: p?._id || p?.id,
    nome: safeText(p?.nome || p?.titulo || p?.name || p?.descricao) || "Produto",
    descricao: safeText(p?.descricao || p?.detalhes || ""),
    precoBase: toNum(p?.precoBase ?? p?.preco ?? p?.valor ?? p?.precoUnitario),
    imagem: safeText(p?.imagem || ""),
    imprimir: !!(p?.imprimir ?? p?.imprimeNaCozinha),
    imprimeNaCozinha: !!(p?.imprimir ?? p?.imprimeNaCozinha),
    categoriaType: isPizza ? "pizza" : catTipo,
    saboresDisponiveis: arr(saboresDisponiveis).map((s) => ({ nome: safeText(s?.nome ?? s?.label ?? s?.title ?? s), preco: toNum(s?.preco) })),
    maxSabores: toNum(p?.maxSabores) || (isPizza ? 1 : 0),
    calculoPrecoPor: safeText(p?.calculoPrecoPor || "maior").toLowerCase(),
    bordasDisponiveis: arr(bordas).map((b) => ({ nome: safeText(b?.nome ?? b?.label ?? b?.title ?? b), preco: toNum(b?.preco) })),
    adicionais: arr(adicionais).map((a) => ({ nome: safeText(a?.nome ?? a?.label ?? a?.title ?? a), preco: toNum(a?.preco) })),
    complementos: arr(complementos).map((c) => ({ nome: safeText(c?.nome ?? c?.label ?? c?.title ?? c), preco: toNum(c?.preco) })),
    tiposExtras: [...tiposExtrasBase, ...tiposExtrasAuto].map((t) => ({
      nome: safeText(t?.nome) || "Extras",
      obrigatorio: !!t?.obrigatorio,
      tipoSelecion: safeText(t?.tipoSelecion || t?.tipoSelecao || "multiplo"),
      minimoSelecionados: toNum(t?.minimoSelecionados || 0),
      maximoSelecionados: t?.maximoSelecionados == null ? undefined : toNum(t?.maximoSelecionados),
      itens: arr(t?.itens).map((i) => ({ nome: safeText(i?.nome ?? i?.label ?? i?.title ?? i), preco: toNum(i?.preco) })),
    })),
  };
}

function normalizeProdutos(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];
  return list.filter((p) => p?.ativo !== false && p?.disponivel !== false).map(normalizeProdutoParaConfig).filter((p) => p?._id && p?.nome);
}


function normalizarTelefoneWhats(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}


function statusPixPago(payload) {
  const raw = String(
    payload?.statusPagamento ||
    payload?.status_pagamento ||
    payload?.status ||
    payload?.mpStatus ||
    payload?.paymentStatus ||
    payload?.pagamento?.status ||
    payload?.pedido?.statusPagamento ||
    payload?.pedido?.status ||
    ""
  ).toLowerCase();

  return Boolean(
    payload?.pago === true ||
    payload?.paid === true ||
    payload?.aprovado === true ||
    raw.includes("pago") ||
    raw.includes("approved") ||
    raw.includes("aprovado")
  );
}

function extrairStatusPix(payload) {
  if (statusPixPago(payload)) return "pago";
  const raw = String(
    payload?.statusPagamento ||
    payload?.status_pagamento ||
    payload?.status ||
    payload?.mpStatus ||
    payload?.paymentStatus ||
    payload?.pagamento?.status ||
    payload?.pedido?.statusPagamento ||
    payload?.pedido?.status ||
    "aguardando_pagamento"
  ).toLowerCase();
  if (raw.includes("cancel")) return "cancelado";
  if (raw.includes("expir")) return "expirado";
  return "aguardando_pagamento";
}

function categoriaProduto(p) {
  const cat = p?.categoria?.nome || p?.categoriaNome || p?.categoria || p?.grupo || p?.secao || "Outros";
  return safeText(typeof cat === "object" ? cat?.nome : cat) || "Outros";
}

function produtoTemOpcoes(p) {
  return !!(
    arr(p?.saboresDisponiveis).length ||
    arr(p?.bordasDisponiveis).length ||
    arr(p?.adicionais).length ||
    arr(p?.complementos).length ||
    arr(p?.tiposExtras).some((t) => arr(t?.itens).length) ||
    safeText(p?.descricao)
  );
}


function normalizarItemParaApi(item) {
  const qtd = Math.max(1, Number(item?.quantidade ?? item?.qtd ?? 1) || 1);
  const unit = toNum(item?.precoUnitario ?? item?.preco ?? item?.valorUnitario ?? item?.valor ?? 0);
  const total = toNum(item?.precoTotal ?? item?.total ?? item?.valorTotal ?? (unit * qtd));
  const nome = safeText(item?.nome || item?.titulo || item?.title || item?.descricao || "Item") || "Item";
  return {
    ...item,
    produtoId: item?.produtoId || item?.produto || item?._id || null,
    produto: item?.produtoId || item?.produto || item?._id || null,
    nome,
    titulo: nome,
    quantidade: qtd,
    qtd,
    precoUnitario: unit,
    preco: unit,
    valorUnitario: unit,
    valor: unit,
    precoTotal: total,
    total,
    valorTotal: total,
    subtotal: total,
    imprimir: item?.imprimir ?? item?.imprimeNaCozinha ?? true,
    imprimeNaCozinha: item?.imprimeNaCozinha ?? item?.imprimir ?? true,
    observacao: safeText(item?.observacao || item?.obs || ""),
    saboresSelecionados: arr(item?.saboresSelecionados),
    bordaSelecionada: item?.bordaSelecionada || null,
    adicionalSelecionado: item?.adicionalSelecionado || null,
    complementosSelecionados: arr(item?.complementosSelecionados),
    tiposExtrasSelecionados: item?.tiposExtrasSelecionados && typeof item.tiposExtrasSelecionados === "object" ? item.tiposExtrasSelecionados : {},
  };
}

function normalizarCarrinhoParaApi(carrinho) {
  return arr(carrinho).map(normalizarItemParaApi).filter((i) => i.nome && Number(i.quantidade) > 0);
}

function resumoItem(item) {
  const parts = [];
  if (arr(item?.saboresSelecionados).length) parts.push(`Sabores: ${item.saboresSelecionados.join(", ")}`);
  if (item?.bordaSelecionada?.nome) parts.push(`Borda: ${item.bordaSelecionada.nome}`);
  if (item?.adicionalSelecionado?.nome) parts.push(`Adicional: ${item.adicionalSelecionado.nome}`);
  if (arr(item?.complementosSelecionados).length) parts.push(`Complementos: ${item.complementosSelecionados.map((c) => c?.nome).filter(Boolean).join(", ")}`);
  if (item?.tiposExtrasSelecionados && typeof item.tiposExtrasSelecionados === "object") {
    Object.entries(item.tiposExtrasSelecionados).forEach(([tipo, itens]) => {
      if (arr(itens).length) parts.push(`${tipo}: ${arr(itens).map((i) => i?.nome).filter(Boolean).join(", ")}`);
    });
  }
  if (safeText(item?.observacao)) parts.push(`Obs: ${safeText(item.observacao)}`);
  return parts.join(" • ");
}

function OptionRow({ label, selected, type = "radio", disabled, onPress }) {
  const iconName = type === "checkbox" ? (selected ? "checkbox" : "square-outline") : selected ? "radio-button-on" : "radio-button-off";
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[styles.optRow, disabled && { opacity: 0.55 }]}>
      <Ionicons name={iconName} size={18} color={selected ? "#ff3b8a" : "#64748b"} />
      <Text style={styles.optLabel}>{label}</Text>
    </Pressable>
  );
}

function ConfigProdutoModal({ visible, produto, onClose, onConfirm }) {
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [bordaSelecionada, setBordaSelecionada] = useState("nenhum");
  const [adicionalSelecionado, setAdicionalSelecionado] = useState("nenhum");
  const [complementosSelecionados, setComplementosSelecionados] = useState([]);
  const [tiposExtrasSelecionados, setTiposExtrasSelecionados] = useState({});
  const [observacao, setObservacao] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!visible) return;
    setSaboresSelecionados([]); setBordaSelecionada("nenhum"); setAdicionalSelecionado("nenhum");
    setComplementosSelecionados([]); setTiposExtrasSelecionados({}); setObservacao(""); setQuantidade(1); setErro("");
  }, [visible, produto?._id]);

  const isPizza = produto?.categoriaType === "pizza" || arr(produto?.saboresDisponiveis).length > 0;
  const maxSabores = Math.max(1, Number(produto?.maxSabores || 1));

  const precoTotal = useMemo(() => {
    if (!produto) return 0;
    let base = toNum(produto.precoBase);
    if (isPizza && arr(produto.saboresDisponiveis).length && saboresSelecionados.length) {
      const valores = saboresSelecionados.map((nome) => toNum(produto.saboresDisponiveis.find((s) => s.nome === nome)?.preco));
      const validos = valores.filter((v) => v > 0);
      if (validos.length) base = produto.calculoPrecoPor === "media" ? validos.reduce((a, b) => a + b, 0) / validos.length : Math.max(...validos);
    }
    let extras = 0;
    if (bordaSelecionada !== "nenhum") extras += toNum(produto.bordasDisponiveis?.find((b) => b.nome === bordaSelecionada)?.preco);
    if (adicionalSelecionado !== "nenhum") extras += toNum(produto.adicionais?.find((a) => a.nome === adicionalSelecionado)?.preco);
    complementosSelecionados.forEach((nome) => { extras += toNum(produto.complementos?.find((c) => c.nome === nome)?.preco); });
    Object.values(tiposExtrasSelecionados || {}).forEach((itens) => arr(itens).forEach((i) => { extras += toNum(i?.preco); }));
    return (base + extras) * Math.max(1, Number(quantidade || 1));
  }, [produto, isPizza, saboresSelecionados, bordaSelecionada, adicionalSelecionado, complementosSelecionados, tiposExtrasSelecionados, quantidade]);

  const confirmar = () => {
    if (!produto) return;
    if (isPizza && arr(produto.saboresDisponiveis).length && saboresSelecionados.length === 0) return setErro("Escolha pelo menos um sabor.");
    for (const tipo of arr(produto.tiposExtras)) {
      const sel = arr(tiposExtrasSelecionados[tipo.nome]);
      if (tipo.obrigatorio && sel.length < Math.max(1, Number(tipo.minimoSelecionados || 1))) return setErro(`Escolha uma opção em ${tipo.nome}.`);
    }
    const qtd = Math.max(1, Number(quantidade || 1));
    const item = {
      produtoId: produto._id,
      localId: `${produto._id}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      nome: produto.nome,
      quantidade: qtd,
      precoUnitario: precoTotal / qtd,
      precoTotal,
      imagem: produto.imagem || "",
      imprimir: !!produto.imprimir,
      imprimeNaCozinha: !!produto.imprimeNaCozinha,
      saboresSelecionados,
      bordaSelecionada: bordaSelecionada === "nenhum" ? null : produto.bordasDisponiveis?.find((b) => b.nome === bordaSelecionada),
      adicionalSelecionado: adicionalSelecionado === "nenhum" ? null : produto.adicionais?.find((a) => a.nome === adicionalSelecionado),
      complementosSelecionados: complementosSelecionados.map((nome) => produto.complementos?.find((c) => c.nome === nome)).filter(Boolean),
      tiposExtrasSelecionados,
      observacao: safeText(observacao),
    };
    onConfirm(item);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%" }}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Configurar item</Text>
                <Text style={styles.modalSub}>{produto?.nome}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.iconCircle}><Ionicons name="close" size={18} color="#0f172a" /></Pressable>
            </View>
            {!!erro && <Text style={styles.warnText}>{erro}</Text>}
            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {isPizza && arr(produto?.saboresDisponiveis).length > 0 && <View style={styles.block}><Text style={styles.blockTitle}>Sabores {maxSabores > 1 ? `(até ${maxSabores})` : ""}</Text>{produto.saboresDisponiveis.map((s, i) => { const checked = saboresSelecionados.includes(s.nome); const disabled = !checked && saboresSelecionados.length >= maxSabores; return <OptionRow key={`${s.nome}-${i}`} type={maxSabores > 1 ? "checkbox" : "radio"} selected={checked} disabled={disabled} label={`${s.nome}${s.preco ? ` (+${money(s.preco)})` : ""}`} onPress={() => { if (maxSabores === 1) setSaboresSelecionados([s.nome]); else setSaboresSelecionados((prev) => checked ? prev.filter((x) => x !== s.nome) : [...prev, s.nome]); }} />; })}</View>}
              {arr(produto?.bordasDisponiveis).length > 0 && <View style={styles.block}><Text style={styles.blockTitle}>Borda</Text><OptionRow selected={bordaSelecionada === "nenhum"} label="Sem borda" onPress={() => setBordaSelecionada("nenhum")} />{produto.bordasDisponiveis.map((b, i) => <OptionRow key={`${b.nome}-${i}`} selected={bordaSelecionada === b.nome} label={`${b.nome} (+${money(b.preco)})`} onPress={() => setBordaSelecionada(b.nome)} />)}</View>}
              {arr(produto?.adicionais).length > 0 && <View style={styles.block}><Text style={styles.blockTitle}>Adicional</Text><OptionRow selected={adicionalSelecionado === "nenhum"} label="Sem adicional" onPress={() => setAdicionalSelecionado("nenhum")} />{produto.adicionais.map((a, i) => <OptionRow key={`${a.nome}-${i}`} selected={adicionalSelecionado === a.nome} label={`${a.nome} (+${money(a.preco)})`} onPress={() => setAdicionalSelecionado(a.nome)} />)}</View>}
              {arr(produto?.tiposExtras).map((tipo, idx) => { const itens = arr(tipo.itens).filter((x) => safeText(x?.nome)); if (!itens.length) return null; const sel = arr(tiposExtrasSelecionados[tipo.nome]); const unico = keyNorm(tipo.tipoSelecion).includes("unico"); const max = tipo.maximoSelecionados; return <View key={`${tipo.nome}-${idx}`} style={styles.block}><Text style={styles.blockTitle}>{tipo.nome}{tipo.obrigatorio ? " *" : ""}</Text>{!tipo.obrigatorio && unico && <OptionRow selected={sel.length === 0} label="Nenhum" onPress={() => setTiposExtrasSelecionados((prev) => ({ ...prev, [tipo.nome]: [] }))} />}{itens.map((it, i) => { const checked = sel.some((x) => x?.nome === it.nome); const disabled = !checked && !unico && max != null && sel.length >= Number(max); return <OptionRow key={`${it.nome}-${i}`} type={unico ? "radio" : "checkbox"} selected={checked} disabled={disabled} label={`${it.nome} (+${money(it.preco)})`} onPress={() => { const next = unico ? [it] : checked ? sel.filter((x) => x?.nome !== it.nome) : [...sel, it]; setTiposExtrasSelecionados((prev) => ({ ...prev, [tipo.nome]: next })); }} />; })}</View>; })}
              {arr(produto?.complementos).length > 0 && <View style={styles.block}><Text style={styles.blockTitle}>Complementos</Text>{produto.complementos.map((c, i) => { const checked = complementosSelecionados.includes(c.nome); return <OptionRow key={`${c.nome}-${i}`} type="checkbox" selected={checked} label={`${c.nome} (+${money(c.preco)})`} onPress={() => setComplementosSelecionados((prev) => checked ? prev.filter((x) => x !== c.nome) : [...prev, c.nome])} />; })}</View>}
              <View style={styles.block}><Text style={styles.blockTitle}>Observação</Text><TextInput value={observacao} onChangeText={setObservacao} placeholder="Ex: sem cebola" style={styles.input} multiline /></View>
              <View style={styles.block}><Text style={styles.blockTitle}>Quantidade</Text><View style={styles.stepper}><Pressable style={styles.stepBtn} onPress={() => setQuantidade((q) => Math.max(1, Number(q || 1) - 1))}><Ionicons name="remove" size={18} /></Pressable><Text style={styles.stepValue}>{quantidade}</Text><Pressable style={styles.stepBtn} onPress={() => setQuantidade((q) => Math.min(99, Number(q || 1) + 1))}><Ionicons name="add" size={18} /></Pressable></View></View>
            </ScrollView>
            <View style={styles.configFooter}><View style={{ flex: 1 }}><Text style={styles.configFooterLabel}>Total</Text><Text style={styles.configFooterTotal}>{money(precoTotal)}</Text></View><Pressable onPress={confirmar} style={styles.primaryBtn}><Text style={styles.primaryText}>Adicionar</Text></Pressable></View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function BalcaoScreen({ navigation }) {
  const [session, setSession] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cliente, setCliente] = useState("Cliente balcão");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState("dinheiro");
  const [carrinho, setCarrinho] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pix, setPix] = useState(null);
  const [online, setOnline] = useState(true);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [categoriaAberta, setCategoriaAberta] = useState(null);
  const [pixStatus, setPixStatus] = useState("idle");
  const [pixChecking, setPixChecking] = useState(false);
  const [pixPagoConfirmado, setPixPagoConfirmado] = useState(false);
  const [banner, setBanner] = useState(null);
  const pixPagoRef = useRef(false);
  const pixPollRef = useRef(null);

  const restauranteId = pickRestauranteId(session);

  const loadProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const s = await getSession();
      setSession(s || null);
      const rid = pickRestauranteId(s);
      if (!rid) return;
      const cached = await cacheGetData(CATALOGO_CACHE_KEY(rid), null);
      if (cached) setProdutos(normalizeProdutos(cached));
      const result = await cachedApiGet({ key: CATALOGO_CACHE_KEY(rid), request: () => api.get(buildProdutosEndpoint(rid)), fallback: cached || [] });
      setProdutos(normalizeProdutos(result.data));
    } catch (e) {
      Alert.alert("Ops", "Não consegui carregar o catálogo. Se já abriu antes, tente no modo offline/cache.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProdutos();
    const unsub = NetInfo.addEventListener((st) => setOnline(!!st?.isConnected && st?.isInternetReachable !== false));
    return () => unsub?.();
  }, [loadProdutos]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return produtos;
    return produtos.filter((p) => `${p.nome} ${categoriaProduto(p)}`.toLowerCase().includes(n));
  }, [produtos, q]);

  const categorias = useMemo(() => {
    const map = new Map();
    produtos.forEach((p) => {
      const nome = categoriaProduto(p);
      if (!map.has(nome)) map.set(nome, []);
      map.get(nome).push(p);
    });
    return Array.from(map.entries())
      .map(([nome, itens]) => ({ nome, itens }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [produtos]);

  const produtosDaCategoria = useMemo(() => {
    if (!categoriaAberta) return [];
    return produtos.filter((p) => categoriaProduto(p) === categoriaAberta);
  }, [produtos, categoriaAberta]);

  const total = useMemo(() => carrinho.reduce((acc, it) => acc + Number(it.precoTotal || 0), 0), [carrinho]);

  const addProdutoDireto = (p) => {
    setCarrinho((prev) => [...prev, { produtoId: p._id, localId: `${p._id}_${Date.now()}_${Math.random().toString(16).slice(2)}`, nome: p.nome, quantidade: 1, precoUnitario: Number(p.precoBase || 0), precoTotal: Number(p.precoBase || 0), imagem: p.imagem || "", imprimir: !!p.imprimir, imprimeNaCozinha: !!p.imprimir }]);
  };

  const addProduto = (p) => {
    if (produtoTemOpcoes(p)) { setSelectedProduto(p); setConfigOpen(true); return; }
    addProdutoDireto(p);
    setCategoriaAberta(null);
  };

  const removeItem = (localId) => setCarrinho((prev) => prev.filter((x) => x.localId !== localId));

  const finalizar = async () => {
    if (!restauranteId) return Alert.alert("Sessão", "Restaurante não encontrado na sessão.");
    if (!carrinho.length) return Alert.alert("Carrinho vazio", "Adicione pelo menos um item.");
    if (!online) return Alert.alert("Offline", "Pedido de balcão com pagamento precisa de internet para gerar pagamento/sincronizar agora.");
    try {
      setSaving(true); setPix(null); setPixStatus("idle"); setPixPagoConfirmado(false); pixPagoRef.current = false;
      const itensApi = normalizarCarrinhoParaApi(carrinho);
      const totalApi = itensApi.reduce((acc, it) => acc + toNum(it.precoTotal), 0);
      const telefoneLimpo = normalizarTelefoneWhats(telefone);
      const aberto = await api.post("/api/garcons/app/balcao", { restauranteId, nomeCliente: cliente || "Cliente balcão", telefoneCliente: telefoneLimpo, telefoneOriginal: telefone, itens: itensApi, total: totalApi, valorTotal: totalApi });
      const pedido = aberto.data?.pedido || aberto.data;
      const pedidoId = pedido?._id || pedido?.id;
      if (!pedidoId) throw new Error("API não retornou pedidoId.");
      if (!Array.isArray(pedido?.itens) || pedido.itens.length === 0) {
        await api.post(`/api/garcons/app/balcao/${pedidoId}/itens`, { itens: itensApi, total: totalApi, valorTotal: totalApi });
      }
      if (pagamento === "dinheiro") {
        await api.post(`/api/garcons/app/balcao/${pedidoId}/pagamento`, { metodo: "dinheiro", valor: totalApi, total: totalApi, valorTotal: totalApi, itens: itensApi });
        Alert.alert("Pedido criado", "Pedido de balcão lançado e pago em dinheiro.");
        setCarrinho([]); setTelefone(""); setCliente("Cliente balcão");
        return;
      }
      const pixRes = await api.post(`/api/garcons/app/balcao/${pedidoId}/pix`, { valor: totalApi, total: totalApi, valorTotal: totalApi, telefoneCliente: telefoneLimpo, telefoneOriginal: telefone, itens: itensApi });
      setPix({ ...(pixRes.data || {}), pedidoId, valor: totalApi });
      setPixStatus("aguardando_pagamento");
      setBanner({ type: "waiting", title: "PIX aguardando pagamento", message: "Mostre o QR Code ou envie para o cliente. A tela confirma automaticamente quando pagar." });
      Alert.alert("PIX gerado", "Mostre o QR Code ou envie o link/copia e cola para o cliente.");
    } catch (e) {
      Alert.alert("Erro", e?.response?.data?.message || e?.message || "Falha ao criar pedido de balcão.");
    } finally { setSaving(false); }
  };

  const confirmarPixPago = useCallback((payload = {}) => {
    if (pixPagoRef.current) return;
    pixPagoRef.current = true;
    setPixStatus("pago");
    setPixPagoConfirmado(true);
    setBanner({ type: "success", title: "Pagamento aprovado", message: "PIX confirmado. Pedido enviado para produção." });
    Vibration.vibrate([0, 120, 80, 160]);
  }, []);

  const verificarPixAgora = useCallback(async ({ silent = false } = {}) => {
    if (!pix?.pedidoId || pixPagoRef.current) return;
    try {
      if (!silent) setPixChecking(true);
      const endpoints = [
        `/api/garcons/app/balcao/${pix.pedidoId}/pix/status`,
        `/api/garcons/app/balcao/${pix.pedidoId}/pix`,
        `/api/garcons/app/balcao/${pix.pedidoId}`,
      ];

      let data = null;
      for (const endpoint of endpoints) {
        try {
          const res = await api.get(endpoint);
          data = res?.data;
          break;
        } catch (_) {}
      }

      if (!data) {
        if (!silent) Alert.alert("PIX", "Não consegui consultar o status agora.");
        return;
      }

      const status = extrairStatusPix(data);
      setPixStatus(status);
      if (statusPixPago(data)) confirmarPixPago(data);
      else if (!silent) Alert.alert("PIX", "Ainda aguardando confirmação do pagamento.");
    } finally {
      if (!silent) setPixChecking(false);
    }
  }, [pix?.pedidoId, confirmarPixPago]);

  useEffect(() => {
    if (!pix?.pedidoId || pixPagoConfirmado) return undefined;
    if (pixPollRef.current) clearInterval(pixPollRef.current);
    pixPollRef.current = setInterval(() => verificarPixAgora({ silent: true }), 4000);
    verificarPixAgora({ silent: true });
    return () => {
      if (pixPollRef.current) clearInterval(pixPollRef.current);
      pixPollRef.current = null;
    };
  }, [pix?.pedidoId, pixPagoConfirmado, verificarPixAgora]);

  useEffect(() => {
    if (!restauranteId || !pix?.pedidoId) return undefined;
    const socket = connectSocket(restauranteId);
    const onPagamento = (payload = {}) => {
      const id = payload?.pedidoId || payload?._id || payload?.id || payload?.pedido?._id || payload?.pedido?.id;
      if (String(id || "") !== String(pix.pedidoId)) return;
      setPixStatus(extrairStatusPix(payload));
      if (statusPixPago(payload)) confirmarPixPago(payload);
    };
    ["pedidoAtualizado", "pagamentoAtualizado", "pixPago", "balcaoAtualizado"].forEach((ev) => socket?.on?.(ev, onPagamento));
    return () => {
      const current = getSocket();
      ["pedidoAtualizado", "pagamentoAtualizado", "pixPago", "balcaoAtualizado"].forEach((ev) => current?.off?.(ev, onPagamento));
    };
  }, [restauranteId, pix?.pedidoId, confirmarPixPago]);

  const copiarPix = async () => { const code = pix?.qrCode || pix?.copiaCola || ""; if (!code) return; await Clipboard.setStringAsync(code); Alert.alert("Copiado", "Código PIX copia e cola copiado."); };
  const enviarWhats = async () => {
    if (!pix?.pedidoId) return;
    const telefoneLimpo = normalizarTelefoneWhats(telefone);
    if (!telefoneLimpo) return Alert.alert("Telefone", "Informe o telefone do cliente com DDD. Ex: 81994262615.");
    try {
      await api.post(`/api/garcons/app/balcao/${pix.pedidoId}/pix/enviar-whatsapp`, {
        telefoneCliente: telefoneLimpo,
        telefoneOriginal: telefone,
        nomeCliente: cliente || "Cliente balcão",
        total,
        itens: normalizarCarrinhoParaApi(carrinho),
        pixCopiaCola: pix?.qrCode || pix?.copiaCola || "",
      });
      Alert.alert("Enviado", `PIX enviado para +${telefoneLimpo}.`);
    } catch (e) {
      Alert.alert("Erro", e?.response?.data?.message || "Não consegui enviar pelo WhatsApp. Confira se o número tem DDD e se o bot está conectado.");
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="chevron-back" size={22} color="#fff" /></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.title}>Pedido de balcão</Text><Text style={styles.sub}>Lançar item, escolher pagamento e gerar PIX</Text></View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: carrinho.length && !pix ? 148 : 34 }]}>
        {!online && <Text style={styles.offline}>Sem internet: catálogo pode vir do cache, mas pagamento PIX/dinheiro precisa sincronizar online.</Text>}

        <View style={styles.card}>
          <View style={styles.formHeader}>
            <View style={styles.formIcon}><Ionicons name="person-outline" size={18} color="#083358" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardKicker}>Dados rápidos</Text>
              <Text style={styles.cardTitle}>Cliente e pagamento</Text>
            </View>
          </View>
          <Text style={styles.label}>Cliente</Text>
          <TextInput value={cliente} onChangeText={setCliente} style={styles.input} placeholder="Nome do cliente" />
          <Text style={styles.label}>Telefone para link/PIX</Text>
          <TextInput value={telefone} onChangeText={setTelefone} style={styles.input} placeholder="DDD + número. Ex: 81994262615" keyboardType="phone-pad" />
          <Text style={styles.label}>Pagamento</Text>
          <View style={styles.payRow}>{["dinheiro", "pix"].map((m) => (<Pressable key={m} onPress={() => setPagamento(m)} style={[styles.payBtn, pagamento === m && styles.payActive]}><Ionicons name={m === "pix" ? "qr-code-outline" : "cash-outline"} size={16} color={pagamento === m ? "#fff" : "#083358"} /><Text style={[styles.payText, pagamento === m && styles.payTextActive]}>{m.toUpperCase()}</Text></Pressable>))}</View>
        </View>

        <TextInput value={q} onChangeText={setQ} style={styles.search} placeholder="Buscar produto ou categoria..." />

        {loading ? <ActivityIndicator /> : q.trim() ? (
          <View>
            <Text style={styles.sectionTitle}>Resultado da busca</Text>
            {filtered.map((p) => (<Pressable key={p._id} onPress={() => addProduto(p)} style={styles.product}>{p.imagem ? <Image source={{ uri: p.imagem }} style={styles.img} /> : <View style={styles.imgFallback}><Ionicons name="fast-food-outline" size={20} color="#64748b" /></View>}<View style={{ flex: 1 }}><Text style={styles.prodName}>{p.nome}</Text><Text style={styles.prodSub}>{categoriaProduto(p)} • {money(p.precoBase)} {p.imprimir ? "• produção" : ""}{produtoTemOpcoes(p) ? " • opções" : ""}</Text></View><Ionicons name="add-circle" size={28} color="#ff3b8a" /></Pressable>))}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <View style={styles.categoryGrid}>
              {categorias.map((cat, idx) => (
                <Pressable key={cat.nome} onPress={() => setCategoriaAberta(cat.nome)} style={styles.categoryCard}>
                  <View style={styles.categoryIcon}><Ionicons name={idx % 2 ? "restaurant-outline" : "fast-food-outline"} size={20} color="#ff3b8a" /></View>
                  <Text style={styles.categoryName} numberOfLines={2}>{cat.nome}</Text>
                  <Text style={styles.categoryCount}>{cat.itens.length} item(ns)</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Carrinho</Text>
            <Text style={styles.cartBadge}>{carrinho.length} item(ns)</Text>
          </View>
          {!carrinho.length ? <Text style={styles.empty}>Nenhum item lançado.</Text> : carrinho.map((it) => (<View key={it.localId || it.produtoId} style={styles.cartRow}><View style={{ flex: 1 }}><Text style={styles.cartItem}>{it.quantidade}x {it.nome}</Text>{!!resumoItem(it) && <Text style={styles.cartDesc}>{resumoItem(it)}</Text>}</View><Text style={styles.cartPrice}>{money(it.precoTotal)}</Text><Pressable onPress={() => removeItem(it.localId)} style={styles.trashBtn}><Ionicons name="trash-outline" size={19} color="#ef4444" /></Pressable></View>))}
        </View>

        {banner ? (
          <View style={[styles.banner, banner.type === "success" ? styles.bannerSuccess : styles.bannerWaiting]}>
            <Ionicons name={banner.type === "success" ? "checkmark-circle" : "time-outline"} size={24} color={banner.type === "success" ? "#16a34a" : "#b45309"} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerText}>{banner.message}</Text>
            </View>
          </View>
        ) : null}

        {pix ? (
          <View style={[styles.card, pixPagoConfirmado && styles.pixPaidCard]}>
            <View style={styles.pixStatusHeader}>
              <View style={[styles.pixStatusIcon, pixPagoConfirmado ? styles.pixStatusIconPaid : styles.pixStatusIconWaiting]}>
                <Ionicons name={pixPagoConfirmado ? "checkmark" : "qr-code-outline"} size={22} color={pixPagoConfirmado ? "#16a34a" : "#ff3b8a"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartTitle}>{pixPagoConfirmado ? "PIX pago" : "PIX aguardando pagamento"} • {money(pix.valor || total)}</Text>
                <Text style={styles.pixHint}>{pixPagoConfirmado ? "Pagamento confirmado. Pedido enviado para produção." : "A confirmação é automática. O QR Code fica visível enquanto estiver pendente."}</Text>
              </View>
              <Text style={[styles.pixBadge, pixPagoConfirmado ? styles.pixBadgePaid : styles.pixBadgeWaiting]}>{pixPagoConfirmado ? "PAGO" : "PENDENTE"}</Text>
            </View>

            {!pixPagoConfirmado && pix.qrCodeBase64 ? <Image source={{ uri: `data:image/png;base64,${pix.qrCodeBase64}` }} style={styles.qr} /> : null}
            {pixPagoConfirmado ? (
              <View style={styles.paidBox}>
                <Ionicons name="rocket-outline" size={22} color="#16a34a" />
                <Text style={styles.paidBoxText}>Pedido liberado para produção.</Text>
              </View>
            ) : (
              <>
                <Pressable onPress={verificarPixAgora} style={styles.secondary} disabled={pixChecking}>
                  {pixChecking ? <ActivityIndicator color="#083358" /> : <Text style={styles.secondaryText}>Verificar pagamento agora</Text>}
                </Pressable>
                <Pressable onPress={copiarPix} style={styles.secondary}><Text style={styles.secondaryText}>Copiar PIX copia e cola</Text></Pressable>
                <Pressable onPress={enviarWhats} style={styles.secondary}><Text style={styles.secondaryText}>Enviar resumo + PIX para WhatsApp</Text></Pressable>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      {carrinho.length > 0 && !pix ? (
        <View style={styles.bottomBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomLabel}>Total do balcão</Text>
            <Text style={styles.bottomTotal}>{money(total)}</Text>
            <Text style={styles.bottomPay}>{pagamento === "pix" ? "PIX aguardará confirmação automática" : "Dinheiro confirma na hora"}</Text>
          </View>
          <Pressable onPress={finalizar} disabled={saving || !carrinho.length} style={[styles.finishSticky, (saving || !carrinho.length) && styles.disabled]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.finishText}>{pagamento === "pix" ? "Gerar PIX" : "Confirmar"}</Text>}
          </Pressable>
        </View>
      ) : null}

      <Modal visible={!!categoriaAberta} transparent animationType="slide" onRequestClose={() => setCategoriaAberta(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{categoriaAberta}</Text>
                <Text style={styles.modalSub}>{produtosDaCategoria.length} item(ns) disponíveis</Text>
              </View>
              <Pressable onPress={() => setCategoriaAberta(null)} style={styles.iconCircle}><Ionicons name="close" size={18} color="#0f172a" /></Pressable>
            </View>
            <FlatList
              data={produtosDaCategoria}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
              renderItem={({ item: p }) => (
                <Pressable onPress={() => addProduto(p)} style={styles.product}>
                  {p.imagem ? <Image source={{ uri: p.imagem }} style={styles.img} /> : <View style={styles.imgFallback}><Ionicons name="fast-food-outline" size={20} color="#64748b" /></View>}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName}>{p.nome}</Text>
                    <Text style={styles.prodSub}>{money(p.precoBase)} {p.imprimir ? "• produção" : ""}{produtoTemOpcoes(p) ? " • opções" : ""}</Text>
                  </View>
                  <Ionicons name="add-circle" size={28} color="#ff3b8a" />
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
      <ConfigProdutoModal visible={configOpen} produto={selectedProduto} onClose={() => setConfigOpen(false)} onConfirm={(item) => { setCarrinho((prev) => [...prev, item]); setConfigOpen(false); setCategoriaAberta(null); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f7fb" },
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 18, backgroundColor: "#083358", flexDirection: "row", gap: 12, alignItems: "center" },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 21, fontWeight: "900" },
  sub: { color: "rgba(255,255,255,0.78)", fontWeight: "700", marginTop: 2 },
  content: { padding: 14, paddingBottom: 34 },
  offline: { backgroundColor: "#fffbeb", borderColor: "#fde68a", borderWidth: 1, color: "#92400e", padding: 12, borderRadius: 16, fontWeight: "800", marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  label: { color: "#334155", fontWeight: "900", marginBottom: 6, marginTop: 8 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 16, paddingHorizontal: 12, color: "#0f172a", fontWeight: "800" },
  search: { backgroundColor: "#fff", minHeight: 50, borderRadius: 18, paddingHorizontal: 14, marginBottom: 12, fontWeight: "800", borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  payRow: { flexDirection: "row", gap: 10 },
  payBtn: { flex: 1, minHeight: 44, borderRadius: 16, borderWidth: 1, borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  payActive: { backgroundColor: "#ff3b8a", borderColor: "#ff3b8a" },
  payText: { color: "#083358", fontWeight: "900" },
  payTextActive: { color: "#fff" },

  formHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  formIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#eef6ff", alignItems: "center", justifyContent: "center" },
  cardKicker: { color: "#64748b", fontWeight: "900", fontSize: 11, textTransform: "uppercase" },
  cardTitle: { color: "#0f172a", fontWeight: "900", fontSize: 17, marginTop: 1 },
  sectionTitle: { color: "#0f172a", fontSize: 18, fontWeight: "900", marginBottom: 10, marginTop: 2 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  categoryCard: { width: "48%", minHeight: 118, backgroundColor: "#fff", borderRadius: 22, padding: 13, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)", justifyContent: "space-between" },
  categoryIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: "#fff1f6", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  categoryName: { color: "#0f172a", fontWeight: "900", fontSize: 15, minHeight: 36 },
  categoryCount: { color: "#64748b", fontWeight: "800", marginTop: 6 },
  categoryModal: { backgroundColor: "#fff", borderRadius: 26, padding: 14, width: "100%", maxHeight: "88%" },
  cartHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cartBadge: { color: "#083358", fontWeight: "900", backgroundColor: "#eef6ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  trashBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#fff1f2", alignItems: "center", justifyContent: "center" },
  pixHint: { color: "#64748b", fontWeight: "800", marginTop: -4, marginBottom: 8 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  bottomLabel: { color: "#64748b", fontWeight: "900", fontSize: 12 },
  bottomTotal: { color: "#0f172a", fontWeight: "900", fontSize: 22, marginTop: 1 },
  bottomPay: { color: "#64748b", fontWeight: "800", fontSize: 12, marginTop: 2 },
  finishSticky: { minHeight: 52, minWidth: 132, borderRadius: 18, backgroundColor: "#ff3b8a", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  product: { backgroundColor: "#fff", borderRadius: 20, padding: 10, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  img: { width: 54, height: 54, borderRadius: 14, backgroundColor: "#e2e8f0" },
  imgFallback: { width: 54, height: 54, borderRadius: 14, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  prodName: { color: "#0f172a", fontWeight: "900" },
  prodSub: { color: "#64748b", fontWeight: "800", marginTop: 3 },
  cartTitle: { color: "#0f172a", fontSize: 17, fontWeight: "900", marginBottom: 10 },
  empty: { color: "#64748b", fontWeight: "800" },
  cartRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: "rgba(15,23,42,0.06)", paddingVertical: 5 },
  cartItem: { color: "#0f172a", fontWeight: "900" },
  cartDesc: { color: "#64748b", fontWeight: "700", marginTop: 2, fontSize: 12 },
  cartPrice: { color: "#083358", fontWeight: "900" },
  finish: { minHeight: 50, borderRadius: 18, backgroundColor: "#ff3b8a", alignItems: "center", justifyContent: "center", marginTop: 14 },
  finishText: { color: "#fff", fontWeight: "900" },
  disabled: { opacity: 0.55 },
  secondary: { minHeight: 46, borderRadius: 16, backgroundColor: "#eef6ff", alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondaryText: { color: "#083358", fontWeight: "900" },
  qr: { width: 220, height: 220, alignSelf: "center", marginVertical: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", alignItems: "center", justifyContent: "flex-end", padding: 12 },
  modalCard: { backgroundColor: "#fff", borderRadius: 26, padding: 14, width: "100%", maxHeight: "92%" },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  modalTitle: { color: "#0f172a", fontSize: 19, fontWeight: "900" },
  modalSub: { color: "#64748b", fontWeight: "800", marginTop: 2 },
  iconCircle: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  warnText: { backgroundColor: "#fffbeb", color: "#92400e", fontWeight: "900", padding: 10, borderRadius: 14, marginVertical: 8 },
  block: { marginTop: 12, padding: 10, borderRadius: 18, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "rgba(15,23,42,0.07)" },
  blockTitle: { color: "#0f172a", fontWeight: "900", marginBottom: 8 },
  optRow: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: "rgba(15,23,42,0.05)" },
  optLabel: { flex: 1, color: "#334155", fontWeight: "800" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  stepValue: { fontSize: 18, fontWeight: "900", color: "#0f172a", minWidth: 34, textAlign: "center" },
  configFooter: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(15,23,42,0.08)", paddingTop: 12 },
  configFooterLabel: { color: "#64748b", fontWeight: "800" },
  configFooterTotal: { color: "#0f172a", fontSize: 20, fontWeight: "900" },
  primaryBtn: { minHeight: 48, borderRadius: 17, backgroundColor: "#ff3b8a", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryText: { color: "#fff", fontWeight: "900" },
});
