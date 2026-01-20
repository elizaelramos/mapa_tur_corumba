import { Alert } from 'antd'

export default function EspecialidadesPage() {
  return (
    <div>
      <h1>Especialidades (Desativado)</h1>
      <Alert
        message="Funcionalidade de Especialidades desativada"
        description="A funcionalidade de especialidades médicas foi desativada após a migração para turismo. Os endpoints relacionados foram removidos. Entre em contato com a equipe de desenvolvimento se precisar reativar esta funcionalidade."
        type="warning"
        showIcon
      />
    </div>
  )
}

