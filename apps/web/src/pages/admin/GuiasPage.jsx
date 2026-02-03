import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Tag,
  InputNumber,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WhatsAppOutlined,
  GlobalOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  useGetAllGuiasQuery,
  useCreateGuiaMutation,
  useUpdateGuiaMutation,
  useDeleteGuiaMutation,
} from '../../store/slices/apiSlice';

const { Title } = Typography;
const { TextArea } = Input;

const GuiasPage = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGuia, setEditingGuia] = useState(null);

  // Queries e mutations
  const { data: guias = [], isLoading } = useGetAllGuiasQuery();
  const [createGuia, { isLoading: isCreating }] = useCreateGuiaMutation();
  const [updateGuia, { isLoading: isUpdating }] = useUpdateGuiaMutation();
  const [deleteGuia] = useDeleteGuiaMutation();

  // Handlers
  const handleCreate = () => {
    setEditingGuia(null);
    form.resetFields();
    form.setFieldsValue({ ativo: true, ordem: 0 });
    setModalVisible(true);
  };

  const handleEdit = (guia) => {
    setEditingGuia(guia);
    form.setFieldsValue(guia);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteGuia(id).unwrap();
      message.success('Guia removido com sucesso!');
    } catch (error) {
      message.error('Erro ao remover guia');
      console.error('Erro ao remover guia:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingGuia) {
        await updateGuia({ id: editingGuia.id, ...values }).unwrap();
        message.success('Guia atualizado com sucesso!');
      } else {
        await createGuia(values).unwrap();
        message.success('Guia criado com sucesso!');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingGuia(null);
    } catch (error) {
      if (error.errorFields) {
        message.error('Por favor, preencha todos os campos obrigatórios');
      } else {
        message.error('Erro ao salvar guia');
        console.error('Erro ao salvar guia:', error);
      }
    }
  };

  const handleWhatsAppClick = (whatsapp, nome) => {
    const numeroLimpo = whatsapp.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá ${nome}, contato via Admin do Mapa de Turismo.`);
    window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
  };

  // Colunas da tabela
  const columns = [
    {
      title: 'Ordem',
      dataIndex: 'ordem',
      key: 'ordem',
      width: 80,
      sorter: (a, b) => a.ordem - b.ordem,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      sorter: (a, b) => a.nome.localeCompare(b.nome),
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'WhatsApp',
      dataIndex: 'whatsapp',
      key: 'whatsapp',
      render: (whatsapp, record) => (
        <Button
          type="link"
          icon={<WhatsAppOutlined />}
          onClick={() => handleWhatsAppClick(whatsapp, record.nome)}
          style={{ padding: 0 }}
        >
          {whatsapp}
        </Button>
      ),
    },
    {
      title: 'Idiomas',
      dataIndex: 'idiomas',
      key: 'idiomas',
      render: (idiomas) => (
        <Space size={4}>
          <GlobalOutlined style={{ color: '#52c41a' }} />
          <span>{idiomas}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 100,
      filters: [
        { text: 'Ativo', value: true },
        { text: 'Inativo', value: false },
      ],
      onFilter: (value, record) => record.ativo === value,
      render: (ativo) => (
        <Tag color={ativo ? 'success' : 'default'}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: 0 }}
          >
            Editar
          </Button>
          <Popconfirm
            title="Tem certeza que deseja remover este guia?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: 0 }}
            >
              Remover
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Title level={2} style={{ margin: 0 }}>
            🧭 Guias Turísticos
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Novo Guia
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={guias}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} guias`,
          }}
        />
      </Card>

      {/* Modal de Criar/Editar */}
      <Modal
        title={editingGuia ? 'Editar Guia Turístico' : 'Novo Guia Turístico'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingGuia(null);
        }}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={isCreating || isUpdating}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="nome"
            label="Nome Completo"
            rules={[{ required: true, message: 'Nome é obrigatório' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Ex: João da Silva"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="whatsapp"
            label="WhatsApp"
            rules={[
              { required: true, message: 'WhatsApp é obrigatório' },
              { pattern: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, message: 'Formato inválido. Use: (67) 99999-9999' }
            ]}
          >
            <Input
              prefix={<WhatsAppOutlined />}
              placeholder="(67) 99999-9999"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="idiomas"
            label="Idiomas"
            rules={[{ required: true, message: 'Idiomas são obrigatórios' }]}
            extra="Separe múltiplos idiomas por vírgula"
          >
            <Input
              prefix={<GlobalOutlined />}
              placeholder="Ex: Português, Espanhol, Inglês"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="descricao"
            label="Descrição/Apresentação (Opcional)"
            extra="Breve apresentação do guia e suas especialidades"
          >
            <TextArea
              rows={4}
              placeholder="Ex: Guia especializado em ecoturismo e observação de aves no Pantanal..."
            />
          </Form.Item>

          <Form.Item
            name="foto_url"
            label="URL da Foto (Opcional)"
            extra="Link para foto do guia"
          >
            <Input
              placeholder="https://exemplo.com/foto.jpg"
              size="large"
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="ordem"
              label="Ordem de Exibição"
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0}
                placeholder="0"
                size="large"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="ativo"
              label="Status"
              valuePropName="checked"
              style={{ flex: 1 }}
            >
              <Switch
                checkedChildren="Ativo"
                unCheckedChildren="Inativo"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default GuiasPage;
