# Modal: Rota Turística Bonito - Corumbá

## Descrição
Implementar um modal informativo sobre a Rota Turística Bonito - Corumbá, conectando dois ícones do turismo brasileiro. O modal deve ter seções expansíveis (accordion) com informações sobre voos, deslocamento terrestre e transporte rodoviário.

## Componentes Necessários

### 1. Botão de Acionamento
Criar um botão com duas linhas de texto que abre o modal quando clicado.

**Características do botão:**
- Linha 1: "🗺️ Principal Rota Turística"
- Linha 2: "🌿 Bonito → Corumbá | Pantanal Sul"
- Cor: Azul-púrpura (#2f54eb com gradient para #1d39c4)
- Altura: 70px (para acomodar duas linhas)
- Largura: 100%
- Border-radius: 12px
- Efeito hover: Elevação com shadow

**HTML do botão:**
```html
<button id="btnRotaBonito" class="btn-modal-turismo btn-rota-bonito">
    <span style="font-size: 14px;">🗺️ Principal Rota Turística</span>
    <span style="font-size: 15px;">🌿 Bonito → Corumbá | Pantanal Sul</span>
</button>
```

### 2. Estrutura do Modal

**HTML completo do modal:**
```html
<div id="modalRotaBonito" class="modal-turismo">
    <div class="modal-turismo-content">
        <!-- Header -->
        <div class="modal-turismo-header modal-header-purple">
            <div class="modal-turismo-title">
                <span class="modal-icon">🌿</span>
                <h2>Rota Turística Bonito - Corumbá</h2>
            </div>
            <button class="modal-turismo-close" aria-label="Fechar">&times;</button>
        </div>

        <!-- Body -->
        <div class="modal-turismo-body">
            <!-- Banner de destaque -->
            <div class="modal-banner modal-banner-purple">
                <h3>🌿 BONITO → CORUMBÁ | PANTANAL SUL</h3>
                <p>A mais emblemática do estado do Mato Grosso do Sul, conectando o ecoturismo de Bonito e do Pantanal de Corumbá, maior planície alagável do mundo.</p>
            </div>

            <!-- Accordion -->
            <div class="accordion-turismo">
                <!-- Seção 1: Voos Diretos para Bonito -->
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span>✈️ VOOS DIRETOS PARA BONITO – MS (Sem conexão)</span>
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
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
                                    <td>LATAM Airlines</td>
                                    <td>São Paulo – Guarulhos</td>
                                    <td><span class="badge badge-blue">GRU</span></td>
                                    <td>Bonito – MS</td>
                                    <td><span class="badge badge-green">BYO</span></td>
                                    <td>~2x por semana</td>
                                </tr>
                                <tr>
                                    <td>GOL Linhas Aéreas</td>
                                    <td>São Paulo – Congonhas</td>
                                    <td><span class="badge badge-blue">CGH</span></td>
                                    <td>Bonito – MS</td>
                                    <td><span class="badge badge-green">BYO</span></td>
                                    <td>~2 a 3x por semana</td>
                                </tr>
                                <tr>
                                    <td>Azul Linhas Aéreas</td>
                                    <td>Campinas – Viracopos</td>
                                    <td><span class="badge badge-blue">VCP</span></td>
                                    <td>Bonito – MS</td>
                                    <td><span class="badge badge-green">BYO</span></td>
                                    <td>~3x por semana</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Seção 2: Porta de Entrada Recomendada -->
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span>✈️ PORTA DE ENTRADA RECOMENDADA</span>
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
                        <h4 style="color: #2f54eb; margin-bottom: 12px;">
                            📍 Bonito – MS (Aeroporto BYO)
                        </h4>
                        <div class="info-grid">
                            <div class="info-grid-item">
                                <strong>Acesso Aéreo:</strong>
                                <span>Voos diretos sem conexão</span>
                            </div>
                            <div class="info-grid-item">
                                <strong>Companhias Aéreas:</strong>
                                <span>Azul • GOL • LATAM</span>
                            </div>
                            <div class="info-grid-item">
                                <strong>Origens Diretas:</strong>
                                <span>Campinas (VCP), São Paulo – Congonhas (CGH) e Guarulhos (GRU)</span>
                            </div>
                            <div class="info-grid-item">
                                <strong>Perfil:</strong>
                                <span>Principal hub turístico regional</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção 3: Deslocamento Terrestre -->
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span>🛣️ DESLOCAMENTO TERRESTRE - Bonito → Corumbá</span>
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
                        <table class="table-turismo">
                            <thead>
                                <tr>
                                    <th>Modal</th>
                                    <th>Distância Aproximada</th>
                                    <th>Tempo Médio</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Carro particular ou locado</td>
                                    <td>350 km</td>
                                    <td>4h a 5h</td>
                                    <td>Maior autonomia</td>
                                </tr>
                                <tr>
                                    <td>Ônibus intermunicipal</td>
                                    <td>350 km</td>
                                    <td>6h</td>
                                    <td>Linhas regulares</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="info-box info-box-blue">
                            <p><strong>Rodovias principais:</strong> BR-262</p>
                        </div>
                    </div>
                </div>

                <!-- Seção 4: Transporte Rodoviário -->
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span>🚌 TRANSPORTE RODOVIÁRIO (ÔNIBUS) - Bonito → Corumbá</span>
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
                        <div class="company-highlight">
                            <div>
                                <strong>Empresa Operadora:</strong>
                            </div>
                            <div style="margin-top: 8px;">
                                <span class="badge badge-blue" style="font-size: 14px; padding: 6px 12px;">
                                    Viação Cruzeiro do Sul
                                </span>
                            </div>
                            <div style="margin-top: 12px; color: #8c8c8c;">
                                Tipo de Operação: Regional
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção 5: Por que fazer essa rota -->
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span>🌿 POR QUE FAZER ESSA ROTA?</span>
                        <span class="accordion-icon">▼</span>
                    </button>
                    <div class="accordion-content">
                        <div class="benefits-list">
                            <div class="benefit-item">
                                <span class="benefit-check">✔</span>
                                <span>Integra dois ícones do turismo brasileiro</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-check">✔</span>
                                <span>Combina rios cristalinos, cavernas e florestas com Corumbá a Capital do Pantanal</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-check">✔</span>
                                <span>Ideal para roteiros de natureza, pesca esportiva e turismo de experiência</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-check">✔</span>
                                <span>Flexível para viagens independentes ou organizadas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

## 3. Estilos CSS Adicionais

**Adicione estes estilos ao arquivo CSS existente (ou crie um novo):**

```css
/* Botão Rota Bonito - Corumbá */
.btn-rota-bonito {
    height: 70px;
    background: linear-gradient(135deg, #2f54eb 0%, #1d39c4 100%);
    box-shadow: 0 4px 15px rgba(47, 84, 235, 0.4);
    flex-direction: column;
    gap: 4px;
    padding: 12px;
}

.btn-rota-bonito:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(47, 84, 235, 0.5);
}

/* Header Purple Theme */
.modal-header-purple .modal-turismo-title h2 {
    color: #2f54eb;
}

.modal-turismo-header.modal-header-purple {
    border-bottom: 2px solid #2f54eb;
}

/* Banner Purple */
.modal-banner-purple {
    background: linear-gradient(135deg, #2f54eb 0%, #1d39c4 100%);
}

/* Info Grid */
.info-grid {
    display: grid;
    gap: 12px;
}

.info-grid-item {
    display: flex;
    padding: 8px;
    background: #f9f9f9;
    border-radius: 4px;
}

.info-grid-item strong {
    min-width: 160px;
    color: #262626;
}

.info-grid-item span {
    color: #595959;
}

/* Company Highlight */
.company-highlight {
    padding: 12px;
}

/* Benefits List */
.benefits-list {
    padding: 12px;
}

.benefit-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
    font-size: 15px;
}

.benefit-item:last-child {
    margin-bottom: 0;
}

.benefit-check {
    color: #2f54eb;
    font-size: 18px;
    margin-right: 8px;
    flex-shrink: 0;
}

/* Responsivo específico para botão de 2 linhas */
@media (max-width: 768px) {
    .btn-rota-bonito span {
        font-size: 13px !important;
    }
}
```

## 4. JavaScript

```javascript
// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    const btnRotaBonito = document.getElementById('btnRotaBonito');
    const modal = document.getElementById('modalRotaBonito');

    // Se o modal não existir, sair
    if (!modal || !btnRotaBonito) return;

    const closeBtn = modal.querySelector('.modal-turismo-close');
    const accordionHeaders = modal.querySelectorAll('.accordion-header');

    // Abrir modal
    btnRotaBonito.addEventListener('click', function() {
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

            // Fechar todos os itens no mesmo modal (comportamento accordion - apenas um aberto)
            const modalAccordion = this.closest('.accordion-turismo');
            const allItems = modalAccordion.querySelectorAll('.accordion-item');
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

### Passo 1: Usar o CSS do Modal Anterior
Este modal usa os mesmos estilos base do modal "Como Chegar a Corumbá", então você só precisa adicionar os **estilos adicionais** específicos deste modal.

Se já implementou o primeiro modal, adicione apenas os estilos da seção "Estilos CSS Adicionais" acima.

### Passo 2: Adicionar o Botão
Adicione o botão onde deseja que apareça (provavelmente logo após o botão "Como chegar a Corumbá"):

```php
<button id="btnRotaBonito" class="btn-modal-turismo btn-rota-bonito">
    <span style="font-size: 14px;">🗺️ Principal Rota Turística</span>
    <span style="font-size: 15px;">🌿 Bonito → Corumbá | Pantanal Sul</span>
</button>
```

### Passo 3: Adicionar o Modal
Adicione o HTML completo do modal antes do fechamento do `</body>`:

```php
<?php include 'includes/modal-rota-bonito.php'; ?>
```

Ou cole o HTML completo diretamente.

### Passo 4: Adicionar o JavaScript
Se já tem o JavaScript do primeiro modal, pode adicionar o JavaScript deste modal no mesmo arquivo ou criar um arquivo separado:

```php
<script src="/js/modal-rota-bonito.js"></script>
```

**OU** adicione tudo em um único arquivo `/js/modals-turismo.js` contendo o JavaScript de ambos os modais.

## 6. Integração Completa (Ambos os Modais)

### Estrutura de Arquivos Recomendada:

```
/site-prefeitura/
├── css/
│   └── modal-turismo.css          (CSS base + estilos adicionais)
├── js/
│   └── modal-turismo.js           (JavaScript de ambos os modais)
├── includes/
│   ├── modal-como-chegar.php      (HTML do modal 1)
│   └── modal-rota-bonito.php      (HTML do modal 2)
└── index.php                       (ou página principal)
```

### No arquivo principal (index.php ou similar):

```php
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Turismo em Corumbá</title>

    <!-- Outros CSS -->
    <link rel="stylesheet" href="/css/modal-turismo.css">
</head>
<body>

    <!-- Sua página aqui -->

    <!-- Área de botões (sidebar, seção de turismo, etc.) -->
    <div class="botoes-turismo">
        <!-- Botão Como Chegar -->
        <button id="btnComoChegar" class="btn-modal-turismo btn-como-chegar">
            <span>🚌 Como chegar a Corumbá</span>
        </button>

        <!-- Botão Rota Bonito -->
        <button id="btnRotaBonito" class="btn-modal-turismo btn-rota-bonito">
            <span style="font-size: 14px;">🗺️ Principal Rota Turística</span>
            <span style="font-size: 15px;">🌿 Bonito → Corumbá | Pantanal Sul</span>
        </button>
    </div>

    <!-- Modais (no final do body) -->
    <?php include 'includes/modal-como-chegar.php'; ?>
    <?php include 'includes/modal-rota-bonito.php'; ?>

    <!-- JavaScript -->
    <script src="/js/modal-turismo.js"></script>
</body>
</html>
```

### Arquivo JavaScript Unificado (/js/modal-turismo.js):

```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Função genérica para inicializar modais
    function initModal(btnId, modalId) {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);

        if (!btn || !modal) return;

        const closeBtn = modal.querySelector('.modal-turismo-close');
        const accordionHeaders = modal.querySelectorAll('.accordion-header');

        // Abrir modal
        btn.addEventListener('click', function() {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });

        // Fechar modal
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });

        // Fechar ao clicar fora
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });

        // Accordion
        accordionHeaders.forEach(function(header) {
            header.addEventListener('click', function() {
                const accordionItem = this.parentElement;
                const isActive = accordionItem.classList.contains('active');

                const modalAccordion = this.closest('.accordion-turismo');
                const allItems = modalAccordion.querySelectorAll('.accordion-item');
                allItems.forEach(function(item) {
                    item.classList.remove('active');
                });

                if (!isActive) {
                    accordionItem.classList.add('active');
                }
            });
        });
    }

    // Fechar modais com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-turismo.show');
            openModals.forEach(function(modal) {
                modal.classList.remove('show');
            });
            document.body.style.overflow = '';
        }
    });

    // Inicializar ambos os modais
    initModal('btnComoChegar', 'modalComoChegar');
    initModal('btnRotaBonito', 'modalRotaBonito');
});
```

## 7. Observações Importantes

### Diferenças entre os dois modais:
1. **Cores**: Modal "Como Chegar" usa azul (#1890ff), Modal "Rota Bonito" usa azul-púrpura (#2f54eb)
2. **Altura do botão**: Modal "Como Chegar" 60px, Modal "Rota Bonito" 70px (2 linhas)
3. **Conteúdo**: Diferentes seções e informações
4. **CSS compartilhado**: Ambos usam as mesmas classes base, com variações de cor

### Compatibilidade:
- ✅ Funciona sem frameworks (JavaScript vanilla)
- ✅ Suporta PHP 5.6+
- ✅ Responsivo (mobile-first)
- ✅ UTF-8 para emojis
- ✅ Acessibilidade (ESC, aria-labels)

### Manutenção:
- Para atualizar dados: edite o HTML dos arquivos PHP de includes
- Para alterar cores: modifique as classes CSS específicas
- Para adicionar mais seções: copie um `.accordion-item` e ajuste o conteúdo

## 8. Testes

Após implementar, teste:
1. ✅ Clique nos botões abre os modais corretos
2. ✅ Botão X fecha o modal
3. ✅ Clicar fora do modal fecha
4. ✅ Tecla ESC fecha o modal
5. ✅ Accordion abre/fecha corretamente (apenas um aberto por vez)
6. ✅ Responsividade em mobile
7. ✅ Emojis aparecem corretamente
8. ✅ Tabelas são legíveis em telas pequenas

## 9. Customização Rápida

### Alterar cor do botão:
```css
.btn-rota-bonito {
    background: linear-gradient(135deg, #NOVA_COR_1 0%, #NOVA_COR_2 100%);
    box-shadow: 0 4px 15px rgba(R, G, B, 0.4); /* ajustar RGB */
}
```

### Permitir múltiplos accordions abertos:
Remova este trecho do JavaScript:
```javascript
const allItems = modalAccordion.querySelectorAll('.accordion-item');
allItems.forEach(function(item) {
    item.classList.remove('active');
});
```

### Alterar texto do botão:
Edite diretamente no HTML do botão, mantendo a estrutura de 2 spans.
