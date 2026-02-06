import { Modal, Collapse, Typography, Tag } from 'antd';
import {
  CloseOutlined,
  CarOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const HowToGetHereModal = ({ visible, onClose }) => {
  const transporteAereoContent = (
    <div>
      <Paragraph style={{ marginBottom: '16px' }}>
        <Text>
          Corumbá é atendida pelo <strong>Aeroporto Internacional de Corumbá (CMG)</strong>, com voos diretos para Campinas (SP),
          permitindo conexões nacionais e internacionais.
        </Text>
      </Paragraph>

      <div style={{ overflowX: 'auto', marginTop: '16px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          background: 'white',
        }}>
          <thead>
            <tr style={{ background: '#f0f5ff' }}>
              <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Companhia Aérea</th>
              <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Rota Principal</th>
              <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Tipo de Voo</th>
              <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Código</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>
                <strong>Azul Linhas Aéreas</strong>
                <br />
                <Tag color="green" style={{ marginTop: '4px' }}>Operação regular/sazonal</Tag>
              </td>
              <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>
                Corumbá (CMG) ↔ Campinas (VCP)
              </td>
              <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>
                <Tag color="blue">Direto (sem escalas)</Tag>
              </td>
              <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>
                <strong>CMG</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f0f7ff',
        borderRadius: '6px',
        border: '1px solid #91d5ff',
      }}>
        <Text style={{ fontSize: '12px', color: '#595959' }}>
          <strong>📌 Observações ao Turista:</strong> Principal ligação aérea de Corumbá com o Sudeste.
          Operação com período programado, estimado entre março e setembro de 2026.
          Conexões nacionais e internacionais via Campinas (Viracopos).
        </Text>
      </div>
    </div>
  );

  const transporteRodoviarioContent = (
    <div>
      <Paragraph style={{ marginBottom: '16px' }}>
        <Text>
          Corumbá é acessível por ônibus regionais e interestaduais, com ligação direta a Bonito e Campo Grande,
          além de conexões com São Paulo e a fronteira boliviana, consolidando-se como porta de entrada do Pantanal
          e do turismo de fronteira.
        </Text>
      </Paragraph>

      {/* Conexões Regionais */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
          🔹 Linhas Regulares - Conexões Regionais
        </Title>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            background: 'white',
          }}>
            <thead>
              <tr style={{ background: '#f0f5ff' }}>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Origem</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Empresa</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Distância</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>Bonito – MS</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>Viação Cruzeiro do Sul</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>260–350 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Principal ligação turística entre Bonito e Corumbá</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>Campo Grande – MS</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>Viação Andorinha e Cruzeiro do Sul</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>~430 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Principal hub rodoviário do estado</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>Aquidauana – MS</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>Viação Andorinha e Cruzeiro do Sul</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>~330 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Acesso pela BR-262</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>Miranda – MS</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>Viação Andorinha e Cruzeiro do Sul</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>~200 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Porta de entrada do Pantanal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Conexões Interestaduais */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
          🔹 Linhas Regulares - Conexões Interestaduais
        </Title>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            background: 'white',
          }}>
            <thead>
              <tr style={{ background: '#f0f5ff' }}>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Origem</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Empresa</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Distância</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>São Paulo – SP</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>Viação Andorinha</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>~1.400 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Confirmar horários ativos</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>Presidente Prudente – SP</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>Viação Andorinha</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>~1.000 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Conexão frequente com MS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Conexões Internacionais */}
      <div>
        <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
          🔹 Conexões Internacionais (Fronteira)
        </Title>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            background: 'white',
          }}>
            <thead>
              <tr style={{ background: '#f0f5ff' }}>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Cidade / País</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Tipo de Transporte</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Distância</th>
                <th style={{ padding: '10px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>Puerto Quijarro – Bolívia</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>Vans / Ônibus Local</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>~10 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Travessia terrestre Brasil–Bolívia</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>Puerto Suárez – Bolívia</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>Transporte Local</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>~20 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Integração turística e comercial</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const transporteProprioContent = (
    <div>
      <Paragraph style={{ marginBottom: '16px' }}>
        <Text>
          A <strong>BR-262</strong> é o principal acesso rodoviário a Corumbá, atravessando o Pantanal Sul e conectando
          o município aos principais polos regionais e nacionais, sendo amplamente utilizada por turistas em veículo próprio ou locado.
        </Text>
      </Paragraph>

      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
          🛣️ Acesso Rodoviário e Distâncias de Referência
        </Title>

        <div style={{
          padding: '16px',
          background: '#f0f7ff',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #91d5ff',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <Text strong style={{ color: '#1890ff' }}>Rodovia de Acesso:</Text>
            <Tag color="blue" style={{ marginLeft: '8px', fontSize: '14px' }}>BR-262</Tag>
            <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#595959' }}>
              Principal eixo rodoviário de acesso a Corumbá
            </Text>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong style={{ color: '#1890ff' }}>Conexão Regional:</Text>
            <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#595959' }}>
              Campo Grande – MS (Hub rodoviário e aéreo do estado)
            </Text>
          </div>
          <div>
            <Text strong style={{ color: '#1890ff' }}>Integração Nacional:</Text>
            <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#595959' }}>
              Sudeste, Sul e Centro-Oeste (Ligação direta com grandes centros)
            </Text>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            background: 'white',
          }}>
            <thead>
              <tr style={{ background: '#f0f5ff' }}>
                <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Origem</th>
                <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Distância</th>
                <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>Observação ao Turista</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}><strong>Bonito – MS</strong></td>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>~350 km</td>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Principal rota turística estadual</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}><strong>Campo Grande – MS</strong></td>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>~430 km</td>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Rota mais utilizada</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}><strong>Cuiabá – MT</strong></td>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>~700 km</td>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Integração com Pantanal Norte</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}><strong>São Paulo – SP</strong></td>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>~1.400 km</td>
                <td style={{ padding: '12px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Principal origem nacional</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}><strong>Brasília – DF</strong></td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9' }}>~1.300 km</td>
                <td style={{ padding: '10px', border: '1px solid #d9d9d9', fontSize: '12px' }}>Integração Centro-Oeste</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✈️</span>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            Como Chegar a Corumbá
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
          borderBottom: '2px solid #1890ff',
          paddingBottom: '16px',
        },
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        color: 'white',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <Text style={{ color: 'white', fontSize: '14px' }}>
            🧭 <strong>Polo Regional:</strong> Campo Grande – MS
          </Text>
        </div>
        <div>
          <Text style={{ color: 'white', fontSize: '14px' }}>
            🌎 <strong>Fronteira Internacional:</strong> Bolívia (Puerto Quijarro / Puerto Suárez)
          </Text>
        </div>
      </div>

      <Collapse
        accordion
        style={{
          background: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
        }}
        expandIconPosition="end"
      >
        <Panel
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>✈️</span>
              <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                TRANSPORTE AÉREO
              </Text>
            </div>
          }
          key="1"
          style={{
            marginBottom: '8px',
            borderRadius: '8px',
          }}
        >
          {transporteAereoContent}
        </Panel>

        <Panel
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🚍</span>
              <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                TRANSPORTE RODOVIÁRIO (ÔNIBUS)
              </Text>
            </div>
          }
          key="2"
          style={{
            marginBottom: '8px',
            borderRadius: '8px',
          }}
        >
          {transporteRodoviarioContent}
        </Panel>

        <Panel
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🚗</span>
              <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                TRANSPORTE PRÓPRIO OU LOCADO
              </Text>
            </div>
          }
          key="3"
          style={{
            borderRadius: '8px',
          }}
        >
          {transporteProprioContent}
        </Panel>
      </Collapse>
    </Modal>
  );
};

export default HowToGetHereModal;
