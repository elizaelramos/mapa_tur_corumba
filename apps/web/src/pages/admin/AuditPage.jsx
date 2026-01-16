import { useState, useMemo } from 'react'
import { Table, Tag, Card, Row, Col, Statistic, Space, Typography } from 'antd'
import {
  FileTextOutlined,
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useGetAuditLogsQuery, useGetAuditStatsQuery } from '../../store/slices/apiSlice'
import AuditFilters from '../../components/admin/AuditFilters'
import DiffViewer from '../../components/admin/DiffViewer'
import dayjs from 'dayjs'

const { Title } = Typography

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [expandedRowKeys, setExpandedRowKeys] = useState([])

  // Queries
  const { data, isLoading } = useGetAuditLogsQuery({ 
    page, 
    limit: 50,
    ...filters,
  })

  const { data: statsData, isLoading: statsLoading } = useGetAuditStatsQuery(filters)

  // Processar estatísticas
  const stats = useMemo(() => {
    if (!statsData?.data) return null

    const { total, by_operation, by_table, by_user } = statsData.data

    // Contar por operação
    const operationCounts = {
      INSERT: 0,
      UPDATE: 0,
      DELETE: 0,
    }
    by_operation.forEach(item => {
      operationCounts[item.operacao] = item._count
    })

    // Usuário mais ativo
    const userCounts = by_user
      .filter(item => item.user_id !== null)
      .sort((a, b) => b._count - a._count)

    return {
      total,
      inserts: operationCounts.INSERT,
      updates: operationCounts.UPDATE,
      deletes: operationCounts.DELETE,
      mostActiveUser: userCounts[0]?._count || 0,
      systemActions: by_user.find(item => item.user_id === null)?._count || 0,
    }
  }, [statsData])

  const operationColors = {
    INSERT: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
  }

  const operationIcons = {
    INSERT: <PlusCircleOutlined />,
    UPDATE: <EditOutlined />,
    DELETE: <DeleteOutlined />,
  }

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80,
      fixed: 'left',
    },
    { 
      title: 'Tabela', 
      dataIndex: 'tabela', 
      key: 'tabela',
      width: 200,
      ellipsis: true,
      render: (text) => {
        // Remover prefixo PROD_ para melhor legibilidade
        const cleanName = text.replace('PROD_', '')
        return <strong>{cleanName}</strong>
      },
    },
    { 
      title: 'Operação', 
      dataIndex: 'operacao', 
      key: 'operacao',
      width: 120,
      render: (op) => (
        <Tag color={operationColors[op]} icon={operationIcons[op]}>
          {op}
        </Tag>
      ),
    },
    { 
      title: 'Registro ID', 
      dataIndex: 'registro_id', 
      key: 'registro_id',
      width: 120,
    },
    { 
      title: 'Usuário', 
      dataIndex: ['user', 'username'], 
      key: 'user',
      width: 150,
      render: (_, record) => {
        if (record.user) {
          const roleColor = record.user.role === 'superadmin' ? 'gold' : 'default'
          return (
            <Space>
              <UserOutlined />
              <span>{record.user.username}</span>
              <Tag color={roleColor} style={{ fontSize: 10 }}>
                {record.user.role}
              </Tag>
            </Space>
          )
        }
        return <Tag color="default">Sistema</Tag>
      },
    },
    { 
      title: 'Data/Hora', 
      dataIndex: 'timestamp', 
      key: 'timestamp',
      width: 180,
      render: (timestamp) => dayjs(timestamp).format('DD/MM/YYYY HH:mm:ss'),
    },
  ]

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1) // Resetar para primeira página ao filtrar
  }

  const expandedRowRender = (record) => {
    return (
      <div style={{ padding: '16px 24px' }}>
        <DiffViewer
          valorAntigo={record.valor_antigo}
          valorNovo={record.valor_novo}
          operation={record.operacao}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <FileTextOutlined /> Logs de Auditoria
      </Title>

      {/* Cards de Estatísticas */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={4}>
            <Card loading={statsLoading}>
              <Statistic
                title="Total de Logs"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card loading={statsLoading}>
              <Statistic
                title="Inserções"
                value={stats.inserts}
                valueStyle={{ color: '#52c41a' }}
                prefix={<PlusCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card loading={statsLoading}>
              <Statistic
                title="Atualizações"
                value={stats.updates}
                valueStyle={{ color: '#1890ff' }}
                prefix={<EditOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card loading={statsLoading}>
              <Statistic
                title="Exclusões"
                value={stats.deletes}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<DeleteOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card loading={statsLoading}>
              <Statistic
                title="Ações de Usuários"
                value={stats.mostActiveUser}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card loading={statsLoading}>
              <Statistic
                title="Ações do Sistema"
                value={stats.systemActions}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filtros */}
      <Card style={{ marginBottom: 24 }}>
        <AuditFilters onFilter={handleFilterChange} initialValues={filters} />
      </Card>

      {/* Tabela */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1000 }}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
            expandRowByClick: true,
          }}
          pagination={{
            current: page,
            pageSize: 50,
            total: data?.pagination?.total || 0,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} registros`,
          }}
        />
      </Card>
    </div>
  )
}
