import { useState } from 'react'
import { 
  Table, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Popconfirm,
  message,
  Badge,
  Descriptions,
  Tabs,
  Statistic,
  Row,
  Col,
  Card
} from 'antd'
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined
} from '@ant-design/icons'
import { 
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetAuditLogsQuery
} from '../../store/slices/apiSlice'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'

export default function UsersPage() {
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [detailUser, setDetailUser] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const currentUser = useSelector((state) => state.auth.user)
  const { data, isLoading } = useGetUsersQuery()
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()

  // Buscar logs de auditoria do usuário em detalhes
  const { data: userAuditData } = useGetAuditLogsQuery(
    { user_id: detailUser?.id, limit: 10 },
    { skip: !detailUser }
  )

  const handleCreate = () => {
    setEditingUser(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      ativo: user.ativo,
    })
    setIsModalOpen(true)
  }

  const handleViewDetails = (user) => {
    setDetailUser(user)
    setIsDetailModalOpen(true)
  }

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId).unwrap()
      message.success('Usuário excluído com sucesso!')
    } catch (error) {
      message.error(error?.data?.error || 'Erro ao excluir usuário')
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        // Edição - só envia senha se foi preenchida
        const updateData = {
          username: values.username,
          email: values.email,
          role: values.role,
          ativo: values.ativo,
        }
        if (values.password) {
          updateData.password = values.password
        }
        
        await updateUser({ id: editingUser.id, ...updateData }).unwrap()
        message.success('Usuário atualizado com sucesso!')
      } else {
        // Criação
        await createUser(values).unwrap()
        message.success('Usuário criado com sucesso!')
      }
      setIsModalOpen(false)
      form.resetFields()
    } catch (error) {
      message.error(error?.data?.error || 'Erro ao salvar usuário')
    }
  }

  const isCurrentUser = (userId) => currentUser?.id === userId

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80 
    },
    { 
      title: 'Usuário', 
      dataIndex: 'username', 
      key: 'username',
      render: (username, record) => (
        <Space>
          {username}
          {isCurrentUser(record.id) && (
            <Badge count="VOCÊ" style={{ backgroundColor: '#52c41a' }} />
          )}
        </Space>
      )
    },
    { 
      title: 'Email', 
      dataIndex: 'email', 
      key: 'email' 
    },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => (
        <Tag color={role === 'superadmin' ? 'red' : 'blue'}>
          {role === 'superadmin' ? 'SUPERADMIN' : 'ADMIN'}
        </Tag>
      )
    },
    { 
      title: 'Status', 
      dataIndex: 'ativo', 
      key: 'ativo',
      render: (ativo) => (
        <Tag color={ativo ? 'green' : 'default'}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Tag>
      )
    },
    {
      title: 'Último Login',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Nunca'
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const isSelf = isCurrentUser(record.id)
        
        return (
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              size="small"
            >
              Ver
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={isSelf}
              size="small"
            >
              Editar
            </Button>
            <Popconfirm
              title="Excluir usuário"
              description={`Tem certeza que deseja excluir ${record.username}?`}
              onConfirm={() => handleDelete(record.id)}
              okText="Sim"
              cancelText="Não"
              disabled={isSelf}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={isSelf}
                loading={isDeleting}
                size="small"
              >
                Excluir
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Gerenciamento de Usuários</h1>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleCreate}
        >
          Novo Usuário
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={false}
      />

      {/* Modal de Criação/Edição */}
      <Modal
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ ativo: true, role: 'admin' }}
        >
          <Form.Item
            name="username"
            label="Nome de Usuário"
            rules={[
              { required: true, message: 'Por favor, insira o nome de usuário' },
              { min: 3, message: 'Mínimo 3 caracteres' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Apenas letras, números, _ e -' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="usuario123" 
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Por favor, insira o email' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="usuario@corumba.ms.gov.br" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
            rules={editingUser ? [
              { min: 8, message: 'Mínimo 8 caracteres' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: 'Deve conter letra e número' }
            ] : [
              { required: true, message: 'Por favor, insira a senha' },
              { min: 8, message: 'Mínimo 8 caracteres' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: 'Deve conter letra e número' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="********" 
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmar Senha"
            dependencies={['password']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const password = getFieldValue('password')
                  if (!password || !value || password === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('As senhas não coincidem'))
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="********" 
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Perfil"
            rules={[{ required: true, message: 'Por favor, selecione o perfil' }]}
          >
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="superadmin">Superadmin</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="ativo"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsModalOpen(false)
                form.resetFields()
              }}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={isCreating || isUpdating}
              >
                {editingUser ? 'Atualizar' : 'Criar'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        title={`Detalhes do Usuário: ${detailUser?.username}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Fechar
          </Button>
        ]}
        width={800}
      >
        {detailUser && (
          <Tabs
            items={[
              {
                key: 'info',
                label: 'Informações',
                children: (
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="ID">{detailUser.id}</Descriptions.Item>
                    <Descriptions.Item label="Nome de Usuário">{detailUser.username}</Descriptions.Item>
                    <Descriptions.Item label="Email">{detailUser.email}</Descriptions.Item>
                    <Descriptions.Item label="Perfil">
                      <Tag color={detailUser.role === 'superadmin' ? 'red' : 'blue'}>
                        {detailUser.role === 'superadmin' ? 'SUPERADMIN' : 'ADMIN'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={detailUser.ativo ? 'green' : 'default'}>
                        {detailUser.ativo ? 'Ativo' : 'Inativo'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Criado em">
                      {dayjs(detailUser.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Última atualização">
                      {dayjs(detailUser.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Último login">
                      {detailUser.last_login 
                        ? dayjs(detailUser.last_login).format('DD/MM/YYYY HH:mm:ss')
                        : 'Nunca acessou'
                      }
                    </Descriptions.Item>
                  </Descriptions>
                )
              },
              {
                key: 'activity',
                label: 'Atividade Recente',
                children: (
                  <div>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="Total de Ações"
                            value={userAuditData?.pagination?.total || 0}
                            valueStyle={{ color: '#3f8600' }}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="Últimas 7 dias"
                            value={userAuditData?.data?.filter(log => 
                              dayjs(log.timestamp).isAfter(dayjs().subtract(7, 'days'))
                            ).length || 0}
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    <h4>Últimas 10 ações:</h4>
                    {userAuditData?.data && userAuditData.data.length > 0 ? (
                      <Table
                        dataSource={userAuditData.data}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Operação',
                            dataIndex: 'operacao',
                            render: (op) => {
                              const colors = { INSERT: 'green', UPDATE: 'blue', DELETE: 'red' }
                              return <Tag color={colors[op]}>{op}</Tag>
                            }
                          },
                          { title: 'Tabela', dataIndex: 'tabela' },
                          { title: 'Registro ID', dataIndex: 'registro_id' },
                          {
                            title: 'Data/Hora',
                            dataIndex: 'timestamp',
                            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm:ss')
                          }
                        ]}
                      />
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma atividade registrada</p>
                    )}
                  </div>
                )
              }
            ]}
          />
        )}
      </Modal>
    </div>
  )
}
