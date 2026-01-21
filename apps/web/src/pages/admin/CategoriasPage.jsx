import { useState } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch,
  message, Popconfirm, Typography, Divider, Badge
} from 'antd'
import {
  TagsOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BarChartOutlined
} from '@ant-design/icons'
import {
  useGetCategoriasQuery,
  useGetCategoriasStatsQuery,
  useCreateCategoriaMutation,
  useUpdateCategoriaMutation,
  useDeleteCategoriaMutation,
} from '../../store/slices/apiSlice'

const { Title, Text } = Typography

export default function CategoriasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState(null)
  const [form] = Form.useForm()

  // API hooks
  const { data, isLoading } = useGetCategoriasQuery()
  const { data: statsData } = useGetCategoriasStatsQuery()
  const [createCategoria, { isLoading: creating }] = useCreateCategoriaMutation()
  const [updateCategoria, { isLoading: updating }] = useUpdateCategoriaMutation()
  const [deleteCategoria] = useDeleteCategoriaMutation()

  const categorias = data?.data || []
  const stats = statsData?.data || []

  // Handle create new categoria
  const handleCreate = () => {
    setEditingCategoria(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true, ordem: 0 })
    setIsModalOpen(true)
  }

  // Handle edit categoria
  const handleEdit = (categoria) => {
    setEditingCategoria(categoria)
    form.setFieldsValue({
      nome: categoria.nome,
      subcategoria: categoria.subcategoria || '',
      segmento: categoria.segmento || '',
      ordem: categoria.ordem,
      ativo: categoria.ativo,
    })
    setIsModalOpen(true)
  }

  // Handle delete categoria
  const handleDelete = async (id) => {
    try {
      await deleteCategoria(id).unwrap()
      message.success('Categoria excluída com sucesso!')
    } catch (error) {
      message.error('Erro ao excluir categoria: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal submit
  const handleSubmit = async (values) => {
    try {
      const payload = {
        nome: values.nome,
        subcategoria: values.subcategoria || null,
        segmento: values.segmento || null,
        ordem: values.ordem || 0,
        ativo: values.ativo ?? true,
      }

      if (editingCategoria) {
        await updateCategoria({ id: editingCategoria.id, ...payload }).unwrap()
        message.success('Categoria atualizada com sucesso!')
      } else {
        await createCategoria(payload).unwrap()
        message.success('Categoria criada com sucesso!')
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingCategoria(null)
    } catch (error) {
      message.error('Erro ao salvar categoria: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingCategoria(null)
  }

  // Get usage count from stats
  const getUsageCount = (categoriaId) => {
    const stat = stats.find(s => s.id === categoriaId)
    return stat?.total_unidades || 0
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
      title: 'Ordem',
      dataIndex: 'ordem',
      key: 'ordem',
      width: 100,
      sorter: (a, b) => a.ordem - b.ordem,
    },
    {
      title: 'Categoria',
      dataIndex: 'nome',
      key: 'nome',
      width: 250,
      render: (text) => <Text strong>{text}</Text>,
      sorter: (a, b) => a.nome.localeCompare(b.nome),
    },
    {
      title: 'Subcategoria',
      dataIndex: 'subcategoria',
      key: 'subcategoria',
      width: 200,
      render: (text) => text || <Text type="secondary">-</Text>,
      sorter: (a, b) => (a.subcategoria || '').localeCompare(b.subcategoria || ''),
    },
    {
      title: 'Segmento',
      dataIndex: 'segmento',
      key: 'segmento',
      width: 200,
      render: (text) => text || <Text type="secondary">-</Text>,
      sorter: (a, b) => (a.segmento || '').localeCompare(b.segmento || ''),
    },
    {
      title: 'Unidades',
      key: 'unidades',
      width: 120,
      render: (_, record) => {
        const count = getUsageCount(record.id)
        return (
          <Badge
            count={count}
            showZero
            style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }}
          />
        )
      },
      sorter: (a, b) => getUsageCount(a.id) - getUsageCount(b.id),
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 120,
      render: (ativo) => (
        <Tag color={ativo ? 'green' : 'red'}>
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
      title: 'Ações',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        const usageCount = getUsageCount(record.id)
        return (
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
              description={
                usageCount > 0
                  ? `Esta categoria está sendo usada por ${usageCount} unidade(s). Tem certeza que deseja excluir?`
                  : `Tem certeza que deseja excluir ${record.nome}?`
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Sim"
              cancelText="Não"
              disabled={usageCount > 0}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={usageCount > 0}
                title={usageCount > 0 ? 'Não é possível excluir categoria em uso' : ''}
              >
                Excluir
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  // Calculate statistics
  const totalCategorias = categorias.length
  const ativas = categorias.filter(c => c.ativo).length
  const inativas = categorias.filter(c => !c.ativo).length
  const totalUnidadesCategorizadas = stats.reduce((sum, s) => sum + s.total_unidades, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <TagsOutlined style={{ marginRight: '12px' }} />
          Categorias Turísticas
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Nova Categoria
        </Button>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>
            <BarChartOutlined /> Total de Categorias
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
            {totalCategorias}
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>
            Ativas
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
            {ativas}
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>
            Inativas
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
            {inativas}
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>
            Unidades Categorizadas
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
            {totalUnidadesCategorizadas}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={categorias}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `Total: ${total} categorias`,
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ ativo: true, ordem: 0 }}
        >
          <Divider orientation="left">
            <Text strong><TagsOutlined /> Informações da Categoria</Text>
          </Divider>

          <Form.Item
            label="Nome da Categoria (1º nível)"
            name="nome"
            rules={[{ required: true, message: 'Por favor, insira o nome da categoria' }]}
            tooltip="Categoria principal - 1º nível (ex: 'Onde Passear', 'Organize sua Viagem')"
          >
            <Input placeholder="Ex: Onde Passear" />
          </Form.Item>

          <Form.Item
            label="Subcategoria (2º nível)"
            name="subcategoria"
            tooltip="Subcategoria opcional (ex: 'Circuitos Culturais', 'Afroturismo')"
          >
            <Input placeholder="Ex: Circuitos Culturais (opcional)" />
          </Form.Item>

          <Form.Item
            label="Segmento (3º nível)"
            name="segmento"
            tooltip="Segmento específico opcional (3º nível da hierarquia)"
          >
            <Input placeholder="Ex: Passeios Temáticos (opcional)" />
          </Form.Item>

          <Form.Item
            label="Ordem de Exibição"
            name="ordem"
            tooltip="Define a ordem de exibição nos filtros (menor = aparece primeiro)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Status"
            name="ativo"
            valuePropName="checked"
          >
            <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={creating || updating}>
                {editingCategoria ? 'Atualizar' : 'Criar'} Categoria
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
