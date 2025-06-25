document.addEventListener('DOMContentLoaded', () => {
const token = localStorage.getItem('token');
if (!token) { window.location.href = '/login.html'; return; }
const authFetch = (url, options = {}) => {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, options).then(resp => {
        if (resp.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
        return resp;
    });
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
    const statusIndicatorEl = document.getElementById('status-whatsapp');
    const qrCodeContainerEl = document.getElementById('qr-code-container');
    const btnConectarEl = document.getElementById('btn-conectar');
    const btnDesconectarEl = document.getElementById('btn-desconectar');
    const statusTextLabelEl = document.getElementById('status-text-label');
    const statusBotInfoEl = document.getElementById('status-bot-info');
    const botAvatarContainerEl = document.getElementById('bot-avatar-container');
    const botAvatarImgEl = document.getElementById('bot-avatar-img');
    const settingsProfileInfoEl = document.getElementById('settings-profile-info');
    const settingsBotAvatarEl = document.getElementById('settings-bot-avatar');
    const settingsBotNameEl = document.getElementById('settings-bot-name');
    const settingsBotNumberEl = document.getElementById('settings-bot-number');
    const settingsConnectionStatusEl = document.getElementById('settings-connection-status');
    const settingsStatusTextEl = document.getElementById('settings-status-text');
    const webhookUrlDisplayEl = document.getElementById('webhook-url-display');
    const btnCopyWebhookEl = document.getElementById('btn-copy-webhook');
    const btnRegenerateWebhookEl = document.getElementById('btn-regenerate-webhook');
    const logoutBtnEl = document.getElementById('logout-btn');
    const modalConfirmacaoEl = document.getElementById('modal-confirmacao');
    const modalConfirmacaoTextoEl = document.getElementById('modal-confirmacao-texto');
    const btnConfirmacaoCancelarEl = document.getElementById('btn-confirmacao-cancelar');
    const btnConfirmacaoConfirmarEl = document.getElementById('btn-confirmacao-confirmar');
    const totalContactsCardEl = document.getElementById('total-contacts-card');
    const messagesSentCardEl = document.getElementById('messages-sent-card');
    const ordersDeliveredCardEl = document.getElementById('orders-delivered-card');
    const newContactsChartCanvas = document.getElementById('new-contacts-chart');
    const statusPieChartCanvas = document.getElementById('status-pie-chart');
    const logsTableBodyEl = document.getElementById('logs-table-body');
    const toggleCreateContactEl = document.getElementById('toggle-create-contact');
    const toggleCreateContactLabelEl = document.getElementById('toggle-create-contact-label');

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
        if (viewId === 'integrations-view') loadIntegrationInfo();
        if (viewId === 'settings-view') loadUserSettings();
        if (viewId === 'reports-view') loadReportData();
        if (viewId === 'logs-view') loadLogs();
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
            .replace(/{{(.*?)}}/g, '<span class="variable-highlight">{{$1}}</span>');
        
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
        if (statusIndicatorEl) {
            statusIndicatorEl.className = 'status-indicator';
            statusIndicatorEl.classList.add(status.toLowerCase());
        }
        if (statusTextLabelEl) statusTextLabelEl.textContent = statusText;
        if (statusBotInfoEl) statusBotInfoEl.textContent = '';
        if (botAvatarContainerEl) botAvatarContainerEl.classList.add('hidden');

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
            if (statusBotInfoEl) statusBotInfoEl.textContent = `${data.botInfo.nome || ''} (${data.botInfo.numero})`;
            if (data.botInfo.fotoUrl && botAvatarImgEl && botAvatarContainerEl) {
                botAvatarImgEl.src = data.botInfo.fotoUrl;
                botAvatarContainerEl.classList.remove('hidden');
            }
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
            const fotoHtml = pedido.fotoPerfilUrl ? `<img src="${pedido.fotoPerfilUrl}" alt="Foto de ${pedido.nome}" onerror="this.parentElement.innerHTML = '<div class=\\'avatar-fallback\\'>${primeiraLetra}</div>';">` : `<div class="avatar-fallback">${primeiraLetra}</div>`;
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
            const fotoHtml = pedido.fotoPerfilUrl 
                ? `<img src="${pedido.fotoPerfilUrl}" alt="Foto de ${pedido.nome}" onerror="this.parentElement.innerHTML = '<div class=\\'avatar-fallback\\'>${primeiraLetra}</div>';">` 
                : `<div class="avatar-fallback">${primeiraLetra}</div>`;
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
        const btnAtualizarFotoHtml = `<button class="btn-atualizar-foto" data-id="${pedido.id}" title="Atualizar Foto de Perfil"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.5a.5.5 0 0 1 0-1h1.417a.5.5 0 0 1 .5.5v1.417a.5.5 0 0 1-1 0V8a5.002 5.002 0 0 0-9.19-2.734.5.5 0 0 1-.82-.57A6.002 6.002 0 0 1 8 3z"/></svg> Atualizar Foto</button>`;
        chatWindowEl.innerHTML = `<div class="detalhes-header"><h3>${pedido.nome} (#${pedido.id})</h3><div>${btnAtualizarFotoHtml}<button class="btn-editar-main">Editar</button></div></div><div class="detalhes-body"><p><strong>Telefone:</strong> ${pedido.telefone}</p><p><strong>Produto:</strong> ${pedido.produto || 'N/A'}</p><p><strong>Rastreio:</strong> ${pedido.codigoRastreio || 'Nenhum'}</p></div><div class="chat-feed" id="chat-feed"><p class="info-mensagem">A carregar histórico...</p></div>`;
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
                        msgDiv.className = `chat-message ${msg.origem === 'cliente' ? 'recebido' : 'enviado'}`;
                        const dataUtc = new Date(msg.data_envio.includes('Z') ? msg.data_envio : msg.data_envio.replace(' ', 'T') + 'Z');
                        const dataFormatada = dataUtc.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
                        msgDiv.innerHTML = `<p>${msg.mensagem.replace(/\n/g, '<br>')}</p><span class="timestamp">${dataFormatada}</span>`;
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
        statusChart = new Chart(statusPieChartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Status dos Pedidos',
                    data: counts,
                    backgroundColor: ['rgba(249, 115, 22, 0.7)', 'rgba(22, 163, 74, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(107, 114, 128, 0.7)', 'rgba(245, 158, 11, 0.7)'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
    }

    async function loadReportData() {
        try {
            const response = await authFetch('/api/reports/summary');
            if (!response.ok) throw new Error('Falha ao carregar dados do relatório.');
            const data = await response.json();
            if(totalContactsCardEl) totalContactsCardEl.textContent = data.totalContacts;
            if(messagesSentCardEl) messagesSentCardEl.textContent = data.messagesSent;
            if(ordersDeliveredCardEl) ordersDeliveredCardEl.textContent = data.ordersDelivered;
            createContactsChart(data.newContactsLast7Days);
            createStatusChart(data.statusDistribution);
        } catch (error) {
            console.error("Erro ao carregar dados do relatório:", error);
            showNotification(error.message, 'error');
        }
    }

    async function loadLogs() {
        if (!logsTableBodyEl) return;
        logsTableBodyEl.innerHTML = '<tr><td colspan="3">A carregar...</td></tr>';
        try {
            const resp = await authFetch('/api/logs');
            if (!resp.ok) throw new Error('Falha ao carregar logs.');
            const { data } = await resp.json();
            logsTableBodyEl.innerHTML = '';
            if (!data || data.length === 0) {
                logsTableBodyEl.innerHTML = '<tr><td colspan="3">Sem registros.</td></tr>';
                return;
            }
            data.forEach(log => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${new Date(log.data_criacao).toLocaleString()}</td><td>${log.acao}</td><td>${log.detalhe || ''}</td>`;
                logsTableBodyEl.appendChild(tr);
            });
        } catch (err) {
            console.error('Erro ao carregar logs:', err);
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
    
    const settingsView = document.getElementById('settings-view');
    if(settingsView) settingsView.addEventListener('click', (e) => {
        if (e.target.id === 'btn-regenerate-qr') {
            authFetch('/api/whatsapp/connect', { method: 'POST' });
        }
    });
    
    if(mainContentAreaEl) mainContentAreaEl.addEventListener('click', async (e) => {
        const btnEditar = e.target.closest('.btn-editar-main');
        if (btnEditar) {
            const pedido = todosOsPedidos.find(p => p.id === pedidoAtivoId);
            if (pedido) abrirModal(pedido);
        }
        const btnAtualizar = e.target.closest('.btn-atualizar-foto');
        if (btnAtualizar) {
            btnAtualizar.innerHTML = '🔄';
            btnAtualizar.disabled = true;
            try {
                const pedidoId = btnAtualizar.dataset.id;
                const response = await authFetch(`/api/pedidos/${pedidoId}/atualizar-foto`, { method: 'POST' });
                const resultado = await response.json();
                if (!response.ok) throw new Error(resultado.error || 'Falha ao buscar foto.');
                showNotification(resultado.message, 'success');
                await fetchErenderizarTudo();
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                // A lógica para restaurar o botão será mais complexa se o botão original for um svg
                // Por agora, vamos manter simples.
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
    connectWebSocket();
    showView('chat-view');
});
