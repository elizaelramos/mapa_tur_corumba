import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Statistic,
  Row,
  Col,
  Typography,
  Popconfirm,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useGetEspecialidadesBrutasQuery, useGetMapeamentosQuery, useGetEstatisticasNormalizacaoQuery, useCreateMapeamentoMutation, useUpdateMapeamentoMutation, useDeleteMapeamentoMutation } from '../../store/slices/apiSlice';

const { Title, Text } = Typography;

export default function EspecialidadesNormalizacaoPage() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchBruta, setSearchBruta] = useState('');
  const [searchMapeamento, setSearchMapeamento] = useState('');

  // Queries
  const { data: brutasData, isLoading: loadingBrutas, refetch: refetchBrutas } = useGetEspecialidadesBrutasQuery();
  const { data: mapeamentosData, isLoading: loadingMapeamentos, refetch: refetchMapeamentos } = useGetMapeamentosQuery();
  const { data: statsData, refetch: refetchStats } = useGetEstatisticasNormalizacaoQuery();

  // Mutations
  const [createMapeamento, { isLoading: creating }] = useCreateMapeamentoMutation();
  const [updateMapeamento, { isLoading: updating }] = useUpdateMapeamentoMutation();
  const [deleteMapeamento, { isLoading: deleting }] = useDeleteMapeamentoMutation();

  const brutas = brutasData?.data || [];
  const mapeamentos = mapeamentosData?.data || [];
  const stats = statsData?.data || {};

  // Filtrar especialidades brutas que já foram mapeadas
  const brutasNaoMapeadas = brutas.filter(
    bruta => !mapeamentos.some(m => m.especialidade_bruta === bruta.nome)
  );

  // Aplicar filtro de busca
  const brutasFiltered = brutasNaoMapeadas.filter(
    bruta => bruta.nome.toLowerCase().includes(searchBruta.toLowerCase())
  );

  const mapeamentosFiltered = mapeamentos.filter(
    m => m.especialidade_bruta.toLowerCase().includes(searchMapeamento.toLowerCase()) ||
         m.especialidade_normalizada.toLowerCase().includes(searchMapeamento.toLowerCase())
  );

  const handleCreate = (especialidadeBruta) => {
    form.setFieldsValue({
      especialidade_bruta: especialidadeBruta,
      especialidade_normalizada: '',
    });
    setEditingId(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      especialidade_bruta: record.especialidade_bruta,
      especialidade_normalizada: record.especialidade_normalizada,
    });
    setEditingId(record.id);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteMapeamento(id).unwrap();
      message.success('Mapeamento deletado com sucesso!');
      refetchMapeamentos();
      refetchBrutas();
      refetchStats();
    } catch (error) {
      message.error('Erro ao deletar mapeamento: ' + (error.data?.error || error.message));
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        // Atualizar
        await updateMapeamento({
          id: editingId,
          body: { especialidade_normalizada: values.especialidade_normalizada },
        }).unwrap();
        message.success('Mapeamento atualizado com sucesso!');
      } else {
        // Criar
        await createMapeamento(values).unwrap();
        message.success('Mapeamento criado com sucesso!');
      }

      setModalVisible(false);
      form.resetFields();
      refetchMapeamentos();
      refetchBrutas();
      refetchStats();
    } catch (error) {
      message.error('Erro ao salvar mapeamento: ' + (error.data?.error || error.message));
    }
  };

  const columnsBrutas = [
    {
      title: 'Especialidade Bruta',
      dataIndex: 'nome',
      key: 'nome',
      width: '70%',
    },
    {
      title: 'Registros',
      dataIndex: 'count',
      key: 'count',
      width: '15%',
      render: (count) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleCreate(record.nome)}
        >
          Mapear
        </Button>
      ),
    },
  ];

  const columnsMapeamentos = [
    {
      title: 'Especialidade Bruta',
      dataIndex: 'especialidade_bruta',
      key: 'especialidade_bruta',
      width: '35%',
    },
    {
      title: 'Especialidade Normalizada',
      dataIndex: 'especialidade_normalizada',
      key: 'especialidade_normalizada',
      width: '35%',
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Criado por',
      dataIndex: ['usuario', 'username'],
      key: 'usuario',
      width: '15%',
    },
    {
      title: 'Ações',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Tem certeza?"
            description="Esta ação não pode ser desfeita."
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Normalização de Especialidades</Title>
      <Text type="secondary">
        Normalize as especialidades brutas para categorias padronizadas que serão usadas no sistema.
      </Text>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total de Especialidades Brutas"
              value={stats.totalBrutas || 0}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Mapeamentos Criados"
              value={stats.totalMapeamentos || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Faltam Mapear"
              value={stats.faltamMapear || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Progresso"
              value={stats.percentualMapeado || 0}
              suffix="%"
              valueStyle={{ color: stats.percentualMapeado === 100 ? '#3f8600' : '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabela de Especialidades Não Mapeadas */}
      <Card
        title="Especialidades Não Mapeadas"
        extra={
          <Input.Search
            placeholder="Buscar especialidade..."
            value={searchBruta}
            onChange={(e) => setSearchBruta(e.target.value)}
            style={{ width: 300 }}
          />
        }
        style={{ marginBottom: 24 }}
      >
        {brutasFiltered.length === 0 && brutas.length > 0 ? (
          <Alert
            message="Todas as especialidades foram mapeadas!"
            description="Parabéns! Você concluiu a normalização de todas as especialidades."
            type="success"
            showIcon
          />
        ) : (
          <Table
            columns={columnsBrutas}
            dataSource={brutasFiltered}
            rowKey="nome"
            loading={loadingBrutas}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Tabela de Mapeamentos Criados */}
      <Card
        title="Mapeamentos Criados"
        extra={
          <Input.Search
            placeholder="Buscar mapeamento..."
            value={searchMapeamento}
            onChange={(e) => setSearchMapeamento(e.target.value)}
            style={{ width: 300 }}
          />
        }
      >
        <Table
          columns={columnsMapeamentos}
          dataSource={mapeamentosFiltered}
          rowKey="id"
          loading={loadingMapeamentos}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal de Criação/Edição */}
      <Modal
        title={editingId ? 'Editar Mapeamento' : 'Criar Mapeamento'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Especialidade Bruta"
            name="especialidade_bruta"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="Especialidade Normalizada"
            name="especialidade_normalizada"
            rules={[
              { required: true, message: 'Campo obrigatório' },
              { min: 3, message: 'Mínimo de 3 caracteres' },
            ]}
          >
            <Input placeholder="Ex: Enfermagem, Medicina Clínica, Odontologia" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating || updating}
              >
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
