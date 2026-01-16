import { Card, Row, Col, Statistic } from 'antd'
import { EnvironmentOutlined, MedicineBoxOutlined, TeamOutlined, DatabaseOutlined } from '@ant-design/icons'
import { useGetUnidadesQuery, useGetEspecialidadesQuery, useGetStagingQuery } from '../../store/slices/apiSlice'

export default function DashboardPage() {
  const { data: unidadesData } = useGetUnidadesQuery({})
  const { data: especialidadesData } = useGetEspecialidadesQuery()
  const { data: stagingData } = useGetStagingQuery({ status: 'pendente' })
  
  return (
    <div>
      <h1>Painel</h1>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Unidades de Saúde"
              value={unidadesData?.pagination?.total || 0}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Especialidades"
              value={especialidadesData?.data?.length || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Staging Pendente"
              value={stagingData?.pagination?.total || 0}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
