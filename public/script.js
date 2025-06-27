document.addEventListener('DOMContentLoaded', () => {
const token = localStorage.getItem('token');
if (!token) { window.location.href = '/login.html'; return; }
function parseJwt(t){try{return JSON.parse(atob(t.split('.')[1]));}catch(e){return {};}}
const userData = parseJwt(token);
if (userData.precisa_trocar_senha) {
    window.location.href = '/change-password.html';
    return;
}
const showUpgradeModal = () => { if(modalUpgradeEl) modalUpgradeEl.classList.add('active'); };
const authFetch = async (url, options = {}) => {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch(url, options);
    if (resp.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
    if (resp.status === 403) {
        try {
            const data = await resp.clone().json();
            if (data.error && data.error.includes('Limite do plano excedido')) {
                showUpgradeModal();
            }
        } catch (e) { /* ignore */ }
    }
    return resp;
};
    // --- 1. Seletores de Elementos ---
    const mainNavEl = document.querySelector('.main-nav');
    const viewContainers = document.querySelectorAll('.view-container');
    const listaContactosEl = document.getElementById('lista-contactos');
    const listaContactosCompletaEl = document.getElementById('lista-contactos-completa');
    const totalContactsCountEl = document.getElementById('total-contacts-count');
    const mainContentAreaEl = document.getElementById('main-content-area');
    const chatWindowEl = document.getElementById('chat-window');
    const chatFooterEl = document.getElementById('chat-footer');
    const barraBuscaEl = document.getElementById('barra-busca');
    const btnAdicionarNovoEl = document.getElementById('btn-adicionar-novo');
    const modalPedidoEl = document.getElementById('modal-pedido');
    const formPedidoEl = document.getElementById('form-pedido');
    const modalTituloEl = document.getElementById('modal-titulo');
    const btnModalCancelarEl = document.getElementById('btn-modal-cancelar');
    const formEnviarMensagemEl = document.getElementById('form-enviar-mensagem');
    const notificacaoEl = document.getElementById('notificacao');
    const notificacaoTextoEl = document.getElementById('notificacao-texto');
    const notificacaoIconEl = document.getElementById('notificacao-icon');
    const notificacaoCloseBtnEl = document.getElementById('notificacao-close-btn');
    const filterContainerEl = document.getElementById('filter-container');
    const btnSalvarAutomacoesEl = document.getElementById('btn-salvar-automacoes');
    const connectionStatusEl = document.getElementById('connection-status');
    const connectionStatusTextEl = document.getElementById('connection-status-text');
    const statusBotInfoEl = document.getElementById('status-bot-info');
    const botAvatarImgEl = document.getElementById('bot-avatar-img');
    const botAvatarContainerEl = document.getElementById('bot-avatar-container');
    const loggedUserEl = document.getElementById('logged-user');
    const qrCodeContainerEl = document.getElementById('qr-code-container');
    const btnConectarEl = document.getElementById('btn-conectar');
    const btnDesconectarEl = document.getElementById('btn-desconectar');
    const settingsProfileInfoEl = document.getElementById('settings-profile-info');
    const settingsBotAvatarEl = document.getElementById('settings-bot-avatar');
    const settingsBotNameEl = document.getElementById('settings-bot-name');
    const settingsBotNumberEl = document.getElementById('settings-bot-number');
    const settingsConnectionStatusEl = document.getElementById('settings-connection-status');
    const settingsStatusTextEl = document.getElementById('settings-status-text');
    const webhookUrlDisplayEl = document.getElementById('webhook-url-display');
    const btnCopyWebhookEl = document.getElementById('btn-copy-webhook');
    const btnRegenerateWebhookEl = document.getElementById('btn-regenerate-webhook');
    const inputPostbackSecretEl = document.getElementById('input-postback-secret');
    const btnSavePostbackSecretEl = document.getElementById('btn-save-postback-secret');
    const logoutBtnEl = document.getElementById('logout-btn');
    const modalConfirmacaoEl = document.getElementById('modal-confirmacao');
    const modalConfirmacaoTextoEl = document.getElementById('modal-confirmacao-texto');
    const btnConfirmacaoCancelarEl = document.getElementById('btn-confirmacao-cancelar');
    const btnConfirmacaoConfirmarEl = document.getElementById('btn-confirmacao-confirmar');
    const ordersInTransitCardEl = document.getElementById('orders-in-transit-card');
    const averageDeliveryTimeCardEl = document.getElementById('average-delivery-time-card');
    const alertOrdersCardEl = document.getElementById('alert-orders-card');
    const deliveryRateCardEl = document.getElementById('delivery-rate-card');
    const newContactsChartCanvas = document.getElementById('new-contacts-chart');
    const statusPieChartCanvas = document.getElementById('status-pie-chart');
    const billingTableBodyEl = document.getElementById('billing-table-body');
    const billingSummaryEl = document.getElementById('billing-summary');
    const integrationHistoryBodyEl = document.getElementById('integration-history-body');
    const integrationPaginationEl = document.getElementById('integration-pagination');
    const toggleCreateContactEl = document.getElementById('toggle-create-contact');
    const toggleCreateContactLabelEl = document.getElementById('toggle-create-contact-label');
    const plansListEl = document.getElementById('plans-list');
    const modalUpgradeEl = document.getElementById('modal-upgrade');
    const btnUpgradePlansEl = document.getElementById('btn-upgrade-plans');
const planStatusEl = document.getElementById('plan-status');
    if (loggedUserEl) loggedUserEl.textContent = userData.email || 'Usuário';

    const variableTooltips = {
        '{{link_rastreio}}': 'Insere o link completo e clicável para a página de rastreamento dos Correios.',
        '{{status_rastreio}}': "Mostra o status resumido do rastreamento (Ex: 'A caminho', 'Entregue', 'Postado').",
        '{{cidade_etapa_origem}}': 'Mostra a cidade de ONDE o pacote saiu na última movimentação registrada pelos Correios.',
        '{{cidade_etapa_destino}}': 'Mostra a cidade para ONDE o pacote está indo na última movimentação registrada.',
        '{{data_postagem_formatada}}': 'A data em que o pedido foi postado, no formato dd/mm/aaaa.',
        '{{data_atualizacao_formatada}}': 'A data e a hora da última atualização do rastreio, no formato dd/mm/aaaa HH:mm.'
    };

    // --- 2. Estado da Aplicação ---
    let todosOsPedidos = [];
    let pedidoAtivoId = null;
    let debounceTimer;
    let notificacaoTimer;
    let currentWhatsappStatus = 'DISCONNECTED';
    let qrCodeTimer = null;
    let filtroAtivo = 'todos';
    let contactsChart = null;
    let statusChart = null;
    let integrationCurrentPage = 1;
    const integrationLimit = 5;


     const accordionHeaders = document.querySelectorAll('.accordion-header');
    if (accordionHeaders.length > 0) {
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('active');
                const content = header.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    }
     const variablesToCopy = document.querySelectorAll('.variable-highlight');
    if (variablesToCopy.length > 0) {
        variablesToCopy.forEach(variable => {
            variable.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede que o clique na variável feche o menu
                
                const valueToCopy = variable.dataset.value;
                if(valueToCopy && navigator.clipboard) {
                     navigator.clipboard.writeText(valueToCopy).then(() => {
                        // Opcional: Adicionar um feedback visual "Copiado!"
                        const originalText = variable.querySelector('span').textContent;
                        variable.querySelector('span').textContent = 'Copiado!';
                        setTimeout(() => {
                             variable.querySelector('span').textContent = originalText;
                        }, 1500);
                     });
                }
            });
        });
    }


    


    // --- 3. Funções de UI e Notificação ---
    const showNotification = (message, type = 'success') => {
        if (!notificacaoEl) return;
        clearTimeout(notificacaoTimer);
        const iconMap = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
        };
        notificacaoEl.classList.remove('show', 'error', 'success');
        if (notificacaoIconEl) notificacaoIconEl.innerHTML = iconMap[type] || '';
        if (notificacaoTextoEl) notificacaoTextoEl.textContent = message;
        notificacaoEl.classList.add(type);
        void notificacaoEl.offsetWidth; 
        notificacaoEl.classList.add('show');
        notificacaoTimer = setTimeout(() => {
            notificacaoEl.classList.remove('show');
        }, 5000);
    };
   
    function showView(viewId) {
        if (!viewContainers || !mainNavEl) return;
        viewContainers.forEach(view => view.classList.add('hidden'));
        const activeView = document.getElementById(viewId);
        if (activeView) activeView.classList.remove('hidden');

        mainNavEl.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewId) btn.classList.add('active');
        });

        if (viewId === 'contacts-view') renderizarContatosPaginaCompleta();
        if (viewId === 'automations-view') loadAutomations();
        if (viewId === 'integrations-view') {
            loadIntegrationInfo();
            loadIntegrationHistory();
        }
        if (viewId === 'settings-view') loadUserSettings();
        if (viewId === 'reports-view') loadReportData();
        if (viewId === 'logs-view') loadBillingHistory();
        if (viewId === 'plans-view') loadPlans();
    }

    const showConfirmationModal = (message, onConfirm) => {
        if (!modalConfirmacaoEl || !modalConfirmacaoTextoEl || !btnConfirmacaoConfirmarEl || !btnConfirmacaoCancelarEl) return;
        
        modalConfirmacaoTextoEl.textContent = message;
        modalConfirmacaoEl.classList.add('active');
        
        const handleConfirm = () => {
            onConfirm();
            closeConfirmationModal();
        };

        const closeConfirmationModal = () => {
            modalConfirmacaoEl.classList.remove('active');
            btnConfirmacaoConfirmarEl.removeEventListener('click', handleConfirm);
            btnConfirmacaoCancelarEl.removeEventListener('click', closeConfirmationModal);
        };

        btnConfirmacaoConfirmarEl.addEventListener('click', handleConfirm, { once: true });
        btnConfirmacaoCancelarEl.addEventListener('click', closeConfirmationModal, { once: true });
    };

    function highlightVariables(textarea) {
        if (!textarea) return;
        const text = textarea.value;
        const backdrop = textarea.previousElementSibling;
        if (!backdrop) return;
        
        const highlightedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/{{(.*?)}}/g, (match, p1) => {
                const key = `{{${p1}}}`;
                const tooltip = variableTooltips[key];
                const tooltipAttr = tooltip ? ` data-tooltip="${tooltip.replace(/"/g, '&quot;')}"` : '';
                return `<span class="variable-highlight"${tooltipAttr}>{{${p1}}}</span>`;
            });
        
        backdrop.innerHTML = highlightedText; 
        backdrop.scrollTop = textarea.scrollTop;
    }

    function updateStatusUI(status, data = {}) {
        clearTimeout(qrCodeTimer);
        currentWhatsappStatus = status;
        const statusMap = { DISCONNECTED: 'Desconectado', CONNECTING: 'A conectar...', CONNECTED: 'Conectado', QR_CODE: 'Aguardando QR Code' };
        const statusText = statusMap[status] || 'Desconhecido';
        
        if (settingsProfileInfoEl) settingsProfileInfoEl.classList.add('hidden');
        if (settingsConnectionStatusEl) settingsConnectionStatusEl.classList.add('hidden');
        if (qrCodeContainerEl) qrCodeContainerEl.innerHTML = '';
        if (connectionStatusEl) {
            connectionStatusEl.className = 'status-indicator';
            connectionStatusEl.classList.add(status.toLowerCase());
        }
        if (connectionStatusTextEl) connectionStatusTextEl.textContent = statusText;
        if (statusBotInfoEl) statusBotInfoEl.textContent = '';
        if (botAvatarImgEl) botAvatarImgEl.src = 'https://i.imgur.com/z28n3Nz.png';
        if (botAvatarContainerEl) botAvatarContainerEl.classList.add('hidden');
        if (status === 'CONNECTED' && data.botInfo) {
            if (statusBotInfoEl) statusBotInfoEl.textContent = `${data.botInfo.nome} - ${data.botInfo.numero}`;
            if (botAvatarImgEl && data.botInfo.fotoUrl) botAvatarImgEl.src = data.botInfo.fotoUrl;
            if (botAvatarContainerEl) botAvatarContainerEl.classList.remove('hidden');
        }

        if (status === 'QR_CODE' && data.qrCode) {
            if (settingsConnectionStatusEl) settingsConnectionStatusEl.classList.remove('hidden');
            if (settingsStatusTextEl) settingsStatusTextEl.textContent = 'Aguardando QR Code';
            if (qrCodeContainerEl) qrCodeContainerEl.innerHTML = `<p>Escaneie o QR Code com seu celular:</p><img src="${data.qrCode}" alt="QR Code do WhatsApp">`;
            qrCodeTimer = setTimeout(() => {
                if (currentWhatsappStatus === 'QR_CODE' && qrCodeContainerEl) {
                    qrCodeContainerEl.innerHTML = `<div class="qr-expired"><p>O QR Code expirou!</p><button id="btn-regenerate-qr" class="btn-settings-action connect">Gerar Novo QR Code</button></div>`;
                }
            }, 45000);
        } else if (status === 'CONNECTED' && data.botInfo) {
            if (settingsProfileInfoEl) settingsProfileInfoEl.classList.remove('hidden');
            if (settingsBotAvatarEl) {
                settingsBotAvatarEl.src = data.botInfo.fotoUrl || 'https://i.imgur.com/z28n3Nz.png';
                settingsBotAvatarEl.onerror = () => { settingsBotAvatarEl.src = 'https://i.imgur.com/z28n3Nz.png'; };
            }
            if (settingsBotNameEl) settingsBotNameEl.textContent = data.botInfo.nome || 'Nome não encontrado';
            if (settingsBotNumberEl) settingsBotNumberEl.textContent = data.botInfo.numero;
        } else {
            if (settingsConnectionStatusEl) settingsConnectionStatusEl.classList.remove('hidden');
            if (settingsStatusTextEl) settingsStatusTextEl.textContent = statusText;
        }
        if (btnConectarEl) btnConectarEl.style.display = (status === 'DISCONNECTED') ? 'inline-block' : 'none';
        if (btnDesconectarEl) btnDesconectarEl.style.display = (status === 'CONNECTED') ? 'inline-block' : 'none';
    }

    const connectWebSocket = () => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${wsProtocol}://${window.location.host}`);
        ws.onopen = () => console.log('🔗 Conexão WebSocket estabelecida.');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'nova_mensagem' || data.type === 'novo_contato' || data.type === 'pedido_atualizado') {
                fetchErenderizarTudo();
                if (data.type === 'nova_mensagem' && pedidoAtivoId && data.pedidoId === pedidoAtivoId) {
                    const pedido = todosOsPedidos.find(p => p.id === pedidoAtivoId);
                    if (pedido) selecionarPedidoErenderizarDetalhes(pedido);
                }
            } else if (data.type === 'status_update') {
                updateStatusUI(data.status, data);
            }
        };
        ws.onclose = () => {
            console.log('🔌 Conexão WebSocket fechada. A tentar reconectar...');
            setTimeout(connectWebSocket, 5000);
        };
    };

    // --- 4. Funções de Lógica e Renderização ---
    function formatarDataContato(dataISO) {
        if (!dataISO) return '';
        const dataUtc = new Date(dataISO.includes('Z') ? dataISO : dataISO.replace(' ', 'T') + 'Z');
        const agora = new Date();
        const dataLocal = new Date(dataUtc.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const mesmoDia = agora.toDateString() === dataLocal.toDateString();
        const ontem = new Date();
        ontem.setDate(agora.getDate() - 1);
        const foiOntem = ontem.toDateString() === dataLocal.toDateString();
        if (mesmoDia) {
            return dataUtc.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        }
        if (foiOntem) {
            return 'Ontem';
        }
        return dataUtc.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
    }

    function corAvatar(nome) {
        let hash = 0;
        for (let i = 0; i < nome.length; i++) {
            hash = nome.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    const renderizarListaDeContactos = () => {
        if(!listaContactosEl) return;
        listaContactosEl.innerHTML = '';
        if (todosOsPedidos.length === 0) {
            listaContactosEl.innerHTML = `<p class="info-mensagem">Nenhum contacto encontrado.</p>`;
            return;
        }
        todosOsPedidos.forEach(pedido => {
            const item = document.createElement('div');
            item.className = 'contact-item contact-item-clickable';
            item.dataset.id = pedido.id;
            if (pedido.id === pedidoAtivoId) item.classList.add('active');
            if (pedido.statusInterno) {
                if (pedido.statusInterno === 'entregue') item.dataset.status = 'entregue';
                else item.dataset.status = 'caminho';
            }
            const primeiraLetra = pedido.nome ? pedido.nome.charAt(0).toUpperCase() : '?';
            const cor = corAvatar(pedido.nome || '');
            const fotoHtml = pedido.fotoPerfilUrl
                ? `<img src="${pedido.fotoPerfilUrl}" alt="Foto de ${pedido.nome}" onerror="this.parentElement.innerHTML = '<div class=\\'avatar-fallback\\' style=\\'background-color:${cor};\\'>${primeiraLetra}</div>';">`
                : `<div class="avatar-fallback" style="background-color:${cor};">${primeiraLetra}</div>`;
            const contadorHtml = pedido.mensagensNaoLidas > 0 ? `<div class="unread-counter">${pedido.mensagensNaoLidas}</div>` : '';
            const timestampHtml = `<span class="contact-timestamp">${formatarDataContato(pedido.dataUltimaMensagem)}</span>`;
            const previewMensagem = pedido.ultimaMensagem ? pedido.ultimaMensagem.substring(0, 35) + (pedido.ultimaMensagem.length > 35 ? '...' : '') : 'Novo Pedido';
            item.innerHTML = `${timestampHtml}<div class="avatar-container">${fotoHtml}</div><div class="info"><h4>${pedido.nome}</h4><p>${previewMensagem}</p></div>${contadorHtml}`;
            listaContactosEl.appendChild(item);
        });
    };

    const renderizarContatosPaginaCompleta = () => {
        if (!listaContactosCompletaEl || !totalContactsCountEl) return;
        listaContactosCompletaEl.innerHTML = '';
        totalContactsCountEl.textContent = todosOsPedidos.length;
        if (todosOsPedidos.length === 0) {
            listaContactosCompletaEl.innerHTML = `<p class="info-mensagem">Nenhum contacto para exibir.</p>`;
            return;
        }
        todosOsPedidos.forEach(pedido => {
            const item = document.createElement('div');
            item.className = 'contact-row contact-item-clickable';
            item.dataset.id = pedido.id;
            const primeiraLetra = pedido.nome ? pedido.nome.charAt(0).toUpperCase() : '?';
            const cor = corAvatar(pedido.nome || '');
            const fotoHtml = pedido.fotoPerfilUrl
                ? `<img src="${pedido.fotoPerfilUrl}" alt="Foto de ${pedido.nome}" onerror="this.parentElement.innerHTML = '<div class=\\'avatar-fallback\\' style=\\'background-color:${cor};\\'>${primeiraLetra}</div>';">`
                : `<div class="avatar-fallback" style="background-color:${cor};">${primeiraLetra}</div>`;
            item.innerHTML = `<div class="avatar-container">${fotoHtml}</div><div class="info"><h4>${pedido.nome || 'Nome não disponível'}</h4><p>${pedido.telefone}</p></div><div class="contact-tag">cliente</div><div class="arrow-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div>`;
            listaContactosCompletaEl.appendChild(item);
        });
    };

    const selecionarPedidoErenderizarDetalhes = async (pedido) => {
        if (!pedido || !chatWindowEl || !chatFooterEl || !formEnviarMensagemEl) return;
        if (pedido.mensagensNaoLidas > 0) {
            try {
                await authFetch(`/api/pedidos/${pedido.id}/marcar-como-lido`, { method: 'PUT' });
                pedido.mensagensNaoLidas = 0;
            } catch (error) { console.error("Falha ao marcar como lido:", error); }
        }
        pedidoAtivoId = pedido.id;
        const btnExcluirHtml = `<button class="btn-excluir-main">Excluir</button>`;
        const telefoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M3.654 1.328a.678.678 0 0 1 .737-.203l2.522.84a.678.678 0 0 1 .449.604l.146 2.757a.678.678 0 0 1-.202.494l-1.013 1.013a11.27 11.27 0 0 0 4.664 4.664l1.013-1.013a.678.678 0 0 1 .494-.202l2.757.146a.678.678 0 0 1 .604.449l.84 2.522a.678.678 0 0 1-.203.737l-2.3 2.3a.678.678 0 0 1-.737.15c-1.204-.502-2.38-1.196-3.518-2.034a17.567 17.567 0 0 1-4.401-4.401c-.838-1.138-1.532-2.314-2.034-3.518a.678.678 0 0 1 .15-.737l2.3-2.3z"/></svg>`;
        const produtoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8.21 1.03a1 1 0 0 0-.42 0L2 2.522V6c0 3.066 2.582 5.854 6 6.92 3.418-1.066 6-3.855 6-6.92V2.522L8.21 1.03z"/><path d="M8 3.048 13.377 4.6 8 6.152 2.623 4.6 8 3.048zM3.022 5.825l4.978 1.559v4.97l-4.978-2.03V5.825zm5.956 6.529V7.384l4.978-1.559v4.499l-4.978 2.03z"/></svg>`;
        const rastreioIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v3h2.5a.5.5 0 0 1 .39.188l2.5 3a.5.5 0 0 1 .11.312V11a2 2 0 1 1-4 0h-8a2 2 0 1 1-4 0V1z"/><path d="M6 11a2 2 0 1 0 4 0H6z"/></svg>`;
        chatWindowEl.innerHTML = `<div class="detalhes-header"><h3>${pedido.nome}</h3><div><button class="btn-editar-main">Editar</button>${btnExcluirHtml}</div></div><div class="detalhes-body"><p>${telefoneIcon} ${pedido.telefone}</p><p>${produtoIcon} ${pedido.produto || 'N/A'}</p><p>${rastreioIcon} ${pedido.codigoRastreio || 'Nenhum'}</p></div><div class="chat-feed" id="chat-feed"><p class="info-mensagem">A carregar histórico...</p></div>`;
        chatFooterEl.classList.add('active');
        formEnviarMensagemEl.querySelector('input').disabled = false;
        formEnviarMensagemEl.querySelector('button').disabled = false;
        renderizarListaDeContactos();
        try {
            const response = await authFetch(`/api/pedidos/${pedido.id}/historico`);
            const { data: historico } = await response.json();
            const chatFeedEl = document.getElementById('chat-feed');
            if(chatFeedEl) {
                chatFeedEl.innerHTML = '';
                if (!historico || historico.length === 0) {
                    chatFeedEl.innerHTML = '<p class="info-mensagem">Nenhuma mensagem neste histórico.</p>';
                } else {
                    historico.forEach(msg => {
                        const msgDiv = document.createElement('div');
                        const isAuto = msg.origem === 'bot' && msg.tipo_mensagem && msg.tipo_mensagem !== 'manual';
                        msgDiv.className = `chat-message ${msg.origem === 'cliente' ? 'recebido' : 'enviado'}${isAuto ? ' automatic' : ''}`;
                        const dataUtc = new Date(msg.data_envio.includes('Z') ? msg.data_envio : msg.data_envio.replace(' ', 'T') + 'Z');
                        const dataFormatada = dataUtc.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
                        const autoIcon = isAuto ? ' <span class="auto-indicator" title="Automática">🤖</span>' : '';
                        msgDiv.innerHTML = `<p>${msg.mensagem.replace(/\n/g, '<br>')}</p><span class="timestamp">${dataFormatada}${autoIcon}</span>`;
                        chatFeedEl.appendChild(msgDiv);
                    });
                    chatFeedEl.scrollTop = chatFeedEl.scrollHeight;
                }
            }
        } catch (error) {
            const chatFeedEl = document.getElementById('chat-feed');
            if(chatFeedEl) chatFeedEl.innerHTML = '<p class="info-mensagem" style="color: red;">Erro ao carregar histórico.</p>';
        }
    };

    const fetchErenderizarTudo = async () => {
        const termoBusca = barraBuscaEl ? barraBuscaEl.value : '';
        const url = new URL('/api/pedidos', window.location.origin);
        url.searchParams.append('filtroStatus', filtroAtivo);
        if (termoBusca) url.searchParams.append('busca', termoBusca);
        try {
            const response = await authFetch(url);
            if (!response.ok) throw new Error('Falha ao buscar pedidos.');
            todosOsPedidos = (await response.json()).data || [];
            renderizarListaDeContactos();
            if (pedidoAtivoId) {
                const pedidoAtivoAindaExiste = todosOsPedidos.some(p => p.id === pedidoAtivoId);
                if (!pedidoAtivoAindaExiste && chatWindowEl && chatFooterEl && formEnviarMensagemEl) {
                    pedidoAtivoId = null;
                    chatWindowEl.innerHTML = `<div class="placeholder"><h3>Selecione um contacto</h3><p>O contacto anterior não foi encontrado no filtro atual.</p></div>`;
                    chatFooterEl.classList.remove('active');
                    formEnviarMensagemEl.querySelector('input').disabled = true;
                    formEnviarMensagemEl.querySelector('button').disabled = true;
                }
            }
        } catch (e) {
            console.error("Falha ao buscar e renderizar:", e);
            showNotification('Erro ao carregar os dados. Verifique a consola.', 'error');
        }
    };

    const abrirModal = (pedido = null) => {
        if (!pedido && currentWhatsappStatus !== 'CONNECTED') {
            showNotification('É preciso estar conectado ao WhatsApp para adicionar um novo contato.', 'error');
            return;
        }
        if(!formPedidoEl || !modalTituloEl || !modalPedidoEl) return;
        formPedidoEl.reset();
        modalTituloEl.textContent = 'Adicionar Novo Pedido';
        formPedidoEl.querySelector('#pedido-id').value = '';
        if (pedido) {
            modalTituloEl.textContent = 'Editar Pedido';
            formPedidoEl.querySelector('#pedido-id').value = pedido.id;
            Object.keys(pedido).forEach(key => {
                const input = formPedidoEl.querySelector(`[name="${key}"]`);
                if (input) input.value = pedido[key] || '';
            });
        }
        modalPedidoEl.classList.add('active');
    };
    const fecharModal = () => { if(modalPedidoEl) modalPedidoEl.classList.remove('active'); };

    async function loadIntegrationInfo() {
        if (!webhookUrlDisplayEl) return;
        try {
            const response = await authFetch('/api/integrations/info');
            if (!response.ok) throw new Error('Falha ao buscar chave de API.');
            const data = await response.json();
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const webhookUrl = `${baseUrl}/api/postback?key=${data.apiKey}`;
            webhookUrlDisplayEl.textContent = webhookUrl;
            if (inputPostbackSecretEl) inputPostbackSecretEl.value = data.settings && data.settings.postback_secret ? data.settings.postback_secret : '';
        } catch (error) {
            webhookUrlDisplayEl.textContent = "Erro ao carregar o link.";
            showNotification(error.message, 'error');
        }
    }

    async function loadUserSettings() {
        if (!toggleCreateContactEl) return;
        try {
            const response = await authFetch('/api/settings/contact-creation');
            if (!response.ok) throw new Error('Falha ao carregar configuração.');
            const data = await response.json();
            toggleCreateContactEl.checked = data.create_contact_on_message;
            if (toggleCreateContactLabelEl) toggleCreateContactLabelEl.textContent = data.create_contact_on_message ? 'Ativado' : 'Desativado';
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function loadAutomations() {
        try {
            const response = await authFetch('/api/automations');
            if (!response.ok) throw new Error('Falha ao carregar automações.');
            const configuracoesAutomacao = await response.json();
            document.querySelectorAll('.automation-card').forEach(card => {
                const automationId = card.dataset.automationId;
                const config = configuracoesAutomacao[automationId];
                if (config) {
                    const textarea = card.querySelector('.automation-message');
                    const toggle = card.querySelector('.automation-toggle');
                    const toggleLabel = card.querySelector('.toggle-label');
                    if(toggle) toggle.checked = config.ativo;
                    if(textarea) {
                        textarea.value = config.mensagem;
                        textarea.disabled = !config.ativo;
                        highlightVariables(textarea);
                    }
                    if(toggleLabel) toggleLabel.textContent = config.ativo ? 'Ativado' : 'Desativado';
                }
            });
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function saveAutomations() {
        const novasConfiguracoes = {};
        document.querySelectorAll('.automation-card').forEach(card => {
            const automationId = card.dataset.automationId;
            const toggle = card.querySelector('.automation-toggle');
            const messageTextarea = card.querySelector('.automation-message');
            novasConfiguracoes[automationId] = {
                ativo: toggle.checked,
                mensagem: messageTextarea.value
            };
        });
        try {
            const response = await authFetch('/api/automations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novasConfiguracoes)
            });
            if (!response.ok) throw new Error('Falha ao salvar as configurações.');
            const resultado = await response.json();
            showNotification(resultado.message, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    function createContactsChart(data) {
        if (!newContactsChartCanvas || typeof Chart === 'undefined') return;
        if (contactsChart) contactsChart.destroy();
        const labels = [];
        const counts = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayString = d.toISOString().split('T')[0];
            const dateParts = dayString.split('-');
            labels.push(`${dateParts[2]}/${dateParts[1]}`);
            const dayData = data.find(item => item.dia === dayString);
            counts.push(dayData ? dayData.count : 0);
        }
        contactsChart = new Chart(newContactsChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Novos Contatos',
                    data: counts,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
        });
    }


    function createStatusChart(data) {
        if (!statusPieChartCanvas || typeof Chart === 'undefined') return;
        if (statusChart) statusChart.destroy();
        const labels = data.map(item => item.statusInterno ? (item.statusInterno.charAt(0).toUpperCase() + item.statusInterno.slice(1)) : 'Não definido');
        const counts = data.map(item => item.count);
        const colorMap = {
            entregue: 'rgba(34,197,94,0.7)',
            pedido_atrasado: 'rgba(234,179,8,0.7)',
            pedido_devolvido: 'rgba(239,68,68,0.7)'
        };
        const backgroundColors = data.map(item => colorMap[item.statusInterno] || 'rgba(59,130,246,0.7)');
        statusChart = new Chart(statusPieChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Status dos Pedidos',
                    data: counts,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });
    }
    async function loadReportData() {
        try {
            const response = await authFetch('/api/reports/summary');
            if (!response.ok) throw new Error('Falha ao carregar dados do relatório.');
            const data = await response.json();
            if(ordersInTransitCardEl) ordersInTransitCardEl.textContent = data.ordersInTransit;
            if(averageDeliveryTimeCardEl) averageDeliveryTimeCardEl.textContent = data.averageDeliveryTime;
            if(alertOrdersCardEl) alertOrdersCardEl.textContent = data.alertOrders;
            if(deliveryRateCardEl) deliveryRateCardEl.textContent = data.deliveryRate + '%';
            createContactsChart(data.newContactsLast7Days);
            createStatusChart(data.statusDistribution);
        } catch (error) {
            console.error("Erro ao carregar dados do relatório:", error);
            showNotification(error.message, 'error');
        }
    }

    async function loadBillingHistory() {
        if (!billingTableBodyEl) return;
        billingTableBodyEl.innerHTML = '<tr><td colspan="4">A carregar...</td></tr>';
        try {
            const resp = await authFetch('/api/billing/history');
            if (!resp.ok) throw new Error('Falha ao carregar histórico.');
            const { pedidos } = await resp.json();
            billingTableBodyEl.innerHTML = '';
            if (billingSummaryEl) {
                const count = pedidos ? pedidos.length : 0;
                billingSummaryEl.textContent = `Exibindo ${count} pedidos com rastreio ativo que estão contando para o seu ciclo atual.`;
            }
            if (!pedidos || pedidos.length === 0) {
                billingTableBodyEl.innerHTML = '<tr><td colspan="4" class="billing-empty"><div class="placeholder-view"><div style="font-size:2rem">📦</div><h1>Nenhum Rastreio Ativo</h1><p>Adicione um código de rastreio a um dos seus contatos para começar a acompanhar e ver seu consumo aqui.</p></div></td></tr>';
                return;
            }
            pedidos.forEach(p => {
                const tr = document.createElement('tr');
                const link = `https://www.linkcorreios.com.br/${p.codigoRastreio}`;
                tr.innerHTML = `<td>${new Date(p.dataCriacao).toLocaleDateString()}</td><td>${p.nome}</td><td>${p.produto || ''}</td><td><a href="${link}" target="_blank">${p.codigoRastreio}</a></td>`;
                billingTableBodyEl.appendChild(tr);
            });
        } catch (err) {
            console.error('Erro ao carregar histórico de faturamento:', err);
        }
    }

    async function loadSubscriptionStatus() {
        if (!planStatusEl) return;
        planStatusEl.textContent = 'Carregando...';
        try {
            const resp = await authFetch('/api/subscription');
            if (!resp.ok) throw new Error('Falha ao carregar assinatura');
            const { subscription } = await resp.json();
            const limite = subscription.monthly_limit === -1 ? 'Ilimitado' : subscription.monthly_limit;
            const percent = subscription.monthly_limit === -1 ? 0 : Math.min(100, Math.round((subscription.usage / subscription.monthly_limit) * 100));
            planStatusEl.innerHTML = `<div>Plano Atual: ${subscription.plan_name} — Uso este mês: ${subscription.usage} / ${limite} pedidos</div><div class="plan-progress"><div class="plan-progress-bar" style="width:${percent}%"></div></div>`;
        } catch (err) {
            planStatusEl.textContent = 'Erro ao carregar plano';
        }
    }

    async function loadPlans() {
        if (!plansListEl) return;
        plansListEl.innerHTML = '<p class="info-mensagem">A carregar...</p>';
        try {
            const [plansResp, subResp] = await Promise.all([
                authFetch('/api/plans'),
                authFetch('/api/subscription')
            ]);
            const { data } = await plansResp.json();
            const { subscription } = await subResp.json();
            const activePlanId = subscription ? subscription.plan_id : null;

            const planFeatures = {
                'Grátis': ['10 pedidos/mês', 'Suporte Comunitário'],
                'Start': ['50 pedidos/mês', 'Integrações Básicas', 'Relatórios Simples'],
                'Basic': ['100 pedidos/mês', 'Relatórios Padrão', 'Suporte via Email'],
                'Pro': ['250 pedidos/mês', 'Relatórios Avançados', 'Suporte Prioritário']
            };

            plansListEl.innerHTML = '';
            data.filter(p => p.name !== 'Pro Plus').forEach(p => {
                const card = document.createElement('div');
                card.className = 'plan-card';
                if (p.id === activePlanId) card.classList.add('active');

                const features = planFeatures[p.name] || [];
                const limite = p.monthly_limit === -1 ? 'Ilimitado' : `${p.monthly_limit} pedidos/mês`;
                const featuresHtml = features.map(f => `<li>${f}</li>`).join('');

                let badge = '';
                if (p.name === 'Basic') {
                    badge = '<span class="badge popular">Mais Popular</span>';
                }
                if (p.id === activePlanId) {
                    badge += '<span class="badge current">Plano Atual</span>';
                }

                const btnDisabled = p.id === activePlanId ? 'disabled' : '';
                const btnText = p.id === activePlanId ? 'Plano Atual' : 'Assinar Agora';

                card.innerHTML = `${badge}<h3>${p.name}</h3><p>${limite}</p><ul class="plan-features">${featuresHtml}</ul><p>R$ ${p.price}</p><button class="btn-primary" data-plan="${p.id}" ${btnDisabled}>${btnText}</button>`;
                plansListEl.appendChild(card);
            });

            const contactCard = document.createElement('div');
            contactCard.className = 'plan-card';
            contactCard.innerHTML = `<h3>Mais de 250 pedidos?</h3><p>Entre em contato com o suporte.</p>`;
            plansListEl.appendChild(contactCard);
        } catch (err) {
            plansListEl.innerHTML = '<p class="info-mensagem">Erro ao carregar planos.</p>';
        }
    }

    function renderIntegrationPagination(total) {
        if (!integrationPaginationEl) return;
        const totalPages = Math.max(1, Math.ceil(total / integrationLimit));
        integrationPaginationEl.innerHTML = '';
        if (totalPages <= 1) return;
        const prev = document.createElement('button');
        prev.textContent = 'Anterior';
        prev.disabled = integrationCurrentPage === 1;
        prev.addEventListener('click', () => loadIntegrationHistory(integrationCurrentPage - 1));
        integrationPaginationEl.appendChild(prev);
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === integrationCurrentPage) btn.classList.add('active');
            btn.addEventListener('click', () => loadIntegrationHistory(i));
            integrationPaginationEl.appendChild(btn);
        }
        const next = document.createElement('button');
        next.textContent = 'Próximo';
        next.disabled = integrationCurrentPage === totalPages;
        next.addEventListener('click', () => loadIntegrationHistory(integrationCurrentPage + 1));
        integrationPaginationEl.appendChild(next);
    }

    async function loadIntegrationHistory(page = 1) {
        if (!integrationHistoryBodyEl) return;
        integrationCurrentPage = page;
        integrationHistoryBodyEl.innerHTML = '<tr><td colspan="4">A carregar...</td></tr>';
        try {
            const resp = await authFetch(`/api/integrations/history?page=${page}&limit=${integrationLimit}`);
            if (!resp.ok) throw new Error('Falha ao carregar histórico.');
            const { data, total } = await resp.json();
            integrationHistoryBodyEl.innerHTML = '';
            if (!data || data.length === 0) {
                integrationHistoryBodyEl.innerHTML = '<tr><td colspan="4">Nenhum registro.</td></tr>';
            } else {
                data.forEach(item => {
                    const tr = document.createElement('tr');
                    const dt = new Date(item.created_at);
                    tr.innerHTML = `<td>${dt.toLocaleString('pt-BR')}</td><td>${item.client_name || '-'}</td><td>${item.product_name || '-'}</td><td><span class="status-badge ${item.status === 'sucesso' ? 'success' : 'error'}">${item.status === 'sucesso' ? 'Recebido' : 'Falhou'}</span></td>`;
                    integrationHistoryBodyEl.appendChild(tr);
                });
            }
            renderIntegrationPagination(total);
        } catch (err) {
            integrationHistoryBodyEl.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
        }
    }

    // --- 6. Event Listeners ---
    if(mainNavEl) mainNavEl.addEventListener('click', (e) => {
        const navBtn = e.target.closest('.nav-btn');
        if (navBtn) showView(navBtn.dataset.view);
    });

    document.addEventListener('click', async (e) => {
        const item = e.target.closest('.contact-item-clickable');
        if (item) {
            showView('chat-view'); 
            const pedidoId = parseInt(item.dataset.id, 10);
            const pedido = todosOsPedidos.find(p => p.id === pedidoId);
            if (pedido) await selecionarPedidoErenderizarDetalhes(pedido);
        }
    });
    
    if (btnSalvarAutomacoesEl) btnSalvarAutomacoesEl.addEventListener('click', saveAutomations);
    
    const btnNovoContatoPage = document.getElementById('btn-novo-contato-page');
    if (btnNovoContatoPage) btnNovoContatoPage.addEventListener('click', () => abrirModal());

    if (btnAdicionarNovoEl) btnAdicionarNovoEl.addEventListener('click', () => abrirModal());
    if (btnModalCancelarEl) btnModalCancelarEl.addEventListener('click', fecharModal);
    if (modalPedidoEl) modalPedidoEl.addEventListener('click', e => { if (e.target === modalPedidoEl) fecharModal(); });
    
    const automationsView = document.querySelector('#automations-view');
    if (automationsView) {
        automationsView.addEventListener('change', (e) => {
            if (e.target.classList.contains('automation-toggle')) {
                const card = e.target.closest('.automation-card');
                const messageTextarea = card.querySelector('.automation-message');
                const toggleLabel = card.querySelector('.toggle-label');
                if(messageTextarea && toggleLabel) {
                    const isAtivo = e.target.checked;
                    messageTextarea.disabled = !isAtivo;
                    toggleLabel.textContent = isAtivo ? 'Ativado' : 'Desativado';
                }
            }
        });
        automationsView.addEventListener('input', (e) => {
            if (e.target.classList.contains('automation-message')) {
                highlightVariables(e.target);
            }
        });
        automationsView.addEventListener('scroll', (e) => {
            if (e.target.classList.contains('automation-message')) {
                const backdrop = e.target.previousElementSibling;
                if(backdrop) backdrop.scrollTop = e.target.scrollTop;
            }
        }, true);
    }

    if (btnCopyWebhookEl) {
        btnCopyWebhookEl.addEventListener('click', () => {
            const urlToCopy = webhookUrlDisplayEl ? webhookUrlDisplayEl.textContent : '';
            if (navigator.clipboard && urlToCopy && urlToCopy !== "A carregar...") {
                navigator.clipboard.writeText(urlToCopy)
                    .then(() => showNotification('Link copiado para a área de transferência!', 'success'))
                    .catch(() => showNotification('Falha ao copiar o link.', 'error'));
            }
        });
    }

    if (btnRegenerateWebhookEl) {
        btnRegenerateWebhookEl.addEventListener('click', () => {
            const message = 'Tem a certeza que deseja gerar um novo link? O link antigo deixará de funcionar.';
            showConfirmationModal(message, async () => {
                try {
                    const response = await authFetch('/api/integrations/regenerate', { method: 'POST' });
                    if (!response.ok) throw new Error('Falha ao regenerar o link.');
                    const resultado = await response.json();
                    showNotification(resultado.message, 'success');
                    await loadIntegrationInfo();
                } catch (error) {
                    showNotification(error.message, 'error');
                }
            });
        });
    }

    if (btnSavePostbackSecretEl) {
        btnSavePostbackSecretEl.addEventListener('click', async () => {
            const secretValue = inputPostbackSecretEl ? inputPostbackSecretEl.value.trim() : '';
            try {
                const resp = await authFetch('/api/integrations/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postback_secret: secretValue })
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || 'Falha ao salvar.');
                showNotification(data.message || 'Configurações atualizadas', 'success');
            } catch (err) {
                showNotification(err.message, 'error');
            }
        });
    }

    if (toggleCreateContactEl) {
        toggleCreateContactEl.addEventListener('change', async () => {
            try {
                const resp = await authFetch('/api/settings/contact-creation', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: toggleCreateContactEl.checked })
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || 'Falha ao salvar.');
                if (toggleCreateContactLabelEl) toggleCreateContactLabelEl.textContent = toggleCreateContactEl.checked ? 'Ativado' : 'Desativado';
                showNotification(data.message, 'success');
            } catch (err) {
                showNotification(err.message, 'error');
            }
        });
    }

    if (formPedidoEl) formPedidoEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = formPedidoEl.querySelector('#pedido-id').value;
        const dados = Object.fromEntries(new FormData(e.target).entries());
        const url = id ? `/api/pedidos/${id}` : '/api/pedidos';
        const method = id ? 'PUT' : 'POST';
        delete dados.id;
        try {
            const response = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error || 'Falha ao salvar.');
            fecharModal();
            showNotification(resultado.message, 'success');
            await fetchErenderizarTudo();
            loadSubscriptionStatus();
        } catch (error) { 
            showNotification(error.message, 'error');
        }
    });
    
    if (barraBuscaEl) barraBuscaEl.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchErenderizarTudo, 300);
    });

    if(filterContainerEl) filterContainerEl.addEventListener('click', (e) => {
        const target = e.target.closest('.filter-btn');
        if (!target) return;
        filtroAtivo = target.dataset.filtro;
        filterContainerEl.querySelector('.active').classList.remove('active');
        target.classList.add('active');
        fetchErenderizarTudo();
    });

    if (btnConectarEl) btnConectarEl.addEventListener('click', () => { authFetch('/api/whatsapp/connect', { method: 'POST' }); });
    if (btnDesconectarEl) btnDesconectarEl.addEventListener('click', () => {
        showConfirmationModal('Tem a certeza que deseja desconectar a sessão do WhatsApp?', () => {
            authFetch('/api/whatsapp/disconnect', { method: 'POST' });
        });
    });

    if (plansListEl) plansListEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-plan]');
        if (!btn) return;
        const planId = btn.dataset.plan;
        try {
            const resp = await authFetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Falha ao iniciar pagamento.');
            window.location.href = data.url;
        } catch (err) {
            showNotification(err.message, 'error');
        }
    });

    if (btnUpgradePlansEl) btnUpgradePlansEl.addEventListener('click', () => {
        if(modalUpgradeEl) modalUpgradeEl.classList.remove('active');
        showView('plans-view');
    });
    if(modalUpgradeEl) modalUpgradeEl.addEventListener('click', (e) => { if(e.target === modalUpgradeEl) modalUpgradeEl.classList.remove('active'); });
    
    const settingsView = document.getElementById('settings-view');
    if(settingsView) settingsView.addEventListener('click', (e) => {
        if (e.target.id === 'btn-regenerate-qr') {
            authFetch('/api/whatsapp/connect', { method: 'POST' });
        }
        if (e.target.id === 'btn-delete-account') {
            showConfirmationModal('Você tem certeza? Esta ação é irreversível e todos os seus dados serão apagados permanentemente.', async () => {
                try {
                    const resp = await authFetch('/api/users/me', { method: 'DELETE' });
                    const data = await resp.json();
                    if (!resp.ok) throw new Error(data.error || 'Falha ao excluir conta.');
                    localStorage.removeItem('token');
                    alert('Conta excluída com sucesso.');
                    window.location.href = '/login.html';
                } catch (err) {
                    showNotification(err.message, 'error');
                }
            });
        }
    });
    
    if(mainContentAreaEl) mainContentAreaEl.addEventListener('click', async (e) => {
        const btnEditar = e.target.closest('.btn-editar-main');
        if (btnEditar) {
            const pedido = todosOsPedidos.find(p => p.id === pedidoAtivoId);
            if (pedido) abrirModal(pedido);
        }
        const btnExcluir = e.target.closest('.btn-excluir-main');
        if (btnExcluir) {
            const pedido = todosOsPedidos.find(p => p.id === pedidoAtivoId);
            if (!pedido) return;
            const executarExclusao = async () => {
                try {
                    const resp = await authFetch(`/api/pedidos/${pedido.id}`, { method: 'DELETE' });
                    const resultado = await resp.json();
                    if (!resp.ok) throw new Error(resultado.error || 'Falha ao excluir.');
                    showNotification(resultado.message, 'success');
                    pedidoAtivoId = null;
                    await fetchErenderizarTudo();
                } catch (err) {
                    showNotification(err.message, 'error');
                }
            };
            if (pedido.codigoRastreio) {
                showConfirmationModal('Atenção: Este contato possui um código de rastreio ativo e já está consumindo um uso do seu plano este mês. Ao apagar, ele não poderá mais receber mensagens automáticas, mas o uso não será devolvido. Deseja continuar?', executarExclusao);
            } else {
                executarExclusao();
            }
        }
    });

    if(formEnviarMensagemEl) formEnviarMensagemEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (currentWhatsappStatus !== 'CONNECTED') {
            showNotification('O WhatsApp precisa estar conectado para enviar mensagens.', 'error');
            return;
        }
        const inputMensagem = e.target.querySelector('#input-mensagem');
        const mensagem = inputMensagem.value.trim();
        if (!mensagem || !pedidoAtivoId) return;
        try {
            const response = await authFetch(`/api/pedidos/${pedidoAtivoId}/enviar-mensagem`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem }) });
            if (!response.ok) throw new Error('Falha ao enviar mensagem.');
            inputMensagem.value = '';
            const pedidoAtivo = todosOsPedidos.find(p => p.id === pedidoAtivoId);
            await selecionarPedidoErenderizarDetalhes(pedidoAtivo);
            loadSubscriptionStatus();
        } catch (error) { 
            showNotification(error.message, 'error');
        }
    });

    if (notificacaoCloseBtnEl) {
        notificacaoCloseBtnEl.addEventListener('click', () => {
            clearTimeout(notificacaoTimer);
            if(notificacaoEl) notificacaoEl.classList.remove('show');
        });
    }

    if (logoutBtnEl) {
        logoutBtnEl.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        });
    }

    // --- 7. Inicialização ---
    fetchErenderizarTudo();
    loadSubscriptionStatus();
    connectWebSocket();
    showView('chat-view');
});
