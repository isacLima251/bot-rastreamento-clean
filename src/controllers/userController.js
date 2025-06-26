const userService = require('../services/userService');

exports.deleteMe = async (req, res) => {
    const db = req.db;
    const userId = req.user.id;
    try {
        await userService.deleteUserCascade(db, userId);
        res.json({ message: 'Conta excluída com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir conta:', err);
        res.status(500).json({ error: 'Falha ao excluir conta.' });
    }
};
