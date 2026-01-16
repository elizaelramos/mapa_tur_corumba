import { useState, useEffect } from 'react'
import {
  Table, Button, Space, Modal, Form, Input, Upload, message,
  Popconfirm, Typography, InputNumber, Image, Tag, Card
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  PictureOutlined, DragOutlined, EyeOutlined
} from '@ant-design/icons'
import {
  useGetIconesQuery,
  useCreateIconeMutation,
  useUpdateIconeMutation,
  useDeleteIconeMutation,
  useUploadIconeFileMutation,
  useReordenarIconesMutation,
} from '../../store/slices/apiSlice'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const { Title, Text } = Typography

// Helper para obter URL completa
const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  // Usar caminho relativo que será resolvido pelo proxy do Vite
  return url
}

// Componente de linha arrastável
function DraggableRow({ id, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
  }

  return <tr ref={setNodeRef} style={style} {...props} />
}

export default function IconesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIcone, setEditingIcone] = useState(null)
  const [iconUrl, setIconUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [form] = Form.useForm()

  // API hooks
  const { data, isLoading, refetch } = useGetIconesQuery({ ativo: 'all' })
  const [createIcone, { isLoading: creating }] = useCreateIconeMutation()
  const [updateIcone, { isLoading: updating }] = useUpdateIconeMutation()
  const [deleteIcone] = useDeleteIconeMutation()
  const [uploadIconeFile] = useUploadIconeFileMutation()
  const [reordenarIcones] = useReordenarIconesMutation()

  // Atualizar dataSource quando os dados mudarem
  useEffect(() => {
    if (data?.data) {
      setDataSource(data.data)
    }
  }, [data])

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Handle upload de ícone
  const handleUploadIcone = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('icone', file)

    try {
      const result = await uploadIconeFile(formData).unwrap()
      console.log('Resultado do upload:', result)
      console.log('Informações do arquivo:', { name: file.name, size: file.size, type: file.type })
      setIconUrl(result.data.url)
      form.setFieldsValue({ url: result.data.url })
      message.success(`Ícone enviado com sucesso!`)
    } catch (error) {
      console.error('Erro no upload:', error)
      message.error(error.data?.error || 'Erro ao enviar ícone')
    } finally {
      setUploading(false)
    }
    return false
  }

  // Handle create
  const handleCreate = () => {
    setEditingIcone(null)
    setIconUrl(null)
    form.resetFields()
    form.setFieldsValue({ ordem: (data?.data?.length || 0) + 1 })
    setIsModalOpen(true)
  }

  // Handle edit
  const handleEdit = (icone) => {
    setEditingIcone(icone)
    setIconUrl(icone.url)
    form.setFieldsValue({
      nome: icone.nome,
      url: icone.url,
      ordem: icone.ordem,
    })
    setIsModalOpen(true)
  }

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteIcone(id).unwrap()
      message.success('Ícone excluído com sucesso!')
    } catch (error) {
      message.error('Erro ao excluir ícone: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal submit
  const handleSubmit = async (values) => {
    try {
      if (!iconUrl) {
        message.error('Por favor, faça upload de um ícone')
        return
      }

      const payload = {
        nome: values.nome,
        url: iconUrl,
        ordem: values.ordem || 0,
      }

      if (editingIcone) {
        await updateIcone({ id: editingIcone.id, ...payload }).unwrap()
        message.success('Ícone atualizado com sucesso!')
      } else {
        await createIcone(payload).unwrap()
        message.success('Ícone criado com sucesso!')
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingIcone(null)
      setIconUrl(null)
    } catch (error) {
      message.error('Erro ao salvar ícone: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingIcone(null)
    setIconUrl(null)
  }

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = dataSource.findIndex((item) => item.id === active.id)
      const newIndex = dataSource.findIndex((item) => item.id === over.id)

      const newData = arrayMove(dataSource, oldIndex, newIndex)
      setDataSource(newData)

      // Atualizar ordem no backend
      const updateData = newData.map((item, index) => ({
        id: item.id,
        ordem: index + 1,
      }))

      try {
        await reordenarIcones(updateData).unwrap()
        message.success('Ordem atualizada!')
        refetch()
      } catch (error) {
        message.error('Erro ao reordenar')
        setDataSource(data?.data || [])
      }
    }
  }

  // Table columns
  const columns = [
    {
      title: <DragOutlined />,
      width: 40,
      render: () => <DragOutlined style={{ cursor: 'move', color: '#999' }} />,
    },
    {
      title: 'Ordem',
      dataIndex: 'ordem',
      key: 'ordem',
      width: 80,
    },
    {
      title: 'Visualização',
      dataIndex: 'url',
      key: 'preview',
      width: 100,
      render: (url) => (
        <Image
          src={getFullImageUrl(url)}
          alt="Ícone"
          width={40}
          height={40}
          style={{ objectFit: 'contain' }}
          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23ddd' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E%3F%3C/text%3E%3C/svg%3E"
          preview={{
            mask: <EyeOutlined />
          }}
        />
      ),
    },
    {
      title: 'Nome/Descrição',
      dataIndex: 'nome',
      key: 'nome',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (text) => <Text type="secondary" style={{ fontSize: '12px' }}>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 100,
      render: (ativo) => (
        <Tag color={ativo ? 'green' : 'red'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
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
            description={`Tem certeza que deseja excluir "${record.nome}"?`}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <PictureOutlined style={{ marginRight: '12px' }} />
          Gerenciamento de Ícones
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Novo Ícone
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Text type="secondary">
          <strong>Instruções:</strong> Arraste as linhas para reordenar os ícones. A ordem aqui define a ordem de exibição na legenda do mapa público.
        </Text>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={dataSource.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            components={{
              body: {
                row: DraggableRow,
              },
            }}
            columns={columns}
            dataSource={dataSource}
            loading={isLoading}
            rowKey="id"
            pagination={false}
            onRow={(record) => ({
              id: record.id,
            })}
          />
        </SortableContext>
      </DndContext>

      {/* Create/Edit Modal */}
      <Modal
        title={editingIcone ? 'Editar Ícone' : 'Novo Ícone'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Nome/Descrição do Ícone"
            name="nome"
            rules={[{ required: true, message: 'Por favor, insira o nome do ícone' }]}
          >
            <Input placeholder="Ex: Escola Municipal " />
          </Form.Item>

          <Form.Item
            label="Ordem de Exibição"
            name="ordem"
            rules={[{ required: true, message: 'Por favor, insira a ordem' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Arquivo do Ícone" required>
            <Space direction="vertical" style={{ width: '100%' }}>
              {iconUrl && (
                <div style={{ marginBottom: 12, textAlign: 'center' }}>
                    <Image
                    src={getFullImageUrl(iconUrl)}
                    alt="Pré-visualização"
                    width={80}
                    height={80}
                    style={{ objectFit: 'contain', border: '1px solid #d9d9d9', borderRadius: '8px', padding: '8px' }}
                  />
                </div>
              )}
              <Upload
                beforeUpload={handleUploadIcone}
                maxCount={1}
                accept="image/png,image/svg+xml,image/jpeg"
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} loading={uploading} block>
                  {uploading ? 'Enviando...' : iconUrl ? 'Trocar Ícone' : 'Fazer Upload do Ícone'}
                </Button>
              </Upload>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Formatos aceitos: PNG, SVG, JPG (máx. 500KB)
              </div>
            </Space>
          </Form.Item>

          <Form.Item name="url" hidden>
            <Input />
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
                icon={editingIcone ? <EditOutlined /> : <PlusOutlined />}
              >
                {editingIcone ? 'Atualizar' : 'Criar'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
