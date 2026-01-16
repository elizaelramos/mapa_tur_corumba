-- Corrigir todos os triggers de auditoria para usar o nome correto da tabela (audit_log em minúsculo)

-- ========== TRIGGERS PARA PROD_UNIDADE_SAUDE ==========
DROP TRIGGER IF EXISTS audit_unidade_insert;
DROP TRIGGER IF EXISTS audit_unidade_update;
DROP TRIGGER IF EXISTS audit_unidade_delete;

DELIMITER $$
CREATE TRIGGER audit_unidade_insert
AFTER INSERT ON prod_unidade_saude
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (tabela, operacao, registro_id, valor_novo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'INSERT',
        NEW.id,
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$

CREATE TRIGGER audit_unidade_update
AFTER UPDATE ON prod_unidade_saude
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (tabela, operacao, registro_id, valor_antigo, valor_novo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'ativo', OLD.ativo
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$

CREATE TRIGGER audit_unidade_delete
AFTER DELETE ON prod_unidade_saude
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (tabela, operacao, registro_id, valor_antigo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'ativo', OLD.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- ========== TRIGGERS PARA PROD_MEDICO ==========
DROP TRIGGER IF EXISTS audit_medico_insert;
DROP TRIGGER IF EXISTS audit_medico_update;
DROP TRIGGER IF EXISTS audit_medico_delete;

DELIMITER $$
CREATE TRIGGER audit_medico_insert
AFTER INSERT ON prod_medico
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (tabela, operacao, registro_id, valor_novo, timestamp)
    VALUES (
        'PROD_Medico',
        'INSERT',
        NEW.id,
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$

CREATE TRIGGER audit_medico_update
AFTER UPDATE ON prod_medico
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (tabela, operacao, registro_id, valor_antigo, valor_novo, timestamp)
    VALUES (
        'PROD_Medico',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'ativo', OLD.ativo
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$

CREATE TRIGGER audit_medico_delete
AFTER DELETE ON prod_medico
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (tabela, operacao, registro_id, valor_antigo, timestamp)
    VALUES (
        'PROD_Medico',
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'ativo', OLD.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;
