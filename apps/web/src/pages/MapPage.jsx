import { useState, useMemo, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, Tooltip } from 'react-leaflet'
import { Spin, Tag, Divider, Empty, Button, Modal, Badge, Alert, Select, Card, Input } from 'antd'
import {
  EnvironmentOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  WhatsAppOutlined,
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LinkOutlined,
  CloseCircleOutlined,
  CompassOutlined,
  MailOutlined,
  BookOutlined,
} from '@ant-design/icons'
import L from 'leaflet'

// Normaliza uma URL removendo origem quando existir (compara apenas o path)
const normalizePath = (url) => {
  if (!url) return ''
  try {
    if (url.startsWith('http')) {
      const parsed = new URL(url)
      return parsed.pathname + (parsed.search || '')
    }
  } catch (e) {
    // fallthrough
  }
  return url
}

// Função para normalizar texto removendo acentos e convertendo para minúsculas
const normalizeText = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}
import { useGetUnidadesQuery, useGetUnidadeMedicosQuery, useGetLastUpdateQuery, useGetIconesQuery, useGetOfertasEnsinoQuery } from '../store/slices/apiSlice'
import MapLegend from '../components/MapLegend'
import 'leaflet/dist/leaflet.css'
import { trackBusca, trackVisualizacaoUnidade, trackCliqueMapaUnidade, trackContatoUnidade, trackRedeSocialUnidade, trackFiltroMapa } from '../utils/analytics'

// Custom Marker component to handle zoom on click and hover effects
const CustomMarker = ({ unidade, onClick, customIcon, isSelected }) => {
  const map = useMap()
  const markerRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    // Zoom moderado que mantém ícones visíveis
    const targetZoom = 16
    
    // Aplica zoom com animação suave, centralizando no marcador
    map.flyTo([unidade.latitude, unidade.longitude], targetZoom, {
      duration: 0.8,
      easeLinearity: 0.25
    })
    
    onClick(unidade)
  }

  // Tamanhos dos ícones: normal, hover e selecionado (aumentados para melhor visibilidade)
  const getIconSize = () => {
    if (isSelected) return [55, 82] // Ícone selecionado bem maior
    if (isHovered) return [45, 67] // Ícone no hover maior
    return [35, 57] // Ícone normal maior que antes (era 25x41)
  }

  const getIconAnchor = () => {
    if (isSelected) return [27.5, 82]
    if (isHovered) return [22.5, 67]
    return [17.5, 57]
  }

  const getShadowSize = () => {
    if (isSelected) return [90, 90]
    if (isHovered) return [65, 65]
    return [50, 50]
  }

  // Criar ícone com tamanho dinâmico
  const icon = customIcon ? L.icon({
    iconUrl: customIcon.options.iconUrl,
    iconSize: getIconSize(),
    iconAnchor: getIconAnchor(),
    popupAnchor: [0, -getIconSize()[1]],
    className: isHovered ? 'marker-hover' : '',
  }) : L.icon({
    iconUrl: '/marker-icon.png',
    iconSize: getIconSize(),
    iconAnchor: getIconAnchor(),
    popupAnchor: [1, -34],
    shadowUrl: '/marker-shadow.png',
    shadowSize: getShadowSize(),
    className: isHovered ? 'marker-hover' : '',
  })

  return (
    <Marker
      ref={markerRef}
      position={[unidade.latitude, unidade.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false),
      }}
    >
      <Tooltip
        direction="top"
        offset={[0, -40]}
        opacity={1}
        permanent={false}
        className="custom-tooltip"
      >
        <div style={{
          padding: '10px 14px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#202124',
          textAlign: 'center',
          minWidth: '100px',
          maxWidth: '280px',
          lineHeight: '1.4',
          whiteSpace: 'normal',
        }}>
          {unidade.nome}
          {unidade.bairro && (
            <div style={{
              fontSize: '11px',
              color: '#5f6368',
              marginTop: '4px',
              fontWeight: '400',
            }}>
              {unidade.bairro}
            </div>
          )}
        </div>
      </Tooltip>
    </Marker>
  )
}

// Component to reset map view when going back to search
const MapViewController = ({ selectedUnidade, filteredUnidades, selectedIconUrl }) => {
  const map = useMap()

  useEffect(() => {
    // When selectedUnidade becomes null (user clicked back button), reset map view
    if (!selectedUnidade) {
      map.flyTo(CORUMBA_CONFIG.center, CORUMBA_CONFIG.zoom, {
        duration: 1.5, // Animation duration in seconds
      })
    }
  }, [selectedUnidade, map])

  // Centralizar quando filtro de ícone é aplicado
  useEffect(() => {
    if (selectedIconUrl && filteredUnidades && filteredUnidades.length > 0) {
      const validUnidades = filteredUnidades.filter(u => u.latitude && u.longitude)
      
      if (validUnidades.length === 0) return

      if (validUnidades.length === 1) {
        // Uma única unidade: centralizar nela
        const unidade = validUnidades[0]
        map.flyTo([unidade.latitude, unidade.longitude], 16, {
          duration: 1.5,
        })
      } else {
        // Múltiplas unidades: ajustar bounds para mostrar todas
        const bounds = L.latLngBounds(
          validUnidades.map(u => [u.latitude, u.longitude])
        )
        map.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 1.5,
          maxZoom: 16,
        })
      }
    } else if (!selectedIconUrl && !selectedUnidade) {
      // Quando remove o filtro, volta para visão padrão
      map.flyTo(CORUMBA_CONFIG.center, CORUMBA_CONFIG.zoom, {
        duration: 1.5,
      })
    }
  }, [selectedIconUrl, filteredUnidades, map, selectedUnidade])

  return null
}

// Componente para detectar zoom e ocultar marcadores
const ZoomHandler = ({ onZoomStart, onZoomEnd }) => {
  const map = useMap()

  useEffect(() => {
    let zoomTimeout

    const handleZoomStart = () => {
      onZoomStart()
    }

    const handleZoomEnd = () => {
      // Pequeno delay para garantir que o zoom terminou
      clearTimeout(zoomTimeout)
      zoomTimeout = setTimeout(() => {
        onZoomEnd()
      }, 100)
    }

    map.on('zoomstart', handleZoomStart)
    map.on('zoomend', handleZoomEnd)

    return () => {
      map.off('zoomstart', handleZoomStart)
      map.off('zoomend', handleZoomEnd)
      clearTimeout(zoomTimeout)
    }
  }, [map, onZoomStart, onZoomEnd])

  return null
}

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CORUMBA_CONFIG = {
  center: [-19.008, -57.651],
  zoom: 11,
  bounds: [
    [-22.0, -60.5], // Southwest
    [-16.0, -56.0], // Northeast
  ],
}

// Função auxiliar para obter ícone da rede social
const getRedeSocialIcon = (nomeRede) => {
  switch (nomeRede) {
    case 'Facebook':
      return <FacebookOutlined />
    case 'Instagram':
      return <InstagramOutlined />
    case 'Twitter':
      return <GlobalOutlined />
    case 'LinkedIn':
      return <LinkOutlined />
    case 'YouTube':
      return <GlobalOutlined />
    case 'TikTok':
      return <GlobalOutlined />
    case 'Website':
      return <GlobalOutlined />
    default:
      return <LinkOutlined />
  }
}

export default function MapPage() {
  const [selectedUnidade, setSelectedUnidade] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedEspecialidade, setSelectedEspecialidade] = useState(null)
  const [especialidadeModalVisible, setEspecialidadeModalVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isZooming, setIsZooming] = useState(false)

  // Estados de busca
  const [searchType, setSearchType] = useState(null) // 'bairro', 'unidade'
  const [searchValue, setSearchValue] = useState(null)
  const [searchText, setSearchText] = useState('') // Busca unificada por texto
  const [selectedIconUrl, setSelectedIconUrl] = useState(null) // Filtro por ícone da legenda
  const [selectedOfertaId, setSelectedOfertaId] = useState(null) // Filtro por oferta de ensino

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Iniciar sidebar recolhida no mobile apenas na primeira renderização
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, []) // Executa apenas uma vez ao montar

  const { data, isLoading, isError, error } = useGetUnidadesQuery(undefined, {
    refetchOnMountOrArgChange: 300, // Refetch apenas se dados tiverem mais de 5 minutos
    refetchOnFocus: false, // Não refetch ao voltar para a aba
  })
  const { data: medicosData, isLoading: medicosLoading } = useGetUnidadeMedicosQuery(
    selectedUnidade?.id,
    { 
      skip: !selectedUnidade,
      refetchOnMountOrArgChange: false, // Usa cache sempre que possível
    }
  )
  const { data: lastUpdateData } = useGetLastUpdateQuery(undefined, {
    refetchOnMountOrArgChange: 300, // Refetch apenas após 5 minutos
  })
  const { data: iconesData } = useGetIconesQuery({ ativo: 'true' }, {
    refetchOnMountOrArgChange: 300, // Refetch ícones após 5 minutos
    refetchOnFocus: false, // Não refetch ao voltar para a aba
  })
  const { data: ofertasData } = useGetOfertasEnsinoQuery({ ativo: 'true' }, {
    refetchOnMountOrArgChange: 300, // Refetch ofertas após 5 minutos
    refetchOnFocus: false, // Não refetch ao voltar para a aba
  })

  // Extrair dados antes dos early returns
  const unidades = data?.data || []
  const medicos = medicosData?.data || []
  const ofertas = ofertasData?.data || []
  const lastUpdate = lastUpdateData?.data?.lastUpdate || null
  
  // Extrair bairros únicos das unidades (não precisa query separada)
  const bairros = useMemo(() => {
    const bairrosSet = new Set(unidades.map(u => u.bairro).filter(Boolean))
    return Array.from(bairrosSet).sort()
  }, [unidades])
  
  // Extrair especialidades únicas das unidades (não precisa query separada)
  const especialidades = useMemo(() => {
    const espMap = new Map()
    unidades.forEach(u => {
      u.especialidades?.forEach(esp => {
        if (!espMap.has(esp.id)) {
          espMap.set(esp.id, esp)
        }
      })
    })
    return Array.from(espMap.values())
  }, [unidades])

  // Formatar data da última atualização
  const formatarDataAtualizacao = () => {
    if (lastUpdate) {
      const data = new Date(lastUpdate)

      const dia = String(data.getDate()).padStart(2, '0')
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const ano = data.getFullYear()
      const hora = String(data.getHours()).padStart(2, '0')
      const minuto = String(data.getMinutes()).padStart(2, '0')

      return `${dia}/${mes}/${ano}, ${hora}:${minuto}`
    }
    return 'N/A'
  }

  // Função para formatar endereço completo
  const formatarEnderecoCompleto = (unidade) => {
    const partes = []
    if (unidade.endereco) partes.push(unidade.endereco)
    if (unidade.bairro) partes.push(unidade.bairro)
    if (partes.length > 0) partes.push('Corumbá - MS')
    return partes.join(' - ')
  }

  // Filtrar unidades baseado na busca
  const filteredUnidades = useMemo(() => {
    let filtered = unidades

    // Aplicar filtro por ícone (se selecionado) - normalizando URLs para evitar mismatch
    if (selectedIconUrl) {
      const selNorm = normalizePath(selectedIconUrl)
      filtered = filtered.filter(unidade => normalizePath(unidade.icone_url) === selNorm)
    }

    // Aplicar filtro por oferta de ensino (se selecionado)
    if (selectedOfertaId) {
      filtered = filtered.filter(unidade =>
        unidade.ofertas_ensino?.some(oferta => oferta.id === selectedOfertaId)
      )
    }

    // Se tem busca por texto, usar ela (prioritária)
    if (searchText.trim()) {
      const textNormalized = normalizeText(searchText)

      filtered = filtered.filter(unidade => {
        // Buscar no nome da unidade
        const nomeMatch = normalizeText(unidade.nome).includes(textNormalized)

        // Buscar no bairro
        const bairroMatch = normalizeText(unidade.bairro).includes(textNormalized)

        // Buscar nas especialidades
        const especialidadeMatch = unidade.especialidades?.some(
          esp => normalizeText(esp.nome).includes(textNormalized)
        )

        // Buscar por "sala de vacina"
        const salaVacinaMatch = (textNormalized.includes('vacina') || textNormalized.includes('sala')) && unidade.sala_vacina

        return nomeMatch || bairroMatch || especialidadeMatch || salaVacinaMatch
      })
      return filtered
    }

    // Se não tem busca por texto, usar busca por select (comportamento antigo)
    if (!searchType || !searchValue) {
      return filtered
    }

    return filtered.filter(unidade => {
      if (searchType === 'bairro') {
        return unidade.bairro === searchValue
      } else if (searchType === 'unidade') {
        return unidade.id === searchValue
      }
      return true
    })
  }, [unidades, searchType, searchValue, searchText, selectedIconUrl, selectedOfertaId])

  // Calcular estatísticas de busca por texto
  const searchStats = useMemo(() => {
    if (!searchText.trim()) return null

    const textLower = searchText.toLowerCase().trim()
    let byName = 0
    let byBairro = 0
    let byEspecialidade = 0
    let bySalaVacina = 0

    filteredUnidades.forEach(unidade => {
      if (unidade.nome?.toLowerCase().includes(textLower)) byName++
      if (unidade.bairro?.toLowerCase().includes(textLower)) byBairro++
      if (unidade.especialidades?.some(esp => esp.nome?.toLowerCase().includes(textLower))) {
        byEspecialidade++
      }
      if ((textLower.includes('vacina') || textLower.includes('sala')) && unidade.sala_vacina) {
        bySalaVacina++
      }
    })

    return { byName, byBairro, byEspecialidade, bySalaVacina }
  }, [searchText, filteredUnidades])

  // Handler para reset da busca
  const handleResetSearch = () => {
    setSearchType(null)
    setSearchValue(null)
    setSearchText('')
    setSelectedOfertaId(null)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" message="Carregando unidades..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px' }}>
        <Alert
          message="Erro ao Carregar Dados das Unidades"
          description={
            <>
              <p>Não foi possível buscar os dados das unidades de saúde. Verifique se o servidor da API (backend) está rodando corretamente na porta 8008.</p>
              <strong>Detalhes do erro:</strong>
              <pre style={{
                marginTop: '10px',
                color: 'red',
                textAlign: 'left',
                background: '#fff0f0',
                padding: '10px',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {JSON.stringify(error, null, 2)}
              </pre>
            </>
          }
          type="error"
          showIcon
        />
      </div>
    )
  }

  const handleMarkerClick = (unidade) => {
    setSelectedUnidade(unidade)
    setSidebarCollapsed(false)

    // Rastrear clique no mapa
    trackCliqueMapaUnidade({
      unidadeId: unidade.id,
      unidadeNome: unidade.nome,
      latitude: unidade.latitude,
      longitude: unidade.longitude,
    })

    // Rastrear visualização da unidade
    trackVisualizacaoUnidade({
      unidadeId: unidade.id,
      unidadeNome: unidade.nome,
      origem: 'mapa',
    })
  }

  const apiBaseUrl = ''

  // Sidebar responsivo
  const sidebarWidth = isMobile ? window.innerWidth * 0.85 : 400 // 85% da tela no mobile
  const sidebarLeft = sidebarCollapsed ? -sidebarWidth + 40 : 0

  return (
    <>
      <style>{`
        .custom-select .ant-select-selection-placeholder {
          color: #333 !important;
          font-weight: 500;
        }
        .custom-select .ant-select-clear {
          background: #fff !important;
          opacity: 1 !important;
          font-size: 16px !important;
          color: #ff4d4f !important;
          border-radius: 50%;
          margin-right: 4px;
        }
        .custom-select .ant-select-clear:hover {
          color: #ff7875 !important;
          background: #fff1f0 !important;
        }
      `}</style>
      <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex' }}>
        {/* Sidebar */}
        <div
          style={{
            position: 'absolute',
            left: `${sidebarLeft}px`,
            top: 0,
            bottom: 0,
            width: `${sidebarWidth}px`,
            maxHeight: isMobile ? '85vh' : '100%',
            backgroundColor: 'white',
            boxShadow: isMobile ? '2px 0 12px rgba(0,0,0,0.2)' : '2px 0 8px rgba(0,0,0,0.15)',
            borderRadius: isMobile ? '0 12px 12px 0' : '0',
            transition: 'left 0.3s ease-in-out',
            zIndex: 1000,
            display: 'flex',
          }}
        >
          {/* Conteúdo do Sidebar */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {selectedUnidade ? (
              <div style={{ height: '100%' }}>
                {/* Botão Voltar */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#fafafa'
                }}>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={() => setSelectedUnidade(null)}
                    size="large"
                    style={{
                      fontWeight: '500'
                    }}
                  >
                    Voltar para Busca
                  </Button>
                </div>

                {/* Imagem da Unidade */}
                {selectedUnidade.imagem_url ? (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundImage: `url(${apiBaseUrl}${encodeURI(selectedUnidade.imagem_url)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#f0f0f0', // Fallback color
                  }} />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <EnvironmentOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                  </div>
                )}

                {/* Conteúdo */}
                <div style={{ padding: '24px' }}>
                  {/* Nome da Unidade */}
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1890ff',
                    marginBottom: '8px',
                    lineHeight: 1.3,
                  }}>
                    {selectedUnidade.nome}
                  </h2>

                  {/* Endereço */}
                  {(selectedUnidade.endereco || selectedUnidade.bairro) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '24px',
                      color: '#666',
                    }}>
                      <EnvironmentOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                      <span style={{ flex: 1 }}>{formatarEnderecoCompleto(selectedUnidade)}</span>
                    </div>
                  )}

                  {/* Telefone */}
                  {selectedUnidade.telefone && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      color: '#666',
                    }}>
                      <PhoneOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                      <span style={{ flex: 1 }}>{selectedUnidade.telefone}</span>
                    </div>
                  )}

                  {/* Horário de Funcionamento */}
                  {selectedUnidade.horario_funcionamento && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      color: '#666',
                    }}>
                      <ClockCircleOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                      <span style={{ flex: 1, whiteSpace: 'pre-line' }}>{selectedUnidade.horario_funcionamento}</span>
                    </div>
                  )}

                  {/* Ofertas de Ensino */}
                  {selectedUnidade.ofertas_ensino && selectedUnidade.ofertas_ensino.length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      color: '#666',
                    }}>
                      <BookOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px', color: '#52c41a' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>Ofertas de Ensino</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {selectedUnidade.ofertas_ensino.map((oferta) => (
                            <Tag key={oferta.id} color="green" style={{ margin: 0 }}>
                              {oferta.nome}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Diretor Responsável */}
                  {selectedUnidade.diretor_responsavel && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      color: '#666',
                    }}>
                      <UserOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Diretor(a) Responsável</div>
                        <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '16px' }}>{selectedUnidade.diretor_responsavel}</div>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {selectedUnidade.whatsapp && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '12px',
                      gap: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        color: '#666',
                        flex: 1,
                      }}>
                        <WhatsAppOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px', color: '#25D366' }} />
                        <span style={{ flex: 1 }}>{selectedUnidade.whatsapp}</span>
                      </div>
                      <Button
                        type="primary"
                        icon={<WhatsAppOutlined />}
                        size="small"
                        style={{
                          backgroundColor: '#25D366',
                          borderColor: '#25D366',
                        }}
                        onClick={() => {
                          const cleanNumber = selectedUnidade.whatsapp.replace(/\D/g, '')
                          window.open(`https://wa.me/55${cleanNumber}`, '_blank')

                          // Rastrear clique no WhatsApp
                          trackContatoUnidade({
                            tipo: 'whatsapp',
                            unidadeId: selectedUnidade.id,
                            unidadeNome: selectedUnidade.nome,
                          })
                        }}
                      >
                        Abrir WhatsApp
                      </Button>
                    </div>
                  )}

                  {/* Email */}
                  {selectedUnidade.email && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '12px',
                      gap: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        color: '#666',
                        flex: 1,
                      }}>
                        <MailOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px', color: '#1890ff' }} />
                        <span style={{ flex: 1, wordBreak: 'break-word' }}>{selectedUnidade.email}</span>
                      </div>
                      <Button
                        type="primary"
                        icon={<MailOutlined />}
                        size="small"
                        onClick={() => {
                          window.location.href = `mailto:${selectedUnidade.email}`

                          // Rastrear clique no Email
                          trackContatoUnidade({
                            tipo: 'email',
                            unidadeId: selectedUnidade.id,
                            unidadeNome: selectedUnidade.nome,
                          })
                        }}
                      >
                        Enviar Email
                      </Button>
                    </div>
                  )}

                  {/* Como Chegar */}
                  {selectedUnidade.latitude && selectedUnidade.longitude && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '24px',
                      gap: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        color: '#666',
                        flex: 1,
                      }}>
                        <CompassOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px', color: '#1890ff' }} />
                        <span style={{ flex: 1 }}>Ver rota no mapa</span>
                      </div>
                      <Button
                        type="primary"
                        icon={<CompassOutlined />}
                        size="small"
                        onClick={() => {
                          const destination = `${selectedUnidade.latitude},${selectedUnidade.longitude}`
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank')

                          // Rastrear clique em Como Chegar
                          trackContatoUnidade({
                            tipo: 'como_chegar',
                            unidadeId: selectedUnidade.id,
                            unidadeNome: selectedUnidade.nome,
                          })
                        }}
                      >
                        Como Chegar
                      </Button>
                    </div>
                  )}

                  <Divider />

                  {/* Sala de Vacina */}
                  {selectedUnidade.sala_vacina && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#f0f7ff',
                        borderRadius: '8px',
                        border: '2px solid #1890ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        <MedicineBoxOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#1890ff',
                            marginBottom: '4px',
                            whiteSpace: 'pre-line',
                          }}>
                            {selectedUnidade.sala_vacina_info || 'Sala de Vacina Disponível'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Equipe de Coordenação */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      <MedicineBoxOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      Equipe de Coordenação
                    </h3>
                    {selectedUnidade.professores && selectedUnidade.professores.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedUnidade.professores.map((prof) => (
                          <div
                            key={prof.id}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#f0f5ff',
                              borderRadius: '6px',
                              border: '1px solid #d6e4ff',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                              {prof.nome}
                            </div>
                            {prof.cargo && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                {prof.cargo}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Nenhum membro da equipe cadastrado"
                        style={{ margin: '16px 0' }}
                      />
                    )}
                  </div>

                  <Divider />

                  {/* Redes Sociais */}
                  {selectedUnidade.redes_sociais && selectedUnidade.redes_sociais.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        <GlobalOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        Redes Sociais
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {selectedUnidade.redes_sociais.map((rede) => (
                          <a
                            key={rede.id}
                            href={rede.url_perfil}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              backgroundColor: '#f0f7ff',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              color: '#1890ff',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.3s',
                              border: '1px solid #d6e4ff',
                            }}
                            onClick={() => {
                              // Rastrear clique em rede social
                              trackRedeSocialUnidade({
                                redeSocial: rede.nome_rede,
                                unidadeId: selectedUnidade.id,
                                unidadeNome: selectedUnidade.nome,
                              })
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e6f7ff'
                              e.currentTarget.style.borderColor = '#1890ff'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f7ff'
                              e.currentTarget.style.borderColor = '#d6e4ff'
                            }}
                          >
                            {getRedeSocialIcon(rede.nome_rede)}
                            <span>{rede.nome_rede}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px' }}>
                <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                  <img
                    src="/uploads/Logo-da-Prefeitura-de-Corumba-MS.png"
                    alt="Prefeitura de Corumbá"
                    style={{
                      maxWidth: '180px',
                      height: 'auto',
                      marginBottom: '24px'
                    }}
                  />
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#333' }}>
                    Bem-vindo ao Mapa Turismo
                  </h2>
                  <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6, marginTop: '16px', marginBottom: '24px' }}>
                    Explore os pontos turísticos de Corumbá.
                    <br />
                    Clique em um ponto no mapa para ver os detalhes.
                  </p>

                  {/* Componente de Busca */}
                  <Card
                    style={{
                      marginTop: '24px',
                      textAlign: 'left',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        fontWeight: 'bold',
                        color: '#1890ff'
                      }}>
                        <SearchOutlined style={{ marginRight: '8px', fontSize: '18px' }} />
                        O que você procura?
                      </div>

                      {/* Campo de busca unificada por texto */}
                      <Input
                        placeholder="Digite para buscar unidade, bairro ou especialidade..."
                        prefix={<SearchOutlined style={{ color: '#999' }} />}
                        suffix={
                          searchText ? (
                            <CloseCircleOutlined
                              onClick={() => setSearchText('')}
                              style={{
                                color: '#999',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            />
                          ) : null
                        }
                        value={searchText}
                        onChange={(e) => {
                          const newValue = e.target.value
                          setSearchText(newValue)
                          // Limpar filtros de select quando começar a digitar
                          if (newValue && (searchType || searchValue)) {
                            setSearchType(null)
                            setSearchValue(null)
                          }
                        }}
                        onPressEnter={(e) => {
                          const termo = e.target.value.trim()
                          if (termo) {
                            // Rastrear busca por texto
                            trackBusca({
                              tipo: 'texto_livre',
                              termo: termo,
                              resultados: filteredUnidades.length,
                            })
                          }
                        }}
                        onBlur={(e) => {
                          const termo = e.target.value.trim()
                          if (termo) {
                            // Rastrear busca quando usuário sair do campo
                            trackBusca({
                              tipo: 'texto_livre',
                              termo: termo,
                              resultados: filteredUnidades.length,
                            })
                          }
                        }}
                        size="large"
                        style={{
                          marginBottom: '16px',
                          borderRadius: '8px',
                        }}
                        allowClear={false}
                      />

                      {/* Filtro por Oferta de Ensino */}
                      <Select
                        placeholder="Filtrar por oferta de ensino"
                        value={selectedOfertaId}
                        onChange={(value) => {
                          setSelectedOfertaId(value)
                          // Rastrear filtro por oferta
                          if (value) {
                            const oferta = ofertas.find(o => o.id === value)
                            trackFiltroMapa({
                              tipo: 'oferta_ensino',
                              valor: oferta?.nome,
                            })
                          }
                        }}
                        allowClear
                        onClear={() => setSelectedOfertaId(null)}
                        size="large"
                        style={{
                          width: '100%',
                          marginBottom: '16px',
                          borderRadius: '8px',
                        }}
                        suffixIcon={<BookOutlined />}
                      >
                        {ofertas.map((oferta) => (
                          <Select.Option key={oferta.id} value={oferta.id}>
                            {oferta.nome}
                          </Select.Option>
                        ))}
                      </Select>

                      {/* Divider com "OU" */}
                      {!searchText && (
                        <>
                          <Divider style={{ margin: '16px 0', fontSize: '12px', color: '#999' }}>
                            OU
                          </Divider>

                          <Select
                            placeholder="Selecione o tipo de busca"
                            className="custom-select"
                            style={{
                              width: '100%',
                              marginBottom: '12px',
                            }}
                            value={searchType}
                            onChange={(value) => {
                              setSearchType(value)
                              setSearchValue(null)
                            }}
                            allowClear
                            onClear={handleResetSearch}
                            size="large"
                          >
                            <Select.Option value="bairro">Buscar por Bairro</Select.Option>
                            <Select.Option value="unidade">Buscar por Unidade</Select.Option>
                          </Select>
                        </>
                      )}

                      {!searchText && searchType === 'bairro' && (
                        <Select
                          placeholder="Selecione um bairro"
                          className="custom-select"
                          style={{ width: '100%' }}
                          value={searchValue}
                          onChange={(value) => {
                            setSearchValue(value)
                            if (value) {
                              // Rastrear busca por bairro
                              const resultados = unidades.filter(u => u.bairro === value).length
                              trackBusca({
                                tipo: 'bairro',
                                termo: value,
                                resultados: resultados,
                              })
                            }
                          }}
                          showSearch
                          allowClear
                          size="large"
                          filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {bairros.map((bairro) => (
                            <Select.Option key={bairro} value={bairro}>
                              {bairro}
                            </Select.Option>
                          ))}
                        </Select>
                      )}

                      {!searchText && searchType === 'unidade' && (
                        <Select
                          placeholder="Selecione uma unidade"
                          className="custom-select"
                          style={{ width: '100%' }}
                          value={searchValue}
                          onChange={(value) => {
                            setSearchValue(value)
                            if (value) {
                              // Rastrear busca por unidade
                              const unidade = unidades.find(u => u.id === value)
                              if (unidade) {
                                trackBusca({
                                  tipo: 'unidade',
                                  termo: unidade.nome,
                                  resultados: 1,
                                })
                              }
                            }
                          }}
                          showSearch
                          allowClear
                          size="large"
                          filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {unidades.map((unidade) => (
                            <Select.Option key={unidade.id} value={unidade.id}>
                              {unidade.nome}
                            </Select.Option>
                          ))}
                        </Select>
                      )}
                    </div>

                    {(searchText || searchValue || selectedIconUrl || selectedOfertaId) && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: filteredUnidades.length > 0 ? '#f0f7ff' : '#fff7e6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        border: `1px solid ${filteredUnidades.length > 0 ? '#91d5ff' : '#ffd591'}`
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginBottom: searchStats ? '12px' : '0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <EnvironmentOutlined style={{ 
                              color: filteredUnidades.length > 0 ? '#1890ff' : '#fa8c16',
                              fontSize: '16px' 
                            }} />
                            <strong>
                              {filteredUnidades.length > 0 
                                ? `${filteredUnidades.length} unidade(s) encontrada(s)` 
                                : 'Nenhuma unidade encontrada'}
                            </strong>
                          </div>
                          {selectedIconUrl && (
                            <Button
                              size="small"
                              type="link"
                              danger
                              onClick={() => setSelectedIconUrl(null)}
                              style={{ padding: '0 8px' }}
                            >
                              Limpar Filtro
                            </Button>
                          )}
                        </div>
                        
                        {searchText && searchStats && filteredUnidades.length > 0 && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            paddingLeft: '24px',
                            lineHeight: '1.8'
                          }}>
                            <div style={{ marginBottom: '4px' }}>
                              Buscando por: <strong style={{ color: '#1890ff' }}>"{searchText}"</strong>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {searchStats.byName > 0 && (
                                <div>
                                  • <Tag color="blue" style={{ fontSize: '11px' }}>{searchStats.byName}</Tag>
                                  no nome da unidade
                                </div>
                              )}
                              {searchStats.byBairro > 0 && (
                                <div>
                                  • <Tag color="green" style={{ fontSize: '11px' }}>{searchStats.byBairro}</Tag>
                                  no bairro
                                </div>
                              )}
                              {searchStats.byEspecialidade > 0 && (
                                <div>
                                  • <Tag color="purple" style={{ fontSize: '11px' }}>{searchStats.byEspecialidade}</Tag>
                                  na especialidade
                                </div>
                              )}
                              {searchStats.bySalaVacina > 0 && (
                                <div>
                                  • <Tag color="orange" style={{ fontSize: '11px' }}>{searchStats.bySalaVacina}</Tag>
                                  com sala de vacina
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedIconUrl && !searchText && (
                          <div style={{ fontSize: '13px', color: '#333', marginTop: '8px' }}>
                            Filtrando por tipo de unidade selecionado na legenda
                          </div>
                        )}

                        {selectedOfertaId && !searchText && (
                          <div style={{ fontSize: '13px', color: '#333', marginTop: '8px' }}>
                            Filtrando por oferta de ensino: <Tag color="green" style={{ margin: '0 0 0 4px' }}>
                              {ofertas.find(o => o.id === selectedOfertaId)?.nome}
                            </Tag>
                          </div>
                        )}

                        {searchText && filteredUnidades.length === 0 && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#999',
                            marginTop: '8px',
                            fontStyle: 'italic'
                          }}>
                            Tente buscar por outro termo
                          </div>
                        )}

                        {selectedIconUrl && filteredUnidades.length === 0 && !searchText && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#999',
                            marginTop: '8px',
                            fontStyle: 'italic'
                          }}>
                            Nenhuma unidade encontrada para este tipo
                          </div>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* Rodapé com informações da fonte de dados */}
                  <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    fontSize: '11px',
                    color: '#666',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{ marginBottom: '4px' }}>
                      Fonte de dados: <strong>Fundação de Turismo do Pantanal</strong>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '10px', color: '#888' }}>
                      Última atualização: N/A
                    </div>
                  </div>

                  {unidades.length === 0 && !isLoading && (
                    <Alert
                      message="Nenhuma unidade encontrada para exibir no mapa."
                      type="warning"
                      showIcon
                      style={{ marginTop: '24px', textAlign: 'left' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botão de Toggle */}
          <div style={{
            position: 'absolute',
            right: '-40px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1001,
          }}>
            <Button
              type="primary"
              icon={sidebarCollapsed ? <RightOutlined /> : <LeftOutlined />}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                height: isMobile ? '60px' : '80px',
                width: '40px',
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            />
          </div>
        </div>

        {/* Overlay para fechar sidebar no mobile */}
        {isMobile && !sidebarCollapsed && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 999,
              transition: 'opacity 0.3s ease-in-out',
            }}
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Mapa */}
        <div style={{ 
          flex: 1, 
          height: '100%', 
          minHeight: '500px', // Altura mínima para evitar CLS
          position: 'relative',
          backgroundColor: '#e5e3df' // Cor de fundo similar aos tiles para reduzir flash
        }}>
          <MapContainer
            center={CORUMBA_CONFIG.center}
            zoom={CORUMBA_CONFIG.zoom}
            maxBounds={CORUMBA_CONFIG.bounds}
            maxBoundsViscosity={1.0}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            whenReady={(map) => {
              // Força um resize após o mapa estar pronto para evitar shifts
              setTimeout(() => map.target.invalidateSize(), 100)
            }}
          >
            <ZoomControl position="topright" />
            <MapViewController 
              selectedUnidade={selectedUnidade} 
              filteredUnidades={filteredUnidades}
              selectedIconUrl={selectedIconUrl}
            />
            <ZoomHandler 
              onZoomStart={() => setIsZooming(true)}
              onZoomEnd={() => setIsZooming(false)}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              minZoom={8}
              keepBuffer={4}
              updateWhenIdle={false}
              updateWhenZooming={false}
            />

            {!isZooming && filteredUnidades.map((unidade) => {
              if (!unidade.latitude || !unidade.longitude) {
                console.error('Unidade sem coordenadas:', unidade);
                return null;
              }

              // Criar ícone customizado se a unidade tiver um icone_url válido
              let customIcon = null;
              if (unidade.icone_url && unidade.icone_url.trim() !== '') {
                try {
                  customIcon = L.icon({
                    iconUrl: unidade.icone_url,
                    iconSize: [32, 48],
                    iconAnchor: [16, 48],
                    popupAnchor: [0, -48],
                  });
                } catch (error) {
                  console.error('Erro ao criar ícone para unidade:', unidade.nome, error);
                }
              }

              const isSelected = selectedUnidade?.id === unidade.id

              return (
                <CustomMarker
                  key={unidade.id}
                  unidade={unidade}
                  onClick={handleMarkerClick}
                  customIcon={customIcon}
                  isSelected={isSelected}
                />
              )
            })}
          </MapContainer>

          {/* Legenda do Mapa */}
          <MapLegend
            iconesData={iconesData}
            selectedIconUrl={selectedIconUrl}
            unidades={unidades}
            onIconClick={(iconUrl) => {
              // Toggle: se clicar no mesmo ícone, desseleciona
              const isDeselecting = normalizePath(selectedIconUrl) === normalizePath(iconUrl)
              setSelectedIconUrl(isDeselecting ? null : iconUrl)

              // Limpar outros filtros ao usar filtro de ícone
              setSearchType(null)
              setSearchValue(null)
              setSearchText('')

              // Rastrear filtro por ícone
              if (!isDeselecting) {
                const icone = iconesData?.data?.find(i => i.url === iconUrl)
                const selNorm = normalizePath(iconUrl)
                const resultados = unidades.filter(u => normalizePath(u.icone_url) === selNorm).length
                trackFiltroMapa({
                  tipoFiltro: 'icone',
                  valorFiltro: icone?.nome || 'Ícone customizado',
                  resultados: resultados,
                })
              }
            }}
          />
        </div>


        {/* Modal de Médicos por Especialidade */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MedicineBoxOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              <span>Médicos - {selectedEspecialidade?.nome}</span>
            </div>
          }
          open={especialidadeModalVisible}
          onCancel={() => {
            setEspecialidadeModalVisible(false)
            setSelectedEspecialidade(null)
          }}
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => {
                setEspecialidadeModalVisible(false)
                setSelectedEspecialidade(null)
              }}
            >
              Fechar
            </Button>,
          ]}
          width={600}
        >
          {selectedUnidade && selectedEspecialidade && (
            <div>
              <div style={{
                backgroundColor: '#f0f7ff',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                borderLeft: '4px solid #1890ff',
              }}>
                <div style={{ fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                  {selectedUnidade.nome}
                </div>
                {(selectedUnidade.endereco || selectedUnidade.bairro) && (
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <EnvironmentOutlined style={{ marginRight: '6px' }} />
                    {formatarEnderecoCompleto(selectedUnidade)}
                  </div>
                )}
              </div>

              {medicosLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px', color: '#666' }}>
                    Carregando médicos...
                  </div>
                </div>
              ) : (() => {
                // Filtrar médicos que têm a especialidade selecionada
                const medicosFiltrados = medicos.filter(medico =>
                  medico.especialidades?.some(esp => esp.id === selectedEspecialidade.id)
                )

                return medicosFiltrados.length > 0 ? (
                  <div>
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '14px',
                      color: '#666',
                      fontWeight: '500',
                    }}>
                      {medicosFiltrados.length} {medicosFiltrados.length === 1 ? 'médico encontrado' : 'médicos encontrados'}
                    </div>
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      paddingRight: '8px',
                    }}>
                      {medicosFiltrados.map((medico) => (
                        <div
                          key={medico.id}
                          style={{
                            padding: '16px',
                            marginBottom: '12px',
                            backgroundColor: '#fafafa',
                            borderRadius: '8px',
                            border: '1px solid #e8e8e8',
                            transition: 'all 0.3s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f7ff'
                            e.currentTarget.style.borderColor = '#1890ff'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fafafa'
                            e.currentTarget.style.borderColor = '#e8e8e8'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                          }}>
                            <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                            <div style={{ fontWeight: '600', fontSize: '15px', color: '#262626' }}>
                              {medico.nome}
                            </div>
                          </div>
                          {medico.especialidades && medico.especialidades.length > 0 && (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginTop: '8px',
                            }}>
                              {medico.especialidades.map(esp => (
                                <Tag
                                  key={esp.id}
                                  color={esp.id === selectedEspecialidade.id ? 'blue' : 'default'}
                                  icon={<MedicineBoxOutlined />}
                                  style={{ margin: 0, fontSize: '12px' }}
                                >
                                  {esp.nome}
                                </Tag>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={`Nenhum médico encontrado para a especialidade "${selectedEspecialidade.nome}"`}
                    style={{ padding: '40px 0' }}
                  />
                )
              })()}
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}
