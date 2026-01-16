-- ============================================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- Estes triggers devem ser executados manualmente após as migrations
-- ============================================================================

-- Trigger para sincronizar mudanças da staging para produção
DELIMITER $$
CREATE TRIGGER sync_staging_to_prod
AFTER UPDATE ON STAGING_Info_Origem
FOR EACH ROW
BEGIN
    -- Só sincronizar se o registro já foi processado para produção (tem id_prod_link)
    -- e se algum campo relevante foi alterado
    IF (OLD.id_prod_link IS NOT NULL AND 
        (OLD.nome_familiar != NEW.nome_familiar OR
         OLD.endereco_manual != NEW.endereco_manual OR
         OLD.latitude_manual != NEW.latitude_manual OR
         OLD.longitude_manual != NEW.longitude_manual OR
         OLD.imagem_url != NEW.imagem_url OR
         OLD.icone_url != NEW.icone_url OR
         OLD.telefone != NEW.telefone OR
         OLD.horario_atendimento != NEW.horario_atendimento OR
         OLD.observacoes != NEW.observacoes)) THEN
        
        -- Atualizar o registro de produção correspondente
        UPDATE PROD_Unidade_Saude 
        SET 
            nome = COALESCE(NEW.nome_familiar, NEW.nome_unidade_bruto, 'Nome não informado'),
            endereco = NEW.endereco_manual,
            latitude = NEW.latitude_manual,
            longitude = NEW.longitude_manual,
            telefone = NEW.telefone,
            horario_atendimento = NEW.horario_atendimento,
            imagem_url = NEW.imagem_url,
            icone_url = NEW.icone_url,
            updated_at = NOW()
        WHERE id = OLD.id_prod_link;
        
        -- Log da sincronização
        INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, correlation_id, timestamp)
        VALUES (
            'PROD_Unidade_Saude',
            'UPDATE',
            OLD.id_prod_link,
            JSON_OBJECT(
                'sync_trigger', 'staging_update',
                'staging_id', NEW.id,
                'updated_fields', JSON_ARRAY(
                    CASE WHEN OLD.nome_familiar != NEW.nome_familiar THEN 'nome' END,
                    CASE WHEN OLD.endereco_manual != NEW.endereco_manual THEN 'endereco' END,
                    CASE WHEN OLD.latitude_manual != NEW.latitude_manual THEN 'latitude' END,
                    CASE WHEN OLD.longitude_manual != NEW.longitude_manual THEN 'longitude' END,
                    CASE WHEN OLD.imagem_url != NEW.imagem_url THEN 'imagem_url' END,
                    CASE WHEN OLD.icone_url != NEW.icone_url THEN 'icone_url' END,
                    CASE WHEN OLD.telefone != NEW.telefone THEN 'telefone' END,
                    CASE WHEN OLD.horario_atendimento != NEW.horario_atendimento THEN 'horario_atendimento' END,
                    CASE WHEN OLD.observacoes != NEW.observacoes THEN 'observacoes' END
                )
            ),
            JSON_OBJECT(
                'nome', COALESCE(NEW.nome_familiar, NEW.nome_unidade_bruto, 'Nome não informado'),
                'endereco', NEW.endereco_manual,
                'latitude', NEW.latitude_manual,
                'longitude', NEW.longitude_manual,
                'telefone', NEW.telefone,
                'horario_atendimento', NEW.horario_atendimento,
                'imagem_url', NEW.imagem_url,
                'icone_url', NEW.icone_url
            ),
            CONCAT('staging_sync_', NEW.id),
            NOW()
        );
    END IF;
END$$
DELIMITER ;

-- Trigger para PROD_Unidade_Saude - INSERT
DELIMITER $$
CREATE TRIGGER audit_unidade_insert
AFTER INSERT ON PROD_Unidade_Saude
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'INSERT',
        NEW.id,
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'endereco', NEW.endereco,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'id_origem', NEW.id_origem,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Unidade_Saude - UPDATE
DELIMITER $$
CREATE TRIGGER audit_unidade_update
AFTER UPDATE ON PROD_Unidade_Saude
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'endereco', OLD.endereco,
            'latitude', OLD.latitude,
            'longitude', OLD.longitude,
            'id_origem', OLD.id_origem,
            'ativo', OLD.ativo
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'endereco', NEW.endereco,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'id_origem', NEW.id_origem,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Unidade_Saude - DELETE
DELIMITER $$
CREATE TRIGGER audit_unidade_delete
AFTER DELETE ON PROD_Unidade_Saude
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, timestamp)
    VALUES (
        'PROD_Unidade_Saude',
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'endereco', OLD.endereco,
            'latitude', OLD.latitude,
            'longitude', OLD.longitude,
            'id_origem', OLD.id_origem,
            'ativo', OLD.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Medico - INSERT
DELIMITER $$
CREATE TRIGGER audit_medico_insert
AFTER INSERT ON PROD_Medico
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, timestamp)
    VALUES (
        'PROD_Medico',
        'INSERT',
        NEW.id,
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'id_origem', NEW.id_origem,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Medico - UPDATE
DELIMITER $$
CREATE TRIGGER audit_medico_update
AFTER UPDATE ON PROD_Medico
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, timestamp)
    VALUES (
        'PROD_Medico',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'id_origem', OLD.id_origem,
            'ativo', OLD.ativo
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'nome', NEW.nome,
            'id_origem', NEW.id_origem,
            'ativo', NEW.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Medico - DELETE
DELIMITER $$
CREATE TRIGGER audit_medico_delete
AFTER DELETE ON PROD_Medico
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, timestamp)
    VALUES (
        'PROD_Medico',
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'nome', OLD.nome,
            'id_origem', OLD.id_origem,
            'ativo', OLD.ativo
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger para PROD_Especialidade - INSERT
DELIMITER $$
CREATE TRIGGER audit_especialidade_insert
AFTER INSERT ON PROD_Especialidade
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_novo, timestamp)
    VALUES (
        'PROD_Especialidade',
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
DELIMITER ;

-- Trigger para PROD_Especialidade - UPDATE
DELIMITER $$
CREATE TRIGGER audit_especialidade_update
AFTER UPDATE ON PROD_Especialidade
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, valor_novo, timestamp)
    VALUES (
        'PROD_Especialidade',
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
DELIMITER ;

-- Trigger para PROD_Especialidade - DELETE
DELIMITER $$
CREATE TRIGGER audit_especialidade_delete
AFTER DELETE ON PROD_Especialidade
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (tabela, operacao, registro_id, valor_antigo, timestamp)
    VALUES (
        'PROD_Especialidade',
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
