import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Layout, Menu, Button, Avatar, Dropdown, Drawer } from 'antd'
import {
  DashboardOutlined,
  EnvironmentOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  UserOutlined,
  AuditOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
  PictureOutlined,
  BookOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { logout } from '../store/slices/authSlice'

const { Header, Sider, Content } = Layout

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  
  const isSuperadmin = user?.role === 'superadmin'

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true) // No mobile, sempre colapsado
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Painel' },
    { key: '/admin/unidades', icon: <EnvironmentOutlined />, label: 'Unidades Turísticas' },
    { key: '/admin/categorias', icon: <TagsOutlined />, label: 'Categorias' },
    { key: '/admin/icones', icon: <PictureOutlined />, label: 'Ícones' },
    { key: '/admin/bairros', icon: <EnvironmentOutlined />, label: 'Bairros' },
    ...(isSuperadmin ? [
      { key: '/admin/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
      { key: '/admin/users', icon: <UserOutlined />, label: 'Usuários' },
      { key: '/admin/audit', icon: <AuditOutlined />, label: 'Auditoria' },
    ] : []),
  ]
  
  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }
  
  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Sair',
        onClick: handleLogout,
      },
    ],
  }
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop: Sider normal */}
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed}>
          <div style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? '16px' : '18px',
            fontWeight: 'bold'
          }}>
            {collapsed ? 'MapaTur' : 'Painel MapaTur'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
      )}

      {/* Mobile: Drawer */}
      {isMobile && (
        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          styles={{ body: { padding: 0 } }}
          headerStyle={{ 
            background: '#001529',
            color: 'white'
          }}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => {
              navigate(key)
              setMobileMenuOpen(false)
            }}
          />
        </Drawer>
      )}

      <Layout>
        <Header style={{ 
          padding: isMobile ? '0 12px' : '0 24px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isMobile ? '56px' : '64px',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => isMobile ? setMobileMenuOpen(true) : setCollapsed(!collapsed)}
            style={{ 
              fontSize: isMobile ? '14px' : '16px', 
              width: isMobile ? 48 : 64, 
              height: isMobile ? 48 : 64 
            }}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? 4 : 8 
            }}>
              <Avatar size={isMobile ? 'small' : 'default'} icon={<UserOutlined />} />
              {!isMobile && <span>{user?.username}</span>}
            </div>
          </Dropdown>
        </Header>
        <Content style={{ 
          margin: isMobile ? '12px 8px' : '24px 16px', 
          padding: isMobile ? 12 : 24, 
          background: '#fff', 
          minHeight: 280 
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
