/**
 * Google Analytics 4 - Helper de Eventos
 *
 * Funções utilitárias para rastrear eventos customizados no GA4
 */

/**
 * Verifica se o gtag está disponível
 */
const isGtagAvailable = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Rastreia uma busca realizada pelo usuário
 *
 * @param {Object} params
 * @param {string} params.tipo - Tipo da busca ('especialidade', 'unidade', 'medico', 'bairro', 'texto_livre')
 * @param {string} params.termo - Termo buscado
 * @param {number} params.resultados - Número de resultados encontrados
 */
export const trackBusca = ({ tipo, termo, resultados = 0 }) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'busca_realizada', {
    search_term: termo,
    search_type: tipo,
    results_count: resultados,
    event_category: 'Busca',
    event_label: `${tipo}: ${termo}`,
  });

  console.log('[Analytics] Busca rastreada:', { tipo, termo, resultados });
};

/**
 * Rastreia visualização de uma unidade de saúde
 *
 * @param {Object} params
 * @param {number} params.unidadeId - ID da unidade
 * @param {string} params.unidadeNome - Nome da unidade
 * @param {string} params.origem - Origem da visualização ('mapa', 'lista', 'busca')
 */
export const trackVisualizacaoUnidade = ({ unidadeId, unidadeNome, origem = 'mapa' }) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'visualizacao_unidade', {
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
    origem: origem,
    event_category: 'Unidade',
    event_label: unidadeNome,
    value: unidadeId,
  });

  console.log('[Analytics] Visualização de unidade rastreada:', { unidadeId, unidadeNome, origem });
};

/**
 * Rastreia clique no mapa
 *
 * @param {Object} params
 * @param {number} params.unidadeId - ID da unidade clicada
 * @param {string} params.unidadeNome - Nome da unidade
 * @param {number} params.latitude - Latitude da unidade
 * @param {number} params.longitude - Longitude da unidade
 */
export const trackCliqueMapaUnidade = ({ unidadeId, unidadeNome, latitude, longitude }) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'clique_mapa', {
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
    latitude: latitude,
    longitude: longitude,
    event_category: 'Mapa',
    event_label: unidadeNome,
  });

  console.log('[Analytics] Clique no mapa rastreado:', { unidadeId, unidadeNome });
};

/**
 * Rastreia clique em contato (telefone/WhatsApp)
 *
 * @param {Object} params
 * @param {string} params.tipo - Tipo de contato ('telefone', 'whatsapp')
 * @param {number} params.unidadeId - ID da unidade
 * @param {string} params.unidadeNome - Nome da unidade
 */
export const trackContatoUnidade = ({ tipo, unidadeId, unidadeNome }) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'contato_unidade', {
    contact_type: tipo,
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
    event_category: 'Contato',
    event_label: `${tipo} - ${unidadeNome}`,
  });

  console.log('[Analytics] Contato rastreado:', { tipo, unidadeId, unidadeNome });
};

/**
 * Rastreia clique em rede social da unidade
 *
 * @param {Object} params
 * @param {string} params.redeSocial - Nome da rede social ('facebook', 'instagram', etc)
 * @param {number} params.unidadeId - ID da unidade
 * @param {string} params.unidadeNome - Nome da unidade
 */
export const trackRedeSocialUnidade = ({ redeSocial, unidadeId, unidadeNome }) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'clique_rede_social', {
    social_network: redeSocial,
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
    event_category: 'Rede Social',
    event_label: `${redeSocial} - ${unidadeNome}`,
  });

  console.log('[Analytics] Rede social rastreada:', { redeSocial, unidadeId, unidadeNome });
};

/**
 * Rastreia filtro aplicado no mapa
 *
 * @param {Object} params
 * @param {string} params.tipoFiltro - Tipo do filtro ('especialidade', 'bairro', 'sala_vacina', 'icone')
 * @param {string} params.valorFiltro - Valor do filtro aplicado
 * @param {number} params.resultados - Número de resultados após filtro
 */
export const trackFiltroMapa = ({ tipoFiltro, valorFiltro, resultados = 0 }) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'filtro_aplicado', {
    filter_type: tipoFiltro,
    filter_value: valorFiltro,
    results_count: resultados,
    event_category: 'Filtro',
    event_label: `${tipoFiltro}: ${valorFiltro}`,
  });

  console.log('[Analytics] Filtro aplicado:', { tipoFiltro, valorFiltro, resultados });
};

/**
 * Rastreia abertura do popup de detalhes da unidade
 *
 * @param {Object} params
 * @param {number} params.unidadeId - ID da unidade
 * @param {string} params.unidadeNome - Nome da unidade
 */
export const trackAbrirPopup = ({ unidadeId, unidadeNome }) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'abrir_popup', {
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
    event_category: 'Popup',
    event_label: unidadeNome,
  });

  console.log('[Analytics] Popup aberto:', { unidadeId, unidadeNome });
};

/**
 * Rastreia acesso à página de administração (apenas para fins de contagem)
 *
 * @param {string} pagina - Nome da página acessada
 */
export const trackAcessoAdmin = (pagina) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'acesso_admin', {
    page_name: pagina,
    event_category: 'Admin',
    event_label: pagina,
  });

  console.log('[Analytics] Acesso admin:', { pagina });
};

/**
 * Rastreia erro no frontend
 *
 * @param {Object} params
 * @param {string} params.mensagem - Mensagem do erro
 * @param {string} params.pagina - Página onde ocorreu o erro
 */
export const trackErro = ({ mensagem, pagina }) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'exception', {
    description: mensagem,
    page: pagina,
    fatal: false,
  });

  console.log('[Analytics] Erro rastreado:', { mensagem, pagina });
};

/**
 * Rastreia pageview customizado (caso precise além do automático)
 *
 * @param {string} path - Caminho da página
 * @param {string} title - Título da página
 */
export const trackPageView = (path, title) => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });

  console.log('[Analytics] Pageview rastreado:', { path, title });
};
