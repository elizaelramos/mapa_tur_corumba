import { Card, Row, Col, Statistic, Divider } from 'antd'
import {
  EnvironmentOutlined,
  TagsOutlined,
  PictureOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FundOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { useGetUnidadesQuery, useGetCategoriasQuery, useGetIconesQuery, useGetAccessStatsQuery } from '../../store/slices/apiSlice'

export default function DashboardPage() {
  const { data: unidadesData } = useGetUnidadesQuery({})
  const { data: categoriasData } = useGetCategoriasQuery()
  const { data: iconesData } = useGetIconesQuery({ ativo: true })
  const { data: accessStats, isLoading: isLoadingStats } = useGetAccessStatsQuery()

  return (
    <div>
      <h1>Painel de Turismo</h1>

      {/* Seção de Estatísticas de Acesso */}
      <Card
        title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>📊 Estatísticas de Acesso</span>}
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
                title={<span style={{ fontSize: '14px', color: '#666' }}>Hoje</span>}
                value={accessStats?.data?.today || 0}
                prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
                loading={isLoadingStats}
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
                title={<span style={{ fontSize: '14px', color: '#666' }}>Esta Semana</span>}
                value={accessStats?.data?.this_week || 0}
                prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
                loading={isLoadingStats}
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
                title={<span style={{ fontSize: '14px', color: '#666' }}>Este Mês</span>}
                value={accessStats?.data?.this_month || 0}
                prefix={<FundOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16', fontSize: '28px', fontWeight: 'bold' }}
                loading={isLoadingStats}
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
                title={<span style={{ fontSize: '14px', color: '#666' }}>Este Ano</span>}
                value={accessStats?.data?.this_year || 0}
                prefix={<TrophyOutlined style={{ color: '#eb2f96' }} />}
                valueStyle={{ color: '#eb2f96', fontSize: '28px', fontWeight: 'bold' }}
                loading={isLoadingStats}
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
