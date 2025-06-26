// src/controllers/pedidosController.js
const pedidoService = require('../services/pedidoService');
const whatsappService = require('../services/whatsappService');
const logService = require('../services/logService');
const subscriptionService = require('../services/subscriptionService');
const envioController = require('./envioController');

// LÊ todos os pedidos
exports.listarPedidos = (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    const { busca, filtroStatus } = req.query;

    let params = [clienteId];
    let conditions = ["cliente_id = ?"];

    if (busca) {
        conditions.push("(nome LIKE ? OR telefone LIKE ?)");
        params.push(`%${busca}%`, `%${busca}%`);
    }

    if (filtroStatus) {
        if (filtroStatus === 'caminho') {
            conditions.push("statusInterno IS NOT NULL AND statusInterno != 'entregue'");
        } else if (filtroStatus === 'entregue') {
            conditions.push("statusInterno = ?");
            params.push('entregue');
        }
    }

    let sql = "SELECT * FROM pedidos";
    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY dataUltimaMensagem DESC, id DESC";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
};

// Normalizador de telefone
function normalizeTelefone(telefoneRaw) {
    if (!telefoneRaw) return null;
    let digitos = String(telefoneRaw).replace(/\D/g, '');
    if (digitos.startsWith('55')) {
        digitos = digitos.substring(2);
    }
    if (digitos.length < 10 || digitos.length > 11) {
        return null;
    }
    const ddd = digitos.substring(0, 2);
    let numero = digitos.substring(2);
    if (numero.length === 8 && ['6', '7', '8', '9'].includes(numero[0])) {
        numero = '9' + numero;
    }
    if (numero.length !== 9) {
        return null;
    }
    return `55${ddd}${numero}`;
}

// CRIA um novo pedido
exports.criarPedido = async (req, res) => {
    const db = req.db;
    const client = req.venomClient;
    const clienteId = req.user.id;
    const { nome, telefone, produto, codigoRastreio } = req.body;
    const telefoneNormalizado = normalizeTelefone(telefone);

    if (!telefoneNormalizado || !nome) {
        return res.status(400).json({ error: "Nome e um número de celular válido são obrigatórios." });
    }
    
    try {
        const pedidoExistente = await pedidoService.findPedidoByTelefone(db, telefoneNormalizado, clienteId);
        if (pedidoExistente) {
            return res.status(409).json({ error: `Este número (${telefoneNormalizado}) já está cadastrado.` });
        }
        
        const pedidoCriado = await pedidoService.criarPedido(db, { ...req.body, telefone: telefoneNormalizado }, client, clienteId);
        pedidoCriado.cliente_id = clienteId;

        if (codigoRastreio) {
            await subscriptionService.incrementUsage(db, req.subscription.id);
        }

        // Envia boas-vindas imediatamente
        await envioController.enviarMensagemBoasVindas(db, pedidoCriado, req.broadcast);

        // Notifica o frontend
        req.broadcast({ type: 'novo_contato', pedido: pedidoCriado });

        await logService.addLog(db, clienteId, 'pedido_criado', JSON.stringify({ pedidoId: pedidoCriado.id }));


        res.status(201).json({
            message: "Pedido criado com sucesso!",
            data: pedidoCriado
        });
    } catch (error) {
        console.error("Erro ao criar pedido:", error.message);
        res.status(500).json({ error: "Erro interno no servidor ao criar pedido." });
    }
};

// ATUALIZA um pedido
exports.atualizarPedido = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    const { id } = req.params;
    const dados = req.body;

    if (dados.telefone) {
        dados.telefone = normalizeTelefone(dados.telefone);
        if (!dados.telefone) {
            return res.status(400).json({ error: "O número de telefone para atualização é inválido." });
        }
    }

    try {
        const pedidoAnterior = await pedidoService.getPedidoById(db, id, clienteId);
        if (!pedidoAnterior) return res.status(404).json({ error: `Pedido com ID ${id} não encontrado.` });
        const result = await pedidoService.updateCamposPedido(db, id, dados, clienteId);
        if (result.changes === 0) return res.status(404).json({ error: `Pedido com ID ${id} não encontrado.` });

        if ((!pedidoAnterior.codigoRastreio || pedidoAnterior.codigoRastreio === '') && dados.codigoRastreio) {
            await subscriptionService.incrementUsage(db, req.subscription.id);
        }
        
        // Notifica o frontend
        req.broadcast({ type: 'pedido_atualizado', pedidoId: id });

        res.json({ message: `Pedido com ID ${id} atualizado com sucesso.` });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

// APAGA um pedido e seu histórico
exports.deletarPedido = (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    const { id } = req.params;
    db.serialize(() => {
        db.run('DELETE FROM historico_mensagens WHERE pedido_id = ? AND cliente_id = ?', [id, clienteId]);
        db.run('DELETE FROM pedidos WHERE id = ? AND cliente_id = ?', [id, clienteId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: `Pedido com ID ${id} não encontrado.` });

            // Notifica o frontend
            req.broadcast({ type: 'pedido_deletado', pedidoId: id });

            res.json({ message: `Pedido com ID ${id} deletado com sucesso.` });
        });
    });
};

// BUSCA O HISTÓRICO de mensagens
exports.getHistoricoDoPedido = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    const { id } = req.params;
    try {
        const historico = await pedidoService.getHistoricoPorPedidoId(db, id, clienteId);
        res.json({ data: historico });
    } catch (error) {
        res.status(500).json({ error: "Falha ao buscar o histórico do pedido." });
    }
};

// ENVIA uma mensagem manualmente
exports.enviarMensagemManual = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    const { id } = req.params;
    const { mensagem } = req.body;
    const broadcast = req.broadcast; // Pega a função de broadcast

    if (!mensagem) {
        return res.status(400).json({ error: "O campo 'mensagem' é obrigatório." });
    }

    try {
        const pedido = await pedidoService.getPedidoById(db, id, clienteId);
        if (!pedido) return res.status(404).json({ error: "Pedido não encontrado." });

        await whatsappService.enviarMensagem(pedido.telefone, mensagem);
        await pedidoService.addMensagemHistorico(db, id, mensagem, 'manual', 'bot', clienteId);

        await logService.addLog(db, clienteId, 'mensagem_manual', JSON.stringify({ pedidoId: id }));
        
        // MUDANÇA: Notifica todos os painéis abertos sobre a nova mensagem
        broadcast({ type: 'nova_mensagem', pedidoId: parseInt(id) });

        res.status(200).json({ message: "Mensagem enviada com sucesso!" });
    } catch (error) {
        console.error("Erro no envio manual:", error);
        res.status(500).json({ error: "Falha ao enviar a mensagem." });
    }
};


// ATUALIZA a foto de perfil
exports.atualizarFotoDoPedido = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    const { id } = req.params;
    const client = req.venomClient;

    if (!client) {
        return res.status(500).json({ error: "Cliente WhatsApp não está conectado." });
    }

    try {
        const pedido = await pedidoService.getPedidoById(db, id, clienteId);
        if (!pedido) {
            return res.status(404).json({ error: "Pedido não encontrado." });
        }

        const fotoUrl = await whatsappService.getProfilePicUrl(pedido.telefone);
        
        if (fotoUrl) {
            await pedidoService.updateCamposPedido(db, id, { fotoPerfilUrl: fotoUrl }, clienteId);
            req.broadcast({ type: 'pedido_atualizado', pedidoId: id });
            res.status(200).json({ message: "Foto de perfil atualizada com sucesso!", data: { fotoUrl } });
        } else {
             res.status(200).json({ message: "Nenhuma foto de perfil foi encontrada para este contato.", data: { fotoUrl: null } });
        }

    } catch (error) {
        console.error("Erro ao tentar atualizar a foto do pedido:", error);
        res.status(500).json({ error: "Falha ao buscar ou atualizar a foto de perfil." });
    }
};

// MARCA mensagens como lidas
exports.marcarComoLido = async (req, res) => {
    const db = req.db;
    const clienteId = req.user.id;
    const { id } = req.params;
    try {
        await pedidoService.marcarComoLido(db, id, clienteId);
        req.broadcast({ type: 'pedido_atualizado', pedidoId: id });
        res.status(200).json({ message: "Mensagens marcadas como lidas." });
    } catch (error) {
        res.status(500).json({ error: "Falha ao marcar como lido." });
    }
};

