import { useState, useEffect } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch, Select,
  message, Popconfirm, Typography, Divider, Card, List, Alert, Upload, DatePicker, Tabs
} from 'antd'
import {
  EnvironmentOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ShopOutlined, CloseOutlined, WhatsAppOutlined, PhoneOutlined,
  FacebookOutlined, InstagramOutlined, GlobalOutlined, LinkOutlined,
  UploadOutlined, PictureOutlined, MailOutlined, TagsOutlined,
  IdcardOutlined, CalendarOutlined
} from '@ant-design/icons'
import {
  useGetUnidadesQuery,
  useCreateUnidadeMutation,
  useUpdateUnidadeMutation,
  useDeleteUnidadeMutation,
  useGetUnidadeRedesSociaisQuery,
  useCreateUnidadeRedeSocialMutation,
  useUpdateUnidadeRedeSocialMutation,
  useDeleteUnidadeRedeSocialMutation,
  useUploadUnidadeImagemMutation,
  useDeleteUnidadeImagemMutation,
  useGetBairrosQuery,
  useGetIconesQuery,
  useGetCategoriasQuery,
  useGetCategoriasHierarchyQuery,
} from '../../store/slices/apiSlice'
import LocationPicker from '../../components/LocationPicker'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

// Lista de setores turísticos
const SETORES_OPTIONS = [
  'AGÊNCIA DE VIAGENS',
  'HOTEL',
  'POUSADA',
  'RESTAURANTE',
  'LANCHONETE',
  'BAR',
  'PONTO TURÍSTICO',
  'MUSEU',
  'GALERIA',
  'COMÉRCIO',
  'ARTESANATO',
  'TRANSPORTE TURÍSTICO',
  'GUIA DE TURISMO',
  'OUTRO',
]

// Lista de redes sociais disponíveis
const REDES_SOCIAIS_OPTIONS = [
  { value: 'Facebook', label: 'Facebook', icon: <FacebookOutlined /> },
  { value: 'Instagram', label: 'Instagram', icon: <InstagramOutlined /> },
  { value: 'Twitter', label: 'Twitter', icon: <GlobalOutlined /> },
  { value: 'LinkedIn', label: 'LinkedIn', icon: <LinkOutlined /> },
  { value: 'YouTube', label: 'YouTube', icon: <GlobalOutlined /> },
  { value: 'TikTok', label: 'TikTok', icon: <GlobalOutlined /> },
  { value: 'Website', label: 'Website', icon: <GlobalOutlined /> },
  { value: 'Outro', label: 'Outro', icon: <LinkOutlined /> },
]

// Helper para obter URL completa da imagem
const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url
}

// Helper para formatar telefone automaticamente
const formatPhone = (value) => {
  if (!value) return ''

  // Remove todos os caracteres não numéricos
  let numbers = value.replace(/\D/g, '')

  // Remove zero inicial se houver
  if (numbers.startsWith('0')) {
    numbers = numbers.substring(1)
  }

  // Limita a 11 dígitos (DDD + número)
  numbers = numbers.substring(0, 11)

  // Formata conforme a quantidade de dígitos
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 6) {
    // (99) 9999
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  } else if (numbers.length <= 10) {
    // (99) 9999-9999 (fixo)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  } else {
    // (99) 99999-9999 (celular)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }
}

export default function UnidadesPage() {
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState(null)
  const [selectedCategorias, setSelectedCategorias] = useState([])
  const [redesSociais, setRedesSociais] = useState([])
  const [novaRedeSocial, setNovaRedeSocial] = useState({ nome_rede: '', url_perfil: '' })
  const [imageUrl, setImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [activeTab, setActiveTab] = useState('1')
  const [currentNome, setCurrentNome] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [form] = Form.useForm()

  // API hooks
  const { data, isLoading } = useGetUnidadesQuery({ page, limit: 20, search: searchTerm })
  const { data: bairrosData } = useGetBairrosQuery({ ativo: true })
  const { data: iconesData } = useGetIconesQuery({ ativo: 'true' })
  const { data: categoriasData } = useGetCategoriasQuery({ ativo: 'true' })
  const { data: hierarchyData } = useGetCategoriasHierarchyQuery()
  const [createUnidade, { isLoading: creating }] = useCreateUnidadeMutation()
  const [updateUnidade, { isLoading: updating }] = useUpdateUnidadeMutation()
  const [deleteUnidade] = useDeleteUnidadeMutation()
  const [uploadUnidadeImagem] = useUploadUnidadeImagemMutation()

  // Fetch unit redes sociais when editing
  const { data: unidadeRedesSociaisData } = useGetUnidadeRedesSociaisQuery(editingUnidade?.id, {
    skip: !editingUnidade
  })

  const [createRedeSocial, { isLoading: creatingRede }] = useCreateUnidadeRedeSocialMutation()
  const [updateRedeSocial, { isLoading: updatingRede }] = useUpdateUnidadeRedeSocialMutation()
  const [deleteRedeSocial] = useDeleteUnidadeRedeSocialMutation()

  const bairros = bairrosData?.data?.map(b => b.nome).sort() || []
  const categorias = categoriasData?.data || []
  const hierarchy = hierarchyData?.data || { categorias: [], subcategorias: {}, segmentos: {} }

  // Estado para seleção em cascata de categorias
  const [tempCategoria, setTempCategoria] = useState(null)
  const [tempSubcategoria, setTempSubcategoria] = useState(null)
  const [tempSegmento, setTempSegmento] = useState(null)

  // Estado para controlar abertura dos dropdowns
  const [openCategoriaSelect, setOpenCategoriaSelect] = useState(false)
  const [openSubcategoriaSelect, setOpenSubcategoriaSelect] = useState(false)
  const [openSegmentoSelect, setOpenSegmentoSelect] = useState(false)

  // Handle upload de imagem
  const handleUploadImagem = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('imagem', file)

    try {
      const result = await uploadUnidadeImagem(formData).unwrap()
      setImageUrl(result.data.url)
      message.success('Imagem enviada com sucesso!')
    } catch (error) {
      message.error(error.data?.error || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
    return false
  }

  // Handle create new unit
  const handleCreate = () => {
    setEditingUnidade(null)
    setSelectedCategorias([])
    setRedesSociais([])
    setImageUrl(null)
    setSelectedIcon(null)
    setCurrentNome('')
    setTempCategoria(null)
    setTempSubcategoria(null)
    setTempSegmento(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true })
    setIsModalOpen(true)
  }

  // Handle adicionar categoria em cascata
  const handleAdicionarCategoria = () => {
    if (!tempCategoria) {
      message.warning('Selecione uma categoria primeiro')
      return
    }

    // Buscar o ID correto baseado na seleção
    let categoriaId = null

    // Se tem segmento, buscar pelo segmento
    if (tempSegmento) {
      const key = `${tempCategoria.nome}|${tempSubcategoria.nome}`
      const segmento = hierarchy.segmentos[key]?.find(s => s.id === tempSegmento.id)
      if (segmento) {
        categoriaId = segmento.id
      }
    }
    // Se tem subcategoria mas não tem segmento, buscar pela subcategoria
    else if (tempSubcategoria) {
      const subcategoria = hierarchy.subcategorias[tempCategoria.nome]?.find(s => s.id === tempSubcategoria.id)
      if (subcategoria) {
        categoriaId = subcategoria.id
      }
    }
    // Se não tem subcategoria, buscar pela categoria
    else {
      categoriaId = tempCategoria.id
    }

    if (!categoriaId) {
      message.error('Erro ao adicionar categoria')
      return
    }

    // Verificar se já existe
    if (selectedCategorias.includes(categoriaId)) {
      message.warning('Esta categoria já foi adicionada')
      return
    }

    // Adicionar à lista
    setSelectedCategorias([...selectedCategorias, categoriaId])

    // Construir label para exibir
    let label = tempCategoria.nome
    if (tempSubcategoria) {
      label += ` → ${tempSubcategoria.nome}`
    }
    if (tempSegmento) {
      label += ` → ${tempSegmento.nome}`
    }

    message.success(`Categoria adicionada: ${label}`)

    // Limpar seleção temporária
    setTempCategoria(null)
    setTempSubcategoria(null)
    setTempSegmento(null)
  }

  // Handle remover categoria
  const handleRemoverCategoria = (categoriaId) => {
    setSelectedCategorias(selectedCategorias.filter(id => id !== categoriaId))
    message.success('Categoria removida')
  }

  // Obter label de uma categoria pelo ID
  const getCategoriaLabel = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId)
    if (!categoria) return 'Categoria não encontrada'

    let label = categoria.nome
    if (categoria.subcategoria) {
      label += ` → ${categoria.subcategoria}`
    }
    if (categoria.segmento) {
      label += ` → ${categoria.segmento}`
    }
    return label
  }

  // Handle edit unit
  const handleEdit = async (unidade) => {
    setEditingUnidade(unidade)
    setCurrentNome(unidade.nome || '')

    // Set image and icon if available
    setImageUrl(unidade.imagem_url || null)
    setSelectedIcon(unidade.icone_url || null)

    // Set categorias if available
    if (unidade.categorias && Array.isArray(unidade.categorias)) {
      const categoriaIds = unidade.categorias.map(c => c.id)
      setSelectedCategorias(categoriaIds)
    } else {
      setSelectedCategorias([])
    }

    // Reset temporary category selection
    setTempCategoria(null)
    setTempSubcategoria(null)
    setTempSegmento(null)

    // Set basic form fields
    form.setFieldsValue({
      nome: unidade.nome,
      nome_fantasia: unidade.nome_fantasia,
      razao_social: unidade.razao_social,
      cnpj: unidade.cnpj,
      setor: unidade.setor,
      endereco: unidade.endereco,
      bairro: unidade.bairro,
      latitude: parseFloat(unidade.latitude),
      longitude: parseFloat(unidade.longitude),
      telefone: unidade.telefone,
      whatsapp: unidade.whatsapp,
      email: unidade.email,
      horario_funcionamento: unidade.horario_funcionamento,
      descricao_servicos: unidade.descricao_servicos,
      data_cadastro: unidade.data_cadastro ? dayjs(unidade.data_cadastro) : null,
      data_vencimento: unidade.data_vencimento ? dayjs(unidade.data_vencimento) : null,
      ativo: unidade.ativo,
      categorias: unidade.categorias?.map(c => c.id) || [],
    })

    setIsModalOpen(true)
  }

  // Update redes sociais when unit data arrives
  useEffect(() => {
    if (editingUnidade && unidadeRedesSociaisData?.data) {
      setRedesSociais(unidadeRedesSociaisData.data)
    }
  }, [editingUnidade, unidadeRedesSociaisData])

  // Debounce search - aguarda 500ms após o usuário parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1) // Reset to first page when searching
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Handle delete unit
  const handleDelete = async (id) => {
    try {
      await deleteUnidade(id).unwrap()
      message.success('Unidade turística excluída com sucesso!')
    } catch (error) {
      message.error('Erro ao excluir unidade: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal submit
  const handleSubmit = async (values) => {
    try {
      const payload = {
        nome: values.nome,
        nome_fantasia: values.nome_fantasia || null,
        razao_social: values.razao_social || null,
        cnpj: values.cnpj || null,
        setor: values.setor || null,
        endereco: values.endereco || null,
        bairro: values.bairro || null,
        latitude: values.latitude,
        longitude: values.longitude,
        telefone: values.telefone || null,
        whatsapp: values.whatsapp || null,
        email: values.email || null,
        horario_funcionamento: values.horario_funcionamento || null,
        descricao_servicos: values.descricao_servicos || null,
        data_cadastro: values.data_cadastro ? values.data_cadastro.toISOString() : null,
        data_vencimento: values.data_vencimento ? values.data_vencimento.toISOString() : null,
        ativo: values.ativo ?? true,
        categorias: selectedCategorias,
        imagem_url: imageUrl || null,
        icone_url: selectedIcon || null,
      }

      let unidadeId

      if (editingUnidade) {
        // Update existing unit
        await updateUnidade({ id: editingUnidade.id, ...payload }).unwrap()
        unidadeId = editingUnidade.id

        // Gerenciar redes sociais para unidade existente
        const redesSociaisExistentes = unidadeRedesSociaisData?.data || []

        // Deletar redes sociais que foram removidas
        for (const redeExistente of redesSociaisExistentes) {
          const aindaExiste = redesSociais.some(r => r.id === redeExistente.id)
          if (!aindaExiste) {
            await deleteRedeSocial({ id: unidadeId, redeId: redeExistente.id }).unwrap()
          }
        }

        // Criar novas redes sociais
        for (const rede of redesSociais) {
          if (!redesSociaisExistentes.some(r => r.id === rede.id)) {
            await createRedeSocial({
              id: unidadeId,
              nome_rede: rede.nome_rede,
              url_perfil: rede.url_perfil,
            }).unwrap()
          }
        }

        message.success('Unidade turística atualizada com sucesso!')
      } else {
        // Create new unit
        const novaUnidade = await createUnidade(payload).unwrap()
        unidadeId = novaUnidade.data.id

        // Salvar redes sociais para nova unidade
        for (const rede of redesSociais) {
          await createRedeSocial({
            id: unidadeId,
            nome_rede: rede.nome_rede,
            url_perfil: rede.url_perfil,
          }).unwrap()
        }

        message.success('Unidade turística criada com sucesso!')
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingUnidade(null)
      setSelectedCategorias([])
      setRedesSociais([])
      setImageUrl(null)
      setSelectedIcon(null)
    } catch (error) {
      message.error('Erro ao salvar unidade turística: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingUnidade(null)
    setSelectedCategorias([])
    setRedesSociais([])
    setImageUrl(null)
    setSelectedIcon(null)
    setNovaRedeSocial({ nome_rede: '', url_perfil: '' })
    setActiveTab('1')
    setCurrentNome('')
    setTempCategoria(null)
    setTempSubcategoria(null)
    setTempSegmento(null)
  }

  // Handle adding rede social
  const handleAddRedeSocial = () => {
    if (!novaRedeSocial.nome_rede || !novaRedeSocial.url_perfil) {
      message.error('Preencha todos os campos da rede social')
      return
    }

    if (redesSociais.length >= 3) {
      message.error('Limite máximo de 3 redes sociais por unidade')
      return
    }

    setRedesSociais([...redesSociais, {
      nome_rede: novaRedeSocial.nome_rede,
      url_perfil: novaRedeSocial.url_perfil,
      id: Date.now()
    }])
    setNovaRedeSocial({ nome_rede: '', url_perfil: '' })
    message.success('Rede social adicionada')
  }

  // Handle updating rede social
  const handleUpdateRedeSocial = async (redeId, values) => {
    try {
      if (!editingUnidade) {
        setRedesSociais(redesSociais.map(rede =>
          rede.id === redeId ? { ...rede, ...values } : rede
        ))
        message.success('Rede social atualizada')
        return
      }

      await updateRedeSocial({
        id: editingUnidade.id,
        redeId,
        nome_rede: values.nome_rede,
        url_perfil: values.url_perfil,
      }).unwrap()

      message.success('Rede social atualizada')
    } catch (error) {
      message.error('Erro ao atualizar rede social: ' + (error.data?.error || error.message))
    }
  }

  // Handle removing rede social
  const handleRemoveRedeSocial = async (redeId) => {
    try {
      if (!editingUnidade) {
        setRedesSociais(redesSociais.filter(rede => rede.id !== redeId))
        message.success('Rede social removida')
        return
      }

      await deleteRedeSocial({
        id: editingUnidade.id,
        redeId,
      }).unwrap()

      message.success('Rede social removida')
    } catch (error) {
      message.error('Erro ao remover rede social: ' + (error.data?.error || error.message))
    }
  }

  // Get icon for social network
  const getRedeSocialIcon = (nomeRede) => {
    const rede = REDES_SOCIAIS_OPTIONS.find(r => r.value === nomeRede)
    return rede ? rede.icon : <LinkOutlined />
  }

  // Table columns
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      width: 250,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Setor',
      dataIndex: 'setor',
      key: 'setor',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Bairro',
      dataIndex: 'bairro',
      key: 'bairro',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 100,
      render: (ativo) => <Tag color={ativo ? 'green' : 'red'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <ShopOutlined style={{ marginRight: '12px' }} />
          Unidades Turísticas
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Nova Unidade
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Buscar por nome, razão social, endereço ou setor..."
          allowClear
          size="large"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ maxWidth: 600 }}
          loading={searchInput !== searchTerm && searchInput !== ''}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination?.total || 0,
          onChange: setPage,
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingUnidade ? 'Editar Unidade Turística' : 'Nova Unidade Turística'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ ativo: true }}
        >
          {/* Exibir nome da unidade sendo editada/criada */}
          {currentNome && (
            <Alert
              message={
                <Space>
                  <ShopOutlined />
                  <Text strong>{editingUnidade ? 'Editando:' : 'Criando:'} {currentNome}</Text>
                </Space>
              }
              type="info"
              showIcon={false}
              style={{ marginBottom: 16 }}
            />
          )}

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* Aba 1: Informações Básicas */}
            <Tabs.TabPane
              tab={
                <span>
                  <IdcardOutlined />
                  Informações Básicas
                </span>
              }
              key="1"
            >
              <Form.Item
                label="Nome"
                name="nome"
                rules={[{ required: true, message: 'Por favor, insira o nome da unidade' }]}
              >
                <Input
                  placeholder="Nome para exibição no mapa"
                  onChange={(e) => setCurrentNome(e.target.value)}
                />
              </Form.Item>

              <Form.Item label="Nome Fantasia" name="nome_fantasia">
                <Input placeholder="Nome comercial" />
              </Form.Item>

              <Form.Item label="Razão Social" name="razao_social">
                <Input placeholder="Nome empresarial" />
              </Form.Item>

              <Form.Item label="CNPJ" name="cnpj">
                <Input placeholder="00.000.000/0000-00" />
              </Form.Item>

              <Form.Item label="Setor" name="setor">
                <Select placeholder="Selecione o setor" allowClear showSearch>
                  {SETORES_OPTIONS.map((setor) => (
                    <Select.Option key={setor} value={setor}>
                      {setor}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Endereço" name="endereco">
                <Input placeholder="Digite o endereço completo" />
              </Form.Item>

              <Form.Item label="Bairro" name="bairro">
                <Select
                  placeholder="Selecione o bairro"
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {bairros.map((bairro) => (
                    <Select.Option key={bairro} value={bairro}>
                      {bairro}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Status"
                name="ativo"
                valuePropName="checked"
              >
                <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
              </Form.Item>

              <Form.Item label="Data de Cadastro" name="data_cadastro">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="Data de Vencimento" name="data_vencimento">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Tabs.TabPane>

            {/* Aba 2: Categorização */}
            <Tabs.TabPane
              tab={
                <span>
                  <TagsOutlined />
                  Categorização
                </span>
              }
              key="2"
            >
              <Alert
                message="Adicionar Categoria"
                description="Selecione a categoria, subcategoria (opcional) e segmento (opcional), depois clique em Adicionar."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {/* Seleção em Cascata */}
              <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* Categoria (1º nível) */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>1. Categoria</Text>
                    <Select
                      placeholder="Selecione a categoria"
                      value={tempCategoria?.id}
                      onChange={(value) => {
                        const cat = hierarchy.categorias.find(c => c.id === value)
                        setTempCategoria(cat || null)
                        setTempSubcategoria(null)
                        setTempSegmento(null)
                        setOpenCategoriaSelect(false)
                      }}
                      style={{ width: '100%' }}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      allowClear
                      open={openCategoriaSelect}
                      onDropdownVisibleChange={setOpenCategoriaSelect}
                    >
                      {hierarchy.categorias.map((cat) => (
                        <Select.Option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>

                  {/* Subcategoria (2º nível) */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      2. Subcategoria <Text type="secondary">(opcional)</Text>
                    </Text>
                    <Select
                      placeholder={tempCategoria ? "Selecione a subcategoria" : "Selecione uma categoria primeiro"}
                      value={tempSubcategoria?.id}
                      onChange={(value) => {
                        if (!tempCategoria) return
                        const subcats = hierarchy.subcategorias[tempCategoria.nome] || []
                        const subcat = subcats.find(s => s.id === value)
                        setTempSubcategoria(subcat || null)
                        setTempSegmento(null)
                        setOpenSubcategoriaSelect(false)
                      }}
                      style={{ width: '100%' }}
                      disabled={!tempCategoria}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      allowClear
                      open={openSubcategoriaSelect}
                      onDropdownVisibleChange={setOpenSubcategoriaSelect}
                    >
                      {tempCategoria && (hierarchy.subcategorias[tempCategoria.nome] || []).map((subcat) => (
                        <Select.Option key={subcat.id} value={subcat.id}>
                          {subcat.nome}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>

                  {/* Segmento (3º nível) */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      3. Segmento <Text type="secondary">(opcional)</Text>
                    </Text>
                    <Select
                      placeholder={tempSubcategoria ? "Selecione o segmento" : "Selecione uma subcategoria primeiro"}
                      value={tempSegmento?.id}
                      onChange={(value) => {
                        if (!tempCategoria || !tempSubcategoria) return
                        const key = `${tempCategoria.nome}|${tempSubcategoria.nome}`
                        const segs = hierarchy.segmentos[key] || []
                        const seg = segs.find(s => s.id === value)
                        setTempSegmento(seg || null)
                        setOpenSegmentoSelect(false)
                      }}
                      style={{ width: '100%' }}
                      disabled={!tempSubcategoria}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      allowClear
                      open={openSegmentoSelect}
                      onDropdownVisibleChange={setOpenSegmentoSelect}
                    >
                      {tempCategoria && tempSubcategoria && (
                        hierarchy.segmentos[`${tempCategoria.nome}|${tempSubcategoria.nome}`] || []
                      ).map((seg) => (
                        <Select.Option key={seg.id} value={seg.id}>
                          {seg.nome}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>

                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdicionarCategoria}
                    disabled={!tempCategoria}
                    block
                  >
                    Adicionar Categoria
                  </Button>
                </Space>
              </Card>

              {/* Lista de Categorias Selecionadas */}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Categorias Selecionadas ({selectedCategorias.length})
                </Text>
                {selectedCategorias.length === 0 ? (
                  <Alert
                    message="Nenhuma categoria selecionada"
                    description="Adicione pelo menos uma categoria para esta unidade turística."
                    type="warning"
                    showIcon
                  />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {selectedCategorias.map((catId) => (
                      <Card
                        key={catId}
                        size="small"
                        style={{ backgroundColor: '#f0f9ff' }}
                        extra={
                          <Button
                            type="link"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoverCategoria(catId)}
                          >
                            Remover
                          </Button>
                        }
                      >
                        <Space>
                          <TagsOutlined style={{ color: '#1890ff' }} />
                          <Text>{getCategoriaLabel(catId)}</Text>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                )}
              </div>

              <Divider />

              <Form.Item label="Serviços Oferecidos" name="descricao_servicos">
                <TextArea
                  rows={4}
                  placeholder="Descreva os serviços oferecidos pela unidade turística"
                />
              </Form.Item>
            </Tabs.TabPane>

            {/* Aba 3: Localização */}
            <Tabs.TabPane
              tab={
                <span>
                  <EnvironmentOutlined />
                  Localização
                </span>
              }
              key="3"
            >
              {/* Hidden fields for latitude/longitude */}
              <Form.Item name="latitude" hidden rules={[{ required: true, message: 'Selecione a localização no mapa' }]}>
                <InputNumber />
              </Form.Item>
              <Form.Item name="longitude" hidden rules={[{ required: true, message: 'Selecione a localização no mapa' }]}>
                <InputNumber />
              </Form.Item>

              {/* Map Location Picker */}
              <LocationPicker
                latitude={form.getFieldValue('latitude')}
                longitude={form.getFieldValue('longitude')}
                onChange={(coords) => {
                  form.setFieldsValue({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  })
                }}
              />
            </Tabs.TabPane>

            {/* Aba 4: Contato */}
            <Tabs.TabPane
              tab={
                <span>
                  <PhoneOutlined />
                  Contato
                </span>
              }
              key="4"
            >
              <Form.Item label="Telefone" name="telefone">
                <Input
                  placeholder="(67) 3234-5678"
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    form.setFieldValue('telefone', formatted)
                  }}
                />
              </Form.Item>

              <Form.Item label="WhatsApp">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="whatsapp" noStyle>
                    <Input
                      placeholder="(67) 99999-9999"
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value)
                        form.setFieldValue('whatsapp', formatted)
                      }}
                    />
                  </Form.Item>
                  <Button
                    icon={<WhatsAppOutlined />}
                    onClick={() => {
                      const whatsapp = form.getFieldValue('whatsapp');
                      if (whatsapp) {
                        const cleanNumber = whatsapp.replace(/\D/g, '');
                        window.open(`https://wa.me/55${cleanNumber}`, '_blank');
                      } else {
                        message.warning('Por favor, insira um número de WhatsApp primeiro');
                      }
                    }}
                  >
                    Testar
                  </Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item label="Email" name="email">
                <Input
                  prefix={<MailOutlined />}
                  placeholder="contato@empresa.com.br"
                  type="email"
                />
              </Form.Item>

              <Form.Item label="Horário de Funcionamento" name="horario_funcionamento">
                <TextArea
                  rows={3}
                  placeholder="Ex: Segunda a Sexta: 8h às 18h&#10;Sábado: 8h às 12h"
                />
              </Form.Item>
            </Tabs.TabPane>

            {/* Aba 5: Mídia */}
            <Tabs.TabPane
              tab={
                <span>
                  <PictureOutlined />
                  Mídia
                </span>
              }
              key="5"
            >
              {/* Upload de Imagem */}
              <Form.Item label="Imagem da Unidade">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {imageUrl && (
                    <div style={{ marginBottom: 12 }}>
                      <img
                        src={imageUrl}
                        alt="Pré-visualização"
                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  <Upload
                    beforeUpload={handleUploadImagem}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button icon={<UploadOutlined />} loading={uploading}>
                      {imageUrl ? 'Alterar Imagem' : 'Enviar Imagem'}
                    </Button>
                  </Upload>
                  {imageUrl && (
                    <Button
                      danger
                      size="small"
                      onClick={() => {
                        setImageUrl(null)
                        message.info('Imagem removida')
                      }}
                    >
                      Remover Imagem
                    </Button>
                  )}
                </Space>
              </Form.Item>

              {/* Seleção de Ícone */}
              <Form.Item label="Ícone no Mapa">
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {iconesData?.data?.map((icone) => (
                    <div
                      key={icone.id}
                      onClick={() => setSelectedIcon(icone.url)}
                      style={{
                        width: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          border: selectedIcon === icone.url ? '3px solid #1890ff' : '1px solid #d9d9d9',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selectedIcon === icone.url ? '#e6f7ff' : 'white',
                          marginBottom: 4,
                        }}
                      >
                        <img
                          src={icone.url}
                          alt={icone.nome}
                          style={{ maxWidth: '90%', maxHeight: '90%' }}
                        />
                      </div>
                      <Text
                        style={{
                          fontSize: 11,
                          textAlign: 'center',
                          color: selectedIcon === icone.url ? '#1890ff' : '#666',
                          fontWeight: selectedIcon === icone.url ? 'bold' : 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {icone.nome}
                      </Text>
                    </div>
                  ))}
                </div>
                {selectedIcon && (
                  <Button
                    danger
                    size="small"
                    style={{ marginTop: 8 }}
                    onClick={() => setSelectedIcon(null)}
                  >
                    Remover Ícone
                  </Button>
                )}
              </Form.Item>

              <Divider>Redes Sociais</Divider>

              {/* Lista de Redes Sociais */}
              {redesSociais.length > 0 && (
                <Card size="small" style={{ marginBottom: 16 }}>
                  <List
                    size="small"
                    dataSource={redesSociais}
                    renderItem={(rede) => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            size="small"
                            onClick={() => window.open(rede.url_perfil, '_blank')}
                          >
                            Abrir
                          </Button>,
                          <Popconfirm
                            title="Remover rede social?"
                            onConfirm={() => handleRemoveRedeSocial(rede.id)}
                            okText="Sim"
                            cancelText="Não"
                          >
                            <Button type="link" danger size="small">
                              Remover
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={getRedeSocialIcon(rede.nome_rede)}
                          title={rede.nome_rede}
                          description={rede.url_perfil}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {redesSociais.length < 3 && (
                <Card size="small" title="Adicionar Rede Social">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Select
                      placeholder="Selecione a rede social"
                      value={novaRedeSocial.nome_rede}
                      onChange={(value) => setNovaRedeSocial({ ...novaRedeSocial, nome_rede: value })}
                      style={{ width: '100%' }}
                    >
                      {REDES_SOCIAIS_OPTIONS.map((option) => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                    <Input
                      placeholder="URL do perfil (ex: https://instagram.com/usuario)"
                      value={novaRedeSocial.url_perfil}
                      onChange={(e) => setNovaRedeSocial({ ...novaRedeSocial, url_perfil: e.target.value })}
                    />
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={handleAddRedeSocial}
                      block
                    >
                      Adicionar Rede Social
                    </Button>
                  </Space>
                </Card>
              )}

              {redesSociais.length >= 3 && (
                <Alert
                  message="Limite de redes sociais atingido"
                  description="Cada unidade pode ter no máximo 3 redes sociais cadastradas."
                  type="info"
                  showIcon
                />
              )}
            </Tabs.TabPane>
          </Tabs>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={creating || updating}>
                {editingUnidade ? 'Atualizar' : 'Criar'} Unidade Turística
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
