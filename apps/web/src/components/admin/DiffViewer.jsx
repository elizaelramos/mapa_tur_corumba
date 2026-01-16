import { Descriptions, Alert, Typography } from 'antd'

const { Text, Paragraph } = Typography

export default function DiffViewer({ valorAntigo, valorNovo, operation }) {
  // Para DELETE, só mostrar valor antigo
  if (operation === 'DELETE') {
    return (
      <div>
        <Alert
          message="Registro Excluído"
          description="Este registro foi removido do sistema."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Descriptions title="Dados Excluídos" bordered column={1} size="small">
          {Object.entries(valorAntigo || {}).map(([key, value]) => (
            <Descriptions.Item label={key} key={key}>
              <Text code>{JSON.stringify(value, null, 2)}</Text>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>
    )
  }

  // Para INSERT, só mostrar valor novo
  if (operation === 'INSERT') {
    return (
      <div>
        <Alert
          message="Novo Registro"
          description="Este registro foi criado no sistema."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Descriptions title="Dados Criados" bordered column={1} size="small">
          {Object.entries(valorNovo || {}).map(([key, value]) => (
            <Descriptions.Item label={key} key={key}>
              <Text code>{JSON.stringify(value, null, 2)}</Text>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>
    )
  }

  // Para UPDATE, mostrar diff
  const oldData = valorAntigo || {}
  const newData = valorNovo || {}
  
  // Encontrar todas as chaves (união de ambos os objetos)
  const allKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])]
  
  // Identificar mudanças
  const changes = allKeys.filter(key => {
    const oldVal = JSON.stringify(oldData[key])
    const newVal = JSON.stringify(newData[key])
    return oldVal !== newVal
  })

  const unchanged = allKeys.filter(key => {
    const oldVal = JSON.stringify(oldData[key])
    const newVal = JSON.stringify(newData[key])
    return oldVal === newVal
  })

  return (
    <div>
      <Alert
        message={`${changes.length} campo(s) modificado(s)`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {changes.length > 0 && (
        <Descriptions
          title="Campos Modificados"
          bordered
          column={1}
          size="small"
          style={{ marginBottom: 16 }}
        >
          {changes.map(key => (
            <Descriptions.Item label={key} key={key}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <Text type="danger" strong>ANTES: </Text>
                  <Text
                    code
                    delete
                    style={{
                      backgroundColor: '#fff1f0',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {JSON.stringify(oldData[key])}
                  </Text>
                </div>
                <div>
                  <Text type="success" strong>DEPOIS: </Text>
                  <Text
                    code
                    style={{
                      backgroundColor: '#f6ffed',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {JSON.stringify(newData[key])}
                  </Text>
                </div>
              </div>
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}

      {unchanged.length > 0 && (
        <Descriptions
          title="Campos Inalterados"
          bordered
          column={1}
          size="small"
        >
          {unchanged.map(key => (
            <Descriptions.Item label={key} key={key}>
              <Text code>{JSON.stringify(newData[key] || oldData[key])}</Text>
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}
    </div>
  )
}
