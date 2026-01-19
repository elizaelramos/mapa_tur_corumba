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
    <Layout style={{ minHeight: '100vh', height: '100vh' }}>
      <Header style={{
        background: '#1F3473',
        color: '#40A1E6',
        fontSize: isMobile ? '14px' : '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 40px',
        height: isMobile ? '56px' : '64px',
        lineHeight: isMobile ? '56px' : '64px',
      }}>
        <a href="https://corumba.ms.gov.br/" aria-label="Ir para Prefeitura de Corumbá" title="Ir para Prefeitura de Corumbá" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <img
            src="/uploads/logo__horizontal_monocromatica.png"
            alt="Logo Prefeitura"
            style={{
              display: 'block',
              alignSelf: 'center',
              height: isMobile ? '28px' : '40px',
              maxWidth: isMobile ? '80px' : 'none',
              objectFit: 'contain'
            }}
          />
        </a>
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
            marginLeft: isMobile ? '8px' : '16px',
            transition: 'transform 0.2s ease'
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
              height: isMobile ? '32px' : '48px',
              objectFit: 'contain',
              cursor: 'pointer'
            }}
          />
        </a>
        <span style={{
          color: 'white',
          fontSize: isMobile ? '12px' : '20px',
          whiteSpace: 'nowrap',
          flex: isMobile ? 1 : 'initial',
          textAlign: 'center',
          margin: isMobile ? '0 8px' : '0'
        }}>
          MAPA TURISMO
        </span>
        <img 
          src="/uploads/arte__horizontal_monocromatica.png" 
          alt="Arte Horizontal" 
          style={{ 
            display: 'block',
            alignSelf: 'center',
            height: isMobile ? '40px' : '60px',
            maxWidth: isMobile ? '80px' : 'none',
            objectFit: 'contain'
          }} 
        />
      </Header>
      <Content style={{ height: isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
