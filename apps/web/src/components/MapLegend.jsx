import { useState, useEffect, useMemo } from 'react'
import { Card } from 'antd'
import { PictureOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'

// Helper para obter URL completa da imagem
const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  // Usar caminho relativo que será resolvido pelo proxy do Vite
  return url
}

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

// Hook para detectar se é mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export default function MapLegend({ iconesData, onIconClick, selectedIconUrl, unidades }) {
  const isMobile = useIsMobile()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleIconClick = (iconeUrl) => {
    if (onIconClick) {
      onIconClick(iconeUrl)
      // Recolher legenda no mobile após clicar
      if (isMobile) {
        setIsExpanded(false)
      }
    }
  }

  // Mostrar apenas os ícones que estão sendo usados pelas unidades
  const iconesEmUso = useMemo(() => {
    if (!iconesData?.data || !Array.isArray(iconesData.data)) {
      return []
    }
    if (!unidades || !Array.isArray(unidades)) {
      return []
    }

    // Coletar URLs de ícones únicos das unidades (normalizando caminhos)
    const iconesUsados = new Set(
      unidades
        .map(u => {
          const iconUrl = u.icone?.url || u.icone_url  // Priorizar objeto icone
          return normalizePath(iconUrl)
        })
        .filter(url => url && url.trim() !== '')
    )

    // Filtrar apenas os ícones que estão sendo usados e ordenar por ordem
    const resultado = iconesData.data
      .filter(icone => iconesUsados.has(normalizePath(icone.url)))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))

    return resultado
  }, [iconesData, unidades])

  // Se não houver ícones, não renderizar a legenda
  if (!iconesEmUso || iconesEmUso.length === 0) return null

  // No mobile, renderizar versão compacta
  if (isMobile) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 400,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'white',
          maxWidth: 'calc(100vw - 20px)',
        }}
      >
        {/* Header sempre visível */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: '#fafafa',
            borderBottom: isExpanded ? '1px solid #f0f0f0' : 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <PictureOutlined style={{ fontSize: '16px' }} />
            <span>Legenda</span>
          </div>
          {isExpanded ? (
            <UpOutlined style={{ fontSize: '12px', color: '#999' }} />
          ) : (
            <DownOutlined style={{ fontSize: '12px', color: '#999' }} />
          )}
        </div>

        {/* Conteúdo expansível */}
        {isExpanded && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {iconesEmUso.map(icone => {
                const isSelected = normalizePath(selectedIconUrl) === normalizePath(icone.url)
                return (
                  <div
                    key={icone.id}
                    onClick={() => handleIconClick(icone.url)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                      border: isSelected ? '2px solid #1890ff' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <img
                      src={getFullImageUrl(icone.url)}
                      alt={icone.nome}
                      style={{
                        width: '24px',
                        height: '36px',
                        objectFit: 'contain',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#333', fontWeight: isSelected ? 600 : 400 }}>
                      {icone.nome}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop: versão sempre expandida (comportamento original)
  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PictureOutlined />
          <span>Legenda</span>
        </div>
      }
      size="small"
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 400,
        minWidth: '200px',
        maxWidth: '240px',
        maxHeight: 'calc(100vh - 100px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      styles={{
        body: {
          padding: '12px',
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {iconesEmUso.map(icone => {
          const isSelected = normalizePath(selectedIconUrl) === normalizePath(icone.url)
          return (
            <div
              key={icone.id}
              onClick={() => handleIconClick(icone.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                border: isSelected ? '2px solid #1890ff' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <img
                src={getFullImageUrl(icone.url)}
                alt={icone.nome}
                style={{
                  width: '24px',
                  height: '36px',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', color: '#333', fontWeight: isSelected ? 600 : 400 }}>
                {icone.nome}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
