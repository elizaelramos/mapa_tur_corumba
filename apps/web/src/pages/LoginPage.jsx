import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useLoginMutation } from '../store/slices/apiSlice'
import { setCredentials } from '../store/slices/authSlice'

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [login, { isLoading }] = useLoginMutation()
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin')
    }
  }, [isAuthenticated, navigate])
  
  const onFinish = async (values) => {
    try {
      const result = await login(values).unwrap()
      dispatch(setCredentials(result.data))
      message.success('Login realizado com sucesso!')
      navigate('/admin')
    } catch (error) {
      message.error(error.data?.error || 'Erro ao fazer login')
    }
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        title="SIGLS - Login" 
        style={{ width: 400 }}
        headStyle={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}
      >
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Por favor, insira seu usuário!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Usuário" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
