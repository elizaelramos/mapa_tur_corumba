import { useState } from 'react'
import {
  Table, Button, Space, Tag, Card, Row, Col, Statistic, Typography, Input,
  Modal, Form, Switch, Select, message, Popconfirm
} from 'antd'
import {
  MedicineBoxOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons'
import {
  useGetMedicosQuery,
  useGetEspecialidadesQuery,
  useCreateMedicoMutation,
  useUpdateMedicoMutation,
  useDeleteMedicoMutation,
} from '../../store/slices/apiSlice'

const { Title, Text } = Typography

export default function MedicosPage() {
  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMedico, setEditingMedico] = useState(null)
  const [form] = Form.useForm()

  // API hooks - carrega TODOS os médicos (limite 10000 para garantir)
  const { data: medicosData, isLoading: loadingMedicos } = useGetMedicosQuery({ page: 1, limit: 10000 })
  const { data: especialidadesData } = useGetEspecialidadesQuery()
  const [createMedico, { isLoading: creating }] = useCreateMedicoMutation()
  const [updateMedico, { isLoading: updating }] = useUpdateMedicoMutation()
  const [deleteMedico] = useDeleteMedicoMutation()

  const medicos = medicosData?.data || []
  const especialidades = especialidadesData?.data || []

  // Filter by search text
  const medicosFiltered = medicos.filter(medico =>
    medico.nome.toLowerCase().includes(searchText.toLowerCase())
  )

  // Calculate statistics
  const totalMedicos = medicos.length
  const medicosAtivos = medicos.filter(m => m.ativo).length
  const medicosInativos = medicos.filter(m => !m.ativo).length

  // Handle create new doctor
  const handleCreate = () => {
    setEditingMedico(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true })
    setIsModalOpen(true)
  }

  // Handle edit doctor
  const handleEdit = (medico) => {
    setEditingMedico(medico)
    form.setFieldsValue({
      nome: medico.nome,
      cargo: medico.cargo,
      especialidades: medico.especialidades?.map(e => e.id) || [],
      ativo: medico.ativo,
    })
    setIsModalOpen(true)
  }

  // Handle delete doctor
  const handleDelete = async (id) => {
    try {
      await deleteMedico(id).unwrap()
      message.success('Professor excluído com sucesso!')
    } catch (error) {
      message.error('Erro ao excluir professor: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal submit
  const handleSubmit = async (values) => {
    try {
      const payload = {
        nome: values.nome,
        cargo: values.cargo || null,
        especialidades: values.especialidades || [],
        ativo: values.ativo ?? true,
      }

      if (editingMedico) {
        // Update existing doctor
        await updateMedico({ id: editingMedico.id, ...payload }).unwrap()
        message.success('Professor atualizado com sucesso!')
      } else {
        // Create new doctor - generate id_origem
        const id_origem = `manual_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
        await createMedico({ ...payload, id_origem }).unwrap()
        message.success('Professor criado com sucesso!')
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingMedico(null)
    } catch (error) {
      message.error('Erro ao salvar professor: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingMedico(null)
  }

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      width: '30%',
      render: (text) => (
        <Text strong style={{ fontSize: '14px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Função',
      dataIndex: 'cargo',
      key: 'cargo',
      width: '25%',
      render: (text) => (
        <Text style={{ fontSize: '14px' }}>
          {text || '-'}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 120,
      align: 'center',
      render: (ativo) => (
        <Tag
          icon={ativo ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={ativo ? 'success' : 'default'}
        >
          {ativo ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Confirmar exclusão"
            description={`Tem certeza que deseja excluir ${record.nome}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>
        <UserOutlined style={{ marginRight: '12px' }} />
        Gestão de Professores
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        Gerencie os professores cadastrados no sistema. Você pode criar, editar e excluir professores.
      </Text>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total de Professores"
              value={totalMedicos}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Professores Ativos"
              value={medicosAtivos}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Professores Inativos"
              value={medicosInativos}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table with search and actions */}
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Input.Search
              placeholder="Buscar professor por nome..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 400 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="large"
            >
              Novo Professor
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={medicosFiltered}
            loading={loadingMedicos}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: 20,
              total: medicosFiltered.length,
              onChange: setPage,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} professores`,
            }}
          />
        </Space>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingMedico ? 'Editar Professor' : 'Novo Professor'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ ativo: true }}
        >
          <Form.Item
            label="Nome do Professor"
            name="nome"
            rules={[{ required: true, message: 'Por favor, insira o nome do professor' }]}
          >
            <Input placeholder="Digite o nome completo do professor" />
          </Form.Item>

          <Form.Item
            label="Função"
            name="cargo"
          >
            <Input placeholder="Ex: Diretor, Coordenador Pedagógico, etc." />
          </Form.Item>

          <Form.Item
            label="Status"
            name="ativo"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Ativo"
              unCheckedChildren="Inativo"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating || updating}
                icon={editingMedico ? <EditOutlined /> : <PlusOutlined />}
              >
                {editingMedico ? 'Atualizar' : 'Criar'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
