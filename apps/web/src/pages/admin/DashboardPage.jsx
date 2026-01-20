import { Card, Row, Col, Statistic } from 'antd'
import { EnvironmentOutlined, ShopOutlined, TagsOutlined, PictureOutlined } from '@ant-design/icons'
import { useGetUnidadesQuery, useGetCategoriasQuery, useGetIconesQuery } from '../../store/slices/apiSlice'

export default function DashboardPage() {
  const { data: unidadesData } = useGetUnidadesQuery({})
  const { data: categoriasData } = useGetCategoriasQuery()
  const { data: iconesData } = useGetIconesQuery({ ativo: true })

  return (
    <div>
      <h1>Painel de Turismo</h1>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Locais Turísticos"
              value={unidadesData?.pagination?.total || 0}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Categorias"
              value={categoriasData?.data?.length || 0}
              prefix={<TagsOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Ícones Ativos"
              value={iconesData?.data?.length || 0}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
