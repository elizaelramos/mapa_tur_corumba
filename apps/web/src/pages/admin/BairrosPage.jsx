import { useState } from 'react'
import {
  Table, Button, Space, Tag, Card, Row, Col, Statistic, Typography, Input,
  Modal, Form, Switch, message, Popconfirm
} from 'antd'
import {
  EnvironmentOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons'
import {
  useGetBairrosQuery,
  useCreateBairroMutation,
  useUpdateBairroMutation,
  useDeleteBairroMutation,
} from '../../store/slices/apiSlice'

const { Title, Text } = Typography

export default function BairrosPage() {
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBairro, setEditingBairro] = useState(null)
  const [form] = Form.useForm()

  // API hooks
  const { data: bairrosData, isLoading: loadingBairros } = useGetBairrosQuery({ ativo: 'all' })
  const [createBairro, { isLoading: creating }] = useCreateBairroMutation()
  const [updateBairro, { isLoading: updating }] = useUpdateBairroMutation()
  const [deleteBairro] = useDeleteBairroMutation()

  const bairros = bairrosData?.data || []

  // Filter by search text
  const bairrosFiltered = bairros.filter(bairro =>
    bairro.nome.toLowerCase().includes(searchText.toLowerCase())
  )

  // Calculate statistics
  const totalBairros = bairros.length
  const bairrosAtivos = bairros.filter(b => b.ativo).length
  const bairrosInativos = bairros.filter(b => !b.ativo).length

  // Handle create new bairro
  const handleCreate = () => {
    setEditingBairro(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true })
    setIsModalOpen(true)
  }

  // Handle edit bairro
  const handleEdit = (bairro) => {
    setEditingBairro(bairro)
    form.setFieldsValue({
      nome: bairro.nome,
      ativo: bairro.ativo,
    })
    setIsModalOpen(true)
  }

  // Handle delete bairro (soft delete)
  const handleDelete = async (id) => {
    try {
      await deleteBairro(id).unwrap()
      message.success('Bairro desativado com sucesso!')
    } catch (error) {
      message.error('Erro ao desativar bairro: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal submit
  const handleSubmit = async (values) => {
    try {
      const payload = {
        nome: values.nome.trim(),
        ativo: values.ativo ?? true,
      }

      if (editingBairro) {
        // Update existing bairro
        await updateBairro({ id: editingBairro.id, ...payload }).unwrap()
        message.success('Bairro atualizado com sucesso!')
      } else {
        // Create new bairro
        await createBairro(payload).unwrap()
        message.success('Bairro criado com sucesso!')
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingBairro(null)
    } catch (error) {
      message.error('Erro ao salvar bairro: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingBairro(null)
  }

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      sorter: (a, b) => a.nome.localeCompare(b.nome),
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 120,
      render: (ativo) => (
        <Tag color={ativo ? 'green' : 'red'} icon={ativo ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
      filters: [
        { text: 'Ativo', value: true },
        { text: 'Inativo', value: false },
      ],
      onFilter: (value, record) => record.ativo === value,
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('pt-BR'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Atualizado em',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('pt-BR'),
      sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Editar
          </Button>
          {record.ativo && (
            <Popconfirm
              title="Desativar bairro?"
              description="Tem certeza que deseja desativar este bairro?"
              onConfirm={() => handleDelete(record.id)}
              okText="Sim"
              cancelText="Não"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              >
                Desativar
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <EnvironmentOutlined /> Gerenciamento de Bairros
        </Title>
        <Text type="secondary">
          Gerencie os bairros de Corumbá-MS
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total de Bairros"
              value={totalBairros}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Bairros Ativos"
              value={bairrosAtivos}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Bairros Inativos"
              value={bairrosInativos}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input.Search
            placeholder="Buscar bairro..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Novo Bairro
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={bairrosFiltered}
          loading={loadingBairros}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} bairros`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingBairro ? 'Editar Bairro' : 'Novo Bairro'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ ativo: true }}
        >
          <Form.Item
            name="nome"
            label="Nome do Bairro"
            rules={[
              { required: true, message: 'Por favor, insira o nome do bairro' },
              { min: 2, message: 'O nome deve ter pelo menos 2 caracteres' },
              { max: 100, message: 'O nome deve ter no máximo 100 caracteres' },
            ]}
          >
            <Input placeholder="Ex: Centro, Vila Real, etc." />
          </Form.Item>

          <Form.Item
            name="ativo"
            label="Status"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Ativo"
              unCheckedChildren="Inativo"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating || updating}
              >
                {editingBairro ? 'Atualizar' : 'Criar'}
              </Button>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
