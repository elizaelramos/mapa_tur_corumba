import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import { useState, useEffect } from 'react'

const { Header, Content } = Layout

export default function PublicLayout() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Layout style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      <Header style={{
        background: '#1F3473',
        color: '#40A1E6',
        fontSize: isMobile ? '12px' : '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 8px' : '0 40px',
        height: isMobile ? '56px' : '64px',
        lineHeight: isMobile ? '56px' : '64px',
        flexShrink: 0,
      }}>
        {/* Logo - sempre à esquerda */}
        <a href="https://corumba.ms.gov.br/" aria-label="Ir para Prefeitura de Corumbá" title="Ir para Prefeitura de Corumbá" style={{ display: 'flex', alignItems: 'center', height: '100%', flexShrink: 0 }}>
          <img
            src="/uploads/logo__horizontal_monocromatica.png"
            alt="Logo Prefeitura"
            style={{
              display: 'block',
              alignSelf: 'center',
              height: isMobile ? '24px' : '40px',
              maxWidth: isMobile ? '60px' : '120px',
              objectFit: 'contain'
            }}
          />
        </a>

        {/* Desktop: Botão WhatsApp ao lado do logo */}
        {!isMobile && (
          <a
            href="https://wa.me/556732312886"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Guia Interativo Digital - WhatsApp"
            title="Guia Interativo Digital - WhatsApp"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
              marginLeft: '16px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src="/img_guia_interativo_tur.png"
              alt="Guia Interativo Digital"
              style={{
                display: 'block',
                alignSelf: 'center',
                height: '48px',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
            />
          </a>
        )}

        {/* Texto central */}
        <span style={{
          color: 'white',
          fontSize: isMobile ? '10px' : '20px',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          flex: '1 1 auto',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: isMobile ? '0 4px' : '0 16px'
        }}>
          MAPA TURISMO
        </span>

        {/* Mobile: Botão WhatsApp à direita */}
        {isMobile ? (
          <a
            href="https://wa.me/556732312886"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Guia Interativo Digital - WhatsApp"
            title="Guia Interativo Digital - WhatsApp"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              flexShrink: 0
            }}
          >
            <img
              src="/img_guia_interativo_tur.png"
              alt="Guia Interativo Digital"
              style={{
                display: 'block',
                alignSelf: 'center',
                height: '28px',
                objectFit: 'contain'
              }}
            />
          </a>
        ) : (
          /* Desktop: Arte horizontal à direita */
          <img
            src="/uploads/arte__horizontal_monocromatica.png"
            alt="Arte Horizontal"
            style={{
              display: 'block',
              alignSelf: 'center',
              height: '70px',
              maxWidth: '250px',
              objectFit: 'contain',
              flexShrink: 0
            }}
          />
        )}
      </Header>
      <Content style={{
        height: isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)',
        overflow: 'hidden'
      }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
