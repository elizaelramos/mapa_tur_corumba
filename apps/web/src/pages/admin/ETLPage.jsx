import { useState } from 'react'
import { Table, Tag, Card, Row, Col, Statistic } from 'antd'
import { useGetETLExecutionsQuery, useGetETLStatsQuery } from '../../store/slices/apiSlice'
import dayjs from 'dayjs'

export default function ETLPage() {
  const [page, setPage] = useState(1)
  const { data: executions, isLoading } = useGetETLExecutionsQuery({ page, limit: 20 })
  const { data: stats } = useGetETLStatsQuery()
  
  const statusColors = {
    running: 'blue',
    completed: 'green',
    failed: 'red',
    cancelled: 'orange',
  }
  
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
    },
    { title: 'Extraídos', dataIndex: 'records_extracted', key: 'records_extracted' },
    { title: 'Carregados', dataIndex: 'records_loaded', key: 'records_loaded' },
    { title: 'Falhas', dataIndex: 'records_failed', key: 'records_failed' },
    { 
      title: 'Início', 
      dataIndex: 'started_at', 
      key: 'started_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    { 
      title: 'Fim', 
      dataIndex: 'finished_at', 
      key: 'finished_at',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    },
  ]
  
  return (
    <div>
      <h1>Monitoramento ETL</h1>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total de Execuções"
              value={stats?.data?.total_executions || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sucesso"
              value={stats?.data?.successful_executions || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Falhas"
              value={stats?.data?.failed_executions || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Table
        columns={columns}
        dataSource={executions?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: executions?.pagination?.total || 0,
          onChange: setPage,
        }}
      />
    </div>
  )
}
