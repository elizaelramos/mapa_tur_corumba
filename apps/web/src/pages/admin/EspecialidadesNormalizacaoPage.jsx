import { Alert } from 'antd'

export default function EspecialidadesNormalizacaoPage() {
  return (
    <div>
      <h1>Normalização de Especialidades (Desativado)</h1>
      <Alert
        message="Funcionalidade desativada"
        description="A normalização de especialidades foi desativada após a migração para o escopo de turismo. Os endpoints de mapeamento foram removidos. Contate a equipe de desenvolvimento se precisar reativar."
        type="warning"
        showIcon
      />
    </div>
  )
}

