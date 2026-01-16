import { Form, Select, DatePicker, Button, Row, Col } from 'antd'
import { ClearOutlined, SearchOutlined } from '@ant-design/icons'
import { useGetUsersQuery } from '../../store/slices/apiSlice'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function AuditFilters({ onFilter, initialValues }) {
  const [form] = Form.useForm()
  const { data: usersData } = useGetUsersQuery()

  const tables = [
    { label: 'Unidades de Saúde', value: 'PROD_Unidade_Saude' },
    { label: 'Médicos', value: 'PROD_Medico' },
    { label: 'Especialidades', value: 'PROD_Especialidade' },
    { label: 'Bairros', value: 'PROD_Bairro' },
    { label: 'Ícones', value: 'PROD_Icone' },
    { label: 'Usuários', value: 'User' },
  ]

  const operations = [
    { label: 'INSERT', value: 'INSERT' },
    { label: 'UPDATE', value: 'UPDATE' },
    { label: 'DELETE', value: 'DELETE' },
  ]

  const handleFilter = (values) => {
    const filters = { ...values }
    
    // Converter dateRange para start_date e end_date
    if (values.dateRange) {
      filters.start_date = values.dateRange[0].startOf('day').toISOString()
      filters.end_date = values.dateRange[1].endOf('day').toISOString()
      delete filters.dateRange
    }
    
    // Remover valores vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key]
    })
    
    onFilter(filters)
  }

  const handleClear = () => {
    form.resetFields()
    onFilter({})
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFilter}
      initialValues={initialValues}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Tabela" name="tabela">
            <Select
              placeholder="Todas"
              allowClear
              options={tables}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Operação" name="operacao">
            <Select
              placeholder="Todas"
              allowClear
              options={operations}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Usuário" name="user_id">
            <Select
              placeholder="Todos"
              allowClear
              showSearch
              optionFilterProp="label"
              options={[
                { label: 'Sistema (Trigger)', value: 'null' },
                ...(usersData?.data || []).map(user => ({
                  label: user.username,
                  value: user.id,
                })),
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Período" name="dateRange">
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Data inicial', 'Data final']}
              presets={[
                { label: 'Hoje', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                { label: 'Últimos 7 dias', value: [dayjs().subtract(7, 'days'), dayjs()] },
                { label: 'Últimos 30 dias', value: [dayjs().subtract(30, 'days'), dayjs()] },
                { label: 'Este mês', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            Filtrar
          </Button>
        </Col>
        <Col>
          <Button onClick={handleClear} icon={<ClearOutlined />}>
            Limpar
          </Button>
        </Col>
      </Row>
    </Form>
  )
}
