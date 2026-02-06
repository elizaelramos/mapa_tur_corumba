import { Modal, Collapse, Typography, Table, Tag } from 'antd';
import { CloseOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const RotaBonitoCorumbaModal = ({ visible, onClose }) => {
  // Tabela de voos diretos
  const voosColumns = [
    {
      title: 'Companhia Aérea',
      dataIndex: 'companhia',
      key: 'companhia',
    },
    {
      title: 'Aeroporto de Origem',
      dataIndex: 'origem',
      key: 'origem',
    },
    {
      title: 'Código',
      dataIndex: 'codigoOrigem',
      key: 'codigoOrigem',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Destino',
      dataIndex: 'destino',
      key: 'destino',
    },
    {
      title: 'Código',
      dataIndex: 'codigoDestino',
      key: 'codigoDestino',
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Frequência Estimada',
      dataIndex: 'frequencia',
      key: 'frequencia',
    },
  ];

  const voosData = [
    {
      key: '1',
      companhia: 'LATAM Airlines',
      origem: 'São Paulo – Guarulhos',
      codigoOrigem: 'GRU',
      destino: 'Bonito – MS',
      codigoDestino: 'BYO',
      frequencia: '~2x por semana',
    },
    {
      key: '2',
      companhia: 'GOL Linhas Aéreas',
      origem: 'São Paulo – Congonhas',
      codigoOrigem: 'CGH',
      destino: 'Bonito – MS',
      codigoDestino: 'BYO',
      frequencia: '~2 a 3x por semana',
    },
    {
      key: '3',
      companhia: 'Azul Linhas Aéreas',
      origem: 'Campinas – Viracopos',
      codigoOrigem: 'VCP',
      destino: 'Bonito – MS',
      codigoDestino: 'BYO',
      frequencia: '~3x por semana',
    },
  ];

  // Tabela de porta de entrada
  const portaEntradaData = [
    { key: 'acesso', label: 'Acesso Aéreo', info: 'Voos diretos sem conexão' },
    { key: 'companhias', label: 'Companhias Aéreas', info: 'Azul • GOL • LATAM' },
    { key: 'origens', label: 'Origens Diretas', info: 'Campinas (VCP), São Paulo – Congonhas (CGH) e Guarulhos (GRU)' },
    { key: 'perfil', label: 'Perfil', info: 'Principal hub turístico regional' },
  ];

  // Tabela de deslocamento terrestre
  const deslocamentoColumns = [
    {
      title: 'Modal',
      dataIndex: 'modal',
      key: 'modal',
    },
    {
      title: 'Distância Aproximada',
      dataIndex: 'distancia',
      key: 'distancia',
    },
    {
      title: 'Tempo Médio',
      dataIndex: 'tempo',
      key: 'tempo',
    },
    {
      title: 'Observações',
      dataIndex: 'observacoes',
      key: 'observacoes',
    },
  ];

  const deslocamentoData = [
    {
      key: '1',
      modal: 'Carro particular ou locado',
      distancia: '350 km',
      tempo: '4h a 5h',
      observacoes: 'Maior autonomia',
    },
    {
      key: '2',
      modal: 'Ônibus intermunicipal',
      distancia: '350 km',
      tempo: '6h',
      observacoes: 'Linhas regulares',
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🌿</span>
          <Title level={4} style={{ margin: 0, color: '#2f54eb' }}>
            Rota Turística Bonito - Corumbá
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      closeIcon={<CloseOutlined />}
      styles={{
        header: {
          borderBottom: '2px solid #2f54eb',
          paddingBottom: '16px',
        },
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
    >
      {/* Banner de destaque */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2f54eb 0%, #1d39c4 100%)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Title level={5} style={{ color: 'white', margin: 0, marginBottom: '8px' }}>
          🌿 BONITO → CORUMBÁ | PANTANAL SUL
        </Title>
        <Text style={{ color: 'white', fontSize: '14px' }}>
          A mais emblemática do estado do Mato Grosso do Sul, conectando o ecoturismo de Bonito e do Pantanal de Corumbá, maior planície alagável do mundo.
        </Text>
      </div>

      {/* Accordion com as seções */}
      <Collapse
        accordion
        expandIconPosition="end"
        style={{
          background: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
        }}
      >
        {/* Seção 1: Voos Diretos */}
        <Panel
          header={
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
              ✈️ VOOS DIRETOS PARA BONITO – MS (Sem conexão)
            </span>
          }
          key="1"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <Table
            columns={voosColumns}
            dataSource={voosData}
            pagination={false}
            size="middle"
            bordered
          />
        </Panel>

        {/* Seção 2: Porta de Entrada */}
        <Panel
          header={
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
              ✈️ PORTA DE ENTRADA RECOMENDADA
            </span>
          }
          key="2"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <Title level={5} style={{ color: '#2f54eb', marginBottom: '12px' }}>
              <EnvironmentOutlined /> Bonito – MS (Aeroporto BYO)
            </Title>
            <div style={{ paddingLeft: '16px' }}>
              {portaEntradaData.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    marginBottom: '10px',
                    padding: '8px',
                    background: '#f9f9f9',
                    borderRadius: '4px',
                  }}
                >
                  <Text strong style={{ minWidth: '160px', color: '#262626' }}>
                    {item.label}:
                  </Text>
                  <Text style={{ color: '#595959' }}>{item.info}</Text>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Seção 3: Deslocamento Terrestre */}
        <Panel
          header={
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
              🛣️ DESLOCAMENTO TERRESTRE - Bonito → Corumbá
            </span>
          }
          key="3"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <Table
            columns={deslocamentoColumns}
            dataSource={deslocamentoData}
            pagination={false}
            size="middle"
            bordered
            style={{ marginBottom: '16px' }}
          />
          <div
            style={{
              padding: '12px',
              background: '#e6f7ff',
              borderRadius: '4px',
              borderLeft: '4px solid #1890ff',
            }}
          >
            <Text strong>Rodovias principais:</Text> BR-262
          </div>
        </Panel>

        {/* Seção 4: Transporte Rodoviário */}
        <Panel
          header={
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
              🚌 TRANSPORTE RODOVIÁRIO (ÔNIBUS) - Bonito → Corumbá
            </span>
          }
          key="4"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <div style={{ padding: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Empresa Operadora:</Text>
            </div>
            <Tag color="blue" style={{ fontSize: '14px', padding: '6px 12px' }}>
              Viação Cruzeiro do Sul
            </Tag>
            <div style={{ marginTop: '12px' }}>
              <Text type="secondary">Tipo de Operação: Regional</Text>
            </div>
          </div>
        </Panel>

        {/* Seção 5: Por que fazer essa rota */}
        <Panel
          header={
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
              🌿 POR QUE FAZER ESSA ROTA?
            </span>
          }
          key="5"
        >
          <div style={{ padding: '12px' }}>
            <Paragraph style={{ marginBottom: '8px', fontSize: '15px' }}>
              <span style={{ color: '#2f54eb', fontSize: '18px', marginRight: '8px' }}>✔</span>
              Integra dois ícones do turismo brasileiro
            </Paragraph>
            <Paragraph style={{ marginBottom: '8px', fontSize: '15px' }}>
              <span style={{ color: '#2f54eb', fontSize: '18px', marginRight: '8px' }}>✔</span>
              Combina rios cristalinos, cavernas e florestas com Corumbá a Capital do Pantanal
            </Paragraph>
            <Paragraph style={{ marginBottom: '8px', fontSize: '15px' }}>
              <span style={{ color: '#2f54eb', fontSize: '18px', marginRight: '8px' }}>✔</span>
              Ideal para roteiros de natureza, pesca esportiva e turismo de experiência
            </Paragraph>
            <Paragraph style={{ marginBottom: 0, fontSize: '15px' }}>
              <span style={{ color: '#2f54eb', fontSize: '18px', marginRight: '8px' }}>✔</span>
              Flexível para viagens independentes ou organizadas
            </Paragraph>
          </div>
        </Panel>
      </Collapse>
    </Modal>
  );
};

export default RotaBonitoCorumbaModal;
