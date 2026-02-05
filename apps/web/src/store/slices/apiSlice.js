import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout } from './authSlice'

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)

  // Se receber erro 401 ou mensagem de token inválido, fazer logout
  if (result.error &&
      (result.error.status === 401 ||
       result.error.data?.error?.includes('token') ||
       result.error.data?.error?.includes('Token'))) {
    api.dispatch(logout())
    window.location.href = '/admin/login'
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Unidades', 'Categorias', 'Medicos', 'Especialidades', 'Staging', 'Users', 'Audit', 'ETL', 'Mapeamentos', 'Bairros', 'OfertasEnsino', 'Icones'],
  keepUnusedDataFor: 300, // Cache por 5 minutos (300 segundos)
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Unidades
    getUnidades: builder.query({
      query: (params) => ({
        url: '/unidades',
        params,
      }),
      providesTags: ['Unidades'],
    }),

    // DESATIVADO - modelo removido (migração para turismo)
    // getUnidadeMedicos: builder.query({
    //   query: (id) => `/unidades/${id}/medicos`,
    //   keepUnusedDataFor: 300, // Cache por 5 minutos
    // }),

    getUnidadeRedesSociais: builder.query({
      query: (id) => `/unidades/${id}/redes-sociais`,
      providesTags: ['Unidades'],
    }),

    createUnidadeRedeSocial: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/unidades/${id}/redes-sociais`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Unidades'],
    }),

    updateUnidadeRedeSocial: builder.mutation({
      query: ({ id, redeId, ...data }) => ({
        url: `/unidades/${id}/redes-sociais/${redeId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Unidades'],
    }),

    deleteUnidadeRedeSocial: builder.mutation({
      query: ({ id, redeId }) => ({
        url: `/unidades/${id}/redes-sociais/${redeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Unidades'],
    }),

    getBairros: builder.query({
      query: (params) => ({
        url: '/bairros',
        params,
      }),
      providesTags: ['Bairros'],
    }),

    createBairro: builder.mutation({
      query: (data) => ({
        url: '/bairros',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Bairros'],
    }),

    updateBairro: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/bairros/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Bairros'],
    }),

    deleteBairro: builder.mutation({
      query: (id) => ({
        url: `/bairros/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bairros'],
    }),

    // DESATIVADO - Ofertas de Ensino (migração para turismo)
    // getOfertasEnsino: builder.query({
    //   query: (params) => ({
    //     url: '/ofertas-ensino',
    //     params,
    //   }),
    //   providesTags: ['OfertasEnsino'],
    // }),

    // createOfertaEnsino: builder.mutation({
    //   query: (data) => ({
    //     url: '/ofertas-ensino',
    //     method: 'POST',
    //     body: data,
    //   }),
    //   invalidatesTags: ['OfertasEnsino'],
    // }),

    // updateOfertaEnsino: builder.mutation({
    //   query: ({ id, ...data }) => ({
    //     url: `/ofertas-ensino/${id}`,
    //     method: 'PUT',
    //     body: data,
    //   }),
    //   invalidatesTags: ['OfertasEnsino'],
    // }),

    // deleteOfertaEnsino: builder.mutation({
    //   query: (id) => ({
    //     url: `/ofertas-ensino/${id}`,
    //     method: 'DELETE',
    //   }),
    //   invalidatesTags: ['OfertasEnsino'],
    // }),

    // Categorias Turísticas
    getCategorias: builder.query({
      query: (params) => ({
        url: '/categorias',
        params,
      }),
      providesTags: ['Categorias'],
    }),

    getCategoriasGrouped: builder.query({
      query: () => '/categorias/grouped/list',
      providesTags: ['Categorias'],
    }),

    getCategoriaById: builder.query({
      query: (id) => `/categorias/${id}`,
      providesTags: ['Categorias'],
    }),

    createCategoria: builder.mutation({
      query: (data) => ({
        url: '/categorias',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Categorias', 'Unidades'],
    }),

    updateCategoria: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/categorias/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Categorias', 'Unidades'],
    }),

    deleteCategoria: builder.mutation({
      query: (id) => ({
        url: `/categorias/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categorias', 'Unidades'],
    }),

    getCategoriasStats: builder.query({
      query: () => '/categorias/stats/usage',
      providesTags: ['Categorias'],
    }),

    getLastUpdate: builder.query({
      query: () => '/unidades/stats/last-update',
    }),

    createUnidade: builder.mutation({
      query: (data) => ({
        url: '/unidades',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Unidades'],
    }),

    updateUnidade: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/unidades/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Unidades'],
    }),

    deleteUnidade: builder.mutation({
      query: (id) => ({
        url: `/unidades/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Unidades'],
    }),

    // DESATIVADO - Médicos (migração para turismo)
    // getMedicos: builder.query({
    //   query: (params) => ({
    //     url: '/medicos',
    //     params,
    //   }),
    //   providesTags: ['Medicos'],
    // }),

    // createMedico: builder.mutation({
    //   query: (data) => ({
    //     url: '/medicos',
    //     method: 'POST',
    //     body: data,
    //   }),
    //   invalidatesTags: ['Medicos'],
    // }),

    // updateMedico: builder.mutation({
    //   query: ({ id, ...data }) => ({
    //     url: `/medicos/${id}`,
    //     method: 'PUT',
    //     body: data,
    //   }),
    //   invalidatesTags: ['Medicos'],
    // }),

    // deleteMedico: builder.mutation({
    //   query: (id) => ({
    //     url: `/medicos/${id}`,
    //     method: 'DELETE',
    //   }),
    //   invalidatesTags: ['Medicos'],
    // }),

    // DESATIVADO - Especialidades (migração para turismo)
    // getEspecialidades: builder.query({
    //   query: () => '/especialidades',
    //   providesTags: ['Especialidades'],
    // }),

    // DESATIVADO - Staging (migração para turismo)
    // getStaging: builder.query({
    //   query: (params) => ({
    //     url: '/staging',
    //     params,
    //   }),
    //   providesTags: ['Staging'],
    // }),

    // getStagingById: builder.query({
    //   query: (id) => `/staging/${id}`,
    //   providesTags: ['Staging'],
    // }),

    // enrichStaging: builder.mutation({
    //   query: ({ id, ...data }) => ({
    //     url: `/staging/${id}/enrich`,
    //     method: 'PUT',
    //     body: data,
    //   }),
    //   invalidatesTags: ['Staging'],
    // }),

    // validateStaging: builder.mutation({
    //   query: (id) => ({
    //     url: `/staging/${id}/validate`,
    //     method: 'POST',
    //   }),
    //   invalidatesTags: ['Staging', 'Unidades'],
    // }),

    // Users (Superadmin only)
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['Users'],
    }),

    createUser: builder.mutation({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    // Audit (Superadmin only)
    getAuditLogs: builder.query({
      query: (params) => ({
        url: '/audit',
        params,
      }),
      providesTags: ['Audit'],
    }),

    getAuditStats: builder.query({
      query: (params) => ({
        url: '/audit/stats/summary',
        params,
      }),
      providesTags: ['Audit'],
    }),

    // ETL (Superadmin only)
    getETLExecutions: builder.query({
      query: (params) => ({
        url: '/etl/executions',
        params,
      }),
      providesTags: ['ETL'],
    }),

    getETLStats: builder.query({
      query: () => '/etl/last-execution',
      providesTags: ['ETL'],
    }),

    // DESATIVADO - Normalização de Especialidades (migração para turismo)
    // getEspecialidadesBrutas: builder.query({
    //   query: () => '/especialidades/brutas/list',
    //   providesTags: ['Especialidades'],
    // }),

    // getMapeamentos: builder.query({
    //   query: () => '/especialidades/mapeamentos/list',
    //   providesTags: ['Mapeamentos'],
    // }),

    // getEstatisticasNormalizacao: builder.query({
    //   query: () => '/especialidades/estatisticas/normalizacao',
    //   providesTags: ['Mapeamentos'],
    // }),

    // createMapeamento: builder.mutation({
    //   query: (data) => ({
    //     url: '/especialidades/mapear',
    //     method: 'POST',
    //     body: data,
    //   }),
    //   invalidatesTags: ['Mapeamentos', 'Especialidades'],
    // }),

    // updateMapeamento: builder.mutation({
    //   query: ({ id, body }) => ({
    //     url: `/especialidades/mapear/${id}`,
    //     method: 'PUT',
    //     body,
    //   }),
    //   invalidatesTags: ['Mapeamentos'],
    // }),

    // deleteMapeamento: builder.mutation({
    //   query: (id) => ({
    //     url: `/especialidades/mapear/${id}`,
    //     method: 'DELETE',
    //   }),
    //   invalidatesTags: ['Mapeamentos', 'Especialidades'],
    // }),

    // Analytics - Dashboard queries
    getAnalyticsOverview: builder.query({
      query: ({ start_date, end_date } = {}) => ({
        url: '/analytics/overview',
        params: { start_date, end_date },
      }),
    }),

    getPopularUnits: builder.query({
      query: ({ start_date, end_date, limit } = {}) => ({
        url: '/analytics/popular-units',
        params: { start_date, end_date, limit },
      }),
    }),

    getSearchTerms: builder.query({
      query: ({ limit } = {}) => ({
        url: '/analytics/search-terms',
        params: { limit },
      }),
    }),

    getConversionFunnel: builder.query({
      query: ({ start_date, end_date } = {}) => ({
        url: '/analytics/conversion-funnel',
        params: { start_date, end_date },
      }),
    }),

    getAnalyticsTimeline: builder.query({
      query: ({ start_date, end_date } = {}) => ({
        url: '/analytics/timeline',
        params: { start_date, end_date },
      }),
    }),

    // Upload de imagem
    uploadUnidadeImagem: builder.mutation({
      query: (formData) => ({
        url: '/upload/unidade-imagem',
        method: 'POST',
        body: formData,
      }),
    }),

    deleteUnidadeImagem: builder.mutation({
      query: (filename) => ({
        url: `/upload/unidade-imagem/${filename}`,
        method: 'DELETE',
      }),
    }),

    // Upload de ícone
    uploadIcone: builder.mutation({
      query: (formData) => ({
        url: '/upload/icone',
        method: 'POST',
        body: formData,
      }),
    }),

    // Ícones
    getIcones: builder.query({
      query: (params = {}) => ({
        url: '/icones',
        params,
      }),
      providesTags: ['Icones'],
    }),

    getIconeById: builder.query({
      query: (id) => `/icones/${id}`,
      providesTags: ['Icones'],
    }),

    createIcone: builder.mutation({
      query: (data) => ({
        url: '/icones',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Icones', 'Unidades'],
    }),

    uploadIconeFile: builder.mutation({
      query: (formData) => ({
        url: '/icones/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Icones', 'Unidades'],
    }),

    updateIcone: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/icones/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Icones', 'Unidades'],
    }),

    deleteIcone: builder.mutation({
      query: (id) => ({
        url: `/icones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Icones', 'Unidades'],
    }),

    reordenarIcones: builder.mutation({
      query: (icones) => ({
        url: '/icones/reordenar/batch',
        method: 'PUT',
        body: { icones },
      }),
      invalidatesTags: ['Icones'],
    }),
  }),
})

export const {
  useLoginMutation,
  useGetUnidadesQuery,
  // useGetUnidadeMedicosQuery, // DESATIVADO - migração para turismo
  useGetUnidadeRedesSociaisQuery,
  useCreateUnidadeRedeSocialMutation,
  useUpdateUnidadeRedeSocialMutation,
  useDeleteUnidadeRedeSocialMutation,
  useGetBairrosQuery,
  useCreateBairroMutation,
  useUpdateBairroMutation,
  useDeleteBairroMutation,
  // useGetOfertasEnsinoQuery, // DESATIVADO - migração para turismo
  // useCreateOfertaEnsinoMutation, // DESATIVADO - migração para turismo
  // useUpdateOfertaEnsinoMutation, // DESATIVADO - migração para turismo
  // useDeleteOfertaEnsinoMutation, // DESATIVADO - migração para turismo
  useGetCategoriasQuery,
  useGetCategoriasGroupedQuery,
  useGetCategoriaByIdQuery,
  useCreateCategoriaMutation,
  useUpdateCategoriaMutation,
  useDeleteCategoriaMutation,
  useGetCategoriasStatsQuery,
  useCreateUnidadeMutation,
  useUpdateUnidadeMutation,
  useDeleteUnidadeMutation,
  // useGetMedicosQuery, // DESATIVADO - migração para turismo
  // useCreateMedicoMutation, // DESATIVADO - migração para turismo
  // useUpdateMedicoMutation, // DESATIVADO - migração para turismo
  // useDeleteMedicoMutation, // DESATIVADO - migração para turismo
  // useGetEspecialidadesQuery, // DESATIVADO - migração para turismo
  // useGetStagingQuery, // DESATIVADO - migração para turismo
  // useGetStagingByIdQuery, // DESATIVADO - migração para turismo
  // useEnrichStagingMutation, // DESATIVADO - migração para turismo
  // useValidateStagingMutation, // DESATIVADO - migração para turismo
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetAuditLogsQuery,
  useGetAuditStatsQuery,
  useGetETLExecutionsQuery,
  useGetETLStatsQuery,
  useGetLastUpdateQuery,
  useGetAnalyticsOverviewQuery,
  useGetPopularUnitsQuery,
  useGetSearchTermsQuery,
  useGetConversionFunnelQuery,
  useGetAnalyticsTimelineQuery,
  // useGetEspecialidadesBrutasQuery, // DESATIVADO - migração para turismo
  // useGetMapeamentosQuery, // DESATIVADO - migração para turismo
  // useGetEstatisticasNormalizacaoQuery, // DESATIVADO - migração para turismo
  // useCreateMapeamentoMutation, // DESATIVADO - migração para turismo
  // useUpdateMapeamentoMutation, // DESATIVADO - migração para turismo
  // useDeleteMapeamentoMutation, // DESATIVADO - migração para turismo
  useUploadUnidadeImagemMutation,
  useDeleteUnidadeImagemMutation,
  useUploadIconeMutation,
  useGetIconesQuery,
  useGetIconeByIdQuery,
  useCreateIconeMutation,
  useUploadIconeFileMutation,
  useUpdateIconeMutation,
  useDeleteIconeMutation,
  useReordenarIconesMutation,
} = apiSlice
