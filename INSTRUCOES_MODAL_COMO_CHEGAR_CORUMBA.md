# Modal: Como Chegar a Corumbá

## Descrição
Implementar um modal informativo sobre como chegar a Corumbá, com informações de transporte aéreo, rodoviário e próprio. O modal deve ter seções expansíveis (accordion) e design responsivo.

## Componentes Necessários

### 1. Botão de Acionamento
Criar um botão que abre o modal quando clicado.

**Características do botão:**
- Texto: "✈️ Como chegar a Corumbá" (com emoji de avião antes e emoji de ônibus 🚌 visível)
- Cor: Azul (#1890ff com gradient para #096dd9)
- Altura: 60px
- Largura: 100%
- Border-radius: 12px
- Efeito hover: Elevação com shadow

**HTML do botão:**
```html
<button id="btnComoChegar" class="btn-modal-turismo btn-como-chegar">
    <span>🚌 Como chegar a Corumbá</span>
</button>
```

### 2. Estrutura do Modal

**HTML completo do modal:**
```html
<div id="modalComoChegar" class="modal-turismo">
    <div class="modal-turismo-content">
        <!-- Header -->
        <div class="modal-turismo-header">
            <div class="modal-turismo-title">
                <span class="modal-icon">✈️</span>
                <h2>Como Chegar a Corumbá</h2>
            </div>
            <button class="modal-turismo-close" aria-label="Fechar">&times;</button>
        </div>

        <!-- Body -->
        <div class="modal-turismo-body">
            <!-- Banner de destaque -->
            <div class="modal-banner modal-banner-blue">
                <h3>🌍 CORUMBÁ – MS | POLO REGIONAL</h3>
                <p><strong>Fronteira Internacional:</strong> Bolívia</p>
            </div>

            <!-- Accordion -->
            <div class="accordion-turismo">
                <!-- Seção 1: Transporte Aéreo -->
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span>✈️ TRANSPORTE AÉREO</span>
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
                        <h4>🛫 VOOS DIRETOS PARA CORUMBÁ (Sem conexão)</h4>
                        <table class="table-turismo">
                            <thead>
                                <tr>
                                    <th>Companhia Aérea</th>
                                    <th>Aeroporto de Origem</th>
                                    <th>Código</th>
                                    <th>Destino</th>
                                    <th>Código</th>
                                    <th>Frequência Estimada</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Azul Linhas Aéreas</td>
                                    <td>Campinas – Viracopos</td>
                                    <td><span class="badge badge-blue">VCP</span></td>
                                    <td>Corumbá – MS</td>
                                    <td><span class="badge badge-green">CMG</span></td>
                                    <td>~3x por semana</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="info-box info-box-blue">
                            <h5>📍 AEROPORTO INTERNACIONAL DE CORUMBÁ</h5>
                            <ul class="info-list">
                                <li><strong>Código IATA:</strong> CMG</li>
                                <li><strong>Localização:</strong> A 4 km do centro da cidade</li>
                                <li><strong>Acesso:</strong> Táxi, Uber, transporte de vans e ônibus</li>
                                <li><strong>Operação:</strong> Voos nacionais e internacionais (Bolívia)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Seção 2: Transporte Rodoviário -->
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span>🚍 TRANSPORTE RODOVIÁRIO (ÔNIBUS)</span>
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
                        <h4>Empresas Operadoras</h4>
                        <div class="company-list">
                            <div class="company-item">
                                <span class="badge badge-blue">Viação Cruzeiro do Sul</span>
                                <span class="company-type">Regional e Interestadual</span>
                            </div>
                            <div class="company-item">
                                <span class="badge badge-blue">Eucatur</span>
                                <span class="company-type">Regional</span>
                            </div>
                            <div class="company-item">
                                <span class="badge badge-blue">Andorinha</span>
                                <span class="company-type">Interestadual</span>
                            </div>
                        </div>

                        <h4 style="margin-top: 20px;">Principais Rotas</h4>
                        <table class="table-turismo">
                            <thead>
                                <tr>
                                    <th>Origem</th>
                                    <th>Distância</th>
                                    <th>Tempo Médio</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Campo Grande – MS</td>
                                    <td>430 km</td>
                                    <td>6h a 7h</td>
                                    <td>Linhas diárias, várias empresas</td>
                                </tr>
                                <tr>
                                    <td>Bonito – MS</td>
                                    <td>350 km</td>
                                    <td>6h</td>
                                    <td>Linhas regulares</td>
                                </tr>
                                <tr>
                                    <td>São Paulo – SP</td>
                                    <td>1.400 km</td>
                                    <td>20h</td>
                                    <td>Linhas diretas disponíveis</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="info-box info-box-blue">
                            <p><strong>🚏 Rodoviária de Corumbá:</strong> Rua Antônio Maria Coelho, 852 - Centro</p>
                        </div>
                    </div>
                </div>

                <!-- Seção 3: Transporte Próprio -->
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span>🚗 TRANSPORTE PRÓPRIO OU LOCADO</span>
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
                        <h4>Principais Rodovias de Acesso</h4>
                        <table class="table-turismo">
                            <thead>
                                <tr>
                                    <th>Rodovia</th>
                                    <th>Origem</th>
                                    <th>Distância</th>
                                    <th>Tempo Médio</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>BR-262</strong></td>
                                    <td>Campo Grande</td>
                                    <td>430 km</td>
                                    <td>5h a 6h</td>
                                    <td>Principal acesso, totalmente pavimentada</td>
                                </tr>
                                <tr>
                                    <td><strong>BR-262</strong></td>
                                    <td>Bonito</td>
                                    <td>350 km</td>
                                    <td>4h a 5h</td>
                                    <td>Acesso direto pela BR-262</td>
                                </tr>
                                <tr>
                                    <td><strong>MS-228 + BR-262</strong></td>
                                    <td>Miranda</td>
                                    <td>210 km</td>
                                    <td>3h</td>
                                    <td>Rota cênica pelo Pantanal</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="info-box info-box-warning">
                            <h5>⚠️ DICAS IMPORTANTES</h5>
                            <ul class="info-list">
                                <li>Abasteça sempre que possível – postos espaçados</li>
                                <li>Cuidado com animais na pista (especialmente à noite)</li>
                                <li>Durante a cheia (dez-mar), algumas estradas podem ser afetadas</li>
                                <li>Verifique as condições da estrada antes de viajar</li>
                            </ul>
                        </div>

                        <h4 style="margin-top: 20px;">🚙 Locação de Veículos</h4>
                        <p>Locadoras disponíveis no Aeroporto Internacional de Corumbá e no centro da cidade.</p>
                        <div class="company-list">
                            <span class="badge badge-outline">Localiza</span>
                            <span class="badge badge-outline">Movida</span>
                            <span class="badge badge-outline">Unidas</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

## 3. Estilos CSS

```css
/* Botão do Modal */
.btn-modal-turismo {
    width: 100%;
    height: 60px;
    margin-bottom: 16px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.3s ease;
    color: white;
}

.btn-como-chegar {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    box-shadow: 0 4px 15px rgba(24, 144, 255, 0.4);
}

.btn-como-chegar:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(24, 144, 255, 0.5);
}

/* Modal Base */
.modal-turismo {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.3s;
}

.modal-turismo.show {
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-turismo-content {
    background-color: white;
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s;
    display: flex;
    flex-direction: column;
}

/* Header do Modal */
.modal-turismo-header {
    padding: 20px;
    border-bottom: 2px solid #1890ff;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-turismo-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-icon {
    font-size: 24px;
}

.modal-turismo-title h2 {
    margin: 0;
    color: #1890ff;
    font-size: 24px;
}

.modal-turismo-close {
    background: none;
    border: none;
    font-size: 32px;
    cursor: pointer;
    color: #999;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
}

.modal-turismo-close:hover {
    color: #333;
}

/* Body do Modal */
.modal-turismo-body {
    padding: 20px;
    overflow-y: auto;
    max-height: calc(90vh - 100px);
}

/* Banner */
.modal-banner {
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    color: white;
    text-align: center;
}

.modal-banner-blue {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.modal-banner h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
}

.modal-banner p {
    margin: 0;
    font-size: 14px;
}

/* Accordion */
.accordion-turismo {
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    overflow: hidden;
}

.accordion-item {
    border-bottom: 1px solid #f0f0f0;
}

.accordion-item:last-child {
    border-bottom: none;
}

.accordion-header {
    width: 100%;
    padding: 16px 20px;
    background: white;
    border: none;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    font-weight: bold;
    transition: background 0.2s;
}

.accordion-header:hover {
    background: #f9f9f9;
}

.accordion-icon {
    transition: transform 0.3s;
    font-size: 12px;
}

.accordion-item.active .accordion-icon {
    transform: rotate(-180deg);
}

.accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    padding: 0 20px;
}

.accordion-item.active .accordion-content {
    max-height: 5000px;
    padding: 20px;
}

/* Tabelas */
.table-turismo {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
}

.table-turismo th,
.table-turismo td {
    padding: 12px;
    text-align: left;
    border: 1px solid #e8e8e8;
}

.table-turismo th {
    background: #fafafa;
    font-weight: bold;
}

.table-turismo tbody tr:hover {
    background: #f5f5f5;
}

/* Badges */
.badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.badge-blue {
    background: #e6f7ff;
    color: #1890ff;
}

.badge-green {
    background: #f6ffed;
    color: #52c41a;
}

.badge-outline {
    background: white;
    border: 1px solid #d9d9d9;
    color: #595959;
    margin-right: 8px;
    margin-bottom: 8px;
}

/* Info Box */
.info-box {
    padding: 16px;
    border-radius: 4px;
    margin: 16px 0;
}

.info-box-blue {
    background: #e6f7ff;
    border-left: 4px solid #1890ff;
}

.info-box-warning {
    background: #fffbe6;
    border-left: 4px solid #faad14;
}

.info-box h5 {
    margin: 0 0 12px 0;
    color: #262626;
}

.info-list {
    margin: 0;
    padding-left: 20px;
}

.info-list li {
    margin-bottom: 8px;
    color: #595959;
}

/* Company List */
.company-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 12px 0;
}

.company-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.company-type {
    font-size: 12px;
    color: #8c8c8c;
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Responsivo */
@media (max-width: 768px) {
    .modal-turismo-content {
        width: 95%;
        max-height: 95vh;
    }

    .table-turismo {
        font-size: 12px;
    }

    .table-turismo th,
    .table-turismo td {
        padding: 8px;
    }
}
```

## 4. JavaScript

```javascript
// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    const btnComoChegar = document.getElementById('btnComoChegar');
    const modal = document.getElementById('modalComoChegar');
    const closeBtn = modal.querySelector('.modal-turismo-close');
    const accordionHeaders = modal.querySelectorAll('.accordion-header');

    // Abrir modal
    btnComoChegar.addEventListener('click', function() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevenir scroll da página
    });

    // Fechar modal
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restaurar scroll
    });

    // Fechar ao clicar fora do modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Fechar com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Accordion
    accordionHeaders.forEach(function(header) {
        header.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const isActive = accordionItem.classList.contains('active');

            // Fechar todos os itens (comportamento accordion - apenas um aberto)
            const allItems = modal.querySelectorAll('.accordion-item');
            allItems.forEach(function(item) {
                item.classList.remove('active');
            });

            // Abrir o item clicado se não estava ativo
            if (!isActive) {
                accordionItem.classList.add('active');
            }
        });
    });
});
```

## 5. Instruções de Integração no Site PHP

### Passo 1: Adicionar o CSS
Adicione o CSS em um arquivo separado `/css/modal-turismo.css` ou dentro do `<head>` da página:

```php
<link rel="stylesheet" href="/css/modal-turismo.css">
```

### Passo 2: Adicionar o Botão
Adicione o botão onde deseja que apareça (sidebar, página inicial, etc.):

```php
<button id="btnComoChegar" class="btn-modal-turismo btn-como-chegar">
    <span>🚌 Como chegar a Corumbá</span>
</button>
```

### Passo 3: Adicionar o Modal
Adicione o HTML completo do modal antes do fechamento do `</body>`:

```php
<?php include 'includes/modal-como-chegar.php'; ?>
```

Ou cole o HTML completo diretamente.

### Passo 4: Adicionar o JavaScript
Adicione o JavaScript em um arquivo separado `/js/modal-turismo.js` ou antes do fechamento do `</body>`:

```php
<script src="/js/modal-turismo.js"></script>
```

## 6. Observações Importantes

- **Emojis**: Certifique-se de que o arquivo PHP tenha encoding UTF-8 para suportar emojis
- **Responsividade**: O modal é totalmente responsivo e funciona em mobile
- **Acessibilidade**: Inclui suporte para tecla ESC e aria-labels
- **Performance**: Usa apenas CSS e JavaScript vanilla (sem dependências)
- **Dados**: Os dados podem ser facilmente atualizados editando o HTML

## 7. Customização

Para alterar cores, modifique as variáveis CSS:
- Cor principal: `#1890ff`
- Cor secundária: `#096dd9`
- Cor de hover: ajuste o `rgba(24, 144, 255, 0.5)`

Para alterar comportamento do accordion (permitir múltiplos abertos), remova este trecho do JavaScript:
```javascript
// Fechar todos os itens
allItems.forEach(function(item) {
    item.classList.remove('active');
});
```
