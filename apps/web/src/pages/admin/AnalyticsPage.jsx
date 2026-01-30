import { useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Table, Tag, Spin, Alert } from 'antd';
import {
  EyeOutlined,
  PhoneOutlined,
  SearchOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import {
  useGetAnalyticsOverviewQuery,
  useGetPopularUnitsQuery,
  useGetSearchTermsQuery,
  useGetConversionFunnelQuery,
  useGetAnalyticsTimelineQuery,
} from '../../store/slices/apiSlice';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  const startDate = dateRange[0]?.format('YYYY-MM-DD');
  const endDate = dateRange[1]?.format('YYYY-MM-DD');

  const { data: overview, isLoading: loadingOverview, error: errorOverview } = useGetAnalyticsOverviewQuery({
    start_date: startDate,
    end_date: endDate,
  });

  const { data: popularUnits, isLoading: loadingUnits, error: errorUnits } = useGetPopularUnitsQuery({
    start_date: startDate,
    end_date: endDate,
    limit: 20,
  });

  const { data: searchTerms, isLoading: loadingSearches, error: errorSearches } = useGetSearchTermsQuery({
    limit: 50,
  });

  const { data: conversionFunnel, isLoading: loadingFunnel, error: errorFunnel } = useGetConversionFunnelQuery({
    start_date: startDate,
    end_date: endDate,
  });

  const { data: timeline, isLoading: loadingTimeline, error: errorTimeline } = useGetAnalyticsTimelineQuery({
    start_date: startDate,
    end_date: endDate,
  });

  // Processar dados do timeline para o gráfico
  const timelineData = timeline?.data || [];
  const groupedByDate = timelineData.reduce((acc, item) => {
    const dateStr = dayjs(item.date).format('DD/MM');
    if (!acc[dateStr]) {
      acc[dateStr] = { date: dateStr };
    }
    acc[dateStr][item.event_type] = Number(item.count);
    return acc;
  }, {});
  const chartData = Object.values(groupedByDate);

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Analytics - MapaTur</h1>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          format="DD/MM/YYYY"
          style={{ marginBottom: 0 }}
        />
      </Card>

      {/* Overview Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            {errorOverview ? (
              <Alert message="Erro ao carregar dados" type="error" showIcon />
            ) : (
              <Statistic
                title="Sessões Totais"
                value={overview?.data?.total_sessions || 0}
                prefix={<EyeOutlined />}
                loading={loadingOverview}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            {errorOverview ? (
              <Alert message="Erro ao carregar dados" type="error" showIcon />
            ) : (
              <Statistic
                title="Eventos Totais"
                value={overview?.data?.total_events || 0}
                prefix={<SearchOutlined />}
                loading={loadingOverview}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            {errorOverview ? (
              <Alert message="Erro ao carregar dados" type="error" showIcon />
            ) : (
              <Statistic
                title="Duração Média (s)"
                value={overview?.data?.avg_session_duration_seconds || 0}
                suffix="s"
                loading={loadingOverview}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            {errorFunnel ? (
              <Alert message="Erro ao carregar dados" type="error" showIcon />
            ) : (
              <Statistic
                title="Taxa de Conversão"
                value={conversionFunnel?.data?.conversion_rate || 0}
                suffix="%"
                prefix={
                  (conversionFunnel?.data?.conversion_rate || 0) > 5 ? (
                    <RiseOutlined />
                  ) : (
                    <FallOutlined />
                  )
                }
                valueStyle={{
                  color:
                    (conversionFunnel?.data?.conversion_rate || 0) > 5 ? '#3f8600' : '#cf1322',
                }}
                loading={loadingFunnel}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Gráfico de Eventos ao Longo do Tempo */}
      <Card title="Eventos ao Longo do Tempo" style={{ marginBottom: 16 }}>
        {errorTimeline ? (
          <Alert message="Erro ao carregar dados do timeline" type="error" showIcon />
        ) : loadingTimeline ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin />
          </div>
        ) : chartData.length === 0 ? (
          <Alert message="Nenhum dado disponível para o período selecionado" type="info" showIcon />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="UNIT_VIEW" stroke="#8884d8" name="Visualizações" />
              <Line type="monotone" dataKey="SEARCH" stroke="#82ca9d" name="Buscas" />
              <Line type="monotone" dataKey="CONTACT_CLICK" stroke="#ffc658" name="Contatos" />
              <Line type="monotone" dataKey="FILTER_APPLIED" stroke="#ff7c7c" name="Filtros" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Tabela de Unidades Mais Populares */}
      <Card title="Unidades Turísticas Mais Populares" style={{ marginBottom: 16 }}>
        {errorUnits ? (
          <Alert message="Erro ao carregar unidades populares" type="error" showIcon />
        ) : (
          <Table
            dataSource={popularUnits?.data || []}
            loading={loadingUnits}
            rowKey="unit_id"
            columns={[
              {
                title: 'Ranking',
                key: 'ranking',
                width: 100,
                render: (_, __, index) => (
                  <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                    {index + 1}
                    {index === 0 && (
                      <TrophyOutlined style={{ color: 'gold', marginLeft: 8 }} />
                    )}
                  </span>
                ),
              },
              {
                title: 'Nome',
                dataIndex: 'unit_name',
                key: 'unit_name',
              },
              {
                title: 'Bairro',
                dataIndex: 'bairro',
                key: 'bairro',
                render: (bairro) => bairro || '-',
              },
              {
                title: 'Visualizações',
                dataIndex: 'views',
                key: 'views',
                sorter: (a, b) => a.views - b.views,
              },
              {
                title: 'Contatos',
                dataIndex: 'contacts',
                key: 'contacts',
                sorter: (a, b) => a.contacts - b.contacts,
              },
              {
                title: 'Taxa de Conversão',
                dataIndex: 'conversion_rate',
                key: 'conversion_rate',
                render: (rate) => (
                  <Tag color={rate > 5 ? 'green' : rate > 2 ? 'orange' : 'red'}>
                    {rate}%
                  </Tag>
                ),
                sorter: (a, b) => a.conversion_rate - b.conversion_rate,
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Termos de Busca Populares */}
      <Card title="Termos de Busca Mais Populares" style={{ marginBottom: 16 }}>
        {errorSearches ? (
          <Alert message="Erro ao carregar termos de busca" type="error" showIcon />
        ) : (
          <Table
            dataSource={searchTerms?.data || []}
            loading={loadingSearches}
            rowKey="id"
            columns={[
              {
                title: 'Termo',
                dataIndex: 'search_term',
                key: 'search_term',
              },
              {
                title: 'Tipo',
                dataIndex: 'search_type',
                key: 'search_type',
                render: (type) => <Tag>{type}</Tag>,
              },
              {
                title: 'Contagem',
                dataIndex: 'count',
                key: 'count',
                sorter: (a, b) => a.count - b.count,
                defaultSortOrder: 'descend',
              },
              {
                title: 'Última Busca',
                dataIndex: 'last_searched',
                key: 'last_searched',
                render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Funil de Conversão */}
      <Card title="Funil de Conversão" style={{ marginBottom: 16 }}>
        {errorFunnel ? (
          <Alert message="Erro ao carregar funil de conversão" type="error" showIcon />
        ) : (
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Visualizações"
                value={conversionFunnel?.data?.total_views || 0}
                prefix={<EyeOutlined />}
                loading={loadingFunnel}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Contatos"
                value={conversionFunnel?.data?.total_contacts || 0}
                prefix={<PhoneOutlined />}
                loading={loadingFunnel}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Taxa de Conversão"
                value={conversionFunnel?.data?.conversion_rate || 0}
                suffix="%"
                valueStyle={{
                  color:
                    (conversionFunnel?.data?.conversion_rate || 0) > 5 ? '#3f8600' : '#cf1322',
                }}
                loading={loadingFunnel}
              />
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
}
