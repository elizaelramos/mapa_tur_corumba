import { Modal, List, Avatar, Button, Typography, Empty, Spin } from 'antd';
import { WhatsAppOutlined, GlobalOutlined, CloseOutlined } from '@ant-design/icons';
import { useGetGuiasQuery } from '../store/slices/apiSlice';

const { Title, Text } = Typography;

const GuiasTuristicosModal = ({ visible, onClose }) => {
  const { data: guias = [], isLoading } = useGetGuiasQuery();

  const handleWhatsAppClick = (whatsapp, nome) => {
    // Remove caracteres não numéricos
    const numeroLimpo = whatsapp.replace(/\D/g, '');
    // Abre WhatsApp com mensagem pré-definida
    const mensagem = encodeURIComponent(`Olá ${nome}, encontrei seu contato no Mapa de Turismo de Corumbá. Gostaria de contratar seus serviços de guia turístico.`);
    window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🧭</span>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            Guias Turísticos de Corumbá
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      closeIcon={<CloseOutlined />}
      styles={{
        header: {
          borderBottom: '2px solid #1890ff',
          paddingBottom: '16px',
        },
        body: {
          maxHeight: '60vh',
          overflowY: 'auto',
        },
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>
            Carregando guias turísticos...
          </div>
        </div>
      ) : guias.length === 0 ? (
        <Empty
          description="Nenhum guia turístico disponível no momento"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            color: 'white',
          }}>
            <Text style={{ color: 'white', fontSize: '14px' }}>
              ✨ Conheça Corumbá e o Pantanal com guias turísticos profissionais e certificados.
              Clique no botão WhatsApp para entrar em contato diretamente!
            </Text>
          </div>

          <List
            itemLayout="horizontal"
            dataSource={guias}
            renderItem={(guia) => (
              <List.Item
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f5ff';
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9f9f9';
                  e.currentTarget.style.borderColor = '#e8e8e8';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                actions={[
                  <Button
                    type="primary"
                    icon={<WhatsAppOutlined />}
                    onClick={() => handleWhatsAppClick(guia.whatsapp, guia.nome)}
                    style={{
                      background: '#25D366',
                      borderColor: '#25D366',
                      fontWeight: '500',
                      height: '40px',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#128C7E';
                      e.currentTarget.style.borderColor = '#128C7E';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#25D366';
                      e.currentTarget.style.borderColor = '#25D366';
                    }}
                  >
                    Entrar em Contato
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={64}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '24px',
                        fontWeight: 'bold',
                      }}
                      src={guia.foto_url}
                    >
                      {guia.nome.charAt(0)}
                    </Avatar>
                  }
                  title={
                    <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                      {guia.nome}
                    </Text>
                  }
                  description={
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '6px',
                        color: '#595959',
                      }}>
                        <GlobalOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        <Text style={{ color: '#595959' }}>
                          <strong>Idiomas:</strong> {guia.idiomas}
                        </Text>
                      </div>
                      {guia.descricao && (
                        <div style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '13px' }}>
                          {guia.descricao}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Modal>
  );
};

export default GuiasTuristicosModal;
