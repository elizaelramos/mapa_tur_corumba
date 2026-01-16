-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: 172.16.0.117    Database: sis_reme_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tabela` varchar(100) NOT NULL,
  `operacao` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `registro_id` int(11) NOT NULL,
  `valor_antigo` text DEFAULT NULL,
  `valor_novo` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `correlation_id` varchar(100) DEFAULT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `audit_log_tabela_idx` (`tabela`),
  KEY `audit_log_operacao_idx` (`operacao`),
  KEY `audit_log_user_id_idx` (`user_id`),
  KEY `audit_log_timestamp_idx` (`timestamp`),
  KEY `audit_log_correlation_id_idx` (`correlation_id`),
  CONSTRAINT `audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `junction_escola_oferta_ensino`
--

DROP TABLE IF EXISTS `junction_escola_oferta_ensino`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `junction_escola_oferta_ensino` (
  `id_escola` int(11) NOT NULL,
  `id_oferta_ensino` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id_escola`,`id_oferta_ensino`),
  KEY `junction_escola_oferta_ensino_id_escola_idx` (`id_escola`),
  KEY `junction_escola_oferta_ensino_id_oferta_ensino_idx` (`id_oferta_ensino`),
  CONSTRAINT `junction_escola_oferta_ensino_id_escola_fkey` FOREIGN KEY (`id_escola`) REFERENCES `prod_escola` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `junction_escola_oferta_ensino_id_oferta_ensino_fkey` FOREIGN KEY (`id_oferta_ensino`) REFERENCES `prod_oferta_ensino` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `junction_escola_oferta_ensino`
--

LOCK TABLES `junction_escola_oferta_ensino` WRITE;
/*!40000 ALTER TABLE `junction_escola_oferta_ensino` DISABLE KEYS */;
INSERT INTO `junction_escola_oferta_ensino` VALUES (1,7,'2026-01-13 12:02:01.517'),(2,1,'2026-01-12 17:13:26.995'),(2,7,'2026-01-12 17:13:26.995'),(3,1,'2026-01-12 17:14:49.151'),(3,7,'2026-01-12 17:14:49.151'),(4,1,'2026-01-13 16:50:46.231'),(4,7,'2026-01-13 16:50:46.231'),(5,1,'2026-01-12 17:17:14.713'),(6,1,'2026-01-12 17:20:12.149'),(6,7,'2026-01-12 17:20:12.149'),(7,1,'2026-01-12 17:19:23.756'),(7,7,'2026-01-12 17:19:23.756'),(8,1,'2026-01-12 17:20:42.053'),(8,7,'2026-01-12 17:20:42.053'),(9,2,'2026-01-16 11:35:26.121'),(9,3,'2026-01-16 11:35:26.121'),(10,2,'2026-01-16 11:36:05.888'),(10,3,'2026-01-16 11:36:05.888'),(10,5,'2026-01-16 11:36:05.888'),(10,7,'2026-01-16 11:36:05.888'),(11,2,'2026-01-16 11:51:53.692'),(11,3,'2026-01-16 11:51:53.692'),(12,2,'2026-01-12 17:28:23.543'),(12,3,'2026-01-12 17:28:23.543'),(13,1,'2026-01-12 17:29:12.077'),(13,2,'2026-01-12 17:29:12.077'),(13,3,'2026-01-12 17:29:12.077'),(13,7,'2026-01-12 17:29:12.077'),(14,2,'2026-01-12 17:30:03.768'),(14,3,'2026-01-12 17:30:03.768'),(14,7,'2026-01-12 17:30:03.768'),(15,1,'2026-01-12 17:31:19.671'),(15,2,'2026-01-12 17:31:19.671'),(15,7,'2026-01-12 17:31:19.671'),(16,2,'2026-01-12 17:32:46.273'),(16,3,'2026-01-12 17:32:46.273'),(16,7,'2026-01-12 17:32:46.273'),(17,2,'2026-01-16 11:39:40.575'),(17,3,'2026-01-16 11:39:40.575'),(17,5,'2026-01-16 11:39:40.575'),(17,7,'2026-01-16 11:39:40.575'),(18,1,'2026-01-16 11:40:29.021'),(18,2,'2026-01-16 11:40:29.021'),(18,3,'2026-01-16 11:40:29.021'),(18,5,'2026-01-16 11:40:29.021'),(18,7,'2026-01-16 11:40:29.021'),(19,2,'2026-01-12 17:48:29.778'),(19,3,'2026-01-12 17:48:29.778'),(19,5,'2026-01-12 17:48:29.778'),(19,7,'2026-01-12 17:48:29.778'),(21,2,'2026-01-13 16:45:31.618'),(21,3,'2026-01-13 16:45:31.618'),(21,5,'2026-01-13 16:45:31.618'),(21,7,'2026-01-13 16:45:31.618'),(22,1,'2026-01-12 17:39:54.877'),(22,2,'2026-01-12 17:39:54.877'),(22,3,'2026-01-12 17:39:54.877'),(22,7,'2026-01-12 17:39:54.877'),(23,2,'2026-01-12 17:44:01.477'),(23,3,'2026-01-12 17:44:01.477'),(23,7,'2026-01-12 17:44:01.477'),(24,2,'2026-01-13 11:33:27.538'),(25,2,'2026-01-12 17:47:39.138'),(25,3,'2026-01-12 17:47:39.138'),(26,2,'2026-01-15 11:40:02.070'),(26,3,'2026-01-15 11:40:02.070'),(26,7,'2026-01-15 11:40:02.070'),(27,2,'2026-01-13 11:31:49.410'),(27,3,'2026-01-13 11:31:49.410'),(27,7,'2026-01-13 11:31:49.410'),(29,2,'2026-01-13 16:52:27.211'),(29,3,'2026-01-13 16:52:27.211'),(29,7,'2026-01-13 16:52:27.211'),(30,1,'2026-01-13 11:30:11.048'),(30,2,'2026-01-13 11:30:11.048'),(30,3,'2026-01-13 11:30:11.048'),(30,7,'2026-01-13 11:30:11.048'),(37,1,'2026-01-12 17:14:07.885'),(37,7,'2026-01-12 17:14:07.885'),(38,1,'2026-01-12 17:15:26.080'),(38,7,'2026-01-12 17:15:26.080'),(39,2,'2026-01-12 17:18:12.786'),(39,3,'2026-01-12 17:18:12.786'),(40,1,'2026-01-12 17:22:05.158'),(40,2,'2026-01-12 17:22:05.158'),(40,3,'2026-01-12 17:22:05.158'),(40,7,'2026-01-12 17:22:05.158');
/*!40000 ALTER TABLE `junction_escola_oferta_ensino` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `junction_escola_professor`
--

DROP TABLE IF EXISTS `junction_escola_professor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `junction_escola_professor` (
  `id_escola` int(11) NOT NULL,
  `id_professor` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id_escola`,`id_professor`),
  KEY `junction_escola_professor_id_escola_idx` (`id_escola`),
  KEY `junction_escola_professor_id_professor_idx` (`id_professor`),
  CONSTRAINT `junction_escola_professor_id_escola_fkey` FOREIGN KEY (`id_escola`) REFERENCES `prod_escola` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `junction_escola_professor_id_professor_fkey` FOREIGN KEY (`id_professor`) REFERENCES `prod_professor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `junction_escola_professor`
--

LOCK TABLES `junction_escola_professor` WRITE;
/*!40000 ALTER TABLE `junction_escola_professor` DISABLE KEYS */;
INSERT INTO `junction_escola_professor` VALUES (9,12,'2026-01-16 11:35:26.001'),(10,13,'2026-01-16 11:36:05.682'),(11,14,'2026-01-16 11:51:53.546'),(12,2,'2026-01-12 17:28:23.368'),(13,5,'2026-01-12 17:29:11.954'),(17,15,'2026-01-16 11:39:40.480'),(18,16,'2026-01-16 11:40:28.766'),(21,7,'2026-01-13 16:45:31.463'),(22,4,'2026-01-12 17:39:54.753'),(31,17,'2026-01-16 11:48:31.528'),(37,2,'2026-01-12 17:14:07.760'),(38,1,'2026-01-12 17:15:25.970'),(40,4,'2026-01-12 17:22:05.037'),(41,10,'2026-01-15 14:56:49.187'),(41,11,'2026-01-15 14:56:49.187');
/*!40000 ALTER TABLE `junction_escola_professor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prod_bairro`
--

DROP TABLE IF EXISTS `prod_bairro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prod_bairro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prod_bairro_nome_key` (`nome`),
  KEY `prod_bairro_nome_idx` (`nome`),
  KEY `prod_bairro_ativo_idx` (`ativo`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prod_bairro`
--

LOCK TABLES `prod_bairro` WRITE;
/*!40000 ALTER TABLE `prod_bairro` DISABLE KEYS */;
INSERT INTO `prod_bairro` VALUES (1,'Aeroporto',1,'2025-12-16 18:16:08.137','2026-01-05 16:32:30.541'),(2,'Assentamento',1,'2025-12-16 18:16:08.212','2026-01-05 16:32:30.941'),(3,'Centro',1,'2025-12-16 18:16:08.493','2026-01-05 16:32:30.994'),(4,'Centro América',1,'2025-12-16 18:16:08.567','2026-01-05 16:32:31.126'),(5,'Conjunto Guana I',1,'2025-12-16 18:16:08.635','2026-01-05 16:32:31.170'),(6,'Cravo Vermelho III',1,'2025-12-16 18:16:08.707','2026-01-05 16:32:31.217'),(7,'Cristo Redentor',1,'2025-12-16 18:16:08.778','2026-01-05 16:32:31.263'),(8,'Distrito de Albuquerque',1,'2025-12-16 18:16:08.850','2026-01-05 16:32:31.309'),(9,'Distrito de Forte Coimbra',1,'2025-12-16 18:16:08.944','2026-01-05 16:32:31.409'),(10,'Dom Bosco',1,'2025-12-16 18:16:09.015','2026-01-05 16:32:31.467'),(11,'Generoso',1,'2025-12-16 18:16:09.087','2026-01-05 16:32:31.528'),(12,'Guatós',1,'2025-12-16 18:16:09.158','2026-01-05 16:32:31.588'),(13,'Jardim dos Estados',1,'2025-12-16 18:16:09.231','2026-01-05 16:32:31.648'),(14,'Maria Leite',1,'2025-12-16 18:16:09.301','2026-01-05 16:32:31.843'),(15,'Nova Corumba',1,'2025-12-16 18:16:09.372','2026-01-05 16:32:31.893'),(16,'Popular Nova',1,'2025-12-16 18:16:09.444','2026-01-05 16:32:31.952'),(17,'Universitário',1,'2025-12-16 18:16:09.516','2026-01-05 16:32:32.038'),(18,'Zona Rural',1,'2025-12-16 18:16:09.587','2026-01-05 16:32:32.097');
/*!40000 ALTER TABLE `prod_bairro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prod_escola`
--

DROP TABLE IF EXISTS `prod_escola`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prod_escola` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `endereco` varchar(500) DEFAULT NULL,
  `id_bairro` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `telefone` varchar(100) DEFAULT NULL,
  `whatsapp` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `diretor_responsavel` varchar(255) DEFAULT NULL,
  `horario_funcionamento` text DEFAULT NULL,
  `imagem_url` varchar(500) DEFAULT NULL,
  `icone_url` varchar(500) DEFAULT NULL,
  `laboratorio_informatica` tinyint(1) NOT NULL DEFAULT 0,
  `laboratorio_info` text DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `prod_escola_ativo_idx` (`ativo`),
  KEY `prod_escola_latitude_longitude_idx` (`latitude`,`longitude`),
  KEY `prod_escola_laboratorio_informatica_idx` (`laboratorio_informatica`),
  KEY `prod_escola_id_bairro_idx` (`id_bairro`),
  CONSTRAINT `prod_escola_id_bairro_fkey` FOREIGN KEY (`id_bairro`) REFERENCES `prod_bairro` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prod_escola`
--

LOCK TABLES `prod_escola` WRITE;
/*!40000 ALTER TABLE `prod_escola` DISABLE KEYS */;
INSERT INTO `prod_escola` VALUES (1,'CEMEI Estrelinha Verde','Avenida Porto Carreiro, 1230',3,-19.01096716,-57.65144348,'(67) 3232-3955 / (67) 3907-5000','(67) 98191-0164','estrelinhaverde@corumba.ms.gov.br','Marelisa Rodrigues Vilarga Paes',NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-16 17:25:44.388','2026-01-14 13:32:46.650'),(2,'CEMEI Parteira Ana Gonçalves do Nascimento','Rua Antônio Maria Coelho, S/n',7,-19.02678239,-57.64191259,'(67) 3907-5092 / (67) 9853-2906','(67) 98191-0138','anagoncalves@corumba.ms.gov.br','Vanessa Rodrigues Nepomuceno Vidal dos Santos','Período de funcionamento: Integral e Regular','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-16 17:25:44.467','2026-01-14 13:32:46.416'),(3,'CEMEI Parteira Inocência Cambara','Rua São Judas Tadeu, S/n',14,-19.00982256,-57.63060933,'(67) 3907-5091 / (67) 3232-1559','(67) 98191-0126','inocenciacambara@corumba.ms.gov.br','Valeria Aparecida Benites de Oliveira Cabral ','Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-16 17:25:44.670','2026-01-14 13:32:46.236'),(4,'CEMEI Parteira Maria Benvinda Rabello','Rua José Fragelli, 3420',13,-19.03305515,-57.65702503,'(67) 3907-5005','(67) 98191-0100','mariabenvinda@corumba.ms.gov.br','Elizabeth Aquino de Oliveira','Integral e Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-16 17:25:44.741','2026-01-14 13:32:45.865'),(5,'CEMEI Parteira Rosa Josetti','Avenida Perimetral, S/n',11,-19.00028556,-57.66617954,'(67) 3907-5003','(67) 98191-0231','rosajosetti@corumba.ms.gov.br','Solange Rangel Oliveira','Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-16 17:25:44.813','2026-01-14 13:32:46.883'),(6,'CEMEI Prof.ª Hélia da Costa Reis','Rua Marechal Deodoro, 87',15,-19.04220245,-57.65489817,'(67) 3907-5343','(67) 98191-0169','cei.heliacostareis@corumba.ms.gov.br','Janil Gonzaga da Rosa e Souza','Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-16 17:25:44.873','2026-01-14 13:32:46.697'),(7,'CEMEI Prof.ª Eunice Ajala Rocha','Rua Parana, - - Lote 52',7,-19.02196758,-57.63447583,'(67) 3907-5424 / (67) 99939-3175','(67) 98191-0196','cei.euniceajala@corumba.ms.gov.br','Melina Carvalho de Souza','(67) 3907-5424','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-16 17:25:44.967','2026-01-14 13:32:46.794'),(8,'CEMEI Prof.ª Miriam Mendes','Rua Major Gama, S/n',12,-19.04971731,-57.64032841,'(67) 3907-5949 / (67) -',NULL,'miriam.mendes@corumba.ms.gov.br','Mariana Gomes Duarte','Regular (Matutino e vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-16 17:25:45.038','2026-01-12 17:20:41.638'),(9,'EM Almirante Tamandaré','Rua Sete de Setembro, S/n - Esq com Anel Viário',6,-19.07250842,-57.61955738,'(67) 3907-5360 / (67) 99686-1320','(67) 98191-0049','almirante@corumba.ms.gov.br','Nevilson da Silva Cruz','Horário Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.110','2026-01-16 11:35:25.428'),(10,'EM Ângela Maria Perez','Rua Para, 00 - S/n',13,-19.03370664,-57.65496613,'(67) 3907-5362 / (67) 9905-4415','(67) 98191-0106','angela@corumba.ms.gov.br','Cilene Maria Moraes Gonçalves','Regular (Matutino, Vespertino e Noturno)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.182','2026-01-16 11:36:05.222'),(11,'EM Barão do Rio Branco','Rua Geraldino Martins de Barros, 1122',3,-19.00812691,-57.64026403,'(67) 3907-5363 / (67) 3232-7111',NULL,'barao@corumba.ms.gov.br','Paulo Cesar Lopes dos Santos','Regular (Matutino, Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.253','2026-01-16 11:51:52.856'),(12,'EM Caic Padre Ernesto Sassida','Rodovia Ramon Gomez, Sn - Km 01',10,-19.00846069,-57.67524162,'(67) 3907-5365 / (67) -',NULL,'caic@cormba.ms.gov.br','Deived de Souza Leite','Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.335','2026-01-12 17:28:22.654'),(13,'EM Clio Proença','Rua João B. A. do Couto, S/n',5,-19.05062915,-57.64817119,'(67) 3907-5366 / (67) 3233-0112','(67) 98191-0092','clio@corumba.ms.gov.br','Rooney dos Santos Souza ','Regular (Matutino, Vespertino e Noturno)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.407','2026-01-14 13:32:45.809'),(14,'EM Cyríaco Félix de Toledo','Rua Major Gama, 206',10,-19.00072770,-57.65793443,'(67) 3907-5359 / (67) 3232-7110',NULL,'cyriaco@corumba.ms.gov.br','Sara Valêncio da Costa','Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.478','2026-01-12 17:30:03.293'),(15,'EM Delcídio do Amaral','Avenida Rio Branco, 282',17,-19.00046395,-57.63335466,'(67) 3907-5361 / (67) 3232-5241','(67) 98191-0226','delcidio@corumba.ms.gov.br','Vanessa Soares dos Santos','Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.550','2026-01-14 13:32:46.836'),(16,'EM Dr. Cássio Leite de Barros','Rua Marechal Floriano, Setor 13 - Quadra 09',15,-19.04683716,-57.65539169,'(67) 3907-5354 / (67) 99256-1881','(67) 98191-0129','tatiane.oliveira@corumba.ms.gov.br','Tatiane Soares de Oliveira','Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.621','2026-01-14 13:32:46.296'),(17,'EM Fernando de Barros e CEMEI Maria Candelária Pereira Leite e Extensão','Rua Fernando de Barros, S/n - Prédio',4,-19.01359941,-57.63771057,'(67) 3907-5355 / (67) 3232-5636',NULL,'fernando@corumba.ms.gov.br','Rondinelli Leite Olarte','Regular (Matutino, Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.693','2026-01-16 11:39:39.971'),(18,'EM Izabel Correa de Oliveira e Extensão','Alameda Augusto do Amaral, 60',16,-19.02580158,-57.65681326,'(67) 3907-5358',NULL,'izabel@corumba.ms.gov.br','Antônio Angel Pereira Ruiz','Regular (Matutino, Vespertino e Noturno)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.764','2026-01-16 11:40:28.151'),(19,'EM José de Souza Damy','Rua Quinze de Novembro, 2172',7,-19.02471630,-57.64615417,'(67) 3907-5364',NULL,'damy@corumba.ms.gov.br','Lelia Rodriane de Arruda Assad','Regular (Matutino, Vespertino e Noturno)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:45.894','2026-01-12 17:48:29.197'),(20,'EM Ludovina Portocarrero','Avenida Tenente Oliveira Mello, 058',9,-19.89743571,-57.78533936,'(67) 3282-1119 / (67) 3282-1034',NULL,'ludovina@corumba.ms.gov.br',NULL,NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:45.965','2026-01-05 17:28:52.801'),(21,'EM Pedro Paulo de Medeiros','Rua Colombo, Nº 1.050',3,-19.00601698,-57.65147567,'(67) 3232-6102 / (67) -','(67) 98191-0146','pedropaulo@corumba.ms.gov.br','Rosemary Botelho Moreira de Souza','Regular (Matutino, Vespertino e Noturno)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:46.036','2026-01-14 13:32:46.462'),(22,'EM Prof. Djalma de Sampaio Brasil','Rua Monte Castelo, 1738',1,-19.01873701,-57.66415715,'(67) 3907-5386',NULL,'djalma@corumba.ms.gov.br','Verônica Chaparro de Lucena',NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765973895387-360736590.png',0,NULL,1,'2025-12-16 17:25:46.108','2026-01-12 17:39:54.156'),(23,'EMEI Luiz Feitosa Rodrigues','Rua General Rondon, 266',3,-18.99574085,-57.64728606,'(67) 3907-5357 / (67) 3231-9973',NULL,'luizfeitosa@corumba.ms.gov.br','Lenir Fernanda Gomes da Silva','Período de funcionamento: Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974126833-22109057.png',0,NULL,1,'2025-12-16 17:25:46.180','2026-01-12 17:44:01.265'),(24,'EMEI Rachid Bardauil','Rua Alan Kardec, 1655 - Monte Castelo',1,-19.01982811,-57.66605538,'(67) 3907-5382 / (67) -','(67) 98191-0088','rachid@corumba.ms.gov.br','Lídio Guilherme Rojas Junior','Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974126833-22109057.png',0,NULL,1,'2025-12-16 17:25:46.251','2026-01-14 13:32:45.761'),(25,'EMEI Tilma Fernandes Veiga','Avenida Brandão Júnior, 280',10,-18.99912665,-57.66307904,'(67) 3907-5356 / (67) 99909-0468','(67) 98191-0071','tilma@corumba.ms.gov.br','Elizangela Rondon Correia dos Santos','Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974126833-22109057.png',0,NULL,1,'2025-12-16 17:25:46.423','2026-01-14 13:32:45.698'),(26,'Emr Polo Carlos Cárcano','Assentamento Urucum, S/n - Br-262',18,-19.15473230,-57.63299840,'(67) 9962-08997','(67) 98191-0118','carloscarcano@corumba.ms.gov.br','Joeci das Dores Gonçalves Sambrana ','Período de funcionamento: Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1768414664171-991181125.png',0,NULL,1,'2025-12-16 17:25:46.495','2026-01-15 11:40:00.066'),(27,'Emr Polo Paiolzinho e Extensões','Assentamento Paiolzinho, S/n',2,-19.10012579,-57.79061676,'(67) 9917-05126 / (67) 99996-1606','(67) 98191-0136','paiolzinho@corumba.ms.gov.br','Lourival Moraes Fernandes','Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:46.566','2026-01-14 13:32:46.368'),(28,'Emr Polo Porto da Manga e Extensões','Porto da Manga, -',18,-19.25755379,-57.23527193,'(67) 3907-5426 / (67) 3231-1064',NULL,'seed@corumba.ms.gov.br',NULL,NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:46.638','2026-01-05 17:20:53.459'),(29,'Emrei Eutrópia Gomes Pedroso','Assentamento Tamarineiro I, S/n',18,-19.05621717,-57.74141746,'(67) 9927-56667 / (67) 99247-9210','(67) 98191-0183','eutropia@corumba.ms.gov.br','Mariana Vaca Conde','Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:46.709','2026-01-14 13:32:46.744'),(30,'Emrei Monte Azul','Assentamento Taquaral, S/n',18,-19.11452958,-57.71002675,'(67) - / (67) 99220-7596','(67) 98191-0159','monteazul@corumba.ms.gov.br','Gelsimara Cunha dos Santos ','Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:46.781','2026-01-14 13:32:46.603'),(31,'Emrei Polo Luiz de Albuquerque de Melo Pereira e Cáceres e Extensões','Avenida Imaculada Conceição, S/n - Principal',8,-20.16025398,-57.15499878,'(67) 3275-1312 / (67) -','(67) 98191-0151','lampc@corumba.ms.gov.br','Diego Silva do Nascimento',NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:46.852','2026-01-16 11:48:31.035'),(32,'Emrei Polo Paraguai Mirim e Extensões','Ilha Verde, S/n - Paraguai Mirim',18,-17.62919994,-56.96473360,'(67) 3234-3469 / (67) 99636-4311',NULL,'portoesperanca@corumba.ms.gov.br',NULL,NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:46.923','2026-01-05 17:16:01.754'),(33,'Emrei Polo Porto Esperança e Extensões','Rua Principal, S/n',18,-19.55275710,-57.42944241,'(67) 3234-3469 / (67) 99636-4311',NULL,'portoesperanca@corumba.ms.gov.br',NULL,NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:46.995','2026-01-05 17:13:28.233'),(34,'Emrei Polo Santa Aurélia e Extensões','Fazenda Santa Maria, - - Colonia São Domingos',18,-18.59372872,-57.01269150,'(67) 3234-4369 / (67) 99636-4311',NULL,'portoesperanca@corumba.ms.gov.br',NULL,NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:47.066','2026-01-05 17:11:25.108'),(35,'Emrei Polo São Lourenço e Extensões','Barra do São Lourenço, -',18,-17.89849371,-57.55599976,'(67) 3234-3469 / (67) 99636-4311',NULL,'portoesperanca@corumba.ms.gov.br',NULL,NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:47.138','2026-01-05 17:06:03.608'),(36,'Emrei Polo Sebastião Rolon e Extensões','Porto Sairu, - - Colonia do Bracinho',18,-18.72947239,-57.07954288,'(67) 3234-3469 / (67) 99636-4311','(67) 98191-0112','portoesperanca@corumba.ms.gov.br',NULL,NULL,'/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974078949-101679616.png',0,NULL,1,'2025-12-16 17:25:47.209','2026-01-14 13:32:46.012'),(37,'CEMEI Parteira Catarina Anastácio','Rodovia Ramon Gomez, Km 01, S/nº',10,-19.00768541,-57.67495567,'(67) 3907-5365',NULL,NULL,'Deived de Souza Leite',' Matutino, Vespertino e Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-17 13:57:56.811','2026-01-12 17:14:07.273'),(38,'CEMEI Parteira Laida Menacho','Rua 7 de Setembro, S/nº',6,-19.07269157,-57.62071609,'(67) 3907-5360',NULL,NULL,'Márcia Ivana do Amaral','Integral e Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-17 16:34:00.885','2026-01-12 17:15:25.884'),(39,'CEMEI Parteira Valódia Serra','Avenida Brandão Junior, 280',10,-18.99933199,-57.66281068,'(67) 3907-5356','(67) 98191-0157',NULL,'Elizangela Rondon Correia dos Santos','Integral','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-17 17:03:47.593','2026-01-14 13:32:46.555'),(40,'CEMEI Serv Carmo','Rua Monte Castelo, 1.738',1,-19.01873281,-57.66456485,'(67) 3907-5386',NULL,NULL,'Verônica Chaparro de Lucena','Regular (Matutino e Vespertino)','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1765974099327-842887464.png',0,NULL,1,'2025-12-17 17:26:12.265','2026-01-12 17:22:04.491'),(41,'Secretaria Municipal de Educação','Rua América, nº 899',3,-19.00459683,-57.65032768,NULL,'67981910064','seed@corumba.ms.gov.br',NULL,'Segunda a Sexta-feira,\ndas 07h às 11h e 13h às 17h.\nFechado: aos Sábados, Domingos e Feriados.','/uploads/unidades/Logo-Prefeitura-Padr--o-1767631390464-926830148.png','/uploads/icones/icone-1768485035516-586810309.png',0,NULL,1,'2026-01-15 13:54:46.057','2026-01-15 14:56:48.689');
/*!40000 ALTER TABLE `prod_escola` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prod_escola_redesocial`
--

DROP TABLE IF EXISTS `prod_escola_redesocial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prod_escola_redesocial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_escola` int(11) NOT NULL,
  `nome_rede` varchar(50) NOT NULL,
  `url_perfil` varchar(500) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `prod_escola_redesocial_id_escola_idx` (`id_escola`),
  CONSTRAINT `prod_escola_redesocial_id_escola_fkey` FOREIGN KEY (`id_escola`) REFERENCES `prod_escola` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prod_escola_redesocial`
--

LOCK TABLES `prod_escola_redesocial` WRITE;
/*!40000 ALTER TABLE `prod_escola_redesocial` DISABLE KEYS */;
INSERT INTO `prod_escola_redesocial` VALUES (1,9,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 12:53:25.576','2025-12-17 12:53:25.576'),(2,26,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 13:28:08.079','2025-12-17 13:28:08.079'),(3,23,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 13:36:48.137','2025-12-17 13:36:48.137'),(4,2,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 13:44:45.878','2025-12-17 13:44:45.878'),(5,37,'Facebook','https://www.facebook.com/caic.ernestosassida','2025-12-17 13:57:57.139','2025-12-17 13:57:57.139'),(6,3,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 14:03:10.427','2025-12-17 14:03:10.427'),(7,10,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 14:20:33.840','2025-12-17 14:20:33.840'),(8,25,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 14:28:11.600','2025-12-17 14:28:11.600'),(9,24,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 14:33:43.881','2025-12-17 14:33:43.881'),(10,27,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 14:38:49.613','2025-12-17 14:38:49.613'),(11,38,'Facebook','https://www.facebook.com/almirante.tamandare.5458','2025-12-17 16:34:01.453','2025-12-17 16:34:01.453'),(12,5,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 16:39:35.502','2025-12-17 16:39:35.502'),(13,39,'Facebook','https://www.facebook.com/tilmafernandes','2025-12-17 17:03:48.365','2025-12-17 17:03:48.365'),(14,7,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:09:05.604','2025-12-17 17:09:05.604'),(15,6,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:16:01.753','2025-12-17 17:16:01.753'),(16,8,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:18:11.422','2025-12-17 17:18:11.422'),(17,40,'Facebook','https://www.facebook.com/EM-Djalma-de-Sampaio-Brasil-e-CMEI-Serv-Carmo-578896002596496','2025-12-17 17:26:12.898','2025-12-17 17:26:12.898'),(18,14,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:36:39.689','2025-12-17 17:36:39.689'),(19,15,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:40:10.204','2025-12-17 17:40:10.204'),(20,16,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:42:26.269','2025-12-17 17:42:26.269'),(21,18,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:47:55.076','2025-12-17 17:47:55.076'),(22,19,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:50:12.240','2025-12-17 17:50:12.240'),(23,21,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 17:54:29.376','2025-12-17 17:54:29.376'),(24,22,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2025-12-17 18:02:22.977','2025-12-17 18:02:22.977'),(25,1,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:50:54.450','2026-01-05 16:50:54.450'),(26,1,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2026-01-05 16:50:54.708','2026-01-05 16:50:54.708'),(27,2,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:01.321','2026-01-05 16:56:01.321'),(28,37,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:01.854','2026-01-05 16:56:01.854'),(29,3,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:01.900','2026-01-05 16:56:01.900'),(30,38,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:01.947','2026-01-05 16:56:01.947'),(31,4,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:01.994','2026-01-05 16:56:01.994'),(32,5,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.040','2026-01-05 16:56:02.040'),(33,39,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.099','2026-01-05 16:56:02.099'),(34,7,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.145','2026-01-05 16:56:02.145'),(35,6,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.192','2026-01-05 16:56:02.192'),(36,8,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.288','2026-01-05 16:56:02.288'),(37,40,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.348','2026-01-05 16:56:02.348'),(38,9,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.409','2026-01-05 16:56:02.409'),(39,10,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.469','2026-01-05 16:56:02.469'),(40,11,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.529','2026-01-05 16:56:02.529'),(41,12,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.590','2026-01-05 16:56:02.590'),(42,13,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.664','2026-01-05 16:56:02.664'),(43,14,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.724','2026-01-05 16:56:02.724'),(44,15,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.785','2026-01-05 16:56:02.785'),(45,16,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:02.954','2026-01-05 16:56:02.954'),(46,17,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.015','2026-01-05 16:56:03.015'),(47,18,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.075','2026-01-05 16:56:03.075'),(48,19,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.136','2026-01-05 16:56:03.136'),(49,20,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.172','2026-01-05 16:56:03.172'),(50,21,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.218','2026-01-05 16:56:03.218'),(51,22,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.254','2026-01-05 16:56:03.254'),(52,23,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.325','2026-01-05 16:56:03.325'),(53,24,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.361','2026-01-05 16:56:03.361'),(54,25,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.408','2026-01-05 16:56:03.408'),(55,26,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.455','2026-01-05 16:56:03.455'),(56,27,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.491','2026-01-05 16:56:03.491'),(57,28,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.537','2026-01-05 16:56:03.537'),(58,29,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.573','2026-01-05 16:56:03.573'),(59,30,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.620','2026-01-05 16:56:03.620'),(60,31,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.667','2026-01-05 16:56:03.667'),(61,32,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.714','2026-01-05 16:56:03.714'),(62,33,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.760','2026-01-05 16:56:03.760'),(63,34,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.807','2026-01-05 16:56:03.807'),(64,35,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.854','2026-01-05 16:56:03.854'),(65,36,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-05 16:56:03.901','2026-01-05 16:56:03.901'),(66,41,'Facebook','https://www.facebook.com/profile.php?id=61571637936440','2026-01-15 13:55:52.682','2026-01-15 13:55:52.682'),(67,41,'Instagram','https://www.instagram.com/semedcorumba/','2026-01-15 13:55:53.120','2026-01-15 13:55:53.120');
/*!40000 ALTER TABLE `prod_escola_redesocial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prod_icone`
--

DROP TABLE IF EXISTS `prod_icone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prod_icone` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `url` varchar(500) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `ordem` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prod_icone_nome_key` (`nome`),
  KEY `prod_icone_ativo_idx` (`ativo`),
  KEY `prod_icone_ordem_idx` (`ordem`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prod_icone`
--

LOCK TABLES `prod_icone` WRITE;
/*!40000 ALTER TABLE `prod_icone` DISABLE KEYS */;
INSERT INTO `prod_icone` VALUES (1,'Escola Municipal Regular','/uploads/icones/icone-1765973895387-360736590.png',1,1,'2025-12-17 12:18:19.433','2025-12-17 12:18:19.433'),(2,'Escola Municipal Rural','/uploads/icones/icone-1768414664171-991181125.png',1,2,'2025-12-17 12:21:20.642','2026-01-14 18:17:45.626'),(3,'Centro de Educação Infantil','/uploads/icones/icone-1765974099327-842887464.png',1,3,'2025-12-17 12:21:58.432','2025-12-17 12:21:58.432'),(4,'Escola Municipal de Educação Integral','/uploads/icones/icone-1765974126833-22109057.png',1,4,'2025-12-17 12:23:34.294','2025-12-17 12:23:34.294'),(5,'Unidade Administrativa','/uploads/icones/icone-1768485035516-586810309.png',1,5,'2026-01-15 13:50:39.273','2026-01-15 13:50:39.273');
/*!40000 ALTER TABLE `prod_icone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prod_oferta_ensino`
--

DROP TABLE IF EXISTS `prod_oferta_ensino`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prod_oferta_ensino` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`),
  KEY `prod_oferta_ensino_nome_idx` (`nome`),
  KEY `prod_oferta_ensino_ativo_idx` (`ativo`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prod_oferta_ensino`
--

LOCK TABLES `prod_oferta_ensino` WRITE;
/*!40000 ALTER TABLE `prod_oferta_ensino` DISABLE KEYS */;
INSERT INTO `prod_oferta_ensino` VALUES (1,'Creche',1,'2026-01-12 12:28:58.133','2026-01-12 17:04:19.811'),(2,'Ensino Fundamental I (1º ao 5º ano)',1,'2026-01-12 12:28:58.177','2026-01-12 12:28:58.177'),(3,'Ensino Fundamental II (6º ao 9º ano)',1,'2026-01-12 12:28:58.273','2026-01-12 12:28:58.273'),(4,'Ensino Médio',0,'2026-01-12 12:28:58.394','2026-01-12 17:04:35.887'),(5,'EJA - Educação de Jovens e Adultos',1,'2026-01-12 12:28:58.454','2026-01-12 12:28:58.454'),(6,'Educação Especial',0,'2026-01-12 12:28:58.515','2026-01-12 17:03:50.842'),(7,'Pré-escola',1,'2026-01-12 12:28:58.575','2026-01-12 17:04:53.609');
/*!40000 ALTER TABLE `prod_oferta_ensino` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prod_professor`
--

DROP TABLE IF EXISTS `prod_professor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prod_professor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `matricula` varchar(20) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `prod_professor_ativo_idx` (`ativo`),
  KEY `prod_professor_cpf_idx` (`cpf`),
  KEY `prod_professor_cargo_idx` (`cargo`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prod_professor`
--

LOCK TABLES `prod_professor` WRITE;
/*!40000 ALTER TABLE `prod_professor` DISABLE KEYS */;
INSERT INTO `prod_professor` VALUES (1,'Márcia Ivana do Amaral',NULL,NULL,'Diretora Adjunta',1,'2025-12-17 12:37:48.529','2025-12-17 12:51:03.361'),(2,'Gilmar de Lima Galvão',NULL,NULL,'Diretor-Adjunto',1,'2025-12-17 13:47:23.101','2025-12-17 13:47:23.101'),(3,'Roseli Nery de Andrade Bento',NULL,NULL,'Diretora-Adjunta',1,'2025-12-17 14:19:55.362','2025-12-17 14:19:55.362'),(4,'Sandra Maria Justiniano de Sales',NULL,NULL,'Diretora Adjunta',1,'2025-12-17 17:22:20.690','2025-12-17 17:22:20.690'),(5,'Diego Rodrigues da Silva',NULL,NULL,'Diretor-Adjunto',1,'2025-12-17 17:33:29.333','2025-12-17 17:33:29.333'),(6,'Camila Candido Oliveira Menezes',NULL,NULL,'Diretora-Adjunta',1,'2025-12-17 17:44:55.068','2025-12-17 17:44:55.068'),(7,'Marta Janice da Silva Rodrigues',NULL,NULL,'Diretora-Adjunta',1,'2025-12-17 17:57:36.483','2025-12-17 17:57:36.483'),(9,'Eliane Damasceno da Silva',NULL,NULL,'Diretora-Adjunta',1,'2026-01-13 11:38:40.746','2026-01-13 11:38:40.746'),(10,'Mabel Marinho Sahib Aguilar',NULL,NULL,'Secretária de Educação',1,'2026-01-15 14:54:30.572','2026-01-15 14:54:30.572'),(11,'Gilson Pacola',NULL,NULL,'Secretário-Adjunto de Educação',1,'2026-01-15 14:55:50.590','2026-01-15 14:55:50.590'),(12,'Karla Helena Bastos dos Santos',NULL,NULL,'Diretora-Adjunta',1,'2026-01-16 11:31:14.613','2026-01-16 11:31:14.613'),(13,'Laudicéia Leite Larocca',NULL,NULL,'Diretora-Adjunta',1,'2026-01-16 11:31:35.192','2026-01-16 11:31:35.192'),(14,'Marcia Ramires de Arruda',NULL,NULL,'Diretora-Adjunta',1,'2026-01-16 11:31:55.002','2026-01-16 11:31:55.002'),(15,'Tatiane Cecília de Lima Martins Sales',NULL,NULL,'Diretora-Adjunta',1,'2026-01-16 11:32:52.716','2026-01-16 11:32:52.716'),(16,'Fernanda Chaparro de Lucena',NULL,NULL,'Diretora-Adjunta',1,'2026-01-16 11:33:08.879','2026-01-16 11:33:08.879'),(17,'Marcia Aparecida Barbosa da Silva',NULL,NULL,'Diretora-Adjunta',1,'2026-01-16 11:33:53.812','2026-01-16 11:33:53.812'),(18,'Thammi Camila Arruda Formiga Castro',NULL,NULL,'Diretora-Adjunta',1,'2026-01-16 11:34:17.662','2026-01-16 11:34:17.662');
/*!40000 ALTER TABLE `prod_professor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','superadmin') NOT NULL DEFAULT 'admin',
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `last_login` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_username_key` (`username`),
  UNIQUE KEY `user_email_key` (`email`),
  KEY `user_username_idx` (`username`),
  KEY `user_email_idx` (`email`),
  KEY `user_role_idx` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'admin','admin@corumba.ms.gov.br','$2a$10$3ycKgGPAV.YeUbF0EqI1X.t/iorRsXxNR6MUrQBNdwFCgyq6EEhV2','superadmin',1,'2025-12-16 17:30:24.383','2026-01-15 13:49:32.661','2026-01-15 13:49:32.660');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sis_reme_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-16 10:27:21
