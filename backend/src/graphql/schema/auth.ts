export const authSchema = `#graphql
  type User {
    id: ID!
    email: String!
    role: String!
  }

  type AuthPayload {
    user: User!
  }

  type Query {
    me: User
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!
  }
`;
