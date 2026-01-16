import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, InputNumber, message, Space, Upload, Image, Alert, Select } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  useGetStagingQuery,
  useEnrichStagingMutation,
  useValidateStagingMutation,
  useUploadUnidadeImagemMutation,
  useDeleteUnidadeImagemMutation,
  useUploadIconeMutation,
  useGetBairrosQuery,
} from '../../store/slices/apiSlice'

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Coordenadas padrão de Corumbá-MS
const DEFAULT_CENTER = [-19.0089, -57.6531]
const DEFAULT_ZOOM = 13

// Componente para invalidar o tamanho do mapa quando ele é exibido
function MapSizeInvalidator() {
  const map = useMap()

  useEffect(() => {
    // Pequeno delay para garantir que o modal está completamente renderizado
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => clearTimeout(timer)
  }, [map])

  return null
}

// Componente para capturar cliques no mapa
function LocationMarker({ position, setPosition, form }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setPosition([lat, lng])
      // Atualizar os campos do formulário
      form.setFieldsValue({
        latitude_manual: lat,
        longitude_manual: lng,
      })
    },
  })

  return position ? <Marker position={position} /> : null
}

export default function StagingPage() {
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [mapPosition, setMapPosition] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageFilename, setImageFilename] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [selectedBairro, setSelectedBairro] = useState(null)
  const [sortBy, setSortBy] = useState('id')
  const [order, setOrder] = useState('desc')

  const { data, isLoading } = useGetStagingQuery({ page, limit: 20, sortBy, order })
  const { data: bairrosData } = useGetBairrosQuery({ ativo: true })
  const [enrichStaging] = useEnrichStagingMutation()
  const [validateStaging] = useValidateStagingMutation()
  const [uploadImage] = useUploadUnidadeImagemMutation()
  const [deleteImage] = useDeleteUnidadeImagemMutation()
  const [uploadIcone] = useUploadIconeMutation()

  // Lista de bairros do banco de dados
  const bairros = bairrosData?.data?.map(b => b.nome).sort() || []

  const statusColors = {
    pendente: 'orange',
    validado: 'green',
    erro: 'red',
    ignorado: 'gray',
  }

  // Handler para mudança de ordenação e paginação

  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange chamado:', { pagination, filters, sorter, currentPage: page })

    // Handle sorting
    if (sorter && sorter.field) {
      const newOrder = sorter.order === 'ascend' ? 'asc' : 'desc'

      // Only update state if sort actually changed
      if (sorter.field !== sortBy || newOrder !== order) {
        console.log('Aplicando nova ordenação:', sorter.field, newOrder)
        setSortBy(sorter.field)
        setOrder(newOrder)
        setPage(1) // Resetar para primeira página APENAS se a ordenação mudou
        return // Importante: retornar para evitar conflito com a paginação abaixo
      }
    }

    // Handle pagination
    if (pagination && pagination.current !== page) {
      console.log('Mudando de página:', page, '->', pagination.current)
      setPage(pagination.current)
    }
  }

  const handleEnrich = (record) => {
    setSelectedRecord(record)

    // Resetar estado do mapa e imagem
    const lat = record.latitude_manual
    const lng = record.longitude_manual

    if (lat && lng) {
      setMapPosition([parseFloat(lat), parseFloat(lng)])
    } else {
      setMapPosition(null)
    }

    if (record.imagem_url) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8008/api'
      const baseUrl = apiUrl.replace('/api', '')
      setImageUrl(baseUrl + record.imagem_url)
      // Extrair filename do URL
      const filename = record.imagem_url.split('/').pop()
      setImageFilename(filename)
    } else {
      setImageUrl(null)
      setImageFilename(null)
    }

    if (record.icone_url) {
      setSelectedIcon(record.icone_url)
    } else {
      setSelectedIcon(null)
    }

    // Tentar extrair bairro do endereço existente
    let bairroExtraido = null
    if (record.endereco_manual) {
      const match = record.endereco_manual.match(/- ([^,]+),/)
      if (match && match[1]) {
        bairroExtraido = match[1].trim()
      }
    }
    setSelectedBairro(bairroExtraido)

    form.setFieldsValue({
      nome_familiar: record.nome_familiar,
      endereco_manual: record.endereco_manual,
      bairro: bairroExtraido,
      latitude_manual: record.latitude_manual,
      longitude_manual: record.longitude_manual,
      observacoes: record.observacoes,
    })
    setModalVisible(true)
  }

  const handleUploadImage = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('imagem', file)

    try {
      const result = await uploadImage(formData).unwrap()
      setImageFilename(result.data.filename)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8008/api'
      const baseUrl = apiUrl.replace('/api', '')
      setImageUrl(baseUrl + result.data.url)

      message.success('Imagem enviada com sucesso!')
    } catch (error) {
      message.error(error.data?.error || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }

    return false // Prevenir upload automático
  }

  const handleDeleteImage = async () => {
    if (!imageFilename) return

    try {
      await deleteImage(imageFilename).unwrap()
      setImageUrl(null)
      setImageFilename(null)
      message.success('Imagem removida com sucesso!')
    } catch (error) {
      message.error('Erro ao remover imagem')
    }
  }

  const handleUploadIcone = async (file) => {
    setUploadingIcon(true)
    const formData = new FormData()
    formData.append('icone', file)

    try {
      const result = await uploadIcone(formData).unwrap()
      setSelectedIcon(result.data.url)
      message.success('Ícone enviado com sucesso!')
    } catch (error) {
      message.error(error.data?.error || 'Erro ao enviar ícone')
    } finally {
      setUploadingIcon(false)
    }

    return false // Prevenir upload automático
  }

  const handleSaveEnrichment = async (values) => {
    try {
      // Incluir URL da imagem e ícone se houver
      const dataToSave = {
        ...values,
        imagem_url: imageUrl ? imageUrl.replace(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8008', '') : null,
        icone_url: selectedIcon || null,
      }

      const result = await enrichStaging({ id: selectedRecord.id, ...dataToSave }).unwrap()

      // Mostrar quantos registros foram atualizados
      if (result.records_updated) {
        message.success(`${result.records_updated} registros da mesma unidade foram enriquecidos!`)
      } else {
        message.success('Registro enriquecido com sucesso!')
      }

      setModalVisible(false)
      setMapPosition(null)
      setImageUrl(null)
      setImageFilename(null)
      setSelectedIcon(null)
      setSelectedBairro(null)
    } catch (error) {
      message.error('Erro ao enriquecer registro')
    }
  }

  const handleValidate = async (id) => {
    try {
      const result = await validateStaging(id).unwrap()

      // Mostrar mensagem detalhada sobre o agrupamento
      if (result.records_grouped > 1) {
        message.success(
          `${result.records_grouped} registros agrupados e validados! ` +
          `${result.medicos_count} médicos e ${result.especialidades_count} especialidades processadas.`,
          5 // Duração de 5 segundos
        )
      } else {
        message.success('Registro validado e promovido para produção!')
      }
    } catch (error) {
      message.error(error.data?.error || 'Erro ao validar registro')
    }
  }

  const handleModalClose = () => {
    setModalVisible(false)
    setMapPosition(null)
    setImageUrl(null)
    setImageFilename(null)
    setSelectedIcon(null)
    setSelectedBairro(null)
    form.resetFields()
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
      sortOrder: sortBy === 'id' ? (order === 'asc' ? 'ascend' : 'descend') : null,
    },
    {
      title: 'ID Origem',
      dataIndex: 'id_origem',
      key: 'id_origem',
      width: 120,
      sorter: true,
      sortOrder: sortBy === 'id_origem' ? (order === 'asc' ? 'ascend' : 'descend') : null,
    },
    {
      title: 'Unidade',
      dataIndex: 'nome_unidade_bruto',
      key: 'nome_unidade_bruto',
      sorter: true,
      sortOrder: sortBy === 'nome_unidade_bruto' ? (order === 'asc' ? 'ascend' : 'descend') : null,
    },
    {
      title: 'Médico',
      dataIndex: 'nome_medico_bruto',
      key: 'nome_medico_bruto',
      sorter: true,
      sortOrder: sortBy === 'nome_medico_bruto' ? (order === 'asc' ? 'ascend' : 'descend') : null,
    },
    {
      title: 'Especialidade',
      dataIndex: 'nome_especialidade_bruto',
      key: 'nome_especialidade_bruto',
      sorter: true,
      sortOrder: sortBy === 'nome_especialidade_bruto' ? (order === 'asc' ? 'ascend' : 'descend') : null,
    },
    {
      title: 'Status',
      dataIndex: 'status_processamento',
      key: 'status_processamento',
      width: 120,
      sorter: true,
      sortOrder: sortBy === 'status_processamento' ? (order === 'asc' ? 'ascend' : 'descend') : null,
      filters: [
        { text: 'Pendente', value: 'pendente' },
        { text: 'Validado', value: 'validado' },
        { text: 'Erro', value: 'erro' },
        { text: 'Ignorado', value: 'ignorado' },
      ],
      onFilter: (value, record) => record.status_processamento === value,
      render: (status) => <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEnrich(record)}>Enriquecer</Button>
          {record.status_processamento === 'pendente' && (
            <Button size="small" type="primary" onClick={() => handleValidate(record.id)}>
              Validar
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h1>Gerenciamento de Staging</h1>
      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        onChange={handleTableChange}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination?.total || 0,
        }}
      />

      <Modal
        title={`Enriquecer Registro #${selectedRecord?.id || ''}`}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        <Alert
          message="Dica: Clique no mapa para definir a localização"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} onFinish={handleSaveEnrichment} layout="vertical">
          {/* Informações originais */}
          <div style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <strong>Dados originais:</strong>
            <div>Unidade: {selectedRecord?.nome_unidade_bruto}</div>
            <div>Médico: {selectedRecord?.nome_medico_bruto}</div>
            <div>Especialidade: {selectedRecord?.nome_especialidade_bruto}</div>
          </div>

          <Form.Item name="nome_familiar" label="Nome Familiar (para exibição)">
            <Input placeholder="Ex: UBS Central, Hospital Municipal, etc." />
          </Form.Item>

          <Form.Item
            name="bairro"
            label="Bairro"
            rules={[{ required: true, message: 'Selecione o bairro' }]}
          >
            <Select
              placeholder="Selecione o bairro"
              showSearch
              value={selectedBairro}
              onChange={setSelectedBairro}
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

          <Form.Item name="endereco_manual" label="Endereço (Rua e Número)">
            <Input placeholder="Ex: R. Pernambuco, 396" />
          </Form.Item>

          <Form.Item name="telefone" label="Telefone">
            <Input placeholder="Ex: (67) 3234-5678" />
          </Form.Item>

          <Form.Item name="horario_atendimento" label="Horário de Atendimento">
            <Input.TextArea
              rows={3}
              placeholder="Ex: Segunda a Sexta: 07:00 às 17:00&#10;Sábado: 08:00 às 12:00&#10;Domingo: Fechado"
            />
          </Form.Item>

          {/* Mapa Interativo */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: 500
            }}>
              Localização no Mapa *
            </label>
            <div style={{ height: '400px', marginBottom: 16 }}>
              <MapContainer
                center={mapPosition || DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapSizeInvalidator />
                <LocationMarker
                  position={mapPosition}
                  setPosition={setMapPosition}
                  form={form}
                />
              </MapContainer>
            </div>
          </div>

          {/* Campos de latitude e longitude (auto-preenchidos pelo mapa) */}
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="latitude_manual"
              label="Latitude"
              rules={[{ required: true, message: 'Clique no mapa para definir' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                step={0.000001}
                precision={8}
                disabled
              />
            </Form.Item>
            <Form.Item
              name="longitude_manual"
              label="Longitude"
              rules={[{ required: true, message: 'Clique no mapa para definir' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                step={0.000001}
                precision={8}
                disabled
              />
            </Form.Item>
          </Space>

          {/* Upload de Imagem */}
          <Form.Item label="Imagem da Unidade">
            <Space direction="vertical" style={{ width: '100%' }}>
              {imageUrl && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Image
                    src={imageUrl}
                    alt="Pré-visualização"
                    style={{ maxWidth: '300px', maxHeight: '200px' }}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteImage}
                    style={{ marginTop: 8 }}
                  >
                    Remover Imagem
                  </Button>
                </div>
              )}
              {!imageUrl && (
                <Upload
                  beforeUpload={handleUploadImage}
                  maxCount={1}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    {uploading ? 'Enviando...' : 'Escolher Imagem'}
                  </Button>
                </Upload>
              )}
              <div style={{ fontSize: '12px', color: '#999' }}>
                Formatos aceitos: JPG, PNG, WEBP (máx. 2MB)
              </div>
            </Space>
          </Form.Item>

          {/* Seleção de Ícone */}
          <Form.Item label="Ícone do Marcador no Mapa">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                Escolha um dos ícones padrão ou adicione um novo:
              </div>
              <Space size="large" wrap>
                {[
                  { url: '/uploads/icon_mod_UBS.png', label: 'UBS' },
                  { url: '/uploads/icon_mod_Pronto_Atendimento.png', label: 'Pronto Atendimento' },
                  { url: '/uploads/icon_mod_Doacao.png', label: 'Hemonúcleo' },
                  { url: '/uploads/Icone_Academia_da_Saúde.png', label: 'Academia de Saúde' },
                ].map((icon) => (
                  <div
                    key={icon.url}
                    onClick={() => setSelectedIcon(icon.url)}
                    style={{
                      border: selectedIcon === icon.url ? '3px solid #1890ff' : '2px solid #d9d9d9',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      backgroundColor: selectedIcon === icon.url ? '#e6f7ff' : 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100px',
                      height: '100px',
                      gap: '8px',
                    }}
                  >
                    <img
                      src={icon.url}
                      alt={icon.label}
                      style={{ maxWidth: '50px', maxHeight: '50px', objectFit: 'contain' }}
                      onError={(e) => console.error('Erro ao carregar ícone:', e.target.src)}
                    />
                    <span style={{ fontSize: '11px', color: '#666', textAlign: 'center', fontWeight: selectedIcon === icon.url ? 'bold' : 'normal' }}>
                      {icon.label}
                    </span>
                  </div>
                ))}
                <Upload
                  beforeUpload={handleUploadIcone}
                  maxCount={1}
                  accept="image/svg+xml,image/png"
                  showUploadList={false}
                >
                  <Button
                    type="dashed"
                    icon={<UploadOutlined />}
                    loading={uploadingIcon}
                    style={{ width: '80px', height: '80px' }}
                  >
                    {uploadingIcon ? 'Enviando...' : 'Adicionar'}
                  </Button>
                </Upload>
              </Space>
              {selectedIcon && (
                <div style={{ marginTop: 8 }}>
                  <strong>Ícone selecionado:</strong>{' '}
                  <span style={{ fontSize: '12px', color: '#666' }}>{selectedIcon}</span>
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#999' }}>
                Formatos aceitos para novos ícones: SVG, PNG (máx. 500KB)
              </div>
            </Space>
          </Form.Item>

          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea rows={3} placeholder="Observações ou informações adicionais" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Salvar</Button>
              <Button onClick={handleModalClose}>Cancelar</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
