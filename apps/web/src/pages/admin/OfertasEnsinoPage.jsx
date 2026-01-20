import { Alert } from 'antd'

export default function OfertasEnsinoPage() {
  return (
    <div>
      <h1>Ofertas (Desativado)</h1>
      <Alert
        message="Funcionalidade de Ofertas desativada"
        description="A gestão de ofertas de ensino/serviços foi desativada após a migração do sistema para o escopo de turismo. Os endpoints relacionados foram removidos. Contate a equipe de desenvolvimento se precisar reativar esta funcionalidade."
        type="warning"
        showIcon
      />
    </div>
  )
}
