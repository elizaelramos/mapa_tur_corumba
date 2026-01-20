import { Alert } from 'antd'

export default function StagingPage() {
  return (
    <div>
      <h1>Staging (Desativado)</h1>
      <Alert
        message="Funcionalidade de Staging desativada"
        description="A rota /api/staging foi desativada e os modelos de staging foram removidos após a migração para o escopo de turismo. Entre em contato com a equipe se precisar reativar esta funcionalidade."
        type="warning"
        showIcon
      />
    </div>
  )
}

