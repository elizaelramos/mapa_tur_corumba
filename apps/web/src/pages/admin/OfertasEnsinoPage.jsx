import { useState } from 'react'
import {
  Table, Button, Space, Tag, Card, Row, Col, Statistic, Typography, Input,
  Modal, Form, Switch, message, Popconfirm
} from 'antd'
import {
  BookOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons'
import {
  useGetOfertasEnsinoQuery,
  useCreateOfertaEnsinoMutation,
  useUpdateOfertaEnsinoMutation,
  useDeleteOfertaEnsinoMutation,
} from '../../store/slices/apiSlice'

const { Title, Text } = Typography

export default function OfertasEnsinoPage() {
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOferta, setEditingOferta] = useState(null)
  const [form] = Form.useForm()

  // API hooks
  const { data: ofertasData, isLoading: loadingOfertas } = useGetOfertasEnsinoQuery({ ativo: 'all' })
  const [createOferta, { isLoading: creating }] = useCreateOfertaEnsinoMutation()
  const [updateOferta, { isLoading: updating }] = useUpdateOfertaEnsinoMutation()
  const [deleteOferta] = useDeleteOfertaEnsinoMutation()

  const ofertas = ofertasData?.data || []

  // Filter by search text
  const ofertasFiltered = ofertas.filter(oferta =>
    oferta.nome.toLowerCase().includes(searchText.toLowerCase())
  )

  // Calculate statistics
  const totalOfertas = ofertas.length
  const ofertasAtivas = ofertas.filter(o => o.ativo).length
  const ofertasInativas = ofertas.filter(o => !o.ativo).length

  // Handle create new oferta
  const handleCreate = () => {
    setEditingOferta(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true })
    setIsModalOpen(true)
  }

  // Handle edit oferta
  const handleEdit = (oferta) => {
    setEditingOferta(oferta)
    form.setFieldsValue({
      nome: oferta.nome,
      ativo: oferta.ativo,
    })
    setIsModalOpen(true)
  }

  // Handle delete oferta (soft delete)
  const handleDelete = async (id) => {
    try {
      await deleteOferta(id).unwrap()
      message.success('Oferta de ensino desativada com sucesso!')
    } catch (error) {
      message.error('Erro ao desativar oferta de ensino: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal submit
  const handleSubmit = async (values) => {
    try {
      const payload = {
        nome: values.nome.trim(),
        ativo: values.ativo ?? true,
      }

      if (editingOferta) {
        // Update existing oferta
        await updateOferta({ id: editingOferta.id, ...payload }).unwrap()
        message.success('Oferta de ensino atualizada com sucesso!')
      } else {
        // Create new oferta
        await createOferta(payload).unwrap()
        message.success('Oferta de ensino criada com sucesso!')
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingOferta(null)
    } catch (error) {
      message.error('Erro ao salvar oferta de ensino: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingOferta(null)
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
      title: 'Nome da Oferta de Ensino',
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
              title="Desativar oferta de ensino?"
              description="Tem certeza que deseja desativar esta oferta de ensino?"
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
          <BookOutlined /> Gerenciamento de Ofertas de Ensino
        </Title>
        <Text type="secondary">
          Gerencie categorias e ofertas de serviços e experiências turísticas
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total de Ofertas"
              value={totalOfertas}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Ofertas Ativas"
              value={ofertasAtivas}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Ofertas Inativas"
              value={ofertasInativas}
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
            placeholder="Buscar oferta de ensino..."
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
            Nova Oferta de Ensino
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={ofertasFiltered}
          loading={loadingOfertas}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} ofertas de ensino`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingOferta ? 'Editar Oferta de Ensino' : 'Nova Oferta de Ensino'}
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
            label="Nome da Oferta de Ensino"
            rules={[
              { required: true, message: 'Por favor, insira o nome da oferta de ensino' },
              { min: 2, message: 'O nome deve ter pelo menos 2 caracteres' },
              { max: 100, message: 'O nome deve ter no máximo 100 caracteres' },
            ]}
          >
            <Input placeholder="Ex: Educação Infantil, Ensino Fundamental I, etc." />
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
                {editingOferta ? 'Atualizar' : 'Criar'}
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
