import { useState } from 'react'
import { Table, Tag, Card, Row, Col, Statistic, Typography, Input, Space, Badge } from 'antd'
import { MedicineBoxOutlined, TagsOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useGetEspecialidadesQuery } from '../../store/slices/apiSlice'

const { Title, Text } = Typography

export default function EspecialidadesPage() {
  const { data, isLoading } = useGetEspecialidadesQuery()
  const [searchText, setSearchText] = useState('')

  const especialidades = data?.data || []

  // Filtrar por busca
  const especialidadesFiltered = especialidades.filter(esp =>
    esp.nome.toLowerCase().includes(searchText.toLowerCase())
  )

  // Calcular estatísticas
  const totalEspecialidades = especialidades.length
  const totalMapeamentos = especialidades.reduce((acc, esp) => acc + (esp.mapeamentos?.length || 0), 0)
  const mediaMapeamentosPorEspecialidade = totalEspecialidades > 0
    ? (totalMapeamentos / totalEspecialidades).toFixed(1)
    : 0

  const columns = [
    {
      title: 'Especialidade Normalizada',
      dataIndex: 'nome',
      key: 'nome',
      width: '40%',
      render: (text) => (
        <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Nomes Brutos Mapeados',
      dataIndex: 'mapeamentos',
      key: 'mapeamentos',
      width: '15%',
      align: 'center',
      render: (mapeamentos) => (
        <Badge
          count={mapeamentos?.length || 0}
          showZero
          style={{ backgroundColor: mapeamentos?.length > 0 ? '#52c41a' : '#d9d9d9' }}
        />
      ),
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '20%',
      render: (date) => date ? new Date(date).toLocaleDateString('pt-BR') : '-',
    },
  ]

  return (
    <div>
      <Title level={2}>
        <MedicineBoxOutlined style={{ marginRight: '12px' }} />
        Especialidades Normalizadas
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        Visualize todas as especialidades médicas normalizadas e seus mapeamentos de nomes brutos.
      </Text>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total de Especialidades"
              value={totalEspecialidades}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total de Mapeamentos"
              value={totalMapeamentos}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Média de Mapeamentos"
              value={mediaMapeamentosPorEspecialidade}
              prefix={<CheckCircleOutlined />}
              suffix="por especialidade"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabela com busca */}
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input.Search
            placeholder="Buscar especialidade..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400 }}
            allowClear
          />

          <Table
            columns={columns}
            dataSource={especialidadesFiltered}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total: ${total} especialidades` }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                  <Title level={5} style={{ marginBottom: '12px' }}>
                    <TagsOutlined style={{ marginRight: '8px' }} />
                    Nomes Brutos Mapeados ({record.mapeamentos?.length || 0})
                  </Title>
                  {record.mapeamentos && record.mapeamentos.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {record.mapeamentos.map((mapeamento) => (
                        <Tag key={mapeamento.id} color="blue" style={{ margin: 0 }}>
                          {mapeamento.nome_bruto}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">Nenhum mapeamento cadastrado ainda</Text>
                  )}
                </div>
              ),
              rowExpandable: (record) => record.mapeamentos && record.mapeamentos.length > 0,
            }}
          />
        </Space>
      </Card>
    </div>
  )
}
