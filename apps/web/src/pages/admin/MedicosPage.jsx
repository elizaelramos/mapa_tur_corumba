import { Alert } from 'antd'

export default function MedicosPage() {
  return (
    <div>
      <h1>Professores (Desativado)</h1>
      <Alert
        message="Funcionalidade de Professores desativada"
        description="A funcionalidade de gestão de professores foi desativada após a migração do sistema para o escopo de turismo. Os endpoints relacionados foram removidos. Se precisar reativar, contate a equipe de desenvolvimento."
        type="warning"
        showIcon
      />
    </div>
  )
}

