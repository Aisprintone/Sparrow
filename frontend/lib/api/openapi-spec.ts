/**
 * OpenAPI Specification for FinanceAI Frontend Integration
 * This serves as the single source of truth for API contracts
 */

export const FINANCEAI_OPENAPI_SPEC = {
  openapi: '3.0.0',
  info: {
    title: 'FinanceAI Frontend API',
    version: '1.0.0',
    description: 'Frontend-specific API contracts with enhanced profile support',
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787/v1',
      description: 'API Server',
    },
  ],
  paths: {
    '/auth/profile-login': {
      post: {
        summary: 'Login with user profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['profileId'],
                properties: {
                  profileId: {
                    type: 'string',
                    enum: ['millennial', 'professional', 'genz'],
                    description: 'User profile identifier',
                  },
                  password: {
                    type: 'string',
                    description: 'Optional password for demo mode',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/users/profile': {
      get: {
        summary: 'Get current user profile with financial data',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Profile retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserProfile',
                },
              },
            },
          },
        },
      },
    },
    '/accounts/summary': {
      get: {
        summary: 'Get account summary with aggregated data',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Account summary retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AccountSummary',
                },
              },
            },
          },
        },
      },
    },
    '/spending/analysis': {
      get: {
        summary: 'Get spending analysis for current period',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'yearly'],
              default: 'monthly',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Spending analysis retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SpendingAnalysis',
                },
              },
            },
          },
        },
      },
    },
    '/goals': {
      get: {
        summary: 'Get user financial goals',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Goals retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    goals: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Goal',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new financial goal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GoalInput',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Goal created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Goal',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      AuthResponse: {
        type: 'object',
        required: ['user', 'tokens'],
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          tokens: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'number' },
            },
          },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'profileType'],
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          profileType: {
            type: 'string',
            enum: ['millennial', 'professional', 'genz'],
          },
          preferences: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              notifications: { type: 'boolean' },
              currency: { type: 'string' },
            },
          },
        },
      },
      UserProfile: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            properties: {
              financialSummary: {
                type: 'object',
                properties: {
                  netWorth: { type: 'number' },
                  monthlyIncome: { type: 'number' },
                  monthlyExpenses: { type: 'number' },
                  savingsRate: { type: 'number' },
                  creditScore: { type: 'number' },
                },
              },
            },
          },
        ],
      },
      AccountSummary: {
        type: 'object',
        properties: {
          totalAssets: { type: 'number' },
          totalLiabilities: { type: 'number' },
          netWorth: { type: 'number' },
          accounts: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Account',
            },
          },
        },
      },
      Account: {
        type: 'object',
        required: ['id', 'name', 'type', 'balance'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['checking', 'savings', 'credit', 'investment', 'loan', 'mortgage'],
          },
          institution: { type: 'string' },
          balance: { type: 'number' },
          currency: { type: 'string', default: 'USD' },
          lastSynced: { type: 'string', format: 'date-time' },
        },
      },
      SpendingAnalysis: {
        type: 'object',
        properties: {
          period: { type: 'string' },
          totalSpent: { type: 'number' },
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'number' },
                percentage: { type: 'number' },
                trend: {
                  type: 'string',
                  enum: ['up', 'down', 'stable'],
                },
              },
            },
          },
          insights: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
      Goal: {
        type: 'object',
        required: ['id', 'title', 'target', 'current'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          type: {
            type: 'string',
            enum: ['safety', 'home', 'experience', 'retirement', 'debt'],
          },
          target: { type: 'number' },
          current: { type: 'number' },
          deadline: { type: 'string', format: 'date' },
          monthlyContribution: { type: 'number' },
          milestones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                target: { type: 'number' },
                completed: { type: 'boolean' },
              },
            },
          },
        },
      },
      GoalInput: {
        type: 'object',
        required: ['title', 'target', 'type'],
        properties: {
          title: { type: 'string' },
          type: {
            type: 'string',
            enum: ['safety', 'home', 'experience', 'retirement', 'debt'],
          },
          target: { type: 'number' },
          deadline: { type: 'string', format: 'date' },
          monthlyContribution: { type: 'number' },
        },
      },
      ApiError: {
        type: 'object',
        required: ['error', 'message', 'timestamp', 'requestId'],
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' },
        },
      },
    },
  },
} as const;