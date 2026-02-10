import { Card, Row, Col, Statistic, Divider } from 'antd'
import {
  EnvironmentOutlined,
  TagsOutlined,
  PictureOutlined,
  EyeOutlined,
  SearchOutlined,
  PhoneOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import {
  useGetUnidadesQuery,
  useGetCategoriasQuery,
  useGetIconesQuery,
  useGetAnalyticsOverviewQuery
} from '../../store/slices/apiSlice'
import dayjs from 'dayjs'

export default function DashboardPage() {
  const { data: unidadesData } = useGetUnidadesQuery({})
  const { data: categoriasData } = useGetCategoriasQuery()
  const { data: iconesData } = useGetIconesQuery({ ativo: true })

  // Estatísticas dos últimos 7 dias
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useGetAnalyticsOverviewQuery({
    start_date: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
  })

  const analytics = analyticsData?.data || {}

  // Extrair contadores de eventos por tipo
  const eventsByType = analytics.events_by_type || []
  const totalSearches = eventsByType.find(e => e.type === 'SEARCH')?.count || 0
  const totalContacts = eventsByType.find(e => e.type === 'CONTACT_CLICK')?.count || 0

  return (
    <div>
      <h1>Painel de Turismo</h1>

      {/* Seção de Estatísticas de Acesso */}
      <Card
        title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>📊 Estatísticas de Acesso (Últimos 7 dias)</span>}
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)'
        }}
        headStyle={{
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Statistic
                title={<span style={{ fontSize: '14px', color: '#666' }}>Visualizações</span>}
                value={analytics.total_events || 0}
                prefix={<EyeOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
                loading={isLoadingAnalytics}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Statistic
                title={<span style={{ fontSize: '14px', color: '#666' }}>Sessões Únicas</span>}
                value={analytics.total_sessions || 0}
                prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
                loading={isLoadingAnalytics}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Statistic
                title={<span style={{ fontSize: '14px', color: '#666' }}>Buscas</span>}
                value={totalSearches}
                prefix={<SearchOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16', fontSize: '28px', fontWeight: 'bold' }}
                loading={isLoadingAnalytics}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Statistic
                title={<span style={{ fontSize: '14px', color: '#666' }}>Contatos</span>}
                value={totalContacts}
                prefix={<PhoneOutlined style={{ color: '#eb2f96' }} />}
                valueStyle={{ color: '#eb2f96', fontSize: '28px', fontWeight: 'bold' }}
                loading={isLoadingAnalytics}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* Seção de Estatísticas do Sistema */}
      <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600', color: '#333' }}>
        Sistema
      </h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 12px 0 rgba(102, 126, 234, 0.25)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            hoverable
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: '500' }}>Locais Turísticos</span>}
              value={unidadesData?.pagination?.total || 0}
              prefix={<EnvironmentOutlined style={{ fontSize: '24px' }} />}
              valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 12px 0 rgba(240, 147, 251, 0.25)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            hoverable
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: '500' }}>Categorias</span>}
              value={categoriasData?.data?.length || 0}
              prefix={<TagsOutlined style={{ fontSize: '24px' }} />}
              valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 12px 0 rgba(79, 172, 254, 0.25)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            hoverable
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: '500' }}>Ícones Ativos</span>}
              value={iconesData?.data?.length || 0}
              prefix={<PictureOutlined style={{ fontSize: '24px' }} />}
              valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
