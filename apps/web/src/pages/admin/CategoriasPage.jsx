import { useState } from 'react'
import {
  Button, Space, Tag, Modal, Form, Input, InputNumber, Switch,
  message, Popconfirm, Typography, Badge, Card, Empty
} from 'antd'
import {
  TagsOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BarChartOutlined
} from '@ant-design/icons'
import {
  useGetCategoriasHierarchyQuery,
  useGetCategoriasStatsQuery,
  useGetUnidadesByCategoriaQuery,
  useCreateCategoriaMutation,
  useCreateSubcategoriaMutation,
  useCreateSegmentoMutation,
  useUpdateCategoriaMutation,
  useDeleteCategoriaMutation,
} from '../../store/slices/apiSlice'

const { Title, Text } = Typography

export default function CategoriasPage() {
  // State para seleções nas colunas Miller
  const [selectedCategoria, setSelectedCategoria] = useState(null)
  const [selectedSubcategoria, setSelectedSubcategoria] = useState(null)

  // State para modais
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null) // 'categoria', 'subcategoria', 'segmento'
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  // Modal de unidades
  const [unitsModalOpen, setUnitsModalOpen] = useState(false)
  const [viewingCategoria, setViewingCategoria] = useState(null)

  // API hooks
  const { data: hierarchyData, isLoading } = useGetCategoriasHierarchyQuery()
  const { data: statsData } = useGetCategoriasStatsQuery()
  const { data: categoriaUnidadesData, isLoading: unidadesLoading } = useGetUnidadesByCategoriaQuery(
    viewingCategoria?.id,
    { skip: !viewingCategoria }
  )

  const [createCategoria, { isLoading: creating }] = useCreateCategoriaMutation()
  const [createSubcategoria, { isLoading: creatingSub }] = useCreateSubcategoriaMutation()
  const [createSegmento, { isLoading: creatingSeg }] = useCreateSegmentoMutation()
  const [updateCategoria, { isLoading: updating }] = useUpdateCategoriaMutation()
  const [deleteCategoria] = useDeleteCategoriaMutation()

  const hierarchy = hierarchyData?.data || { categorias: [], subcategorias: {}, segmentos: {} }
  const stats = statsData?.data || []

  // Obter subcategorias da categoria selecionada
  const subcategorias = selectedCategoria
    ? (hierarchy.subcategorias[selectedCategoria.nome] || [])
    : []

  // Obter segmentos da subcategoria selecionada
  const segmentos = selectedSubcategoria
    ? (hierarchy.segmentos[`${selectedCategoria.nome}|${selectedSubcategoria.nome}`] || [])
    : []

  // Funções de manipulação de seleção
  const handleSelectCategoria = (categoria) => {
    setSelectedCategoria(categoria)
    setSelectedSubcategoria(null)
  }

  const handleSelectSubcategoria = (subcategoria) => {
    setSelectedSubcategoria(subcategoria)
  }

  // Funções de criação
  const handleCreateCategoria = () => {
    setModalType('categoria')
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true, ordem: 0 })
    setIsModalOpen(true)
  }

  const handleCreateSubcategoria = () => {
    if (!selectedCategoria) {
      message.warning('Selecione uma categoria primeiro')
      return
    }
    setModalType('subcategoria')
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true, ordem: 0 })
    setIsModalOpen(true)
  }

  const handleCreateSegmento = () => {
    if (!selectedSubcategoria) {
      message.warning('Selecione uma subcategoria primeiro')
      return
    }
    setModalType('segmento')
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true, ordem: 0 })
    setIsModalOpen(true)
  }

  // Funções de edição
  const handleEdit = (item, type) => {
    setModalType(type)
    setEditingItem(item)

    if (type === 'categoria') {
      form.setFieldsValue({
        nome: item.nome,
        ordem: item.ordem,
        ativo: item.ativo,
      })
    } else if (type === 'subcategoria') {
      form.setFieldsValue({
        nome: item.nome,
        ordem: item.ordem,
        ativo: item.ativo,
      })
    } else if (type === 'segmento') {
      form.setFieldsValue({
        nome: item.nome,
        ordem: item.ordem,
        ativo: item.ativo,
      })
    }

    setIsModalOpen(true)
  }

  // Função de exclusão
  const handleDelete = async (item) => {
    try {
      await deleteCategoria(item.id).unwrap()
      message.success('Item excluído com sucesso!')

      // Limpar seleções se necessário
      if (item === selectedCategoria) {
        setSelectedCategoria(null)
        setSelectedSubcategoria(null)
      } else if (item === selectedSubcategoria) {
        setSelectedSubcategoria(null)
      }
    } catch (error) {
      message.error('Erro ao excluir: ' + (error.data?.error || error.message))
    }
  }

  // Função de submit do modal
  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        // Edição - sempre usa o endpoint genérico
        await updateCategoria({
          id: editingItem.id,
          ...values
        }).unwrap()
        message.success('Item atualizado com sucesso!')
      } else {
        // Criação - usa endpoint específico
        if (modalType === 'categoria') {
          await createCategoria(values).unwrap()
          message.success('Categoria criada com sucesso!')
        } else if (modalType === 'subcategoria') {
          await createSubcategoria({
            categoriaPai: selectedCategoria.nome,
            nome: values.nome,
            ordem: values.ordem,
            ativo: values.ativo,
          }).unwrap()
          message.success('Subcategoria criada com sucesso!')
        } else if (modalType === 'segmento') {
          await createSegmento({
            categoriaPai: selectedCategoria.nome,
            subcategoriaPai: selectedSubcategoria.nome,
            nome: values.nome,
            ordem: values.ordem,
            ativo: values.ativo,
          }).unwrap()
          message.success('Segmento criado com sucesso!')
        }
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingItem(null)
    } catch (error) {
      message.error('Erro ao salvar: ' + (error.data?.error || error.message))
    }
  }

  // Funções de visualização de unidades
  const handleShowUnidades = (item) => {
    setViewingCategoria(item)
    setUnitsModalOpen(true)
  }

  const handleCloseUnidades = () => {
    setUnitsModalOpen(false)
    setViewingCategoria(null)
  }

  // Get usage count from stats
  const getUsageCount = (itemId) => {
    const stat = stats.find(s => s.id === itemId)
    return stat?.total_unidades || 0
  }

  // Renderizar item de coluna
  const renderColumnItem = (item, isSelected, onSelect, onEdit, type) => {
    const usageCount = getUsageCount(item.id)
    const canDelete = usageCount === 0

    return (
      <div
        key={item.id}
        onClick={() => onSelect(item)}
        style={{
          padding: '12px 16px',
          marginBottom: '8px',
          background: isSelected ? '#e6f7ff' : '#fff',
          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = '#40a9ff'
            e.currentTarget.style.background = '#f5f5f5'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = '#d9d9d9'
            e.currentTarget.style.background = '#fff'
          }
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: isSelected ? 600 : 400,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.nome}
            </div>
            <Space size={4}>
              <Tag color={item.ativo ? 'green' : 'red'} style={{ margin: 0, fontSize: '11px' }}>
                {item.ativo ? 'Ativo' : 'Inativo'}
              </Tag>
              {usageCount > 0 && (
                <Badge
                  count={usageCount}
                  showZero={false}
                  style={{ backgroundColor: '#52c41a', fontSize: '11px', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShowUnidades(item)
                  }}
                />
              )}
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Ord: {item.ordem}
              </Text>
            </Space>
          </div>
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item, type)
              }}
            />
            <Popconfirm
              title="Confirmar exclusão"
              description={
                usageCount > 0
                  ? `Este item está sendo usado por ${usageCount} unidade(s). Tem certeza?`
                  : `Tem certeza que deseja excluir "${item.nome}"?`
              }
              onConfirm={(e) => {
                e?.stopPropagation()
                handleDelete(item)
              }}
              okText="Sim"
              cancelText="Não"
              disabled={!canDelete}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={!canDelete}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        </div>
      </div>
    )
  }

  // Calcular estatísticas
  const totalCategorias = hierarchy.categorias.length
  const totalSubcategorias = Object.values(hierarchy.subcategorias).flat().length
  const totalSegmentos = Object.values(hierarchy.segmentos).flat().length
  const totalItens = totalCategorias + totalSubcategorias + totalSegmentos
  const totalUnidadesCategorizadas = stats.reduce((sum, s) => sum + s.total_unidades, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <TagsOutlined style={{ marginRight: '12px' }} />
          Categorias Turísticas
        </Title>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <Card size="small" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
            <BarChartOutlined /> Total de Itens
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
            {totalItens}
          </div>
        </Card>

        <Card size="small" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
            Categorias
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
            {totalCategorias}
          </div>
        </Card>

        <Card size="small" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
            Subcategorias
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#13c2c2' }}>
            {totalSubcategorias}
          </div>
        </Card>

        <Card size="small" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
            Segmentos
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
            {totalSegmentos}
          </div>
        </Card>

        <Card size="small" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
            Unidades Categorizadas
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
            {totalUnidadesCategorizadas}
          </div>
        </Card>
      </div>

      {/* Miller Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Coluna 1: Categorias */}
        <Card
          title={<span><TagsOutlined /> Categorias (1º nível)</span>}
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleCreateCategoria}
            >
              Adicionar
            </Button>
          }
          bodyStyle={{ padding: 12, maxHeight: '600px', overflowY: 'auto' }}
          loading={isLoading}
        >
          {hierarchy.categorias.length === 0 ? (
            <Empty description="Nenhuma categoria" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            hierarchy.categorias.map(cat =>
              renderColumnItem(
                cat,
                selectedCategoria?.id === cat.id,
                handleSelectCategoria,
                handleEdit,
                'categoria'
              )
            )
          )}
        </Card>

        {/* Coluna 2: Subcategorias */}
        <Card
          title={
            <span>
              <TagsOutlined /> Subcategorias (2º nível)
              {selectedCategoria && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                de "{selectedCategoria.nome}"
              </Text>}
            </span>
          }
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleCreateSubcategoria}
              disabled={!selectedCategoria}
            >
              Adicionar
            </Button>
          }
          bodyStyle={{ padding: 12, maxHeight: '600px', overflowY: 'auto' }}
        >
          {!selectedCategoria ? (
            <Empty
              description="Selecione uma categoria"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : subcategorias.length === 0 ? (
            <Empty
              description="Nenhuma subcategoria"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            subcategorias.map(sub =>
              renderColumnItem(
                sub,
                selectedSubcategoria?.id === sub.id,
                handleSelectSubcategoria,
                handleEdit,
                'subcategoria'
              )
            )
          )}
        </Card>

        {/* Coluna 3: Segmentos */}
        <Card
          title={
            <span>
              <TagsOutlined /> Segmentos (3º nível)
              {selectedSubcategoria && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                de "{selectedSubcategoria.nome}"
              </Text>}
            </span>
          }
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleCreateSegmento}
              disabled={!selectedSubcategoria}
            >
              Adicionar
            </Button>
          }
          bodyStyle={{ padding: 12, maxHeight: '600px', overflowY: 'auto' }}
        >
          {!selectedSubcategoria ? (
            <Empty
              description="Selecione uma subcategoria"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : segmentos.length === 0 ? (
            <Empty
              description="Nenhum segmento"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            segmentos.map(seg =>
              renderColumnItem(
                seg,
                false,
                () => {},
                handleEdit,
                'segmento'
              )
            )
          )}
        </Card>
      </div>

      {/* Modal de Unidades */}
      <Modal
        title={`Unidades - ${viewingCategoria?.nome || ''}`}
        open={unitsModalOpen}
        onCancel={handleCloseUnidades}
        footer={null}
        width={800}
      >
        {unidadesLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>Carregando unidades...</div>
        ) : categoriaUnidadesData?.data?.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {categoriaUnidadesData.data.map((unidade) => (
              <Card key={unidade.id} size="small" style={{ marginBottom: 8 }}>
                <div>
                  <Text strong>{unidade.nome}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {unidade.endereco} - {unidade.bairro}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="Nenhuma unidade encontrada" />
        )}
      </Modal>

      {/* Modal de Create/Edit */}
      <Modal
        title={
          editingItem
            ? `Editar ${modalType === 'categoria' ? 'Categoria' : modalType === 'subcategoria' ? 'Subcategoria' : 'Segmento'}`
            : `Nova ${modalType === 'categoria' ? 'Categoria' : modalType === 'subcategoria' ? 'Subcategoria' : 'Segmento'}`
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
          setEditingItem(null)
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ ativo: true, ordem: 0 }}
        >
          {modalType === 'subcategoria' && !editingItem && (
            <Form.Item label="Categoria Pai">
              <Input value={selectedCategoria?.nome} disabled />
            </Form.Item>
          )}

          {modalType === 'segmento' && !editingItem && (
            <>
              <Form.Item label="Categoria Pai">
                <Input value={selectedCategoria?.nome} disabled />
              </Form.Item>
              <Form.Item label="Subcategoria Pai">
                <Input value={selectedSubcategoria?.nome} disabled />
              </Form.Item>
            </>
          )}

          <Form.Item
            label={`Nome ${modalType === 'categoria' ? 'da Categoria' : modalType === 'subcategoria' ? 'da Subcategoria' : 'do Segmento'}`}
            name="nome"
            rules={[{ required: true, message: 'Por favor, insira o nome' }]}
          >
            <Input placeholder="Ex: Onde Passear" />
          </Form.Item>

          <Form.Item
            label="Ordem de Exibição"
            name="ordem"
            tooltip="Menor número aparece primeiro"
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

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsModalOpen(false)
                form.resetFields()
                setEditingItem(null)
              }}>
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating || creatingSub || creatingSeg || updating}
              >
                {editingItem ? 'Atualizar' : 'Criar'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
