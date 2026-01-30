/**
 * Analytics Proprietário - MapaTur
 *
 * Sistema de tracking customizado que envia eventos para API própria
 */

// Gerar ou recuperar session_id (UUID v4)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('mapatur_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem('mapatur_session_id', sessionId);
  }
  return sessionId;
};

// Gerar UUID v4 simples
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Enviar evento para API (assíncrono, não bloqueia UI)
const sendEvent = async (eventType, eventData) => {
  try {
    const payload = {
      session_id: getSessionId(),
      event_type: eventType,
      event_data: eventData,
    };

    // Usar fetch com keepalive para garantir envio mesmo ao fechar página
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true, // Importante para eventos ao sair da página
    });

    if (import.meta.env.DEV) {
      console.log('[Analytics] Event tracked:', eventType, eventData);
    }
  } catch (error) {
    // Falha silenciosa - não quebrar UX se analytics falhar
    if (import.meta.env.DEV) {
      console.error('[Analytics] Error tracking event:', error);
    }
  }
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
  sendEvent('SEARCH', {
    search_type: tipo,
    search_term: termo,
    results_count: resultados,
  });
};

/**
 * Rastreia visualização de uma unidade turística
 *
 * @param {Object} params
 * @param {number} params.unidadeId - ID da unidade
 * @param {string} params.unidadeNome - Nome da unidade
 * @param {string} params.origem - Origem da visualização ('mapa', 'lista', 'busca')
 */
export const trackVisualizacaoUnidade = ({ unidadeId, unidadeNome, origem = 'mapa' }) => {
  sendEvent('UNIT_VIEW', {
    unit_id: unidadeId,
    unit_name: unidadeNome,
    source: origem,
  });
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
  sendEvent('MAP_CLICK', {
    unit_id: unidadeId,
    unit_name: unidadeNome,
    latitude: latitude,
    longitude: longitude,
  });
};

/**
 * Rastreia clique em contato (telefone/WhatsApp/email/como_chegar)
 *
 * @param {Object} params
 * @param {string} params.tipo - Tipo de contato ('telefone', 'whatsapp', 'email', 'como_chegar')
 * @param {number} params.unidadeId - ID da unidade
 * @param {string} params.unidadeNome - Nome da unidade
 */
export const trackContatoUnidade = ({ tipo, unidadeId, unidadeNome }) => {
  sendEvent('CONTACT_CLICK', {
    contact_type: tipo, // 'whatsapp', 'phone', 'email', 'como_chegar'
    unit_id: unidadeId,
    unit_name: unidadeNome,
  });
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
  sendEvent('SOCIAL_CLICK', {
    social_network: redeSocial,
    unit_id: unidadeId,
    unit_name: unidadeNome,
  });
};

/**
 * Rastreia filtro aplicado no mapa
 *
 * @param {Object} params
 * @param {string} params.tipoFiltro - Tipo do filtro ('especialidade', 'bairro', 'categoria', 'icone')
 * @param {string} params.valorFiltro - Valor do filtro aplicado
 * @param {number} params.resultados - Número de resultados após filtro
 */
export const trackFiltroMapa = ({ tipoFiltro, valorFiltro, resultados = 0 }) => {
  sendEvent('FILTER_APPLIED', {
    filter_type: tipoFiltro,
    filter_value: valorFiltro,
    results_count: resultados,
  });
};

/**
 * Rastreia abertura do popup de detalhes da unidade
 *
 * @param {Object} params
 * @param {number} params.unidadeId - ID da unidade
 * @param {string} params.unidadeNome - Nome da unidade
 */
export const trackAbrirPopup = ({ unidadeId, unidadeNome }) => {
  // Popup é tratado como visualização de unidade
  trackVisualizacaoUnidade({ unidadeId, unidadeNome, origem: 'popup' });
};

/**
 * Rastreia acesso à página de administração (apenas para fins de contagem)
 *
 * @param {string} pagina - Nome da página acessada
 */
export const trackAcessoAdmin = (pagina) => {
  trackPageView(`/admin/${pagina}`, `Admin - ${pagina}`);
};

/**
 * Rastreia erro no frontend
 *
 * @param {Object} params
 * @param {string} params.mensagem - Mensagem do erro
 * @param {string} params.pagina - Página onde ocorreu o erro
 */
export const trackErro = ({ mensagem, pagina }) => {
  sendEvent('ERROR', {
    error_message: mensagem,
    page: pagina,
  });
};

/**
 * Rastreia pageview customizado
 *
 * @param {string} path - Caminho da página
 * @param {string} title - Título da página
 */
export const trackPageView = (path, title) => {
  sendEvent('PAGE_VIEW', {
    page_path: path,
    page_title: title,
  });
};

// Rastrear pageview automaticamente ao carregar (opcional)
if (typeof window !== 'undefined') {
  // Rastrear primeira pageview
  trackPageView(window.location.pathname, document.title);
}
