#!/usr/bin/env node

/**
 * Serveur MCP personnalisé pour Supabase
 * Utilise l'API REST Supabase au lieu de la connexion PostgreSQL directe
 */

import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Configuration Supabase depuis les variables d'environnement
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SUPABASE_SERVICE_KEY:', SUPABASE_KEY ? '✅' : '❌');
  process.exit(1);
}

// Création du client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Création du serveur MCP
const server = new Server(
  {
    name: 'supabase-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Liste des ressources (tables)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    const tables = [
      'user_profiles',
      'gamification_data',
      'houses',
      'students_data',
      'challenges',
      'quests',
      'badges'
    ];

    return {
      resources: tables.map(table => ({
        uri: `supabase://table/${table}`,
        name: `Table: ${table}`,
        mimeType: 'application/json',
        description: `Données de la table ${table}`,
      })),
    };
  } catch (error) {
    console.error('Erreur lors de la liste des ressources:', error);
    return { resources: [] };
  }
});

// Lecture d'une ressource (données de table)
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const tableName = uri.replace('supabase://table/', '');

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(100);

    if (error) throw error;

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Erreur: ${error.message}`,
        },
      ],
    };
  }
});

// Liste des outils disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_tables',
        description: 'Liste toutes les tables de la base de données',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'query_table',
        description: 'Interroge une table spécifique',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Nom de la table à interroger',
            },
            select: {
              type: 'string',
              description: 'Colonnes à sélectionner (ex: "*" ou "id,name")',
              default: '*',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum de lignes à retourner',
              default: 100,
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'count_rows',
        description: 'Compte le nombre de lignes dans une table',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Nom de la table',
            },
          },
          required: ['table'],
        },
      },
    ],
  };
});

// Exécution des outils
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_tables': {
        const tables = [
          'user_profiles',
          'gamification_data',
          'houses',
          'students_data',
          'challenges',
          'quests',
          'badges'
        ];
        return {
          content: [
            {
              type: 'text',
              text: `Tables disponibles:\n${tables.map(t => `  - ${t}`).join('\n')}`,
            },
          ],
        };
      }

      case 'query_table': {
        const { table, select = '*', limit = 100 } = args;
        const { data, error, count } = await supabase
          .from(table)
          .select(select, { count: 'exact' })
          .limit(limit);

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Résultats de ${table} (${count} lignes totales, ${data.length} affichées):\n\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'count_rows': {
        const { table } = args;
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Table ${table}: ${count} lignes`,
            },
          ],
        };
      }

      default:
        throw new Error(`Outil inconnu: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Erreur: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Démarrage du serveur
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Serveur MCP Supabase démarré');
}

main().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
